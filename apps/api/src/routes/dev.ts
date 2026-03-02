import { Hono } from "hono";
import { db } from "../db/index";
import { user } from "../db/schema";

const devRoutes = new Hono();

// DEV ONLY: List users for autofill on login page
devRoutes.get("/users", async (c) => {
  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(user);

  return c.json(users);
});

export { devRoutes };
