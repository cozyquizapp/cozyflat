import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const plants = sqliteTable('plants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  room: text('room').notNull(),
  intervalDays: integer('interval_days').notNull(),
  lastWateredAt: text('last_watered_at').notNull(),
  lastWateredBy: text('last_watered_by').notNull(),
  createdAt: text('created_at').notNull(),
  imageKey: text('image_key'),
});

export const wateringEvents = sqliteTable('watering_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  plantId: integer('plant_id').notNull(),
  person: text('person').notNull(),
  points: integer('points').notNull().default(10),
  wateredAt: text('watered_at').notNull(),
});

export const appMeta = sqliteTable('app_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const chores = sqliteTable('chores', {
  id: integer('id').primaryKey({ autoIncrement: true }), name: text('name').notNull(), category: text('category').notNull(), icon: text('icon').notNull(), intervalDays: integer('interval_days').notNull(), points: integer('points').notNull(), lastCompletedAt: text('last_completed_at'), lastCompletedBy: text('last_completed_by'), paused: integer('paused').notNull().default(0), scheduleMode: text('schedule_mode').notNull().default('flexible'), cadenceHours: integer('cadence_hours').notNull().default(24), priority: integer('priority').notNull().default(2), dueTime: text('due_time'),
});
export const choreEvents = sqliteTable('chore_events', {
  id: integer('id').primaryKey({ autoIncrement: true }), choreId: integer('chore_id').notNull(), person: text('person').notNull(), points: integer('points').notNull(), completedAt: text('completed_at').notNull(),
});
export const appVisits = sqliteTable('app_visits', {
  day: text('day').notNull(),
  person: text('person').notNull(),
  visitedAt: text('visited_at').notNull(),
});

export const gardenCollection = sqliteTable('garden_collection', {
  weekKey: text('week_key').primaryKey(),
  plantKey: text('plant_key').notNull(),
  chosenBy: text('chosen_by').notNull(),
  unlockedAt: text('unlocked_at').notNull(),
  xpAtUnlock: integer('xp_at_unlock').notNull().default(0),
  room: text('room').notNull().default('Wohnzimmer'),
});
