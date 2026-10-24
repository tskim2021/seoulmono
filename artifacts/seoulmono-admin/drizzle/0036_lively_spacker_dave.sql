ALTER TABLE `chatbotSettings` MODIFY COLUMN `greetingMessage` text NOT NULL DEFAULT ('안녕하세요! 탈모학교 AI 상담사입니다. 무엇을 도와드릴까요?');--> statement-breakpoint
ALTER TABLE `products` ADD `hashtags` json;