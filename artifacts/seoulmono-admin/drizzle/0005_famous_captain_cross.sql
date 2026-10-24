CREATE TABLE `returnRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`userId` int NOT NULL,
	`type` enum('return','exchange') NOT NULL,
	`status` enum('requested','approved','collecting','collected','completed','rejected') NOT NULL DEFAULT 'requested',
	`reason` text NOT NULL,
	`detailReason` text,
	`images` json,
	`adminMemo` text,
	`returnTrackingNumber` varchar(100),
	`returnCarrierId` int,
	`refundAmount` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `returnRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shipments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`carrierId` int NOT NULL,
	`trackingNumber` varchar(100) NOT NULL,
	`status` enum('ready','picked_up','in_transit','out_for_delivery','delivered','failed') NOT NULL DEFAULT 'ready',
	`estimatedDeliveryDate` timestamp,
	`actualDeliveryDate` timestamp,
	`shippedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shipments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shippingCarriers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(50) NOT NULL,
	`trackingUrlTemplate` text,
	`isActive` int NOT NULL DEFAULT 1,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shippingCarriers_id` PRIMARY KEY(`id`),
	CONSTRAINT `shippingCarriers_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `shippingHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shipmentId` int NOT NULL,
	`status` enum('ready','picked_up','in_transit','out_for_delivery','delivered','failed') NOT NULL,
	`location` varchar(255),
	`description` text,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shippingHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shippingPolicies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`baseFee` int NOT NULL DEFAULT 3000,
	`freeShippingThreshold` int NOT NULL DEFAULT 50000,
	`additionalFee` int NOT NULL DEFAULT 0,
	`additionalFeeRegions` json,
	`isDefault` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shippingPolicies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `couponId` int;--> statement-breakpoint
ALTER TABLE `orders` ADD `couponDiscount` int DEFAULT 0 NOT NULL;