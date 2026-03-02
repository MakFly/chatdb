"use client";

import { useTranslations } from "next-intl";
import { Bot, Check } from "lucide-react";

const featureKeys = ["sqlNatural", "connectDbs", "history", "security"] as const;

function AuthBranding() {
  const t = useTranslations("auth.branding");
  return (
    <div className="hidden lg:flex flex-col justify-between h-full bg-gradient-to-br from-primary/20 via-primary/10 to-background p-10">
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Bot className="size-5" />
        </div>
        <span className="text-xl font-bold">ChatDB</span>
      </div>

      <div className="space-y-6">
        <blockquote className="text-2xl font-semibold leading-snug">
          &ldquo;{t("tagline")}&rdquo;
        </blockquote>

        <ul className="space-y-3">
          {featureKeys.map((key) => (
            <li key={key} className="flex items-center gap-3 text-sm">
              <div className="flex size-5 items-center justify-center rounded-full bg-primary/20">
                <Check className="size-3 text-primary" />
              </div>
              {t(`features.${key}`)}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("copyright", { year: new Date().getFullYear() })}
      </p>
    </div>
  );
}

export { AuthBranding };
