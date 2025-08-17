import { storage } from './storage';

// Create a default user for development
async function createDefaultUser() {
  try {
    console.log('Creating default user for development...');
    
    const defaultUser = {
      id: 'dev-user-1',
      email: 'dev@example.com',
      firstName: 'Dev',
      lastName: 'User',
      profileImageUrl: null,
      role: 'admin' as const,
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
