import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { aiModels, aiProviders } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import {
  createModelSchema,
  updateModelSchema,
} from "../validation/schemas";

export const modelRoutes = new Hono();

modelRoutes.use("/*", requireAuth);

// List models (with provider name)
modelRoutes.get("/models", async (c) => {
  const rows = await db
    .select({
      id: aiModels.id,
      providerId: aiModels.providerId,
      providerName: aiProviders.name,
      providerSlug: aiProviders.slug,
      name: aiModels.name,
      modelId: aiModels.modelId,
      modelClass: aiModels.modelClass,
      inputCostPer1k: aiModels.inputCostPer1k,
      outputCostPer1k: aiModels.outputCostPer1k,
      maxTokens: aiModels.maxTokens,
      isEnabled: aiModels.isEnabled,
      createdAt: aiModels.createdAt,
      providerApiKeyEncrypted: aiProviders.apiKeyEncrypted,
    })
    .from(aiModels)
    .innerJoin(aiProviders, eq(aiModels.providerId, aiProviders.id));

  return c.json(
    rows.map(({ providerApiKeyEncrypted, providerSlug, ...rest }) => ({
      ...rest,
      providerSlug,
      hasApiKey: providerSlug === "ollama" || !!providerApiKeyEncrypted,
    }))
  );
});

// Get model
modelRoutes.get("/models/:id", async (c) => {
  const id = c.req.param("id");
  const [row] = await db
    .select({
      id: aiModels.id,
      providerId: aiModels.providerId,
      providerName: aiProviders.name,
      providerSlug: aiProviders.slug,
      name: aiModels.name,
      modelId: aiModels.modelId,
      modelClass: aiModels.modelClass,
      inputCostPer1k: aiModels.inputCostPer1k,
      outputCostPer1k: aiModels.outputCostPer1k,
      maxTokens: aiModels.maxTokens,
      isEnabled: aiModels.isEnabled,
      createdAt: aiModels.createdAt,
    })
    .from(aiModels)
    .innerJoin(aiProviders, eq(aiModels.providerId, aiProviders.id))
    .where(eq(aiModels.id, id));

  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

// Create model
modelRoutes.post(
  "/models",
  zValidator("json", createModelSchema),
  async (c) => {
    const body = c.req.valid("json");
    const [model] = await db
      .insert(aiModels)
      .values({
        providerId: body.providerId,
        name: body.name,
        modelId: body.modelId,
        modelClass: body.modelClass ?? null,
        inputCostPer1k: body.inputCostPer1k ?? null,
        outputCostPer1k: body.outputCostPer1k ?? null,
        maxTokens: body.maxTokens ?? null,
        isEnabled: body.isEnabled ?? true,
      })
      .returning();

    return c.json(model, 201);
  }
);

// Update model
modelRoutes.patch(
  "/models/:id",
  zValidator("json", updateModelSchema),
  async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const [updated] = await db
      .update(aiModels)
      .set(body)
      .where(eq(aiModels.id, id))
      .returning();

    if (!updated) return c.json({ error: "Not found" }, 404);
    return c.json(updated);
  }
);

// Delete model
modelRoutes.delete("/models/:id", async (c) => {
  const id = c.req.param("id");
  const [deleted] = await db
    .delete(aiModels)
    .where(eq(aiModels.id, id))
    .returning();

  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json({ success: true });
});
