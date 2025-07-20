#!/bin/bash

# CollegeSafe Application Startup Script
# This script starts the entire application: Database, Backend, and Frontend

set -e

echo "🚀 Starting CollegeSafe Application..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if PostgreSQL is running
check_postgres() {
    print_status "Checking PostgreSQL..."
    
    if pg_isready -q; then
        print_success "PostgreSQL is running"
        return 0
    else
        print_warning "PostgreSQL is not running. Attempting to start..."
        
        # Try to start PostgreSQL
        if command -v brew &> /dev/null; then
            # macOS with Homebrew
            brew services start postgresql
            sleep 3
        elif command -v systemctl &> /dev/null; then
            # Linux with systemctl
            sudo systemctl start postgresql
            sleep 3
        else
            print_error "Could not start PostgreSQL automatically. Please start it manually."
            return 1
        fi
        
        # Check again
        if pg_isready -q; then
            print_success "PostgreSQL started successfully"
            return 0
        else
            print_error "Failed to start PostgreSQL"
            return 1
        fi
    fi
}

# Create database if it doesn't exist
setup_database() {
    print_status "Setting up database..."
    
    # Get current user
    DB_USER=$(whoami)
    DB_NAME="collegesafe"
    
    # Check if database exists
    if psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
        print_success "Database '$DB_NAME' already exists"
    else
        print_status "Creating database '$DB_NAME'..."
        createdb $DB_NAME
        print_success "Database '$DB_NAME' created successfully"
    fi
    
    # Set DATABASE_URL environment variable
    export DATABASE_URL="postgresql://$DB_USER@localhost:5432/$DB_NAME"
    print_success "Database URL set: $DATABASE_URL"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    if npm run db:push; then
        print_success "Database migrations completed"
    else
        print_error "Database migrations failed"
        exit 1
    fi
}

# Check if ports are available
check_ports() {
    print_status "Checking port availability..."
    
    # Check port 3001 (backend)
    if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
        print_warning "Port 3001 is already in use. Stopping existing process..."
        lsof -ti:3001 | xargs kill -9
        sleep 2
    fi
    
    print_success "Ports are available"
}

# Start the application
start_application() {
    print_status "Starting CollegeSafe application..."
    
    # Set environment variables
    export NODE_ENV=development
    export PORT=3001
    export SESSION_SECRET="dev-session-secret-key"
    
    print_status "Environment variables set:"
    echo "  NODE_ENV: $NODE_ENV"
    echo "  PORT: $PORT"
    echo "  DATABASE_URL: $DATABASE_URL"
    
    # Start the application
    print_status "Starting development server..."
    print_success "Application will be available at: http://localhost:3001"
    print_status "Press Ctrl+C to stop the application"
    
    # Start the application
    npm run dev
}

# Main execution
main() {
    echo "=========================================="
    echo "🏫 CollegeSafe Application Startup"
    echo "=========================================="
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "Please run this script from the CollegeSafe project directory"
        exit 1
    fi
    
    # Check dependencies
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        npm install
    fi
    
    # Check PostgreSQL
    if ! check_postgres; then
        print_error "PostgreSQL setup failed. Please install and start PostgreSQL manually."
        exit 1
    fi
    
    # Setup database
    setup_database
    
    # Run migrations
    run_migrations
    
    # Check ports
    check_ports
    
    # Start application
    start_application
}

# Handle script interruption
trap 'echo -e "\n${YELLOW}Shutting down CollegeSafe...${NC}"; exit 0' INT

# Run main function
main 