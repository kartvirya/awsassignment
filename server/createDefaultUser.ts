import { storage } from './storage';
import { createHash, randomBytes } from 'crypto';

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

// Create a default user for development
async function createDefaultUser() {
  try {
    console.log('Creating default user for development...');
    
    const salt1 = generateSalt();
    const salt2 = generateSalt();
    const salt3 = generateSalt();
    
    const defaultUser = {
      id: 'dev-user-1',
      email: 'dev@example.com',
      firstName: 'Dev',
      lastName: 'User',
      profileImageUrl: null,
      role: 'admin' as const,
      passwordHash: hashPassword('password123', salt1),
      passwordSalt: salt1,
    };
    
    const user = await storage.upsertUser(defaultUser);
    console.log('Default user created:', user);
    
    // Create a student user too
    const studentUser = {
      id: 'dev-student-1',
      email: 'student@example.com',
      firstName: 'Student',
      lastName: 'Test',
      profileImageUrl: null,
      role: 'student' as const,
      passwordHash: hashPassword('password123', salt2),
      passwordSalt: salt2,
    };
    
    const student = await storage.upsertUser(studentUser);
    console.log('Default student created:', student);
    
    // Create a counsellor user
    const counsellorUser = {
      id: 'dev-counsellor-1',
      email: 'counsellor@example.com',
      firstName: 'Counsellor',
      lastName: 'Test',
      profileImageUrl: null,
      role: 'counsellor' as const,
      passwordHash: hashPassword('password123', salt3),
      passwordSalt: salt3,
    };
    
    const counsellor = await storage.upsertUser(counsellorUser);
    console.log('Default counsellor created:', counsellor);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating default user:', error);
    process.exit(1);
  }
}

createDefaultUser();
