#!/bin/bash

# CollegeSafe AWS EC2 Deployment Script
set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Function to setup database
setup_database() {
    print_status "Setting up database..."
    
    # Drop existing connections to the database if it exists
    sudo -u postgres psql << EOF
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'collegesafe_db'
AND pid <> pg_backend_pid();
EOF

    # Create database and user with proper error handling
    sudo -u postgres psql << EOF
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'collegesafe') THEN
        CREATE USER collegesafe WITH PASSWORD 'collegesafe123';
    END IF;
END
\$\$;

DROP DATABASE IF EXISTS collegesafe_db;
CREATE DATABASE collegesafe_db OWNER collegesafe;
GRANT ALL PRIVILEGES ON DATABASE collegesafe_db TO collegesafe;
ALTER USER collegesafe CREATEDB;
\c collegesafe_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
\q
EOF
    
    print_success "Database setup completed"
}

# Function to create PM2 ecosystem file
create_pm2_config() {
    print_status "Creating PM2 configuration..."
    
    cat > "$APP_DIR/ecosystem.config.cjs" << EOF
module.exports = {
  apps: [{
    name: '$SERVICE_NAME',
    script: 'dist/index.js',
    cwd: '$APP_DIR',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: 'postgresql://collegesafe:collegesafe123@localhost:5432/collegesafe_db',
      SESSION_SECRET: '$(openssl rand -hex 32)',
      JWT_SECRET: '$(openssl rand -hex 32)',
      LOG_LEVEL: 'info',
      LOG_DIR: '$LOG_DIR'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: 'postgresql://collegesafe:collegesafe123@localhost:5432/collegesafe_db',
      SESSION_SECRET: '$(openssl rand -hex 32)',
      JWT_SECRET: '$(openssl rand -hex 32)',
      LOG_LEVEL: 'info',
      LOG_DIR: '$LOG_DIR'
    },
    error_file: '$LOG_DIR/error.log',
    out_file: '$LOG_DIR/out.log',
    time: true,
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', 'logs', '.git', 'dist'],
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF
    
    chown $USER:$USER "$APP_DIR/ecosystem.config.cjs"
    chmod 600 "$APP_DIR/ecosystem.config.cjs"
    
    print_success "PM2 configuration created"
}

# Function to build application
build_application() {
    print_status "Installing dependencies and building application..."
    
    cd $APP_DIR
    
    # Ensure all build directories exist and are empty
    mkdir -p dist/public
    rm -rf dist/*
    
    # Install all dependencies (including dev dependencies)
    sudo -u $USER npm install
    
    # Create necessary directories for static files
    mkdir -p dist/public
    
    # Build the application
    sudo -u $USER npm run build
    
    # Verify build output
    if [ ! -f "dist/index.js" ]; then
        print_error "Build failed: dist/index.js not found"
        exit 1
    fi
    
    # Run migrations
    sudo -u $USER npm run db:migrate
    
    # Remove dev dependencies for production
    sudo -u $USER npm prune --production
    
    print_success "Application built successfully"
}

# Function to configure Nginx
configure_nginx() {
    print_status "Configuring Nginx..."
    
    cat > $NGINX_CONF << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Main application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Static files with caching
    location /assets {
        alias $APP_DIR/dist/public/assets;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Security - deny access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    location ~ ^/(package\.json|package-lock\.json|\.env|ecosystem\.config\.js)$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF
    
    # Enable the site
    ln -sf $NGINX_CONF $NGINX_ENABLED
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    nginx -t
    
    print_success "Nginx configured"
}

# Function to start services
start_services() {
    print_status "Starting services..."
    
    # Stop any existing PM2 processes
    if pm2 list | grep -q "$SERVICE_NAME"; then
        sudo -u $USER pm2 delete $SERVICE_NAME
    fi
    
    # Start the application with PM2
    cd $APP_DIR
    sudo -u $USER pm2 start ecosystem.config.cjs --env production
    
    # Save PM2 process list
    sudo -u $USER pm2 save
    
    # Setup PM2 startup script
    sudo -u $USER pm2 startup systemd -u $USER --hp $APP_DIR
    
    # Restart Nginx
    systemctl restart nginx
    
    print_success "Services started"
}

# Function to run health checks
run_health_checks() {
    print_status "Running health checks..."
    
    # Wait for services to start
    sleep 5
    
    # Check if PostgreSQL is running and accessible
    if ! sudo -u postgres psql -c "\l" | grep -q "collegesafe_db"; then
        print_error "PostgreSQL database 'collegesafe_db' not found"
        return 1
    fi
    
    # Check if PM2 process is running
    if ! pm2 list | grep -q "$SERVICE_NAME.*online"; then
        print_error "PM2 process not running"
        return 1
    fi
    
    # Check if Nginx is running
    if ! systemctl is-active --quiet nginx; then
        print_error "Nginx not running"
        return 1
    fi
    
    # Check if application responds
    if ! curl -s http://localhost:3000/health > /dev/null; then
        print_warning "Application health check failed - might need more time to start"
    fi
    
    print_success "Health checks completed"
}

# Main deployment function
main() {
    check_root
    update_system
    install_nodejs
    install_postgresql
    install_nginx
    install_pm2
    create_app_user
    create_app_directory
    setup_database
    deploy_application
    create_env_file
    create_pm2_config
    build_application
    configure_nginx
    setup_log_rotation
    configure_firewall
    start_services
    run_health_checks
    display_summary
}

# Run main function
main
