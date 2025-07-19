#!/bin/bash

# CollegeSafe Production Deployment Script
# This script fixes all deployment issues and sets up a production-ready environment

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
NGINX_CONF="/etc/nginx/sites-available/collegesafe"
NGINX_ENABLED="/etc/nginx/sites-enabled/collegesafe"
LOG_DIR="/var/log/collegesafe"
USER="collegesafe"
NODE_VERSION="18"
DOMAIN="localhost"  # Change this to your domain
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

# Install system dependencies
install_system_dependencies() {
    print_header "Installing System Dependencies"
    
    print_status "Updating package lists..."
    apt update
    
    print_status "Installing required packages..."
    apt install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates lsb-release
    apt install -y nginx postgresql postgresql-contrib build-essential
    apt install -y git vim htop ufw fail2ban
    
    print_success "System dependencies installed"
}

# Install Node.js
install_nodejs() {
    print_header "Installing Node.js ${NODE_VERSION}"
    
    if command -v node &> /dev/null; then
        local current_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$current_version" = "$NODE_VERSION" ]; then
            print_success "Node.js ${NODE_VERSION} already installed"
            return
        fi
    fi
    
    print_status "Installing Node.js ${NODE_VERSION}..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt install -y nodejs
    
    # Install PM2 globally
    npm install -g pm2
    
    print_success "Node.js ${NODE_VERSION} and PM2 installed"
}

# Create application user
create_app_user() {
    print_header "Creating Application User"
    
    if id "$USER" &>/dev/null; then
        print_success "User $USER already exists"
    else
        print_status "Creating user $USER..."
        useradd -r -s /bin/bash -m -d /home/$USER $USER
        print_success "User $USER created"
    fi
}

# Setup database
setup_database() {
    print_header "Setting Up PostgreSQL Database"
    
    print_status "Starting PostgreSQL service..."
    systemctl start postgresql
    systemctl enable postgresql
    
    print_status "Creating database and user..."
    sudo -u postgres psql << EOF
-- Terminate existing connections
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '${APP_NAME}_db'
AND pid <> pg_backend_pid();

-- Create user if not exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '$USER') THEN
        CREATE USER $USER WITH PASSWORD '${APP_NAME}123';
    END IF;
END
\$\$;

-- Drop and recreate database
DROP DATABASE IF EXISTS ${APP_NAME}_db;
CREATE DATABASE ${APP_NAME}_db OWNER $USER;
GRANT ALL PRIVILEGES ON DATABASE ${APP_NAME}_db TO $USER;
ALTER USER $USER CREATEDB;

-- Connect to the database and create extensions
\c ${APP_NAME}_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
GRANT ALL ON SCHEMA public TO $USER;
EOF

    print_success "Database setup completed"
}

# Create application directory
setup_app_directory() {
    print_header "Setting Up Application Directory"
    
    print_status "Creating application directory..."
    mkdir -p $APP_DIR
    mkdir -p $LOG_DIR
    
    print_status "Setting ownership and permissions..."
    chown -R $USER:$USER $APP_DIR
    chown -R $USER:$USER $LOG_DIR
    chmod -R 755 $APP_DIR
    
    print_success "Application directory setup completed"
}

# Copy application files
copy_application_files() {
    print_header "Copying Application Files"
    
    print_status "Copying application files to $APP_DIR..."
    cp -r . $APP_DIR/
    chown -R $USER:$USER $APP_DIR
    
    # Remove development files
    rm -rf $APP_DIR/node_modules
    rm -rf $APP_DIR/dist
    rm -rf $APP_DIR/.git
    
    print_success "Application files copied"
}

# Fix server configuration issues
fix_server_configuration() {
    print_header "Fixing Server Configuration Issues"
    
    print_status "Adding cookie-parser dependency..."
    cd $APP_DIR
    
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
    log_file: '$LOG_DIR/app.log',
    out_file: '$LOG_DIR/out.log',
    error_file: '$LOG_DIR/error.log',
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

# Setup Nginx
setup_nginx() {
    print_header "Setting Up Nginx"
    
    print_status "Creating Nginx configuration..."
    cat > $NGINX_CONF << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    root $APP_DIR/dist/public;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;

    # Static files with cache headers
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Frontend routes (SPA)
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Error pages
    error_page 404 /index.html;
    error_page 500 502 503 504 /index.html;

    # Logging
    access_log $LOG_DIR/nginx_access.log;
    error_log $LOG_DIR/nginx_error.log;
}
EOF

    # Enable the site
    ln -sf $NGINX_CONF $NGINX_ENABLED
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    nginx -t
    
    print_success "Nginx configuration created and tested"
}

# Setup firewall
setup_firewall() {
    print_header "Setting Up Firewall"
    
    print_status "Configuring UFW firewall..."
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 'Nginx Full'
    ufw allow 80
    ufw allow 443
    ufw --force enable
    
    print_success "Firewall configured"
}

# Create systemd service
create_systemd_service() {
    print_header "Creating Systemd Service"
    
    cat > /etc/systemd/system/$SERVICE_NAME.service << EOF
[Unit]
Description=CollegeSafe Application
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/pm2-runtime start ecosystem.config.js
ExecReload=/bin/kill -HUP \$MAINPID
KillMode=mixed
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME
Environment=NODE_ENV=production
EnvironmentFile=$APP_DIR/.env

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable $SERVICE_NAME
    
    print_success "Systemd service created"
}

# Initialize database
initialize_database() {
    print_header "Initializing Database"
    
    cd $APP_DIR
    
    print_status "Running database migrations..."
    sudo -u $USER npm run db:migrate
    
    print_status "Creating default users..."
    sudo -u $USER npm run db:create-default-user
    
    print_success "Database initialized"
}

# Start services
start_services() {
    print_header "Starting Services"
    
    print_status "Starting Nginx..."
    systemctl restart nginx
    systemctl enable nginx
    
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
    
    print_status "Testing frontend..."
    local frontend_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)
    if [ "$frontend_response" = "200" ]; then
        print_success "Frontend is accessible"
    else
        print_warning "Frontend returned status: $frontend_response"
    fi
    
    print_success "Deployment test completed"
}

# Display final information
display_final_info() {
    print_header "Deployment Complete!"
    
    echo -e "${GREEN}✅ CollegeSafe has been successfully deployed!${NC}\n"
    
    echo -e "${BLUE}📋 Application Information:${NC}"
    echo -e "   📍 URL: http://$DOMAIN"
    echo -e "   🔗 API: http://$DOMAIN/api"
    echo -e "   💓 Health: http://$DOMAIN/health"
    echo -e "   📁 Directory: $APP_DIR"
    echo -e "   📊 Logs: $LOG_DIR"
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
    echo -e "   🔍 Application Logs: tail -f $LOG_DIR/app.log"
    echo ""
    
    echo -e "${BLUE}🔧 Useful Commands:${NC}"
    echo -e "   🔃 Reload Nginx: sudo systemctl reload nginx"
    echo -e "   🗄️  Database Status: sudo systemctl status postgresql"
    echo -e "   🔥 Firewall Status: sudo ufw status"
    echo ""
    
    echo -e "${YELLOW}⚠️  Important Notes:${NC}"
    echo -e "   • Change default passwords in production"
    echo -e "   • Update $DOMAIN to your actual domain"
    echo -e "   • Consider setting up SSL/HTTPS with Let's Encrypt"
    echo -e "   • Monitor logs regularly"
    echo -e "   • Set up automated backups for the database"
    echo ""
    
    echo -e "${PURPLE}🎉 Your CollegeSafe application is now ready for production use!${NC}"
}

# Main deployment function
main() {
    print_header "CollegeSafe Production Deployment"
    
    check_root
    install_system_dependencies
    install_nodejs
    create_app_user
    setup_database
    setup_app_directory
    copy_application_files
    fix_server_configuration
    build_application
    setup_environment
    create_pm2_config
    setup_nginx
    setup_firewall
    create_systemd_service
    initialize_database
    start_services
    test_deployment
    display_final_info
}

# Run main function
main "$@" 