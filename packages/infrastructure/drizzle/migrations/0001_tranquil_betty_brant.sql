DROP INDEX "User_email_unique";--> statement-breakpoint
ALTER TABLE `User` ALTER COLUMN "emailVerified" TO "emailVerified" integer;--> statement-breakpoint
CREATE UNIQUE INDEX `User_email_unique` ON `User` (`email`);