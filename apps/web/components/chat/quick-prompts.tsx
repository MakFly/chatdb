"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Database, FileQuestion, BarChart3, Activity } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface Chip {
  labelKey: string;
  inputKey?: string;
  icon: React.ElementType;
  trigger?: string;
  href?: string;
}

const CHIP_DEFS: Chip[] = [
  { labelKey: "showSchema", inputKey: "showSchemaInput", icon: Database, trigger: "schema" },
  { labelKey: "explainQuery", inputKey: "explainQueryInput", icon: FileQuestion, trigger: "explain" },
  { labelKey: "analyzeDb", inputKey: "analyzeDbInput", icon: BarChart3, trigger: "analyze" },
  { labelKey: "mutationStats", icon: Activity, href: "/settings/audit" },
];

interface QuickPromptsProps {
  connectionId?: string;
  onPromptSelect: (input: string, trigger?: string) => void;
  className?: string;
}

export function QuickPrompts({ connectionId, onPromptSelect, className }: QuickPromptsProps) {
  const t = useTranslations("chat.quickPrompts");
  const router = useRouter();

  if (!connectionId) return null;

  return (
    <div className={cn("flex flex-wrap gap-2 pb-2", className)}>
      {CHIP_DEFS.map((chip) => {
        const Icon = chip.icon;
        const label = t(chip.labelKey as Parameters<typeof t>[0]);
        const handleClick = () => {
          if (chip.href) {
            router.push(chip.href as never);
            return;
          }
          if (chip.inputKey) {
            onPromptSelect(t(chip.inputKey as Parameters<typeof t>[0]), chip.trigger);
          }
        };

        return (
          <button
            key={chip.labelKey}
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
            {label}
          </button>
        );
      })}
    </div>
  );
}
