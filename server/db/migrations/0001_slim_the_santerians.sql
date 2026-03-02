CREATE TABLE `rooms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `tasks` ADD `roomId` integer REFERENCES rooms(id);--> statement-breakpoint
ALTER TABLE `tasks` ADD `steps` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `recurrenceInterval` integer;--> statement-breakpoint
ALTER TABLE `tasks` ADD `lastDoneAt` integer;--> statement-breakpoint
ALTER TABLE `tasks` ADD `nextDueAt` integer;