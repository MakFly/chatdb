import { describe, it, expect } from "bun:test";
import {
  createConversationSchema,
  updateConversationSchema,
} from "../../validation/schemas";

describe("createConversationSchema", () => {
  it("valid title passes", () => {
    const result = createConversationSchema.safeParse({ title: "My conversation" });
    expect(result.success).toBe(true);
  });

  it("empty string fails", () => {
    const result = createConversationSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("string longer than 255 chars fails", () => {
    const result = createConversationSchema.safeParse({ title: "a".repeat(256) });
    expect(result.success).toBe(false);
  });

  it("valid title with folderId passes", () => {
    const result = createConversationSchema.safeParse({
      title: "My conversation",
      folderId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(result.success).toBe(true);
  });

  it("invalid folderId (non-uuid) fails", () => {
    const result = createConversationSchema.safeParse({
      title: "My conversation",
      folderId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateConversationSchema", () => {
  it("empty object passes (all fields optional)", () => {
    const result = updateConversationSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("valid partial update with title passes", () => {
    const result = updateConversationSchema.safeParse({ title: "New title" });
    expect(result.success).toBe(true);
  });

  it("valid partial update with starred passes", () => {
    const result = updateConversationSchema.safeParse({ starred: true });
    expect(result.success).toBe(true);
  });

  it("valid partial update with archived passes", () => {
    const result = updateConversationSchema.safeParse({ archived: false });
    expect(result.success).toBe(true);
  });

  it("invalid type for starred fails", () => {
    const result = updateConversationSchema.safeParse({ starred: "yes" });
    expect(result.success).toBe(false);
  });

  it("invalid type for archived fails", () => {
    const result = updateConversationSchema.safeParse({ archived: 1 });
    expect(result.success).toBe(false);
  });

  it("empty title fails", () => {
    const result = updateConversationSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("title > 255 chars fails", () => {
    const result = updateConversationSchema.safeParse({ title: "a".repeat(256) });
    expect(result.success).toBe(false);
  });

  it("folderId can be null", () => {
    const result = updateConversationSchema.safeParse({ folderId: null });
    expect(result.success).toBe(true);
  });
});
