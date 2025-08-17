import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { User, AuthenticationError } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';
const JWT_EXPIRES_IN = '24h';

export const generateToken = (user: User): string => {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new AuthenticationError('Invalid token');
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const extractTokenFromEvent = (event: APIGatewayProxyEvent): string | null => {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  
  if (!authHeader) {
    return null;
  }

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return authHeader;
};

export const authenticateUser = (event: APIGatewayProxyEvent): any => {
  const token = extractTokenFromEvent(event);
  
  if (!token) {
    throw new AuthenticationError('No token provided');
  }

  try {
    const decoded = verifyToken(token);
    return decoded;
  } catch (error) {
    throw new AuthenticationError('Invalid token');
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (event: APIGatewayProxyEvent): any => {
    const user = authenticateUser(event);
    
    if (!allowedRoles.includes(user.role)) {
      throw new AuthenticationError('Insufficient permissions');
    }
    
    return user;
  };
};

export const requireAdmin = (event: APIGatewayProxyEvent): any => {
  return requireRole(['admin'])(event);
};

export const requireCounsellor = (event: APIGatewayProxyEvent): any => {
  return requireRole(['counsellor', 'admin'])(event);
};

export const requireStudent = (event: APIGatewayProxyEvent): any => {
  return requireRole(['student', 'counsellor', 'admin'])(event);
};

