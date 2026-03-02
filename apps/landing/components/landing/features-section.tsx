import {
  MessageSquare,
  Layers,
  Database,
  Shield,
  ShieldCheck,
  Zap,
  Github,
  FileText,
} from "lucide-react";
import { useTranslations } from "next-intl";

export function FeaturesSection() {
  const t = useTranslations("landing.features");

  const features = [
    {
      icon: MessageSquare,
      title: t("nlToSql.jpTitle"),
      subtitle: t("nlToSql.subtitle"),
      description: t("nlToSql.description"),
      color: "manga-pink",
      jp: "自然言語",
    },
    {
      icon: Layers,
      title: t("multiLlm.jpTitle"),
      subtitle: t("multiLlm.subtitle"),
      description: t("multiLlm.description"),
      color: "manga-yellow",
      jp: "人工知能",
    },
    {
      icon: Database,
      title: t("multiDb.jpTitle"),
      subtitle: t("multiDb.subtitle"),
      description: t("multiDb.description"),
      color: "manga-cyan",
      jp: "データベース",
    },
    {
      icon: Shield,
      title: t("rbac.jpTitle"),
      subtitle: t("rbac.subtitle"),
      description: t("rbac.description"),
      color: "manga-purple",
      jp: "セキュリティ",
    },
    {
      icon: ShieldCheck,
      title: t("safeMutations.jpTitle"),
      subtitle: t("safeMutations.subtitle"),
      description: t("safeMutations.description"),
      color: "manga-red",
      jp: "安全",
    },
    {
      icon: Zap,
      title: t("streaming.jpTitle"),
      subtitle: t("streaming.subtitle"),
      description: t("streaming.description"),
      color: "manga-yellow",
      jp: "リアルタイム",
    },
    {
      icon: Github,
      title: t("openSource.jpTitle"),
      subtitle: t("openSource.subtitle"),
      description: t("openSource.description"),
      color: "manga-cyan",
      jp: "自由ソフト",
    },
    {
      icon: FileText,
      title: t("audit.jpTitle"),
      subtitle: t("audit.subtitle"),
      description: t("audit.description"),
      color: "manga-pink",
      jp: "ログ記録",
    },
  ];

  return (
    <section id="fonctionnalites" className="relative px-6 py-28">
      {/* Section title — manga chapter style */}
      <div className="mx-auto max-w-6xl mb-16">
        <div className="flex items-center gap-4">
          <div className="h-16 w-2 bg-manga-pink" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-manga-pink">{t("chapterLabel")}</p>
            <h2 className="text-3xl font-black uppercase tracking-tight sm:text-5xl" style={{ fontFamily: "'Dela Gothic One', cursive" }}>
              {t("title")}
            </h2>
          </div>
          <span className="ml-4 text-6xl font-black text-foreground/5" style={{ fontFamily: "'Black Ops One', cursive" }}>機能</span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.subtitle}
                className={`group relative border-3 border-foreground/80 p-5 bg-card/60 hover:bg-${feature.color}/10 transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_var(--${feature.color})]`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Number tag */}
                <div className={`absolute -top-3 -right-2 bg-${feature.color} text-background text-[10px] font-black w-6 h-6 flex items-center justify-center`}>
                  {String(i + 1).padStart(2, '0')}
                </div>

                {/* JP watermark */}
                <span className="absolute bottom-2 right-3 text-3xl font-black text-foreground/4" style={{ fontFamily: "'Dela Gothic One', cursive" }}>
                  {feature.jp}
                </span>

                <Icon className={`size-7 text-${feature.color} mb-3`} />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-1">
                  {feature.title}
                </p>
                <h3 className="text-sm font-black uppercase tracking-wide mb-2">{feature.subtitle}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed relative z-10">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
