import { sql } from "drizzle-orm";
import { db } from "./index";
import {
  user,
  account,
  roles,
  userRoles,
  aiProviders,
  aiModels,
  folders,
  conversations,
  messages,
  auditLogs,
  modelMetrics,
  dbConnections,
  session,
  verification,
} from "./schema";
import { encrypt } from "../lib/crypto";
import { seedPrompts } from "./seeders/prompt-seeder";

async function truncateAll() {
  // Truncate in correct order respecting FK constraints
  await db.execute(
    sql`TRUNCATE TABLE
      messages,
      conversations,
      folders,
      user_roles,
      ai_models,
      ai_providers,
      db_connections,
      model_metrics,
      audit_logs,
      prompts,
      session,
      verification,
      account,
      roles,
      "user"
    CASCADE`
  );
  console.log("✓ All tables truncated");
}

async function seed() {
  console.log("Seeding database...\n");

  await truncateAll();

  // ─── Roles ───
  const [adminRole, editorRole, readerRole] = await db
    .insert(roles)
    .values([
      { name: "Admin", slug: "admin", dbAccessMode: "admin" },
      { name: "Editor", slug: "editor", dbAccessMode: "write" },
      { name: "Reader", slug: "reader", dbAccessMode: "read" },
    ])
    .returning();
  console.log("✓ Roles seeded");

  // ─── Demo users (password: "password123") ───
  // Hash password using better-auth's scrypt format (salt:key in hex)
  const { hashPassword } = await import("better-auth/crypto");
  const hashedPassword = await hashPassword("password123");

  await db.insert(user).values([
    {
      id: "seed-user-001",
      name: "Kevin Demo",
      email: "kevin@demo.com",
      emailVerified: true,
    },
    {
      id: "seed-user-002",
      name: "Alice Reader",
      email: "alice@demo.com",
      emailVerified: true,
    },
  ]);

  await db.insert(account).values([
    {
      id: "seed-account-001",
      accountId: "seed-user-001",
      providerId: "credential",
      userId: "seed-user-001",
      password: hashedPassword,
    },
    {
      id: "seed-account-002",
      accountId: "seed-user-002",
      providerId: "credential",
      userId: "seed-user-002",
      password: hashedPassword,
    },
  ]);
  console.log("✓ Users seeded (kevin@demo.com / alice@demo.com — password123)");

  // ─── User roles ───
  await db.insert(userRoles).values([
    { userId: "seed-user-001", roleId: adminRole.id },
    { userId: "seed-user-002", roleId: readerRole.id },
  ]);
  console.log("✓ User roles assigned");

  // ─── AI Providers ───
  const [openaiProvider, anthropicProvider, ollamaProvider, mistralProvider] = await db
    .insert(aiProviders)
    .values([
      {
        name: "OpenAI",
        slug: "openai",
        baseUrl: "https://api.openai.com/v1",
        isEnabled: true,
      },
      {
        name: "Anthropic",
        slug: "anthropic",
        baseUrl: "https://api.anthropic.com",
        isEnabled: true,
      },
      {
        name: "Ollama",
        slug: "ollama",
        baseUrl: "http://localhost:11434",
        isEnabled: false,
      },
      {
        name: "Mistral",
        slug: "mistral",
        isEnabled: true,
      },
    ])
    .returning();
  console.log("✓ AI providers seeded");

  // ─── AI Models ───
  await db.insert(aiModels).values([
    {
      providerId: openaiProvider.id,
      name: "GPT-4o",
      modelId: "gpt-4o",
      modelClass: "smart",
      inputCostPer1k: "0.0025",
      outputCostPer1k: "0.01",
      maxTokens: 128000,
      isEnabled: true,
    },
    {
      providerId: openaiProvider.id,
      name: "GPT-4o Mini",
      modelId: "gpt-4o-mini",
      modelClass: "fast",
      inputCostPer1k: "0.00015",
      outputCostPer1k: "0.0006",
      maxTokens: 128000,
      isEnabled: true,
    },
    {
      providerId: openaiProvider.id,
      name: "o1",
      modelId: "o1",
      modelClass: "smart",
      inputCostPer1k: "0.015",
      outputCostPer1k: "0.06",
      maxTokens: 200000,
      isEnabled: true,
    },
    {
      providerId: anthropicProvider.id,
      name: "Claude Opus 4",
      modelId: "claude-opus-4-20250514",
      modelClass: "smart",
      inputCostPer1k: "0.015",
      outputCostPer1k: "0.075",
      maxTokens: 200000,
      isEnabled: true,
    },
    {
      providerId: anthropicProvider.id,
      name: "Claude Sonnet 4",
      modelId: "claude-sonnet-4-20250514",
      modelClass: "smart",
      inputCostPer1k: "0.003",
      outputCostPer1k: "0.015",
      maxTokens: 200000,
      isEnabled: true,
    },
    {
      providerId: anthropicProvider.id,
      name: "Claude Haiku 3.5",
      modelId: "claude-haiku-4-5-20251001",
      modelClass: "fast",
      inputCostPer1k: "0.0008",
      outputCostPer1k: "0.004",
      maxTokens: 200000,
      isEnabled: true,
    },
    {
      providerId: ollamaProvider.id,
      name: "Llama 3.1 8B",
      modelId: "llama3.1:8b",
      modelClass: "fast",
      inputCostPer1k: "0",
      outputCostPer1k: "0",
      maxTokens: 128000,
      isEnabled: false,
    },
    {
      providerId: ollamaProvider.id,
      name: "Mistral 7B",
      modelId: "mistral:7b",
      modelClass: "fast",
      inputCostPer1k: "0",
      outputCostPer1k: "0",
      maxTokens: 32000,
      isEnabled: false,
    },
    // OpenAI GPT-4.1 family + o3/o4
    {
      providerId: openaiProvider.id,
      name: "GPT-4.1",
      modelId: "gpt-4.1",
      modelClass: "smart",
      inputCostPer1k: "0.002",
      outputCostPer1k: "0.008",
      maxTokens: 1047576,
      isEnabled: true,
    },
    {
      providerId: openaiProvider.id,
      name: "GPT-4.1 Mini",
      modelId: "gpt-4.1-mini",
      modelClass: "fast",
      inputCostPer1k: "0.0004",
      outputCostPer1k: "0.0016",
      maxTokens: 1047576,
      isEnabled: true,
    },
    {
      providerId: openaiProvider.id,
      name: "GPT-4.1 Nano",
      modelId: "gpt-4.1-nano",
      modelClass: "fast",
      inputCostPer1k: "0.0001",
      outputCostPer1k: "0.0004",
      maxTokens: 1047576,
      isEnabled: true,
    },
    {
      providerId: openaiProvider.id,
      name: "o3",
      modelId: "o3",
      modelClass: "smart",
      inputCostPer1k: "0.01",
      outputCostPer1k: "0.04",
      maxTokens: 200000,
      isEnabled: true,
    },
    {
      providerId: openaiProvider.id,
      name: "o4-mini",
      modelId: "o4-mini",
      modelClass: "fast",
      inputCostPer1k: "0.0011",
      outputCostPer1k: "0.0044",
      maxTokens: 200000,
      isEnabled: true,
    },
    // Mistral models
    {
      providerId: mistralProvider.id,
      name: "Mistral Large",
      modelId: "mistral-large-latest",
      modelClass: "smart",
      inputCostPer1k: "0.002",
      outputCostPer1k: "0.006",
      maxTokens: 128000,
      isEnabled: true,
    },
    {
      providerId: mistralProvider.id,
      name: "Mistral Small",
      modelId: "mistral-small-latest",
      modelClass: "fast",
      inputCostPer1k: "0.0001",
      outputCostPer1k: "0.0003",
      maxTokens: 128000,
      isEnabled: true,
    },
    {
      providerId: mistralProvider.id,
      name: "Magistral Medium",
      modelId: "magistral-medium-2507",
      modelClass: "smart",
      inputCostPer1k: "0.002",
      outputCostPer1k: "0.005",
      maxTokens: 40000,
      isEnabled: true,
    },
  ]);
  console.log("✓ AI models seeded");

  // ─── Folders ───
  const [workFolder] = await db
    .insert(folders)
    .values([
      { userId: "seed-user-001", name: "Work" },
      { userId: "seed-user-001", name: "Personal" },
    ])
    .returning();
  console.log("✓ Folders seeded");

  // ─── Conversations ───
  const [conv1, conv2, conv3, conv4] = await db
    .insert(conversations)
    .values([
      {
        userId: "seed-user-001",
        title: "Data Analysis Help",
        starred: true,
        folderId: workFolder.id,
      },
      {
        userId: "seed-user-001",
        title: "API Integration",
        folderId: workFolder.id,
      },
      {
        userId: "seed-user-001",
        title: "Code Review Request",
      },
      {
        userId: "seed-user-001",
        title: "Database Schema Design",
        starred: true,
        folderId: workFolder.id,
      },
      {
        userId: "seed-user-001",
        title: "Performance Optimization",
        archived: true,
      },
    ])
    .returning();
  console.log("✓ Conversations seeded");

  // ─── Messages ───
  await db.insert(messages).values([
    {
      conversationId: conv1.id,
      role: "user",
      content:
        "Can you help me analyze this dataset? I have sales data from the last quarter.",
    },
    {
      conversationId: conv1.id,
      role: "assistant",
      content:
        "Of course! I'd be happy to help you analyze your sales data. Could you tell me more about the dataset? Specifically:\n\n1. **What columns** does it contain?\n2. **How many rows** of data?\n3. **What insights** are you looking for?\n\nOnce I understand the structure, I can help you write queries to extract meaningful insights.",
    },
    {
      conversationId: conv1.id,
      role: "user",
      content:
        "It has columns: date, product_name, quantity, revenue, region. About 50,000 rows.",
    },
    {
      conversationId: conv1.id,
      role: "assistant",
      content:
        "Great dataset! Here are some queries we can run:\n\n```sql\n-- Total revenue by region\nSELECT region, SUM(revenue) as total_revenue\nFROM sales\nGROUP BY region\nORDER BY total_revenue DESC;\n\n-- Top 10 products by quantity sold\nSELECT product_name, SUM(quantity) as total_sold\nFROM sales\nGROUP BY product_name\nORDER BY total_sold DESC\nLIMIT 10;\n```\n\nWant me to run these against your database?",
    },
    {
      conversationId: conv2.id,
      role: "user",
      content:
        "How do I integrate with the REST API for our user management system?",
    },
    {
      conversationId: conv2.id,
      role: "assistant",
      content:
        "Here's how to integrate with the User Management API:\n\n**Base URL**: `https://api.example.com/v1`\n\n**Authentication**: Bearer token in the `Authorization` header.\n\n**Key endpoints**:\n- `GET /users` — List all users\n- `POST /users` — Create a user\n- `GET /users/:id` — Get user details\n- `PATCH /users/:id` — Update user\n- `DELETE /users/:id` — Delete user\n\nWould you like me to show you example code for any of these?",
    },
    {
      conversationId: conv3.id,
      role: "user",
      content: "Please review my React component for any issues.",
    },
    {
      conversationId: conv3.id,
      role: "assistant",
      content:
        "I'd be happy to review your React component! Please share the code and I'll look for:\n\n- **Performance issues** (unnecessary re-renders, missing memoization)\n- **Accessibility** (ARIA attributes, keyboard navigation)\n- **Best practices** (hooks usage, state management)\n- **Security** (XSS prevention, input sanitization)\n\nPaste your component code and I'll provide a detailed review.",
    },
    {
      conversationId: conv4.id,
      role: "user",
      content:
        "What's the best schema for a multi-tenant SaaS application?",
    },
    {
      conversationId: conv4.id,
      role: "assistant",
      content:
        "There are three main approaches for multi-tenant database schemas:\n\n### 1. Shared Database, Shared Schema (Row-Level)\n```sql\nCREATE TABLE organizations (\n  id UUID PRIMARY KEY,\n  name TEXT NOT NULL\n);\n\nCREATE TABLE users (\n  id UUID PRIMARY KEY,\n  org_id UUID REFERENCES organizations(id),\n  email TEXT NOT NULL\n);\n```\n**Pros**: Simple, cost-effective\n**Cons**: Need RLS policies everywhere\n\n### 2. Shared Database, Separate Schemas\nEach tenant gets their own PostgreSQL schema.\n**Pros**: Better isolation\n**Cons**: Migration complexity\n\n### 3. Separate Databases\n**Pros**: Full isolation\n**Cons**: Expensive, complex management\n\nFor most SaaS apps, I recommend **option 1 with PostgreSQL RLS**. Want me to design a detailed schema?",
    },
  ]);
  console.log("✓ Messages seeded");

  // ─── DB Connections ───
  await db.insert(dbConnections).values([
    {
      userId: "seed-user-001",
      name: "iautos (local)",
      host: "localhost",
      port: 5432,
      database: "iautos",
      username: "test",
      passwordEncrypted: encrypt("test"),
      sslEnabled: false,
      isActive: true,
    },
  ]);
  console.log("✓ DB connections seeded");

  // ─── Prompts ───
  await seedPrompts();

  console.log("\n✅ Seed complete!");
  console.log("   Demo accounts:");
  console.log("   → kevin@demo.com / password123 (admin)");
  console.log("   → alice@demo.com / password123 (reader)");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
