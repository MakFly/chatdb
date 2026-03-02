import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
          Prêt à interroger vos données ?
        </h2>
        <p className="text-muted-foreground mb-10">
          Déployez ChatDB en quelques minutes.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/register">Commencer</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="#">Documentation</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
