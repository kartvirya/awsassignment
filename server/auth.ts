import { createHash, randomBytes } from 'crypto';
import { z } from 'zod';
import { storage } from './storage';
import type { User } from '@shared/schema';

// Schema for user registration
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(['student', 'counsellor', 'admin']),
});

// Schema for user login
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Hash password with salt
function hashPassword(password: string, salt: string): string {
  return createHash('sha256')
    .update(password + salt)
    .digest('hex');
}

// Generate random salt
function generateSalt(): string {
  return randomBytes(16).toString('hex');
}

// Generate session token
function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export class AuthService {
  private sessions: Map<string, { userId: string; expiresAt: Date }>;

  constructor() {
    this.sessions = new Map();
    // Clean expired sessions every hour
    setInterval(() => this.cleanExpiredSessions(), 3600000);
  }

  private cleanExpiredSessions() {
    const now = new Date();
    const entries = Array.from(this.sessions.entries());
    for (const [token, session] of entries) {
      if (session.expiresAt < now) {
        this.sessions.delete(token);
      }
    }
  }

  async register(input: z.infer<typeof registerSchema>): Promise<User> {
    const { email, password, firstName, lastName, role } = input;

    // Check if user exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Generate salt and hash password
    const salt = generateSalt();
    const hashedPassword = hashPassword(password, salt);

    // Create user
    const user = await storage.upsertUser({
      id: randomBytes(16).toString('hex'),
      email,
      firstName,
      lastName,
      role,
      passwordHash: hashedPassword,
      passwordSalt: salt,
    });

    return user;
  }

  async login(input: z.infer<typeof loginSchema>): Promise<{ user: User; token: string }> {
    const { email, password } = input;

    // Get user
    const user = await storage.getUserByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const hashedPassword = hashPassword(password, user.passwordSalt);
    if (hashedPassword !== user.passwordHash) {
      throw new Error('Invalid credentials');
    }

    // Generate session token
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    this.sessions.set(token, { userId: user.id, expiresAt });

    return { user, token };
  }

  async validateSession(token: string): Promise<User | null> {
    const session = this.sessions.get(token);
    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    const user = await storage.getUser(session.userId);
    return user || null;
  }

  logout(token: string): void {
    this.sessions.delete(token);
  }
}

export const authService = new AuthService(); 