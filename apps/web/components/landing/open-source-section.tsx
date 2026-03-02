import Link from "next/link";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OpenSourceSection() {
  return (
    <section className="bg-muted/40 px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <Github className="mx-auto size-12 mb-6 text-foreground" />
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
          Construit en open-source
        </h2>
        <p className="text-muted-foreground mb-8">
          ChatDB est 100% open-source sous licence MIT.
        </p>
        <Button asChild variant="outline" size="lg">
          <Link
            href="https://github.com/YOUR_USERNAME/chatdb"
            target="_blank"
            rel="noopener noreferrer"
          >
            Voir le code source
          </Link>
        </Button>
      </div>
    </section>
  );
}
