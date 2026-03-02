import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and, desc, like, or, sql } from "drizzle-orm";
import { db } from "../db";
import { conversations, messages } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import {
  createConversationSchema,
  updateConversationSchema,
} from "../validation/schemas";

type AuthEnv = {
  Variables: {
    user: { id: string; name: string; email: string };
  };
};

export const conversationRoutes = new Hono<AuthEnv>();

// All routes require auth
conversationRoutes.use("/*", requireAuth);

// Search conversations by title or summary
conversationRoutes.get("/conversations/search", async (c) => {
  const user = c.get("user");
  const q = c.req.query("q");
  if (!q || q.trim().length < 2) return c.json([]);

  const pattern = `%${q}%`;
  const results = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.userId, user.id),
        or(
          sql`${conversations.title} ILIKE ${pattern}`,
          sql`${conversations.summary} ILIKE ${pattern}`
        )
      )
    )
    .orderBy(desc(conversations.updatedAt))
    .limit(20);

  return c.json(results);
});

// List conversations (optional ?search= for title filter)
conversationRoutes.get("/conversations", async (c) => {
  const user = c.get("user");
  const search = c.req.query("search")?.trim();

  if (search) {
    const result = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.userId, user.id),
          like(conversations.title, `%${search.replace(/[%_]/g, "\\$&")}%`)
        )
      )
      .orderBy(desc(conversations.updatedAt));
    return c.json(result);
  }

  const result = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, user.id))
    .orderBy(desc(conversations.updatedAt));
  return c.json(result);
});

// Create conversation
conversationRoutes.post(
  "/conversations",
  zValidator("json", createConversationSchema),
  async (c) => {
    const user = c.get("user");
    const body = c.req.valid("json");

    const [conv] = await db
      .insert(conversations)
      .values({
        userId: user.id,
        title: body.title,
        folderId: body.folderId ?? null,
      })
      .returning();

    return c.json(conv, 201);
  }
);

// Get conversation with messages
conversationRoutes.get("/conversations/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const [conv] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, user.id)));

  if (!conv) {
    return c.json({ error: "Not found" }, 404);
  }

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(messages.createdAt);

  return c.json({ ...conv, messages: msgs });
});

// Update conversation
conversationRoutes.patch(
  "/conversations/:id",
  zValidator("json", updateConversationSchema),
  async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const [updated] = await db
      .update(conversations)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(conversations.id, id), eq(conversations.userId, user.id)))
      .returning();

    if (!updated) {
      return c.json({ error: "Not found" }, 404);
    }

    return c.json(updated);
  }
);

// Delete conversation
conversationRoutes.delete("/conversations/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const [deleted] = await db
    .delete(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, user.id)))
    .returning();

  if (!deleted) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json({ success: true });
});
