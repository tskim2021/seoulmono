CREATE TABLE `reviewPointSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pointsPerReview` int NOT NULL DEFAULT 100,
	`pointsPerPhotoReview` int NOT NULL DEFAULT 200,
	`minRatingForPoints` int NOT NULL DEFAULT 1,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviewPointSettings_id` PRIMARY KEY(`id`)
);
