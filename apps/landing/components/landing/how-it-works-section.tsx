import { UserPlus, PlugZap, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export function HowItWorksSection() {
  const t = useTranslations("landing.howItWorks");

  const steps = [
    {
      number: 1,
      icon: UserPlus,
      title: t("step1.jpTitle"),
      subtitle: t("step1.subtitle"),
      description: t("step1.description"),
      color: "manga-pink",
    },
    {
      number: 2,
      icon: PlugZap,
      title: t("step2.jpTitle"),
      subtitle: t("step2.subtitle"),
      description: t("step2.description"),
      color: "manga-yellow",
    },
    {
      number: 3,
      icon: MessageCircle,
      title: t("step3.jpTitle"),
      subtitle: t("step3.subtitle"),
      description: t("step3.description"),
      color: "manga-cyan",
    },
  ];

  return (
    <section className="relative px-6 py-28">
      <div className="mx-auto max-w-6xl">
        {/* Manga chapter header */}
        <div className="flex items-center gap-4 mb-16">
          <div className="h-16 w-2 bg-manga-cyan" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-manga-cyan">{t("chapterLabel")}</p>
            <h2 className="text-3xl font-black uppercase tracking-tight sm:text-5xl" style={{ fontFamily: "'Dela Gothic One', cursive" }}>
              {t("title")}
            </h2>
          </div>
          <span className="ml-4 text-6xl font-black text-foreground/5" style={{ fontFamily: "'Black Ops One', cursive" }}>手順</span>
        </div>

        {/* Steps as manga panels */}
        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative">
                {/* Step number — big background */}
                <span
                  className={`absolute -top-8 -left-2 text-[120px] font-black leading-none text-${step.color}/8 select-none`}
                  style={{ fontFamily: "'Black Ops One', cursive" }}
                >
                  {step.number}
                </span>

                <div className={`relative manga-panel p-6 bg-card/60 border-3 border-foreground hover:shadow-[6px_6px_0px_var(--${step.color})] transition-all`}>
                  {/* Corner tag */}
                  <div className={`absolute -top-3 left-4 bg-${step.color} text-background text-[10px] font-black uppercase tracking-widest px-3 py-1`}>
                    Step {step.number}
                  </div>

                  <div className="mt-4 flex flex-col items-center text-center">
                    <div className={`mb-4 flex size-14 items-center justify-center border-3 border-foreground bg-${step.color}/10`}>
                      <Icon className={`size-7 text-${step.color}`} />
                    </div>
                    <p className="text-xs font-black text-muted-foreground/50 mb-1" style={{ fontFamily: "'Kosugi Maru', sans-serif" }}>
                      {step.title}
                    </p>
                    <h3 className="text-base font-black uppercase tracking-wide mb-2">{step.subtitle}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>

                {/* Arrow connector (not on last) */}
                {step.number < 3 && (
                  <div className="hidden sm:flex absolute -right-5 top-1/2 -translate-y-1/2 z-20 text-manga-yellow font-black text-2xl">
                    →
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
