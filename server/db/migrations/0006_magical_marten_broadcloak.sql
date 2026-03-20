CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer,
	`sourceKey` text,
	`name` text NOT NULL,
	`category` text DEFAULT 'other' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`brand` text DEFAULT '' NOT NULL,
	`priceRange` text DEFAULT '' NOT NULL,
	`purchaseUrl` text DEFAULT '' NOT NULL,
	`imageUrl` text DEFAULT '' NOT NULL,
	`rating` integer,
	`status` text DEFAULT 'recommended' NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`reason` text DEFAULT '' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `task_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`taskId` integer NOT NULL,
	`productId` integer NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
