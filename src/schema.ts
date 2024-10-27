import { boolean, integer, jsonb, pgTable, pgTableCreator, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const dbchannels = pgTable('channels', {
    recid: uuid('recid').primaryKey().defaultRandom(),
    channel: text('channel').notNull().default(''),
    createDateUtc: timestamp('createDateUtc', {withTimezone: true}).notNull().defaultNow(),
    lastUpdateUtc: timestamp('lastUpdateUtc', {withTimezone: true}).notNull().defaultNow(),
    status: boolean('status').notNull().default(true),
    extdata: jsonb('extdata').notNull().default({})
});

export const dbcommands = pgTable('commands', {
    recid: uuid('recid').primaryKey().defaultRandom(),
    commandName: text('commandName').notNull().default(''),
    commandPath: text('commandPath').notNull().default(''),
    service: text('service').notNull().default(''),
    status: boolean('status').notNull().default(true),
    extdata: jsonb('extdata').notNull().default({})
});

export type InsertCommand = typeof dbcommands.$inferInsert;
export type SelectCommand = typeof dbcommands.$inferSelect;

export type InsertChannel = typeof dbchannels.$inferInsert;
export type SelectChannel = typeof dbchannels.$inferSelect;
