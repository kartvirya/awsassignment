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
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
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
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: roleEnum("role").notNull().default("student"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// CBT Resources table
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  type: resourceTypeEnum("type").notNull(),
  fileUrl: varchar("file_url"),
  duration: integer("duration"), // in minutes
  uploadedBy: varchar("uploaded_by")
    .references(() => users.id)
    .notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sessions table
export const sessionsTable = pgTable("sessions_table", {
  id: serial("id").primaryKey(),
  studentId: varchar("student_id")
    .references(() => users.id)
    .notNull(),
  counsellorId: varchar("counsellor_id")
    .references(() => users.id)
    .notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  status: sessionStatusEnum("status").notNull().default("pending"),
  type: sessionTypeEnum("type").notNull().default("individual"),
  notes: text("notes"),
  studentNotes: text("student_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id")
    .references(() => users.id)
    .notNull(),
  receiverId: varchar("receiver_id")
    .references(() => users.id)
    .notNull(),
  content: text("content").notNull(),
  status: messageStatusEnum("status").notNull().default("sent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User progress tracking
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  resourceId: integer("resource_id")
    .references(() => resources.id)
    .notNull(),
  progress: integer("progress").default(0), // percentage
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  uploadedResources: many(resources),
  studentSessions: many(sessionsTable, { relationName: "studentSessions" }),
  counsellorSessions: many(sessionsTable, { relationName: "counsellorSessions" }),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  progress: many(userProgress),
}));

export const resourcesRelations = relations(resources, ({ one, many }) => ({
  uploadedBy: one(users, {
    fields: [resources.uploadedBy],
    references: [users.id],
  }),
  progress: many(userProgress),
}));

export const sessionsRelations = relations(sessionsTable, ({ one }) => ({
  student: one(users, {
    fields: [sessionsTable.studentId],
    references: [users.id],
    relationName: "studentSessions",
  }),
  counsellor: one(users, {
    fields: [sessionsTable.counsellorId],
    references: [users.id],
    relationName: "counsellorSessions",
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receivedMessages",
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
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertResource = typeof resources.$inferInsert;
export type Resource = typeof resources.$inferSelect;

export type InsertSession = typeof sessionsTable.$inferInsert;
export type Session = typeof sessionsTable.$inferSelect;

export type InsertMessage = typeof messages.$inferInsert;
export type Message = typeof messages.$inferSelect;

export type InsertUserProgress = typeof userProgress.$inferInsert;
export type UserProgress = typeof userProgress.$inferSelect;

// Insert schemas
export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
