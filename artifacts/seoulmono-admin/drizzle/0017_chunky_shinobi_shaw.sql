ALTER TABLE `reviewPointSettings` ADD `likePointsThreshold` int DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE `reviewPointSettings` ADD `pointsPerLikeThreshold` int DEFAULT 50 NOT NULL;