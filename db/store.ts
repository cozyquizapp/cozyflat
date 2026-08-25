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
    db.prepare('CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS chores (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category TEXT NOT NULL, icon TEXT NOT NULL, interval_days INTEGER NOT NULL, points INTEGER NOT NULL, last_completed_at TEXT, last_completed_by TEXT)'),
    db.prepare('CREATE TABLE IF NOT EXISTS chore_events (id INTEGER PRIMARY KEY AUTOINCREMENT, chore_id INTEGER NOT NULL, person TEXT NOT NULL, points INTEGER NOT NULL, completed_at TEXT NOT NULL)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_chore_events_completed_at ON chore_events(completed_at)'),
    db.prepare('CREATE TABLE IF NOT EXISTS app_visits (day TEXT NOT NULL, person TEXT NOT NULL, visited_at TEXT NOT NULL, PRIMARY KEY(day, person))'),
    db.prepare('CREATE TABLE IF NOT EXISTS garden_collection (week_key TEXT PRIMARY KEY NOT NULL, plant_key TEXT NOT NULL, chosen_by TEXT NOT NULL, unlocked_at TEXT NOT NULL, xp_at_unlock INTEGER NOT NULL DEFAULT 0)'),
  ]);
  try { await db.prepare('ALTER TABLE chores ADD COLUMN paused INTEGER NOT NULL DEFAULT 0').run(); } catch {}
  try { await db.prepare("ALTER TABLE chores ADD COLUMN schedule_mode TEXT NOT NULL DEFAULT 'flexible'").run(); } catch {}
  try { await db.prepare('ALTER TABLE chores ADD COLUMN cadence_hours INTEGER NOT NULL DEFAULT 24').run(); } catch {}
  try { await db.prepare('ALTER TABLE chores ADD COLUMN priority INTEGER NOT NULL DEFAULT 2').run(); } catch {}
  try { await db.prepare('ALTER TABLE chores ADD COLUMN due_time TEXT').run(); } catch {}
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
  const baseline = await db.prepare("INSERT OR IGNORE INTO app_meta (key, value) VALUES ('weekly-score-baseline-v1', ?)").bind(new Date().toISOString()).run();
  if (baseline.meta.changes) {
    const now = new Date().toISOString();
    await db.batch([
      db.prepare('DELETE FROM watering_events'),
      db.prepare("UPDATE plants SET last_watered_at = ?, last_watered_by = 'Sonja & Johannes' WHERE lower(room) = 'balkon'").bind(now),
    ]);
  }
  const choreCount = await db.prepare('SELECT COUNT(*) AS count FROM chores').first<{count:number}>();
  if (!choreCount?.count) {
    const rows: [string,string,string,number,number][] = [
      ['Bad putzen','Putzen','🛁',14,30],['Küche putzen','Putzen','✨',14,30],['Hausflur fegen','Hausflur','🧹',28,10],['Hausflur wischen','Hausflur','🪣',28,20],['Wäsche 30°','Wäsche','👕',3,12],['Wäsche 60°','Wäsche','♨️',4,12],['Weißwäsche','Wäsche','🤍',4,12],['Spülmaschine ausräumen','Küche','🍽️',1,5],['Kochen','Küche','🍳',1,10],['Staubsaugen','Putzen','〰️',7,15],['Wohnzimmer aufräumen','Aufräumen','🛋️',7,8],['Küche aufräumen','Aufräumen','☕',7,8],['Arbeitszimmer aufräumen','Aufräumen','✏️',7,8],['Schlafzimmer aufräumen','Aufräumen','🛏️',7,8],['Klamotten verräumen','Wäsche','🧺',3,8],
    ];
    await db.batch(rows.map((row) => db.prepare('INSERT INTO chores (name, category, icon, interval_days, points) VALUES (?, ?, ?, ?, ?)').bind(...row)));
  }
  const essentials = await db.prepare("INSERT OR IGNORE INTO app_meta (key, value) VALUES ('household-essentials-v2', ?)").bind(new Date().toISOString()).run();
  if (essentials.meta.changes) {
    await db.batch([
      db.prepare('INSERT INTO chores (name, category, icon, interval_days, points) VALUES (?, ?, ?, ?, ?)').bind('Einkaufen','Einkauf','🛒',3,12),
      db.prepare('INSERT INTO chores (name, category, icon, interval_days, points) VALUES (?, ?, ?, ?, ?)').bind('Plastikmüll rausbringen','Müll','🟡',7,8),
      db.prepare('INSERT INTO chores (name, category, icon, interval_days, points) VALUES (?, ?, ?, ?, ?)').bind('Biomüll rausbringen','Müll','🟤',3,8),
      db.prepare('INSERT INTO chores (name, category, icon, interval_days, points) VALUES (?, ?, ?, ?, ?)').bind('Papiermüll rausbringen','Müll','🔵',14,10),
      db.prepare('INSERT INTO chores (name, category, icon, interval_days, points) VALUES (?, ?, ?, ?, ?)').bind('Restmüll rausbringen','Müll','⚫',7,8),
      db.prepare('INSERT INTO chores (name, category, icon, interval_days, points) VALUES (?, ?, ?, ?, ?)').bind('Bettwäsche wechseln','Wäsche','🛏️',14,15),
    ]);
  }
  const kitchenUpdate = await db.prepare("INSERT OR IGNORE INTO app_meta (key, value) VALUES ('kitchen-essentials-v3', ?)").bind(new Date().toISOString()).run();
  if (kitchenUpdate.meta.changes) {
    await db.prepare('INSERT INTO chores (name, category, icon, interval_days, points) VALUES (?, ?, ?, ?, ?)').bind('Spülmaschine einräumen','Küche','🥣',1,5).run();
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
  const now = new Date();
  const weekStart = new Date(now); weekStart.setUTCHours(0,0,0,0); weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7));
  const nextWeek = new Date(weekStart); nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
  const previousWeek = new Date(weekStart); previousWeek.setUTCDate(previousWeek.getUTCDate() - 7);
  const [scores, weekly, previous, visits] = await Promise.all([
    db.prepare(`SELECT person, SUM(points) AS points, COUNT(*) AS waterings FROM (SELECT person, points, watered_at AS done_at FROM watering_events UNION ALL SELECT person, points, completed_at AS done_at FROM chore_events) GROUP BY person`).all<{person:string; points:number; waterings:number}>(),
    db.prepare(`SELECT person, SUM(points) AS points, COUNT(*) AS waterings FROM (SELECT person, points, watered_at AS done_at FROM watering_events UNION ALL SELECT person, points, completed_at AS done_at FROM chore_events) WHERE done_at >= ? AND done_at < ? GROUP BY person`).bind(weekStart.toISOString(), nextWeek.toISOString()).all<{person:string; points:number; waterings:number}>(),
    db.prepare(`SELECT person, SUM(points) AS points, COUNT(*) AS waterings FROM (SELECT person, points, watered_at AS done_at FROM watering_events UNION ALL SELECT person, points, completed_at AS done_at FROM chore_events) WHERE done_at >= ? AND done_at < ? GROUP BY person`).bind(previousWeek.toISOString(), weekStart.toISOString()).all<{person:string; points:number; waterings:number}>(),
    db.prepare('SELECT DISTINCT day FROM app_visits ORDER BY day DESC').all<{day:string}>(),
  ]);
  const days = await db.prepare(`SELECT DISTINCT substr(done_at, 1, 10) AS day FROM (SELECT watered_at AS done_at FROM watering_events UNION ALL SELECT completed_at AS done_at FROM chore_events) ORDER BY day DESC`).all<{day:string}>();
  const daySet = new Set(days.results.map((row) => row.day));
  const cursor = new Date(); cursor.setHours(0,0,0,0);
  if (!daySet.has(cursor.toISOString().slice(0,10))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (daySet.has(cursor.toISOString().slice(0,10))) { streak++; cursor.setDate(cursor.getDate() - 1); }
  const mapScores = (rows: typeof scores.results) => {
    const mapped = Object.fromEntries(rows.map((row) => [row.person, { points: Number(row.points), waterings: Number(row.waterings) }]));
    return { Johannes: mapped.Johannes ?? {points:0,waterings:0}, Sonja: mapped.Sonja ?? {points:0,waterings:0} };
  };
  const visitDays = new Set(visits.results.map((row) => row.day));
  const loginCursor = new Date(); loginCursor.setHours(0,0,0,0);
  const loginKey = (date:Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  if (!visitDays.has(loginKey(loginCursor))) loginCursor.setDate(loginCursor.getDate() - 1);
  let loginStreak = 0;
  while (visitDays.has(loginKey(loginCursor))) { loginStreak++; loginCursor.setDate(loginCursor.getDate() - 1); }
  return { streak, loginStreak, loginDays: visitDays.size, scores: mapScores(weekly.results), totalScores: mapScores(scores.results), previousWeek: mapScores(previous.results) };
}

export async function registerVisit(person:string, day:string) {
  const db = await ready();
  await db.prepare('INSERT OR IGNORE INTO app_visits (day, person, visited_at) VALUES (?, ?, ?)').bind(day, person, new Date().toISOString()).run();
  return getWateringStats();
}

const gardenPlants = [
  {key:'monstera',name:'Momo Monstera',emoji:'🌿',pot:'sage'}, {key:'pilea',name:'Pia Pilea',emoji:'🪴',pot:'rose'},
  {key:'calathea',name:'Cally Calathea',emoji:'🌱',pot:'cream'}, {key:'fern',name:'Frieda Farn',emoji:'🌿',pot:'terracotta'},
  {key:'ficus',name:'Fiete Ficus',emoji:'🌳',pot:'sage'}, {key:'alocasia',name:'Alma Alocasia',emoji:'☘️',pot:'rose'},
  {key:'ivy',name:'Edda Efeu',emoji:'🍃',pot:'cream'}, {key:'palm',name:'Palma',emoji:'🌴',pot:'terracotta'},
  {key:'cactus',name:'Kalle Kaktus',emoji:'🌵',pot:'sage'}, {key:'orchid',name:'Olli Orchidee',emoji:'🌸',pot:'rose'},
  {key:'snake',name:'Sanni Bogenhanf',emoji:'🪴',pot:'cream'}, {key:'bonsai',name:'Bo Bonsai',emoji:'🌳',pot:'terracotta'},
];
function currentWeekKey() { const d=new Date(); d.setUTCHours(0,0,0,0); d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7)); return d.toISOString().slice(0,10); }
function weeklyCandidates(weekKey:string) { const seed=Number(weekKey.replaceAll('-','')); const start=seed%gardenPlants.length; return [0,5,9].map((n)=>gardenPlants[(start+n)%gardenPlants.length]); }
async function totalHouseXp(db:Awaited<ReturnType<typeof ready>>) { const row=await db.prepare(`SELECT COALESCE(SUM(points),0) AS xp FROM (SELECT points FROM watering_events UNION ALL SELECT points FROM chore_events)`).first<{xp:number}>(); return Number(row?.xp??0); }
export async function getGarden() { const db=await ready(); const weekKey=currentWeekKey(); const rows=await db.prepare('SELECT week_key AS weekKey, plant_key AS plantKey, chosen_by AS chosenBy, unlocked_at AS unlockedAt, xp_at_unlock AS xpAtUnlock FROM garden_collection ORDER BY unlocked_at').all<{weekKey:string;plantKey:string;chosenBy:string;unlockedAt:string;xpAtUnlock:number}>(); const xp=await totalHouseXp(db); return {weekKey,xp,candidates:weeklyCandidates(weekKey),collection:rows.results.map((row)=>({...row,plant:gardenPlants.find((p)=>p.key===row.plantKey)??gardenPlants[0]})),chosenThisWeek:rows.results.some((row)=>row.weekKey===weekKey)}; }
export async function chooseGardenPlant(plantKey:string, person:string) { const db=await ready(); const weekKey=currentWeekKey(); if(!weeklyCandidates(weekKey).some((p)=>p.key===plantKey)) return getGarden(); const xp=await totalHouseXp(db); await db.prepare('INSERT OR IGNORE INTO garden_collection (week_key, plant_key, chosen_by, unlocked_at, xp_at_unlock) VALUES (?, ?, ?, ?, ?)').bind(weekKey,plantKey,person,new Date().toISOString(),xp).run(); return getGarden(); }

export async function addPlant(name:string, room:string, intervalDays:number, person:string, imageKey:string|null=null) {
  const db = await ready(); const now = new Date().toISOString();
  await db.prepare('INSERT INTO plants (name, room, interval_days, last_watered_at, last_watered_by, created_at, image_key) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(name,room,intervalDays,now,person,now,imageKey).run();
}

export async function removePlant(id:number) { const db = await ready(); await db.prepare('DELETE FROM plants WHERE id = ?').bind(id).run(); }

export type Chore = { id:number; name:string; category:string; icon:string; intervalDays:number; points:number; lastCompletedAt:string|null; lastCompletedBy:string|null; paused:boolean; scheduleMode:'flexible'|'scheduled'; cadenceHours:number; priority:number; dueTime:string|null };
export async function listChores() { const db = await ready(); const result = await db.prepare('SELECT id, name, category, icon, interval_days AS intervalDays, points, last_completed_at AS lastCompletedAt, last_completed_by AS lastCompletedBy, paused, schedule_mode AS scheduleMode, cadence_hours AS cadenceHours, priority, due_time AS dueTime FROM chores ORDER BY paused, priority DESC, category, name').all<Omit<Chore,'paused'> & {paused:number}>(); return result.results.map((row) => ({...row, paused:Boolean(row.paused)})); }
export async function completeChore(id:number, person:string) { const db = await ready(); const now = new Date().toISOString(); const chore = await db.prepare('SELECT points FROM chores WHERE id = ? AND paused = 0').bind(id).first<{points:number}>(); if (!chore) return null; const results = await db.batch([db.prepare('UPDATE chores SET last_completed_at = ?, last_completed_by = ? WHERE id = ?').bind(now, person,id),db.prepare('INSERT INTO chore_events (chore_id, person, points, completed_at) VALUES (?, ?, ?, ?)').bind(id,person,chore.points,now)]); return Number(results[1].meta.last_row_id); }
export async function undoChoreCompletion(id:number, eventId:number) { const db = await ready(); const event = await db.prepare('SELECT id FROM chore_events WHERE id = ? AND chore_id = ?').bind(eventId,id).first(); if (!event) return; await db.prepare('DELETE FROM chore_events WHERE id = ?').bind(eventId).run(); const previous = await db.prepare('SELECT person, completed_at AS completedAt FROM chore_events WHERE chore_id = ? ORDER BY id DESC LIMIT 1').bind(id).first<{person:string;completedAt:string}>(); await db.prepare('UPDATE chores SET last_completed_at = ?, last_completed_by = ? WHERE id = ?').bind(previous?.completedAt ?? null, previous?.person ?? null, id).run(); }
export async function saveChore(input:{id?:number;name:string;category:string;icon:string;intervalDays:number;points:number;paused:boolean;scheduleMode:'flexible'|'scheduled';cadenceHours:number;priority:number;dueTime:string|null}) { const db = await ready(); if (input.id) await db.prepare('UPDATE chores SET name = ?, category = ?, icon = ?, interval_days = ?, points = ?, paused = ?, schedule_mode = ?, cadence_hours = ?, priority = ?, due_time = ? WHERE id = ?').bind(input.name,input.category,input.icon,input.intervalDays,input.points,input.paused?1:0,input.scheduleMode,input.cadenceHours,input.priority,input.dueTime,input.id).run(); else await db.prepare('INSERT INTO chores (name, category, icon, interval_days, points, paused, schedule_mode, cadence_hours, priority, due_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(input.name,input.category,input.icon,input.intervalDays,input.points,input.paused?1:0,input.scheduleMode,input.cadenceHours,input.priority,input.dueTime).run(); }
export async function removeChore(id:number) { const db = await ready(); await db.batch([db.prepare('DELETE FROM chore_events WHERE chore_id = ?').bind(id),db.prepare('DELETE FROM chores WHERE id = ?').bind(id)]); }
