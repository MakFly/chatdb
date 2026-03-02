import { Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const databases = ["PostgreSQL", "MySQL", "SQLite", "MariaDB"];
const llms = ["OpenAI", "Anthropic", "Ollama", "Mistral"];

export function SupportedStackSection() {
  return (
    <section className="bg-muted/30 px-6 py-16">
      <div className="mx-auto max-w-6xl text-center">
        <h2 className="mb-8 text-xl font-semibold tracking-tight">
          Compatible avec vos outils
        </h2>
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {databases.map((db) => (
              <Badge key={db} variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
                <Database className="size-3.5" />
                {db}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {llms.map((llm) => (
              <Badge key={llm} variant="secondary" className="px-3 py-1.5 text-sm">
                {llm}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
