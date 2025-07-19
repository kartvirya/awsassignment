#!/bin/bash

# Simple Step-by-Step Deployment
set -e

# Configuration
EC2_IP="13.51.198.11"
KEY_FILE="$HOME/Downloads/bikash.pem"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE} Simple Deployment Script${NC}"
echo -e "${BLUE}================================${NC}"

echo -e "${BLUE}📍 EC2 IP:${NC} $EC2_IP"
echo -e "${BLUE}🔑 Key File:${NC} $KEY_FILE"
echo ""

# Test connection
echo -e "${BLUE}[INFO]${NC} Testing EC2 connection..."
if ssh -i "$KEY_FILE" -o ConnectTimeout=10 -o StrictHostKeyChecking=no ubuntu@"$EC2_IP" "echo 'Connection successful'" 2>/dev/null; then
    echo -e "${GREEN}[SUCCESS]${NC} EC2 connection successful"
else
    echo -e "${YELLOW}[ERROR]${NC} Cannot connect to EC2"
    exit 1
fi

# Create deployment package
echo -e "${BLUE}[INFO]${NC} Creating deployment package..."
DEPLOY_DIR="deploy-package"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Copy essential files
echo -e "${BLUE}[INFO]${NC} Copying application files..."
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

# Create step scripts
echo -e "${BLUE}[INFO]${NC} Creating deployment scripts..."

# Step 2: System setup
cat > "$DEPLOY_DIR/step2-system.sh" << 'EOF'
#!/bin/bash
echo "Step 2: Installing system dependencies..."
sudo apt update
sudo apt install -y nodejs npm postgresql postgresql-contrib nginx build-essential python3
sudo npm install -g pm2
echo "✅ System dependencies installed"
EOF

# Step 3: Database setup
cat > "$DEPLOY_DIR/step3-database.sh" << 'EOF'
#!/bin/bash
echo "Step 3: Setting up database..."
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo -u postgres psql -c "CREATE DATABASE collegesafe_db;"
sudo -u postgres psql -c "CREATE USER collegesafe WITH PASSWORD 'collegesafe123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE collegesafe_db TO collegesafe;"
sudo -u postgres psql -c "ALTER USER collegesafe CREATEDB;"
echo "✅ Database setup complete"
EOF

# Step 4: Install dependencies
cat > "$DEPLOY_DIR/step4-deps.sh" << 'EOF'
#!/bin/bash
echo "Step 4: Installing dependencies..."
npm config set registry https://registry.npmjs.org/
npm cache clean --force
npm install --no-audit --no-fund --silent || npm install --production --no-audit --no-fund --silent
echo "✅ Dependencies installed"
EOF

# Step 5: Build app
cat > "$DEPLOY_DIR/step5-build.sh" << 'EOF'
#!/bin/bash
echo "Step 5: Building application..."
cat > .env << ENVEOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://collegesafe:collegesafe123@localhost:5432/collegesafe_db
SESSION_SECRET=$(openssl rand -base64 32)
COOKIE_SECRET=$(openssl rand -base64 32)
CSRF_SECRET=$(openssl rand -base64 32)
ENVEOF
npm run build
echo "✅ Application built"
EOF

# Step 6: Setup services
cat > "$DEPLOY_DIR/step6-services.sh" << 'EOF'
#!/bin/bash
echo "Step 6: Setting up services..."
cat > ecosystem.config.js << PM2EOF
module.exports = {
  apps: [{
    name: 'collegesafe',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: { NODE_ENV: 'production', PORT: 3000 },
    max_memory_restart: '500M',
    autorestart: true
  }]
};
PM2EOF

sudo tee /etc/nginx/sites-available/collegesafe > /dev/null << NGINXEOF
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
    }
}
NGINXEOF

sudo ln -sf /etc/nginx/sites-available/collegesafe /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
echo "✅ Services configured"
EOF

# Step 7: Start app
cat > "$DEPLOY_DIR/step7-start.sh" << 'EOF'
#!/bin/bash
echo "Step 7: Starting application..."
npm run db:migrate || echo "Migration failed, but continuing..."
npm run db:create-default-user || echo "User creation failed, but continuing..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup
echo "✅ Application started!"
echo "Check status: pm2 status"
echo "View logs: pm2 logs collegesafe"
EOF

# Make scripts executable
chmod +x "$DEPLOY_DIR"/*.sh

# Create upload script
cat > upload-to-ec2.sh << EOF
#!/bin/bash
echo "Uploading deployment package to EC2..."
scp -i "$KEY_FILE" -r "$DEPLOY_DIR" ubuntu@"$EC2_IP":/home/ubuntu/
echo "✅ Upload complete!"
echo ""
echo "Next steps:"
echo "1. SSH: ssh -i $KEY_FILE ubuntu@$EC2_IP"
echo "2. cd deploy-package"
echo "3. sudo ./step2-system.sh"
echo "4. sudo ./step3-database.sh"
echo "5. ./step4-deps.sh"
echo "6. ./step5-build.sh"
echo "7. sudo ./step6-services.sh"
echo "8. ./step7-start.sh"
EOF

chmod +x upload-to-ec2.sh

echo -e "${GREEN}[SUCCESS]${NC} Deployment package created!"
echo ""
echo -e "${BLUE}📦 Package:${NC} $DEPLOY_DIR"
echo -e "${BLUE}📤 Upload script:${NC} upload-to-ec2.sh"
echo ""
echo -e "${YELLOW}Next: Run ./upload-to-ec2.sh to upload to EC2${NC}" 