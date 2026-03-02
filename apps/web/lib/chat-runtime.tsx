"use client";

import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import {
  useExternalStoreRuntime,
  AssistantRuntimeProvider,
  type ThreadMessageLike,
  type ExternalStoreThreadListAdapter,
} from "@assistant-ui/react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api-client";
import { emitConversationCreated, onConversationCreated } from "@/lib/events";
import type { Conversation } from "@/lib/chat-types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function convertMessage(message: UIMessage): ThreadMessageLike {
  return {
    role: message.role as "user" | "assistant",
    id: message.id,
    content: message.parts
      ?.filter((p) => p.type === "text")
      .map((p) => ({ type: "text" as const, text: (p as { text: string }).text })) ?? [
      { type: "text" as const, text: "" },
    ],
  };
}

interface ChatRuntimeProviderProps {
  children: React.ReactNode;
  conversationId?: string;
  selectedModelId?: string;
  connectionId?: string;
  writeMode?: { update: boolean; delete: boolean };
  clearChatRef?: React.MutableRefObject<(() => void) | null>;
  initialInput?: string;
}

export function ChatRuntimeProvider({
  children,
  conversationId,
  selectedModelId,
  connectionId,
  writeMode = { update: false, delete: false },
  clearChatRef,
}: ChatRuntimeProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const redirectedRef = React.useRef(false);
  const inputSnapshotRef = React.useRef("");

  // Conversations state for thread list
  const [conversations, setConversations] = React.useState<Conversation[]>([]);

  React.useEffect(() => {
    api.conversations.list().then(setConversations).catch(() => {});
  }, []);

  React.useEffect(() => {
    return onConversationCreated((conv) => {
      setConversations((prev) => {
        if (prev.some((c) => c.id === conv.id)) return prev;
        const now = new Date().toISOString();
        return [
          {
            id: conv.id,
            title: conv.title,
            starred: false,
            archived: false,
            createdAt: now,
            updatedAt: now,
          },
          ...prev,
        ];
      });
    });
  }, []);

  // Refs for transport body
  const bodyRef = React.useRef({
    modelId: selectedModelId,
    conversationId,
    connectionId,
    writeMode,
  });
  React.useEffect(() => {
    bodyRef.current = { modelId: selectedModelId, conversationId, connectionId, writeMode };
  }, [selectedModelId, conversationId, connectionId, writeMode]);

  const transport = React.useMemo(() => {
    return new DefaultChatTransport({
      api: `${API_URL}/api/v1/chat`,
      credentials: "include",
      body: () => bodyRef.current,
      fetch: async (url, init) => {
        const response = await fetch(url, init);
        const newConvId = response.headers.get("X-Conversation-Id");
        if (newConvId && !redirectedRef.current) {
          redirectedRef.current = true;
          const title = inputSnapshotRef.current || "New conversation";
          window.history.replaceState(null, "", `/c/${newConvId}`);
          bodyRef.current = { ...bodyRef.current, conversationId: newConvId };
          emitConversationCreated({
            id: newConvId,
            title: title.length > 60 ? title.slice(0, 57) + "..." : title,
          });
        }
        return response;
      },
    });
  }, []);

  const chatId = React.useMemo(
    () => conversationId || `new-${Date.now()}`,
    [conversationId]
  );

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    id: chatId,
    transport,
  });

  const isRunning = status === "streaming" || status === "submitted";

  // NOTE: Message loading from DB is handled by chat-shell.tsx which
  // shares the same useChat instance (same chatId). Do NOT duplicate here
  // as it would race and overwrite tool parts with text-only versions.

  // Clear chat ref
  React.useEffect(() => {
    if (clearChatRef) {
      clearChatRef.current = () => {
        setMessages([]);
        redirectedRef.current = false;
      };
    }
    return () => {
      if (clearChatRef) clearChatRef.current = null;
    };
  }, [clearChatRef, setMessages]);

  // Thread list adapter
  const activeConversationId = React.useMemo(() => {
    const match = pathname.match(/^\/c\/(.+)$/);
    return match?.[1];
  }, [pathname]);

  const threadListAdapter: ExternalStoreThreadListAdapter = React.useMemo(
    () => ({
      threadId: activeConversationId,
      threads: conversations
        .filter((c) => !c.archived)
        .map((c) => ({
          id: c.id,
          title: c.title,
          status: "regular" as const,
        })),
      archivedThreads: conversations
        .filter((c) => c.archived)
        .map((c) => ({
          id: c.id,
          title: c.title,
          status: "archived" as const,
        })),
      onSwitchToNewThread: () => router.push("/c"),
      onSwitchToThread: (id: string) => router.push(`/c/${id}`),
      onRename: async (id: string, title: string) => {
        await api.conversations.update(id, { title });
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, title } : c))
        );
      },
      onArchive: async (id: string) => {
        await api.conversations.update(id, { archived: true });
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, archived: true } : c))
        );
      },
      onUnarchive: async (id: string) => {
        await api.conversations.update(id, { archived: false });
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, archived: false } : c))
        );
      },
      onDelete: async (id: string) => {
        await api.conversations.delete(id);
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeConversationId === id) router.push("/c");
      },
    }),
    [conversations, activeConversationId, router]
  );

  const runtime = useExternalStoreRuntime({
    messages,
    isRunning,
    onNew: async (msg) => {
      const text =
        msg.content
          ?.filter((p) => p.type === "text")
          .map((p) => (p as { type: "text"; text: string }).text)
          .join("") ?? "";
      inputSnapshotRef.current = text;
      sendMessage({ text });
    },
    onCancel: () => stop(),
    convertMessage,
    adapters: {
      threadList: threadListAdapter,
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
