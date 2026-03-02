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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const features = [
  {
    icon: MessageSquare,
    title: "Langage naturel → SQL",
    description: "Posez vos questions en français, obtenez des requêtes SQL optimisées.",
  },
  {
    icon: Layers,
    title: "Multi-LLM",
    description: "OpenAI, Anthropic, Ollama, Mistral — choisissez votre modèle.",
  },
  {
    icon: Database,
    title: "Multi-Bases de données",
    description: "PostgreSQL, MySQL, SQLite, MariaDB — une interface unique.",
  },
  {
    icon: Shield,
    title: "Contrôle d'accès RBAC",
    description: "Gérez finement qui peut accéder à quelles données.",
  },
  {
    icon: ShieldCheck,
    title: "Mutations avec confirmation",
    description: "Modifiez vos données en toute sécurité avec validation.",
  },
  {
    icon: Zap,
    title: "Streaming temps réel",
    description: "Recevez les réponses au fil de leur génération.",
  },
  {
    icon: Github,
    title: "Open-Source & Self-Hosted",
    description: "Déployez sur votre infra. Vos données restent chez vous.",
  },
  {
    icon: FileText,
    title: "Journal d'audit",
    description: "Traçabilité complète de chaque requête exécutée.",
  },
];

export function FeaturesSection() {
  return (
    <section id="fonctionnalites" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Tout ce dont vous avez besoin
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <CardHeader>
                  <Icon className="size-8 text-primary" />
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
