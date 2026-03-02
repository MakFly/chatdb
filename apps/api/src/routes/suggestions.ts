import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { generateObject } from "ai";
import { z } from "zod";
import { db } from "../db";
import { aiModels, aiProviders, auditLogs } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { decrypt } from "../lib/crypto";
import { createProviderClient, injectSchemaContext } from "./chat";

type AuthEnv = {
  Variables: {
    user: { id: string; name: string; email: string };
  };
};

const app = new Hono<AuthEnv>();

app.use("/*", requireAuth);

app.get("/", async (c) => {
  const user = c.get("user");
  const connectionId = c.req.query("connectionId");
  if (!connectionId) return c.json({ suggestions: [] });

  // Resolve model (same pattern as chat.ts)
  const [userModel] = await db
    .select({
      modelId: aiModels.modelId,
      providerSlug: aiProviders.slug,
      providerBaseUrl: aiProviders.baseUrl,
      providerApiKeyEncrypted: aiProviders.apiKeyEncrypted,
    })
    .from(aiModels)
    .innerJoin(aiProviders, eq(aiModels.providerId, aiProviders.id))
    .limit(1);

  if (!userModel) {
    return c.json({ suggestions: [] });
  }

  const userApiKey = userModel.providerApiKeyEncrypted
    ? decrypt(userModel.providerApiKeyEncrypted)
    : null;

  if (!userApiKey && userModel.providerSlug !== "ollama") {
    return c.json({ suggestions: [] });
  }

  const providerClient = createProviderClient(
    userModel.providerSlug,
    userModel.providerBaseUrl,
    userApiKey
  );

  // Get schema context
  const schemaContext = await injectSchemaContext(connectionId, user.id);

  // Get recent audit logs for this user
  const recentLogs = await db
    .select({
      action: auditLogs.action,
      sqlExecuted: auditLogs.sqlExecuted,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .where(eq(auditLogs.userId, user.id))
    .orderBy(auditLogs.createdAt)
    .limit(10);

  const recentActivity = recentLogs.length > 0
    ? recentLogs
        .filter((log) => log.sqlExecuted)
        .map((log) => `- ${log.sqlExecuted?.slice(0, 100)}`)
        .join("\n")
    : "No recent activity";

  const { object } = await generateObject({
    model: providerClient(userModel.modelId) as any,
    schema: z.object({
      suggestions: z
        .array(
          z.object({
            label: z.string().describe("Short label for the chip (max 5 words)"),
            prompt: z.string().describe("Full prompt to send to chat"),
            trigger: z
              .string()
              .optional()
              .describe("Optional trigger like 'schema' or 'explain'"),
          })
        )
        .min(3)
        .max(5),
    }),
    prompt: `Based on this database schema and recent activity, suggest 3-5 useful queries or actions the user might want to perform.\n\nSchema:\n${schemaContext}\n\nRecent activity:\n${recentActivity}`,
  });

  return c.json(object);
});

export { app as suggestionsRoutes };
