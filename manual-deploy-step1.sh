#!/bin/bash

# Manual Deployment Step 1: Prepare and Upload Files
# Run this from your local machine

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

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

print_header "Manual Deployment Step 1: Prepare and Upload Files"

# Configuration - UPDATE THESE VALUES
EC2_IP="13.51.198.11"
KEY_FILE="$HOME/Downloads/bikash.pem"
LOCAL_DIR="$(pwd)"

print_status "Configuration:"
echo -e "   📍 EC2 IP: ${YELLOW}$EC2_IP${NC}"
echo -e "   🔑 Key File: ${YELLOW}$KEY_FILE${NC}"
echo -e "   📁 Local Directory: ${YELLOW}$LOCAL_DIR${NC}"
echo ""

# Check if key file exists
if [ ! -f "$KEY_FILE" ]; then
    print_error "Key file not found: $KEY_FILE"
    echo "Please update the KEY_FILE variable in this script"
    exit 1
fi

# Check if we can connect to EC2
print_status "Testing EC2 connection..."
if ssh -i "$KEY_FILE" -o ConnectTimeout=10 -o StrictHostKeyChecking=no ubuntu@"$EC2_IP" "echo 'Connection successful'" 2>/dev/null; then
    print_success "EC2 connection successful"
else
    print_error "Cannot connect to EC2. Please check:"
    echo "   - EC2 IP address is correct"
    echo "   - Key file path is correct"
    echo "   - EC2 instance is running"
    echo "   - Security group allows SSH (port 22)"
    exit 1
fi

# Create deployment package
print_status "Creating deployment package..."

# Create a clean deployment directory
DEPLOY_DIR="deploy-package"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Copy essential files
print_status "Copying application files..."
cp -r client "$DEPLOY_DIR/"
cp -r server "$DEPLOY_DIR/"
cp -r shared "$DEPLOY_DIR/"
cp -r migrations "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"
cp package-lock.json "$DEPLOY_DIR/"
cp tsconfig.json "$DEPLOY_DIR/"
cp vite.config.ts "$DEPLOY_DIR/"
cp tailwind.config.ts "$DEPLOY_DIR/"
cp postcss.config.js "$DEPLOY_DIR/"
cp drizzle.config.ts "$DEPLOY_DIR/"
cp components.json "$DEPLOY_DIR/"
cp .gitignore "$DEPLOY_DIR/"

# Create deployment scripts
print_status "Creating deployment scripts..."

cat > "$DEPLOY_DIR/step2-setup-system.sh" << 'EOF'
#!/bin/bash
# Step 2: Setup System Dependencies
set -e

print_status() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

print_header() {
    echo -e "\033[0;35m================================\033[0m"
    echo -e "\033[0;35m $1\033[0m"
    echo -e "\033[0;35m================================\033[0m"
}

print_header "Step 2: Setup System Dependencies"

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
print_status "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
print_status "Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# Install PM2
print_status "Installing PM2..."
sudo npm install -g pm2

# Install nginx
print_status "Installing nginx..."
sudo apt install -y nginx

# Install build tools
print_status "Installing build tools..."
sudo apt install -y build-essential python3

print_success "System dependencies installed"
EOF

cat > "$DEPLOY_DIR/step3-setup-database.sh" << 'EOF'
#!/bin/bash
# Step 3: Setup Database
set -e

print_status() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

print_header() {
    echo -e "\033[0;35m================================\033[0m"
    echo -e "\033[0;35m $1\033[0m"
    echo -e "\033[0;35m================================\033[0m"
}

print_header "Step 3: Setup Database"

# Start PostgreSQL
print_status "Starting PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
print_status "Creating database and user..."
sudo -u postgres psql -c "CREATE DATABASE collegesafe_db;"
sudo -u postgres psql -c "CREATE USER collegesafe WITH PASSWORD 'collegesafe123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE collegesafe_db TO collegesafe;"
sudo -u postgres psql -c "ALTER USER collegesafe CREATEDB;"

print_success "Database setup complete"
EOF

cat > "$DEPLOY_DIR/step4-install-dependencies.sh" << 'EOF'
#!/bin/bash
# Step 4: Install Dependencies
set -e

print_status() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

print_warning() {
    echo -e "\033[1;33m[WARNING]\033[0m $1"
}

print_header() {
    echo -e "\033[0;35m================================\033[0m"
    echo -e "\033[0;35m $1\033[0m"
    echo -e "\033[0;35m================================\033[0m"
}

print_header "Step 4: Install Dependencies"

# Configure npm
print_status "Configuring npm..."
npm config set registry https://registry.npmjs.org/
npm config set fetch-timeout 600000
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000
npm config set fetch-retries 5

# Clear cache
print_status "Clearing npm cache..."
npm cache clean --force

# Install dependencies
print_status "Installing dependencies..."
if npm install --no-audit --no-fund --silent; then
    print_success "Dependencies installed successfully"
else
    print_warning "npm install failed, trying production install..."
    if npm install --production --no-audit --no-fund --silent; then
        print_success "Production dependencies installed"
    else
        print_warning "Installation failed, but continuing..."
    fi
fi
EOF

cat > "$DEPLOY_DIR/step5-build-app.sh" << 'EOF'
#!/bin/bash
# Step 5: Build Application
set -e

print_status() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

print_warning() {
    echo -e "\033[1;33m[WARNING]\033[0m $1"
}

print_header() {
    echo -e "\033[0;35m================================\033[0m"
    echo -e "\033[0;35m $1\033[0m"
    echo -e "\033[0;35m================================\033[0m"
}

print_header "Step 5: Build Application"

# Create environment file
print_status "Creating environment file..."
cat > .env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://collegesafe:collegesafe123@localhost:5432/collegesafe_db
SESSION_SECRET=$(openssl rand -base64 32)
COOKIE_SECRET=$(openssl rand -base64 32)
CSRF_SECRET=$(openssl rand -base64 32)
EOF

# Build application
print_status "Building application..."
if npm run build; then
    print_success "Application built successfully"
else
    print_warning "Build failed, but continuing..."
fi
EOF

cat > "$DEPLOY_DIR/step6-setup-services.sh" << 'EOF'
#!/bin/bash
# Step 6: Setup Services
set -e

print_status() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

print_header() {
    echo -e "\033[0;35m================================\033[0m"
    echo -e "\033[0;35m $1\033[0m"
    echo -e "\033[0;35m================================\033[0m"
}

print_header "Step 6: Setup Services"

# Create PM2 configuration
print_status "Creating PM2 configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'collegesafe',
    script: 'dist/index.js',
    cwd: '/opt/collegesafe',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
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

# Create nginx configuration
print_status "Creating nginx configuration..."
sudo tee /etc/nginx/sites-available/collegesafe > /dev/null << EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/collegesafe /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

print_success "Services configured"
EOF

cat > "$DEPLOY_DIR/step7-start-app.sh" << 'EOF'
#!/bin/bash
# Step 7: Start Application
set -e

print_status() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

print_header() {
    echo -e "\033[0;35m================================\033[0m"
    echo -e "\033[0;35m $1\033[0m"
    echo -e "\033[0;35m================================\033[0m"
}

print_header "Step 7: Start Application"

# Initialize database
print_status "Initializing database..."
npm run db:migrate || echo "Migration failed, but continuing..."
npm run db:create-default-user || echo "User creation failed, but continuing..."

# Start application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup

print_success "Application started!"
print_status "Check status with: pm2 status"
print_status "View logs with: pm2 logs collegesafe"
EOF

# Make scripts executable
chmod +x "$DEPLOY_DIR"/*.sh

# Create upload script
cat > upload-to-ec2.sh << EOF
#!/bin/bash
# Upload deployment package to EC2

print_status() {
    echo -e "\033[0;34m[INFO]\033[0m \$1"
}

print_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m \$1"
}

print_status "Uploading deployment package to EC2..."
scp -i "$KEY_FILE" -r "$DEPLOY_DIR" ubuntu@"$EC2_IP":/home/ubuntu/

print_success "Upload complete!"
echo ""
echo -e "\033[0;35mNext steps:\033[0m"
echo "1. SSH into your EC2: ssh -i $KEY_FILE ubuntu@$EC2_IP"
echo "2. Run: cd deploy-package"
echo "3. Run: sudo ./step2-setup-system.sh"
echo "4. Run: sudo ./step3-setup-database.sh"
echo "5. Run: ./step4-install-dependencies.sh"
echo "6. Run: ./step5-build-app.sh"
echo "7. Run: sudo ./step6-setup-services.sh"
echo "8. Run: ./step7-start-app.sh"
EOF

chmod +x upload-to-ec2.sh

print_success "Deployment package created!"
echo ""
echo -e "${BLUE}📦 Package created in: ${YELLOW}$DEPLOY_DIR${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Update EC2_IP and KEY_FILE variables in this script"
echo "2. Run: ./upload-to-ec2.sh"
echo "3. Follow the step-by-step instructions"
echo ""
echo -e "${PURPLE}🎯 Each step will be executed separately for better control!${NC}" 