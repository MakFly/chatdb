"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Cloud,
  Search,
  Calculator,
  Loader2,
  Check,
  AlertCircle,
  Copy,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Bot,
  Database,
  Terminal,
} from "lucide-react";
import type { UIMessage } from "ai";
import { SchemaDisplay, type GetSchemaOutput } from "@/components/chat/schema-display";
import { api } from "@/lib/api-client";
import { useMutationStore } from "@/lib/stores/mutation-store";


/* ─── TextStreamAnimator (adapted from assistant-ui/useSmooth.ts) ─── */
class TextStreamAnimator {
  private animationFrameId: number | null = null;
  private lastUpdateTime: number = Date.now();
  public targetText: string = "";

  constructor(
    public currentText: string,
    private setText: (newText: string) => void,
  ) {}

  start() {
    if (this.animationFrameId !== null) return;
    this.lastUpdateTime = Date.now();
    this.animate();
  }

  stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private animate = () => {
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastUpdateTime;
    let timeToConsume = deltaTime;

    const remainingChars = this.targetText.length - this.currentText.length;
    if (remainingChars <= 0) return;
    const baseTimePerChar = Math.min(5, 250 / remainingChars);

    let charsToAdd = 0;
    while (timeToConsume >= baseTimePerChar && charsToAdd < remainingChars) {
      charsToAdd++;
      timeToConsume -= baseTimePerChar;
    }

    if (charsToAdd !== remainingChars) {
      this.animationFrameId = requestAnimationFrame(this.animate);
    } else {
      this.animationFrameId = null;
    }
    if (charsToAdd === 0) return;

    this.currentText = this.targetText.slice(
      0,
      this.currentText.length + charsToAdd,
    );
    this.lastUpdateTime = currentTime - timeToConsume;
    this.setText(this.currentText);
  };
}

/* ─── useSmooth hook (adapted from assistant-ui/useSmooth.ts) ─── */
function useSmooth(text: string, isStreaming: boolean): { text: string; isAnimating: boolean } {
  const safeText = text ?? "";
  const [displayedText, setDisplayedText] = React.useState(isStreaming ? "" : safeText);

  const [animator] = React.useState(
    () => new TextStreamAnimator(isStreaming ? "" : safeText, setDisplayedText),
  );

  React.useEffect(() => {
    animator["setText"] = setDisplayedText;
  }, [animator]);

  React.useEffect(() => {
    if (!isStreaming) {
      animator.stop();
      setDisplayedText(safeText);
      animator.currentText = safeText;
      animator.targetText = safeText;
      return;
    }

    if (!safeText.startsWith(animator.targetText)) {
      setDisplayedText("");
      animator.currentText = "";
    }

    animator.targetText = safeText;
    animator.start();

    return () => animator.stop();
  }, [safeText, isStreaming, animator]);

  React.useEffect(() => {
    return () => animator.stop();
  }, [animator]);

  return {
    text: displayedText,
    isAnimating: displayedText !== safeText,
  };
}

/* ─── ThinkingDots (JS-based, replaces CSS content animation) ─── */
function ThinkingDots() {
  const [dots, setDots] = React.useState("");
  React.useEffect(() => {
    const timer = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(timer);
  }, []);
  return <span>{dots}</span>;
}

/* ─── Streaming text part: markdown with fade-in animation ─── */
function StreamingTextPart({
  text,
  isStreaming,
}: {
  text: string;
  isStreaming: boolean;
}) {
  const safeText = text ?? "";
  const smooth = useSmooth(safeText, isStreaming);
  const isAnimating = smooth.isAnimating;

  return (
    <div
      className={cn("aui-text", isAnimating && "aui-streaming")}
      data-status={isAnimating ? "running" : "done"}
    >
      <MarkdownContent content={smooth.text} />
    </div>
  );
}

/* ─── SQL code block preprocessor ─── */
const SQL_KEYWORDS =
  /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH|EXPLAIN|TRUNCATE)\b/i;
const SQL_STATEMENT = new RegExp(
  `(${SQL_KEYWORDS.source}[\\s\\S]*?;)`,
  "gi",
);

function preprocessSqlBlocks(content: string): string {
  if (content.trimStart().startsWith("```")) return content;

  // 1) Wrap SQL that appears inline (e.g. "voici : UPDATE users SET ...")
  const wrapInlineSql = (text: string) =>
    text.replace(SQL_STATEMENT, (match) => `\n\`\`\`sql\n${match.trim()}\n\`\`\`\n`);

  // 2) Line-by-line: detect SQL blocks not yet in ```
  const sqlKeywordsLine = /^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH|EXPLAIN|TRUNCATE)\b/i;
  const lines = content.split("\n");
  const result: string[] = [];
  let inCodeBlock = false;
  let sqlBuffer: string[] = [];

  const flushSql = () => {
    if (sqlBuffer.length > 0) {
      result.push("```sql", ...sqlBuffer, "```");
      sqlBuffer = [];
    }
  };

  for (const line of lines) {
    if (line.trimStart().startsWith("```")) {
      flushSql();
      inCodeBlock = !inCodeBlock;
      result.push(line);
      continue;
    }
    if (inCodeBlock) {
      result.push(line);
      continue;
    }

    const trimmed = line.trim();
    if (sqlBuffer.length === 0 && sqlKeywordsLine.test(trimmed)) {
      sqlBuffer.push(line);
    } else if (
      sqlBuffer.length > 0 &&
      trimmed &&
      !trimmed.startsWith("#") &&
      !trimmed.startsWith("-") &&
      !trimmed.startsWith("*")
    ) {
      sqlBuffer.push(line);
      if (trimmed.endsWith(";")) {
        flushSql();
      }
    } else {
      flushSql();
      result.push(line);
    }
  }
  flushSql();

  let out = result.join("\n");
  // 3) Fallback: wrap any remaining SQL in plain text (e.g. inline, odd formatting)
  const parts = out.split(/(```[\s\S]*?```)/g);
  out = parts
    .map((part) =>
      part.startsWith("```") ? part : wrapInlineSql(part),
    )
    .join("");
  return out;
}

/* ─── Markdown renderer (memoized) ─── */
const MarkdownContent = React.memo(function MarkdownContent({
  content,
}: {
  content: string;
}) {
  const processed = React.useMemo(() => preprocessSqlBlocks(content), [content]);
  return (
    <div className="aui-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {processed}
      </ReactMarkdown>
    </div>
  );
});

/* ─── Helper: normalize tool part name from typed or dynamic format ─── */
function getToolPartName(part: { type: string; toolName?: string }): string | null {
  if (part.type === "dynamic-tool") return part.toolName ?? null;
  if (part.type.startsWith("tool-")) return part.type.slice(5);
  return null;
}

/* ─── Main component ─── */
interface MessageItemProps {
  message: UIMessage;
  isStreaming?: boolean;
  isLast?: boolean;
  connectionId?: string;
}

function MessageItemInner({
  message,
  isStreaming,
  isLast,
  connectionId,
}: MessageItemProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = React.useState(false);

  const textContent = React.useMemo(() => {
    if (message.parts?.length) {
      const fromParts = message.parts
        .filter((p) => p.type === "text")
        .map((p) => (p as { type: "text"; text: string }).text)
        .join("");
      if (fromParts.trim()) return fromParts;
    }
    const content = (message as any).content;
    if (typeof content === "string" && content.trim()) return content;
    return "";
  }, [message]);

  const handleCopy = React.useCallback(() => {
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [textContent]);

  /* ─── User message ─── */
  if (isUser) {
    return (
      <div className="aui-user-message group flex justify-end py-2">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary/8 dark:bg-primary/12 px-5 py-2.5">
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
            {textContent}
          </p>
        </div>
      </div>
    );
  }

  /* ─── Assistant thinking state ─── */
  const showThinkingState = isStreaming && !textContent.trim();

  /* ─── Dedup getSchema + group executeSQL ─── */
  const processedParts = React.useMemo(() => {
    const parts = message.parts || [];
    const result: typeof parts = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      // Dedup getSchema: same filter → keep latest with output
      const toolName = getToolPartName(part as any);
      if (toolName === "getSchema") {
        const prevIdx = result.findLastIndex((p) => getToolPartName(p as any) === "getSchema");
        if (prevIdx !== -1) {
          const prev = result[prevIdx] as any;
          if ((prev.input?.tableNameFilter ?? "") === ((part as any).input?.tableNameFilter ?? "")) {
            result[prevIdx] = part;
            continue;
          }
        }
      }

      // Group consecutive executeSQL into a single wrapper part
      if (toolName === "executeSQL") {
        const lastResult = result[result.length - 1];
        if (lastResult && (lastResult as any).__groupedSql) {
          (lastResult as any).__groupedParts.push(part);
          continue;
        }
        // Start a new group
        result.push({ ...part, __groupedSql: true, __groupedParts: [part] } as any);
        continue;
      }

      result.push(part);
    }
    return result;
  }, [message.parts]);

  return (
    <div className="aui-assistant-message group py-4">
      <div className="min-w-0 space-y-3">
        {showThinkingState && (
          <div className="flex items-center gap-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">
              Réflexion en cours<ThinkingDots />
            </span>
          </div>
        )}

        {!showThinkingState &&
          processedParts.map((part, index) => {
            const partKey = `${message.id ?? index}-${index}`;
            switch (part.type) {
              case "text": {
                return (
                  <StreamingTextPart
                    key={partKey}
                    text={part.text}
                    isStreaming={!!isStreaming}
                  />
                );
              }

              default: {
                const toolName = getToolPartName(part as any);
                if (!toolName) return null;
                const toolPart = part as any;
                switch (toolName) {
                  case "getWeather":
                    return (
                      <ToolInvocation
                        key={partKey}
                        icon={Cloud}
                        name="Weather"
                        state={toolPart.state}
                      >
                        {toolPart.state === "input-streaming" && (
                          <span className="text-muted-foreground">
                            Looking up weather...
                          </span>
                        )}
                        {toolPart.state === "input-available" && (
                          <span className="text-muted-foreground">
                            Getting weather for {toolPart.input?.city}...
                          </span>
                        )}
                        {toolPart.state === "output-available" && (
                          <span>
                            {toolPart.input?.city}: {toolPart.output?.temperature}
                            {toolPart.output?.unit}, {toolPart.output?.weather}
                          </span>
                        )}
                        {toolPart.state === "output-error" && (
                          <span className="text-destructive">{toolPart.errorText}</span>
                        )}
                      </ToolInvocation>
                    );

                  case "searchWeb":
                    return (
                      <ToolInvocation
                        key={partKey}
                        icon={Search}
                        name="Search"
                        state={toolPart.state}
                      >
                        {toolPart.state === "input-streaming" && (
                          <span className="text-muted-foreground">
                            Preparing search...
                          </span>
                        )}
                        {toolPart.state === "input-available" && (
                          <span className="text-muted-foreground">
                            Searching &ldquo;{toolPart.input?.query}&rdquo;...
                          </span>
                        )}
                        {toolPart.state === "output-available" && (
                          <span>Found {toolPart.output?.results?.length} results</span>
                        )}
                        {toolPart.state === "output-error" && (
                          <span className="text-destructive">{toolPart.errorText}</span>
                        )}
                      </ToolInvocation>
                    );

                  case "getSchema":
                    return (
                      <ToolInvocation
                        key={partKey}
                        icon={Database}
                        name="Schéma DB"
                        state={toolPart.state}
                      >
                        {toolPart.state === "input-streaming" && (
                          <span className="text-muted-foreground">
                            Récupération du schéma...
                          </span>
                        )}
                        {toolPart.state === "input-available" && (
                          <span className="text-muted-foreground">
                            Lecture du schéma{toolPart.input?.tableNameFilter ? ` (filtre: ${toolPart.input.tableNameFilter})` : ""}...
                          </span>
                        )}
                        {toolPart.state === "output-available" && (
                          !toolPart.output ? (
                            <span className="text-muted-foreground">Schéma récupéré</span>
                          ) : toolPart.output.error ? (
                            <span className="text-destructive">{toolPart.output.error}</span>
                          ) : (
                            <SchemaDisplay output={toolPart.output as GetSchemaOutput} />
                          )
                        )}
                        {toolPart.state === "output-error" && (
                          <span className="text-destructive">{toolPart.errorText}</span>
                        )}
                      </ToolInvocation>
                    );

                  case "executeSQL": {
                    const groupedParts: any[] = toolPart.__groupedParts || [toolPart];
                    const isGrouped = groupedParts.length > 1;
                    return (
                      <ToolInvocation
                        key={partKey}
                        icon={Terminal}
                        name={isGrouped ? `Requêtes SQL (${groupedParts.length})` : "Requête SQL"}
                        state={toolPart.state}
                      >
                        {groupedParts.map((sqlPart: any, sqlIdx: number) => (
                          <SqlInvocationContent key={sqlIdx} part={sqlPart} isGrouped={isGrouped} index={sqlIdx} />
                        ))}
                      </ToolInvocation>
                    );
                  }

                  case "executeMutationSQL":
                    return (
                      <MutationToolInvocation
                        key={partKey}
                        part={toolPart}
                        connectionId={connectionId}
                        state={toolPart.state}
                      />
                    );

                  case "calculate":
                    return (
                      <ToolInvocation
                        key={partKey}
                        icon={Calculator}
                        name="Calculate"
                        state={toolPart.state}
                      >
                        {toolPart.state === "input-streaming" && (
                          <span className="text-muted-foreground">
                            Calculating...
                          </span>
                        )}
                        {toolPart.state === "input-available" && (
                          <span className="text-muted-foreground font-mono">
                            {toolPart.input?.expression}
                          </span>
                        )}
                        {toolPart.state === "output-available" && toolPart.output && (
                          <span className="font-mono">
                            {toolPart.output.expression} = {toolPart.output.result}
                          </span>
                        )}
                        {toolPart.state === "output-error" && (
                          <span className="text-destructive">{toolPart.errorText}</span>
                        )}
                      </ToolInvocation>
                    );

                  default:
                    return null;
                }
              }
            }
          })}

        {/* Query quality badge */}
        {!isStreaming && (message as any).qualityScore && (
          <QueryQualityBadge qualityScore={(message as any).qualityScore} />
        )}

        {/* Action bar */}
        {!isStreaming && textContent && (
          <div className="aui-action-bar flex items-center gap-1 opacity-0 group-hover:opacity-100 animate-slide-in-right">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span className="sr-only">Copy</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="sr-only">Regenerate</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export const MessageItem = React.memo(MessageItemInner);

/* ─── Thinking placeholder (exported for chat-shell) ─── */
export function AssistantThinkingItem() {
  return (
    <div className="aui-assistant-message group py-4">
      <div className="flex items-center gap-3 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm text-muted-foreground">
          Réflexion en cours<ThinkingDots />
        </span>
      </div>
    </div>
  );
}

/* ─── Single SQL invocation content (used in grouped rendering) ─── */
function SqlInvocationContent({ part, isGrouped, index }: { part: any; isGrouped: boolean; index: number }) {
  return (
    <div className={cn(isGrouped && index > 0 && "mt-3 border-t border-border/40 pt-3")}>
      {part.state === "input-streaming" && (
        <span className="text-muted-foreground">
          Préparation de la requête...
        </span>
      )}
      {part.state === "input-available" && (
        <div className="space-y-2">
          <pre className="text-muted-foreground font-mono text-xs whitespace-pre-wrap">
            {part.input?.query}
          </pre>
        </div>
      )}
      {part.state === "output-available" && (
        <div className="space-y-2">
          {part.input?.query && (
            <>
              <pre className="text-muted-foreground font-mono text-xs whitespace-pre-wrap">
                {part.input.query}
              </pre>
            </>
          )}
          {!part.output ? (
            <span className="text-muted-foreground">Requête exécutée</span>
          ) : part.output.error ? (
            <span className="text-destructive">{part.output.error}</span>
          ) : part.output.rows?.length > 0 ? (
            <SqlDataTable
              rows={part.output.rows}
              rowCount={part.output.rowCount ?? part.output.rows.length}
            />
          ) : (
            <span>
              {part.output.rowCount} ligne
              {part.output.rowCount !== 1 ? "s" : ""} retournée
              {part.output.rowCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}
      {part.state === "output-error" && (
        <span className="text-destructive">{part.errorText}</span>
      )}
    </div>
  );
}

/* ─── SQL data table (scrollable, zebra) ─── */
const VISIBLE_ROWS = 50;

function SqlDataTable({
  rows,
  rowCount,
}: {
  rows: Record<string, unknown>[];
  rowCount: number;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const cols = rows[0] ? Object.keys(rows[0]) : [];
  const visibleRows = expanded ? rows : rows.slice(0, VISIBLE_ROWS);
  const hasMore = rows.length > VISIBLE_ROWS;

  if (rows.length === 0) return null;

  return (
    <div className="space-y-2">
      <span className="text-sm text-muted-foreground">
        {rowCount} ligne{rowCount !== 1 ? "s" : ""}
      </span>
      <div className="max-h-64 overflow-auto rounded-lg border">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
            <tr>
              {cols.map((c) => (
                <th
                  key={c}
                  className="border-b px-3 py-2 text-left font-medium"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((r, i) => (
              <tr
                key={i}
                className={cn(
                  "border-b border-border/50 last:border-b-0",
                  i % 2 === 1 && "bg-muted/30"
                )}
              >
                {cols.map((c) => (
                  <td key={c} className="px-3 py-1.5">
                    {String(r[c] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && !expanded && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setExpanded(true)}
        >
          Afficher les {rows.length} lignes
        </Button>
      )}
    </div>
  );
}

/* ─── Query quality badge ─── */
function QueryQualityBadge({
  qualityScore,
}: {
  qualityScore: { score: number; issues: string[] };
}) {
  const { score, issues } = qualityScore;
  const [showIssues, setShowIssues] = React.useState(false);

  const { label, colorClass } = React.useMemo(() => {
    if (score >= 8) return { label: "Excellent", colorClass: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
    if (score >= 5) return { label: "OK", colorClass: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400" };
    return { label: "À améliorer", colorClass: "border-destructive/40 bg-destructive/10 text-destructive" };
  }, [score]);

  return (
    <div className="space-y-1.5">
      <button
        onClick={() => issues.length > 0 && setShowIssues((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
          colorClass,
          issues.length > 0 && "cursor-pointer hover:opacity-80"
        )}
      >
        <span>Qualité SQL : {score}/10 — {label}</span>
        {issues.length > 0 && (
          showIssues
            ? <ChevronUp className="h-3 w-3" />
            : <ChevronDown className="h-3 w-3" />
        )}
      </button>
      {showIssues && issues.length > 0 && (
        <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs max-w-sm">
          <ul className="space-y-1">
            {issues.map((issue, i) => (
              <li key={i} className="flex items-start gap-1.5 text-muted-foreground">
                <AlertCircle className="h-3 w-3 mt-0.5 shrink-0 text-amber-500" />
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─── Mutation tool with confirmation ─── */
function MutationToolInvocation({
  part,
  connectionId,
  state,
}: {
  part: { input?: unknown; output?: unknown; state: string };
  connectionId?: string;
  state: string;
}) {
  const output = part.output as
    | {
        requiresConfirmation?: boolean;
        query?: string;
        preview?: unknown[];
        previewCount?: number;
        error?: string;
      }
    | undefined;
  const { setPendingMutation, setFeedback } = useMutationStore();
  const [confirmState, setConfirmState] = React.useState<
    "idle" | "loading" | "success" | "error" | "cancelled"
  >("idle");
  const [execResult, setExecResult] = React.useState<{
    rowCount: number;
    rows: unknown[];
  } | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleConfirm = React.useCallback(async () => {
    if (!connectionId || !output?.query) return;
    setConfirmState("loading");
    setPendingMutation(null);
    try {
      const res = await api.chat.executeMutation(connectionId, output.query);
      setExecResult({ rowCount: res.rowCount, rows: res.rows ?? [] });
      setConfirmState("success");
      setFeedback("success", `${res.rowCount} ligne(s) modifiée(s)`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setConfirmState("error");
      setFeedback("error", msg);
    }
  }, [connectionId, output?.query, setPendingMutation, setFeedback]);

  const handleCancel = React.useCallback(() => {
    setConfirmState("cancelled");
    setPendingMutation(null);
    setFeedback("cancelled", "Mutation annulée");
  }, [setPendingMutation, setFeedback]);

  const isLoading = state === "input-streaming" || state === "input-available";
  const hasOutput = state === "output-available" || state === "output-error";
  const needsConfirmation =
    hasOutput &&
    output?.requiresConfirmation &&
    confirmState === "idle" &&
    !output?.error;

  // Publish pending mutation to context so Composer can show confirmation buttons
  React.useEffect(() => {
    if (needsConfirmation && output?.query) {
      setPendingMutation({
        query: output.query,
        mutationType:
          (part.input as { mutationType?: string })?.mutationType ?? "UPDATE",
        previewCount: output.previewCount ?? 0,
        onConfirm: handleConfirm,
        onCancel: handleCancel,
      });
    }
  }, [needsConfirmation, output?.query, output?.previewCount, part.input, handleConfirm, handleCancel, setPendingMutation]);

  return (
    <ToolInvocation
      icon={Terminal}
      name={
        (part.input as { mutationType?: string })?.mutationType === "DELETE"
          ? "Mutation DELETE"
          : "Mutation UPDATE"
      }
      state={
        confirmState === "success"
          ? "output-available"
          : confirmState === "error" || confirmState === "cancelled"
            ? "output-error"
            : state
      }
    >
      {isLoading && (
        <span className="text-muted-foreground">
          Préparation de la requête...
        </span>
      )}
      {output?.error && !output.requiresConfirmation && (
        <span className="text-destructive">{output.error}</span>
      )}
      {needsConfirmation && (
        <div className="space-y-3">
          <pre className="rounded-lg border bg-muted/30 p-3 font-mono text-xs whitespace-pre-wrap">
            {output.query}
          </pre>
          {output.previewCount != null && output.previewCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {output.previewCount} ligne(s) seront affectée(s)
            </p>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={handleConfirm}
              disabled={!connectionId}
            >
              Confirmer
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              Annuler
            </Button>
          </div>
        </div>
      )}
      {confirmState === "loading" && (
        <span className="text-muted-foreground flex items-center gap-2">
          <Loader2 className="size-3.5 animate-spin" />
          Exécution en cours...
        </span>
      )}
      {confirmState === "success" && execResult && (
        <>
          <span className="block mb-2">
            {execResult.rowCount} ligne(s) modifiée(s)
          </span>
          {execResult.rows.length > 0 && (
            <SqlDataTable
              rows={execResult.rows as Record<string, unknown>[]}
              rowCount={execResult.rowCount}
            />
          )}
        </>
      )}
      {confirmState === "error" && errorMsg && (
        <span className="text-destructive">{errorMsg}</span>
      )}
      {confirmState === "cancelled" && (
        <span className="text-muted-foreground">Annulé par l&apos;utilisateur</span>
      )}
    </ToolInvocation>
  );
}

/* ─── Tool invocation card ─── */
interface ToolInvocationProps {
  icon: React.ElementType;
  name: string;
  state: string;
  children: React.ReactNode;
}

function ToolInvocation({
  icon: Icon,
  name,
  state,
  children,
}: ToolInvocationProps) {
  const [expanded, setExpanded] = React.useState(false);
  const isLoading = state === "input-streaming" || state === "input-available";
  const isDone = state === "output-available";
  const isError = state === "output-error";

  return (
    <div className="aui-tool-invocation">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm transition-colors",
          "hover:bg-muted/50",
          isLoading && "border-amber-500/30 bg-amber-500/5",
          isDone && "border-emerald-500/30 bg-emerald-500/5",
          isError && "border-destructive/30 bg-destructive/5"
        )}
      >
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded",
            isLoading && "text-amber-500",
            isDone && "text-emerald-500",
            isError && "text-destructive"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isDone ? (
            <Check className="h-3.5 w-3.5" />
          ) : isError ? (
            <AlertCircle className="h-3.5 w-3.5" />
          ) : (
            <Icon className="h-3.5 w-3.5" />
          )}
        </span>
        <span className="font-medium">{name}</span>
        {isLoading && (
          <span className="h-1 w-16 rounded-full overflow-hidden">
            <span className="block h-full animate-shimmer rounded-full" />
          </span>
        )}
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
      {expanded && (
        <div className="mt-2 rounded-xl border bg-muted/30 px-3 py-2 text-sm">
          {children}
        </div>
      )}
    </div>
  );
}
