import {
  users,
  resources,
  sessionsTable,
  messages,
  userProgress,
  type User,
  type UpsertUser,
  type InsertResource,
  type Resource,
  type InsertSession,
  type Session,
  type InsertMessage,
  type Message,
  type InsertUserProgress,
  type UserProgress,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, count, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // User management
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  updateUserRole(id: string, role: string): Promise<User>;
  
  // Resource operations
  createResource(resource: InsertResource): Promise<Resource>;
  getResources(): Promise<Resource[]>;
  getResourcesByType(type: string): Promise<Resource[]>;
  getResourceById(id: number): Promise<Resource | undefined>;
  updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource>;
  deleteResource(id: number): Promise<void>;
  
  // Session operations
  createSession(session: InsertSession): Promise<Session>;
  getSessionsByStudent(studentId: string): Promise<Session[]>;
  getSessionsByCounsellor(counsellorId: string): Promise<Session[]>;
  getSessionById(id: number): Promise<Session | undefined>;
  updateSession(id: number, session: Partial<InsertSession>): Promise<Session>;
  getPendingSessions(): Promise<Session[]>;
  getSessionsWithUsers(): Promise<any[]>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesBetweenUsers(user1Id: string, user2Id: string): Promise<Message[]>;
  getConversations(userId: string): Promise<any[]>;
  markMessageAsRead(id: number): Promise<void>;
  
  // Progress operations
  createOrUpdateProgress(progress: InsertUserProgress): Promise<UserProgress>;
  getUserProgress(userId: string): Promise<UserProgress[]>;
  getProgressByResource(resourceId: number): Promise<UserProgress[]>;
  
  // Analytics
  getSystemStats(): Promise<{
    totalUsers: number;
    totalStudents: number;
    totalCounsellors: number;
    totalSessions: number;
    totalResources: number;
    completedSessions: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // User management
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.createdAt));
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as any));
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role: role as any, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Resource operations
  async createResource(resource: InsertResource): Promise<Resource> {
    const [newResource] = await db
      .insert(resources)
      .values(resource)
      .returning();
    return newResource;
  }

  async getResources(): Promise<Resource[]> {
    return await db
      .select()
      .from(resources)
      .where(eq(resources.isActive, true))
      .orderBy(desc(resources.createdAt));
  }

  async getResourcesByType(type: string): Promise<Resource[]> {
    return await db
      .select()
      .from(resources)
      .where(and(eq(resources.type, type as any), eq(resources.isActive, true)))
      .orderBy(desc(resources.createdAt));
  }

  async getResourceById(id: number): Promise<Resource | undefined> {
    const [resource] = await db
      .select()
      .from(resources)
      .where(eq(resources.id, id));
    return resource;
  }

  async updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource> {
    const [updatedResource] = await db
      .update(resources)
      .set({ ...resource, updatedAt: new Date() })
      .where(eq(resources.id, id))
      .returning();
    return updatedResource;
  }

  async deleteResource(id: number): Promise<void> {
    await db
      .update(resources)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(resources.id, id));
  }

  // Session operations
  async createSession(session: InsertSession): Promise<Session> {
    const [newSession] = await db
      .insert(sessionsTable)
      .values(session)
      .returning();
    return newSession;
  }

  async getSessionsByStudent(studentId: string): Promise<Session[]> {
    return await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.studentId, studentId))
      .orderBy(desc(sessionsTable.scheduledAt));
  }

  async getSessionsByCounsellor(counsellorId: string): Promise<Session[]> {
    return await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.counsellorId, counsellorId))
      .orderBy(desc(sessionsTable.scheduledAt));
  }

  async getSessionById(id: number): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.id, id));
    return session;
  }

  async updateSession(id: number, session: Partial<InsertSession>): Promise<Session> {
    const [updatedSession] = await db
      .update(sessionsTable)
      .set({ ...session, updatedAt: new Date() })
      .where(eq(sessionsTable.id, id))
      .returning();
    return updatedSession;
  }

  async getPendingSessions(): Promise<Session[]> {
    return await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.status, "pending"))
      .orderBy(asc(sessionsTable.scheduledAt));
  }

  async getSessionsWithUsers(): Promise<any[]> {
    return await db
      .select({
        id: sessionsTable.id,
        scheduledAt: sessionsTable.scheduledAt,
        status: sessionsTable.status,
        type: sessionsTable.type,
        notes: sessionsTable.notes,
        studentName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`.as('studentName'),
        counsellorName: sql<string>`concat(c.first_name, ' ', c.last_name)`.as('counsellorName'),
        studentEmail: users.email,
        counsellorEmail: sql<string>`c.email`.as('counsellorEmail'),
      })
      .from(sessionsTable)
      .innerJoin(users, eq(sessionsTable.studentId, users.id))
      .innerJoin(sql`users c`, sql`${sessionsTable.counsellorId} = c.id`)
      .orderBy(desc(sessionsTable.scheduledAt));
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getMessagesBetweenUsers(user1Id: string, user2Id: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.senderId, user1Id),
          eq(messages.receiverId, user2Id)
        )
      )
      .orderBy(asc(messages.createdAt));
  }

  async getConversations(userId: string): Promise<any[]> {
    // This is a simplified version - in production, you'd want a more sophisticated query
    return await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        content: messages.content,
        status: messages.status,
        createdAt: messages.createdAt,
        senderName: sql<string>`concat(sender.first_name, ' ', sender.last_name)`.as('senderName'),
        receiverName: sql<string>`concat(receiver.first_name, ' ', receiver.last_name)`.as('receiverName'),
      })
      .from(messages)
      .innerJoin(sql`users sender`, sql`${messages.senderId} = sender.id`)
      .innerJoin(sql`users receiver`, sql`${messages.receiverId} = receiver.id`)
      .where(
        sql`${messages.senderId} = ${userId} OR ${messages.receiverId} = ${userId}`
      )
      .orderBy(desc(messages.createdAt));
  }

  async markMessageAsRead(id: number): Promise<void> {
    await db
      .update(messages)
      .set({ status: "read" })
      .where(eq(messages.id, id));
  }

  // Progress operations
  async createOrUpdateProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const [existingProgress] = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, progress.userId),
          eq(userProgress.resourceId, progress.resourceId)
        )
      );

    if (existingProgress) {
      const [updatedProgress] = await db
        .update(userProgress)
        .set({ ...progress, updatedAt: new Date() })
        .where(eq(userProgress.id, existingProgress.id))
        .returning();
      return updatedProgress;
    } else {
      const [newProgress] = await db
        .insert(userProgress)
        .values(progress)
        .returning();
      return newProgress;
    }
  }

  async getUserProgress(userId: string): Promise<UserProgress[]> {
    return await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId))
      .orderBy(desc(userProgress.updatedAt));
  }

  async getProgressByResource(resourceId: number): Promise<UserProgress[]> {
    return await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.resourceId, resourceId))
      .orderBy(desc(userProgress.updatedAt));
  }

  // Analytics
  async getSystemStats(): Promise<{
    totalUsers: number;
    totalStudents: number;
    totalCounsellors: number;
    totalSessions: number;
    totalResources: number;
    completedSessions: number;
  }> {
    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [totalStudents] = await db.select({ count: count() }).from(users).where(eq(users.role, "student"));
    const [totalCounsellors] = await db.select({ count: count() }).from(users).where(eq(users.role, "counsellor"));
    const [totalSessions] = await db.select({ count: count() }).from(sessionsTable);
    const [totalResources] = await db.select({ count: count() }).from(resources).where(eq(resources.isActive, true));
    const [completedSessions] = await db.select({ count: count() }).from(sessionsTable).where(eq(sessionsTable.status, "completed"));

    return {
      totalUsers: totalUsers.count,
      totalStudents: totalStudents.count,
      totalCounsellors: totalCounsellors.count,
      totalSessions: totalSessions.count,
      totalResources: totalResources.count,
      completedSessions: completedSessions.count,
    };
  }
}

export const storage = new DatabaseStorage();
