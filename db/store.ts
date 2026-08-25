import { env } from 'cloudflare:workers';

export type Plant = { id:number; name:string; room:string; intervalDays:number; lastWateredAt:string; lastWateredBy:string; createdAt:string; imageKey:string|null };

async function ready() {
  const db = env.DB;
  await db.prepare(`CREATE TABLE IF NOT EXISTS plants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    room TEXT NOT NULL,
    interval_days INTEGER NOT NULL,
    last_watered_at TEXT NOT NULL,
    last_watered_by TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`).run();
  try { await db.prepare('ALTER TABLE plants ADD COLUMN image_key TEXT').run(); } catch {}
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS watering_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plant_id INTEGER NOT NULL,
      person TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 10,
      watered_at TEXT NOT NULL
    )`),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_watering_events_watered_at ON watering_events(watered_at)'),
  ]);
  const count = await db.prepare('SELECT COUNT(*) AS count FROM plants').first<{count:number}>();
  if (!count?.count) {
    const now = new Date();
    const daysAgo = (days:number) => new Date(now.getTime() - days * 86400000).toISOString();
    await db.batch([
      db.prepare('INSERT INTO plants (name, room, interval_days, last_watered_at, last_watered_by, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind('Monstera','Wohnzimmer',7,daysAgo(7),'Du',now.toISOString()),
      db.prepare('INSERT INTO plants (name, room, interval_days, last_watered_at, last_watered_by, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind('Pilea','Küche',7,daysAgo(5),'Sie',now.toISOString()),
      db.prepare('INSERT INTO plants (name, room, interval_days, last_watered_at, last_watered_by, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind('Bogenhanf','Schlafzimmer',14,daysAgo(8),'Du',now.toISOString()),
    ]);
  }
  return db;
}

export async function listPlants() {
  const db = await ready();
  const result = await db.prepare('SELECT id, name, room, interval_days AS intervalDays, last_watered_at AS lastWateredAt, last_watered_by AS lastWateredBy, created_at AS createdAt, image_key AS imageKey FROM plants ORDER BY datetime(last_watered_at, printf("+%d days", interval_days)) ASC').all<Plant>();
  return result.results;
}

export async function waterPlant(id:number, person:string) {
  const db = await ready();
  const now = new Date().toISOString();
  await db.batch([
    db.prepare('UPDATE plants SET last_watered_at = ?, last_watered_by = ? WHERE id = ?').bind(now, person, id),
    db.prepare('INSERT INTO watering_events (plant_id, person, points, watered_at) VALUES (?, ?, 10, ?)').bind(id, person, now),
  ]);
}

export async function getWateringStats() {
  const db = await ready();
  const scores = await db.prepare(`SELECT person, SUM(points) AS points, COUNT(*) AS waterings
    FROM watering_events GROUP BY person`).all<{person:string; points:number; waterings:number}>();
  const days = await db.prepare(`SELECT DISTINCT substr(watered_at, 1, 10) AS day
    FROM watering_events ORDER BY day DESC`).all<{day:string}>();
  const daySet = new Set(days.results.map((row) => row.day));
  const cursor = new Date(); cursor.setHours(0,0,0,0);
  if (!daySet.has(cursor.toISOString().slice(0,10))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (daySet.has(cursor.toISOString().slice(0,10))) { streak++; cursor.setDate(cursor.getDate() - 1); }
  const byPerson = Object.fromEntries(scores.results.map((row) => [row.person, { points: Number(row.points), waterings: Number(row.waterings) }]));
  return { streak, scores: { Johannes: byPerson.Johannes ?? {points:0,waterings:0}, Sonja: byPerson.Sonja ?? {points:0,waterings:0} } };
}

export async function addPlant(name:string, room:string, intervalDays:number, person:string, imageKey:string|null=null) {
  const db = await ready(); const now = new Date().toISOString();
  await db.prepare('INSERT INTO plants (name, room, interval_days, last_watered_at, last_watered_by, created_at, image_key) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(name,room,intervalDays,now,person,now,imageKey).run();
}

export async function removePlant(id:number) { const db = await ready(); await db.prepare('DELETE FROM plants WHERE id = ?').bind(id).run(); }
