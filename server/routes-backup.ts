import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authService, loginSchema, registerSchema } from "./auth";
import { insertResourceSchema, insertSessionSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import { randomBytes } from "crypto";

// CSRF token middleware - disabled in development
const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  if (req.method === 'GET') {
    // Generate new CSRF token for GET requests
    const token = randomBytes(32).toString('hex');
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    return next();
  }

  // Verify CSRF token for non-GET requests
  const token = req.cookies['XSRF-TOKEN'];
  const headerToken = req.headers['x-xsrf-token'];

  if (!token || !headerToken || token !== headerToken) {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }

  next();
};

// Authentication middleware
const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const user = await authService.validateSession(token);
  if (!user) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  req.user = user;
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);

  // Health check endpoint (before CSRF protection)
  app.get('/health', async (req, res) => {
    try {
      // Check database connectivity
      const dbHealthy = await storage.getSystemStats();
      
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: {
          connected: true,
          stats: dbHealthy
        }
      });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Apply CSRF protection to all routes
  app.use(csrfProtection);

  // Auth routes
  app.post('/api/register', async (req, res) => {
    try {
      const input = registerSchema.parse(req.body);
      const user = await authService.register(input);
      res.json({ user, message: 'Registration successful' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  app.post('/api/login', async (req, res) => {
    try {
      const input = loginSchema.parse(req.body);
      const { user, token } = await authService.login(input);
      
      // Set secure cookie for token
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.json({ user, token, message: 'Login successful' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      console.error('Login error:', error);
      res.status(401).json({ message: 'Invalid credentials' });
    }
  });

  app.post('/api/logout', isAuthenticated, (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      authService.logout(token);
      res.clearCookie('auth_token');
    }
    res.json({ message: 'Logged out successfully' });
  });

  // GET logout endpoint for direct browser access
  app.get('/api/logout', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      authService.logout(token);
    }
    res.clearCookie('auth_token');
    res.json({ message: 'Logged out successfully' });
  });

  app.get('/api/auth/user', isAuthenticated, async (req, res) => {
    res.json(req.user);
  });

  // User routes
  app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.get('/api/users/role/:role', isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getUsersByRole(req.params.role);
      res.json(users);
    } catch (error) {
      console.error('Error fetching users by role:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.patch('/api/users/:id/role', isAuthenticated, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      const { role } = req.body;
      const user = await storage.updateUserRole(req.params.id, role);
      res.json(user);
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ message: 'Failed to update user role' });
    }
  });

  // Resource routes
  app.post('/api/resources', isAuthenticated, async (req, res) => {
    try {
      if (!req.user || (req.user.role !== 'counsellor' && req.user.role !== 'admin')) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const resourceData = insertResourceSchema.parse({
        ...req.body,
        createdBy: req.user.id,
      });
      
      const resource = await storage.createResource(resourceData);
      res.json(resource);
    } catch (error) {
      console.error('Error creating resource:', error);
      res.status(500).json({ message: 'Failed to create resource' });
    }
  });

  app.get('/api/resources', isAuthenticated, async (req, res) => {
    try {
      const { type } = req.query;
      const resources = type 
        ? await storage.getResourcesByType(type as string)
        : await storage.getResources();
      res.json(resources);
    } catch (error) {
      console.error('Error fetching resources:', error);
      res.status(500).json({ message: 'Failed to fetch resources' });
    }
  });

  app.get('/api/resources/:id', isAuthenticated, async (req, res) => {
    try {
      const resource = await storage.getResourceById(parseInt(req.params.id));
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }
      res.json(resource);
    } catch (error) {
      console.error('Error fetching resource:', error);
      res.status(500).json({ message: 'Failed to fetch resource' });
    }
  });

  app.patch('/api/resources/:id', isAuthenticated, async (req, res) => {
    try {
      if (!req.user || (req.user.role !== 'counsellor' && req.user.role !== 'admin')) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const resource = await storage.updateResource(parseInt(req.params.id), req.body);
      res.json(resource);
    } catch (error) {
      console.error('Error updating resource:', error);
      res.status(500).json({ message: 'Failed to update resource' });
    }
  });

  app.delete('/api/resources/:id', isAuthenticated, async (req, res) => {
    try {
      if (!req.user || (req.user.role !== 'counsellor' && req.user.role !== 'admin')) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      await storage.deleteResource(parseInt(req.params.id));
      res.json({ message: 'Resource deleted successfully' });
    } catch (error) {
      console.error('Error deleting resource:', error);
      res.status(500).json({ message: 'Failed to delete resource' });
    }
  });

  // Session routes
  app.post('/api/sessions', isAuthenticated, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can book sessions' });
      }
      
      const sessionData = insertSessionSchema.parse({
        ...req.body,
        studentId: req.user.id,
        scheduledAt: new Date(req.body.scheduledAt),
      });
      
      const session = await storage.createSession(sessionData);
      res.json(session);
    } catch (error) {
      console.error('Error creating session:', error);
      res.status(500).json({ message: 'Failed to create session' });
    }
  });

  app.get('/api/sessions/student', isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }
      const sessions = await storage.getSessionsByStudent(req.user.id);
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching student sessions:', error);
      res.status(500).json({ message: 'Failed to fetch sessions' });
    }
  });

  app.get('/api/sessions/counsellor', isAuthenticated, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'counsellor') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const sessions = await storage.getSessionsByCounsellor(req.user.id);
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching counsellor sessions:', error);
      res.status(500).json({ message: 'Failed to fetch sessions' });
    }
  });

  app.get('/api/sessions/pending', isAuthenticated, async (req, res) => {
    try {
      if (!req.user || (req.user.role !== 'counsellor' && req.user.role !== 'admin')) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const sessions = await storage.getPendingSessions();
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching pending sessions:', error);
      res.status(500).json({ message: 'Failed to fetch pending sessions' });
    }
  });

  app.get('/api/sessions/all', isAuthenticated, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const sessions = await storage.getSessionsWithUsers();
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching all sessions:', error);
      res.status(500).json({ message: 'Failed to fetch sessions' });
    }
  });

  app.patch('/api/sessions/:id', isAuthenticated, async (req, res) => {
    try {
      const session = await storage.updateSession(parseInt(req.params.id), req.body);
      res.json(session);
    } catch (error) {
      console.error('Error updating session:', error);
      res.status(500).json({ message: 'Failed to update session' });
    }
  });

  // Message routes
  app.post('/api/messages', isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user.id,
      });
      
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ message: 'Failed to create message' });
    }
  });

  app.get('/api/messages/conversations', isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }
      const conversations = await storage.getConversations(req.user.id);
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ message: 'Failed to fetch conversations' });
    }
  });

  app.get('/api/messages/:userId', isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }
      const messages = await storage.getMessagesBetweenUsers(
        req.user.id,
        req.params.userId
      );
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  app.patch('/api/messages/:id/read', isAuthenticated, async (req, res) => {
    try {
      await storage.markMessageAsRead(parseInt(req.params.id));
      res.json({ message: 'Message marked as read' });
    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({ message: 'Failed to mark message as read' });
    }
  });

  // Progress routes
  app.post('/api/progress', isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }
      const progressData = {
        ...req.body,
        userId: req.user.id,
      };
      
      const progress = await storage.createUserProgress(progressData);
      res.json(progress);
    } catch (error) {
      console.error('Error creating progress:', error);
      res.status(500).json({ message: 'Failed to create progress' });
    }
  });

  app.get('/api/progress', isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }
      const progress = await storage.getUserProgress(req.user.id);
      res.json(progress);
    } catch (error) {
      console.error('Error fetching progress:', error);
      res.status(500).json({ message: 'Failed to fetch progress' });
    }
  });

  // Analytics routes
  app.get('/api/analytics/stats', isAuthenticated, async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ message: 'Failed to fetch analytics' });
    }
  });

  return server;
}
