import type { ToolSet } from "ai";

export type Intent = "schema" | "query" | "mutation" | "general";

export interface SelectedModel {
  modelId: string;
  providerSlug: string;
  providerBaseUrl: string | null;
  providerApiKeyEncrypted: string | null;
}

export interface AgentParams {
  model: SelectedModel;
  providerClient: ReturnType<any>;
  messages: { role: string; content: string }[];
  tools: ToolSet;
  systemPrompt: string;
  userId: string;
  conversationId: string;
  connectionId?: string;
  dialectName?: string;
  writeMode?: { update?: boolean; delete?: boolean };
  abortSignal?: AbortSignal;
  onFinish?: (result: { text: string }) => Promise<void>;
}
