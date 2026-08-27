CREATE TABLE `applicationMaps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceRevision` varchar(128) NOT NULL,
	`manifest` text NOT NULL,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `applicationMaps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `experimentRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`experimentKey` varchar(128) NOT NULL,
	`hypothesis` text NOT NULL,
	`metric` varchar(128) NOT NULL,
	`controlDescription` text NOT NULL,
	`candidateDescription` text NOT NULL,
	`status` enum('draft','preview','measuring','kept','reverted') NOT NULL,
	`decisionRationale` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `experimentRecords_id` PRIMARY KEY(`id`),
	CONSTRAINT `experimentRecords_experimentKey_unique` UNIQUE(`experimentKey`)
);
--> statement-breakpoint
CREATE TABLE `inspectionFindings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`findingKey` varchar(128) NOT NULL,
	`severity` enum('critical','high','medium','low','info') NOT NULL,
	`title` varchar(255) NOT NULL,
	`affectedPath` varchar(512) NOT NULL,
	`state` enum('open','candidate','resolved','accepted-risk') NOT NULL,
	`confidenceBasisPoints` int NOT NULL,
	`evidence` text NOT NULL,
	`discoveredAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inspectionFindings_id` PRIMARY KEY(`id`),
	CONSTRAINT `inspectionFindings_findingKey_unique` UNIQUE(`findingKey`)
);
--> statement-breakpoint
CREATE TABLE `repairCandidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateKey` varchar(128) NOT NULL,
	`title` varchar(255) NOT NULL,
	`branch` varchar(128) NOT NULL,
	`baseBranch` varchar(128) NOT NULL,
	`status` enum('draft','preview-ready','reviewing','approved','rejected','discarded','promoted') NOT NULL,
	`summary` text NOT NULL,
	`changedFiles` text NOT NULL,
	`gates` text NOT NULL,
	`reviewerDecision` enum('pending','approved','rejected') NOT NULL,
	`previewUrl` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `repairCandidates_id` PRIMARY KEY(`id`),
	CONSTRAINT `repairCandidates_candidateKey_unique` UNIQUE(`candidateKey`),
	CONSTRAINT `repairCandidates_branch_unique` UNIQUE(`branch`)
);
