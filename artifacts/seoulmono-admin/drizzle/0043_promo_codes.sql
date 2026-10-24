CREATE TABLE IF NOT EXISTS `promoCodes` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `code` varchar(50) NOT NULL UNIQUE,
  `name` varchar(255) NOT NULL,
  `description` text,
  `discountType` enum('percent','fixed') NOT NULL,
  `discountValue` int NOT NULL,
  `minOrderAmount` int NOT NULL DEFAULT 0,
  `maxDiscountAmount` int,
  `totalUsageLimit` int NOT NULL DEFAULT -1,
  `usedCount` int NOT NULL DEFAULT 0,
  `perUserLimit` int NOT NULL DEFAULT 1,
  `startDate` timestamp NOT NULL,
  `endDate` timestamp NOT NULL,
  `isActive` int NOT NULL DEFAULT 1,
  `targetProductIds` text,
  `targetCategoryIds` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `promoCodeUsages` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `promoCodeId` int NOT NULL,
  `userId` int NOT NULL,
  `orderId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
