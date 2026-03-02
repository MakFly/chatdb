"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  RotateCcw,
  Code,
  MessageSquare,
  Pencil,
  Save,
  Sparkles,
  Split,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

interface Prompt {
  slug: string;
  name: string;
  description: string | null;
  category: string;
  content: string;
  version: number;
  isActive: boolean;
  updatedAt: string;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  general: MessageSquare,
  agent: Sparkles,
  routing: Split,
  context: Code,
};

const CATEGORY_LABELS: Record<string, string> = {
  general: "Général",
  agent: "Agents",
  routing: "Routage",
  context: "Contexte",
};

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  agent: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
  routing: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
  context: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
};

function PromptCard({
  prompt,
  onEdit,
  delay,
}: {
  prompt: Prompt;
  onEdit: (p: Prompt) => void;
  delay: number;
}) {
  const CategoryIcon = CATEGORY_ICONS[prompt.category] || Code;

  return (
    <Card
      className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => onEdit(prompt)}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex size-10 items-center justify-center rounded-xl transition-all duration-300 ${
              CATEGORY_COLORS[prompt.category] || "bg-muted text-muted-foreground"
            }`}>
              <CategoryIcon className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base">{prompt.name}</CardTitle>
              <CardDescription className="text-xs font-mono">
                {prompt.slug}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            v{prompt.version}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {prompt.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {prompt.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-xs">
            {CATEGORY_LABELS[prompt.category] || prompt.category}
          </Badge>
          <span>
            Modifié le {new Date(prompt.updatedAt).toLocaleDateString("fr-FR")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function PromptEditDialog({
  prompt,
  open,
  onOpenChange,
  onSaved,
}: {
  prompt: Prompt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (p: Prompt) => void;
}) {
  const [content, setContent] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [resetting, setResetting] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (prompt) {
      setContent(prompt.content);
      setError("");
    }
  }, [prompt]);

  if (!prompt) return null;

  const isValid = content.length >= 50 && content.length <= 10000;

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    setError("");
    try {
      const updated = await api.prompts.update(prompt.slug, content);
      onSaved(updated);
      onOpenChange(false);
      toast.success("Prompt mis à jour", { description: prompt.name });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(msg);
      toast.error("Échec de la mise à jour", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm(`Réinitialiser le prompt "${prompt.name}" à sa valeur par défaut ?`)) return;
    setResetting(true);
    setError("");
    try {
      const updated = await api.prompts.reset(prompt.slug);
      setContent(updated.content);
      onSaved(updated);
      toast.success("Prompt réinitialisé", { description: prompt.name });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(msg);
      toast.error("Échec de la réinitialisation", { description: msg });
    } finally {
      setResetting(false);
    }
  };

  const CategoryIcon = CATEGORY_ICONS[prompt.category] || Code;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`flex size-10 items-center justify-center rounded-xl ${
              CATEGORY_COLORS[prompt.category] || "bg-muted text-muted-foreground"
            }`}>
              <CategoryIcon className="size-5" />
            </div>
            <div>
              <DialogTitle>{prompt.name}</DialogTitle>
              <DialogDescription className="font-mono text-xs">
                {prompt.slug}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {prompt.description && (
            <p className="text-sm text-muted-foreground">{prompt.description}</p>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content" className="text-sm font-medium">
                Contenu du prompt
              </Label>
              <span className="text-xs text-muted-foreground">
                {content.length} / 10000 caractères
              </span>
            </div>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
              placeholder="Contenu du prompt..."
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            {!isValid && content.length > 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Le contenu doit contenir entre 50 et 10000 caractères.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={resetting}
            className="w-full sm:w-auto"
          >
            {resetting ? (
              <Zap className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <RotateCcw className="mr-1.5 size-3.5" />
            )}
            Réinitialiser
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-initial"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!isValid || saving}
              className="flex-1 sm:flex-initial"
            >
              {saving ? (
                <Zap className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Save className="mr-1.5 size-3.5" />
              )}
              Enregistrer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SkeletonCard() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

export function PromptSettings() {
  const [prompts, setPrompts] = React.useState<Prompt[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editPrompt, setEditPrompt] = React.useState<Prompt | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);

  React.useEffect(() => {
    api.prompts
      .list()
      .then(setPrompts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleEdit = (prompt: Prompt) => {
    setEditPrompt(prompt);
    setEditOpen(true);
  };

  const handleSaved = (updated: Prompt) => {
    setPrompts((prev) =>
      prev.map((p) => (p.slug === updated.slug ? updated : p))
    );
    if (editPrompt?.slug === updated.slug) {
      setEditPrompt(updated);
    }
  };

  // Group prompts by category
  const groupedPrompts = prompts.reduce((acc, prompt) => {
    const cat = prompt.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(prompt);
    return acc;
  }, {} as Record<string, Prompt[]>);

  const categoryOrder = ["general", "agent", "routing", "context"];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Prompts Système</h2>
        <p className="text-sm text-muted-foreground">
          Personnalisez les prompts système utilisés par l'assistant et les agents.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {categoryOrder.map((category) => {
            const categoryPrompts = groupedPrompts[category];
            if (!categoryPrompts?.length) return null;

            return (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={CATEGORY_COLORS[category] || ""}
                  >
                    {CATEGORY_LABELS[category] || category}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {categoryPrompts.length} prompt{categoryPrompts.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {categoryPrompts.map((prompt, index) => (
                    <PromptCard
                      key={prompt.slug}
                      prompt={prompt}
                      onEdit={handleEdit}
                      delay={index * 50}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PromptEditDialog
        prompt={editPrompt}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={handleSaved}
      />
    </div>
  );
}
