ALTER TABLE garden_collection ADD COLUMN growth_base INTEGER NOT NULL DEFAULT 1;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS garden_watering_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  collection_key TEXT NOT NULL,
  day TEXT NOT NULL,
  person TEXT NOT NULL,
  source_event_at TEXT NOT NULL UNIQUE,
  watered_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_garden_watering_events_day ON garden_watering_events(day);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_garden_watering_events_collection ON garden_watering_events(collection_key);
