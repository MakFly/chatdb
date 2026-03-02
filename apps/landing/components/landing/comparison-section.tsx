import { Check, X, Skull } from "lucide-react";
import { useTranslations } from "next-intl";

export function ComparisonSection() {
  const t = useTranslations("landing.comparison");

  const rows = [
    { criteria: t("openSource"), chatdb: true, alternatives: false },
    { criteria: t("selfHosted"), chatdb: true, alternatives: false },
    { criteria: t("multiLlm"), chatdb: true, alternatives: false },
    { criteria: t("multiDb"), chatdb: true, alternatives: false },
    { criteria: t("rbac"), chatdb: true, alternatives: true },
    { criteria: t("dataPrivacy"), chatdb: true, alternatives: false },
  ];

  return (
    <section id="comparatif" className="relative manga-screentone border-y-3 border-foreground px-6 py-28">
      <div className="relative z-10 mx-auto max-w-3xl">
        {/* Manga chapter header */}
        <div className="flex items-center gap-4 mb-12">
          <div className="h-16 w-2 bg-manga-yellow" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-manga-yellow">{t("chapterLabel")}</p>
            <h2 className="text-3xl font-black uppercase tracking-tight sm:text-5xl" style={{ fontFamily: "'Dela Gothic One', cursive" }}>
              {t("title")}
            </h2>
          </div>
          <span className="ml-4 text-6xl font-black text-foreground/5" style={{ fontFamily: "'Black Ops One', cursive" }}>比較</span>
        </div>

        {/* Battle table — manga style */}
        <div className="manga-panel bg-card/80 overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-3 border-b-3 border-foreground">
            <div className="p-4 font-black text-xs uppercase tracking-[0.3em] text-muted-foreground border-r-2 border-foreground/30">
              {t("criteria")}
            </div>
            <div className="p-4 text-center bg-manga-pink/10">
              <span className="font-black text-manga-pink text-sm uppercase tracking-wider">ChatDB</span>
              <span className="block text-[9px] text-manga-pink/60 mt-0.5">チャットDB</span>
            </div>
            <div className="p-4 text-center bg-foreground/5">
              <span className="font-black text-muted-foreground text-sm uppercase tracking-wider">SaaS</span>
              <span className="block text-[9px] text-muted-foreground/40 mt-0.5">他のツール</span>
            </div>
          </div>

          {/* Data rows */}
          {rows.map((row, i) => (
            <div
              key={row.criteria}
              className={`grid grid-cols-3 ${i < rows.length - 1 ? 'border-b-2 border-foreground/20' : ''} hover:bg-manga-pink/5 transition-colors`}
            >
              <div className="p-4 font-bold text-sm border-r-2 border-foreground/20 flex items-center gap-2">
                <span className="text-manga-yellow text-[10px] font-black">{String(i + 1).padStart(2, '0')}</span>
                {row.criteria}
              </div>
              <div className="p-4 flex justify-center items-center">
                {row.chatdb ? (
                  <div className="flex items-center gap-1.5">
                    <Check className="size-5 text-manga-cyan" strokeWidth={3} />
                    <span className="text-[10px] font-black text-manga-cyan uppercase">{t("yes")}</span>
                  </div>
                ) : (
                  <X className="size-5 text-muted-foreground/40" />
                )}
              </div>
              <div className="p-4 flex justify-center items-center">
                {row.alternatives ? (
                  <Check className="size-5 text-muted-foreground/50" strokeWidth={2} />
                ) : (
                  <div className="flex items-center gap-1.5">
                    <X className="size-5 text-manga-red/70" strokeWidth={3} />
                    <span className="text-[10px] font-black text-manga-red/50 uppercase">{t("no")}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Score footer */}
          <div className="grid grid-cols-3 border-t-3 border-foreground bg-foreground/5">
            <div className="p-4 font-black text-xs uppercase tracking-widest text-muted-foreground">
              {t("score")}
            </div>
            <div className="p-4 text-center">
              <span className="text-2xl font-black text-manga-pink" style={{ fontFamily: "'Black Ops One', cursive" }}>6/6</span>
            </div>
            <div className="p-4 text-center flex justify-center items-center gap-2">
              <span className="text-2xl font-black text-muted-foreground/40" style={{ fontFamily: "'Black Ops One', cursive" }}>1/6</span>
              <Skull className="size-4 text-muted-foreground/30" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
