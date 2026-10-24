ALTER TABLE `posts` ADD `likeCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `isHidden` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `isBest` int DEFAULT 0 NOT NULL;