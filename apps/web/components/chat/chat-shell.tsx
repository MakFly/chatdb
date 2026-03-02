"use client";

import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageList } from "./message-list";
import { Composer } from "./composer";
import { MessageListSkeleton } from "./chat-shell-skeleton";
import { api } from "@/lib/api-client";
import { emitConversationCreated } from "@/lib/events";
import { ChatRuntimeProvider } from "@/lib/chat-runtime";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import { useChatHeaderStore } from "@/lib/stores/chat-header-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface ChatShellProps {
  clearChatRef?: React.MutableRefObject<(() => void) | null>;
  conversationId?: string;
  selectedModelId?: string;
  connectionId?: string;
  initialInput?: string;
}

export function ChatShell({
  clearChatRef,
  conversationId,
  selectedModelId,
  connectionId,
  initialInput = "",
}: ChatShellProps) {
  const [input, setInput] = React.useState(initialInput);
  const [writeMode, setWriteMode] = React.useState({ update: false, delete: false });
  const [trigger, setTrigger] = React.useState<string | undefined>();
  const [isLoadingConversation, setIsLoadingConversation] = React.useState(!!conversationId);
  const redirectedRef = React.useRef(false);
  const inputSnapshotRef = React.useRef("");

  // Use refs so the transport body always reads the latest values
  const bodyRef = React.useRef({
    modelId: selectedModelId,
    conversationId,
    connectionId,
    writeMode: { update: false, delete: false },
    trigger: undefined as string | undefined,
  });
  React.useEffect(() => {
    bodyRef.current = {
      modelId: selectedModelId,
      conversationId,
      connectionId,
      writeMode,
      trigger,
    };
  }, [selectedModelId, conversationId, connectionId, writeMode, trigger]);

  React.useEffect(() => {
    if (initialInput) setInput(initialInput);
  }, [initialInput]);

  // Transport created once — body is a function that reads refs
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
          // Update the ref so subsequent messages use the new conversationId
          bodyRef.current = { ...bodyRef.current, conversationId: newConvId };
          emitConversationCreated({
            id: newConvId,
            title: title.length > 60 ? title.slice(0, 57) + "..." : title,
          });
        }
        return response;
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chatId = React.useMemo(
    () => conversationId || `new-${Date.now()}`,
    [conversationId]
  );

  const { messages, sendMessage, status, stop, setMessages, error } = useChat({
    id: chatId,
    transport,
  });

  const isStreaming = status === "streaming" || status === "submitted";

  // Parse API error for user-friendly display
  const [chatError, setChatError] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!error) {
      setChatError(null);
      return;
    }
    // Try to extract JSON error message from the response
    const msg = error.message || "An unexpected error occurred.";
    // AI SDK wraps fetch errors — look for our API error pattern
    if (msg.includes("API_KEY_MISSING") || msg.includes("API key missing")) {
      setChatError(msg);
    } else if (msg.includes("API key is missing")) {
      // Direct AI SDK provider error (e.g. OPENAI_API_KEY)
      setChatError(
        "API key missing for the selected provider. Please configure it in Settings > Providers."
      );
    } else {
      setChatError(msg);
    }
  }, [error]);

  React.useEffect(() => {
    if (!conversationId) return;
    setIsLoadingConversation(true);
    api.conversations
      .get(conversationId)
      .then((conv) => {
        if (conv.messages?.length) {
          const uiMessages = conv.messages.map((m: any) => {
            const parts: any[] = [];

            // Reconstruct tool parts from metadata
            if (m.metadata?.toolParts) {
              for (const tp of m.metadata.toolParts) {
                parts.push({
                  type: `tool-${tp.toolName}`,
                  state: "output-available",
                  toolCallId: `${tp.toolName}-${m.id}`,
                  toolName: tp.toolName,
                  input: tp.input,
                  output: tp.output,
                });
              }
            }

            // Add text part
            if (m.content) {
              parts.push({ type: "text" as const, text: m.content });
            }

            const uiMsg: any = {
              id: m.id,
              role: m.role,
              parts,
              createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
            };
            if (m.metadata?.qualityScore) {
              uiMsg.qualityScore = m.metadata.qualityScore;
            }
            return uiMsg;
          });
          setMessages(uiMessages);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingConversation(false));
  }, [conversationId, setMessages]);

  React.useEffect(() => {
    if (clearChatRef) {
      clearChatRef.current = () => {
        setMessages([]);
        setInput("");
        redirectedRef.current = false;
      };
    }
    return () => {
      if (clearChatRef) {
        clearChatRef.current = null;
      }
    };
  }, [clearChatRef, setMessages]);

  const modelHasApiKey = useChatHeaderStore((s) => s.modelHasApiKey);

  const handleSubmit = React.useCallback(() => {
    if (!input.trim() || isStreaming) return;
    if (!modelHasApiKey) {
      setChatError(
        "API key missing for the selected provider. Please configure it in Settings > Providers."
      );
      return;
    }
    inputSnapshotRef.current = input.trim();
    sendMessage({ text: input });
    setInput("");
    setTrigger(undefined);
  }, [input, isStreaming, sendMessage, modelHasApiKey]);

  const handleSuggestionClick = React.useCallback(
    (suggestion: string) => {
      if (isStreaming) return;
      if (!modelHasApiKey) {
        setChatError(
          "API key missing for the selected provider. Please configure it in Settings > Providers."
        );
        return;
      }
      inputSnapshotRef.current = suggestion;
      sendMessage({ text: suggestion });
    },
    [isStreaming, sendMessage, modelHasApiKey]
  );

  const handlePromptSelect = React.useCallback(
    (promptInput: string, promptTrigger?: string) => {
      if (isStreaming) return;
      if (!modelHasApiKey) {
        setChatError(
          "API key missing for the selected provider. Please configure it in Settings > Providers."
        );
        return;
      }
      if (promptTrigger) setTrigger(promptTrigger);
      inputSnapshotRef.current = promptInput;
      sendMessage({ text: promptInput });
    },
    [isStreaming, sendMessage, modelHasApiKey]
  );

  return (
    <ChatRuntimeProvider
      conversationId={conversationId}
      selectedModelId={selectedModelId}
      connectionId={connectionId}
      writeMode={writeMode}
      clearChatRef={clearChatRef}
    >
        <AlertDialog open={!!chatError} onOpenChange={(open) => !open && setChatError(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Configuration Error
              </AlertDialogTitle>
              <AlertDialogDescription>{chatError}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setChatError(null)}>
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <div className="aui-thread grid h-full min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] overflow-hidden">
          {isLoadingConversation ? (
            <MessageListSkeleton />
          ) : (
            <MessageList
              messages={messages}
              isStreaming={isStreaming}
              status={status}
              onSuggestionClick={handleSuggestionClick}
              connectionId={connectionId}
            />
          )}
          <Composer
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            onStop={stop}
            isLoading={isStreaming}
            writeMode={writeMode}
            onWriteModeChange={connectionId ? setWriteMode : undefined}
            trigger={trigger}
            onTriggerChange={connectionId ? setTrigger : undefined}
            connectionId={connectionId}
            onPromptSelect={connectionId ? handlePromptSelect : undefined}
            disabled={isLoadingConversation}
          />
        </div>
    </ChatRuntimeProvider>
  );
}
