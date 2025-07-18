#!/bin/bash

# CollegeSafe Production API Test Script
echo "🧪 Testing CollegeSafe Production API..."

BASE_URL="http://localhost:3000"

echo ""
echo "1. 🏠 Testing Root Endpoint"
echo "GET $BASE_URL/"
curl -s $BASE_URL/ | jq .

echo ""
echo "2. 📊 Testing Health Check"
echo "GET $BASE_URL/health"
curl -s $BASE_URL/health | jq .

echo ""
echo "3. 🔐 Testing Login (Admin)"
echo "POST $BASE_URL/api/login"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/login \
  -H "Content-Type: application/json" \
  -H "X-XSRF-TOKEN: test-token" \
  -d '{"email":"admin@collegesafe.com","password":"admin123"}')

echo $LOGIN_RESPONSE | jq .

# Extract token (note: in production, this would be in secure cookies)
# For testing, we'll use a mock token since CSRF is enabled
TOKEN="mock-admin-token"

echo ""
echo "4. 📈 Testing Analytics (requires admin auth)"
echo "GET $BASE_URL/api/analytics/stats"
curl -s $BASE_URL/api/analytics/stats \
  -H "Authorization: Bearer $TOKEN" | jq .

echo ""
echo "5. 🏫 Testing Resources API"
echo "GET $BASE_URL/api/resources"
curl -s $BASE_URL/api/resources \
  -H "Authorization: Bearer $TOKEN" | jq .

echo ""
echo "6. 👥 Testing Users API"
echo "GET $BASE_URL/api/users"
curl -s $BASE_URL/api/users \
  -H "Authorization: Bearer $TOKEN" | jq .

echo ""
echo "7. 🔐 Testing Login (Counsellor)"
echo "POST $BASE_URL/api/login"
COUNSELLOR_LOGIN=$(curl -s -X POST $BASE_URL/api/login \
  -H "Content-Type: application/json" \
  -H "X-XSRF-TOKEN: test-token" \
  -d '{"email":"counsellor@collegesafe.com","password":"counsellor123"}')

echo $COUNSELLOR_LOGIN | jq .

echo ""
echo "8. 📝 Testing Sessions API"
echo "GET $BASE_URL/api/sessions/all"
curl -s $BASE_URL/api/sessions/all \
  -H "Authorization: Bearer $TOKEN" | jq .

echo ""
echo "9. 💬 Testing Messages API"
echo "GET $BASE_URL/api/messages/conversations"
curl -s $BASE_URL/api/messages/conversations \
  -H "Authorization: Bearer $TOKEN" | jq .

echo ""
echo "10. 📊 Testing Progress API"
echo "GET $BASE_URL/api/progress"
curl -s $BASE_URL/api/progress \
  -H "Authorization: Bearer $TOKEN" | jq .

echo ""
echo "11. 🚫 Testing Protected Endpoint Without Auth"
echo "GET $BASE_URL/api/users (no auth)"
curl -s $BASE_URL/api/users | jq .

echo ""
echo "12. 🚫 Testing Non-existent Endpoint"
echo "GET $BASE_URL/api/nonexistent"
curl -s $BASE_URL/api/nonexistent | jq .

echo ""
echo "✅ Production API Test Complete!"
echo ""
echo "🔐 Production Login Credentials:"
echo "  Admin: admin@collegesafe.com / admin123"
echo "  Counsellor: counsellor@collegesafe.com / counsellor123"
echo ""
echo "🌐 API Base URL: $BASE_URL"
echo "📊 Health Check: $BASE_URL/health"
echo "📖 API Documentation: $BASE_URL/ (shows all endpoints)"
