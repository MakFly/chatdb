import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Hono } from "hono";

// Mock the auth module before importing the middleware
const mockGetSession = mock(async () => null);

mock.module("../../lib/auth", () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

// Import after mock setup
const { requireAuth } = await import("../../middleware/auth");

function createTestApp() {
  const app = new Hono();
  app.use("/*", requireAuth);
  app.get("/test", (c) => c.json({ ok: true }));
  return app;
}

describe("requireAuth middleware", () => {
  beforeEach(() => {
    mockGetSession.mockReset();
  });

  it("returns 401 when session is null", async () => {
    mockGetSession.mockImplementation(async () => null);
    const app = createTestApp();
    const res = await app.request("/test");
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 when session.user is missing", async () => {
    mockGetSession.mockImplementation(async () => ({ session: {} }));
    const app = createTestApp();
    const res = await app.request("/test");
    expect(res.status).toBe(401);
  });

  it("calls next and sets user when session is valid", async () => {
    const fakeUser = { id: "user-1", name: "Alice", email: "alice@example.com" };
    mockGetSession.mockImplementation(async () => ({
      user: fakeUser,
      session: { id: "sess-1" },
    }));
    const app = createTestApp();
    const res = await app.request("/test");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
