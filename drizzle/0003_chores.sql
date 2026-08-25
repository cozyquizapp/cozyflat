CREATE TABLE IF NOT EXISTS `chores` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,`name` text NOT NULL,`category` text NOT NULL,`icon` text NOT NULL,`interval_days` integer NOT NULL,`points` integer NOT NULL,`last_completed_at` text,`last_completed_by` text);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `chore_events` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,`chore_id` integer NOT NULL,`person` text NOT NULL,`points` integer NOT NULL,`completed_at` text NOT NULL);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_chore_events_completed_at` ON `chore_events` (`completed_at`);
