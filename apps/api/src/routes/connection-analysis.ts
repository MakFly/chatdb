import { Hono } from "hono";
import { generateText } from "ai";
import { requireAuth } from "../middleware/auth";
import { getConnectionClient, getDialect } from "./connections";
import { createProviderClient } from "./chat";
import { db } from "../db";
import { aiModels, aiProviders, dbConnections } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { decrypt } from "../lib/crypto";

type AuthEnv = {
  Variables: {
    user: { id: string; name: string; email: string };
  };
};

const app = new Hono<AuthEnv>();

app.use("/*", requireAuth);

// POST /api/v1/connection-analysis/:id/analyze
app.post("/:id/analyze", async (c) => {
  const user = c.get("user");
  const connectionId = c.req.param("id");

  // Resolve user model (first available)
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
    return c.json({ error: "No model configured. Add a model in settings." }, 404);
  }

  const userApiKey = userModel.providerApiKeyEncrypted
    ? decrypt(userModel.providerApiKeyEncrypted)
    : null;

  const providerClient = createProviderClient(
    userModel.providerSlug,
    userModel.providerBaseUrl,
    userApiKey
  );

  // Detect connection type
  const [connRow] = await db
    .select({ type: dbConnections.type })
    .from(dbConnections)
    .where(and(eq(dbConnections.id, connectionId), eq(dbConnections.userId, user.id)));

  if (!connRow) return c.json({ error: "Connection not found" }, 404);

  const dialectType = connRow.type ?? "postgresql";

  // PG-specific stats (pg_stat_user_tables etc.)
  if (dialectType !== "postgresql") {
    // Non-PG: use generic dialect for schema info only
    const dialect = await getDialect(connectionId, user.id);
    try {
      const [columns, fks] = await Promise.all([
        dialect.getColumns(),
        dialect.getForeignKeys(),
      ]);

      const { text } = await generateText({
        model: providerClient(userModel.modelId) as any,
        prompt: `Analyze this ${dialect.dialectName()} database and provide a concise report in French:

Columns:
${JSON.stringify(columns.slice(0, 100), null, 2)}

Foreign keys:
${JSON.stringify(fks, null, 2)}

Provide: a brief overview of the database structure and tables found.`,
        maxOutputTokens: 600,
      });

      return c.json({
        report: text,
        raw: { columns, foreignKeys: fks },
      });
    } finally {
      await dialect.disconnect();
    }
  }

  // PostgreSQL: full analysis with pg_stat_user_tables
  let client: Awaited<ReturnType<typeof getConnectionClient>>["client"] | null = null;
  try {
    const conn = await getConnectionClient(connectionId, user.id);
    client = conn.client;
  } catch (err: any) {
    return c.json({ error: err.message }, 404);
  }

  try {
    const [tableSizes, tableStats, fks, indexes] = await Promise.all([
      client`
        SELECT
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
          pg_total_relation_size(schemaname||'.'||tablename) AS raw_size
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY raw_size DESC
        LIMIT 20
      `,
      client`
        SELECT
          schemaname,
          relname,
          seq_scan,
          idx_scan,
          n_tup_ins,
          n_tup_upd,
          n_tup_del,
          n_live_tup
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
        LIMIT 20
      `,
      client`
        SELECT
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
      `,
      client`
        SELECT tablename, indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename
      `,
    ]);

    const { text } = await generateText({
      model: providerClient(userModel.modelId) as any,
      prompt: `Analyze this PostgreSQL database and provide a concise report in French:

Table sizes:
${JSON.stringify(tableSizes, null, 2)}

Table stats (seq_scan vs idx_scan):
${JSON.stringify(tableStats, null, 2)}

Foreign keys:
${JSON.stringify(fks, null, 2)}

Indexes:
${JSON.stringify(indexes, null, 2)}

Provide: a brief overview of the database structure, notable findings (large tables, missing indexes, tables with many sequential scans vs index scans), and concrete optimization suggestions.`,
      maxOutputTokens: 600,
    });

    return c.json({
      report: text,
      raw: { tableSizes, tableStats, foreignKeys: fks, indexes },
    });
  } finally {
    await client.end();
  }
});

export default app;
