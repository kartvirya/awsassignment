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
import { memoryStorage } from "./memoryStorage";
import { eq, and, desc, asc, count, sql, or } from "drizzle-orm";

// Use memory storage only in development mode and when DATABASE_URL is not set
const useMemoryStorage = process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL;

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // User management
  getAllUsers(): Promise<User[]>;
  getUsers(): Promise<User[]>; // Alias for getAllUsers
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
  getSessions(): Promise<Session[]>; // Get all sessions
  getSessionsByStudent(studentId: string): Promise<Session[]>;
  getSessionsByCounsellor(counsellorId: string): Promise<Session[]>;
  getSessionById(id: number): Promise<Session | undefined>;
  updateSession(id: number, session: Partial<InsertSession>): Promise<Session>;
  getPendingSessions(): Promise<Session[]>;
  getSessionsWithUsers(): Promise<any[]>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(): Promise<Message[]>; // Get all messages
  getMessagesBetweenUsers(user1Id: string, user2Id: string): Promise<Message[]>;
  getConversations(userId: string): Promise<any[]>;
  markMessageAsRead(messageId: number): Promise<void>;
  
  // Progress operations
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  getUserProgress(userId: string): Promise<UserProgress[]>;
  updateUserProgress(id: number, progress: Partial<InsertUserProgress>): Promise<UserProgress>;
  
  // Analytics
  getSystemStats(): Promise<any>;
}

class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const [result] = await db
      .insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: user.email,
          passwordHash: user.passwordHash,
          passwordSalt: user.passwordSalt,
        },
      })
      .returning();
    return result;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.createdAt));
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.createdAt));
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as any));
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role: role as any })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Resource operations
  async createResource(resource: InsertResource): Promise<Resource> {
    const [result] = await db.insert(resources).values(resource).returning();
    return result;
  }

  async getResources(): Promise<Resource[]> {
    return await db.select().from(resources).orderBy(desc(resources.createdAt));
  }

  async getResourcesByType(type: string): Promise<Resource[]> {
    return await db
      .select()
      .from(resources)
      .where(eq(resources.type, type))
      .orderBy(desc(resources.createdAt));
  }

  async getResourceById(id: number): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource;
  }

  async updateResource(id: number, resource: Partial<InsertResource>): Promise<Resource> {
    const [result] = await db
      .update(resources)
      .set({ ...resource })
      .where(eq(resources.id, id))
      .returning();
    return result;
  }

  async deleteResource(id: number): Promise<void> {
    await db.delete(resources).where(eq(resources.id, id));
  }

  // Session operations
  async createSession(session: InsertSession): Promise<Session> {
    const [result] = await db.insert(sessionsTable).values(session).returning();
    return result;
  }

  async getSessions(): Promise<Session[]> {
    return await db.select().from(sessionsTable).orderBy(desc(sessionsTable.createdAt));
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
    const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id));
    return session;
  }

  async updateSession(id: number, session: Partial<InsertSession>): Promise<Session> {
    const [result] = await db
      .update(sessionsTable)
      .set({ ...session })
      .where(eq(sessionsTable.id, id))
      .returning();
    return result;
  }

  async getPendingSessions(): Promise<Session[]> {
    return await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.status, "pending"))
      .orderBy(asc(sessionsTable.scheduledAt));
  }

  async getSessionsWithUsers(): Promise<any[]> {
    // For now, return sessions without user details to avoid the alias issue
    return await db
      .select()
      .from(sessionsTable)
      .orderBy(desc(sessionsTable.scheduledAt));
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const [result] = await db.insert(messages).values(message).returning();
    return result;
  }

  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(desc(messages.createdAt));
  }

  async getMessagesBetweenUsers(user1Id: string, user2Id: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        and(
          or(
            and(eq(messages.senderId, user1Id), eq(messages.receiverId, user2Id)),
            and(eq(messages.senderId, user2Id), eq(messages.receiverId, user1Id))
          )
        )
      )
      .orderBy(asc(messages.createdAt));
  }

  async getConversations(userId: string): Promise<any[]> {
    const conversations = await db
      .select({
        otherUser: users,
        lastMessage: messages,
        unreadCount: count(messages.id),
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(
        or(eq(messages.senderId, userId), eq(messages.receiverId, userId))
      )
      .groupBy(users.id, messages.id)
      .orderBy(desc(messages.createdAt));

    return conversations;
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    // In development mode, just return without doing anything
    if (process.env.NODE_ENV === 'development') {
      return;
    }
    
    // In production, you would update a read status field
    // await db
    //   .update(messages)
    //   .set({ readAt: new Date() })
    //   .where(eq(messages.id, messageId));
  }

  // Progress operations
  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const [result] = await db.insert(userProgress).values(progress).returning();
    return result;
  }

  async getUserProgress(userId: string): Promise<UserProgress[]> {
    return await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId))
      .orderBy(desc(userProgress.updatedAt));
  }

  async updateUserProgress(id: number, progress: Partial<InsertUserProgress>): Promise<UserProgress> {
    const [result] = await db
      .update(userProgress)
      .set({ ...progress })
      .where(eq(userProgress.id, id))
      .returning();
    return result;
  }

  // Analytics
  async getSystemStats(): Promise<any> {
    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [totalSessions] = await db.select({ count: count() }).from(sessionsTable);
    const [totalResources] = await db.select({ count: count() }).from(resources);
    const [totalMessages] = await db.select({ count: count() }).from(messages);

    return {
      users: totalUsers.count,
      sessions: totalSessions.count,
      resources: totalResources.count,
      messages: totalMessages.count,
    };
  }
}

export const storage = useMemoryStorage ? memoryStorage : new DatabaseStorage();
