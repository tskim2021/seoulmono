CREATE TABLE `gradeBenefits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`grade` enum('bronze','silver','gold','vip','vvip') NOT NULL,
	`discountRate` int NOT NULL DEFAULT 0,
	`pointRate` int NOT NULL DEFAULT 1,
	`freeShippingThreshold` int NOT NULL DEFAULT 0,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gradeBenefits_id` PRIMARY KEY(`id`),
	CONSTRAINT `gradeBenefits_grade_unique` UNIQUE(`grade`)
);
