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
