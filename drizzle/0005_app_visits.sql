CREATE TABLE IF NOT EXISTS app_visits (
  day TEXT NOT NULL,
  person TEXT NOT NULL,
  visited_at TEXT NOT NULL,
  PRIMARY KEY(day, person)
);
