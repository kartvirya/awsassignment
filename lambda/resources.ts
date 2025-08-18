import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { storage } from '../server/storage';
import { 
  createResponse, 
  createErrorResponse, 
  parseBody, 
  authenticate,
  getPathParameter
} from './utils';
import { insertResourceSchema } from '@shared/schema';
import { z } from 'zod';

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    const { httpMethod, path } = event;
    console.log(`Resources handler: ${httpMethod} ${path}`);

    // Check authentication for all resource endpoints
    const auth = await authenticate(event);
    if (!auth) {
      return createErrorResponse(401, 'Unauthorized');
    }

    switch (true) {
      case httpMethod === 'POST' && path.match(/\/api\/resources$/):
        return await createResource(event, auth);
      
      case httpMethod === 'GET' && path.match(/\/api\/resources$/):
        return await getAllResources(event);
      
      case httpMethod === 'GET' && path.match(/\/api\/resources\/[\w-]+$/):
        return await getResource(event);
      
      case httpMethod === 'PATCH' && path.match(/\/api\/resources\/[\w-]+$/):
        return await updateResource(event);
      
      case httpMethod === 'DELETE' && path.match(/\/api\/resources\/[\w-]+$/):
        return await deleteResource(event);
      
      default:
        return createErrorResponse(404, 'Not found');
    }
  } catch (error) {
    console.error('Resources handler error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

const createResource = async (
  event: APIGatewayProxyEvent, 
  auth: any
): Promise<APIGatewayProxyResult> => {
  const body = parseBody(event);
  
  try {
    const validatedData = insertResourceSchema.parse({
      ...body,
      createdBy: auth.user.claims.sub
    });
    
    const resource = await storage.createResource(validatedData);
    
    return createResponse(201, {
      resource,
      message: 'Resource created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, error.errors.map(e => e.message).join(', '));
    }
    throw error;
  }
};

const getAllResources = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const resources = await storage.getAllResources();
  return createResponse(200, { resources });
};

const getResource = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id = getPathParameter(event, 'id');
  
  if (!id) {
    return createErrorResponse(400, 'Resource ID is required');
  }
  
  const resource = await storage.getResource(id);
  
  if (!resource) {
    return createErrorResponse(404, 'Resource not found');
  }
  
  return createResponse(200, { resource });
};

const updateResource = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id = getPathParameter(event, 'id');
  const updates = parseBody(event);
  
  if (!id) {
    return createErrorResponse(400, 'Resource ID is required');
  }
  
  const updatedResource = await storage.updateResource(id, updates);
  
  if (!updatedResource) {
    return createErrorResponse(404, 'Resource not found');
  }
  
  return createResponse(200, {
    resource: updatedResource,
    message: 'Resource updated successfully'
  });
};

const deleteResource = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const id = getPathParameter(event, 'id');
  
  if (!id) {
    return createErrorResponse(400, 'Resource ID is required');
  }
  
  const deleted = await storage.deleteResource(id);
  
  if (!deleted) {
    return createErrorResponse(404, 'Resource not found');
  }
  
  return createResponse(200, { message: 'Resource deleted successfully' });
};
