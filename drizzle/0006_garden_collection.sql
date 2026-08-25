CREATE TABLE IF NOT EXISTS garden_collection (
  week_key TEXT PRIMARY KEY NOT NULL,
  plant_key TEXT NOT NULL,
  chosen_by TEXT NOT NULL,
  unlocked_at TEXT NOT NULL,
  xp_at_unlock INTEGER NOT NULL DEFAULT 0
);
