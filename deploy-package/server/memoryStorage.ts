// Simple in-memory storage for development
import type { User, UpsertUser } from "@shared/schema";
import { createHash } from 'crypto';

// Hash password with salt for development users
function hashPassword(password: string, salt: string): string {
  return createHash('sha256')
    .update(password + salt)
    .digest('hex');
}

const users: User[] = [
  {
    id: 'dev-user-1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    profileImageUrl: null,
    role: 'admin',
    passwordHash: hashPassword('password123', 'salt_1'),
    passwordSalt: 'salt_1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'dev-student-1',
    email: 'student@example.com',
    firstName: 'Student',
    lastName: 'Test',
    profileImageUrl: null,
    role: 'student',
    passwordHash: hashPassword('password123', 'salt_2'),
    passwordSalt: 'salt_2',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'dev-counsellor-1',
    email: 'counsellor@example.com',
    firstName: 'Counsellor',
    lastName: 'Test',
    profileImageUrl: null,
    role: 'counsellor',
    passwordHash: hashPassword('password123', 'salt_3'),
    passwordSalt: 'salt_3',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const memoryStorage = {
  async getUser(id: string): Promise<User | undefined> {
    return users.find(user => user.id === id);
  },

  async getUserByEmail(email: string): Promise<User | undefined> {
    return users.find(user => user.email === email);
  },

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingIndex = users.findIndex(user => user.id === userData.id);
    
    if (existingIndex >= 0) {
      users[existingIndex] = {
        ...users[existingIndex],
        ...userData,
        updatedAt: new Date(),
      };
      return users[existingIndex];
    } else {
      const newUser: User = {
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;
      users.push(newUser);
      return newUser;
    }
  },

  async getAllUsers(): Promise<User[]> {
    return users;
  },

  async getUsersByRole(role: string): Promise<User[]> {
    return users.filter(user => user.role === role);
  },

  async updateUserRole(id: string, role: string): Promise<User> {
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex < 0) {
      throw new Error('User not found');
    }
    
    const validRoles = ['student', 'counsellor', 'admin'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role');
    }
    
    users[userIndex] = {
      ...users[userIndex],
      role: role as 'student' | 'counsellor' | 'admin',
      updatedAt: new Date(),
    };
    
    return users[userIndex];
  },

  // Resource operations (simplified for development)
  async createResource(resource: any): Promise<any> {
    return { id: Date.now(), ...resource };
  },

  async getResources(): Promise<any[]> {
    return [];
  },

  async getResourcesByType(type: string): Promise<any[]> {
    return [];
  },

  async getResourceById(id: number): Promise<any> {
    return null;
  },

  async updateResource(id: number, resource: any): Promise<any> {
    return { id, ...resource };
  },

  async deleteResource(id: number): Promise<void> {
    // No-op for development
  },

  // Session operations (simplified for development)
  async createSession(session: any): Promise<any> {
    return { id: Date.now(), ...session };
  },

  async getSessionsByStudent(studentId: string): Promise<any[]> {
    return [];
  },

  async getSessionsByCounsellor(counsellorId: string): Promise<any[]> {
    return [];
  },

  async getSessionById(id: number): Promise<any> {
    return null;
  },

  async updateSession(id: number, session: any): Promise<any> {
    return { id, ...session };
  },

  async getPendingSessions(): Promise<any[]> {
    return [];
  },

  async getSessionsWithUsers(): Promise<any[]> {
    return [];
  },

  // Message operations (simplified for development)
  async createMessage(message: any): Promise<any> {
    return { id: Date.now(), ...message };
  },

  async getMessagesBetweenUsers(user1Id: string, user2Id: string): Promise<any[]> {
    return [];
  },

  async getConversations(userId: string): Promise<any[]> {
    return [];
  },

  async markMessageAsRead(messageId: number): Promise<void> {
    // No-op for development
  },

  // Progress operations (simplified for development)
  async createUserProgress(progress: any): Promise<any> {
    return { id: Date.now(), ...progress };
  },

  async getUserProgress(userId: string): Promise<any[]> {
    return [];
  },

  async updateUserProgress(id: number, progress: any): Promise<any> {
    return { id, ...progress };
  },

  // Analytics (simplified for development)
  async getSystemStats(): Promise<any> {
    return {
      users: users.length,
      sessions: 0,
      resources: 0,
      messages: 0,
    };
  },
};
