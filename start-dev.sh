#!/bin/bash

# CollegeSafe Development Server Startup Script
# This script sets up the environment and starts the development server

echo "🚀 Starting CollegeSafe Development Server..."

# Set environment variables
export DATABASE_URL="postgresql://collegesafe:collegesafe123@localhost:5432/collegesafe_db"
export NODE_ENV="development"
export PORT="3000"
export SESSION_SECRET="your-super-secret-session-key-change-this-in-production"

# Check if database is accessible
echo "🔍 Checking database connection..."
npm run db:health

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
    echo "🌐 Starting server on http://localhost:$PORT"
    echo "📊 Health check: http://localhost:$PORT/health"
    echo "🔒 Admin login: dev@example.com / password123"
    echo "👩‍🎓 Student login: student@example.com / password123"
    echo "👩‍⚕️ Counsellor login: counsellor@example.com / password123"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    # Start the development server
    npm run dev
else
    echo "❌ Database connection failed. Please check PostgreSQL is running."
    echo "💡 Start PostgreSQL with: brew services start postgresql@15"
    exit 1
fi
