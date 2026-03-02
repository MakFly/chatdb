import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Rocket, BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";

export function CtaSection() {
  const t = useTranslations("landing.cta");

  return (
    <section className="relative manga-speedlines px-6 py-28 overflow-hidden">
      {/* Diagonal accent strips */}
      <div className="absolute top-0 left-0 w-48 h-full bg-manga-pink/5 skew-x-12 -translate-x-20 z-0" />
      <div className="absolute top-0 left-20 w-12 h-full bg-manga-yellow/5 skew-x-12 -translate-x-20 z-0" />

      <div className="relative z-10 mx-auto max-w-2xl text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-manga-pink mb-4">
          {t("chapterLabel")}
        </p>

        <h2
          className="manga-impact text-4xl font-black uppercase tracking-tight sm:text-6xl mb-4"
          style={{ fontFamily: "'Dela Gothic One', cursive" }}
        >
          <span className="text-foreground">{t("title1")}</span>
          <span className="text-manga-pink">{t("title2")}</span>
          <br />
          <span className="text-manga-yellow">{t("title3")}</span>
          <span className="text-foreground">{t("title4")}</span>
        </h2>

        <p className="text-muted-foreground mb-12 text-sm">
          {t("description")} <span style={{ fontFamily: "'Kosugi Maru', sans-serif" }}>{t("jpReady")}</span>
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg" className="bg-manga-pink text-background font-black uppercase tracking-wider text-base border-3 border-foreground hover:bg-manga-yellow hover:text-background shadow-[4px_4px_0px_var(--foreground)] hover:shadow-[6px_6px_0px_var(--foreground)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5">
            <Link href="https://github.com/MakFly/chatdb" target="_blank" rel="noopener noreferrer">
              <Rocket className="size-5" />
              {t("start")}
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="font-black uppercase tracking-wider text-base border-3 border-foreground text-foreground hover:bg-foreground hover:text-background shadow-[4px_4px_0px_var(--manga-cyan)] hover:shadow-[6px_6px_0px_var(--manga-cyan)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5">
            <Link href="#">
              <BookOpen className="size-5" />
              {t("documentation")}
            </Link>
          </Button>
        </div>

        {/* Bottom dramatic onomatopoeia */}
        <div className="mt-20 text-[10px] uppercase tracking-[0.6em] text-muted-foreground/30 font-black">
          ゴゴゴゴゴゴゴゴゴゴゴゴゴゴゴゴ
        </div>
      </div>
    </section>
  );
}
