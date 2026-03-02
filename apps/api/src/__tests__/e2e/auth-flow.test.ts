import { describe, it, expect, beforeAll, afterAll } from "bun:test";

/**
 * E2E Auth Flow Tests
 *
 * These tests require:
 * 1. A running PostgreSQL instance with a `chat_assistant_test` database
 * 2. Environment variable TEST_DATABASE_URL pointing to the test DB
 *    e.g. TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/chat_assistant_test"
 * 3. All migrations applied to the test database
 *
 * To run only these tests:
 *   TEST_DATABASE_URL="..." bun test src/__tests__/e2e/auth-flow.test.ts
 */

const TEST_DB_URL = process.env.TEST_DATABASE_URL;
const BASE_URL = process.env.API_URL || "http://localhost:3001";

const E2E_ENABLED = !!TEST_DB_URL;

// Helper to conditionally skip tests when test DB is not configured
function itE2E(name: string, fn: () => Promise<void>) {
  if (!E2E_ENABLED) {
    it.skip(`[SKIP - no TEST_DATABASE_URL] ${name}`, () => {});
  } else {
    it(name, fn);
  }
}

describe("E2E: Auth + Conversation Flow", () => {
  const testEmail = `e2e-test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";
  let sessionCookie = "";
  let conversationId = "";

  beforeAll(async () => {
    if (!E2E_ENABLED) {
      console.log(
        "⚠ E2E tests skipped: set TEST_DATABASE_URL to enable them."
      );
    }
  });

  afterAll(async () => {
    // Cleanup: if we have a session, delete the test conversation
    if (sessionCookie && conversationId) {
      await fetch(`${BASE_URL}/api/v1/conversations/${conversationId}`, {
        method: "DELETE",
        headers: { cookie: sessionCookie },
      }).catch(() => {});
    }
  });

  itE2E("Register a new user", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: "E2E Test User",
      }),
    });

    expect(res.status).toBe(200);
  });

  itE2E("Login with registered user", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
    sessionCookie = setCookie || "";
  });

  itE2E("Create a conversation", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: sessionCookie,
      },
      body: JSON.stringify({ title: "E2E Test Conversation" }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeTruthy();
    conversationId = body.id;
  });

  itE2E("List conversations includes the created one", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/conversations`, {
      headers: { cookie: sessionCookie },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    const found = body.find((c: { id: string }) => c.id === conversationId);
    expect(found).toBeTruthy();
  });

  itE2E("Get conversation by ID", async () => {
    const res = await fetch(
      `${BASE_URL}/api/v1/conversations/${conversationId}`,
      {
        headers: { cookie: sessionCookie },
      }
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(conversationId);
    expect(body.messages).toBeDefined();
  });

  itE2E("Update conversation title", async () => {
    const res = await fetch(
      `${BASE_URL}/api/v1/conversations/${conversationId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: sessionCookie,
        },
        body: JSON.stringify({ title: "Updated E2E Title" }),
      }
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe("Updated E2E Title");
  });

  itE2E("Delete conversation", async () => {
    const res = await fetch(
      `${BASE_URL}/api/v1/conversations/${conversationId}`,
      {
        method: "DELETE",
        headers: { cookie: sessionCookie },
      }
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    conversationId = ""; // Prevent afterAll cleanup from trying again
  });

  itE2E("Accessing deleted conversation returns 404", async () => {
    const deletedId = "550e8400-e29b-41d4-a716-446655440000";
    const res = await fetch(
      `${BASE_URL}/api/v1/conversations/${deletedId}`,
      {
        headers: { cookie: sessionCookie },
      }
    );

    expect(res.status).toBe(404);
  });
});
