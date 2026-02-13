import { pgTable, text, serial, integer, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    email: text('email').unique().notNull(),
    name: text('name'),
    googleId: text('google_id').unique(),
    passwordHash: text('password_hash'),
    credits: integer('credits').default(10).notNull(),
    plan: text('plan', { enum: ['free', 'premium'] }).default('free').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const folders = pgTable('folders', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    userId: integer('user_id').references(() => users.id).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const conversations = pgTable('conversations', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    folderId: integer('folder_id').references(() => folders.id),
    personaType: text('persona_type').notNull(), // 'Friend', 'Lover', 'Mom', 'Dad'
    title: text('title'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
    id: serial('id').primaryKey(),
    conversationId: integer('conversation_id').references(() => conversations.id).notNull(),
    role: text('role', { enum: ['user', 'assistant'] }).notNull(),
    content: text('content').notNull(),
    emotionTag: text('emotion_tag'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
