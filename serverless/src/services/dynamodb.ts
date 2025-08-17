import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { User, Session, Resource, Message, UserProgress, DynamoDBItem } from '../types';

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: process.env.REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

// Table names
const TABLES = {
  USERS: process.env.USERS_TABLE!,
  SESSIONS: process.env.SESSIONS_TABLE!,
  RESOURCES: process.env.RESOURCES_TABLE!,
  MESSAGES: process.env.MESSAGES_TABLE!,
  PROGRESS: process.env.PROGRESS_TABLE!,
};

export class DynamoDBService {
  // User operations
  static async createUser(user: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = new Date().toISOString();
    const userItem: User = {
      ...user,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({
      TableName: TABLES.USERS,
      Item: userItem,
      ConditionExpression: 'attribute_not_exists(id)',
    }));

    return userItem;
  }

  static async getUser(id: string): Promise<User | null> {
    const result = await docClient.send(new GetCommand({
      TableName: TABLES.USERS,
      Key: { id },
    }));

    return result.Item as User || null;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.USERS,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email },
    }));

    return result.Items?.[0] as User || null;
  }

  static async getAllUsers(): Promise<User[]> {
    const result = await docClient.send(new ScanCommand({
      TableName: TABLES.USERS,
    }));

    return result.Items as User[] || [];
  }

  static async getUsersByRole(role: string): Promise<User[]> {
    const result = await docClient.send(new ScanCommand({
      TableName: TABLES.USERS,
      FilterExpression: '#role = :role',
      ExpressionAttributeNames: { '#role': 'role' },
      ExpressionAttributeValues: { ':role': role },
    }));

    return result.Items as User[] || [];
  }

  static async updateUserRole(id: string, role: string): Promise<User> {
    const now = new Date().toISOString();
    const result = await docClient.send(new UpdateCommand({
      TableName: TABLES.USERS,
      Key: { id },
      UpdateExpression: 'SET #role = :role, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#role': 'role' },
      ExpressionAttributeValues: { ':role': role, ':updatedAt': now },
      ReturnValues: 'ALL_NEW',
    }));

    return result.Attributes as User;
  }

  // Session operations
  static async createSession(session: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Promise<Session> {
    const id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const sessionItem: Session = {
      ...session,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({
      TableName: TABLES.SESSIONS,
      Item: sessionItem,
    }));

    return sessionItem;
  }

  static async getSession(id: string): Promise<Session | null> {
    const result = await docClient.send(new GetCommand({
      TableName: TABLES.SESSIONS,
      Key: { id },
    }));

    return result.Item as Session || null;
  }

  static async getSessionsByStudent(studentId: string): Promise<Session[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.SESSIONS,
      IndexName: 'StudentSessionsIndex',
      KeyConditionExpression: 'studentId = :studentId',
      ExpressionAttributeValues: { ':studentId': studentId },
    }));

    return result.Items as Session[] || [];
  }

  static async getSessionsByCounsellor(counsellorId: string): Promise<Session[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.SESSIONS,
      IndexName: 'CounsellorSessionsIndex',
      KeyConditionExpression: 'counsellorId = :counsellorId',
      ExpressionAttributeValues: { ':counsellorId': counsellorId },
    }));

    return result.Items as Session[] || [];
  }

  static async updateSession(id: string, updates: Partial<Session>): Promise<Session> {
    const now = new Date().toISOString();
    const updateExpressions: string[] = ['updatedAt = :updatedAt'];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = { ':updatedAt': now };

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt' && value !== undefined) {
        const attrName = `#${key}`;
        const attrValue = `:${key}`;
        updateExpressions.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] = value;
      }
    });

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLES.SESSIONS,
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }));

    return result.Attributes as Session;
  }

  static async deleteSession(id: string): Promise<void> {
    await docClient.send(new DeleteCommand({
      TableName: TABLES.SESSIONS,
      Key: { id },
    }));
  }

  // Resource operations
  static async createResource(resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>): Promise<Resource> {
    const id = `resource-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const resourceItem: Resource = {
      ...resource,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({
      TableName: TABLES.RESOURCES,
      Item: resourceItem,
    }));

    return resourceItem;
  }

  static async getResource(id: string): Promise<Resource | null> {
    const result = await docClient.send(new GetCommand({
      TableName: TABLES.RESOURCES,
      Key: { id },
    }));

    return result.Item as Resource || null;
  }

  static async getAllResources(): Promise<Resource[]> {
    const result = await docClient.send(new ScanCommand({
      TableName: TABLES.RESOURCES,
      FilterExpression: 'isActive = :isActive',
      ExpressionAttributeValues: { ':isActive': true },
    }));

    return result.Items as Resource[] || [];
  }

  static async getResourcesByType(type: string): Promise<Resource[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.RESOURCES,
      IndexName: 'TypeIndex',
      KeyConditionExpression: '#type = :type',
      FilterExpression: 'isActive = :isActive',
      ExpressionAttributeNames: { '#type': 'type' },
      ExpressionAttributeValues: { ':type': type, ':isActive': true },
    }));

    return result.Items as Resource[] || [];
  }

  static async updateResource(id: string, updates: Partial<Resource>): Promise<Resource> {
    const now = new Date().toISOString();
    const updateExpressions: string[] = ['updatedAt = :updatedAt'];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = { ':updatedAt': now };

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt' && value !== undefined) {
        const attrName = `#${key}`;
        const attrValue = `:${key}`;
        updateExpressions.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] = value;
      }
    });

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLES.RESOURCES,
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }));

    return result.Attributes as Resource;
  }

  static async deleteResource(id: string): Promise<void> {
    await docClient.send(new DeleteCommand({
      TableName: TABLES.RESOURCES,
      Key: { id },
    }));
  }

  // Message operations
  static async createMessage(message: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
    const id = `message-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const messageItem: Message = {
      ...message,
      id,
      createdAt: now,
    };

    await docClient.send(new PutCommand({
      TableName: TABLES.MESSAGES,
      Item: messageItem,
    }));

    return messageItem;
  }

  static async getMessagesByUser(userId: string): Promise<Message[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.MESSAGES,
      IndexName: 'ReceiverMessagesIndex',
      KeyConditionExpression: 'receiverId = :receiverId',
      ExpressionAttributeValues: { ':receiverId': userId },
    }));

    return result.Items as Message[] || [];
  }

  static async updateMessageStatus(id: string, status: 'sent' | 'read'): Promise<Message> {
    const result = await docClient.send(new UpdateCommand({
      TableName: TABLES.MESSAGES,
      Key: { id },
      UpdateExpression: 'SET #status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': status },
      ReturnValues: 'ALL_NEW',
    }));

    return result.Attributes as Message;
  }

  // Progress operations
  static async createProgress(progress: Omit<UserProgress, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProgress> {
    const id = `progress-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const progressItem: UserProgress = {
      ...progress,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(new PutCommand({
      TableName: TABLES.PROGRESS,
      Item: progressItem,
    }));

    return progressItem;
  }

  static async getProgressByUser(userId: string): Promise<UserProgress[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLES.PROGRESS,
      IndexName: 'UserProgressIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
    }));

    return result.Items as UserProgress[] || [];
  }

  static async updateProgress(id: string, progress: number, completedAt?: string): Promise<UserProgress> {
    const now = new Date().toISOString();
    const updateExpressions: string[] = ['progress = :progress', 'updatedAt = :updatedAt'];
    const expressionAttributeValues: Record<string, any> = { 
      ':progress': progress, 
      ':updatedAt': now 
    };

    if (completedAt) {
      updateExpressions.push('completedAt = :completedAt');
      expressionAttributeValues[':completedAt'] = completedAt;
    }

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLES.PROGRESS,
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }));

    return result.Attributes as UserProgress;
  }
}

