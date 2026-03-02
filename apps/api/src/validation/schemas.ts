import { z } from "zod";

export const createConversationSchema = z.object({
  title: z.string().min(1).max(255),
  folderId: z.string().uuid().optional(),
});

export const updateConversationSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  starred: z.boolean().optional(),
  archived: z.boolean().optional(),
  folderId: z.string().uuid().nullable().optional(),
});

export const createProviderSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  baseUrl: z.string().url().optional(),
  apiKey: z.string().min(1).optional(),
  isEnabled: z.boolean().optional(),
});

export const updateProviderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  baseUrl: z.string().url().nullable().optional(),
  apiKey: z.string().min(1).optional(),
  isEnabled: z.boolean().optional(),
});

export const createModelSchema = z.object({
  providerId: z.string().uuid(),
  name: z.string().min(1).max(100),
  modelId: z.string().min(1).max(100),
  modelClass: z.enum(["fast", "smart", "fixer", "judge"]).optional(),
  inputCostPer1k: z.string().optional(),
  outputCostPer1k: z.string().optional(),
  maxTokens: z.number().int().positive().optional(),
  isEnabled: z.boolean().optional(),
});

export const updateModelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  modelId: z.string().min(1).max(100).optional(),
  modelClass: z.enum(["fast", "smart", "fixer", "judge"]).nullable().optional(),
  inputCostPer1k: z.string().optional(),
  outputCostPer1k: z.string().optional(),
  maxTokens: z.number().int().positive().nullable().optional(),
  isEnabled: z.boolean().optional(),
});

export const createConnectionSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["postgresql", "mysql", "mariadb", "sqlite"]).default("postgresql"),
  host: z.string().max(255).optional(),
  port: z.number().int().min(1).max(65535).optional(),
  database: z.string().max(100).optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  filePath: z.string().optional(),
  sslEnabled: z.boolean().default(false),
}).refine(data => {
  if (data.type === "sqlite") return !!data.filePath;
  return !!data.host && !!data.database && !!data.username && !!data.password;
}, { message: "Missing required fields for database type" });

export const updateConnectionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(["postgresql", "mysql", "mariadb", "sqlite"]).optional(),
  host: z.string().min(1).max(255).optional(),
  port: z.number().int().min(1).max(65535).optional(),
  database: z.string().min(1).max(100).optional(),
  username: z.string().min(1).max(100).optional(),
  password: z.string().min(1).optional(),
  filePath: z.string().optional(),
  sslEnabled: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
