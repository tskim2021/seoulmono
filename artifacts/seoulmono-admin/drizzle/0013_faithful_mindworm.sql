CREATE TABLE `chatbotCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`icon` varchar(50),
	`description` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`parentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatbotCategories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatbotConversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`sessionId` varchar(100) NOT NULL,
	`messages` json NOT NULL,
	`satisfaction` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatbotConversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatbotQna` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatbotQna_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatbotSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`greetingMessage` text NOT NULL DEFAULT ('안녕하세요! YoungCart AI 상담사입니다. 무엇을 도와드릴까요?'),
	`isEnabled` int NOT NULL DEFAULT 1,
	`systemPromptOverride` text,
	`maxTurns` int NOT NULL DEFAULT 20,
	`responseUnavailableMessage` text DEFAULT ('죄송합니다. 해당 질문에 대한 답변을 찾을 수 없습니다. 고객센터(평일 09:00-18:00)로 문의해주세요.'),
	`operatingHoursStart` varchar(5) DEFAULT '00:00',
	`operatingHoursEnd` varchar(5) DEFAULT '23:59',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatbotSettings_id` PRIMARY KEY(`id`)
);
