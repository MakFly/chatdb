"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ArrowDown, Sparkles, ChevronRight } from "lucide-react";
import { MessageItem, AssistantThinkingItem } from "./message-item";
import type { UIMessage } from "ai";
import { cn } from "@/lib/utils";

interface MessageListProps {
  messages: UIMessage[];
  isStreaming?: boolean;
  status?: string;
  onSuggestionClick?: (text: string) => void;
  suggestions?: string[];
  connectionId?: string;
}

const DEFAULT_SUGGESTIONS = [
  "Montre-moi le schéma de ma base",
  "Quels sont les 10 meilleurs produits par revenu ?",
  "Trouve les utilisateurs inscrits la semaine dernière",
];

export function MessageList({
  messages,
  isStreaming,
  status,
  onSuggestionClick,
  suggestions = DEFAULT_SUGGESTIONS,
  connectionId,
}: MessageListProps) {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = React.useState(true);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const prevMessageCountRef = React.useRef(messages.length);

  const scrollToBottom = React.useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    setUnreadCount(0);
  }, []);

  const rafRef = React.useRef<number | null>(null);

  // Auto-scroll when at bottom or streaming (throttled via RAF)
  React.useEffect(() => {
    if (!isAtBottom && !isStreaming) return;

    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      scrollToBottom();
    });

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [messages, isStreaming, isAtBottom, scrollToBottom]);

  // Track unread messages when not at bottom
  React.useEffect(() => {
    const newCount = messages.length - prevMessageCountRef.current;
    if (newCount > 0 && !isAtBottom) {
      setUnreadCount((prev) => prev + newCount);
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length, isAtBottom]);

  // Reset unread when scrolling to bottom
  React.useEffect(() => {
    if (isAtBottom) setUnreadCount(0);
  }, [isAtBottom]);

  const handleScroll = React.useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const { scrollTop, scrollHeight, clientHeight } = viewport;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
  }, []);

  const lastMessage = messages[messages.length - 1];
  const showThinkingPlaceholder =
    status === "submitted" && lastMessage?.role === "user" && messages.length > 0;

  /* ─── Welcome screen ─── */
  if (messages.length === 0 && !showThinkingPlaceholder) {
    return (
      <div className="aui-thread-welcome flex h-full min-h-0 flex-col items-center justify-center overflow-y-auto px-4 py-8">
        <div className="max-w-lg space-y-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl ring-1 ring-primary/10 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
              Comment puis-je vous aider ?
            </h1>
            <p className="text-muted-foreground">
              Interrogez vos bases de données, explorez les schémas, analysez
              vos données.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onSuggestionClick?.(suggestion)}
                className={cn(
                  "group flex items-center gap-3 rounded-xl border bg-background px-4 py-3 text-left text-sm",
                  "transition-all hover:bg-muted hover:shadow-sm"
                )}
              >
                <span className="flex-1">{suggestion}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ─── Message list ─── */
  return (
    <div className="aui-thread-viewport relative h-full min-h-0">
      <div
        ref={viewportRef}
        onScroll={handleScroll}
        className="h-full overflow-x-hidden overflow-y-auto scrollbar-hide"
      >
        <div className="mx-auto max-w-[44rem] overflow-hidden px-4 pb-4 pt-8">
          {messages.map((message, index) => (
            <MessageItem
              key={message.id}
              message={message}
              isStreaming={isStreaming && index === messages.length - 1}
              isLast={index === messages.length - 1}
              connectionId={connectionId}
            />
          ))}
          {showThinkingPlaceholder && <AssistantThinkingItem />}
          <div ref={bottomRef} className="h-px" />
        </div>
      </div>

      {/* Scroll-to-bottom pill */}
      {!isAtBottom && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <button
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-sm",
              "backdrop-blur-md bg-background/80 shadow-lg",
              "transition-all hover:bg-background hover:shadow-xl"
            )}
            onClick={scrollToBottom}
          >
            <ArrowDown className="h-3.5 w-3.5" />
            {unreadCount > 0
              ? `${unreadCount} nouveau${unreadCount > 1 ? "x" : ""} message${unreadCount > 1 ? "s" : ""}`
              : "Défiler vers le bas"}
          </button>
        </div>
      )}
    </div>
  );
}
