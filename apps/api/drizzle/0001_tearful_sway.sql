CREATE TABLE "db_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"host" text NOT NULL,
	"port" integer DEFAULT 5432 NOT NULL,
	"database" text NOT NULL,
	"username" text NOT NULL,
	"password_encrypted" text NOT NULL,
	"ssl_enabled" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "db_connections" ADD CONSTRAINT "db_connections_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;