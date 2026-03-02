import Link from "next/link";
import { Github, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function OpenSourceSection() {
  const t = useTranslations("landing.openSourceSection");

  return (
    <section id="oss" className="relative manga-screentone border-y-3 border-foreground px-6 py-28 overflow-hidden">
      {/* Background kanji */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className="text-[300px] font-black text-foreground/3 leading-none" style={{ fontFamily: "'Dela Gothic One', cursive" }}>
          自由
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-2xl text-center">
        <div className="manga-panel inline-block p-3 mb-8 bg-card/40">
          <Github className="size-14 text-manga-cyan" />
        </div>

        <h2 className="text-3xl font-black uppercase tracking-tight sm:text-5xl mb-4" style={{ fontFamily: "'Dela Gothic One', cursive" }}>
          <span className="text-foreground">{t("title1")}</span>
          <span className="text-manga-cyan">{t("title2")}</span>
        </h2>

        <p className="text-muted-foreground mb-3 text-sm" style={{ fontFamily: "'Kosugi Maru', sans-serif" }}>
          オープンソース — 自由ソフトウェア
        </p>

        <p className="text-muted-foreground mb-10 flex items-center justify-center gap-2">
          {t("description")}
          <Heart className="size-4 text-manga-pink animate-manga-flash" />
        </p>

        <Button asChild size="lg" className="bg-transparent border-3 border-manga-cyan text-manga-cyan font-black uppercase tracking-wider hover:bg-manga-cyan hover:text-background shadow-[4px_4px_0px_var(--manga-pink)] hover:shadow-[6px_6px_0px_var(--manga-pink)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5">
          <Link
            href="https://github.com/MakFly/chatdb"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="size-5" />
            {t("cta")}
          </Link>
        </Button>
      </div>
    </section>
  );
}
