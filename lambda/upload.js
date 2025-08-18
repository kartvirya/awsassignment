const { storage } = require('../dist/production.js');

// Simple session management for Lambda
const sessions = new Map(); // sessionId -> userId

const createResponse = (statusCode, body, headers = {}) => {
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

const createErrorResponse = (statusCode, message) => {
  return createResponse(statusCode, { error: message });
};

const parseBody = (event) => {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    return {};
  }
};

const authenticate = async (event) => {
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

const createSession = (userId) => {
  const sessionId = `session-${Date.now()}-${Math.random()}`;
  sessions.set(sessionId, userId);
  return sessionId;
};

const deleteSession = (sessionId) => {
  sessions.delete(sessionId);
};

exports.handler = async (event, context) => {
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

const login = async (event) => {
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

const signup = async (event) => {
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

const logout = async (event) => {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  const sessionId = authHeader?.replace('Bearer ', '');
  
  if (sessionId) {
    deleteSession(sessionId);
  }
  
  return createResponse(200, { message: 'Logout successful' });
};

const getUser = async (event) => {
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
