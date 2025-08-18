import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { storage } from '../server/storage';
import { 
  createResponse, 
  createErrorResponse, 
  parseBody, 
  authenticate, 
  createSession, 
  deleteSession 
} from './utils';

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    const { httpMethod, path } = event;
    console.log(`Auth handler: ${httpMethod} ${path}`);

    switch (true) {
      case httpMethod === 'POST' && path.endsWith('/api/login'):
        return await login(event);
      
      case httpMethod === 'POST' && path.endsWith('/api/signup'):
        return await signup(event);
      
      case httpMethod === 'POST' && path.endsWith('/api/logout'):
        return await logout(event);
      
      case httpMethod === 'GET' && path.endsWith('/api/auth/user'):
        return await getUser(event);
      
      default:
        return createErrorResponse(404, 'Not found');
    }
  } catch (error) {
    console.error('Auth handler error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

const login = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { email, password } = parseBody(event);
  
  if (!email || !password) {
    return createErrorResponse(400, 'Email and password are required');
  }
  
  const user = await storage.getUserByEmail(email);
  
  if (!user) {
    return createErrorResponse(401, 'Invalid credentials');
  }
  
  // Create session
  const sessionId = createSession(user.id);
  
  return createResponse(200, {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    sessionId,
    message: 'Login successful'
  });
};

const signup = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { email, password, name } = parseBody(event);
  
  if (!email || !password || !name) {
    return createErrorResponse(400, 'Email, password, and name are required');
  }
  
  // Check if user already exists
  const existingUser = await storage.getUserByEmail(email);
  if (existingUser) {
    return createErrorResponse(400, 'User already exists with this email');
  }
  
  // Create new user
  const newUser = await storage.upsertUser({
    email,
    name,
    role: 'student' // Default role
  });
  
  // Create session
  const sessionId = createSession(newUser.id);
  
  return createResponse(201, {
    user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
    sessionId,
    message: 'Account created successfully'
  });
};

const logout = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  const sessionId = authHeader?.replace('Bearer ', '');
  
  if (sessionId) {
    deleteSession(sessionId);
  }
  
  return createResponse(200, { message: 'Logout successful' });
};

const getUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const auth = await authenticate(event);
  
  if (!auth) {
    return createErrorResponse(401, 'Unauthorized');
  }
  
  const user = await storage.getUser(auth.user.claims.sub);
  
  if (!user) {
    return createErrorResponse(404, 'User not found');
  }
  
  return createResponse(200, {
    user: { id: user.id, email: user.email, name: user.name, role: user.role }
  });
};
