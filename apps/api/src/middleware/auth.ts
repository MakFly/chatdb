import { createMiddleware } from "hono/factory";
import { auth } from "../lib/auth";
import { db } from "../db";
import { userRoles, roles } from "../db/schema";
import { eq } from "drizzle-orm";

type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type AuthEnv = {
  Variables: {
    user: AuthUser;
  };
};

export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", session.user as AuthUser);
  await next();
});

export const requireAdmin = createMiddleware<AuthEnv>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userRoleRows = await db
    .select({ dbAccessMode: roles.dbAccessMode })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, session.user.id));

  const isAdmin = userRoleRows.some((r) => r.dbAccessMode === "admin");

  if (!isAdmin) {
    return c.json({ error: "Admin access required" }, 403);
  }

  c.set("user", session.user as AuthUser);
  await next();
});
