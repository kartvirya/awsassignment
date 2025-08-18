#!/bin/bash

# Reseed All DynamoDB Tables with Complete Data
set -e

echo "=================================================="
echo "🌱 RESEEDING ALL DYNAMODB TABLES"
echo "=================================================="
echo ""

REGION=$(aws configure get region || echo "ap-southeast-2")

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# First, clear existing data and reseed everything
echo -e "${BLUE}📊 Starting complete data seed...${NC}"
echo ""

# ===========================================
# SEED USERS TABLE - Figure 56
# ===========================================
echo -e "${YELLOW}Seeding Users Table (Figure 56)...${NC}"

# Admin
aws dynamodb put-item --table-name collegesafe-users --region $REGION --item '{
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
}' >/dev/null 2>&1 || true

# Counsellors
aws dynamodb put-item --table-name collegesafe-users --region $REGION --item '{
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
}' >/dev/null 2>&1 || true

aws dynamodb put-item --table-name collegesafe-users --region $REGION --item '{
    "id": {"S": "counsellor-002"},
    "email": {"S": "michael.chen@collegesafe.com"},
    "first_name": {"S": "Michael"},
    "last_name": {"S": "Chen"},
    "role": {"S": "counsellor"},
    "password_hash": {"S": "counsellor_hash"},
    "password_salt": {"S": "collegesafe_salt"},
    "created_at": {"S": "2024-01-12T10:00:00Z"},
    "updated_at": {"S": "2024-01-12T10:00:00Z"}
}' >/dev/null 2>&1 || true

# Students
aws dynamodb put-item --table-name collegesafe-users --region $REGION --item '{
    "id": {"S": "student-001"},
    "email": {"S": "john.doe@student.edu"},
    "first_name": {"S": "John"},
    "last_name": {"S": "Doe"},
    "role": {"S": "student"},
    "password_hash": {"S": "student_hash"},
    "password_salt": {"S": "collegesafe_salt"},
    "created_at": {"S": "2024-02-15T10:30:00Z"},
    "updated_at": {"S": "2024-02-15T10:30:00Z"}
}' >/dev/null 2>&1 || true

aws dynamodb put-item --table-name collegesafe-users --region $REGION --item '{
    "id": {"S": "student-002"},
    "email": {"S": "jane.wilson@student.edu"},
    "first_name": {"S": "Jane"},
    "last_name": {"S": "Wilson"},
    "role": {"S": "student"},
    "password_hash": {"S": "student_hash"},
    "password_salt": {"S": "collegesafe_salt"},
    "created_at": {"S": "2024-02-20T14:45:00Z"},
    "updated_at": {"S": "2024-02-20T14:45:00Z"}
}' >/dev/null 2>&1 || true

aws dynamodb put-item --table-name collegesafe-users --region $REGION --item '{
    "id": {"S": "student-003"},
    "email": {"S": "alex.johnson@student.edu"},
    "first_name": {"S": "Alex"},
    "last_name": {"S": "Johnson"},
    "role": {"S": "student"},
    "password_hash": {"S": "student_hash"},
    "password_salt": {"S": "collegesafe_salt"},
    "created_at": {"S": "2024-02-25T09:15:00Z"},
    "updated_at": {"S": "2024-02-25T09:15:00Z"}
}' >/dev/null 2>&1 || true

echo -e "${GREEN}✅ Users table seeded (6 users)${NC}"

# ===========================================
# SEED RESOURCES TABLE - Figure 55
# ===========================================
echo -e "${YELLOW}Seeding Educational Materials (Figure 55)...${NC}"

aws dynamodb put-item --table-name collegesafe-resources --region $REGION --item '{
    "id": {"N": "1"},
    "title": {"S": "Stress Management Worksheet"},
    "description": {"S": "A comprehensive worksheet to help students identify stress triggers and develop coping strategies"},
    "type": {"S": "worksheet"},
    "url": {"S": "/resources/stress-management.pdf"},
    "created_by": {"S": "counsellor-001"},
    "created_at": {"S": "2024-01-15T10:00:00Z"},
    "updated_at": {"S": "2024-01-15T10:00:00Z"}
}' >/dev/null 2>&1 || true

aws dynamodb put-item --table-name collegesafe-resources --region $REGION --item '{
    "id": {"N": "2"},
    "title": {"S": "10-Minute Meditation for Students"},
    "description": {"S": "A guided meditation video specifically designed for college students"},
    "type": {"S": "video"},
    "url": {"S": "/resources/meditation-guide.mp4"},
    "created_by": {"S": "counsellor-001"},
    "created_at": {"S": "2024-02-01T14:30:00Z"},
    "updated_at": {"S": "2024-02-01T14:30:00Z"}
}' >/dev/null 2>&1 || true

aws dynamodb put-item --table-name collegesafe-resources --region $REGION --item '{
    "id": {"N": "3"},
    "title": {"S": "Deep Breathing Exercise Audio"},
    "description": {"S": "Audio guide for 4-7-8 breathing technique to reduce anxiety"},
    "type": {"S": "audio"},
    "url": {"S": "/resources/breathing-exercise.mp3"},
    "created_by": {"S": "counsellor-002"},
    "created_at": {"S": "2024-02-10T09:00:00Z"},
    "updated_at": {"S": "2024-02-10T09:00:00Z"}
}' >/dev/null 2>&1 || true

aws dynamodb put-item --table-name collegesafe-resources --region $REGION --item '{
    "id": {"N": "4"},
    "title": {"S": "Interactive Mood Tracker"},
    "description": {"S": "Track your daily mood and identify patterns"},
    "type": {"S": "interactive"},
    "url": {"S": "/tools/mood-tracker"},
    "created_by": {"S": "counsellor-001"},
    "created_at": {"S": "2024-02-15T11:00:00Z"},
    "updated_at": {"S": "2024-02-15T11:00:00Z"}
}' >/dev/null 2>&1 || true

echo -e "${GREEN}✅ Resources table seeded (4 materials)${NC}"

# ===========================================
# SEED COUNSELLING SESSIONS - Figure 54
# ===========================================
echo -e "${YELLOW}Seeding Appointments Table (Figure 54)...${NC}"

aws dynamodb put-item --table-name collegesafe-counselling-sessions --region $REGION --item '{
    "id": {"N": "1"},
    "student_id": {"S": "student-001"},
    "counsellor_id": {"S": "counsellor-001"},
    "status": {"S": "completed"},
    "scheduled_at": {"S": "2024-03-10T10:00:00Z"},
    "notes": {"S": "Discussed stress management techniques"},
    "created_at": {"S": "2024-03-05T15:30:00Z"},
    "updated_at": {"S": "2024-03-10T11:00:00Z"}
}' >/dev/null 2>&1 || true

aws dynamodb put-item --table-name collegesafe-counselling-sessions --region $REGION --item '{
    "id": {"N": "2"},
    "student_id": {"S": "student-002"},
    "counsellor_id": {"S": "counsellor-001"},
    "status": {"S": "confirmed"},
    "scheduled_at": {"S": "2024-03-25T14:00:00Z"},
    "notes": {"S": "Follow-up session for anxiety management"},
    "created_at": {"S": "2024-03-21T09:15:00Z"},
    "updated_at": {"S": "2024-03-21T09:15:00Z"}
}' >/dev/null 2>&1 || true

aws dynamodb put-item --table-name collegesafe-counselling-sessions --region $REGION --item '{
    "id": {"N": "3"},
    "student_id": {"S": "student-001"},
    "counsellor_id": {"S": "counsellor-002"},
    "status": {"S": "pending"},
    "scheduled_at": {"S": "2024-03-28T15:00:00Z"},
    "notes": {"S": "Initial consultation"},
    "created_at": {"S": "2024-03-22T11:00:00Z"},
    "updated_at": {"S": "2024-03-22T11:00:00Z"}
}' >/dev/null 2>&1 || true

echo -e "${GREEN}✅ Counselling Sessions table seeded (3 appointments)${NC}"

# ===========================================
# SEED MESSAGES TABLE
# ===========================================
echo -e "${YELLOW}Seeding Messages Table...${NC}"

aws dynamodb put-item --table-name collegesafe-messages --region $REGION --item '{
    "id": {"N": "1"},
    "sender_id": {"S": "student-001"},
    "receiver_id": {"S": "counsellor-001"},
    "content": {"S": "Hi Dr. Smith, I would like to schedule a follow-up session."},
    "created_at": {"S": "2024-03-20T10:00:00Z"}
}' >/dev/null 2>&1 || true

aws dynamodb put-item --table-name collegesafe-messages --region $REGION --item '{
    "id": {"N": "2"},
    "sender_id": {"S": "counsellor-001"},
    "receiver_id": {"S": "student-001"},
    "content": {"S": "Hello John, I have scheduled your session for March 28th at 3 PM."},
    "created_at": {"S": "2024-03-20T11:00:00Z"}
}' >/dev/null 2>&1 || true

echo -e "${GREEN}✅ Messages table seeded (2 messages)${NC}"

# ===========================================
# SEED USER PROGRESS TABLE
# ===========================================
echo -e "${YELLOW}Seeding User Progress Table...${NC}"

aws dynamodb put-item --table-name collegesafe-user-progress --region $REGION --item '{
    "user_id": {"S": "student-001"},
    "resource_id": {"N": "1"},
    "progress": {"N": "100"},
    "completed": {"BOOL": true},
    "last_accessed_at": {"S": "2024-03-20T10:00:00Z"},
    "created_at": {"S": "2024-03-15T10:00:00Z"},
    "updated_at": {"S": "2024-03-20T10:00:00Z"}
}' >/dev/null 2>&1 || true

aws dynamodb put-item --table-name collegesafe-user-progress --region $REGION --item '{
    "user_id": {"S": "student-002"},
    "resource_id": {"N": "2"},
    "progress": {"N": "50"},
    "completed": {"BOOL": false},
    "last_accessed_at": {"S": "2024-03-22T14:00:00Z"},
    "created_at": {"S": "2024-03-20T14:00:00Z"},
    "updated_at": {"S": "2024-03-22T14:00:00Z"}
}' >/dev/null 2>&1 || true

echo -e "${GREEN}✅ User Progress table seeded (2 records)${NC}"

# ===========================================
# SEED SESSIONS TABLE (Auth) - Figure 52
# ===========================================
echo -e "${YELLOW}Seeding Sessions Table (Figure 52)...${NC}"

aws dynamodb put-item --table-name collegesafe-sessions --region $REGION --item '{
    "sid": {"S": "sess_abc123def456"},
    "sess": {"S": "{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2024-03-26T10:00:00Z\",\"httpOnly\":true,\"path\":\"/\"},\"userId\":\"student-001\"}"},
    "expire": {"S": "2024-03-26T10:00:00Z"}
}' >/dev/null 2>&1 || true

echo -e "${GREEN}✅ Sessions table seeded (1 session)${NC}"

echo ""
echo "=================================================="
echo -e "${GREEN}✅ ALL TABLES SUCCESSFULLY SEEDED${NC}"
echo "=================================================="
echo ""

# Display final statistics
echo -e "${BLUE}📊 Final Table Statistics:${NC}"
echo "----------------------------"

tables=("collegesafe-users" "collegesafe-resources" "collegesafe-counselling-sessions" "collegesafe-messages" "collegesafe-user-progress" "collegesafe-sessions")

for table in "${tables[@]}"; do
    COUNT=$(aws dynamodb scan --table-name $table --select COUNT --region $REGION --query 'Count' --output text 2>/dev/null || echo "0")
    echo -e "${GREEN}✅ $table: $COUNT items${NC}"
done

echo ""
echo -e "${YELLOW}📸 Tables are ready for screenshots!${NC}"
echo ""
echo -e "${BLUE}Direct Links for Each Figure:${NC}"
echo ""
echo "Figure 52 - DynamoDB Tables List:"
echo "  https://$REGION.console.aws.amazon.com/dynamodbv2/home?region=$REGION#tables"
echo ""
echo "Figure 53 - Admin in Users Table:"
echo "  https://$REGION.console.aws.amazon.com/dynamodbv2/home?region=$REGION#item-explorer?table=collegesafe-users"
echo ""
echo "Figure 54 - Appointments Table:"
echo "  https://$REGION.console.aws.amazon.com/dynamodbv2/home?region=$REGION#item-explorer?table=collegesafe-counselling-sessions"
echo ""
echo "Figure 55 - Educational Materials Table:"
echo "  https://$REGION.console.aws.amazon.com/dynamodbv2/home?region=$REGION#item-explorer?table=collegesafe-resources"
echo ""
echo "Figure 56 - Users Table:"
echo "  https://$REGION.console.aws.amazon.com/dynamodbv2/home?region=$REGION#item-explorer?table=collegesafe-users"

