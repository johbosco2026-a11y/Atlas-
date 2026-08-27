CREATE TABLE `autonomyConfigurations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`autonomyLevel` enum('observer','repair','autonomous','self-optimizing') NOT NULL DEFAULT 'repair',
	`nightlyCron` varchar(64) NOT NULL,
	`experimentsEnabled` enum('true','false') NOT NULL DEFAULT 'false',
	`schedule_cron_task_uid` varchar(65),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `autonomyConfigurations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `engineeringMemoryRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memoryType` enum('incident','fix','architecture','decision') NOT NULL,
	`title` varchar(255) NOT NULL,
	`pattern` text NOT NULL,
	`summary` text NOT NULL,
	`tags` text,
	`protected` enum('true','false') NOT NULL DEFAULT 'false',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `engineeringMemoryRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `governanceAuditEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` enum('inspection','branch','preview','review','promotion','rollback','memory') NOT NULL,
	`title` varchar(255) NOT NULL,
	`detail` text NOT NULL,
	`branch` varchar(128),
	`previewUrl` varchar(512),
	`outcome` varchar(64) NOT NULL,
	`payload` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `governanceAuditEvents_id` PRIMARY KEY(`id`)
);
