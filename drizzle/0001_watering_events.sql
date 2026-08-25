CREATE TABLE IF NOT EXISTS `watering_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plant_id` integer NOT NULL,
	`person` text NOT NULL,
	`points` integer DEFAULT 10 NOT NULL,
	`watered_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_watering_events_watered_at` ON `watering_events` (`watered_at`);
