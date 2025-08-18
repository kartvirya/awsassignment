import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { storage } from '../server/storage';
import { 
  createResponse, 
  createErrorResponse, 
  parseBody, 
  authenticate,
  getPathParameter
} from './utils';

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    const { httpMethod, path } = event;
    console.log(`Users handler: ${httpMethod} ${path}`);

    // Check authentication for all user endpoints
    const auth = await authenticate(event);
    if (!auth) {
      return createErrorResponse(401, 'Unauthorized');
    }

    switch (true) {
      case httpMethod === 'GET' && path.match(/\/api\/users$/):
        return await getAllUsers(event);
      
      case httpMethod === 'GET' && path.match(/\/api\/users\/role\/\w+$/):
        return await getUsersByRole(event);
      
      case httpMethod === 'PATCH' && path.match(/\/api\/users\/[\w-]+\/role$/):
        return await updateUserRole(event);
      
      default:
        return createErrorResponse(404, 'Not found');
    }
  } catch (error) {
    console.error('Users handler error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

const getAllUsers = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const users = await storage.getAllUsers();
  
  return createResponse(200, {
    users: users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }))
  });
};

const getUsersByRole = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const role = getPathParameter(event, 'role');
  
  if (!role) {
    return createErrorResponse(400, 'Role parameter is required');
  }
  
  const users = await storage.getUsersByRole(role);
  
  return createResponse(200, {
    users: users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }))
  });
};

const updateUserRole = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const userId = getPathParameter(event, 'id');
  const { role } = parseBody(event);
  
  if (!userId || !role) {
    return createErrorResponse(400, 'User ID and role are required');
  }
  
  const updatedUser = await storage.updateUserRole(userId, role);
  
  if (!updatedUser) {
    return createErrorResponse(404, 'User not found');
  }
  
  return createResponse(200, {
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role
    },
    message: 'User role updated successfully'
  });
};
