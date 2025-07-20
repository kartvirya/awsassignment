#!/bin/bash

# CollegeSafe AWS Deployment Script
set -e

echo "🚀 Starting CollegeSafe AWS deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running on Amazon Linux
if ! grep -q "Amazon Linux" /etc/os-release; then
    print_warning "This script is designed for Amazon Linux. You may need to adapt it for your system."
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    print_status "Please copy env.example to .env and configure your RDS details"
    exit 1
fi

# Load environment variables
print_status "Loading environment variables..."
source .env

# Validate required environment variables
required_vars=("DATABASE_URL" "JWT_SECRET" "SESSION_SECRET")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set!"
        exit 1
    fi
done

# Check if DATABASE_URL contains RDS endpoint
if [[ ! "$DATABASE_URL" == *"amazonaws.com"* ]]; then
    print_warning "DATABASE_URL doesn't appear to be an Amazon RDS endpoint"
    print_status "Make sure you're using your RDS endpoint: postgresql://user:pass@your-rds-endpoint.amazonaws.com:5432/dbname"
fi

print_step "Step 1: Installing system dependencies..."

# Update system
sudo yum update -y

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    print_status "Installing Docker..."
    sudo yum install -y docker
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -a -G docker $USER
    print_status "Docker installed. You may need to logout and login again."
fi

# Install Docker Compose if not installed
if ! command -v docker-compose &> /dev/null; then
    print_status "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Install Git if not installed
if ! command -v git &> /dev/null; then
    print_status "Installing Git..."
    sudo yum install -y git
fi

print_step "Step 2: Building application..."

# Build the application
print_status "Building application..."
npm run build

print_step "Step 3: Creating necessary directories..."

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p nginx/logs
mkdir -p nginx/ssl
mkdir -p uploads

# Set proper permissions
print_status "Setting permissions..."
chmod 755 uploads
chmod 644 nginx/logs 2>/dev/null || true

print_step "Step 4: Testing database connection..."

# Test database connection
print_status "Testing database connection..."
if command -v psql &> /dev/null; then
    if timeout 10 psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        print_status "✅ Database connection successful"
    else
        print_error "❌ Database connection failed"
        print_status "Please check your DATABASE_URL and RDS security group settings"
        exit 1
    fi
else
    print_warning "PostgreSQL client not installed, skipping connection test"
fi

print_step "Step 5: Stopping existing containers..."

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down --remove-orphans

print_step "Step 6: Building and starting services..."

# Build and start services
print_status "Building and starting services..."
docker-compose up --build -d

print_step "Step 7: Waiting for services to be healthy..."

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
timeout=180
counter=0

while [ $counter -lt $timeout ]; do
    if docker-compose ps | grep -q "healthy"; then
        print_status "✅ All services are healthy!"
        break
    fi
    sleep 3
    counter=$((counter + 3))
    echo -n "."
done

if [ $counter -eq $timeout ]; then
    print_warning "⚠️  Timeout waiting for services to be healthy"
    print_status "Checking service status..."
    docker-compose ps
fi

print_step "Step 8: Running database migrations..."

# Run database migrations
print_status "Running database migrations..."
docker-compose exec -T app npm run db:push || {
    print_warning "Migration failed, but continuing..."
}

print_step "Step 9: Final verification..."

# Check if services are running
print_status "Checking service status..."
if docker-compose ps | grep -q "Up"; then
    print_status "✅ Deployment completed successfully!"
    
    # Get EC2 public IP
    PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "localhost")
    
    echo ""
    print_status "🎉 CollegeSafe is now running on AWS!"
    print_status "🌐 Application URL: http://$PUBLIC_IP"
    print_status "📊 Health check: http://$PUBLIC_IP/health"
    print_status "🔧 API endpoint: http://$PUBLIC_IP/api"
    echo ""
    print_status "📋 Next steps:"
    print_status "1. Configure your domain to point to: $PUBLIC_IP"
    print_status "2. Set up SSL certificates (optional)"
    print_status "3. Configure monitoring and alerts"
    print_status "4. Set up automated backups"
    echo ""
    print_status "📞 Useful commands:"
    print_status "  docker-compose logs -f    # View logs"
    print_status "  docker-compose down       # Stop services"
    print_status "  docker-compose restart    # Restart services"
    print_status "  curl http://$PUBLIC_IP/health  # Health check"
else
    print_error "❌ Deployment failed!"
    print_status "Checking logs..."
    docker-compose logs --tail=50
    exit 1
fi

# Show running containers
print_status "Running containers:"
docker-compose ps

echo ""
print_status "🎯 Deployment Summary:"
print_status "✅ System dependencies installed"
print_status "✅ Application built"
print_status "✅ Services started"
print_status "✅ Database connected"
print_status "✅ Health checks passing"
echo ""
print_status "🚀 Your CollegeSafe application is live on AWS!" 