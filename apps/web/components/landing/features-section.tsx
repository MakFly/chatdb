import { useTranslations } from "next-intl";
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

const featureKeys = [
  { key: "nlToSql", icon: MessageSquare, color: "manga-pink", jp: "自然言語" },
  { key: "multiLlm", icon: Layers, color: "manga-yellow", jp: "人工知能" },
  { key: "multiDb", icon: Database, color: "manga-cyan", jp: "データベース" },
  { key: "rbac", icon: Shield, color: "manga-purple", jp: "セキュリティ" },
  { key: "safeMutations", icon: ShieldCheck, color: "manga-red", jp: "安全" },
  { key: "streaming", icon: Zap, color: "manga-yellow", jp: "リアルタイム" },
  { key: "openSource", icon: Github, color: "manga-cyan", jp: "自由ソフト" },
  { key: "audit", icon: FileText, color: "manga-pink", jp: "ログ記録" },
] as const;

export function FeaturesSection() {
  const t = useTranslations("landing.features");
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
          {featureKeys.map(({ key, icon: Icon, color, jp }, i) => (
            <div
              key={key}
              className={`group relative border-3 border-foreground/80 p-5 bg-card/60 hover:bg-${color}/10 transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_var(--${color})]`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Number tag */}
              <div className={`absolute -top-3 -right-2 bg-${color} text-background text-[10px] font-black w-6 h-6 flex items-center justify-center`}>
                {String(i + 1).padStart(2, '0')}
              </div>

              {/* JP watermark */}
              <span className="absolute bottom-2 right-3 text-3xl font-black text-foreground/4" style={{ fontFamily: "'Dela Gothic One', cursive" }}>
                {jp}
              </span>

              <Icon className={`size-7 text-${color} mb-3`} />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-1">
                {t(`${key}.jpTitle`)}
              </p>
              <h3 className="text-sm font-black uppercase tracking-wide mb-2">{t(`${key}.subtitle`)}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed relative z-10">{t(`${key}.description`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
