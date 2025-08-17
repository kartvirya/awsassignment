import { z } from 'zod';
import { ValidationError } from '../types';

// User validation schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['student', 'counsellor', 'admin'], {
    errorMap: () => ({ message: 'Role must be student, counsellor, or admin' })
  }),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Session validation schemas
export const createSessionSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  counsellorId: z.string().min(1, 'Counsellor ID is required'),
  scheduledAt: z.string().datetime('Invalid date format'),
  type: z.enum(['individual', 'group']).optional().default('individual'),
  notes: z.string().optional(),
});

export const updateSessionSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).optional(),
  notes: z.string().optional(),
  studentNotes: z.string().optional(),
});

// Resource validation schemas
export const createResourceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['worksheet', 'video', 'audio', 'interactive'], {
    errorMap: () => ({ message: 'Type must be worksheet, video, audio, or interactive' })
  }),
  fileUrl: z.string().url('Invalid URL format').optional(),
  duration: z.number().positive('Duration must be positive').optional(),
});

export const updateResourceSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  type: z.enum(['worksheet', 'video', 'audio', 'interactive']).optional(),
  fileUrl: z.string().url('Invalid URL format').optional(),
  duration: z.number().positive('Duration must be positive').optional(),
  isActive: z.boolean().optional(),
});

// Message validation schemas
export const createMessageSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required'),
  content: z.string().min(1, 'Message content is required'),
});

// Progress validation schemas
export const updateProgressSchema = z.object({
  resourceId: z.string().min(1, 'Resource ID is required'),
  progress: z.number().min(0, 'Progress must be between 0 and 100').max(100, 'Progress must be between 0 and 100'),
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1)).optional().default('1'),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(100)).optional().default('20'),
});

export const resourceQuerySchema = z.object({
  type: z.enum(['worksheet', 'video', 'audio', 'interactive']).optional(),
  uploadedBy: z.string().optional(),
});

export const sessionQuerySchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).optional(),
  type: z.enum(['individual', 'group']).optional(),
  studentId: z.string().optional(),
  counsellorId: z.string().optional(),
});

export const messageQuerySchema = z.object({
  senderId: z.string().optional(),
  receiverId: z.string().optional(),
  status: z.enum(['sent', 'read']).optional(),
});

// Validation helper function
export const validateRequest = <T>(schema: z.ZodSchema<T>, data: any): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new ValidationError(errors.join(', '));
    }
    throw error;
  }
};

// Parse query parameters
export const parseQueryParams = <T>(schema: z.ZodSchema<T>, queryStringParameters: any): T => {
  const params = queryStringParameters || {};
  return validateRequest(schema, params);
};

// Parse path parameters
export const parsePathParams = <T>(schema: z.ZodSchema<T>, pathParameters: any): T => {
  const params = pathParameters || {};
  return validateRequest(schema, params);
};

// Parse request body
export const parseRequestBody = <T>(schema: z.ZodSchema<T>, body: string | null): T => {
  if (!body) {
    throw new ValidationError('Request body is required');
  }

  try {
    const parsedBody = JSON.parse(body);
    return validateRequest(schema, parsedBody);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ValidationError('Invalid JSON in request body');
    }
    throw error;
  }
};

