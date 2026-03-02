import { describe, it, expect } from "bun:test";

/**
 * Replicated from message-item.tsx — the helper that normalizes tool part names
 * from both typed (ToolUIPart) and dynamic (DynamicToolUIPart) AI SDK v6 formats.
 */
function getToolPartName(part: { type: string; toolName?: string }): string | null {
  if (part.type === "dynamic-tool") return part.toolName ?? null;
  if (part.type.startsWith("tool-")) return part.type.slice(5);
  return null;
}

describe("getToolPartName", () => {
  it("extracts name from typed ToolUIPart (tool-getSchema)", () => {
    expect(getToolPartName({ type: "tool-getSchema" })).toBe("getSchema");
  });

  it("extracts name from typed ToolUIPart (tool-executeSQL)", () => {
    expect(getToolPartName({ type: "tool-executeSQL" })).toBe("executeSQL");
  });

  it("extracts name from typed ToolUIPart (tool-executeMutationSQL)", () => {
    expect(getToolPartName({ type: "tool-executeMutationSQL" })).toBe("executeMutationSQL");
  });

  it("extracts name from DynamicToolUIPart (dynamic-tool)", () => {
    expect(getToolPartName({ type: "dynamic-tool", toolName: "getSchema" })).toBe("getSchema");
  });

  it("extracts name from DynamicToolUIPart for executeSQL", () => {
    expect(getToolPartName({ type: "dynamic-tool", toolName: "executeSQL" })).toBe("executeSQL");
  });

  it("returns null for text parts", () => {
    expect(getToolPartName({ type: "text" })).toBeNull();
  });

  it("returns null for reasoning parts", () => {
    expect(getToolPartName({ type: "reasoning" })).toBeNull();
  });

  it("returns null for step-start parts", () => {
    expect(getToolPartName({ type: "step-start" })).toBeNull();
  });

  it("returns null for dynamic-tool without toolName", () => {
    expect(getToolPartName({ type: "dynamic-tool" })).toBeNull();
  });
});

describe("processedParts dedup/grouping logic", () => {
  function processPartsLike(parts: any[]): any[] {
    const result: any[] = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const toolName = getToolPartName(part);

      if (toolName === "getSchema") {
        const prevIdx = result.findLastIndex((p) => getToolPartName(p) === "getSchema");
        if (prevIdx !== -1) {
          const prev = result[prevIdx];
          if ((prev.input?.tableNameFilter ?? "") === (part.input?.tableNameFilter ?? "")) {
            result[prevIdx] = part;
            continue;
          }
        }
      }

      if (toolName === "executeSQL") {
        const lastResult = result[result.length - 1];
        if (lastResult && lastResult.__groupedSql) {
          lastResult.__groupedParts.push(part);
          continue;
        }
        result.push({ ...part, __groupedSql: true, __groupedParts: [part] });
        continue;
      }

      result.push(part);
    }
    return result;
  }

  it("deduplicates getSchema with typed format (tool-getSchema)", () => {
    const parts = [
      { type: "tool-getSchema", state: "input-available", input: {} },
      { type: "tool-getSchema", state: "output-available", input: {}, output: { tables: [] } },
    ];
    const result = processPartsLike(parts);
    expect(result).toHaveLength(1);
    expect(result[0].state).toBe("output-available");
  });

  it("deduplicates getSchema with dynamic-tool format", () => {
    const parts = [
      { type: "dynamic-tool", toolName: "getSchema", state: "input-available", input: {} },
      { type: "dynamic-tool", toolName: "getSchema", state: "output-available", input: {}, output: { tables: [] } },
    ];
    const result = processPartsLike(parts);
    expect(result).toHaveLength(1);
    expect(result[0].state).toBe("output-available");
  });

  it("deduplicates getSchema with mixed formats", () => {
    const parts = [
      { type: "tool-getSchema", state: "input-available", input: {} },
      { type: "dynamic-tool", toolName: "getSchema", state: "output-available", input: {}, output: { tables: [] } },
    ];
    const result = processPartsLike(parts);
    expect(result).toHaveLength(1);
    expect(result[0].state).toBe("output-available");
  });

  it("groups consecutive executeSQL (typed format)", () => {
    const parts = [
      { type: "tool-executeSQL", state: "output-available", input: { query: "SELECT 1" }, output: { rows: [] } },
      { type: "tool-executeSQL", state: "output-available", input: { query: "SELECT 2" }, output: { rows: [] } },
    ];
    const result = processPartsLike(parts);
    expect(result).toHaveLength(1);
    expect(result[0].__groupedParts).toHaveLength(2);
  });

  it("groups consecutive executeSQL (dynamic-tool format)", () => {
    const parts = [
      { type: "dynamic-tool", toolName: "executeSQL", state: "output-available", input: { query: "SELECT 1" }, output: { rows: [] } },
      { type: "dynamic-tool", toolName: "executeSQL", state: "output-available", input: { query: "SELECT 2" }, output: { rows: [] } },
    ];
    const result = processPartsLike(parts);
    expect(result).toHaveLength(1);
    expect(result[0].__groupedParts).toHaveLength(2);
  });

  it("preserves text parts alongside tool parts", () => {
    const parts = [
      { type: "dynamic-tool", toolName: "getSchema", state: "output-available", input: {}, output: { tables: [] } },
      { type: "text", text: "Voici le schéma" },
    ];
    const result = processPartsLike(parts);
    expect(result).toHaveLength(2);
    expect(getToolPartName(result[0])).toBe("getSchema");
    expect(result[1].type).toBe("text");
  });

  it("handles render switch — dynamic-tool getSchema maps to getSchema case", () => {
    const part = { type: "dynamic-tool", toolName: "getSchema", state: "output-available", input: {}, output: { tables: [] } };
    const toolName = getToolPartName(part);
    expect(toolName).toBe("getSchema");
    // This would hit the "case 'getSchema'" in the render switch
  });

  it("handles render switch — dynamic-tool executeSQL maps to executeSQL case", () => {
    const part = { type: "dynamic-tool", toolName: "executeSQL", state: "output-available", input: { query: "SELECT 1" }, output: { rows: [] } };
    const toolName = getToolPartName(part);
    expect(toolName).toBe("executeSQL");
  });
});
