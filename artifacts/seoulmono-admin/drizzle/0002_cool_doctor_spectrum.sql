CREATE TABLE `searchKeywords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`keyword` varchar(100) NOT NULL,
	`searchCount` int NOT NULL DEFAULT 1,
	`lastSearchedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `searchKeywords_id` PRIMARY KEY(`id`)
);
