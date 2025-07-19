import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums
export const roleEnum = pgEnum("role", ["student", "counsellor", "admin"]);
export const sessionStatusEnum = pgEnum("session_status", [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
]);
export const sessionTypeEnum = pgEnum("session_type", ["individual", "group"]);
export const resourceTypeEnum = pgEnum("resource_type", [
  "worksheet",
  "video",
  "audio",
  "interactive",
]);
export const messageStatusEnum = pgEnum("message_status", ["sent", "read"]);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: roleEnum("role").notNull().default("student"),
  passwordHash: varchar("password_hash").notNull(),
  passwordSalt: varchar("password_salt").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  roleIdx: index("role_idx").on(table.role),
}));

// CBT Resources table
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  type: varchar("type").notNull(),
  url: varchar("url").notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  typeIdx: index("type_idx").on(table.type),
  createdByIdx: index("created_by_idx").on(table.createdBy),
}));

// Sessions table
export const sessionsTable = pgTable("counselling_sessions", {
  id: serial("id").primaryKey(),
  studentId: varchar("student_id").references(() => users.id).notNull(),
  counsellorId: varchar("counsellor_id").references(() => users.id).notNull(),
  status: varchar("status").notNull().default("pending"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  studentIdx: index("student_idx").on(table.studentId),
  counsellorIdx: index("counsellor_idx").on(table.counsellorId),
  statusIdx: index("status_idx").on(table.status),
  scheduledAtIdx: index("scheduled_at_idx").on(table.scheduledAt),
}));

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  receiverId: varchar("receiver_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  senderIdx: index("sender_idx").on(table.senderId),
  receiverIdx: index("receiver_idx").on(table.receiverId),
  createdAtIdx: index("messages_created_at_idx").on(table.createdAt),
}));

// User progress tracking
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  progress: integer("progress").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdx: index("progress_user_idx").on(table.userId),
  resourceIdx: index("progress_resource_idx").on(table.resourceId),
  completedIdx: index("completed_idx").on(table.completed),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdResources: many(resources),
  studentSessions: many(sessionsTable, { relationName: "student_sessions" }),
  counsellorSessions: many(sessionsTable, { relationName: "counsellor_sessions" }),
  sentMessages: many(messages, { relationName: "sent_messages" }),
  receivedMessages: many(messages, { relationName: "received_messages" }),
  progress: many(userProgress),
}));

export const resourcesRelations = relations(resources, ({ one, many }) => ({
  creator: one(users, {
    fields: [resources.createdBy],
    references: [users.id],
  }),
  progress: many(userProgress),
}));

export const sessionsRelations = relations(sessionsTable, ({ one }) => ({
  student: one(users, {
    fields: [sessionsTable.studentId],
    references: [users.id],
    relationName: "student_sessions",
  }),
  counsellor: one(users, {
    fields: [sessionsTable.counsellorId],
    references: [users.id],
    relationName: "counsellor_sessions",
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sent_messages",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "received_messages",
  }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  resource: one(resources, {
    fields: [userProgress.resourceId],
    references: [resources.id],
  }),
}));

// Schema types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type Resource = typeof resources.$inferSelect;
export type InsertResource = typeof resources.$inferInsert;
export type Session = typeof sessionsTable.$inferSelect;
export type InsertSession = typeof sessionsTable.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = typeof userProgress.$inferInsert;

// Insert schemas
export const insertResourceSchema = createInsertSchema(resources);
export const insertSessionSchema = createInsertSchema(sessionsTable);
export const insertMessageSchema = createInsertSchema(messages);
export const insertUserProgressSchema = createInsertSchema(userProgress);
