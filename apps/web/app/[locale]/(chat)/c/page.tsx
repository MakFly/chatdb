"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { ChatShell } from "@/components/chat/chat-shell";
import { useChatHeaderStore } from "@/lib/stores/chat-header-store";

export default function NewChatPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") ?? "";
  const [chatKey, setChatKey] = React.useState(() => Date.now());
  const { clearChatRef, onRefreshRef, selectedModelId, selectedConnectionId } =
    useChatHeaderStore();

  React.useEffect(() => {
    onRefreshRef.current = () => setChatKey(Date.now());
    return () => {
      onRefreshRef.current = null;
    };
  }, [onRefreshRef]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <ChatShell
        key={chatKey}
        clearChatRef={clearChatRef}
        selectedModelId={selectedModelId}
        connectionId={
          selectedConnectionId === "none" ? undefined : selectedConnectionId || undefined
        }
        initialInput={initialQuery}
      />
    </div>
  );
}
