import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
  integer,
  numeric,
  primaryKey,
} from "drizzle-orm/pg-core";

// ─── Better Auth tables (managed by better-auth) ───

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Application tables ───

export const folders = pgTable("folders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  summary: text("summary"),
  starred: boolean("starred").notNull().default(false),
  archived: boolean("archived").notNull().default(false),
  folderId: uuid("folder_id").references(() => folders.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user' | 'assistant' | 'system'
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const aiProviders = pgTable("ai_providers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  baseUrl: text("base_url"),
  apiKeyEncrypted: text("api_key_encrypted"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const aiModels = pgTable("ai_models", {
  id: uuid("id").defaultRandom().primaryKey(),
  providerId: uuid("provider_id")
    .notNull()
    .references(() => aiProviders.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  modelId: text("model_id").notNull(),
  modelClass: text("model_class"), // 'fast' | 'smart' | 'fixer' | 'judge'
  inputCostPer1k: numeric("input_cost_per_1k"),
  outputCostPer1k: numeric("output_cost_per_1k"),
  maxTokens: integer("max_tokens"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  dbAccessMode: text("db_access_mode").notNull().default("none"), // 'none' | 'read' | 'write' | 'admin'
});

export const userRoles = pgTable(
  "user_roles",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.userId, table.roleId] })]
);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id"),
  action: text("action").notNull(),
  resource: text("resource"),
  sqlExecuted: text("sql_executed"),
  durationMs: integer("duration_ms"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const modelMetrics = pgTable("model_metrics", {
  id: uuid("id").defaultRandom().primaryKey(),
  modelId: uuid("model_id").references(() => aiModels.id, {
    onDelete: "set null",
  }),
  taskType: text("task_type"),
  latencyMs: integer("latency_ms"),
  tokensUsed: integer("tokens_used"),
  cost: numeric("cost"),
  success: boolean("success"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const dbConnections = pgTable("db_connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull().default("postgresql"),
  host: text("host"),
  port: integer("port").default(5432),
  database: text("database"),
  username: text("username"),
  passwordEncrypted: text("password_encrypted"),
  filePath: text("file_path"),
  sslEnabled: boolean("ssl_enabled").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const prompts = pgTable("prompts", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull().default("general"),
  content: text("content").notNull(),
  version: integer("version").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
