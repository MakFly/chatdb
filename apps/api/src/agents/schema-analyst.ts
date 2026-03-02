import { streamText, stepCountIs, type ToolSet } from "ai";
import type { AgentParams } from "./types";
import { PromptService } from "../services/prompt-service";

/**
 * Agent specialized in schema exploration. Uses modelClass 'fast'.
 * Only has access to getSchema tool.
 */
export async function runSchemaAgent(params: AgentParams) {
  const tools: ToolSet = {};
  if (params.tools.getSchema) {
    tools.getSchema = params.tools.getSchema;
  }

  const systemPrompt = await PromptService.get("schema-analyst");

  const hasTools = Object.keys(tools).length > 0;

  return streamText({
    model: params.providerClient(params.model.modelId) as any,
    system: systemPrompt,
    messages: params.messages as any,
    tools: hasTools ? tools : undefined,
    stopWhen: hasTools ? stepCountIs(3) : undefined,
    abortSignal: params.abortSignal,
    onFinish: params.onFinish as any,
  });
}
