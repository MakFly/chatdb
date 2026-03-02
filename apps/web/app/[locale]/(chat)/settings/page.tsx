"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Check,
  Circle,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  MessageSquare,
  Moon,
  Pencil,
  Plus,
  Settings2,
  Sparkles,
  Sun,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { PromptSettings } from "@/components/settings/prompt-settings";

// ─── Types ───────────────────────────────────────────────────────────

interface Provider {
  id: string;
  name: string;
  slug: string;
  baseUrl: string | null;
  isEnabled: boolean;
  hasApiKey: boolean;
}

interface Connection {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  sslEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Connection Form Dialog ───────────────────────────────────────────

function ConnectionFormDialog({
  open,
  onOpenChange,
  connection,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection?: Connection;
  onSaved: (c: Connection) => void;
}) {
  const t = useTranslations("settings.connections.form");
  const tc = useTranslations("common");
  const [form, setForm] = React.useState({
    name: "",
    host: "localhost",
    port: "5432",
    database: "",
    username: "",
    password: "",
    sslEnabled: false,
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (open) {
      if (connection) {
        setForm({
          name: connection.name,
          host: connection.host,
          port: String(connection.port),
          database: connection.database,
          username: connection.username,
          password: "",
          sslEnabled: connection.sslEnabled,
        });
      } else {
        setForm({ name: "", host: "localhost", port: "5432", database: "", username: "", password: "", sslEnabled: false });
      }
      setError("");
    }
  }, [open, connection]);

  const isValid = form.name.trim() && form.host.trim() && form.port.trim() && !isNaN(Number(form.port)) && form.database.trim() && form.username.trim() && (!connection ? form.password.trim() : true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSaving(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        host: form.host,
        port: Number(form.port),
        database: form.database,
        username: form.username,
        sslEnabled: form.sslEnabled,
      };
      if (form.password) payload.password = form.password;
      const saved = connection
        ? await api.connections.update(connection.id, payload)
        : await api.connections.create(payload as Parameters<typeof api.connections.create>[0]);
      onSaved(saved);
      onOpenChange(false);
      toast.success(connection ? t("updated") : t("created"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : tc("unknownError");
      setError(msg);
      toast.error(connection ? t("updateFailed") : t("createFailed"), { description: msg });
    } finally {
      setSaving(false);
    }
  };

  const fields: { key: keyof typeof form; label: string; placeholder: string; type?: string }[] = [
    { key: "name", label: t("name"), placeholder: t("namePlaceholder") },
    { key: "host", label: t("host"), placeholder: t("hostPlaceholder") },
    { key: "port", label: t("port"), placeholder: t("portPlaceholder") },
    { key: "database", label: t("database"), placeholder: t("databasePlaceholder") },
    { key: "username", label: t("username"), placeholder: t("usernamePlaceholder") },
    { key: "password", label: t("password"), placeholder: connection ? t("passwordUnchanged") : t("passwordPlaceholder"), type: "password" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{connection ? t("editTitle") : t("newTitle")}</DialogTitle>
            <DialogDescription>
              {connection ? t("editDescription") : t("newDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {fields.map(({ key, label, placeholder, type }) => (
              <div key={key} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={key} className="text-right text-sm">{label}</Label>
                <Input
                  id={key}
                  type={type || "text"}
                  placeholder={placeholder}
                  value={form[key] as string}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="col-span-3"
                />
              </div>
            ))}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-sm">{t("ssl")}</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Checkbox
                  id="sslEnabled"
                  checked={form.sslEnabled}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, sslEnabled: checked === true }))}
                />
                <Label htmlFor="sslEnabled" className="text-sm font-normal">{t("enableSsl")}</Label>
              </div>
            </div>
            {error && (
              <p className="col-span-4 text-sm text-destructive">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
            <Button type="submit" disabled={!isValid || saving}>
              {saving && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
              {connection ? t("save") : t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Connection Card ──────────────────────────────────────────────────

function ConnectionCard({
  connection,
  onUpdate,
  onDelete,
  delay,
}: {
  connection: Connection;
  onUpdate: (c: Connection) => void;
  onDelete: (id: string) => void;
  delay: number;
}) {
  const t = useTranslations("settings.connections");
  const tc = useTranslations("common");
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{ success: boolean; error?: string } | null>(null);
  const [toggling, setToggling] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await api.connections.test(connection.id);
      setTestResult(result);
      if (result.success) {
        toast.success(t("testOk"), { description: t("testResponds", { name: connection.name }) });
      } else {
        toast.error(t("testFailed"), { description: result.error || t("testImpossible") });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : tc("error");
      setTestResult({ success: false, error: msg });
      toast.error(t("testFailed"), { description: msg });
    } finally {
      setTesting(false);
    }
  };

  const handleToggle = async (isActive: boolean) => {
    setToggling(true);
    try {
      const updated = await api.connections.update(connection.id, { isActive });
      onUpdate(updated);
      toast.success(isActive ? t("activated") : t("deactivated"), { description: connection.name });
    } catch (err) {
      toast.error(t("updateFailed"), { description: err instanceof Error ? err.message : tc("error") });
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t("deleteConfirm", { name: connection.name }))) return;
    try {
      await api.connections.delete(connection.id);
      onDelete(connection.id);
      toast.success(t("deleted"), { description: connection.name });
    } catch (err) {
      toast.error(t("deleteFailed"), { description: err instanceof Error ? err.message : tc("error") });
    }
  };

  return (
    <>
      <Card
        className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex size-10 items-center justify-center rounded-xl transition-all duration-300 ${
                connection.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                <Database className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base">{connection.name}</CardTitle>
                <CardDescription className="text-xs font-mono">
                  {connection.host}:{connection.port}/{connection.database}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium transition-colors duration-200 ${
                connection.isActive ? "text-primary" : "text-muted-foreground"
              }`}>
                {connection.isActive ? t("active") : t("inactive")}
              </span>
              <Switch
                checked={connection.isActive}
                onCheckedChange={handleToggle}
                disabled={toggling}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {connection.username}@{connection.host}
            </span>
            {testResult && (
              <Badge
                variant={testResult.success ? "default" : "destructive"}
                className={testResult.success
                  ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                  : ""
                }
              >
                {testResult.success ? "OK" : testResult.error || tc("error")}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleTest} disabled={testing}>
              {testing ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <Database className="mr-1.5 size-3.5" />}
              {t("test")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1.5 size-3.5" />
              {t("edit")}
            </Button>
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={handleDelete}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
      <ConnectionFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        connection={connection}
        onSaved={onUpdate}
      />
    </>
  );
}

// ─── Provider Icons (Simple SVG Logos) ─────────────────────────────────

const PROVIDER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  openai: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
    </svg>
  ),
  anthropic: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M13.827 3.52h3.603L24 20.48h-3.603l-6.57-16.96zm-7.258 0h3.767L16.906 20.48h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm2.43 3.461L6.36 13.922h5.278L9.0 6.98z" />
    </svg>
  ),
  google: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  ),
  default: Sparkles,
};

function getProviderIcon(slug: string) {
  return PROVIDER_ICONS[slug] || PROVIDER_ICONS.default;
}

// ─── Provider Card Component ───────────────────────────────────────────

function ProviderCard({
  provider,
  onUpdate,
  delay,
}: {
  provider: Provider;
  onUpdate: (p: Provider) => void;
  delay: number;
}) {
  const t = useTranslations("settings.providers");
  const tc = useTranslations("common");
  const [apiKey, setApiKey] = React.useState("");
  const [showKey, setShowKey] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [justToggled, setJustToggled] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);

  const ProviderIcon = getProviderIcon(provider.slug);

  const canEdit = provider.hasApiKey ? isEditing : true;
  const isInputDisabled = !provider.isEnabled || (provider.hasApiKey && !isEditing);

  const handleSaveKey = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    try {
      const updated = await api.providers.update(provider.id, { apiKey });
      onUpdate(updated);
      setApiKey("");
      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 2000);
      toast.success(t("keySaved"), { description: provider.name });
    } catch (err) {
      toast.error(t("keySaveFailed"), { description: err instanceof Error ? err.message : tc("error") });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setApiKey("");
    setIsEditing(false);
  };

  const handleToggle = async (enabled: boolean) => {
    setJustToggled(true);
    try {
      const updated = await api.providers.update(provider.id, { isEnabled: enabled });
      onUpdate(updated);
      toast.success(enabled ? t("enabled") : t("disabled"), { description: provider.name });
    } catch (err) {
      toast.error(t("updateFailed"), { description: err instanceof Error ? err.message : tc("error") });
    }
    setTimeout(() => setJustToggled(false), 300);
  };

  return (
    <Card
      className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex size-10 items-center justify-center rounded-xl transition-all duration-300 ${
                provider.isEnabled
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              } ${justToggled ? "scale-110" : ""}`}
            >
              <ProviderIcon className="size-5" />
            </div>

            <div>
              <CardTitle className="text-base">{provider.name}</CardTitle>
              <CardDescription className="text-xs font-mono uppercase tracking-wider">
                {provider.slug}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-medium transition-colors duration-200 ${
                provider.isEnabled ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {provider.isEnabled ? t("active") : t("inactive")}
            </span>
            <Switch
              checked={provider.isEnabled}
              onCheckedChange={handleToggle}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t("apiKey")}</span>
          </div>
          <Badge
            variant={provider.hasApiKey ? "default" : "secondary"}
            className={`transition-all duration-300 ${
              provider.hasApiKey
                ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                : ""
            }`}
          >
            {provider.hasApiKey ? (
              <>
                <Check className="mr-1 size-3" />
                {t("configured")}
              </>
            ) : (
              <>
                <Circle className="mr-1 size-3" />
                {t("notConfigured")}
              </>
            )}
          </Badge>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={showKey ? "text" : "password"}
              placeholder={
                provider.hasApiKey && !isEditing
                  ? "••••••••••••••••••••"
                  : "sk-..."
              }
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="pr-10 font-mono text-sm"
              disabled={isInputDisabled}
            />
            {!isInputDisabled && (
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                tabIndex={-1}
              >
                {showKey ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            )}
          </div>

          {provider.hasApiKey && !isEditing ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
              disabled={!provider.isEnabled}
              className="min-w-[90px] transition-all duration-200"
            >
              {t("edit")}
            </Button>
          ) : (
            <>
              {isEditing && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  className="transition-all duration-200"
                >
                  {t("cancel")}
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSaveKey}
                disabled={!apiKey.trim() || saving || !provider.isEnabled}
                className="min-w-[90px] transition-all duration-200"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    <span>{t("saving")}</span>
                  </>
                ) : saved ? (
                  <>
                    <Check className="mr-1.5 size-3.5 animate-in zoom-in duration-200" />
                    <span>{t("saved")}</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-1.5 size-3.5" />
                    <span>{t("save")}</span>
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        {provider.baseUrl && (
          <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
            <Zap className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground">
              {provider.baseUrl}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Skeleton Card ─────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-[90px]" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Settings Page ────────────────────────────────────────────────

export default function SettingsPage() {
  const t = useTranslations("settings");
  const [providers, setProviders] = React.useState<Provider[]>([]);
  const [connections, setConnections] = React.useState<Connection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [connectionsLoading, setConnectionsLoading] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);
  const [theme, setTheme] = React.useState<"light" | "dark" | "system">("system");
  const [showConnectionForm, setShowConnectionForm] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    api.providers
      .list()
      .then(setProviders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    api.connections
      .list()
      .then(setConnections)
      .catch(() => {})
      .finally(() => setConnectionsLoading(false));
  }, []);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  const handleUpdate = (updated: Provider) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    const root = document.documentElement;
    if (newTheme === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", systemDark);
    } else {
      root.classList.toggle("dark", newTheme === "dark");
    }
  };

  const handleConnectionUpdate = (updated: Connection) => {
    setConnections((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  };

  const handleConnectionCreated = (created: Connection) => {
    setConnections((prev) => [...prev, created]);
  };

  const handleConnectionDelete = (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
  };

  const activeCount = providers.filter((p) => p.isEnabled).length;
  const configuredCount = providers.filter((p) => p.hasApiKey).length;
  const activeConnectionsCount = connections.filter((c) => c.isActive).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 p-6">
          {/* Stats Overview */}
          <div
            className={`flex gap-4 transition-all duration-500 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Card className="flex-1 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="size-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold">{activeCount}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t("stats.activeProviders")}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                  <KeyRound className="size-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold">{configuredCount}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t("stats.configuredKeys")}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1 bg-gradient-to-br from-violet-500/5 to-violet-500/10">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                  <Sparkles className="size-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold">{providers.length}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t("stats.available")}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1 bg-gradient-to-br from-amber-500/5 to-amber-500/10">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                  <Circle className="size-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold">{providers.length - configuredCount}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t("stats.pending")}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1 bg-gradient-to-br from-cyan-500/5 to-cyan-500/10">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
                  <Database className="size-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold">{activeConnectionsCount}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t("stats.activeConnections")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="providers" className="w-full">
            <TabsList className="w-full justify-start bg-muted/50 p-1">
              <TabsTrigger value="providers" className="gap-2">
                <Sparkles className="size-4" />
                {t("tabs.providers")}
              </TabsTrigger>
              <TabsTrigger value="connections" className="gap-2">
                <Database className="size-4" />
                {t("tabs.connections")}
              </TabsTrigger>
              <TabsTrigger value="prompts" className="gap-2">
                <MessageSquare className="size-4" />
                {t("tabs.prompts")}
              </TabsTrigger>
              <TabsTrigger value="general" className="gap-2">
                <Settings2 className="size-4" />
                {t("tabs.general")}
              </TabsTrigger>
            </TabsList>

            {/* Providers Tab */}
            <TabsContent value="providers" className="mt-6 space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">{t("providers.title")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("providers.description")}
                </p>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : providers.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                      <Sparkles className="size-6 text-muted-foreground" />
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      {t("providers.noProviders")}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {providers.map((provider, index) => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      onUpdate={handleUpdate}
                      delay={index * 100}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Connections Tab */}
            <TabsContent value="connections" className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">{t("connections.title")}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t("connections.description")}
                  </p>
                </div>
                <Button onClick={() => setShowConnectionForm(true)} className="gap-2">
                  <Plus className="size-4" />
                  {t("connections.newConnection")}
                </Button>
              </div>

              {connectionsLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : connections.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                      <Database className="size-6 text-muted-foreground" />
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      {t("connections.noConnections")}
                    </p>
                    <Button variant="outline" className="mt-4 gap-2" onClick={() => setShowConnectionForm(true)}>
                      <Plus className="size-4" />
                      {t("connections.addConnection")}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {connections.map((conn, index) => (
                    <ConnectionCard
                      key={conn.id}
                      connection={conn}
                      onUpdate={handleConnectionUpdate}
                      onDelete={handleConnectionDelete}
                      delay={index * 100}
                    />
                  ))}
                </div>
              )}

              <ConnectionFormDialog
                open={showConnectionForm}
                onOpenChange={setShowConnectionForm}
                onSaved={handleConnectionCreated}
              />
            </TabsContent>

            {/* Prompts Tab */}
            <TabsContent value="prompts" className="mt-6">
              <PromptSettings />
            </TabsContent>

            {/* General Tab */}
            <TabsContent value="general" className="mt-6 space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">{t("general.title")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("general.description")}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
              {/* Theme Settings */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10">
                      {theme === "dark" ? (
                        <Moon className="size-4 text-amber-500" />
                      ) : (
                        <Sun className="size-4 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base">{t("general.appearance")}</CardTitle>
                      <CardDescription className="text-xs">
                        {t("general.appearanceDescription")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {(["light", "dark", "system"] as const).map((themeOption) => (
                      <button
                        key={themeOption}
                        onClick={() => handleThemeChange(themeOption)}
                        className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all duration-200 ${
                          theme === themeOption
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        {themeOption === "light" && <Sun className="size-4" />}
                        {themeOption === "dark" && <Moon className="size-4" />}
                        {themeOption === "system" && (
                          <div className="relative size-4">
                            <Sun className="absolute inset-0 size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute inset-0 size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                          </div>
                        )}
                        <span>
                          {t(`general.${themeOption}`)}
                        </span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Language */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10">
                      <svg
                        className="size-4 text-blue-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                        />
                      </svg>
                    </div>
                    <div>
                      <CardTitle className="text-base">{t("general.language")}</CardTitle>
                      <CardDescription className="text-xs">
                        {t("general.languageDescription")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between rounded-lg border border-dashed px-4 py-3">
                    <span className="text-sm">Français</span>
                    <Badge variant="secondary" className="text-xs">
                      {t("general.comingSoon")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
