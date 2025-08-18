import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { storage } from '../server/storage';
import { 
  createResponse, 
  createErrorResponse, 
  parseBody, 
  authenticate,
  getPathParameter
} from './utils';
import { insertSessionSchema } from '@shared/schema';
import { z } from 'zod';

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    const { httpMethod, path } = event;
    console.log(`Sessions handler: ${httpMethod} ${path}`);

    // Check authentication for all session endpoints
    const auth = await authenticate(event);
    if (!auth) {
      return createErrorResponse(401, 'Unauthorized');
    }

    switch (true) {
      case httpMethod === 'POST' && path.match(/\/api\/sessions$/):
        return await createSession(event, auth);
      
      case httpMethod === 'GET' && path.endsWith('/api/sessions/student'):
        return await getStudentSessions(event, auth);
      
      case httpMethod === 'GET' && path.endsWith('/api/sessions/counsellor'):
        return await getCounsellorSessions(event, auth);
      
      case httpMethod === 'GET' && path.endsWith('/api/sessions/pending'):
        return await getPendingSessions(event, auth);
      
      case httpMethod === 'GET' && path.endsWith('/api/sessions/all'):
        return await getAllSessions(event);
      
      case httpMethod === 'PATCH' && path.match(/\/api\/sessions\/[\w-]+$/):
        return await updateSession(event);
      
      default:
        return createErrorResponse(404, 'Not found');
    }
  } catch (error) {
    console.error('Sessions handler error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

const createSession = async (
  event: APIGatewayProxyEvent, 
  auth: any
): Promise<APIGatewayProxyResult> => {
  const body = parseBody(event);
  
  try {
    const validatedData = insertSessionSchema.parse({
      ...body,
      studentId: auth.user.claims.sub,
      status: 'pending'
    });
    
    const session = await storage.createSession(validatedData);
    
    // Here you could trigger an SNS notification to counsellors
    // await publishToSNS('New session request created', session);
    
    return createResponse(201, {
      session,
      message: 'Session created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, error.errors.map(e => e.message).join(', '));
    }
    throw error;
  }
};

const getStudentSessions = async (
  event: APIGatewayProxyEvent, 
  auth: any
): Promise<APIGatewayProxyResult> => {
  const sessions = await storage.getStudentSessions(auth.user.claims.sub);
  return createResponse(200, { sessions });
};

const getCounsellorSessions = async (
  event: APIGatewayProxyEvent, 
  auth: any
): Promise<APIGatewayProxyResult> => {
  const user = await storage.getUser(auth.user.claims.sub);
  
  if (user?.role !== 'counsellor') {
    return createErrorResponse(403, 'Only counsellors can access this endpoint');
  }
  
  const sessions = await storage.getCounsellorSessions(auth.user.claims.sub);
  return createResponse(200, { sessions });
};

const getPendingSessions = async (
  event: APIGatewayProxyEvent, 
  auth: any
): Promise<APIGatewayProxyResult> => {
  const user = await storage.getUser(auth.user.claims.sub);
  
  if (user?.role !== 'counsellor' && user?.role !== 'admin') {
    return createErrorResponse(403, 'Only counsellors and admins can access pending sessions');
  }
  
  const sessions = await storage.getPendingSessions();
  return createResponse(200, { sessions });
};

const getAllSessions = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const sessions = await storage.getAllSessions();
  return createResponse(200, { sessions });
};

const updateSession = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id = getPathParameter(event, 'id');
  const updates = parseBody(event);
  
  if (!id) {
    return createErrorResponse(400, 'Session ID is required');
  }
  
  const updatedSession = await storage.updateSession(id, updates);
  
  if (!updatedSession) {
    return createErrorResponse(404, 'Session not found');
  }
  
  return createResponse(200, {
    session: updatedSession,
    message: 'Session updated successfully'
  });
};
