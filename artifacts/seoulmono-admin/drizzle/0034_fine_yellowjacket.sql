CREATE TABLE `discussionAutoLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingId` int NOT NULL,
	`status` enum('success','failed','skipped') NOT NULL,
	`discussionId` int,
	`generatedTitle` varchar(255),
	`errorMessage` text,
	`executionTimeMs` int,
	`triggeredBy` enum('scheduler','manual') NOT NULL DEFAULT 'scheduler',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `discussionAutoLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `discussionAutoSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`isEnabled` int NOT NULL DEFAULT 0,
	`categoryId` int,
	`generateTime` varchar(5) NOT NULL DEFAULT '09:00',
	`topic` varchar(255) NOT NULL,
	`keywords` text,
	`keywordsEn` text,
	`promptTemplate` text,
	`discussionStyle` enum('debate','opinion','question','poll','experience') NOT NULL DEFAULT 'debate',
	`autoPublish` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `discussionAutoSettings_id` PRIMARY KEY(`id`)
);
