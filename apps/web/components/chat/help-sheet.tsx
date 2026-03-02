"use client";

import { useTranslations } from "next-intl";
import { HelpCircle, Database, MessageSquare, Keyboard, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function HelpSheet() {
  const t = useTranslations("chat.help");
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <HelpCircle className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("title")}</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 pt-4">
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Database className="size-4" />
              {t("whatCanDo")}
            </h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>{t("canQueryDbs")}</li>
              <li>{t("canExploreSchemas")}</li>
              <li>{t("canAnalyzeData")}</li>
              <li>{t("canWriteSql")}</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquare className="size-4" />
              {t("exampleQuestions")}
            </h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>&laquo; {t("example1")} &raquo;</li>
              <li>&laquo; {t("example2")} &raquo;</li>
              <li>&laquo; {t("example3")} &raquo;</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Keyboard className="size-4" />
              {t("shortcuts")}
            </h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>{t("shortcutSend")}</span>
                <kbd className="rounded bg-muted px-2 py-0.5 text-xs">Enter</kbd>
              </div>
              <div className="flex justify-between">
                <span>{t("shortcutNewLine")}</span>
                <kbd className="rounded bg-muted px-2 py-0.5 text-xs">Shift+Enter</kbd>
              </div>
              <div className="flex justify-between">
                <span>{t("shortcutStop")}</span>
                <kbd className="rounded bg-muted px-2 py-0.5 text-xs">Escape</kbd>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="size-4" />
              {t("limitations")}
            </h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>{t("limitSelectOnly")}</li>
              <li>{t("limitMaxRows")}</li>
              <li>{t("limitNoDdl")}</li>
            </ul>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
