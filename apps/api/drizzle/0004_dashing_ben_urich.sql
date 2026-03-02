CREATE TABLE "prompts" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'general' NOT NULL,
	"content" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
