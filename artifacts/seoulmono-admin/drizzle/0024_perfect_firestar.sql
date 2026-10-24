ALTER TABLE `shipments` MODIFY COLUMN `shippingType` enum('domestic','international') NOT NULL DEFAULT 'international';--> statement-breakpoint
ALTER TABLE `addresses` ADD `addressEn1` varchar(255);--> statement-breakpoint
ALTER TABLE `addresses` ADD `addressEn2` varchar(255);--> statement-breakpoint
ALTER TABLE `orders` ADD `addressEn1` varchar(255);--> statement-breakpoint
ALTER TABLE `orders` ADD `addressEn2` varchar(255);