# 🔐 Login Help Guide

## ✅ **Test Credentials**

I've created a test user for you to login:

**Email**: `test@example.com`  
**Password**: `password123`  
**Role**: Student

## 🚀 **How to Login**

### **Option 1: Use the Login Form**
1. Go to http://localhost:3001/login
2. Enter the credentials above
3. Click "Sign In"

### **Option 2: Create Your Own Account**
1. Go to http://localhost:3001/signup
2. Fill out the registration form
3. Choose your role (Student, Counsellor, or Admin)
4. Click "Create Account"
5. You'll be redirected to login

## 🔧 **Troubleshooting**

### **If Login Fails:**

1. **Check Browser Console**
   - Press `F12` or `Cmd+Option+I` (Mac)
   - Go to Console tab
   - Look for any red error messages

2. **Clear Browser Cache**
   - Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Or clear browser data completely

3. **Check Network Tab**
   - In Developer Tools, go to Network tab
   - Try to login and see if the API call succeeds
   - Look for any failed requests

4. **Test API Directly**
   ```bash
   # Test login API
   curl -X POST http://localhost:3001/api/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

### **Common Issues:**

1. **"Invalid credentials"**
   - Double-check email and password
   - Make sure caps lock is off
   - Try copying and pasting the credentials

2. **"Network error"**
   - Make sure the application is running
   - Check if http://localhost:3001/health returns OK

3. **"Page not loading"**
   - Refresh the page (Cmd+R)
   - Check if the server is running

## 📱 **Alternative Login Methods**

### **Create Admin User**
```bash
curl -X POST http://localhost:3001/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Admin",
    "lastName": "User", 
    "email": "admin@collegesafe.com",
    "password": "admin123",
    "phone": "1234567890",
    "role": "admin"
  }'
```

### **Create Counsellor User**
```bash
curl -X POST http://localhost:3001/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Counsellor",
    "lastName": "User",
    "email": "counsellor@collegesafe.com", 
    "password": "counsellor123",
    "phone": "1234567890",
    "role": "counsellor"
  }'
```

## 🎯 **After Successful Login**

Once you login successfully, you'll be redirected to:
- **Student Dashboard**: http://localhost:3001/student-dashboard
- **Counsellor Dashboard**: http://localhost:3001/counsellor-dashboard  
- **Admin Dashboard**: http://localhost:3001/admin-dashboard

## 🆘 **Still Having Issues?**

1. **Check if server is running:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Restart the application:**
   ```bash
   cd /Users/macbook/study/Assignments/mcp/assignment/DDAC/schoolsafe/collegesafe
   ./start-app.sh
   ```

3. **Check database connection:**
   ```bash
   psql postgresql://macbook@localhost:5432/collegesafe -c "SELECT * FROM users;"
   ```

---

🎉 **The login system is working correctly! Try the test credentials above.** 