#!/bin/bash

# CollegeSafe Resume Deployment Script
# This script resumes deployment from where it got stuck

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="collegesafe"
APP_DIR="/opt/collegesafe"
SERVICE_NAME="collegesafe"
USER="collegesafe"
PORT="3000"

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE} $1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "Please run this script as root (use sudo)"
        exit 1
    fi
}

# Check if application directory exists
check_app_directory() {
    if [ ! -d "$APP_DIR" ]; then
        print_error "Application directory $APP_DIR does not exist"
        print_error "Please run the full deployment script first"
        exit 1
    fi
    print_success "Application directory found"
}

# Fix server configuration issues (resume from here)
fix_server_configuration() {
    print_header "Fixing Server Configuration Issues"
    
    cd $APP_DIR
    
    # Check if cookie-parser is already installed
    if [ -d "node_modules/cookie-parser" ]; then
        print_success "cookie-parser already installed"
    else
        print_status "Adding cookie-parser dependency..."
        # Add timeout and better error handling for npm install
        if ! timeout 300 sudo -u $USER npm install cookie-parser @types/cookie-parser --no-audit --no-fund --silent; then
            print_warning "npm install timed out or failed, trying alternative approach..."
            # Try installing with different flags
            if ! timeout 300 sudo -u $USER npm install cookie-parser @types/cookie-parser --no-audit --no-fund --no-optional --silent; then
                print_error "Failed to install cookie-parser dependencies"
                print_status "Continuing with deployment..."
                return 1
            fi
        fi
    fi
    
    print_status "Fixing CSRF middleware configuration..."
    
    # Create fixed routes.ts
    cat > $APP_DIR/server/routes-fixed.ts << 'EOF'
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import { storage } from "./storage";
import { authService, loginSchema, registerSchema } from "./auth";
import { insertResourceSchema, insertSessionSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import { randomBytes } from "crypto";

// CSRF token middleware - properly configured
const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  if (req.method === 'GET' || req.path === '/health' || req.path.startsWith('/api/auth/')) {
    // Generate new CSRF token for GET requests and auth endpoints
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

  // Add cookie parser middleware
  app.use(cookieParser());

  // Health check endpoint (before CSRF protection)
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

  // Apply CSRF protection to API routes only
  app.use('/api', csrfProtection);

  // Auth routes (with relaxed CSRF for login)
  app.post('/api/login', async (req, res) => {
    try {
      const input = loginSchema.parse(req.body);
      const { user, token } = await authService.login(input);
      res.json({ user, token, message: 'Login successful' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      console.error('Login error:', error);
      res.status(401).json({ message: error instanceof Error ? error.message : 'Login failed' });
    }
  });

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

  app.post('/api/logout', isAuthenticated, async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        authService.logout(token);
      }
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

  app.get('/api/analytics/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({ message: 'Failed to fetch analytics' });
    }
  });

  // Resources routes
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
  app.get('/api/sessions', isAuthenticated, async (req, res) => {
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
  app.get('/api/messages', isAuthenticated, async (req, res) => {
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
EOF
    
    # Replace the original routes file
    if [ -f "$APP_DIR/server/routes.ts" ]; then
        mv $APP_DIR/server/routes.ts $APP_DIR/server/routes-original.ts
    fi
    mv $APP_DIR/server/routes-fixed.ts $APP_DIR/server/routes.ts
    
    print_success "Server configuration fixed"
}

# Build application
build_application() {
    print_header "Building Application"
    
    cd $APP_DIR
    
    print_status "Installing dependencies..."
    if ! timeout 600 sudo -u $USER npm install --no-audit --no-fund --silent; then
        print_warning "npm install timed out, trying with reduced flags..."
        if ! timeout 600 sudo -u $USER npm install --no-audit --no-fund --no-optional --silent; then
            print_error "Failed to install dependencies"
            print_status "Continuing with deployment..."
            return 1
        fi
    fi
    
    print_status "Building frontend..."
    if ! timeout 300 sudo -u $USER npm run build; then
        print_warning "Build timed out or failed"
        print_status "Continuing with deployment..."
        return 1
    fi
    
    print_status "Type checking..."
    if ! timeout 120 sudo -u $USER npm run check; then
        print_warning "Type check failed or timed out"
        print_status "Continuing with deployment..."
        return 1
    fi
    
    print_success "Application built successfully"
}

# Setup environment file
setup_environment() {
    print_header "Setting Up Environment Configuration"
    
    cat > $APP_DIR/.env << EOF
NODE_ENV=production
PORT=$PORT
DATABASE_URL=postgresql://$USER:${APP_NAME}123@localhost:5432/${APP_NAME}_db
SESSION_SECRET=$(openssl rand -base64 32)
COOKIE_SECRET=$(openssl rand -base64 32)
CSRF_SECRET=$(openssl rand -base64 32)
EOF

    chown $USER:$USER $APP_DIR/.env
    chmod 600 $APP_DIR/.env
    
    print_success "Environment configuration created"
}

# Create PM2 ecosystem file
create_pm2_config() {
    print_header "Creating PM2 Configuration"
    
    cat > $APP_DIR/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'dist/index.js',
    cwd: '$APP_DIR',
    user: '$USER',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: $PORT
    },
    log_file: '/var/log/collegesafe/app.log',
    out_file: '/var/log/collegesafe/out.log',
    error_file: '/var/log/collegesafe/error.log',
    time: true,
    max_memory_restart: '500M',
    restart_delay: 4000,
    autorestart: true,
    watch: false
  }]
};
EOF

    chown $USER:$USER $APP_DIR/ecosystem.config.js
    
    print_success "PM2 configuration created"
}

# Initialize database
initialize_database() {
    print_header "Initializing Database"
    
    cd $APP_DIR
    
    print_status "Running database migrations..."
    if ! timeout 120 sudo -u $USER npm run db:migrate; then
        print_warning "Database migration failed or timed out"
        print_status "Continuing with deployment..."
        return 1
    fi
    
    print_status "Creating default users..."
    if ! timeout 60 sudo -u $USER npm run db:create-default-user; then
        print_warning "Default user creation failed or timed out"
        print_status "Continuing with deployment..."
        return 1
    fi
    
    print_success "Database initialized"
}

# Start services
start_services() {
    print_header "Starting Services"
    
    print_status "Starting CollegeSafe application..."
    systemctl restart $SERVICE_NAME
    
    print_success "Services started"
}

# Test deployment
test_deployment() {
    print_header "Testing Deployment"
    
    print_status "Waiting for application to start..."
    sleep 10
    
    print_status "Testing health endpoint..."
    local health_response=$(curl -s http://localhost:$PORT/health)
    if echo "$health_response" | grep -q '"status":"healthy"'; then
        print_success "Health check passed"
    else
        print_error "Health check failed"
        echo "Response: $health_response"
        return 1
    fi
    
    print_success "Deployment test completed"
}

# Display final information
display_final_info() {
    print_header "Resume Deployment Complete!"
    
    echo -e "${GREEN}✅ CollegeSafe deployment has been resumed and completed!${NC}\n"
    
    echo -e "${BLUE}📋 Application Information:${NC}"
    echo -e "   📍 URL: http://localhost"
    echo -e "   🔗 API: http://localhost/api"
    echo -e "   💓 Health: http://localhost/health"
    echo -e "   📁 Directory: $APP_DIR"
    echo ""
    
    echo -e "${BLUE}🔐 Default Login Credentials:${NC}"
    echo -e "   👨‍💼 Admin: admin@collegesafe.com / admin123"
    echo -e "   👩‍⚕️ Counsellor: counsellor@collegesafe.com / counsellor123"
    echo ""
    
    echo -e "${BLUE}🛠️  Management Commands:${NC}"
    echo -e "   🔄 Restart: sudo systemctl restart $SERVICE_NAME"
    echo -e "   📊 Status: sudo systemctl status $SERVICE_NAME"
    echo -e "   📝 Logs: sudo journalctl -u $SERVICE_NAME -f"
    echo -e "   📈 PM2 Status: sudo -u $USER pm2 status"
    echo ""
    
    echo -e "${PURPLE}🎉 Your CollegeSafe application is now ready for use!${NC}"
}

# Main resume function
main() {
    print_header "CollegeSafe Resume Deployment"
    
    check_root
    check_app_directory
    fix_server_configuration
    build_application
    setup_environment
    create_pm2_config
    initialize_database
    start_services
    test_deployment
    display_final_info
}

# Run main function
main "$@" 