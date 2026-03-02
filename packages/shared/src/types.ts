export interface Conversation {
  id: string;
  title: string;
  preview: string;
  date: string;
  starred?: boolean;
  archived?: boolean;
  folderId?: string;
}

export interface Folder {
  id: string;
  name: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AIProvider {
  id: string;
  name: string;
  slug: string;
  baseUrl?: string;
  isEnabled: boolean;
}

export interface AIModel {
  id: string;
  providerId: string;
  name: string;
  modelId: string;
  modelClass?: "fast" | "smart" | "fixer" | "judge";
  maxTokens?: number;
  isEnabled: boolean;
}
