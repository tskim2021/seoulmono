ALTER TABLE `users` ADD `emailNotifyOrder` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailNotifyPoint` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailNotifyReview` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailNotifyComment` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailNotifySystem` int DEFAULT 1 NOT NULL;