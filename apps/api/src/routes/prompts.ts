import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import { prompts } from "../db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { PromptService } from "../services/prompt-service";
import { DEFAULT_PROMPTS } from "../db/seeders/prompt-seeder";

type AuthEnv = {
  Variables: {
    user: { id: string; name: string; email: string };
  };
};

export const promptRoutes = new Hono<AuthEnv>();

promptRoutes.use("/*", requireAuth);

// List all prompts (without full content for performance)
promptRoutes.get("/prompts", async (c) => {
  const result = await db
    .select({
      slug: prompts.slug,
      name: prompts.name,
      description: prompts.description,
      category: prompts.category,
      version: prompts.version,
      isActive: prompts.isActive,
      updatedAt: prompts.updatedAt,
    })
    .from(prompts)
    .orderBy(prompts.category, prompts.name);

  return c.json(result);
});

// Get single prompt with content
promptRoutes.get("/prompts/:slug", async (c) => {
  const slug = c.req.param("slug");

  const result = await db
    .select()
    .from(prompts)
    .where(eq(prompts.slug, slug))
    .limit(1);

  if (!result[0]) {
    return c.json({ error: "Prompt not found" }, 404);
  }

  return c.json(result[0]);
});

// Update prompt content (admin only)
const updatePromptSchema = z.object({
  content: z.string().min(50).max(10000),
});

promptRoutes.patch(
  "/prompts/:slug",
  requireAdmin,
  zValidator("json", updatePromptSchema),
  async (c) => {
    const slug = c.req.param("slug");
    const { content } = c.req.valid("json");

    const existing = await db
      .select()
      .from(prompts)
      .where(eq(prompts.slug, slug))
      .limit(1);

    if (!existing[0]) {
      return c.json({ error: "Prompt not found" }, 404);
    }

    const updated = await db
      .update(prompts)
      .set({
        content,
        version: existing[0].version + 1,
        updatedAt: new Date(),
      })
      .where(eq(prompts.slug, slug))
      .returning();

    // Invalidate cache
    await PromptService.invalidate(slug);

    return c.json(updated[0]);
  }
);

// Reset prompt to default (admin only)
promptRoutes.post("/prompts/:slug/reset", requireAdmin, async (c) => {
  const slug = c.req.param("slug");

  const defaultPrompt = DEFAULT_PROMPTS.find((p) => p.slug === slug);
  if (!defaultPrompt) {
    return c.json({ error: "Unknown prompt slug" }, 400);
  }

  const existing = await db
    .select()
    .from(prompts)
    .where(eq(prompts.slug, slug))
    .limit(1);

  if (!existing[0]) {
    return c.json({ error: "Prompt not found" }, 404);
  }

  const updated = await db
    .update(prompts)
    .set({
      content: defaultPrompt.content,
      version: existing[0].version + 1,
      updatedAt: new Date(),
    })
    .where(eq(prompts.slug, slug))
    .returning();

  // Invalidate cache
  await PromptService.invalidate(slug);

  return c.json(updated[0]);
});
