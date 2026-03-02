ALTER TABLE "memorized_queries" ADD COLUMN "user_id" text;--> statement-breakpoint
UPDATE "memorized_queries" SET "user_id" = (SELECT id FROM "user" LIMIT 1) WHERE "user_id" IS NULL;--> statement-breakpoint
ALTER TABLE "memorized_queries" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "memorized_queries" ADD CONSTRAINT "memorized_queries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
