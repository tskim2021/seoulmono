CREATE TABLE `gradeUpgradeConditions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`grade` enum('bronze','silver','gold','vip','vvip') NOT NULL,
	`minTotalSpent` int NOT NULL DEFAULT 0,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gradeUpgradeConditions_id` PRIMARY KEY(`id`),
	CONSTRAINT `gradeUpgradeConditions_grade_unique` UNIQUE(`grade`)
);
