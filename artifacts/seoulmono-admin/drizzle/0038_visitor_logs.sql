-- Create visitor logs table
CREATE TABLE IF NOT EXISTS `visitorLogs` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `sessionId` varchar(64) NOT NULL,
  `userId` int,
  `ip` varchar(45),
  `path` varchar(255) NOT NULL,
  `userAgent` varchar(255),
  `referer` varchar(255),
  `country` varchar(2),
  `device` varchar(20) DEFAULT 'desktop',
  `isNew` enum('yes','no') NOT NULL DEFAULT 'no',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_visitorLogs_sessionId` ON `visitorLogs` (`sessionId`);
CREATE INDEX `idx_visitorLogs_createdAt` ON `visitorLogs` (`createdAt`);
CREATE INDEX `idx_visitorLogs_userId` ON `visitorLogs` (`userId`);
CREATE INDEX `idx_visitorLogs_path` ON `visitorLogs` (`path`);
