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
  await db.prepare('UPDATE plants SET last_watered_at = ?, last_watered_by = ? WHERE id = ?').bind(new Date().toISOString(), person, id).run();
}

export async function addPlant(name:string, room:string, intervalDays:number, person:string, imageKey:string|null=null) {
  const db = await ready(); const now = new Date().toISOString();
  await db.prepare('INSERT INTO plants (name, room, interval_days, last_watered_at, last_watered_by, created_at, image_key) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(name,room,intervalDays,now,person,now,imageKey).run();
}

export async function removePlant(id:number) { const db = await ready(); await db.prepare('DELETE FROM plants WHERE id = ?').bind(id).run(); }
