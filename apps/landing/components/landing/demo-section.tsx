import { Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function DemoSection() {
  return (
    <section id="demo" className="px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-10 text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Voyez ChatDB en action
        </h2>
        <Card className="bg-muted/50">
          <CardContent className="flex aspect-video items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <Play className="size-16" />
              <p className="text-sm">Démo à venir</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
