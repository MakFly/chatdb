import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authRoutes } from "./routes/auth";
import { conversationRoutes } from "./routes/conversations";
import { providerRoutes } from "./routes/providers";
import { modelRoutes } from "./routes/models";
import { connectionRoutes } from "./routes/connections";
import { chatRoutes } from "./routes/chat";
import { promptRoutes } from "./routes/prompts";
import { suggestionsRoutes } from "./routes/suggestions";
import { devRoutes } from "./routes/dev";
import auditAnalyticsRoutes from "./routes/audit-analytics";
import connectionAnalysisRoutes from "./routes/connection-analysis";
import { PromptService } from "./services/prompt-service";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3150",
      "http://localhost:3333",
    ],
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["X-Conversation-Id"],
  })
);

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// Routes
app.route("/api/auth", authRoutes);
app.route("/api/v1", conversationRoutes);
app.route("/api/v1", providerRoutes);
app.route("/api/v1", modelRoutes);
app.route("/api/v1", connectionRoutes);
app.route("/api/v1", chatRoutes);
app.route("/api/v1", promptRoutes);
app.route("/api/v1/audit-analytics", auditAnalyticsRoutes);
app.route("/api/v1/connection-analysis", connectionAnalysisRoutes);
app.route("/api/v1/suggestions", suggestionsRoutes);

// Dev-only routes
if (process.env.NODE_ENV !== "production") {
  app.route("/api/dev", devRoutes);
}

const port = Number(process.env.PORT) || 3333;
console.log(`API server running on http://localhost:${port}`);

// Warmup prompt cache on startup
PromptService.warmup().catch((e) => {
  console.warn("Failed to warmup prompt cache:", e.message);
});

export default {
  port,
  fetch: app.fetch,
};
