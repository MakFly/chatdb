"use client";

import * as React from "react";
import { Database, FileQuestion, BarChart3, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Chip {
  label: string;
  icon: React.ElementType;
  input?: string;
  trigger?: string;
  href?: string;
}

const CHIPS: Chip[] = [
  {
    label: "Montre le schéma",
    icon: Database,
    input: "Montre-moi le schéma de la base de données",
    trigger: "schema",
  },
  {
    label: "Explique cette requête",
    icon: FileQuestion,
    input: "Explique comment fonctionne cette requête",
    trigger: "explain",
  },
  {
    label: "Analyse cette base",
    icon: BarChart3,
    input: "Analyse la structure et les performances de cette base de données",
    trigger: "analyze",
  },
  {
    label: "Mes stats mutations",
    icon: Activity,
    href: "/settings/audit",
  },
];

interface QuickPromptsProps {
  connectionId?: string;
  onPromptSelect: (input: string, trigger?: string) => void;
  className?: string;
}

export function QuickPrompts({ connectionId, onPromptSelect, className }: QuickPromptsProps) {
  const router = useRouter();

  if (!connectionId) return null;

  return (
    <div className={cn("flex flex-wrap gap-2 pb-2", className)}>
      {CHIPS.map((chip) => {
        const Icon = chip.icon;
        const handleClick = () => {
          if (chip.href) {
            router.push(chip.href);
            return;
          }
          if (chip.input) {
            onPromptSelect(chip.input, chip.trigger);
          }
        };

        return (
          <button
            key={chip.label}
            type="button"
            onClick={handleClick}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-input bg-background px-3 py-1.5",
              "text-xs text-muted-foreground transition-colors",
              "hover:border-ring hover:bg-muted/50 hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20",
            )}
          >
            <Icon className="size-3 shrink-0" />
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
