ALTER TABLE `conversations` ADD `title` text NOT NULL DEFAULT '新对话';
--> statement-breakpoint
ALTER TABLE `conversations` ADD `updatedAt` integer NOT NULL DEFAULT (unixepoch());
