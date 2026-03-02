import Link from "next/link";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center px-6 py-36 text-center lg:py-44">
      <Badge variant="outline" className="mb-6">
        Open-Source &amp; Self-Hosted
      </Badge>
      <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
        Parlez à vos bases de données
      </h1>
      <p className="mt-6 max-w-xl text-lg text-muted-foreground">
        Transformez vos questions en SQL avec l'IA. Open-source, multi-bases, multi-LLM.
      </p>
      <div className="mt-4">
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
      </div>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Button asChild size="lg">
          <Link href="https://github.com/MakFly/chatdb" target="_blank" rel="noopener noreferrer">Commencer</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="https://github.com/MakFly/chatdb" target="_blank" rel="noopener noreferrer">
            <Github />
            Voir sur GitHub
          </Link>
        </Button>
      </div>
    </section>
  );
}
