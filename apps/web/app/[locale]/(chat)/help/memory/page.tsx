import {
  Brain,
  Search,
  Database,
  Terminal,
  MessageSquare,
  Shield,
  Zap,
  Settings,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyButton } from "@/components/ui/copy-button";

function CodeBlock({ children, copyable }: { children: string; copyable?: boolean }) {
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-zinc-300">
        <code>{children}</code>
      </pre>
      {copyable && <CopyButton text={children} />}
    </div>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-primary">
        {number}
      </div>
      <div className="flex-1 space-y-2">
        <h4 className="font-medium">{title}</h4>
        <div className="text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

export default function MemoryHelpPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <Brain className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Système de mémoire
              </h1>
              <p className="text-sm text-muted-foreground">
                Recherche sémantique, embeddings et contexte intelligent
              </p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="size-4 text-amber-500" />
              Comment ça marche ?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Database className="size-4 text-blue-500" />
                  Stockage
                </div>
                <p className="text-xs text-muted-foreground">
                  Quand vous sauvegardez une requête, son texte est transformé en
                  <strong> vecteur numérique</strong> (embedding) et stocké en base.
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Search className="size-4 text-emerald-500" />
                  Recherche
                </div>
                <p className="text-xs text-muted-foreground">
                  Quand vous posez une question, elle est aussi transformée en vecteur.
                  La <strong>cosine similarity</strong> trouve les requêtes les plus proches.
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquare className="size-4 text-violet-500" />
                  Injection
                </div>
                <p className="text-xs text-muted-foreground">
                  Les requêtes pertinentes, mutations récentes et résumés de conversations
                  sont <strong>injectés dans le contexte</strong> du LLM.
                </p>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Flux simplifié
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="rounded bg-blue-500/20 px-2 py-1 text-blue-600 dark:text-blue-400">
                  Question utilisateur
                </span>
                <ArrowRight className="size-3 text-muted-foreground" />
                <span className="rounded bg-emerald-500/20 px-2 py-1 text-emerald-600 dark:text-emerald-400">
                  embed(question)
                </span>
                <ArrowRight className="size-3 text-muted-foreground" />
                <span className="rounded bg-amber-500/20 px-2 py-1 text-amber-600 dark:text-amber-400">
                  cosineSimilarity()
                </span>
                <ArrowRight className="size-3 text-muted-foreground" />
                <span className="rounded bg-violet-500/20 px-2 py-1 text-violet-600 dark:text-violet-400">
                  Top 5 requêtes
                </span>
                <ArrowRight className="size-3 text-muted-foreground" />
                <span className="rounded bg-primary/20 px-2 py-1 text-primary">
                  System prompt enrichi
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Provider setup */}
        <Tabs defaultValue="ollama">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="ollama" className="gap-1.5">
              <Terminal className="size-4" />
              Ollama (local, gratuit)
            </TabsTrigger>
            <TabsTrigger value="openai" className="gap-1.5">
              <Zap className="size-4" />
              OpenAI (cloud)
            </TabsTrigger>
            <TabsTrigger value="fallback" className="gap-1.5">
              <Shield className="size-4" />
              Sans embedding
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ollama" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Configuration Ollama + nomic-embed-text
                </CardTitle>
                <CardDescription>
                  Modèle d&apos;embedding local, gratuit, aucune donnée envoyée à l&apos;extérieur.
                  768 dimensions, performant pour la recherche sémantique.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Step number={1} title="Installer Ollama">
                  <p>
                    Ollama est un runtime pour exécuter des LLM en local.
                  </p>
                  <CodeBlock copyable>
                    {`curl -fsSL https://ollama.com/install.sh | sh`}
                  </CodeBlock>
                  <p className="mt-2">
                    Ou via{" "}
                    <a
                      href="https://ollama.com/download"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      ollama.com/download
                      <ExternalLink className="size-3" />
                    </a>{" "}
                    pour macOS/Windows.
                  </p>
                </Step>

                <Step number={2} title="Télécharger le modèle d'embedding">
                  <p>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      nomic-embed-text
                    </code>{" "}
                    est un modèle d&apos;embedding open-source optimisé (~274 MB).
                  </p>
                  <CodeBlock copyable>
                    {`ollama pull nomic-embed-text`}
                  </CodeBlock>
                </Step>

                <Step number={3} title="Vérifier qu'Ollama tourne">
                  <CodeBlock copyable>
                    {`# Doit afficher nomic-embed-text dans la liste
ollama list

# Test rapide de l'embedding
curl http://localhost:11434/api/embeddings \\
  -d '{"model":"nomic-embed-text","prompt":"test"}'`}
                  </CodeBlock>
                  <p className="mt-2">
                    Doit retourner un JSON avec un champ{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      embedding
                    </code>{" "}
                    contenant un tableau de 768 nombres.
                  </p>
                </Step>

                <Step number={4} title="Configurer le provider dans l'app">
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                    <p>
                      Aller dans{" "}
                      <a href="/settings" className="text-primary hover:underline">
                        Settings &gt; Providers
                      </a>
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-emerald-500" />
                        <span>
                          Nom : <strong>Ollama</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-emerald-500" />
                        <span>
                          Slug : <strong>ollama</strong> (exactement)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-emerald-500" />
                        <span>
                          Base URL :{" "}
                          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
                            http://localhost:11434/api
                          </code>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-emerald-500" />
                        <span>
                          API Key : <strong>laisser vide</strong> (pas nécessaire)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-emerald-500" />
                        <span>
                          Activé : <strong>oui</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </Step>

                <Step number={5} title="C'est prêt !">
                  <p>
                    Les embeddings seront générés automatiquement quand vous
                    sauvegardez une requête. La recherche sémantique s&apos;active
                    dès qu&apos;au moins une requête a un embedding.
                  </p>
                </Step>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="openai" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Configuration OpenAI + text-embedding-3-small
                </CardTitle>
                <CardDescription>
                  Modèle cloud, très performant, 1536 dimensions.
                  Coût : ~$0.02 / million de tokens (quasi gratuit).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Step number={1} title="Obtenir une clé API OpenAI">
                  <p>
                    Créer une clé sur{" "}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      platform.openai.com/api-keys
                      <ExternalLink className="size-3" />
                    </a>
                  </p>
                </Step>

                <Step number={2} title="Configurer le provider">
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                    <p>
                      Aller dans{" "}
                      <a href="/settings" className="text-primary hover:underline">
                        Settings &gt; Providers
                      </a>
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-emerald-500" />
                        <span>
                          Nom : <strong>OpenAI</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-emerald-500" />
                        <span>
                          Slug : <strong>openai</strong> (exactement)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-emerald-500" />
                        <span>
                          API Key : votre clé <code className="rounded bg-muted px-1.5 py-0.5 font-mono">sk-...</code>
                        </span>
                      </div>
                    </div>
                  </div>
                </Step>

                <Step number={3} title="Terminé">
                  <p>
                    OpenAI est prioritaire sur Ollama. Si les deux sont configurés,
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono mx-1">
                      text-embedding-3-small
                    </code>
                    sera utilisé.
                  </p>
                </Step>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fallback" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mode sans embedding</CardTitle>
                <CardDescription>
                  Si aucun provider d&apos;embedding n&apos;est configuré, le système fonctionne
                  quand même avec un classement par fréquence d&apos;utilisation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      Avec embeddings
                    </p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>Recherche par sens (sémantique)</li>
                      <li>&quot;ventes du mois&quot; trouve &quot;chiffre d&apos;affaires mensuel&quot;</li>
                      <li>Score de similarité précis (cosine)</li>
                      <li>Top 5 par pertinence</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                      Sans embeddings (fallback)
                    </p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>Classement par fréquence d&apos;utilisation</li>
                      <li>Top 5 requêtes les plus utilisées</li>
                      <li>Pas de compréhension du sens</li>
                      <li>Fonctionne sans configuration</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Memory features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="size-4 text-violet-500" />
              Ce qui est injecté dans le contexte
            </CardTitle>
            <CardDescription>
              A chaque message, le system prompt est enrichi avec ces données.
              Tronqué à 2000 caractères.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
                <Database className="mt-0.5 size-4 shrink-0 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Requêtes mémorisées</p>
                  <p className="text-xs text-muted-foreground">
                    Top 5 par similarité sémantique (ou par use_count en fallback).
                    Si score &gt; 0.85, la requête est proposée en priorité.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
                <Shield className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">Mutations récentes</p>
                  <p className="text-xs text-muted-foreground">
                    10 derniers UPDATE/DELETE exécutés avec nombre de lignes et durée.
                    Permet à l&apos;assistant de connaître les actions récentes.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
                <MessageSquare className="mt-0.5 size-4 shrink-0 text-violet-500" />
                <div>
                  <p className="text-sm font-medium">Résumés de conversations</p>
                  <p className="text-xs text-muted-foreground">
                    Résumés auto-générés des 5 dernières conversations (après 4+ messages).
                    Donne du contexte sur les sujets précédemment abordés.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="size-4 text-muted-foreground" />
              Priorité des providers d&apos;embedding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 text-sm">
              <span className="rounded-lg border bg-muted/30 px-3 py-2 font-medium">
                OpenAI
                <span className="ml-1.5 text-xs text-muted-foreground">
                  text-embedding-3-small
                </span>
              </span>
              <ArrowRight className="size-4 text-muted-foreground" />
              <span className="rounded-lg border bg-muted/30 px-3 py-2 font-medium">
                Ollama
                <span className="ml-1.5 text-xs text-muted-foreground">
                  nomic-embed-text
                </span>
              </span>
              <ArrowRight className="size-4 text-muted-foreground" />
              <span className="rounded-lg border bg-muted/30 px-3 py-2 font-medium text-muted-foreground">
                Fallback use_count
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
