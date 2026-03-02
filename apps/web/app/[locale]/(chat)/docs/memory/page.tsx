"use client";

import * as React from "react";
import { Database, Play, Copy, Check, GitBranch, Layers, Terminal } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABLES = [
  {
    name: "conversations",
    desc: "Threads de chat par utilisateur",
    columns: [
      { name: "id", type: "uuid", pk: true },
      { name: "user_id", type: "text", fk: "user" },
      { name: "title", type: "text" },
      { name: "starred", type: "boolean" },
      { name: "archived", type: "boolean" },
      { name: "folder_id", type: "uuid", fk: "folders" },
      { name: "created_at", type: "timestamp" },
      { name: "updated_at", type: "timestamp" },
    ],
  },
  {
    name: "messages",
    desc: "Messages texte (texte seul, pas les tool calls)",
    columns: [
      { name: "id", type: "uuid", pk: true },
      { name: "conversation_id", type: "uuid", fk: "conversations" },
      { name: "role", type: "text" },
      { name: "content", type: "text" },
      { name: "metadata", type: "jsonb" },
      { name: "created_at", type: "timestamp" },
    ],
  },
  {
    name: "memorized_queries",
    desc: "Requêtes SQL sauvegardées (bookmarks)",
    columns: [
      { name: "id", type: "uuid", pk: true },
      { name: "user_id", type: "text", fk: "user" },
      { name: "nl_query", type: "text" },
      { name: "sql_query", type: "text" },
    ],
  },
  {
    name: "audit_logs",
    desc: "Log des mutations SQL exécutées",
    columns: [
      { name: "id", type: "uuid", pk: true },
      { name: "user_id", type: "text", fk: "user" },
      { name: "action", type: "text" },
      { name: "sql_executed", type: "text" },
      { name: "duration_ms", type: "integer" },
    ],
  },
];

const RELATIONS = [
  { from: "user", to: "conversations", label: "owns" },
  { from: "user", to: "memorized_queries", label: "owns" },
  { from: "user", to: "audit_logs", label: "triggers" },
  { from: "conversations", to: "messages", label: "contains" },
  { from: "folders", to: "conversations", label: "groups" },
];

type ApiRunState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: string; statusCode: number; durationMs: number }
  | { status: "error"; message: string; statusCode?: number };

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

export default function MemoryDocsPage() {
  const [runState, setRunState] = React.useState<ApiRunState>({ status: "idle" });
  const [copied, setCopied] = React.useState(false);
  const apiUrl = `${API_URL}/api/v1/memory-schema`;

  const runRequest = async () => {
    setRunState({ status: "loading" });
    const start = performance.now();
    try {
      const res = await fetch(apiUrl, { credentials: "include" });
      const durationMs = Math.round(performance.now() - start);
      const text = await res.text();
      if (!res.ok) {
        setRunState({
          status: "error",
          message: text || res.statusText,
          statusCode: res.status,
        });
        return;
      }
      const json = JSON.parse(text);
      setRunState({
        status: "success",
        data: JSON.stringify(json, null, 2),
        statusCode: res.status,
        durationMs,
      });
    } catch (e) {
      setRunState({
        status: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const copyCurl = () => {
    const curl = `curl -X GET "${apiUrl}"`;
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex flex-col gap-4 p-4">
        <p className="mb-4 text-sm text-muted-foreground">
          Schéma de persistance, flux de données et remontée vers le client
        </p>

        <Tabs defaultValue="schema" className="flex flex-1 flex-col">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="schema" className="gap-1.5">
              <Database className="size-4" />
              Schéma
            </TabsTrigger>
            <TabsTrigger value="flux" className="gap-1.5">
              <GitBranch className="size-4" />
              Flux
            </TabsTrigger>
            <TabsTrigger value="persisted" className="gap-1.5">
              <Layers className="size-4" />
              Persisté
            </TabsTrigger>
            <TabsTrigger value="remontee" className="gap-1.5">
              Remontée
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-1.5">
              <Terminal className="size-4" />
              API
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schema" className="mt-4 flex-1">
            <p className="mb-6 text-sm text-muted-foreground">
              Conversations et messages persistés en PostgreSQL. Seul le texte
              des messages est stocké — les tool calls ne sont pas sauvegardés.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {TABLES.map((table) => (
                <Card key={table.name} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-mono text-base">
                      {table.name}
                    </CardTitle>
                    <CardDescription>{table.desc}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1.5 rounded-lg bg-muted/50 p-3 font-mono text-xs">
                      {table.columns.map((col) => (
                        <div
                          key={col.name}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="text-foreground">{col.name}</span>
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            {col.pk && (
                              <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                PK
                              </span>
                            )}
                            {col.fk && (
                              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                FK
                              </span>
                            )}
                            <span>{col.type}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-6 rounded-lg border bg-muted/30 p-4">
              <h3 className="mb-3 text-sm font-medium">Relations</h3>
              <div className="flex flex-wrap gap-2">
                {RELATIONS.map((r) => (
                  <span
                    key={`${r.from}-${r.to}`}
                    className="rounded-md bg-background px-2.5 py-1 font-mono text-xs"
                  >
                    {r.from} → {r.to}
                    <span className="ml-1 text-muted-foreground">
                      ({r.label})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="flux" className="mt-4 flex-1">
            <div className="space-y-2">
              {[
                "U ouvre /c/[id] → ChatShell GET /conversations/:id → setMessages(uiMessages)",
                "U envoie message → useChat POST /chat → API INSERT user msg → streamText(LLM)",
                "Stream SSE → useChat → onFinish INSERT assistant msg + UPDATE conversations.updated_at",
              ].map((step, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-2.5 text-sm"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
                    {i + 1}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="persisted" className="mt-4 flex-1">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    Persisté
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• conversations</li>
                    <li>• messages.content</li>
                    <li>• memorized_queries</li>
                    <li>• audit_logs</li>
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    Non persisté
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• messages.parts (tool calls)</li>
                    <li>• streaming state</li>
                    <li>• metadata des tool invocations</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="remontee" className="mt-4 flex-1">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="mb-3 text-sm text-muted-foreground">
                Les messages DB sont mappés vers UIMessage :
              </p>
              <pre className="overflow-x-auto rounded-lg bg-background p-4 font-mono text-xs">
                <code>{`conv.messages.map((m) => ({
  id: m.id,
  role: m.role,
  parts: [{ type: "text", text: m.content || "" }],
  createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
}))`}</code>
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="api" className="mt-4 flex-1">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-mono text-sm">
                  GET /api/v1/memory-schema
                </CardTitle>
                <CardDescription>
                  Retourne toutes tes mémoires : conversations, messages,
                  requêtes sauvegardées, audit logs (auth requise)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 font-mono text-xs text-zinc-100 shadow-xl">
                  <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex gap-1.5">
                        <span className="size-2.5 rounded-full bg-red-500/80" />
                        <span className="size-2.5 rounded-full bg-amber-500/80" />
                        <span className="size-2.5 rounded-full bg-emerald-500/80" />
                      </span>
                      <span className="text-zinc-500">Terminal</span>
                      {runState.status === "success" && (
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-400">
                          {runState.statusCode} • {runState.durationMs}ms
                        </span>
                      )}
                      {runState.status === "error" && (
                        <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-400">
                          {runState.statusCode ?? "Error"}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 rounded-md px-2.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                        onClick={copyCurl}
                      >
                        {copied ? (
                          <Check className="size-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                        {copied ? "Copié" : "Copier"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 rounded-md bg-emerald-600/20 px-2.5 text-xs text-emerald-400 hover:bg-emerald-600/30 hover:text-emerald-300 disabled:opacity-50"
                        onClick={runRequest}
                        disabled={runState.status === "loading"}
                      >
                        <Play className="size-3.5" />
                        {runState.status === "loading"
                          ? "Requesting..."
                          : "Run"}
                      </Button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-zinc-500">
                      <span className="text-emerald-500/80">$</span> curl -X
                      GET &quot;{apiUrl}&quot;
                    </div>
                    {runState.status === "loading" && (
                      <div className="mt-3 flex items-center gap-2 text-zinc-500">
                        <span className="inline-block size-2 animate-pulse rounded-full bg-emerald-500" />
                        Fetching...
                      </div>
                    )}
                    {runState.status === "success" && (
                      <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-md bg-zinc-900/50 p-3 text-zinc-300">
                        {runState.data}
                      </pre>
                    )}
                    {runState.status === "error" && (
                      <pre className="mt-4 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-md bg-red-950/30 p-3 text-red-400">
                        {runState.message}
                      </pre>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
