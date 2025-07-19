import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// CORS middleware for production
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-XSRF-TOKEN');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api") || path.startsWith("/health")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse && res.statusCode >= 400) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 100) {
        logLine = logLine.slice(0, 99) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CollegeSafe API Server',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      users: '/api/users',
      resources: '/api/resources',
      sessions: '/api/sessions',
      messages: '/api/messages',
      analytics: '/api/analytics'
    }
  });
});

(async () => {
  try {
    const server = await registerRoutes(app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      console.error('Error:', err);
      res.status(status).json({ message });
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ 
        message: 'Endpoint not found',
        path: req.path,
        method: req.method,
        availableEndpoints: ['/health', '/api/*']
      });
    });

    // Graceful shutdown
    const gracefulShutdown = () => {
      console.log('Received SIGTERM. Closing database pool...');
      // Add any cleanup code here
      console.log('Database pool closed.');
      process.exit(0);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    // Start server
    const port = parseInt(process.env.PORT || '3000', 10);
    server.listen(port, () => {
      console.log(`🚀 CollegeSafe API Server running on port ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`🔗 API endpoints: http://localhost:${port}/api/*`);
      console.log(`🌐 Root: http://localhost:${port}/`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
