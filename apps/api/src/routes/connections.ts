import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and } from "drizzle-orm";
import postgres from "postgres";
import { db } from "../db";
import { dbConnections } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { encrypt, decrypt } from "../lib/crypto";
import { createDialect, type DatabaseDialect } from "../lib/dialects";
import {
  createConnectionSchema,
  updateConnectionSchema,
} from "../validation/schemas";

type AuthEnv = {
  Variables: {
    user: { id: string; name: string; email: string };
  };
};

export const connectionRoutes = new Hono<AuthEnv>();

connectionRoutes.use("/*", requireAuth);

// List connections (never return password)
connectionRoutes.get("/connections", async (c) => {
  const user = c.get("user");
  const rows = await db
    .select()
    .from(dbConnections)
    .where(eq(dbConnections.userId, user.id));

  return c.json(
    rows.map((r) => ({ ...r, passwordEncrypted: undefined }))
  );
});

// Get connection
connectionRoutes.get("/connections/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const [conn] = await db
    .select()
    .from(dbConnections)
    .where(
      and(eq(dbConnections.id, id), eq(dbConnections.userId, user.id))
    );

  if (!conn) return c.json({ error: "Not found" }, 404);
  return c.json({ ...conn, passwordEncrypted: undefined });
});

// Create connection
connectionRoutes.post(
  "/connections",
  zValidator("json", createConnectionSchema),
  async (c) => {
    const user = c.get("user");
    const body = c.req.valid("json");

    const [conn] = await db
      .insert(dbConnections)
      .values({
        userId: user.id,
        name: body.name,
        type: body.type,
        host: body.host ?? null,
        port: body.port ?? null,
        database: body.database ?? null,
        username: body.username ?? null,
        passwordEncrypted: body.password ? encrypt(body.password) : null,
        filePath: body.filePath ?? null,
        sslEnabled: body.sslEnabled,
      })
      .returning();

    return c.json({ ...conn, passwordEncrypted: undefined }, 201);
  }
);

// Update connection
connectionRoutes.patch(
  "/connections/:id",
  zValidator("json", updateConnectionSchema),
  async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) updates.name = body.name;
    if (body.type !== undefined) updates.type = body.type;
    if (body.host !== undefined) updates.host = body.host;
    if (body.port !== undefined) updates.port = body.port;
    if (body.database !== undefined) updates.database = body.database;
    if (body.username !== undefined) updates.username = body.username;
    if (body.filePath !== undefined) updates.filePath = body.filePath;
    if (body.sslEnabled !== undefined) updates.sslEnabled = body.sslEnabled;
    if (body.isActive !== undefined) updates.isActive = body.isActive;
    if (body.password !== undefined)
      updates.passwordEncrypted = encrypt(body.password);

    const [updated] = await db
      .update(dbConnections)
      .set(updates)
      .where(
        and(eq(dbConnections.id, id), eq(dbConnections.userId, user.id))
      )
      .returning();

    if (!updated) return c.json({ error: "Not found" }, 404);
    return c.json({ ...updated, passwordEncrypted: undefined });
  }
);

// Delete connection
connectionRoutes.delete("/connections/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const [deleted] = await db
    .delete(dbConnections)
    .where(
      and(eq(dbConnections.id, id), eq(dbConnections.userId, user.id))
    )
    .returning();

  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json({ success: true });
});

// Test connection
connectionRoutes.post("/connections/:id/test", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const [conn] = await db
    .select()
    .from(dbConnections)
    .where(
      and(eq(dbConnections.id, id), eq(dbConnections.userId, user.id))
    );

  if (!conn) return c.json({ error: "Not found" }, 404);

  let dialect: DatabaseDialect | null = null;
  try {
    dialect = await createDialect(conn);
    const ok = await dialect.testConnection();
    return c.json({ success: ok });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  } finally {
    if (dialect) await dialect.disconnect().catch(() => {});
  }
});

// Helper to get a postgres client for a connection (used by chat route for pg-specific transaction support)
export async function getConnectionClient(
  connectionId: string,
  userId: string
): Promise<{ client: ReturnType<typeof postgres>; database: string }> {
  const [conn] = await db
    .select()
    .from(dbConnections)
    .where(
      and(
        eq(dbConnections.id, connectionId),
        eq(dbConnections.userId, userId)
      )
    );

  if (!conn) throw new Error("Connection not found");
  if (!conn.isActive) throw new Error("Connection is inactive");

  const client = postgres({
    host: conn.host ?? "",
    port: conn.port ?? 5432,
    database: conn.database ?? "",
    username: conn.username ?? "",
    password: conn.passwordEncrypted ? decrypt(conn.passwordEncrypted) : "",
    ssl: conn.sslEnabled ? "require" : false,
    connect_timeout: 10,
    max: 1,
  });

  return { client, database: conn.database ?? "" };
}

// Helper to get a dialect for a connection (multi-DB support)
export async function getDialect(
  connectionId: string,
  userId: string
): Promise<DatabaseDialect> {
  const [conn] = await db
    .select()
    .from(dbConnections)
    .where(
      and(
        eq(dbConnections.id, connectionId),
        eq(dbConnections.userId, userId)
      )
    );

  if (!conn) throw new Error("Connection not found");
  if (!conn.isActive) throw new Error("Connection is inactive");

  return createDialect(conn);
}
