import { generateText } from "ai";
import type { Intent } from "./types";
import { PromptService } from "../services/prompt-service";

const ANALYSIS_KEYWORDS = /\b(analy[sz]e?r?|optimi[sz]e?r?|performance|diagnostic|lenteur|slow|bloat|vacuum|dead.?tuples?|index.?manquant)\b/i;
const SCHEMA_KEYWORDS = /\b(schéma|schema|tables?|colonnes?|columns?|structure|DDL)\b/i;
const QUERY_KEYWORDS = /\b(combien|liste|montre.*données|count|select|affiche|récupère|fetch|show.*data)\b/i;
const MUTATION_KEYWORDS = /\b(modifie|supprime|update|delete|insert|ajoute|crée|drop)\b/i;

/**
 * Fast keyword-based classification. Returns null if ambiguous.
 */
function classifyByKeywords(message: string): Intent | null {
  if (ANALYSIS_KEYWORDS.test(message)) return "query";
  if (SCHEMA_KEYWORDS.test(message) && !QUERY_KEYWORDS.test(message)) return "schema";
  if (MUTATION_KEYWORDS.test(message)) return "mutation";
  if (QUERY_KEYWORDS.test(message)) return "query";
  return null;
}

/**
 * Classify user intent using keyword matching first, then LLM fallback.
 * Without a DB connection, returns 'general' immediately.
 */
export async function classifyIntent(
  message: string,
  hasConnection: boolean,
  providerClient: any,
  modelId: string
): Promise<Intent> {
  if (!hasConnection) return "general";

  // Fast path: keyword-based classification (instant, free, reliable)
  const keywordIntent = classifyByKeywords(message);
  if (keywordIntent) return keywordIntent;

  // Slow path: LLM fallback for ambiguous messages
  try {
    const systemPrompt = await PromptService.get("intent-classifier");

    const { text } = await generateText({
      model: providerClient(modelId) as any,
      system: systemPrompt,
      prompt: message,
      maxOutputTokens: 10,
    });

    const cleaned = text.trim().toLowerCase().replace(/[^a-z]/g, "");
    const intent = cleaned as Intent;
    if (["schema", "query", "mutation", "general"].includes(intent)) {
      return intent;
    }
    return "general";
  } catch {
    return "general";
  }
}
