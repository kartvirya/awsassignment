#!/bin/bash

# CollegeSafe AWS EC2 Deployment Script
# This script automates the deployment process for the CollegeSafe application on AWS EC2
# Author: Development Team
# Version: 1.0

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

# Function to print colored output
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

# Function to check if script is run as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Function to update system packages
update_system() {
    print_status "Updating system packages..."
    apt update && apt upgrade -y
    print_success "System packages updated"
}

# Function to install Node.js
install_nodejs() {
    print_status "Installing Node.js ${NODE_VERSION}..."
    
    # Remove existing Node.js if any
    apt remove -y nodejs npm || true
    
    # Install Node.js using NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt install -y nodejs
    
    # Verify installation
    node_version=$(node --version)
    npm_version=$(npm --version)
    
    print_success "Node.js ${node_version} and npm ${npm_version} installed"
}

# Function to install PostgreSQL
install_postgresql() {
    print_status "Installing PostgreSQL..."
    
    apt install -y postgresql postgresql-contrib
    
    # Start and enable PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
    
    print_success "PostgreSQL installed and started"
}

# Function to install Nginx
install_nginx() {
    print_status "Installing Nginx..."
    
    apt install -y nginx
    
    # Start and enable Nginx
    systemctl start nginx
    systemctl enable nginx
    
    print_success "Nginx installed and started"
}

# Function to install PM2
install_pm2() {
    print_status "Installing PM2..."
    
    npm install -g pm2
    
    print_success "PM2 installed"
}

# Function to create application user
create_app_user() {
    print_status "Creating application user..."
    
    # Create user if it doesn't exist
    if ! id "$USER" &>/dev/null; then
        useradd -r -s /bin/bash -d $APP_DIR $USER
        print_success "User $USER created"
    else
        print_warning "User $USER already exists"
    fi
}

# Function to create application directory
create_app_directory() {
    print_status "Creating application directory..."
    
    mkdir -p $APP_DIR
    mkdir -p $LOG_DIR
    
    # Set ownership
    chown -R $USER:$USER $APP_DIR
    chown -R $USER:$USER $LOG_DIR
    
    print_success "Application directory created at $APP_DIR"
}

# Function to setup database
setup_database() {
    print_status "Setting up database..."
    
    # Create database and user
    sudo -u postgres psql << EOF
CREATE DATABASE IF NOT EXISTS collegesafe_db;
CREATE USER IF NOT EXISTS collegesafe WITH PASSWORD 'collegesafe123';
GRANT ALL PRIVILEGES ON DATABASE collegesafe_db TO collegesafe;
ALTER USER collegesafe CREATEDB;
\q
EOF
    
    print_success "Database setup completed"
}

# Function to clone/update application code
deploy_application() {
    print_status "Deploying application code..."
    
    # Check if we're running from the project directory
    if [[ -f "package.json" ]]; then
        print_status "Copying application files from current directory..."
        SOURCE_DIR="$(pwd)"
    elif [[ -f "/home/ubuntu/awsassignment/package.json" ]]; then
        print_status "Copying application files from /home/ubuntu/awsassignment..."
        SOURCE_DIR="/home/ubuntu/awsassignment"
    else
        print_error "No package.json found. Make sure the project exists in /home/ubuntu/awsassignment or run from project root."
        exit 1
    fi
    
    # Create temporary directory
    temp_dir=$(mktemp -d)
    
    # Copy all files except node_modules and .git
    rsync -av --exclude='node_modules' --exclude='.git' --exclude='dist' "$SOURCE_DIR/" "$temp_dir/"
    
    # Create application directory if it doesn't exist
    mkdir -p "$APP_DIR"
    
    # Move to application directory
    rm -rf "$APP_DIR"/*
    mv "$temp_dir"/* "$APP_DIR/"
    
    # Clean up
    rm -rf "$temp_dir"
    
    # Set ownership
    chown -R $USER:$USER $APP_DIR
    
    print_success "Application code deployed from $SOURCE_DIR"
}

# Function to install dependencies and build
build_application() {
    print_status "Installing dependencies and building application..."
    
    cd $APP_DIR
    
    # Install all dependencies (including dev)
    sudo -u $USER npm install

    # Build the application
    sudo -u $USER npm run build

    # (Optional) Remove devDependencies after build
    sudo -u $USER npm prune --production
    
    print_success "Application built successfully"
}

# Function to create environment file
create_env_file() {
    print_status "Creating environment file..."
    
    cat > "$APP_DIR/.env" << EOF
# Production Environment Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://collegesafe:collegesafe123@localhost:5432/collegesafe_db

# Security
SESSION_SECRET=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)

# Logging
LOG_LEVEL=info
LOG_DIR=$LOG_DIR
EOF
    
    # Set proper permissions
    chown $USER:$USER "$APP_DIR/.env"
    chmod 600 "$APP_DIR/.env"
    
    print_success "Environment file created"
}

# Function to create PM2 ecosystem file
create_pm2_config() {
    print_status "Creating PM2 configuration..."
    
    cat > "$APP_DIR/ecosystem.config.js" << EOF
module.exports = {
  apps: [{
    name: '$SERVICE_NAME',
    script: 'dist/index.js',
    cwd: '$APP_DIR',
    user: '$USER',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '$LOG_DIR/error.log',
    out_file: '$LOG_DIR/out.log',
    log_file: '$LOG_DIR/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'logs', '.git'],
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF
    
    chown $USER:$USER "$APP_DIR/ecosystem.config.js"
    
    print_success "PM2 configuration created"
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
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
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
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
    
    # Static assets with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
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

# Function to setup systemd service
create_systemd_service() {
    print_status "Creating systemd service..."
    
    cat > "/etc/systemd/system/$SERVICE_NAME.service" << EOF
[Unit]
Description=CollegeSafe Application
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=forking
User=$USER
Group=$USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/pm2 start ecosystem.config.js --no-daemon
ExecStop=/usr/bin/pm2 stop ecosystem.config.js
ExecReload=/usr/bin/pm2 reload ecosystem.config.js
Restart=always
RestartSec=10
KillMode=mixed
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable $SERVICE_NAME
    
    print_success "Systemd service created"
}

# Function to setup database migration
run_database_migration() {
    print_status "Running database migration..."
    
    cd $APP_DIR
    
    # Run migrations as app user
    sudo -u $USER npm run db:migrate
    
    print_success "Database migration completed"
}

# Function to start services
start_services() {
    print_status "Starting services..."
    
    # Start the application with PM2
    cd $APP_DIR
    sudo -u $USER pm2 start ecosystem.config.js
    
    # Save PM2 process list
    sudo -u $USER pm2 save
    
    # Setup PM2 startup script
    sudo -u $USER pm2 startup systemd -u $USER --hp $APP_DIR
    
    # Restart Nginx
    systemctl restart nginx
    
    print_success "Services started"
}

# Function to setup log rotation
setup_log_rotation() {
    print_status "Setting up log rotation..."
    
    cat > "/etc/logrotate.d/$SERVICE_NAME" << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        sudo -u $USER pm2 reloadLogs
    endscript
}
EOF
    
    print_success "Log rotation configured"
}

# Function to setup firewall
configure_firewall() {
    print_status "Configuring firewall..."
    
    # Enable UFW if not already enabled
    if ! ufw status | grep -q "Status: active"; then
        ufw --force enable
    fi
    
    # Allow SSH, HTTP, and HTTPS
    ufw allow ssh
    ufw allow http
    ufw allow https
    
    print_success "Firewall configured"
}

# Function to create backup script
create_backup_script() {
    print_status "Creating backup script..."
    
    cat > "/usr/local/bin/backup-collegesafe.sh" << 'EOF'
#!/bin/bash

# CollegeSafe Backup Script
BACKUP_DIR="/var/backups/collegesafe"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/opt/collegesafe"
LOG_DIR="/var/log/collegesafe"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
sudo -u postgres pg_dump collegesafe_db > "$BACKUP_DIR/database_$DATE.sql"

# Backup application files
tar -czf "$BACKUP_DIR/app_files_$DATE.tar.gz" -C $APP_DIR .

# Backup logs
tar -czf "$BACKUP_DIR/logs_$DATE.tar.gz" -C $LOG_DIR .

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
EOF
    
    chmod +x "/usr/local/bin/backup-collegesafe.sh"
    
    # Add to crontab for daily backups
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-collegesafe.sh >> /var/log/collegesafe-backup.log 2>&1") | crontab -
    
    print_success "Backup script created and scheduled"
}

# Function to run health checks
run_health_checks() {
    print_status "Running health checks..."
    
    # Check if application is running
    if sudo -u $USER pm2 list | grep -q "online"; then
        print_success "Application is running"
    else
        print_error "Application is not running"
        return 1
    fi
    
    # Check if Nginx is running
    if systemctl is-active --quiet nginx; then
        print_success "Nginx is running"
    else
        print_error "Nginx is not running"
        return 1
    fi
    
    # Check if database is accessible
    if sudo -u postgres psql -c "SELECT 1;" collegesafe_db > /dev/null 2>&1; then
        print_success "Database is accessible"
    else
        print_error "Database is not accessible"
        return 1
    fi
    
    # Check if application responds to HTTP requests
    sleep 5  # Wait for application to start
    if curl -f -s http://localhost/health > /dev/null; then
        print_success "Application health check passed"
    else
        print_warning "Application health check failed - this might be normal during first deployment"
    fi
    
    print_success "Health checks completed"
}

# Function to display deployment summary
display_summary() {
    print_success "=== DEPLOYMENT COMPLETED SUCCESSFULLY ==="
    echo
    echo "Application Details:"
    echo "  - Name: $APP_NAME"
    echo "  - Directory: $APP_DIR"
    echo "  - User: $USER"
    echo "  - Service: $SERVICE_NAME"
    echo
    echo "Access URLs:"
    echo "  - Application: http://$(curl -s http://checkip.amazonaws.com || echo 'YOUR_EC2_IP')"
    echo "  - Health Check: http://$(curl -s http://checkip.amazonaws.com || echo 'YOUR_EC2_IP')/health"
    echo
    echo "Useful Commands:"
    echo "  - Check status: sudo -u $USER pm2 status"
    echo "  - View logs: sudo -u $USER pm2 logs"
    echo "  - Restart app: sudo -u $USER pm2 restart $SERVICE_NAME"
    echo "  - Nginx status: sudo systemctl status nginx"
    echo "  - App service: sudo systemctl status $SERVICE_NAME"
    echo
    echo "Log Files:"
    echo "  - Application: $LOG_DIR/"
    echo "  - Nginx: /var/log/nginx/"
    echo "  - System: /var/log/syslog"
    echo
    echo "Backup Script: /usr/local/bin/backup-collegesafe.sh"
    echo
    print_success "=== DEPLOYMENT SUMMARY END ==="
}

# Main deployment function
main() {
    print_status "Starting CollegeSafe deployment on AWS EC2..."
    
    # Pre-flight checks
    check_root
    
    # System setup
    update_system
    install_nodejs
    install_postgresql
    install_nginx
    install_pm2
    
    # Application setup
    create_app_user
    create_app_directory
    setup_database
    deploy_application
    build_application
    create_env_file
    create_pm2_config
    
    # Service configuration
    configure_nginx
    create_systemd_service
    
    # Database setup
    run_database_migration
    
    # Start services
    start_services
    
    # Additional setup
    setup_log_rotation
    configure_firewall
    create_backup_script
    
    # Verification
    run_health_checks
    
    # Summary
    display_summary
    
    print_success "Deployment completed successfully!"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "CollegeSafe AWS EC2 Deployment Script"
        echo
        echo "Usage: $0 [OPTIONS]"
        echo
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --health       Run health checks only"
        echo "  --restart      Restart application services"
        echo "  --backup       Run backup manually"
        echo
        echo "Default: Run full deployment"
        exit 0
        ;;
    --health)
        run_health_checks
        exit 0
        ;;
    --restart)
        print_status "Restarting services..."
        sudo -u $USER pm2 restart $SERVICE_NAME
        systemctl restart nginx
        print_success "Services restarted"
        exit 0
        ;;
    --backup)
        /usr/local/bin/backup-collegesafe.sh
        exit 0
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac
