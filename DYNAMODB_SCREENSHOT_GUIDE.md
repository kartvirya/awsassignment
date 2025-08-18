# 📸 DynamoDB Tables Screenshot Guide for Assignment

## ✅ Tables Created Based on Your Database Migration

All DynamoDB tables have been created to match your CollegeSafe database migration schema.

## 🗄️ DynamoDB Tables Ready for Screenshots

### Table Names and Corresponding Figures:
1. **collegesafe-users** → Figure 56 (Users Table)
2. **collegesafe-resources** → Figure 55 (Educational Materials Table)
3. **collegesafe-counselling-sessions** → Figure 54 (Appointments Table)
4. **collegesafe-messages** → Messages Table
5. **collegesafe-user-progress** → User Progress Table
6. **collegesafe-sessions** → Figure 52 (Sessions for authentication)

### 📊 Current Table Statistics:
- ✅ **collegesafe-users**: 4 items (Admin, Counsellor, 2 Students)
- ✅ **collegesafe-resources**: 4 items (Worksheet, Video, Audio, Interactive)
- ✅ **collegesafe-counselling-sessions**: 3 items (Pending, Confirmed, Completed)
- ✅ **collegesafe-messages**: 3 items
- ✅ **collegesafe-user-progress**: 3 items
- ✅ **collegesafe-sessions**: 1 item

## 🔗 Direct Links for Screenshots

### Figure 52 - DynamoDB Tables List
**URL**: https://ap-southeast-2.console.aws.amazon.com/dynamodbv2/home?region=ap-southeast-2#tables
- Shows all 6 CollegeSafe tables

### Figure 53 - Admin User in Users Table
**Steps**:
1. Go to: https://ap-southeast-2.console.aws.amazon.com/dynamodbv2/home?region=ap-southeast-2#table?name=collegesafe-users
2. Click "Explore table items"
3. Find the admin user (id: admin-001)

### Figure 54 - Appointments Table (Counselling Sessions)
**Steps**:
1. Go to: https://ap-southeast-2.console.aws.amazon.com/dynamodbv2/home?region=ap-southeast-2#table?name=collegesafe-counselling-sessions
2. Click "Explore table items"
3. Shows 3 counselling sessions with different statuses

### Figure 55 - Educational Materials Table (Resources)
**Steps**:
1. Go to: https://ap-southeast-2.console.aws.amazon.com/dynamodbv2/home?region=ap-southeast-2#table?name=collegesafe-resources
2. Click "Explore table items"
3. Shows 4 educational resources (worksheet, video, audio, interactive)

### Figure 56 - Users Table
**Steps**:
1. Go to: https://ap-southeast-2.console.aws.amazon.com/dynamodbv2/home?region=ap-southeast-2#table?name=collegesafe-users
2. Click "Explore table items"
3. Shows all users (admin, counsellor, students)

## 📋 Sample Data Included

### Users:
- **Admin**: admin@collegesafe.com (System Administrator)
- **Counsellor**: counsellor@collegesafe.com (Jane Smith)
- **Student 1**: john.doe@student.edu (John Doe)
- **Student 2**: jane.wilson@student.edu (Jane Wilson)

### Resources (Educational Materials):
1. Stress Management Worksheet (PDF)
2. Meditation Video (MP4)
3. Breathing Exercise Audio (MP3)
4. Interactive Mood Tracker

### Counselling Sessions:
1. Pending session - John Doe with Jane Smith
2. Confirmed session - Jane Wilson with Jane Smith
3. Completed session - John Doe with Jane Smith

## 🎯 Screenshot Tips

1. **For Table List (Figure 52)**:
   - Make sure all 6 collegesafe-* tables are visible
   - Show the table status as "Active"

2. **For Individual Tables (Figures 53-56)**:
   - Click "Explore table items" to show the data
   - Ensure items are visible with their attributes
   - You can click on individual items to show detailed view

3. **Browser Settings**:
   - Use 90% zoom for better visibility
   - Hide any sensitive account information if needed

## ✨ Data Matches Your Schema

All tables and data have been created to match your actual database migration file:
- Correct table structures
- Appropriate attributes based on your SQL schema
- Sample data that reflects your application's use cases
- Proper relationships between entities (users, sessions, resources, etc.)

---

Generated: $(date)
Tables are live at: https://ap-southeast-2.console.aws.amazon.com/dynamodbv2/home?region=ap-southeast-2#tables
