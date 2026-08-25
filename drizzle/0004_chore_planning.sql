ALTER TABLE `chores` ADD `schedule_mode` text DEFAULT 'flexible' NOT NULL;
--> statement-breakpoint
ALTER TABLE `chores` ADD `cadence_hours` integer DEFAULT 24 NOT NULL;
--> statement-breakpoint
ALTER TABLE `chores` ADD `priority` integer DEFAULT 2 NOT NULL;
--> statement-breakpoint
ALTER TABLE `chores` ADD `due_time` text;
