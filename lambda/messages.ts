import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { storage } from '../server/storage';
import { 
  createResponse, 
  createErrorResponse, 
  parseBody, 
  authenticate,
  getPathParameter
} from './utils';
import { insertMessageSchema } from '@shared/schema';
import { z } from 'zod';

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    const { httpMethod, path } = event;
    console.log(`Messages handler: ${httpMethod} ${path}`);

    // Check authentication for all message endpoints
    const auth = await authenticate(event);
    if (!auth) {
      return createErrorResponse(401, 'Unauthorized');
    }

    switch (true) {
      case httpMethod === 'POST' && path.match(/\/api\/messages$/):
        return await createMessage(event, auth);
      
      case httpMethod === 'GET' && path.endsWith('/api/messages/conversations'):
        return await getConversations(event, auth);
      
      case httpMethod === 'GET' && path.match(/\/api\/messages\/[\w-]+$/):
        return await getConversationMessages(event, auth);
      
      default:
        return createErrorResponse(404, 'Not found');
    }
  } catch (error) {
    console.error('Messages handler error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

const createMessage = async (
  event: APIGatewayProxyEvent, 
  auth: any
): Promise<APIGatewayProxyResult> => {
  const body = parseBody(event);
  
  try {
    const validatedData = insertMessageSchema.parse({
      ...body,
      senderId: auth.user.claims.sub
    });
    
    const message = await storage.createMessage(validatedData);
    
    return createResponse(201, {
      message,
      message: 'Message sent successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, error.errors.map(e => e.message).join(', '));
    }
    throw error;
  }
};

const getConversations = async (
  event: APIGatewayProxyEvent, 
  auth: any
): Promise<APIGatewayProxyResult> => {
  const conversations = await storage.getUserConversations(auth.user.claims.sub);
  return createResponse(200, { conversations });
};

const getConversationMessages = async (
  event: APIGatewayProxyEvent, 
  auth: any
): Promise<APIGatewayProxyResult> => {
  const conversationId = getPathParameter(event, 'conversationId');
  
  if (!conversationId) {
    return createErrorResponse(400, 'Conversation ID is required');
  }
  
  const messages = await storage.getConversationMessages(conversationId, auth.user.claims.sub);
  return createResponse(200, { messages });
};
