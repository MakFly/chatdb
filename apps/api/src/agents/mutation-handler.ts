import { eq } from "drizzle-orm";
import { streamText, stepCountIs, type ToolSet } from "ai";
import { db } from "../db";
import { userRoles, roles } from "../db/schema";
import type { AgentParams } from "./types";
import { PromptService } from "../services/prompt-service";

/**
 * Check if a user has write/admin access for mutations.
 * Backward-compatible: if user has no roles at all, access is granted.
 */
export async function checkMutationAccess(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const userRoleRows = await db
    .select({ dbAccessMode: roles.dbAccessMode })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  // No roles assigned → backward-compatible, allow access
  if (userRoleRows.length === 0) {
    return { allowed: true };
  }

  // Check if any role grants write or admin access
  const hasWriteAccess = userRoleRows.some(
    (r) => r.dbAccessMode === "write" || r.dbAccessMode === "admin"
  );

  if (!hasWriteAccess) {
    return {
      allowed: false,
      reason: "Your role does not grant write access to the database.",
    };
  }

  return { allowed: true };
}

/**
 * Agent specialized in data mutations. Uses modelClass 'fixer'.
 * Has access to getSchema + executeMutationSQL tools.
 */
export async function runMutationAgent(params: AgentParams) {
  const tools: ToolSet = {};
  if (params.tools.getSchema) tools.getSchema = params.tools.getSchema;
  if (params.tools.executeMutationSQL)
    tools.executeMutationSQL = params.tools.executeMutationSQL;

  const systemPrompt = await PromptService.get("mutation-handler");

  return streamText({
    model: params.providerClient(params.model.modelId) as any,
    system: systemPrompt,
    messages: params.messages as any,
    tools: Object.keys(tools).length > 0 ? tools : undefined,
    stopWhen: Object.keys(tools).length > 0 ? stepCountIs(5) : undefined,
    abortSignal: params.abortSignal,
    onFinish: params.onFinish as any,
  });
}
