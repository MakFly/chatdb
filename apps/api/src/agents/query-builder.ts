import { streamText, stepCountIs, type ToolSet } from "ai";
import type { AgentParams } from "./types";
import { PromptService } from "../services/prompt-service";

/**
 * Agent specialized in SQL query building. Uses modelClass 'smart'.
 * Has access to getSchema + executeSQL tools.
 */
export async function runQueryAgent(params: AgentParams) {
  const tools: ToolSet = {};
  if (params.tools.getSchema) tools.getSchema = params.tools.getSchema;
  if (params.tools.executeSQL) tools.executeSQL = params.tools.executeSQL;

  const systemPrompt = await PromptService.get("query-builder");

  return streamText({
    model: params.providerClient(params.model.modelId) as any,
    system: systemPrompt,
    messages: params.messages as any,
    tools: Object.keys(tools).length > 0 ? tools : undefined,
    stopWhen: Object.keys(tools).length > 0 ? stepCountIs(7) : undefined,
    abortSignal: params.abortSignal,
    onFinish: params.onFinish as any,
  });
}
