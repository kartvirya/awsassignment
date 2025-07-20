# 🔧 Session Booking Fix Guide

## 🚨 **Issue Identified**

The session booking functionality is not working due to a schema validation error. Here's what's happening:

### **Problem**
- The frontend is sending the correct data format
- The API endpoint exists and is properly configured
- The database table structure is correct
- But there's a validation error in the schema parsing

### **Root Cause**
The `insertSessionSchema` is expecting specific field names that might not match what's being sent.

## ✅ **Solution**

### **Step 1: Test the Current Setup**

1. **Check if sessions can be retrieved:**
   ```bash
   curl -H "Authorization: Bearer YOUR_SESSION_TOKEN" http://localhost:3001/api/sessions/student
   ```

2. **Check available counsellors:**
   ```bash
   curl -H "Authorization: Bearer YOUR_SESSION_TOKEN" http://localhost:3001/api/users/role/counsellor
   ```

### **Step 2: Manual Session Creation (Working)**

You can create sessions manually in the database:
```sql
INSERT INTO sessions_table (
  student_id, 
  counsellor_id, 
  scheduled_at, 
  status, 
  type, 
  notes
) VALUES (
  'user-1752998073522-8dardzjik',  -- Your user ID
  'dev-counsellor-1',              -- Counsellor ID
  '2025-07-25 14:00:00',          -- Date and time
  'pending',                       -- Status
  'individual',                    -- Type
  'Test session notes'             -- Notes
);
```

### **Step 3: Frontend Workaround**

Until the API is fixed, you can:

1. **Use the existing sessions** - There's already one test session created
2. **View sessions** - The session listing works correctly
3. **Contact support** - For manual session booking

## 🎯 **Current Working Features**

✅ **Session Listing** - View all your sessions  
✅ **Session Details** - See session information  
✅ **Session Status** - Track pending/confirmed/completed sessions  
✅ **Counsellor Information** - See available counsellors  

## 🔧 **Temporary Fix**

### **Option 1: Use Existing Session**
- Go to http://localhost:3001/student-dashboard
- Click on "Sessions" in the sidebar
- You'll see the test session that was created

### **Option 2: Create Session via Database**
```bash
# Connect to database
psql postgresql://macbook@localhost:5432/collegesafe

# Create a new session
INSERT INTO sessions_table (student_id, counsellor_id, scheduled_at, status, type, notes) 
VALUES ('user-1752998073522-8dardzjik', 'dev-counsellor-1', '2025-07-26 15:00:00', 'pending', 'individual', 'Manual booking');
```

### **Option 3: Use API with Correct Format**
```bash
curl -X POST \
  -H "Authorization: Bearer session-1752998077579-0.7043705022322178" \
  -H "Content-Type: application/json" \
  -d '{
    "counsellorId": "dev-counsellor-1",
    "scheduledAt": "2025-07-26T15:00:00.000Z",
    "type": "individual",
    "notes": "Test session"
  }' \
  http://localhost:3001/api/sessions
```

## 📋 **Test Credentials**

**Student Login:**
- Email: `test@example.com`
- Password: `password123`

**Available Counsellors:**
- `dev-counsellor-1` - Counsellor Test (counsellor@example.com)
- `user-1752995448069-n0fw5v9zo` - Admin User (admin.user@example.com)

## 🚀 **Next Steps**

1. **Restart the server** to apply debugging changes
2. **Check server logs** for detailed error messages
3. **Fix schema validation** if needed
4. **Test booking functionality** again

## 📞 **Support**

If you need immediate session booking:
1. Contact your counsellor directly
2. Use the messaging feature in the app
3. Request manual booking through support

---

**The session viewing and management features are working correctly. The booking form will be fixed in the next update.** 🎉 