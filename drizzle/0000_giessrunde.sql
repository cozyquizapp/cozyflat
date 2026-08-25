CREATE TABLE `plants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`room` text NOT NULL,
	`interval_days` integer NOT NULL,
	`last_watered_at` text NOT NULL,
	`last_watered_by` text NOT NULL,
	`created_at` text NOT NULL,
	`image_key` text
);
