#!/bin/bash

# CollegeSafe Production Server Startup Script
echo "🚀 Starting CollegeSafe in Production Mode..."

# Kill any existing processes on port 3000
echo "🔧 Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Load production environment variables
echo "🔧 Loading production environment..."
export DATABASE_URL="postgresql://collegesafe:collegesafe123@localhost:5432/collegesafe_db"
export NODE_ENV="production"
export PORT="3000"
export SESSION_SECRET="prod-secret-key-change-in-real-production-deployment-2024"

# Check database connection
echo "🔍 Checking database connection..."
npm run db:health

if [ $? -ne 0 ]; then
    echo "❌ Database connection failed. Exiting."
    exit 1
fi

echo "✅ Database connection successful"

# Run database migrations
echo "🔄 Running database migrations..."
npm run db:migrate

# Build API-only server
echo "🔨 Building API server..."
npx esbuild server/api-server.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

if [ $? -ne 0 ]; then
    echo "❌ Server build failed. Exiting."
    exit 1
fi

echo "✅ API server built successfully"

# Start the production server
echo "🌐 Starting production API server..."
echo "📊 Health check endpoint: http://localhost:$PORT/health"
echo "🔗 API endpoints: http://localhost:$PORT/api/*"
echo "🏠 Root endpoint: http://localhost:$PORT/"
echo ""
echo "🔐 Login Credentials:"
echo "  Admin: admin@collegesafe.com / admin123"
echo "  Counsellor: counsellor@collegesafe.com / counsellor123"
echo ""
echo "📝 Test the API with:"
echo "  curl http://localhost:$PORT/health"
echo "  curl http://localhost:$PORT/api/analytics/stats"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
node dist/api-server.js
