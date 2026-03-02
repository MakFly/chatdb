import type { UIMessage } from "ai";

// Re-export shared types with local extension
export type { Folder } from "@chat-assistant/shared";
export type { Conversation as SharedConversation } from "@chat-assistant/shared";

export interface Conversation {
  id: string;
  title: string;
  preview?: string;
  date?: string;
  starred?: boolean;
  archived?: boolean;
  folderId?: string;
  createdAt?: string;
  updatedAt?: string;
  messages?: UIMessage[];
}

