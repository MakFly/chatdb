import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    quote:
      "ChatDB a transformé la façon dont notre équipe analyse les données. Plus besoin d'attendre le dev pour une requête SQL.",
    name: "Marie D.",
    role: "Product Manager",
    initials: "MD",
  },
  {
    quote:
      "Self-hosted, open-source, et multi-LLM. Exactement ce que je cherchais pour garder le contrôle de mes données.",
    name: "Thomas B.",
    role: "CTO",
    initials: "TB",
  },
  {
    quote:
      "L'interface est intuitive et le streaming temps réel rend l'expérience très fluide.",
    name: "Sophie L.",
    role: "Data Analyst",
    initials: "SL",
  },
];

export function TestimonialsSection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Ce qu'en disent les utilisateurs
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name}>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground italic mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{t.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
