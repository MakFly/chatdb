import { Hono } from "hono";
import type { AuthEnv } from "./chat";
import { db } from "../db";
import { auditLogs } from "../db/schema";
import { eq, sql, count } from "drizzle-orm";

const app = new Hono<AuthEnv>();

// GET /api/v1/audit-analytics
app.get("/", async (c) => {
  const user = c.get("user");

  // Total mutations
  const totalResult = await db
    .select({ total: count() })
    .from(auditLogs)
    .where(eq(auditLogs.userId, user.id));

  // Success vs error rate by action
  const rateResult = await db
    .select({
      action: auditLogs.action,
      count: count(),
    })
    .from(auditLogs)
    .where(eq(auditLogs.userId, user.id))
    .groupBy(auditLogs.action);

  // Average duration
  const avgDuration = await db
    .select({ avg: sql<number>`AVG(${auditLogs.durationMs})` })
    .from(auditLogs)
    .where(eq(auditLogs.userId, user.id));

  // Top tables (extract from sqlExecuted)
  const topTables = await db.execute(sql`
    SELECT
      regexp_matches(sql_executed, '(?:FROM|INTO|UPDATE|JOIN)\s+(\w+)', 'gi') as table_match,
      COUNT(*) as usage_count
    FROM audit_logs
    WHERE user_id = ${user.id}
    GROUP BY table_match
    ORDER BY usage_count DESC
    LIMIT 10
  `);

  // Daily distribution (last 30 days)
  const daily = await db.execute(sql`
    SELECT
      DATE(created_at) as day,
      COUNT(*) as count
    FROM audit_logs
    WHERE user_id = ${user.id}
      AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY day DESC
  `);

  return c.json({
    total: totalResult[0]?.total ?? 0,
    byAction: rateResult,
    avgDurationMs: Math.round(avgDuration[0]?.avg ?? 0),
    topTables,
    dailyDistribution: daily,
  });
});

export default app;
