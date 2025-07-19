import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import { storage } from "./storage";
import { authService, loginSchema, registerSchema } from "./auth";
import { insertResourceSchema, insertSessionSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import { randomBytes } from "crypto";

// CSRF token middleware - fixed version
const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for development and specific endpoints
  if (process.env.NODE_ENV === 'development' || 
      req.path === '/health' || 
      req.path === '/api/login' ||
      req.path === '/api/register') {
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
  const token = req.cookies && req.cookies['XSRF-TOKEN'];
  const headerToken = req.headers['x-xsrf-token'] as string;

  if (!token || !headerToken || token !== headerToken) {
    console.log('CSRF validation failed:', { token: !!token, headerToken: !!headerToken });
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

  try {
    const user = await authService.validateSession(token);
    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);

  // Add cookie parser middleware FIRST
  app.use(cookieParser());

  // Health check endpoint (before any other middleware)
  app.get('/health', async (req, res) => {
    try {
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

  // CSRF protection for non-auth routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') && 
        req.path !== '/api/login' && 
        req.path !== '/api/register') {
      return csrfProtection(req, res, next);
    }
    next();
  });

  // Auth routes (no CSRF protection for easier testing)
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
      res.status(500).json({ message: error instanceof Error ? error.message : 'Registration failed' });
    }
  });

  app.post('/api/login', async (req, res) => {
    try {
      console.log('Login attempt for:', req.body.email);
      const input = loginSchema.parse(req.body);
      const { user, token } = await authService.login(input);
      
      // Set CSRF token for authenticated user
      const csrfToken = randomBytes(32).toString('hex');
      res.cookie('XSRF-TOKEN', csrfToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      res.json({ user, token, message: 'Login successful' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      console.error('Login error:', error);
      res.status(401).json({ message: error instanceof Error ? error.message : 'Login failed' });
    }
  });

  app.post('/api/logout', isAuthenticated, async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        authService.logout(token);
      }
      res.clearCookie('XSRF-TOKEN');
      res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Logout failed' });
    }
  });

  // Protected routes
  app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.get('/api/analytics/stats', async (req, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({ message: 'Failed to fetch analytics' });
    }
  });

  // Resources routes (public access for now)
  app.get('/api/resources', async (req, res) => {
    try {
      const resources = await storage.getResources();
      res.json(resources);
    } catch (error) {
      console.error('Get resources error:', error);
      res.status(500).json({ message: 'Failed to fetch resources' });
    }
  });

  app.post('/api/resources', isAuthenticated, async (req, res) => {
    try {
      const input = insertResourceSchema.parse(req.body);
      const resource = await storage.createResource(input);
      res.status(201).json(resource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      console.error('Create resource error:', error);
      res.status(500).json({ message: 'Failed to create resource' });
    }
  });

  // Sessions routes
  app.get('/api/sessions', async (req, res) => {
    try {
      const sessions = await storage.getSessions();
      res.json(sessions);
    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({ message: 'Failed to fetch sessions' });
    }
  });

  app.post('/api/sessions', isAuthenticated, async (req, res) => {
    try {
      const input = insertSessionSchema.parse(req.body);
      const session = await storage.createSession(input);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      console.error('Create session error:', error);
      res.status(500).json({ message: 'Failed to create session' });
    }
  });

  // Messages routes
  app.get('/api/messages', async (req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req, res) => {
    try {
      const input = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(input);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      console.error('Create message error:', error);
      res.status(500).json({ message: 'Failed to create message' });
    }
  });

  return server;
}
