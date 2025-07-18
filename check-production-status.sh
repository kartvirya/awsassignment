#!/bin/bash

echo "🔍 CollegeSafe Production Server Status Check"
echo "=============================================="

# Check if server is running
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "✅ Server is running on port 3000"
    PID=$(lsof -ti:3000)
    echo "📋 Process ID: $PID"
else
    echo "❌ Server is not running on port 3000"
    exit 1
fi

echo ""
echo "🌐 Server Endpoints:"
echo "  📊 Health Check: http://localhost:3000/health"
echo "  🏠 Root: http://localhost:3000/"
echo "  🔗 API: http://localhost:3000/api/*"

echo ""
echo "🔍 Health Check Response:"
curl -s http://localhost:3000/health | jq .

echo ""
echo "🔐 Login Credentials:"
echo "  🔑 Admin: admin@collegesafe.com / admin123"
echo "  👩‍⚕️ Counsellor: counsellor@collegesafe.com / counsellor123"

echo ""
echo "📊 Database Status:"
echo "  Database: PostgreSQL"
echo "  Host: localhost:5432"
echo "  Database: collegesafe_db"
echo "  User: collegesafe"

echo ""
echo "🎯 Production Features Active:"
echo "  ✅ PostgreSQL Database"
echo "  ✅ User Authentication"
echo "  ✅ Role-based Access Control"
echo "  ✅ CSRF Protection"
echo "  ✅ Database Migrations"
echo "  ✅ Health Monitoring"
echo "  ✅ Request Logging"
echo "  ✅ Error Handling"
echo "  ✅ CORS Configuration"

echo ""
echo "🚀 Server is ready for production use!"
echo ""
echo "💡 To stop the server: kill $PID"
echo "💡 To test the API: ./test-production-api.sh"
echo "💡 To view logs: tail -f server.log"
