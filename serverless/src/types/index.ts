import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

// API Gateway Types
export type LambdaHandler = (
  event: APIGatewayProxyEvent,
  context: Context
) => Promise<APIGatewayProxyResult>;

// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  role: 'student' | 'counsellor' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'counsellor' | 'admin';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

// Session Types
export interface Session {
  id: string;
  studentId: string;
  counsellorId: string;
  scheduledAt: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  type: 'individual' | 'group';
  notes?: string;
  studentNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionRequest {
  studentId: string;
  counsellorId: string;
  scheduledAt: string;
  type?: 'individual' | 'group';
  notes?: string;
}

// Resource Types
export interface Resource {
  id: string;
  title: string;
  description?: string;
  type: 'worksheet' | 'video' | 'audio' | 'interactive';
  fileUrl?: string;
  duration?: number;
  uploadedBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourceRequest {
  title: string;
  description?: string;
  type: 'worksheet' | 'video' | 'audio' | 'interactive';
  fileUrl?: string;
  duration?: number;
}

// Message Types
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  status: 'sent' | 'read';
  createdAt: string;
}

export interface CreateMessageRequest {
  receiverId: string;
  content: string;
}

// Progress Types
export interface UserProgress {
  id: string;
  userId: string;
  resourceId: string;
  progress: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProgressRequest {
  resourceId: string;
  progress: number;
}

// Notification Types
export interface Notification {
  type: 'session_booking' | 'session_update' | 'message_received' | 'resource_uploaded';
  userId: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// DynamoDB Types
export interface DynamoDBItem {
  [key: string]: any;
}

// S3 Types
export interface S3UploadResult {
  key: string;
  url: string;
  bucket: string;
}

// CloudWatch Types
export interface MetricData {
  namespace: string;
  metricName: string;
  value: number;
  unit: 'Count' | 'Seconds' | 'Bytes' | 'Percent';
  dimensions?: Array<{
    name: string;
    value: string;
  }>;
}

// X-Ray Types
export interface TraceSegment {
  name: string;
  id: string;
  trace_id: string;
  start_time: number;
  end_time?: number;
  subsegments?: TraceSegment[];
  annotations?: Record<string, any>;
  metadata?: Record<string, any>;
}

// Environment Variables
export interface EnvironmentVariables {
  STAGE: string;
  REGION: string;
  USERS_TABLE: string;
  SESSIONS_TABLE: string;
  RESOURCES_TABLE: string;
  MESSAGES_TABLE: string;
  PROGRESS_TABLE: string;
  RESOURCES_BUCKET: string;
  NOTIFICATIONS_TOPIC: string;
  JWT_SECRET: string;
}

// Request Context
export interface RequestContext {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  requestId: string;
  stage: string;
}

// Error Types
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(401, message);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(409, message);
  }
}

