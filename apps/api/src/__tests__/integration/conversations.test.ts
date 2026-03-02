import { describe, it, expect, mock } from "bun:test";
import { Hono } from "hono";

const fakeUser = { id: "test-user-id", name: "Test User", email: "test@example.com" };

const fakeConversation = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  userId: fakeUser.id,
  title: "Test Conversation",
  starred: false,
  archived: false,
  folderId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ── Mock the auth module (must be before any import that uses it) ──
mock.module("../../lib/auth", () => ({
  auth: {
    api: {
      getSession: async () => ({
        user: fakeUser,
        session: { id: "sess-test" },
      }),
    },
  },
}));

// ── Chainable mock db builder ──
function makeMockDb(finalResult: unknown[]) {
  const chain: Record<string, unknown> = {};
  const terminal = async () => finalResult;
  const methods = ["select", "from", "where", "orderBy", "insert", "values", "returning", "update", "set", "delete"];
  for (const m of methods) {
    chain[m] = () => chain;
  }
  // Override terminal methods to resolve with data
  chain.orderBy = terminal;
  chain.returning = terminal;
  return chain;
}

// ── Mock the db module ──
// Chainable query builder that resolves to `result` when awaited at any point
function makeChain(result: unknown[]): Record<string, unknown> {
  const chain: Record<string, unknown> = {
    then: (resolve: (v: unknown[]) => void) => Promise.resolve(result).then(resolve),
    catch: (reject: (e: unknown) => void) => Promise.resolve(result).catch(reject),
    finally: (fn: () => void) => Promise.resolve(result).finally(fn),
  };
  const methods = ["select", "from", "where", "orderBy", "insert", "values", "set", "update", "delete"];
  for (const m of methods) {
    chain[m] = () => makeChain(result);
  }
  chain.returning = () => Promise.resolve(result);
  return chain;
}

mock.module("../../db", () => ({
  db: {
    select: () => makeChain([fakeConversation]),
    insert: () => makeChain([fakeConversation]),
    update: () => makeChain([fakeConversation]),
    delete: () => makeChain([fakeConversation]),
  },
}));

// ── Import routes after mocks ──
const { conversationRoutes } = await import("../../routes/conversations");

function buildApp() {
  const app = new Hono();
  app.route("/api/v1", conversationRoutes);
  return app;
}

describe("Conversations API (integration)", () => {
  describe("GET /api/v1/conversations", () => {
    it("returns 200 with list of conversations", async () => {
      const app = buildApp();
      const res = await app.request("/api/v1/conversations", {
        method: "GET",
        headers: { cookie: "session=fake-session" },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
    });
  });

  describe("POST /api/v1/conversations", () => {
    it("returns 201 with valid body", async () => {
      const app = buildApp();
      const res = await app.request("/api/v1/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: "session=fake-session",
        },
        body: JSON.stringify({ title: "Test Conversation" }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.title).toBe("Test Conversation");
    });

    it("returns 400 with missing title", async () => {
      const app = buildApp();
      const res = await app.request("/api/v1/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: "session=fake-session",
        },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });

    it("returns 400 with empty title", async () => {
      const app = buildApp();
      const res = await app.request("/api/v1/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: "session=fake-session",
        },
        body: JSON.stringify({ title: "" }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v1/conversations/:id", () => {
    it("returns 200 when conversation found", async () => {
      const app = buildApp();
      const res = await app.request(
        `/api/v1/conversations/${fakeConversation.id}`,
        {
          method: "GET",
          headers: { cookie: "session=fake-session" },
        }
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe(fakeConversation.id);
    });
  });

  describe("PATCH /api/v1/conversations/:id", () => {
    it("returns 200 when update succeeds", async () => {
      const app = buildApp();
      const res = await app.request(
        `/api/v1/conversations/${fakeConversation.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            cookie: "session=fake-session",
          },
          body: JSON.stringify({ title: "Updated Title" }),
        }
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.title).toBe("Test Conversation");
    });
  });

  describe("DELETE /api/v1/conversations/:id", () => {
    it("returns 200 when delete succeeds", async () => {
      const app = buildApp();
      const res = await app.request(
        `/api/v1/conversations/${fakeConversation.id}`,
        {
          method: "DELETE",
          headers: { cookie: "session=fake-session" },
        }
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });
  });
});
