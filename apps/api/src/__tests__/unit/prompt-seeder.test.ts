import { describe, it, expect } from "bun:test";
import { DEFAULT_PROMPTS } from "../../db/seeders/prompt-seeder";

describe("DEFAULT_PROMPTS integrity", () => {
  const slugs = [
    "general-system",
    "schema-analyst",
    "query-builder",
    "mutation-handler",
    "intent-classifier",
    "conversation-summary",
  ];

  it("contains all required prompt slugs", () => {
    const found = DEFAULT_PROMPTS.map((p) => p.slug);
    for (const slug of slugs) {
      expect(found).toContain(slug);
    }
  });

  it("every prompt has non-empty content", () => {
    for (const prompt of DEFAULT_PROMPTS) {
      expect(prompt.content.trim().length).toBeGreaterThan(10);
    }
  });

  describe("schema-analyst prompt", () => {
    const prompt = DEFAULT_PROMPTS.find((p) => p.slug === "schema-analyst")!;

    it("instructs the LLM to use getSchema tool", () => {
      expect(prompt.content).toContain("getSchema");
    });

    it("instructs not to reformat schema output", () => {
      expect(prompt.content).toMatch(/ne reformate PAS/i);
    });
  });

  describe("general-system prompt", () => {
    const prompt = DEFAULT_PROMPTS.find((p) => p.slug === "general-system")!;

    it("instructs the LLM to use getSchema tool", () => {
      expect(prompt.content).toContain("getSchema");
    });

    it("instructs the LLM to use executeSQL tool", () => {
      expect(prompt.content).toContain("executeSQL");
    });

    it("limits results to 500 rows", () => {
      expect(prompt.content).toContain("500");
    });
  });

  describe("query-builder prompt", () => {
    const prompt = DEFAULT_PROMPTS.find((p) => p.slug === "query-builder")!;

    it("instructs the LLM to use getSchema and executeSQL", () => {
      expect(prompt.content).toContain("getSchema");
      expect(prompt.content).toContain("executeSQL");
    });

    it("is SELECT-only (read-only)", () => {
      expect(prompt.content).toMatch(/SELECT.*lecture/i);
    });
  });

  describe("mutation-handler prompt", () => {
    const prompt = DEFAULT_PROMPTS.find((p) => p.slug === "mutation-handler")!;

    it("instructs to use executeMutationSQL for mutations", () => {
      expect(prompt.content).toContain("executeMutationSQL");
    });

    it("instructs NEVER to use executeSQL for mutations", () => {
      expect(prompt.content).toMatch(/JAMAIS executeSQL/);
    });

    it("instructs not to ask text confirmation", () => {
      expect(prompt.content).toMatch(/NE DEMANDE JAMAIS de confirmation/i);
    });
  });

  describe("intent-classifier prompt", () => {
    const prompt = DEFAULT_PROMPTS.find((p) => p.slug === "intent-classifier")!;

    it("defines all four intent categories", () => {
      expect(prompt.content).toContain("schema:");
      expect(prompt.content).toContain("query:");
      expect(prompt.content).toContain("mutation:");
      expect(prompt.content).toContain("general:");
    });

    it("instructs to reply with ONLY the category name", () => {
      expect(prompt.content).toMatch(/ONLY the category name/i);
    });
  });
});

describe("seedPrompts onConflictDoUpdate includes content", () => {
  it("seeder source code updates content on conflict", async () => {
    // Read the seeder source to verify the fix
    const file = Bun.file(
      new URL("../../db/seeders/prompt-seeder.ts", import.meta.url)
    );
    const source = await file.text();

    // The onConflictDoUpdate set block must include 'content'
    const conflictMatch = source.match(
      /onConflictDoUpdate\(\{[\s\S]*?set:\s*\{([\s\S]*?)\}/
    );
    expect(conflictMatch).not.toBeNull();

    const setBlock = conflictMatch![1];
    expect(setBlock).toContain("content:");
  });
});
