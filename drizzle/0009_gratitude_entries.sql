CREATE TABLE IF NOT EXISTS flauschi_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  day TEXT NOT NULL,
  person TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_flauschi_events_day ON flauschi_events(day);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS gratitude_entries (
  day TEXT NOT NULL,
  person TEXT NOT NULL,
  text TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(day, person)
);
