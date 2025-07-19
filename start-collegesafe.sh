#!/bin/bash

# CollegeSafe Startup Script - Production Ready
# This script sets up the environment and starts CollegeSafe successfully

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE} $1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Configuration
ENVIRONMENT=${NODE_ENV:-development}
PORT=${PORT:-3000}
DB_URL=${DATABASE_URL:-postgresql://collegesafe:collegesafe123@localhost:5432/collegesafe_db}

print_header "CollegeSafe Startup - $ENVIRONMENT Mode"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the collegesafe directory"
    exit 1
fi

# 1. Environment Setup
print_status "🔧 Setting up environment..."
export DATABASE_URL="$DB_URL"
export NODE_ENV="$ENVIRONMENT"
export PORT="$PORT"
export SESSION_SECRET="collegesafe-session-secret-$(date +%s)"

# Create .env file with correct settings
cat > .env << EOF
NODE_ENV=$ENVIRONMENT
PORT=$PORT
DATABASE_URL=$DB_URL
SESSION_SECRET=$SESSION_SECRET
CORS_ORIGIN=*
CORS_CREDENTIALS=true
EOF

print_success "✅ Environment configured"

# 2. Clean up existing processes
print_status "🧹 Cleaning up existing processes..."
lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
sleep 2

# 3. Install dependencies if needed
if [ ! -d "node_modules" ] || [ ! -f "node_modules/cookie-parser/package.json" ]; then
    print_status "📦 Installing dependencies..."
    npm install
    npm install cookie-parser @types/cookie-parser
    print_success "✅ Dependencies installed"
fi

# 4. Check database
print_status "🗄️  Checking database connection..."
if npm run db:health > /dev/null 2>&1; then
    print_success "✅ Database connection successful"
else
    print_warning "⚠️  Database connection failed. Setting up database..."
    
    # Check if PostgreSQL is running
    if ! pgrep -f postgres > /dev/null; then
        print_error "❌ PostgreSQL is not running. Please start PostgreSQL:"
        echo "   # On macOS: brew services start postgresql"
        echo "   # On Ubuntu: sudo systemctl start postgresql"
        exit 1
    fi
    
    # Create user and database
    print_status "🔧 Setting up database user and database..."
    createuser -s collegesafe 2>/dev/null || echo "User might already exist"
    createdb collegesafe_db -O collegesafe 2>/dev/null || echo "Database might already exist"
    psql postgres -c "ALTER USER collegesafe PASSWORD 'collegesafe123';" 2>/dev/null || true
    
    # Test connection again
    if npm run db:health > /dev/null 2>&1; then
        print_success "✅ Database setup completed"
    else
        print_error "❌ Database setup failed"
        exit 1
    fi
fi

# 5. Run migrations
print_status "🔄 Running database migrations..."
npm run db:migrate

# 6. Create default users
print_status "👥 Creating default users..."
npm run db:create-default-user || print_warning "Default users might already exist"

# 7. Build application
print_status "🔨 Building application..."
npm run build

# 8. Health check before starting
print_status "🩺 Final pre-start checks..."
if [ ! -f "dist/index.js" ]; then
    print_error "❌ Build output not found"
    exit 1
fi

print_success "✅ All pre-start checks passed"

# 9. Start the server
print_header "Starting CollegeSafe Server"

echo -e "${GREEN}🚀 Starting CollegeSafe in $ENVIRONMENT mode...${NC}"
echo -e "${BLUE}📊 Health check: http://localhost:$PORT/health${NC}"
echo -e "${BLUE}🔗 API endpoints: http://localhost:$PORT/api/*${NC}"
echo -e "${BLUE}🌐 Root: http://localhost:$PORT/${NC}"
echo ""
echo -e "${YELLOW}🔐 Test Login Credentials:${NC}"
echo -e "   📧 Admin: dev@example.com / dev123"
echo -e "   👩‍🎓 Student: student@example.com / student123"
echo -e "   👩‍⚕️ Counsellor: counsellor@example.com / counsellor123"
echo ""
echo -e "${BLUE}🧪 Quick Tests:${NC}"
echo -e "   curl http://localhost:$PORT/health"
echo -e "   curl http://localhost:$PORT/api/analytics/stats"
echo -e "   curl -X POST -H 'Content-Type: application/json' -d '{\"email\":\"dev@example.com\",\"password\":\"dev123\"}' http://localhost:$PORT/api/login"
echo ""
echo -e "${PURPLE}Press Ctrl+C to stop the server${NC}"
echo ""

# Set up signal handlers for graceful shutdown
trap 'echo -e "\n${YELLOW}🛑 Shutting down CollegeSafe...${NC}"; exit 0' INT TERM

# Start the server
node dist/index.js 