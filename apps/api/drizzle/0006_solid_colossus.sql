ALTER TABLE "db_connections" ALTER COLUMN "host" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "db_connections" ALTER COLUMN "port" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "db_connections" ALTER COLUMN "database" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "db_connections" ALTER COLUMN "username" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "db_connections" ALTER COLUMN "password_encrypted" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "db_connections" ADD COLUMN "type" text DEFAULT 'postgresql' NOT NULL;--> statement-breakpoint
ALTER TABLE "db_connections" ADD COLUMN "file_path" text;