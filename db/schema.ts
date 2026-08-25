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
