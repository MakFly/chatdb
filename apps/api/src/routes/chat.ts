import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import {
  streamText,
  stepCountIs,
  generateText,
  generateObject,
  type ToolSet,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOllama } from "ollama-ai-provider";
import { createMistral } from "@ai-sdk/mistral";
import { db } from "../db";
import {
  aiModels,
  aiProviders,
  auditLogs,
  conversations,
  messages,
} from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { decrypt } from "../lib/crypto";
import { getConnectionClient, getDialect } from "./connections";
import { classifyIntent } from "../agents/router";
import { runSchemaAgent } from "../agents/schema-analyst";
import { runQueryAgent } from "../agents/query-builder";
import { runMutationAgent, checkMutationAccess } from "../agents/mutation-handler";
import type { Intent, AgentParams } from "../agents/types";
import { PromptService } from "../services/prompt-service";

type AuthEnv = {
  Variables: {
    user: { id: string; name: string; email: string };
  };
};

export const chatRoutes = new Hono<AuthEnv>();

chatRoutes.use("/*", requireAuth);

const messageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().optional(),
  parts: z
    .array(
      z.object({
        type: z.string(),
        text: z.string().optional(),
      }).passthrough()
    )
    .optional(),
});

const chatBodySchema = z.object({
  id: z.string().optional(),
  messages: z.array(messageSchema),
  modelId: z.string().uuid().optional().or(z.literal("")),
  conversationId: z.string().uuid().optional().or(z.literal("")),
  connectionId: z.string().uuid().optional().or(z.literal("")),
  trigger: z.string().optional(),
  writeMode: z
    .object({
      update: z.boolean().optional(),
      delete: z.boolean().optional(),
    })
    .optional(),
});

function extractContent(msg: z.infer<typeof messageSchema>): string {
  if (msg.content) return msg.content;
  if (msg.parts) {
    return msg.parts
      .filter((p) => p.type === "text" && p.text)
      .map((p) => p.text!)
      .join("");
  }
  return "";
}

function toSimpleMessages(msgs: z.infer<typeof messageSchema>[]) {
  return msgs.map((m) => ({
    role: m.role,
    content: extractContent(m),
  }));
}

export function createProviderClient(
  slug: string,
  baseUrl: string | null,
  apiKey: string | null
) {
  switch (slug) {
    case "openai":
      return createOpenAI({
        apiKey: apiKey ?? undefined,
        baseURL: baseUrl ?? undefined,
      });
    case "anthropic":
      return createAnthropic({
        apiKey: apiKey ?? undefined,
        baseURL: baseUrl ?? undefined,
      });
    case "ollama":
      return createOllama({
        baseURL: baseUrl ?? "http://localhost:11434/api",
      });
    case "mistral":
      return createMistral({ apiKey: apiKey ?? undefined, baseURL: baseUrl ?? undefined });
    default:
      throw new Error(`Unknown provider: ${slug}`);
  }
}

async function generateConversationSummary(
  conversationId: string,
  providerClient: ReturnType<typeof createOpenAI | typeof createAnthropic | typeof createOllama | typeof createMistral>,
  modelId: string
) {
  const convMessages = await db
    .select({ role: messages.role, content: messages.content })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);

  if (convMessages.length < 4) return;

  // Only regenerate every 5 messages
  if (convMessages.length % 5 !== 0) return;

  const [conv] = await db
    .select({ summary: conversations.summary })
    .from(conversations)
    .where(eq(conversations.id, conversationId));

  const transcript = convMessages
    .slice(-10)
    .map((m) => `${m.role}: ${m.content.slice(0, 200)}`)
    .join("\n");

  const summaryPrompt = await PromptService.get("conversation-summary");

  const previousSummaryContext = conv?.summary
    ? `Previous summary: ${conv.summary}\n\nUpdate this summary with the new messages.\n\n`
    : "";

  const { text: summary } = await generateText({
    model: providerClient(modelId) as any,
    system: summaryPrompt,
    prompt: `${previousSummaryContext}${transcript}`,
    maxOutputTokens: 150,
  });

  if (summary) {
    await db
      .update(conversations)
      .set({ summary: summary.trim() })
      .where(eq(conversations.id, conversationId));
  }
}

/** Build tools based on connectionId and writeMode */
function buildTools(
  connId: string,
  userId: string,
  writeMode: { update?: boolean; delete?: boolean }
): ToolSet {
  const tools: ToolSet = {};

  tools.getSchema = {
    description:
      "Get the database schema. Returns { tableCount, tables (list of names), columnCount, columns (detailed rows) }.",
    inputSchema: z.object({
      tableNameFilter: z
        .string()
        .optional()
        .describe("SQL LIKE pattern to filter TABLE names only (e.g. 'users', 'order%'). Do NOT pass database names here. Use '%' or omit to get all tables."),
    }),
    execute: async ({ tableNameFilter }: { tableNameFilter?: string }) => {
      const dialect = await getDialect(connId, userId);
      try {
        const columns = await dialect.getColumns(tableNameFilter);
        const tableNames = [...new Set(columns.map((r) => r.table_name))];
        const schemas = [...new Set(columns.map((r) => r.table_schema).filter(Boolean))];
        return {
          database: dialect.getDatabaseName(),
          dialect: dialect.dialectName(),
          schema: schemas.length > 0 ? schemas.join(", ") : "public",
          tableCount: tableNames.length,
          tables: tableNames,
          columnCount: columns.length,
          columns,
        };
      } finally {
        await dialect.disconnect();
      }
    },
  };

  tools.executeSQL = {
    description:
      "Execute a read-only SQL query (SELECT only) on the connected database. Max 500 rows.",
    inputSchema: z.object({
      query: z.string().describe("The SELECT SQL query to execute"),
    }),
    execute: async ({ query }: { query: string }) => {
      const trimmed = query.trim().replace(/;$/, "");
      if (!/^SELECT\s/i.test(trimmed)) {
        return { error: "Only SELECT queries are allowed" };
      }

      const dialect = await getDialect(connId, userId);
      try {
        return await dialect.execute(trimmed, 500);
      } finally {
        await dialect.disconnect();
      }
    },
  };

  tools.explainSQL = {
    description:
      "Run EXPLAIN ANALYZE on a SQL query and return the execution plan. Use this when the user asks about query performance, slow queries, or wants to understand how a query is executed.",
    inputSchema: z.object({
      query: z.string().describe("The SQL SELECT query to explain"),
    }),
    execute: async ({ query }: { query: string }) => {
      const trimmed = query.trim().toUpperCase();
      if (!trimmed.startsWith("SELECT") && !trimmed.startsWith("WITH")) {
        return { error: "EXPLAIN is only allowed on SELECT/WITH queries" };
      }
      const dialect = await getDialect(connId, userId);
      try {
        const plan = await dialect.explainQuery(query);
        return { plan };
      } finally {
        await dialect.disconnect();
      }
    },
  };

  if (writeMode.update || writeMode.delete) {
    tools.executeMutationSQL = {
      description:
        "Execute an UPDATE or DELETE query. Requires user confirmation. Returns a preview of affected rows. Only use when the user has explicitly requested to modify or delete data.",
      inputSchema: z.object({
        query: z.string().describe("The UPDATE or DELETE SQL query"),
        mutationType: z
          .enum(["UPDATE", "DELETE"])
          .describe("Type of mutation"),
      }),
      execute: async ({
        query,
        mutationType,
      }: {
        query: string;
        mutationType: "UPDATE" | "DELETE";
      }) => {
        const trimmed = query.trim().replace(/;$/, "");
        const isUpdate = /^UPDATE\s/i.test(trimmed);
        const isDelete = /^DELETE\s/i.test(trimmed);
        if (!isUpdate && !isDelete) {
          return {
            error: "Only UPDATE and DELETE queries are allowed",
            requiresConfirmation: false,
          };
        }
        if (mutationType === "UPDATE" && !isUpdate) {
          return {
            error: "Query must be an UPDATE statement",
            requiresConfirmation: false,
          };
        }
        if (mutationType === "DELETE" && !isDelete) {
          return {
            error: "Query must be a DELETE statement",
            requiresConfirmation: false,
          };
        }

        const dialect = await getDialect(connId, userId);
        try {
          if (dialect.supportsReturning()) {
            // PostgreSQL: preview via BEGIN/ROLLBACK with RETURNING
            const pgDialect = dialect as import("../lib/dialects/postgresql").PostgreSQLDialect;
            // Cast to access raw client for transaction support
            const { client } = await getConnectionClient(connId, userId);
            try {
              const withReturning = trimmed.match(/RETURNING\s/i)
                ? trimmed
                : `${trimmed} RETURNING *`;
              await client.unsafe("BEGIN");
              let preview: unknown[] = [];
              try {
                const result = await client.unsafe(withReturning);
                preview = Array.isArray(result) ? result : [result];
              } finally {
                await client.unsafe("ROLLBACK");
              }
              return {
                requiresConfirmation: true,
                query: trimmed,
                mutationType,
                preview: preview.slice(0, 50),
                previewCount: preview.length,
              };
            } finally {
              await client.end();
            }
          } else {
            // MySQL/SQLite: no RETURNING, just return query for confirmation
            return {
              requiresConfirmation: true,
              query: trimmed,
              mutationType,
              preview: [],
              previewCount: 0,
            };
          }
        } finally {
          await dialect.disconnect().catch(() => {});
        }
      },
    };
  }

  return tools;
}

/** Auto-inject schema text into system prompt */
export async function injectSchemaContext(connId: string, userId: string): Promise<string> {
  try {
    const dialect = await getDialect(connId, userId);
    try {
      const [columns, fks] = await Promise.all([
        dialect.getColumns(),
        dialect.getForeignKeys(),
      ]);

      const fkMap = new Map<string, string>();
      for (const fk of fks) {
        fkMap.set(`${fk.table_name}.${fk.column_name}`, `${fk.foreign_table}.${fk.foreign_column}`);
      }

      const byTable = columns.reduce(
        (acc: Record<string, { name: string; type: string; nullable: string }[]>, r) => {
          const t = r.table_name;
          if (!acc[t]) acc[t] = [];
          acc[t].push({ name: r.column_name, type: r.data_type, nullable: r.is_nullable });
          return acc;
        },
        {}
      );

      const dialectLabel = dialect.dialectName();
      const schemaText = Object.entries(byTable)
        .map(
          ([table, cols]) =>
            `${table}(${cols.map((c) => {
              const fkRef = fkMap.get(`${table}.${c.name}`);
              return `${c.name}:${c.type}${fkRef ? `→${fkRef}` : ""}`;
            }).join(", ")})`
        )
        .join("\n");
      return schemaText
        ? `\n\nDialect: ${dialectLabel}\nSchéma actuel de la base (contexte) :\n${schemaText}`
        : "";
    } finally {
      await dialect.disconnect();
    }
  } catch {
    return "";
  }
}

chatRoutes.post(
  "/chat",
  zValidator("json", chatBodySchema),
  async (c) => {
    const user = c.get("user");
    const body = c.req.valid("json");

    // Lookup user-selected model + provider
    const modelQuery = db
      .select({
        modelId: aiModels.modelId,
        providerSlug: aiProviders.slug,
        providerBaseUrl: aiProviders.baseUrl,
        providerApiKeyEncrypted: aiProviders.apiKeyEncrypted,
      })
      .from(aiModels)
      .innerJoin(aiProviders, eq(aiModels.providerId, aiProviders.id));

    const selectedModelId = body.modelId || undefined;
    const [userModel] = selectedModelId
      ? await modelQuery.where(eq(aiModels.id, selectedModelId))
      : await modelQuery.limit(1);

    if (!userModel) {
      return c.json({ error: "Model not found. Configure a model in settings." }, 404);
    }

    const userApiKey = userModel.providerApiKeyEncrypted
      ? decrypt(userModel.providerApiKeyEncrypted)
      : null;

    // Validate API key is present for providers that require one
    if (!userApiKey && userModel.providerSlug !== "ollama") {
      return c.json(
        {
          error: `API key missing for provider "${userModel.providerSlug}". Please configure it in Settings > Providers.`,
          code: "API_KEY_MISSING",
        },
        422
      );
    }

    const userProviderClient = createProviderClient(
      userModel.providerSlug,
      userModel.providerBaseUrl,
      userApiKey
    );

    // Extract user text
    const lastUserMsg = [...body.messages]
      .reverse()
      .find((m) => m.role === "user");
    const userText = lastUserMsg ? extractContent(lastUserMsg) : "";

    // Auto-create conversation if not provided
    let conversationId = body.conversationId || undefined;
    let isNewConversation = false;

    if (!conversationId) {
      const title =
        userText.length > 60 ? userText.slice(0, 57) + "..." : userText || "New conversation";
      const [conv] = await db
        .insert(conversations)
        .values({ userId: user.id, title })
        .returning();
      conversationId = conv.id;
      isNewConversation = true;
    }

    // Save user message
    if (lastUserMsg) {
      await db.insert(messages).values({
        conversationId,
        role: "user",
        content: userText,
      });
    }

    const hasConnection = !!body.connectionId;
    const writeMode = body.writeMode ?? { update: false, delete: false };

    // Classify intent (uses fast LLM call if connection exists)
    let intent = await classifyIntent(
      userText,
      hasConnection,
      userProviderClient,
      userModel.modelId
    );

    // Allow explicit trigger override from client
    if (body.trigger === "schema" && hasConnection) intent = "schema";
    if (body.trigger === "explain" && hasConnection) intent = "query";
    if (body.trigger === "analyze" && hasConnection) intent = "query";

    // Build tools if connection exists
    const tools: ToolSet = hasConnection
      ? buildTools(body.connectionId!, user.id, writeMode)
      : {};

    // onFinish callback for persistence
    const onFinish = async ({ text, steps }: { text: string; steps?: any[] }) => {
      const toolParts = steps?.flatMap((step: any) =>
        (step.toolCalls ?? []).map((tc: any) => ({
          toolName: tc.toolName,
          input: tc.input,
          output: step.toolResults?.find(
            (tr: any) => tr.toolCallId === tc.toolCallId
          )?.output ?? null,
        }))
      ) ?? [];

      // Score the last executeSQL query if present
      let qualityScore: { score: number; issues: string[] } | undefined;
      const sqlToolCalls = toolParts.filter((tp) => tp.toolName === "executeSQL");
      if (sqlToolCalls.length > 0) {
        try {
          const lastQuery = sqlToolCalls[sqlToolCalls.length - 1].input?.query as string | undefined;
          if (lastQuery) {
            const { object } = await generateObject({
              model: userProviderClient(userModel.modelId) as any,
              schema: z.object({
                score: z.number().min(1).max(10).describe("Query quality score 1-10"),
                issues: z.array(z.string()).describe("List of quality issues found"),
              }),
              prompt: `Rate this SQL query quality (1-10) and list any issues:\n\nQuery: ${lastQuery}\n\nCheck for: SELECT * usage, missing LIMIT on potentially large result sets, unnecessary subqueries, missing WHERE clauses, potential N+1 patterns. Return a score from 1 (poor) to 10 (excellent) and a list of specific issues found (empty array if none).`,
            });
            qualityScore = object;
          }
        } catch {
          // Ignore scoring errors silently
        }
      }

      if (text || toolParts.length > 0) {
        const metadata: Record<string, unknown> = {};
        if (toolParts.length > 0) metadata.toolParts = toolParts;
        if (qualityScore !== undefined) metadata.qualityScore = qualityScore;

        await db.insert(messages).values({
          conversationId,
          role: "assistant",
          content: text || "",
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        });
        await db
          .update(conversations)
          .set({ updatedAt: new Date() })
          .where(eq(conversations.id, conversationId));

        generateConversationSummary(
          conversationId!,
          userProviderClient,
          userModel.modelId
        ).catch(() => {});
      }
    };

    // Inject schema context for DB-connected intents (skip for schema intent so agent must call getSchema tool)
    let schemaContext = "";
    if (hasConnection && intent !== "schema") {
      schemaContext = await injectSchemaContext(body.connectionId!, user.id);
    }

    const simpleMessages = toSimpleMessages(body.messages);

    // Load general system prompt
    const generalSystemPrompt = await PromptService.get("general-system");

    // Build agent params
    const agentParams: AgentParams = {
      model: userModel,
      providerClient: userProviderClient,
      messages: simpleMessages,
      tools,
      systemPrompt: generalSystemPrompt + schemaContext,
      userId: user.id,
      conversationId: conversationId!,
      connectionId: body.connectionId || undefined,
      writeMode,
      abortSignal: c.req.raw.signal,
      onFinish,
    };

    // Dispatch to specialized agent or fallback to general
    let result;

    switch (intent) {
      case "schema":
        result = await runSchemaAgent(agentParams);
        break;

      case "query":
        result = await runQueryAgent(agentParams);
        break;

      case "mutation": {
        // RBAC check
        const access = await checkMutationAccess(user.id);
        if (!access.allowed) {
          return c.json({ error: access.reason }, 403);
        }
        if (!writeMode.update && !writeMode.delete) {
          // Mutation intent but no writeMode enabled — fall through to general with a hint
          result = streamText({
            model: userProviderClient(userModel.modelId) as any,
            system: generalSystemPrompt + schemaContext,
            messages: simpleMessages as any,
            tools: Object.keys(tools).length > 0 ? tools : undefined,
            stopWhen: Object.keys(tools).length > 0 ? stepCountIs(5) : undefined,
            abortSignal: c.req.raw.signal,
            onFinish,
          });
          break;
        }
        result = await runMutationAgent(agentParams);
        break;
      }

      default: {
        // General: use user's selected model (not class-based)
        const generalPrompt = generalSystemPrompt + schemaContext;
        const hasToolsForGeneral = Object.keys(tools).length > 0;

        // For general with writeMode, adjust the prompt
        let finalPrompt = generalPrompt;
        if (writeMode.update || writeMode.delete) {
          const allowedOps = [
            writeMode.update && "UPDATE",
            writeMode.delete && "DELETE",
          ].filter(Boolean).join(" et ");
          finalPrompt = finalPrompt.replace(
            "Génère uniquement des requêtes SELECT (lecture seule).",
            `Tu peux exécuter des requêtes SELECT (lecture) ainsi que des requêtes ${allowedOps} via l'outil executeMutationSQL quand l'utilisateur le demande explicitement.\n- Utilise TOUJOURS l'outil executeMutationSQL pour les mutations, JAMAIS executeSQL.\n- NE DEMANDE JAMAIS de confirmation en texte. Appelle directement executeMutationSQL — l'interface affichera automatiquement un bouton de confirmation à l'utilisateur.\n- Après avoir appelé executeMutationSQL, résume simplement ce que la requête va faire. Ne pose PAS de question de confirmation — le bouton est affiché automatiquement par l'interface.`
          );
        }

        result = streamText({
          model: userProviderClient(userModel.modelId) as any,
          system: finalPrompt,
          messages: simpleMessages as any,
          tools: hasToolsForGeneral ? tools : undefined,
          stopWhen: hasToolsForGeneral ? stepCountIs(5) : undefined,
          abortSignal: c.req.raw.signal,
          onFinish,
        });
        break;
      }
    }

    const response = result.toUIMessageStreamResponse();

    response.headers.forEach((value, key) => {
      c.header(key, value);
    });

    if (isNewConversation) {
      c.header("X-Conversation-Id", conversationId);
    }

    c.status(200);
    return c.body(response.body as ReadableStream);
  }
);

const executeMutationSchema = z.object({
  connectionId: z.string().uuid(),
  query: z.string().min(1),
});

chatRoutes.post(
  "/chat/execute-mutation",
  zValidator("json", executeMutationSchema),
  async (c) => {
    const user = c.get("user");
    const { connectionId, query } = c.req.valid("json");

    const trimmed = query.trim().replace(/;$/, "");
    if (!/^UPDATE\s/i.test(trimmed) && !/^DELETE\s/i.test(trimmed)) {
      return c.json({ error: "Only UPDATE and DELETE are allowed" }, 400);
    }

    const start = Date.now();
    const { client } = await getConnectionClient(connectionId, user.id);

    const withReturning = trimmed.match(/RETURNING\s/i)
      ? trimmed
      : `${trimmed} RETURNING *`;

    try {
      const result = await client.unsafe(withReturning);
      const rows = Array.isArray(result) ? result : result ? [result] : [];
      const durationMs = Date.now() - start;

      await db.insert(auditLogs).values({
        userId: user.id,
        action: "sql_mutation",
        resource: "database",
        sqlExecuted: trimmed,
        durationMs,
        metadata: { rowCount: rows.length },
      });

      return c.json({
        success: true,
        rowCount: rows.length,
        rows,
        durationMs,
      });
    } catch (err: unknown) {
      const durationMs = Date.now() - start;
      await db.insert(auditLogs).values({
        userId: user.id,
        action: "sql_mutation_error",
        resource: "database",
        sqlExecuted: trimmed,
        durationMs,
        metadata: { error: String(err) },
      });
      throw err;
    } finally {
      await client.end();
    }
  }
);
