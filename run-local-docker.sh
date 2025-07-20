#!/bin/bash

echo "🚀 Starting CollegeSafe with Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.local.yml down

# Build and start the application
echo "🔨 Building and starting CollegeSafe..."
docker-compose -f docker-compose.local.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker-compose -f docker-compose.local.yml ps

# Test the application
echo "🧪 Testing application..."
sleep 10
curl -f http://localhost:3001/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Application is running successfully!"
    echo ""
    echo "🌐 Access your application at:"
    echo "   Main URL: http://localhost:3001"
    echo "   Student Dashboard: http://localhost:3001/student-dashboard"
    echo "   Counsellor Dashboard: http://localhost:3001/counsellor-dashboard"
    echo "   Admin Dashboard: http://localhost:3001/admin-dashboard"
    echo ""
    echo "📊 Database: PostgreSQL on localhost:5432"
    echo "   Database: collegesafe"
    echo "   Username: postgres"
    echo "   Password: password"
    echo ""
    echo "🔴 Redis: localhost:6379"
    echo ""
    echo "📝 To view logs: docker-compose -f docker-compose.local.yml logs -f"
    echo "🛑 To stop: docker-compose -f docker-compose.local.yml down"
else
    echo "❌ Application failed to start. Check logs with:"
    echo "   docker-compose -f docker-compose.local.yml logs"
fi 