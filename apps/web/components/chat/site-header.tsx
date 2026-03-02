"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Database, RefreshCw } from "lucide-react";
import { HelpSheet } from "./help-sheet";
import { useChatHeaderStore, type Model } from "@/lib/stores/chat-header-store";
import { api } from "@/lib/api-client";

interface Connection {
  id: string;
  name: string;
  database: string;
  isActive: boolean;
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    selectedModelId,
    setSelectedModelId,
    selectedConnectionId,
    setSelectedConnectionId,
    setModelHasApiKey,
    models,
    setModels,
    clearChatRef,
    onRefreshRef,
  } = useChatHeaderStore();
  const [connections, setConnections] = React.useState<Connection[]>([]);
  const [isLoadingHeader, setIsLoadingHeader] = React.useState(true);

  const isChatRoute = pathname === "/c" || pathname.startsWith("/c/");

  React.useEffect(() => {
    if (!isChatRoute) {
      setIsLoadingHeader(false);
      return;
    }
    const modelsPromise = api.models
      .list()
      .then((data: Model[]) => {
        setModels(data);
        if (data.length > 0) {
          setSelectedModelId((prev) => {
            const id = prev || data[0].id;
            const model = data.find((m) => m.id === id);
            setModelHasApiKey(model?.hasApiKey ?? true);
            return id;
          });
        }
      })
      .catch(() => {});
    const connectionsPromise = api.connections
      .list()
      .then((data: Connection[]) => {
        const active = data.filter((c) => c.isActive);
        setConnections(active);
        if (active.length > 0)
          setSelectedConnectionId((prev) => (prev ? prev : active[0].id));
      })
      .catch(() => {});
    Promise.all([modelsPromise, connectionsPromise]).finally(() => setIsLoadingHeader(false));
  }, [isChatRoute, setSelectedModelId, setSelectedConnectionId]);

  const handleRefresh = () => {
    onRefreshRef.current?.();
    clearChatRef.current?.();
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 px-4">
      <SidebarTrigger className="-ml-1" />
      {pathname === "/settings" && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => router.push("/c")}
        >
          <ArrowLeft className="size-4" />
        </Button>
      )}
      {isChatRoute && (
        <div className="ml-auto flex items-center gap-2">
          {isLoadingHeader ? (
            <>
              <Skeleton className="h-8 w-[180px] rounded-md" />
              <Skeleton className="h-8 w-[140px] rounded-md" />
            </>
          ) : (
            <>
              {connections.length > 0 ? (
                <Select
                  value={selectedConnectionId}
                  onValueChange={setSelectedConnectionId}
                >
                  <SelectTrigger
                    className={`h-8 w-[180px] border-0 text-xs ${
                      selectedConnectionId && selectedConnectionId !== "none"
                        ? "bg-emerald-500/10"
                        : "bg-muted"
                    }`}
                  >
                    <span className="relative mr-1.5 flex size-2">
                      {selectedConnectionId && selectedConnectionId !== "none" && (
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      )}
                      <span
                        className={`relative inline-flex size-2 rounded-full ${
                          selectedConnectionId && selectedConnectionId !== "none"
                            ? "bg-emerald-500"
                            : "bg-muted-foreground/40"
                        }`}
                      />
                    </span>
                    <Database
                      className={`mr-1 size-3 ${
                        selectedConnectionId && selectedConnectionId !== "none"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                      }`}
                    />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">
                      Aucune connexion
                    </SelectItem>
                    {connections.map((conn) => (
                      <SelectItem key={conn.id} value={conn.id} className="text-xs">
                        {conn.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex h-8 items-center gap-1.5 rounded-md bg-muted px-3 text-xs text-muted-foreground">
                  <span className="relative flex size-2">
                    <span className="inline-flex size-2 rounded-full bg-muted-foreground/40" />
                  </span>
                  <Database className="size-3" />
                  <span>Offline</span>
                </div>
              )}
              {models.length > 0 && (
                <Select
                  value={selectedModelId}
                  onValueChange={(id) => {
                    setSelectedModelId(id);
                    const model = models.find((m) => m.id === id);
                    setModelHasApiKey(model?.hasApiKey ?? true);
                  }}
                >
                  <SelectTrigger className="h-8 w-[140px] border-0 bg-muted text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.id} className="text-xs">
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={handleRefresh}
          >
            <RefreshCw className="size-4" />
          </Button>
          <HelpSheet />
        </div>
      )}
    </header>
  );
}
