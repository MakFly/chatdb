import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { aiProviders } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { encrypt } from "../lib/crypto";
import {
  createProviderSchema,
  updateProviderSchema,
} from "../validation/schemas";

export const providerRoutes = new Hono();

providerRoutes.use("/*", requireAuth);

// List providers
providerRoutes.get("/providers", async (c) => {
  const rows = await db.select().from(aiProviders);
  const result = rows.map((p) => ({
    ...p,
    apiKeyEncrypted: undefined,
    hasApiKey: !!p.apiKeyEncrypted,
  }));
  return c.json(result);
});

// Get provider
providerRoutes.get("/providers/:id", async (c) => {
  const id = c.req.param("id");
  const [provider] = await db
    .select()
    .from(aiProviders)
    .where(eq(aiProviders.id, id));

  if (!provider) return c.json({ error: "Not found" }, 404);

  return c.json({
    ...provider,
    apiKeyEncrypted: undefined,
    hasApiKey: !!provider.apiKeyEncrypted,
  });
});

// Create provider
providerRoutes.post(
  "/providers",
  zValidator("json", createProviderSchema),
  async (c) => {
    const body = c.req.valid("json");
    const [provider] = await db
      .insert(aiProviders)
      .values({
        name: body.name,
        slug: body.slug,
        baseUrl: body.baseUrl ?? null,
        apiKeyEncrypted: body.apiKey ? encrypt(body.apiKey) : null,
        isEnabled: body.isEnabled ?? true,
      })
      .returning();

    return c.json(
      {
        ...provider,
        apiKeyEncrypted: undefined,
        hasApiKey: !!provider.apiKeyEncrypted,
      },
      201
    );
  }
);

// Update provider
providerRoutes.patch(
  "/providers/:id",
  zValidator("json", updateProviderSchema),
  async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.baseUrl !== undefined) updates.baseUrl = body.baseUrl;
    if (body.isEnabled !== undefined) updates.isEnabled = body.isEnabled;
    if (body.apiKey !== undefined)
      updates.apiKeyEncrypted = encrypt(body.apiKey);

    const [updated] = await db
      .update(aiProviders)
      .set(updates)
      .where(eq(aiProviders.id, id))
      .returning();

    if (!updated) return c.json({ error: "Not found" }, 404);

    return c.json({
      ...updated,
      apiKeyEncrypted: undefined,
      hasApiKey: !!updated.apiKeyEncrypted,
    });
  }
);

// Delete provider
providerRoutes.delete("/providers/:id", async (c) => {
  const id = c.req.param("id");
  const [deleted] = await db
    .delete(aiProviders)
    .where(eq(aiProviders.id, id))
    .returning();

  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json({ success: true });
});
