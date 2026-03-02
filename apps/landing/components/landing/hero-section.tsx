import { useTranslations } from "next-intl";
import { Github, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  const t = useTranslations("landing.hero");
  return (
    <section className="relative manga-speedlines manga-hlines px-6 py-32 lg:py-44 overflow-hidden">
      {/* Diagonal accent strip */}
      <div className="absolute top-0 right-0 w-64 h-full bg-manga-pink/10 -skew-x-12 translate-x-20 z-0" />
      <div className="absolute top-0 right-32 w-16 h-full bg-manga-yellow/8 -skew-x-12 translate-x-20 z-0" />

      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        {/* Japanese subtitle floating */}
        <div className="mb-6 flex items-center gap-3">
          <span className="h-px w-12 bg-manga-pink" />
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-manga-pink">
            {t("jpSubtitle")}
          </span>
          <span className="h-px w-12 bg-manga-pink" />
        </div>

        {/* Main title — manga slam style */}
        <h1
          className="manga-impact max-w-4xl text-5xl font-black uppercase tracking-tighter leading-none sm:text-7xl lg:text-8xl xl:text-9xl"
          style={{ fontFamily: "'Dela Gothic One', cursive" }}
        >
          <span className="block text-foreground">{t("title1")}</span>
          <span className="block text-manga-pink">{t("title2")}</span>
          <span className="block text-manga-yellow">{t("title3")}</span>
        </h1>

        {/* Sound effect */}
        <div className="mt-6 flex items-center gap-2">
          <Zap className="size-5 text-manga-yellow animate-manga-flash" />
          <p className="text-lg font-bold text-muted-foreground sm:text-xl" style={{ fontFamily: "'Kosugi Maru', sans-serif" }}>
            {t("taglinePrefix")} <span className="text-manga-cyan">{t("taglineSql")}</span> {t("taglineSuffix")} <span className="text-manga-pink">{t("taglineInstant")}</span>
          </p>
          <Zap className="size-5 text-manga-yellow animate-manga-flash" />
        </div>

        <p className="mt-3 max-w-md text-sm text-muted-foreground tracking-wide">
          {t("subtitle")}
        </p>

        {/* CTAs */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Button asChild variant="outline" size="lg" className="font-black uppercase tracking-wider text-base border-3 border-foreground text-foreground hover:bg-foreground hover:text-background shadow-[4px_4px_0px_var(--manga-cyan)] hover:shadow-[6px_6px_0px_var(--manga-cyan)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5">
            <a href="https://github.com/MakFly/chatdb" target="_blank" rel="noopener noreferrer">
              <Github />
              {t("github")}
            </a>
          </Button>
        </div>

        {/* Bottom onomatopoeia */}
        <div className="mt-16 text-[10px] uppercase tracking-[0.5em] text-muted-foreground/40 font-black">
          ドドドドドドドドドドドドド
        </div>
      </div>
    </section>
  );
}
