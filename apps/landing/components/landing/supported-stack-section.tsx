import { Database, Cpu } from "lucide-react";
import { useTranslations } from "next-intl";

const databases = ["PostgreSQL", "MySQL", "SQLite", "MariaDB"];
const llms = ["OpenAI", "Anthropic", "Ollama", "Mistral"];

export function SupportedStackSection() {
  const t = useTranslations("landing.stack");

  return (
    <section className="relative manga-screentone border-y-3 border-foreground px-6 py-16 manga-jagged-top">
      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Section header with manga style */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <span className="h-0.5 w-16 bg-manga-cyan" />
          <h2 className="text-center text-sm font-black uppercase tracking-[0.4em] text-manga-cyan" style={{ fontFamily: "'Black Ops One', cursive" }}>
            {t("title")}
          </h2>
          <span className="h-0.5 w-16 bg-manga-cyan" />
        </div>

        <div className="grid gap-10 sm:grid-cols-2">
          {/* Databases panel */}
          <div className="manga-panel p-6 bg-card/80 relative overflow-hidden">
            <div className="absolute top-0 left-0 bg-manga-pink text-background text-[10px] font-black uppercase tracking-widest px-3 py-1">
              {t("databases")}
            </div>
            <div className="mt-6 flex flex-col gap-3">
              {databases.map((db, i) => (
                <div
                  key={db}
                  className="flex items-center gap-3 border-2 border-foreground/30 p-3 hover:border-manga-pink hover:bg-manga-pink/5 transition-all"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <Database className="size-5 text-manga-pink shrink-0" />
                  <span className="font-bold text-sm uppercase tracking-wider">{db}</span>
                  <span className="ml-auto text-[10px] text-manga-yellow font-black">OK</span>
                </div>
              ))}
            </div>
          </div>

          {/* LLMs panel */}
          <div className="manga-panel p-6 bg-card/80 relative overflow-hidden">
            <div className="absolute top-0 left-0 bg-manga-yellow text-background text-[10px] font-black uppercase tracking-widest px-3 py-1">
              {t("llmProviders")}
            </div>
            <div className="mt-6 flex flex-col gap-3">
              {llms.map((llm, i) => (
                <div
                  key={llm}
                  className="flex items-center gap-3 border-2 border-foreground/30 p-3 hover:border-manga-yellow hover:bg-manga-yellow/5 transition-all"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <Cpu className="size-5 text-manga-yellow shrink-0" />
                  <span className="font-bold text-sm uppercase tracking-wider">{llm}</span>
                  <span className="ml-auto text-[10px] text-manga-cyan font-black">OK</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
