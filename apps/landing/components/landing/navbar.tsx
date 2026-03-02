import Link from "next/link";
import { Bot, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/locale-switcher";

export function Navbar() {
  const t = useTranslations("landing.navbar");

  return (
    <header className="sticky top-0 z-50 w-full border-b-3 border-foreground bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-tighter" style={{ fontFamily: "'Black Ops One', cursive" }}>
          <Bot className="size-7 text-manga-pink" />
          <span className="text-foreground">CHAT</span>
          <span className="text-manga-pink">DB</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-bold uppercase tracking-widest md:flex">
          <Link
            href="#fonctionnalites"
            className="text-muted-foreground transition-colors hover:text-manga-pink border-b-2 border-transparent hover:border-manga-pink pb-0.5"
          >
            {t("features")}
          </Link>
          <Link
            href="#comparatif"
            className="text-muted-foreground transition-colors hover:text-manga-yellow border-b-2 border-transparent hover:border-manga-yellow pb-0.5"
          >
            {t("comparison")}
          </Link>
          <Link
            href="#oss"
            className="text-muted-foreground transition-colors hover:text-manga-cyan border-b-2 border-transparent hover:border-manga-cyan pb-0.5"
          >
            {t("openSource")}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <Button asChild size="sm" className="bg-manga-pink text-background font-black uppercase tracking-wider border-2 border-foreground hover:bg-manga-yellow hover:text-background transition-all">
            <Link href="https://github.com/MakFly/chatdb" target="_blank" rel="noopener noreferrer">
              <Github className="size-4" />
              {t("github")}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
