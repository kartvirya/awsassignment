import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { storage } from '../server/storage';

export const createResponse = (
  statusCode: number, 
  body: any, 
  headers: Record<string, string> = {}
): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,PATCH,DELETE',
      ...headers
    },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  };
};

export const createErrorResponse = (statusCode: number, message: string): APIGatewayProxyResult => {
  return createResponse(statusCode, { error: message });
};

// Simple session management for Lambda
const sessions = new Map<string, string>(); // sessionId -> userId

export const authenticate = async (event: APIGatewayProxyEvent): Promise<{ user: any } | null> => {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  const sessionId = authHeader?.replace('Bearer ', '');
  
  if (!sessionId || !sessions.has(sessionId)) {
    return null;
  }
  
  const userId = sessions.get(sessionId);
  if (!userId) {
    return null;
  }
  
  const user = await storage.getUser(userId);
  return user ? { user: { claims: { sub: userId }, ...user } } : null;
};

export const createSession = (userId: string): string => {
  const sessionId = `session-${Date.now()}-${Math.random()}`;
  sessions.set(sessionId, userId);
  return sessionId;
};

export const deleteSession = (sessionId: string): void => {
  sessions.delete(sessionId);
};

export const parseBody = (event: APIGatewayProxyEvent): any => {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    return {};
  }
};

export const getPathParameter = (event: APIGatewayProxyEvent, name: string): string | undefined => {
  return event.pathParameters?.[name];
};

export const getQueryParameter = (event: APIGatewayProxyEvent, name: string): string | undefined => {
  return event.queryStringParameters?.[name];
};
