# 🏠 Local Development Guide

This guide shows you how to run CollegeSafe locally for development.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database running locally
- Git (for cloning the repository)

### 1. Setup Database
```bash
# Start PostgreSQL (if not running)
brew services start postgresql  # macOS
# or
sudo systemctl start postgresql  # Linux

# Create database
createdb collegesafe
```

### 2. Configure Environment
```bash
# Copy environment template
cp env.example .env

# Edit .env with your local database details
nano .env
```

**Required .env configuration:**
```env
# Database Configuration
DATABASE_URL=postgresql://your-username@localhost:5432/collegesafe

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-for-development

# Development Configuration
NODE_ENV=development
PORT=3001
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Database Migrations
```bash
npm run db:push
```

### 5. Start Development Server
```bash
npm run dev
```

### 6. Access Application
- **Frontend**: http://localhost:3001
- **API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

## 🔧 Available Commands

### Development
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run check        # TypeScript type checking
```

### Database
```bash
npm run db:push      # Run database migrations
```

### Docker (Optional)
```bash
npm run docker:build          # Build Docker image
npm run docker:run            # Run single container
npm run docker:compose:up     # Start all services
npm run docker:compose:down   # Stop all services
npm run docker:compose:logs   # View logs
```

### Health & Monitoring
```bash
npm run health       # Health check
```

## 🗄️ Database Setup

### Option 1: Local PostgreSQL
```bash
# Install PostgreSQL
brew install postgresql  # macOS
sudo apt-get install postgresql postgresql-contrib  # Ubuntu

# Start PostgreSQL
brew services start postgresql  # macOS
sudo systemctl start postgresql  # Linux

# Create database
createdb collegesafe

# Create user (optional)
createuser your-username
```

### Option 2: Docker PostgreSQL
```bash
# Run PostgreSQL in Docker
docker run --name collegesafe-db \
  -e POSTGRES_DB=collegesafe \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15

# Update .env
DATABASE_URL=postgresql://postgres:password@localhost:5432/collegesafe
```

### Option 3: Cloud Database
```bash
# Use a cloud database service like:
# - Supabase (free tier available)
# - Railway (free tier available)
# - Neon (free tier available)

# Update .env with your cloud database URL
DATABASE_URL=postgresql://user:pass@host:5432/database
```

## 🔄 Development Workflow

### 1. Start Development
```bash
npm run dev
```

### 2. Make Changes
- Edit files in `client/src/` for frontend changes
- Edit files in `server/` for backend changes
- Changes will automatically reload

### 3. Database Changes
```bash
# After modifying schema in shared/schema.ts
npm run db:push
```

### 4. Test Changes
- Frontend: http://localhost:3001
- API: http://localhost:3001/api/users (example)

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3002 npm run dev
```

### Database Connection Failed
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Test connection
psql postgresql://your-username@localhost:5432/collegesafe

# Check .env file
cat .env | grep DATABASE_URL
```

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run check
```

### Permission Issues
```bash
# Fix file permissions
chmod +x scripts/*.sh
chmod 755 uploads/
```

## 📁 Project Structure

```
collegesafe/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── services/      # API services
├── server/                # Backend Express application
│   ├── routes.ts          # API routes
│   ├── db.ts             # Database configuration
│   └── index.ts          # Server entry point
├── shared/               # Shared code between frontend/backend
│   └── schema.ts         # Database schema
├── nginx/                # Nginx configuration (production)
├── scripts/              # Deployment scripts
├── .env                  # Environment variables
├── package.json          # Dependencies and scripts
└── docker-compose.yml    # Docker orchestration
```

## 🔍 Debugging

### Frontend Debugging
```bash
# Open browser developer tools
# Check Console tab for errors
# Check Network tab for API calls
```

### Backend Debugging
```bash
# Check server logs in terminal
# Add console.log() statements
# Use debugger in VS Code
```

### Database Debugging
```bash
# Connect to database
psql postgresql://your-username@localhost:5432/collegesafe

# Check tables
\dt

# Check data
SELECT * FROM users LIMIT 5;
```

## 🧪 Testing

### Manual Testing
1. **User Registration**: http://localhost:3001/signup
2. **User Login**: http://localhost:3001/login
3. **Dashboard**: After login
4. **API Endpoints**: http://localhost:3001/api/users

### Health Check
```bash
curl http://localhost:3001/health
```

## 📊 Monitoring

### Logs
- **Frontend**: Check browser console
- **Backend**: Check terminal where `npm run dev` is running
- **Database**: Check PostgreSQL logs

### Performance
- **Frontend**: Use browser dev tools Performance tab
- **Backend**: Monitor terminal output for request times
- **Database**: Use `EXPLAIN ANALYZE` for slow queries

## 🔄 Hot Reload

The development server supports hot reload:
- **Frontend**: Changes in `client/src/` auto-reload
- **Backend**: Changes in `server/` auto-restart server
- **Database**: Schema changes require `npm run db:push`

## 🚨 Common Issues

### "Module not found" errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

### "Port 3001 already in use"
```bash
# Find and kill the process
lsof -i :3001
kill -9 <PID>

# Or use different port
PORT=3002 npm run dev
```

## 📞 Support

- **Logs**: Check terminal output
- **Health**: `curl http://localhost:3001/health`
- **Database**: `psql $DATABASE_URL`
- **Process**: `ps aux | grep node`

---

🎉 **Your CollegeSafe application is now running locally!**

Access it at: http://localhost:3001 