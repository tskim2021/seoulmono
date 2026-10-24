CREATE TABLE `emailTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`logoUrl` text,
	`primaryColor` varchar(7) NOT NULL DEFAULT '#3b82f6',
	`footerText` text,
	`footerLinks` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailTemplates_id` PRIMARY KEY(`id`)
);
