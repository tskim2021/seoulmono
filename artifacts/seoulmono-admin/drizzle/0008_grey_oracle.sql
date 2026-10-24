CREATE TABLE `restockAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`optionName` varchar(100),
	`optionValue` varchar(100),
	`isNotified` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`notifiedAt` timestamp,
	CONSTRAINT `restockAlerts_id` PRIMARY KEY(`id`)
);
