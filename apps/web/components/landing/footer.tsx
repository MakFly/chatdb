import Link from "next/link";
import { Bot } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="px-6 py-10">
      <Separator className="mb-8" />
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 font-semibold text-lg mb-2">
              <Bot className="size-5" />
              ChatDB
            </div>
            <p className="text-sm text-muted-foreground">
              Interrogez vos bases de données en langage naturel.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Produit</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="#fonctionnalites" className="hover:text-foreground transition-colors">
                Fonctionnalités
              </Link>
              <Link href="#comparatif" className="hover:text-foreground transition-colors">
                Comparatif
              </Link>
            </nav>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Communauté</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/docs/memory" className="hover:text-foreground transition-colors">
                Documentation
              </Link>
              <Link
                href="https://github.com/YOUR_USERNAME/chatdb"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                GitHub
              </Link>
              <Link href="#" className="hover:text-foreground transition-colors">
                Contact
              </Link>
            </nav>
          </div>
        </div>
        <Separator className="my-8" />
        <p className="text-sm text-muted-foreground text-center">© 2026 ChatDB</p>
      </div>
    </footer>
  );
}
