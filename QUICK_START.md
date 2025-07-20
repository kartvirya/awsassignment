# 🚀 Quick Start - Single Command

Run your entire CollegeSafe application (frontend, backend, and database) with just one command!

## 🎯 **Single Command Options**

### **Option 1: Quick Start (Recommended)**
```bash
npm run quick:start
```

### **Option 2: Full Setup Script**
```bash
npm run start:all
```

### **Option 3: Manual Command**
```bash
brew services start postgresql && createdb collegesafe 2>/dev/null || true && npm run db:push && npm run dev
```

## ✅ **What These Commands Do**

1. **Start PostgreSQL** database service
2. **Create database** if it doesn't exist
3. **Run migrations** to set up tables
4. **Start the application** (frontend + backend)

## 🌐 **Access Your Application**

Once running, access your application at:
- **Main App**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 🛑 **Stop the Application**

Press `Ctrl + C` in the terminal to stop the application.

## 🔧 **Prerequisites**

Make sure you have:
- ✅ Node.js 18+ installed
- ✅ PostgreSQL installed
- ✅ All dependencies installed (`npm install`)

## 🚨 **Troubleshooting**

### If PostgreSQL is not installed:
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
```

### If you get permission errors:
```bash
# Make sure the script is executable
chmod +x start-app.sh
```

### If port 3001 is already in use:
```bash
# Kill the process using port 3001
lsof -ti:3001 | xargs kill -9
```

---

🎉 **That's it! Your CollegeSafe application is now running with a single command!** 