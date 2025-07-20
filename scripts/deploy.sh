#!/bin/bash

# CollegeSafe Deployment Script
set -e

echo "🚀 Starting CollegeSafe deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    print_status "Please copy env.example to .env and configure your environment variables"
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

# Build the application
print_status "Building application..."
npm run build

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p nginx/logs
mkdir -p nginx/ssl
mkdir -p uploads

# Set proper permissions
print_status "Setting permissions..."
chmod 755 uploads
chmod 644 nginx/logs 2>/dev/null || true

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down --remove-orphans

# Build and start services
print_status "Building and starting services..."
docker-compose up --build -d

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
timeout=120
counter=0

while [ $counter -lt $timeout ]; do
    if docker-compose ps | grep -q "healthy"; then
        print_status "All services are healthy!"
        break
    fi
    sleep 2
    counter=$((counter + 2))
    echo -n "."
done

if [ $counter -eq $timeout ]; then
    print_warning "Timeout waiting for services to be healthy"
    print_status "Checking service status..."
    docker-compose ps
fi

# Check if services are running
print_status "Checking service status..."
if docker-compose ps | grep -q "Up"; then
    print_status "✅ Deployment completed successfully!"
    print_status "🌐 Application is available at: http://localhost"
    print_status "📊 Health check: http://localhost/health"
    print_status "🔧 API endpoint: http://localhost/api"
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
print_status "🎉 CollegeSafe is now running!"
print_status "Use 'docker-compose logs -f' to view logs"
print_status "Use 'docker-compose down' to stop the application" 