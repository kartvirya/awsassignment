#!/bin/bash

# Simple CollegeSafe Deployment Script for Ubuntu User
# Run this from /home/ubuntu/awsassignment directory

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    print_error "This script must be run as root (use sudo)"
    exit 1
fi

# Check if we're in the right directory
if [[ ! -f "/home/ubuntu/awsassignment/package.json" ]]; then
    print_error "package.json not found in /home/ubuntu/awsassignment"
    print_error "Please make sure you're in the correct directory"
    exit 1
fi

print_status "Starting CollegeSafe deployment..."

# Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18
print_status "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PostgreSQL
print_status "Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Install Nginx
print_status "Installing Nginx..."
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# Install PM2
print_status "Installing PM2..."
npm install -g pm2

# Create collegesafe user
print_status "Creating collegesafe user..."
if ! id "collegesafe" &>/dev/null; then
    useradd -r -s /bin/bash -d /opt/collegesafe collegesafe
fi

# Create directories
print_status "Creating directories..."
mkdir -p /opt/collegesafe
mkdir -p /var/log/collegesafe

# Copy application files
print_status "Copying application files..."
cp -r /home/ubuntu/awsassignment/* /opt/collegesafe/
chown -R collegesafe:collegesafe /opt/collegesafe
chown -R collegesafe:collegesafe /var/log/collegesafe

# Setup database
print_status "Setting up database..."
sudo -u postgres psql <<EOF
CREATE DATABASE collegesafe_db;
CREATE USER collegesafe WITH PASSWORD 'collegesafe123';
GRANT ALL PRIVILEGES ON DATABASE collegesafe_db TO collegesafe;
ALTER USER collegesafe CREATEDB;
\q
EOF

# Create environment file
print_status "Creating environment file..."
cat > /opt/collegesafe/.env <<EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://collegesafe:collegesafe123@localhost:5432/collegesafe_db
SESSION_SECRET=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)
EOF

chown collegesafe:collegesafe /opt/collegesafe/.env
chmod 600 /opt/collegesafe/.env

# Install dependencies and build
print_status "Installing dependencies and building..."
cd /opt/collegesafe
sudo -u collegesafe npm install
sudo -u collegesafe npm run build

# Run database migrations
print_status "Running database migrations..."
sudo -u collegesafe npm run db:migrate

# Create PM2 config
print_status "Creating PM2 configuration..."
cat > /opt/collegesafe/ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'collegesafe',
    script: 'dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/collegesafe/error.log',
    out_file: '/var/log/collegesafe/out.log',
    log_file: '/var/log/collegesafe/combined.log',
    time: true
  }]
};
EOF

chown collegesafe:collegesafe /opt/collegesafe/ecosystem.config.js

# Configure Nginx
print_status "Configuring Nginx..."
cat > /etc/nginx/sites-available/collegesafe <<'EOF'
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/collegesafe /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t

# Start services
print_status "Starting services..."
cd /opt/collegesafe
sudo -u collegesafe pm2 start ecosystem.config.js
sudo -u collegesafe pm2 save
sudo -u collegesafe pm2 startup systemd -u collegesafe --hp /opt/collegesafe

# Restart Nginx
systemctl restart nginx

# Configure firewall
print_status "Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow http
ufw allow https

print_success "Deployment completed!"
echo ""
echo "Your application is now running at:"
echo "  - Application: http://$(curl -s http://checkip.amazonaws.com || hostname -I | awk '{print $1}')"
echo "  - Health Check: http://$(curl -s http://checkip.amazonaws.com || hostname -I | awk '{print $1}')/health"
echo ""
echo "Useful commands:"
echo "  - Check status: sudo -u collegesafe pm2 status"
echo "  - View logs: sudo -u collegesafe pm2 logs"
echo "  - Restart: sudo -u collegesafe pm2 restart collegesafe"
echo ""
echo "Default login credentials:"
echo "  - Admin: admin@example.com / password123"
echo "  - Student: student@example.com / password123"
echo "  - Counsellor: counsellor@example.com / password123"
