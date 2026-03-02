import Link from "next/link";
import { Bot, Github, Heart } from "lucide-react";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("landing.footer");

  return (
    <footer className="border-t-3 border-foreground px-6 py-10 bg-card/50">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 font-black text-lg mb-3" style={{ fontFamily: "'Black Ops One', cursive" }}>
              <Bot className="size-6 text-manga-pink" />
              <span className="text-foreground">CHAT</span>
              <span className="text-manga-pink">DB</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("jpDescription")}
              <br />
              {t("description")}
            </p>
          </div>

          {/* Produit */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-manga-yellow mb-4">{t("product")}</h4>
            <nav className="flex flex-col gap-2.5 text-sm">
              <Link href="#fonctionnalites" className="text-muted-foreground hover:text-manga-pink transition-colors font-medium">
                → {t("features")}
              </Link>
              <Link href="#comparatif" className="text-muted-foreground hover:text-manga-yellow transition-colors font-medium">
                → {t("comparison")}
              </Link>
              <Link href="#oss" className="text-muted-foreground hover:text-manga-cyan transition-colors font-medium">
                → {t("openSource")}
              </Link>
            </nav>
          </div>

          {/* Communauté */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-manga-cyan mb-4">{t("community")}</h4>
            <nav className="flex flex-col gap-2.5 text-sm">
              <Link
                href="https://github.com/MakFly/chatdb"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-manga-pink transition-colors font-medium flex items-center gap-2"
              >
                <Github className="size-3.5" />
                GitHub
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-manga-yellow transition-colors font-medium">
                → {t("documentation")}
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-manga-cyan transition-colors font-medium">
                → {t("contact")}
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t-2 border-foreground/20 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>{t("copyright")}</span>
          <span className="flex items-center gap-1.5">
            {t("builtWith")} <Heart className="size-3 text-manga-pink" /> {t("and")} <span style={{ fontFamily: "'Kosugi Maru', sans-serif" }}>情熱</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
