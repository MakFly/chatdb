"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { ArrowUp, Square, Pencil, Trash2, CheckCircle2, XCircle, AlertCircle, Plus, Database, FileQuestion } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useMutationStore } from "@/lib/stores/mutation-store";
import { QuickPrompts } from "@/components/chat/quick-prompts";

export interface WriteMode {
  update: boolean;
  delete: boolean;
}

interface ComposerProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  writeMode?: WriteMode;
  onWriteModeChange?: (mode: WriteMode) => void;
  trigger?: string;
  onTriggerChange?: (t: string | undefined) => void;
  connectionId?: string;
  onPromptSelect?: (input: string, trigger?: string) => void;
}

export function Composer({
  input,
  onInputChange,
  onSubmit,
  onStop,
  isLoading,
  disabled,
  writeMode = { update: false, delete: false },
  onWriteModeChange,
  trigger,
  onTriggerChange,
  connectionId,
  onPromptSelect,
}: ComposerProps) {
  const t = useTranslations("chat.composer");
  const tCommon = useTranslations("common");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
    }
  }, [input]);

  React.useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading && !disabled) {
        onSubmit();
      }
    }
  };

  const { pendingMutation, feedbackState, feedbackMessage, setFeedback } =
    useMutationStore();
  const canSend = input.trim().length > 0 && !isLoading && !disabled;

  const [showWriteOptions, setShowWriteOptions] = React.useState(false);
  const anyWriteMode = writeMode.update || writeMode.delete;
  const anyOption = anyWriteMode || !!trigger;
  const dotColor = writeMode.update
    ? "bg-amber-500"
    : writeMode.delete
      ? "bg-destructive"
      : trigger === "explain"
        ? "bg-blue-500"
        : trigger
          ? "bg-emerald-500"
          : "";

  // Toast + auto-dismiss feedback after 3s
  React.useEffect(() => {
    if (!feedbackState) return;
    if (feedbackState === "success") toast.success(feedbackMessage);
    else if (feedbackState === "error") toast.error(feedbackMessage);
    else if (feedbackState === "cancelled") toast(feedbackMessage ?? t("mutationCancelled"));
    const timer = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [feedbackState, feedbackMessage, setFeedback]);

  return (
    <div className="aui-composer shrink-0 pb-4 pt-2 md:pb-6">
      <div className="mx-auto max-w-[44rem] px-4">
        {/* Mutation feedback bar */}
        {feedbackState && (
          <div
            className={cn(
              "mb-2 flex items-center gap-3 rounded-xl border px-4 py-3 transition-all",
              feedbackState === "success" &&
                "border-emerald-500/30 bg-emerald-500/5",
              feedbackState === "error" &&
                "border-destructive/30 bg-destructive/5",
              feedbackState === "cancelled" &&
                "border-border bg-muted/30",
            )}
          >
            {feedbackState === "success" && (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
            )}
            {feedbackState === "error" && (
              <AlertCircle className="size-4 shrink-0 text-destructive" />
            )}
            {feedbackState === "cancelled" && (
              <XCircle className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span className="flex-1 text-sm text-foreground">
              {feedbackMessage}
            </span>
          </div>
        )}
        {/* Quick prompts — shown when textarea is empty and connection is active */}
        {connectionId && !input.trim() && onPromptSelect && (
          <QuickPrompts
            connectionId={connectionId}
            onPromptSelect={onPromptSelect}
            className="mb-2"
          />
        )}
        {/* Mutation confirmation bar */}
        {pendingMutation && !feedbackState && (
          <div className="mb-2 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
            <span className="flex-1 text-sm text-foreground">
              <span className="font-medium text-amber-600 dark:text-amber-400">
                {pendingMutation.mutationType}
              </span>
              {" — "}
              {t("rowsAffected", { count: pendingMutation.previewCount })}
            </span>
            <Button
              size="sm"
              variant="default"
              className="gap-1.5"
              onClick={pendingMutation.onConfirm}
            >
              <CheckCircle2 className="size-3.5" />
              {tCommon("confirm")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={pendingMutation.onCancel}
            >
              <XCircle className="size-3.5" />
              {tCommon("cancel")}
            </Button>
          </div>
        )}
        <div className="aui-composer-root relative flex w-full flex-col">
          <div
            className={cn(
              "aui-composer-attachment-dropzone flex w-full flex-col rounded-2xl",
              "border border-input bg-background px-1 pt-2",
              "outline-none transition-shadow",
              "has-[textarea:focus-visible]:border-ring",
              "has-[textarea:focus-visible]:ring-2 has-[textarea:focus-visible]:ring-ring/20",
            )}
          >
            {/* Write mode badges — shown above textarea when toggled */}
            {onWriteModeChange && showWriteOptions && (
              <div className="flex items-center gap-1.5 px-3 pt-1 pb-0.5">
                <Badge
                  variant="outline"
                  className={cn(
                    "cursor-pointer gap-1 px-2 py-1 transition-colors hover:bg-amber-500/10",
                    writeMode.update &&
                      "border-amber-500/50 bg-amber-500/20 text-amber-600 dark:text-amber-400",
                  )}
                  onClick={() => {
                    const next = { ...writeMode, update: !writeMode.update };
                    onWriteModeChange(next);
                    toast(next.update ? t("updateEnabled") : t("updateDisabled"));
                  }}
                  aria-pressed={writeMode.update}
                  aria-label="Activer UPDATE"
                >
                  <Pencil className="size-3" />
                  UPDATE
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "cursor-pointer gap-1 px-2 py-1 transition-colors hover:bg-destructive/10",
                    writeMode.delete &&
                      "border-destructive/50 bg-destructive/20 text-destructive",
                  )}
                  onClick={() => {
                    const next = { ...writeMode, delete: !writeMode.delete };
                    onWriteModeChange(next);
                    toast(next.delete ? t("deleteEnabled") : t("deleteDisabled"));
                  }}
                  aria-pressed={writeMode.delete}
                  aria-label="Activer DELETE"
                >
                  <Trash2 className="size-3" />
                  DELETE
                </Badge>
                {onTriggerChange && (
                  <>
                    <Badge
                      variant="outline"
                      className={cn(
                        "cursor-pointer gap-1 px-2 py-1 transition-colors hover:bg-emerald-500/10",
                        trigger === "schema" &&
                          "border-emerald-500/50 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
                      )}
                      onClick={() => {
                        const next = trigger === "schema" ? undefined : "schema";
                        onTriggerChange(next);
                        toast(next ? t("schemaEnabled") : t("schemaDisabled"));
                      }}
                      aria-pressed={trigger === "schema"}
                      aria-label="Activer Schéma DB"
                    >
                      <Database className="size-3" />
                      {t("schemaDb")}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "cursor-pointer gap-1 px-2 py-1 transition-colors hover:bg-blue-500/10",
                        trigger === "explain" &&
                          "border-blue-500/50 bg-blue-500/20 text-blue-600 dark:text-blue-400",
                      )}
                      onClick={() => {
                        const next = trigger === "explain" ? undefined : "explain";
                        onTriggerChange(next);
                        toast(next ? t("explainEnabled") : t("explainDisabled"));
                      }}
                      aria-pressed={trigger === "explain"}
                      aria-label="Activer Explain"
                    >
                      <FileQuestion className="size-3" />
                      {t("explain")}
                    </Badge>
                  </>
                )}
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("placeholder")}
              className={cn(
                "aui-composer-input mb-1 max-h-32 min-h-14 w-full resize-none",
                "bg-transparent px-4 pt-2 pb-3 text-sm outline-none",
                "placeholder:text-muted-foreground focus-visible:ring-0",
              )}
              rows={1}
              disabled={isLoading || disabled}
              autoFocus
              aria-label={t("messageInput")}
            />

            <div className="aui-composer-action-wrapper relative mx-2 mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {onWriteModeChange && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full size-8"
                    onClick={() => setShowWriteOptions((v) => !v)}
                    aria-label={t("writeOptions")}
                  >
                    <Plus className="size-4" />
                    {anyOption && (
                      <span
                        className={cn(
                          "absolute top-0 right-0 size-2 rounded-full",
                          dotColor,
                        )}
                      />
                    )}
                  </Button>
                )}
              </div>
              {isLoading ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="default"
                      size="icon"
                      className="aui-composer-cancel size-8 rounded-full"
                      onClick={onStop}
                      aria-label={t("stop")}
                    >
                      <Square className="aui-composer-cancel-icon size-3 fill-current" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {t("stop")}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="default"
                      size="icon"
                      className={cn(
                        "aui-composer-send size-8 rounded-full transition-opacity",
                        !canSend && "opacity-30 pointer-events-none",
                      )}
                      disabled={!canSend}
                      onClick={onSubmit}
                      aria-label={t("send")}
                    >
                      <ArrowUp className="aui-composer-send-icon size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{t("send")}</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
