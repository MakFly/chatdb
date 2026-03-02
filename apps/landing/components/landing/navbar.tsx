import Link from "next/link";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <Bot className="size-6" />
          ChatDB
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link
            href="#fonctionnalites"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Fonctionnalités
          </Link>
          <Link
            href="#comparatif"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Comparatif
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="https://github.com/MakFly/chatdb"
            target="_blank"
            rel="noopener noreferrer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://img.shields.io/github/stars/MakFly/chatdb?style=social"
              alt="GitHub Stars"
            />
          </Link>
          <Button asChild size="sm">
            <Link href="https://github.com/MakFly/chatdb" target="_blank" rel="noopener noreferrer">GitHub</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
