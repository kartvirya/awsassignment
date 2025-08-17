// Simple in-memory storage for development
import type { User, UpsertUser } from "@shared/schema";

const users: User[] = [
  {
    id: 'dev-user-1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    profileImageUrl: null,
    role: 'admin',
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
    const now = new Date();
    
    const user: User = {
      id: userData.id,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      role: userData.role || 'student',
      createdAt: existingIndex >= 0 ? users[existingIndex].createdAt : now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }

    return user;
  },

  async getAllUsers(): Promise<User[]> {
    return [...users];
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

  // Mock implementations for other methods
  async createResource(): Promise<any> { throw new Error('Not implemented'); },
  async getResources(): Promise<any[]> { return []; },
  async getResourcesByType(): Promise<any[]> { return []; },
  async getResourceById(): Promise<any> { return undefined; },
  async updateResource(): Promise<any> { throw new Error('Not implemented'); },
  async deleteResource(): Promise<void> { },
  async createSession(): Promise<any> { throw new Error('Not implemented'); },
  async getSessionsByStudent(): Promise<any[]> { return []; },
  async getSessionsByCounsellor(): Promise<any[]> { return []; },
  async getSessionById(): Promise<any> { return undefined; },
  async updateSession(): Promise<any> { throw new Error('Not implemented'); },
  async getPendingSessions(): Promise<any[]> { return []; },
  async getSessionsWithUsers(): Promise<any[]> { return []; },
  async createMessage(): Promise<any> { throw new Error('Not implemented'); },
  async getMessagesBetweenUsers(): Promise<any[]> { return []; },
  async getConversations(): Promise<any[]> { return []; },
  async markMessageAsRead(): Promise<void> { },
  async createOrUpdateProgress(): Promise<any> { throw new Error('Not implemented'); },
  async getUserProgress(): Promise<any[]> { return []; },
  async getProgressByResource(): Promise<any[]> { return []; },
  async getSystemStats(): Promise<any> {
    return {
      totalUsers: users.length,
      totalStudents: users.filter(u => u.role === 'student').length,
      totalCounsellors: users.filter(u => u.role === 'counsellor').length,
      totalSessions: 0,
      totalResources: 0,
      completedSessions: 0,
    };
  },
};
