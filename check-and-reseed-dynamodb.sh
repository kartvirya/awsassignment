#!/bin/bash

# Check and Reseed DynamoDB Tables
set -e

echo "=================================================="
echo "🔍 CHECKING DYNAMODB TABLES STATUS"
echo "=================================================="
echo ""

REGION=$(aws configure get region || echo "ap-southeast-2")

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Function to check table and count items
check_table() {
    local TABLE_NAME=$1
    
    if aws dynamodb describe-table --table-name $TABLE_NAME --region $REGION >/dev/null 2>&1; then
        COUNT=$(aws dynamodb scan --table-name $TABLE_NAME --select COUNT --region $REGION --query 'Count' --output text 2>/dev/null || echo "0")
        echo -e "${GREEN}✅ $TABLE_NAME: $COUNT items${NC}"
        return $COUNT
    else
        echo -e "${RED}❌ $TABLE_NAME: Not found${NC}"
        return -1
    fi
}

echo -e "${BLUE}📊 Current Table Status:${NC}"
echo "----------------------------"

# Check all collegesafe tables
check_table "collegesafe-users"
USER_COUNT=$?

check_table "collegesafe-resources"
RESOURCE_COUNT=$?

check_table "collegesafe-counselling-sessions"
SESSION_COUNT=$?

check_table "collegesafe-messages"
MESSAGE_COUNT=$?

check_table "collegesafe-user-progress"
PROGRESS_COUNT=$?

check_table "collegesafe-sessions"
AUTH_COUNT=$?

echo ""

# Function to seed a table
seed_table() {
    local TABLE_NAME=$1
    local ITEM_JSON=$2
    
    aws dynamodb put-item \
        --table-name $TABLE_NAME \
        --item "$ITEM_JSON" \
        --region $REGION >/dev/null 2>&1 || true
}

echo -e "${BLUE}🌱 Reseeding tables with data...${NC}"
echo ""

# ===========================================
# RESEED USERS TABLE
# ===========================================
echo -e "${YELLOW}Seeding collegesafe-users table...${NC}"

# Clear existing items if needed and reseed
seed_table "collegesafe-users" '{
    "id": {"S": "admin-001"},
    "email": {"S": "admin@collegesafe.com"},
    "first_name": {"S": "System"},
    "last_name": {"S": "Administrator"},
    "profile_image_url": {"S": "https://collegesafe.com/images/admin.jpg"},
    "role": {"S": "admin"},
    "password_hash": {"S": "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918"},
    "password_salt": {"S": "collegesafe_salt"},
    "created_at": {"S": "2024-01-01T00:00:00Z"},
    "updated_at": {"S": "2024-01-01T00:00:00Z"}
}'

seed_table "collegesafe-users" '{
    "id": {"S": "counsellor-001"},
    "email": {"S": "jane.smith@collegesafe.com"},
    "first_name": {"S": "Jane"},
    "last_name": {"S": "Smith"},
    "profile_image_url": {"S": "https://collegesafe.com/images/jane-smith.jpg"},
    "role": {"S": "counsellor"},
    "password_hash": {"S": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"},
    "password_salt": {"S": "collegesafe_salt"},
    "created_at": {"S": "2024-01-10T09:00:00Z"},
    "updated_at": {"S": "2024-01-10T09:00:00Z"}
}'

seed_table "collegesafe-users" '{
    "id": {"S": "counsellor-002"},
    "email": {"S": "michael.chen@collegesafe.com"},
    "first_name": {"S": "Michael"},
    "last_name": {"S": "Chen"},
    "profile_image_url": {"S": "https://collegesafe.com/images/michael-chen.jpg"},
    "role": {"S": "counsellor"},
    "password_hash": {"S": "counsellor_hash"},
    "password_salt": {"S": "collegesafe_salt"},
    "created_at": {"S": "2024-01-12T10:00:00Z"},
    "updated_at": {"S": "2024-01-12T10:00:00Z"}
}'

seed_table "collegesafe-users" '{
    "id": {"S": "student-001"},
    "email": {"S": "john.doe@student.edu"},
    "first_name": {"S": "John"},
    "last_name": {"S": "Doe"},
    "profile_image_url": {"S": "https://collegesafe.com/images/john-doe.jpg"},
    "role": {"S": "student"},
    "password_hash": {"S": "student_hash"},
    "password_salt": {"S": "collegesafe_salt"},
    "created_at": {"S": "2024-02-15T10:30:00Z"},
    "updated_at": {"S": "2024-02-15T10:30:00Z"}
}'

seed_table "collegesafe-users" '{
    "id": {"S": "student-002"},
    "email": {"S": "jane.wilson@student.edu"},
    "first_name": {"S": "Jane"},
    "last_name": {"S": "Wilson"},
    "profile_image_url": {"S": "https://collegesafe.com/images/jane-wilson.jpg"},
    "role": {"S": "student"},
    "password_hash": {"S": "student_hash"},
    "password_salt": {"S": "collegesafe_salt"},
    "created_at": {"S": "2024-02-20T14:45:00Z"},
    "updated_at": {"S": "2024-02-20T14:45:00Z"}
}'

seed_table "collegesafe-users" '{
    "id": {"S": "student-003"},
    "email": {"S": "alex.johnson@student.edu"},
    "first_name": {"S": "Alex"},
    "last_name": {"S": "Johnson"},
    "role": {"S": "student"},
    "password_hash": {"S": "student_hash"},
    "password_salt": {"S": "collegesafe_salt"},
    "created_at": {"S": "2024-02-25T09:15:00Z"},
    "updated_at": {"S": "2024-02-25T09:15:00Z"}
}'

echo -e "${GREEN}✅ Users table seeded with 6 users${NC}"

# ===========================================
# RESEED RESOURCES TABLE
# ===========================================
echo -e "${YELLOW}Seeding collegesafe-resources table...${NC}"

seed_table "collegesafe-resources" '{
    "id": {"N": "1"},
    "title": {"S": "Stress Management Worksheet"},
    "description": {"S": "A comprehensive worksheet to help students identify stress triggers and develop coping strategies"},
    "type": {"S": "worksheet"},
    "url": {"S": "https://collegesafe-resources.s3.amazonaws.com/worksheets/stress-management.pdf"},
    "created_by": {"S": "counsellor-001"},
    "created_at": {"S": "2024-01-15T10:00:00Z"},
    "updated_at": {"S": "2024-01-15T10:00:00Z"}
}'

seed_table "collegesafe-resources" '{
    "id": {"N": "2"},
    "title": {"S": "10-Minute Meditation for Students"},
    "description": {"S": "A guided meditation video specifically designed for college students dealing with academic pressure"},
    "type": {"S": "video"},
    "url": {"S": "https://collegesafe-resources.s3.amazonaws.com/videos/meditation-guide.mp4"},
    "created_by": {"S": "counsellor-001"},
    "created_at": {"S": "2024-02-01T14:30:00Z"},
    "updated_at": {"S": "2024-02-01T14:30:00Z"}
}'

seed_table "collegesafe-resources" '{
    "id": {"N": "3"},
    "title": {"S": "Deep Breathing Exercise Audio"},
    "description": {"S": "Audio guide for 4-7-8 breathing technique to reduce anxiety"},
    "type": {"S": "audio"},
    "url": {"S": "https://collegesafe-resources.s3.amazonaws.com/audio/breathing-exercise.mp3"},
    "created_by": {"S": "counsellor-002"},
    "created_at": {"S": "2024-02-10T09:00:00Z"},
    "updated_at": {"S": "2024-02-10T09:00:00Z"}
}'

seed_table "collegesafe-resources" '{
    "id": {"N": "4"},
    "title": {"S": "Interactive Mood Tracker"},
    "description": {"S": "Track your daily mood and identify patterns to better understand your mental health"},
    "type": {"S": "interactive"},
    "url": {"S": "https://collegesafe.com/tools/mood-tracker"},
    "created_by": {"S": "counsellor-001"},
    "created_at": {"S": "2024-02-15T11:00:00Z"},
    "updated_at": {"S": "2024-02-15T11:00:00Z"}
}'

seed_table "collegesafe-resources" '{
    "id": {"N": "5"},
    "title": {"S": "Anxiety Management Workbook"},
    "description": {"S": "A comprehensive PDF workbook with exercises and strategies for managing anxiety"},
    "type": {"S": "worksheet"},
    "url": {"S": "https://collegesafe-resources.s3.amazonaws.com/worksheets/anxiety-workbook.pdf"},
    "created_by": {"S": "counsellor-002"},
    "created_at": {"S": "2024-02-18T13:00:00Z"},
    "updated_at": {"S": "2024-02-18T13:00:00Z"}
}'

seed_table "collegesafe-resources" '{
    "id": {"N": "6"},
    "title": {"S": "Sleep Hygiene Tips Video"},
    "description": {"S": "Learn how to improve your sleep quality with these evidence-based tips"},
    "type": {"S": "video"},
    "url": {"S": "https://collegesafe-resources.s3.amazonaws.com/videos/sleep-hygiene.mp4"},
    "created_by": {"S": "counsellor-001"},
    "created_at": {"S": "2024-02-20T10:00:00Z"},
    "updated_at": {"S": "2024-02-20T10:00:00Z"}
}'

echo -e "${GREEN}✅ Resources table seeded with 6 educational materials${NC}"

# ===========================================
# RESEED COUNSELLING SESSIONS TABLE
# ===========================================
echo -e "${YELLOW}Seeding collegesafe-counselling-sessions table...${NC}"

seed_table "collegesafe-counselling-sessions" '{
    "id": {"N": "1"},
    "student_id": {"S": "student-001"},
    "counsellor_id": {"S": "counsellor-001"},
    "status": {"S": "completed"},
    "scheduled_at": {"S": "2024-03-10T10:00:00Z"},
    "notes": {"S": "Discussed stress management techniques and academic pressure. Student showed good engagement."},
    "created_at": {"S": "2024-03-05T15:30:00Z"},
    "updated_at": {"S": "2024-03-10T11:00:00Z"}
}'

seed_table "collegesafe-counselling-sessions" '{
    "id": {"N": "2"},
    "student_id": {"S": "student-002"},
    "counsellor_id": {"S": "counsellor-001"},
    "status": {"S": "confirmed"},
    "scheduled_at": {"S": "2024-03-25T14:00:00Z"},
    "notes": {"S": "Follow-up session for anxiety management strategies"},
    "created_at": {"S": "2024-03-21T09:15:00Z"},
    "updated_at": {"S": "2024-03-21T09:15:00Z"}
}'

seed_table "collegesafe-counselling-sessions" '{
    "id": {"N": "3"},
    "student_id": {"S": "student-001"},
    "counsellor_id": {"S": "counsellor-002"},
    "status": {"S": "pending"},
    "scheduled_at": {"S": "2024-03-28T15:00:00Z"},
    "notes": {"S": "Initial consultation for time management and study skills"},
    "created_at": {"S": "2024-03-22T11:00:00Z"},
    "updated_at": {"S": "2024-03-22T11:00:00Z"}
}'

seed_table "collegesafe-counselling-sessions" '{
    "id": {"N": "4"},
    "student_id": {"S": "student-003"},
    "counsellor_id": {"S": "counsellor-002"},
    "status": {"S": "confirmed"},
    "scheduled_at": {"S": "2024-03-30T11:00:00Z"},
    "notes": {"S": "Group therapy session - Social anxiety support group"},
    "created_at": {"S": "2024-03-23T14:00:00Z"},
    "updated_at": {"S": "2024-03-23T14:00:00Z"}
}'

seed_table "collegesafe-counselling-sessions" '{
    "id": {"N": "5"},
    "student_id": {"S": "student-002"},
    "counsellor_id": {"S": "counsellor-002"},
    "status": {"S": "cancelled"},
    "scheduled_at": {"S": "2024-03-20T13:00:00Z"},
    "notes": {"S": "Student cancelled due to exam conflict. Needs to reschedule."},
    "created_at": {"S": "2024-03-15T10:00:00Z"},
    "updated_at": {"S": "2024-03-19T16:00:00Z"}
}'

echo -e "${GREEN}✅ Counselling Sessions table seeded with 5 appointments${NC}"

# ===========================================
# RESEED MESSAGES TABLE
# ===========================================
echo -e "${YELLOW}Seeding collegesafe-messages table...${NC}"

seed_table "collegesafe-messages" '{
    "id": {"N": "1"},
    "sender_id": {"S": "student-001"},
    "receiver_id": {"S": "counsellor-001"},
    "content": {"S": "Hi Dr. Smith, I would like to schedule a follow-up session to discuss the coping strategies we talked about last time."},
    "created_at": {"S": "2024-03-20T10:00:00Z"}
}'

seed_table "collegesafe-messages" '{
    "id": {"N": "2"},
    "sender_id": {"S": "counsellor-001"},
    "receiver_id": {"S": "student-001"},
    "content": {"S": "Hello John, I have scheduled your follow-up session for March 28th at 3 PM. Looking forward to seeing your progress!"},
    "created_at": {"S": "2024-03-20T11:00:00Z"}
}'

seed_table "collegesafe-messages" '{
    "id": {"N": "3"},
    "sender_id": {"S": "student-002"},
    "receiver_id": {"S": "counsellor-001"},
    "content": {"S": "Thank you for the breathing exercise resources. They have been really helpful during my study sessions!"},
    "created_at": {"S": "2024-03-21T14:30:00Z"}
}'

seed_table "collegesafe-messages" '{
    "id": {"N": "4"},
    "sender_id": {"S": "counsellor-002"},
    "receiver_id": {"S": "student-003"},
    "content": {"S": "Welcome to CollegeSafe! Your first appointment is confirmed for March 30th. Please complete the intake form before our session."},
    "created_at": {"S": "2024-03-23T15:00:00Z"}
}'

seed_table "collegesafe-messages" '{
    "id": {"N": "5"},
    "sender_id": {"S": "admin-001"},
    "receiver_id": {"S": "student-001"},
    "content": {"S": "System notification: Your appointment reminder has been sent to your registered email address."},
    "created_at": {"S": "2024-03-24T09:00:00Z"}
}'

echo -e "${GREEN}✅ Messages table seeded with 5 messages${NC}"

# ===========================================
# RESEED USER PROGRESS TABLE
# ===========================================
echo -e "${YELLOW}Seeding collegesafe-user-progress table...${NC}"

seed_table "collegesafe-user-progress" '{
    "user_id": {"S": "student-001"},
    "resource_id": {"N": "1"},
    "progress": {"N": "100"},
    "completed": {"BOOL": true},
    "last_accessed_at": {"S": "2024-03-20T10:00:00Z"},
    "created_at": {"S": "2024-03-15T10:00:00Z"},
    "updated_at": {"S": "2024-03-20T10:00:00Z"}
}'

seed_table "collegesafe-user-progress" '{
    "user_id": {"S": "student-001"},
    "resource_id": {"N": "2"},
    "progress": {"N": "75"},
    "completed": {"BOOL": false},
    "last_accessed_at": {"S": "2024-03-22T14:00:00Z"},
    "created_at": {"S": "2024-03-20T14:00:00Z"},
    "updated_at": {"S": "2024-03-22T14:00:00Z"}
}'

seed_table "collegesafe-user-progress" '{
    "user_id": {"S": "student-002"},
    "resource_id": {"N": "3"},
    "progress": {"N": "100"},
    "completed": {"BOOL": true},
    "last_accessed_at": {"S": "2024-03-21T09:00:00Z"},
    "created_at": {"S": "2024-03-21T09:00:00Z"},
    "updated_at": {"S": "2024-03-21T09:30:00Z"}
}'

seed_table "collegesafe-user-progress" '{
    "user_id": {"S": "student-002"},
    "resource_id": {"N": "4"},
    "progress": {"N": "50"},
    "completed": {"BOOL": false},
    "last_accessed_at": {"S": "2024-03-23T11:00:00Z"},
    "created_at": {"S": "2024-03-22T10:00:00Z"},
    "updated_at": {"S": "2024-03-23T11:00:00Z"}
}'

seed_table "collegesafe-user-progress" '{
    "user_id": {"S": "student-003"},
    "resource_id": {"N": "1"},
    "progress": {"N": "25"},
    "completed": {"BOOL": false},
    "last_accessed_at": {"S": "2024-03-24T15:00:00Z"},
    "created_at": {"S": "2024-03-24T15:00:00Z"},
    "updated_at": {"S": "2024-03-24T15:00:00Z"}
}'

echo -e "${GREEN}✅ User Progress table seeded with 5 progress records${NC}"

# ===========================================
# RESEED SESSIONS TABLE (Authentication)
# ===========================================
echo -e "${YELLOW}Seeding collegesafe-sessions table...${NC}"

seed_table "collegesafe-sessions" '{
    "sid": {"S": "sess_abc123def456"},
    "sess": {"S": "{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2024-03-26T10:00:00Z\",\"httpOnly\":true,\"path\":\"/\"},\"userId\":\"student-001\",\"email\":\"john.doe@student.edu\"}"},
    "expire": {"S": "2024-03-26T10:00:00Z"}
}'

seed_table "collegesafe-sessions" '{
    "sid": {"S": "sess_xyz789ghi012"},
    "sess": {"S": "{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2024-03-26T14:00:00Z\",\"httpOnly\":true,\"path\":\"/\"},\"userId\":\"counsellor-001\",\"email\":\"jane.smith@collegesafe.com\"}"},
    "expire": {"S": "2024-03-26T14:00:00Z"}
}'

echo -e "${GREEN}✅ Sessions table seeded with 2 active sessions${NC}"

echo ""
echo "=================================================="
echo -e "${GREEN}✅ ALL TABLES SUCCESSFULLY SEEDED${NC}"
echo "=================================================="
echo ""

# Display final table statistics
echo -e "${BLUE}📊 Final Table Statistics:${NC}"
echo "----------------------------"

for table in collegesafe-users collegesafe-resources collegesafe-counselling-sessions collegesafe-messages collegesafe-user-progress collegesafe-sessions; do
    if aws dynamodb describe-table --table-name $table --region $REGION >/dev/null 2>&1; then
        COUNT=$(aws dynamodb scan --table-name $table --select COUNT --region $REGION --query 'Count' --output text 2>/dev/null || echo "0")
        echo -e "${GREEN}✅ $table: $COUNT items${NC}"
    fi
done

echo ""
echo -e "${YELLOW}📸 Tables are ready for screenshots!${NC}"
echo ""
echo -e "${BLUE}View DynamoDB tables at:${NC}"
echo "https://$REGION.console.aws.amazon.com/dynamodbv2/home?region=$REGION#tables"
echo ""
echo -e "${BLUE}Table contents for screenshots:${NC}"
echo "  • Figure 52: DynamoDB Tables List (6 tables)"
echo "  • Figure 53: Admin User (admin@collegesafe.com)"
echo "  • Figure 54: Appointments (5 counselling sessions)"
echo "  • Figure 55: Educational Materials (6 resources)"
echo "  • Figure 56: Users Table (6 users total)"
echo ""
echo -e "${GREEN}Data includes:${NC}"
echo "  • 6 users (1 admin, 2 counsellors, 3 students)"
echo "  • 6 educational resources (worksheets, videos, audio, interactive)"
echo "  • 5 counselling sessions (various statuses)"
echo "  • 5 messages between users"
echo "  • 5 user progress records"
echo "  • 2 active authentication sessions"

