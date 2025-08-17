import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertResourceSchema, insertSessionSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session storage
const sessions = new Map<string, string>(); // sessionId -> userId

  // Simple auth middleware
  const isAuthenticated = (req: any, res: any, next: any) => {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    
    if (sessionId && sessions.has(sessionId)) {
      req.user = {
        claims: { sub: sessions.get(sessionId) }
      };
      return next();
    }
    
    return res.status(401).json({ message: 'Unauthorized' });
  };

  // Login route
  app.post('/api/login', async (req: any, res) => {
    try {
      const { email, password } = req.body;
      
      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // TODO: In production, implement proper password hashing and verification
      // For now, we'll accept any password for the demo
      // In production, you should use bcrypt or similar to hash/verify passwords
      
      // Create session
      const sessionId = `session-${Date.now()}-${Math.random()}`;
      sessions.set(sessionId, user.id);
      
      res.json({ 
        user, 
        token: sessionId,
        message: 'Login successful'
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Signup route
  app.post('/api/signup', async (req: any, res) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      
      // Validate required fields
      if (!email || !password || !firstName || !lastName || !role) {
        return res.status(400).json({ message: 'All fields are required' });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: 'User with this email already exists' });
      }
      
      // Create new user
      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newUser = {
        id: userId,
        email,
        firstName,
        lastName,
        role: role as any,
      };
      
      const user = await storage.upsertUser(newUser);
      
      res.status(201).json({ 
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Logout route
  app.post('/api/logout', (req: any, res) => {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    if (sessionId) {
      sessions.delete(sessionId);
    }
    // Clear any stored tokens
    res.json({ message: 'Logged out successfully' });
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });



  // User routes
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/users/role/:role', isAuthenticated, async (req: any, res) => {
    try {
      const users = await storage.getUsersByRole(req.params.role);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users by role:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/users/:id/role', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      const { role } = req.body;
      const user = await storage.updateUserRole(req.params.id, role);
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Resource routes
  app.post('/api/resources', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'counsellor' && currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const resourceData = insertResourceSchema.parse({
        ...req.body,
        uploadedBy: req.user.claims.sub,
      });
      
      const resource = await storage.createResource(resourceData);
      res.json(resource);
    } catch (error) {
      console.error("Error creating resource:", error);
      res.status(500).json({ message: "Failed to create resource" });
    }
  });

  app.get('/api/resources', isAuthenticated, async (req: any, res) => {
    try {
      const { type } = req.query;
      const resources = type 
        ? await storage.getResourcesByType(type as string)
        : await storage.getResources();
      res.json(resources);
    } catch (error) {
      console.error("Error fetching resources:", error);
      res.status(500).json({ message: "Failed to fetch resources" });
    }
  });

  app.get('/api/resources/:id', isAuthenticated, async (req: any, res) => {
    try {
      const resource = await storage.getResourceById(parseInt(req.params.id));
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      res.json(resource);
    } catch (error) {
      console.error("Error fetching resource:", error);
      res.status(500).json({ message: "Failed to fetch resource" });
    }
  });

  app.patch('/api/resources/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'counsellor' && currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const resource = await storage.updateResource(parseInt(req.params.id), req.body);
      res.json(resource);
    } catch (error) {
      console.error("Error updating resource:", error);
      res.status(500).json({ message: "Failed to update resource" });
    }
  });

  app.delete('/api/resources/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'counsellor' && currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteResource(parseInt(req.params.id));
      res.json({ message: "Resource deleted successfully" });
    } catch (error) {
      console.error("Error deleting resource:", error);
      res.status(500).json({ message: "Failed to delete resource" });
    }
  });

  // Session routes
  app.post('/api/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'student') {
        return res.status(403).json({ message: "Only students can book sessions" });
      }
      
      console.log("Session creation request:", req.body);
      console.log("Current user:", currentUser);
      
      // Create session data manually to avoid schema validation issues
      const sessionData = {
        studentId: req.user.claims.sub,
        counsellorId: req.body.counsellorId,
        scheduledAt: new Date(req.body.scheduledAt),
        status: 'pending' as const,
        type: req.body.type || 'individual' as const,
        notes: req.body.notes || null,
        studentNotes: req.body.studentNotes || null,
      };
      
      console.log("Session data:", sessionData);
      
      const session = await storage.createSession(sessionData);
      console.log("Created session:", session);
      res.json(session);
    } catch (error) {
      console.error("Error creating session:", error);
      if (error instanceof Error) {
        res.status(500).json({ 
          message: "Failed to create session", 
          error: error.message,
          details: error.stack 
        });
      } else {
        res.status(500).json({ message: "Failed to create session" });
      }
    }
  });

  app.get('/api/sessions/student', isAuthenticated, async (req: any, res) => {
    try {
      const sessions = await storage.getSessionsByStudent(req.user.claims.sub);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching student sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.get('/api/sessions/counsellor', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'counsellor') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const sessions = await storage.getSessionsByCounsellor(req.user.claims.sub);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching counsellor sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.get('/api/sessions/pending', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'counsellor' && currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const sessions = await storage.getPendingSessions();
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching pending sessions:", error);
      res.status(500).json({ message: "Failed to fetch pending sessions" });
    }
  });

  app.get('/api/sessions/all', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const sessions = await storage.getSessionsWithUsers();
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching all sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.patch('/api/sessions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const session = await storage.updateSession(parseInt(req.params.id), req.body);
      res.json(session);
    } catch (error) {
      console.error("Error updating session:", error);
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  // Message routes
  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user.claims.sub,
      });
      
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.get('/api/messages/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const conversations = await storage.getConversations(req.user.claims.sub);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get('/api/messages/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const messages = await storage.getMessagesBetweenUsers(
        req.user.claims.sub,
        req.params.userId
      );
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.patch('/api/messages/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      await storage.markMessageAsRead(parseInt(req.params.id));
      res.json({ message: "Message marked as read" });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Progress routes
  app.post('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const progressData = {
        ...req.body,
        userId: req.user.claims.sub,
      };
      
      const progress = await storage.createOrUpdateProgress(progressData);
      res.json(progress);
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  app.get('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const progress = await storage.getUserProgress(req.user.claims.sub);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/stats', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
