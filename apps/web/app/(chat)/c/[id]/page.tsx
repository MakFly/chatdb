"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { ChatShell } from "@/components/chat/chat-shell";
import { api } from "@/lib/api-client";
import { useHeaderStore } from "@/lib/stores/header-store";
import { useChatHeaderStore } from "@/lib/stores/chat-header-store";

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.id as string;
  const setTitle = useHeaderStore((s) => s.setTitle);
  const { clearChatRef, selectedModelId, selectedConnectionId } = useChatHeaderStore();

  React.useEffect(() => {
    api.conversations
      .get(conversationId)
      .then((conv) => setTitle(conv.title))
      .catch(() => setTitle("Conversation"));
    return () => setTitle(null);
  }, [conversationId, setTitle]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <ChatShell
        clearChatRef={clearChatRef}
        conversationId={conversationId}
        selectedModelId={selectedModelId}
        connectionId={
          selectedConnectionId === "none" ? undefined : selectedConnectionId || undefined
        }
      />
    </div>
  );
}
