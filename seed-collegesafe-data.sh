#!/bin/bash

# Seed Sample Data into CollegeSafe DynamoDB Tables
# Based on actual database migration schema

set -e

echo "=================================================="
echo "🌱 SEEDING COLLEGESAFE DYNAMODB TABLES"
echo "=================================================="
echo ""

REGION=$(aws configure get region || echo "ap-southeast-2")

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ===========================================
# SEED USERS TABLE
# ===========================================
echo -e "${BLUE}👥 Seeding Users Table...${NC}"

# Admin user (from migration)
aws dynamodb put-item \
    --table-name collegesafe-users \
    --item '{
        "id": {"S": "admin-001"},
        "email": {"S": "admin@collegesafe.com"},
        "first_name": {"S": "System"},
        "last_name": {"S": "Administrator"},
        "role": {"S": "admin"},
        "password_hash": {"S": "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918"},
        "password_salt": {"S": "collegesafe_salt"},
        "created_at": {"S": "2024-01-01T00:00:00Z"},
        "updated_at": {"S": "2024-01-01T00:00:00Z"}
    }' \
    --region $REGION 2>/dev/null || echo "Admin user already exists"

# Counsellor user (from migration)
aws dynamodb put-item \
    --table-name collegesafe-users \
    --item '{
        "id": {"S": "counsellor-001"},
        "email": {"S": "counsellor@collegesafe.com"},
        "first_name": {"S": "Jane"},
        "last_name": {"S": "Smith"},
        "role": {"S": "counsellor"},
        "password_hash": {"S": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"},
        "password_salt": {"S": "collegesafe_salt"},
        "created_at": {"S": "2024-01-10T09:00:00Z"},
        "updated_at": {"S": "2024-01-10T09:00:00Z"}
    }' \
    --region $REGION 2>/dev/null || true

# Sample students
aws dynamodb put-item \
    --table-name collegesafe-users \
    --item '{
        "id": {"S": "student-001"},
        "email": {"S": "john.doe@student.edu"},
        "first_name": {"S": "John"},
        "last_name": {"S": "Doe"},
        "role": {"S": "student"},
        "password_hash": {"S": "student_hash"},
        "password_salt": {"S": "collegesafe_salt"},
        "created_at": {"S": "2024-02-15T10:30:00Z"},
        "updated_at": {"S": "2024-02-15T10:30:00Z"}
    }' \
    --region $REGION 2>/dev/null || true

aws dynamodb put-item \
    --table-name collegesafe-users \
    --item '{
        "id": {"S": "student-002"},
        "email": {"S": "jane.wilson@student.edu"},
        "first_name": {"S": "Jane"},
        "last_name": {"S": "Wilson"},
        "role": {"S": "student"},
        "password_hash": {"S": "student_hash"},
        "password_salt": {"S": "collegesafe_salt"},
        "created_at": {"S": "2024-02-20T14:45:00Z"},
        "updated_at": {"S": "2024-02-20T14:45:00Z"}
    }' \
    --region $REGION 2>/dev/null || true

echo -e "${GREEN}✅ Users table seeded${NC}"

# ===========================================
# SEED RESOURCES TABLE (from migration)
# ===========================================
echo -e "${BLUE}📚 Seeding Resources Table...${NC}"

aws dynamodb put-item \
    --table-name collegesafe-resources \
    --item '{
        "id": {"N": "1"},
        "title": {"S": "Stress Management Worksheet"},
        "description": {"S": "A comprehensive worksheet to help students manage stress and anxiety"},
        "type": {"S": "worksheet"},
        "url": {"S": "/resources/stress-management.pdf"},
        "created_by": {"S": "counsellor-001"},
        "created_at": {"S": "2024-01-15T10:00:00Z"},
        "updated_at": {"S": "2024-01-15T10:00:00Z"}
    }' \
    --region $REGION 2>/dev/null || true

aws dynamodb put-item \
    --table-name collegesafe-resources \
    --item '{
        "id": {"N": "2"},
        "title": {"S": "Meditation Video"},
        "description": {"S": "A 10-minute guided meditation video for relaxation"},
        "type": {"S": "video"},
        "url": {"S": "/resources/meditation-video.mp4"},
        "created_by": {"S": "counsellor-001"},
        "created_at": {"S": "2024-02-01T14:30:00Z"},
        "updated_at": {"S": "2024-02-01T14:30:00Z"}
    }' \
    --region $REGION 2>/dev/null || true

aws dynamodb put-item \
    --table-name collegesafe-resources \
    --item '{
        "id": {"N": "3"},
        "title": {"S": "Breathing Exercise Audio"},
        "description": {"S": "Audio guide for breathing exercises"},
        "type": {"S": "audio"},
        "url": {"S": "/resources/breathing-exercise.mp3"},
        "created_by": {"S": "counsellor-001"},
        "created_at": {"S": "2024-02-10T09:00:00Z"},
        "updated_at": {"S": "2024-02-10T09:00:00Z"}
    }' \
    --region $REGION 2>/dev/null || true

aws dynamodb put-item \
    --table-name collegesafe-resources \
    --item '{
        "id": {"N": "4"},
        "title": {"S": "Interactive Mood Tracker"},
        "description": {"S": "An interactive tool to track daily mood and emotions"},
        "type": {"S": "interactive"},
        "url": {"S": "/resources/mood-tracker"},
        "created_by": {"S": "counsellor-001"},
        "created_at": {"S": "2024-02-15T11:00:00Z"},
        "updated_at": {"S": "2024-02-15T11:00:00Z"}
    }' \
    --region $REGION 2>/dev/null || true

echo -e "${GREEN}✅ Resources table seeded${NC}"

# ===========================================
# SEED COUNSELLING SESSIONS TABLE
# ===========================================
echo -e "${BLUE}📅 Seeding Counselling Sessions Table...${NC}"

aws dynamodb put-item \
    --table-name collegesafe-counselling-sessions \
    --item '{
        "id": {"N": "1"},
        "student_id": {"S": "student-001"},
        "counsellor_id": {"S": "counsellor-001"},
        "status": {"S": "pending"},
        "scheduled_at": {"S": "2024-03-25T10:00:00Z"},
        "notes": {"S": "Initial consultation for stress management"},
        "created_at": {"S": "2024-03-20T15:30:00Z"},
        "updated_at": {"S": "2024-03-20T15:30:00Z"}
    }' \
    --region $REGION 2>/dev/null || true

aws dynamodb put-item \
    --table-name collegesafe-counselling-sessions \
    --item '{
        "id": {"N": "2"},
        "student_id": {"S": "student-002"},
        "counsellor_id": {"S": "counsellor-001"},
        "status": {"S": "confirmed"},
        "scheduled_at": {"S": "2024-03-25T14:00:00Z"},
        "notes": {"S": "Follow-up session for anxiety management"},
        "created_at": {"S": "2024-03-21T09:15:00Z"},
        "updated_at": {"S": "2024-03-21T09:15:00Z"}
    }' \
    --region $REGION 2>/dev/null || true

aws dynamodb put-item \
    --table-name collegesafe-counselling-sessions \
    --item '{
        "id": {"N": "3"},
        "student_id": {"S": "student-001"},
        "counsellor_id": {"S": "counsellor-001"},
        "status": {"S": "completed"},
        "scheduled_at": {"S": "2024-03-22T15:00:00Z"},
        "notes": {"S": "Completed session on coping strategies"},
        "created_at": {"S": "2024-03-15T11:00:00Z"},
        "updated_at": {"S": "2024-03-22T16:00:00Z"}
    }' \
    --region $REGION 2>/dev/null || true

echo -e "${GREEN}✅ Counselling Sessions table seeded${NC}"

# ===========================================
# SEED MESSAGES TABLE
# ===========================================
echo -e "${BLUE}💬 Seeding Messages Table...${NC}"

aws dynamodb put-item \
    --table-name collegesafe-messages \
    --item '{
        "id": {"N": "1"},
        "sender_id": {"S": "student-001"},
        "receiver_id": {"S": "counsellor-001"},
        "content": {"S": "Hello Dr. Smith, I would like to schedule a counselling session for next week."},
        "created_at": {"S": "2024-03-20T10:00:00Z"}
    }' \
    --region $REGION 2>/dev/null || true

aws dynamodb put-item \
    --table-name collegesafe-messages \
    --item '{
        "id": {"N": "2"},
        "sender_id": {"S": "counsellor-001"},
        "receiver_id": {"S": "student-001"},
        "content": {"S": "Hello John, I have scheduled your session for Monday at 10 AM. Looking forward to meeting you."},
        "created_at": {"S": "2024-03-20T11:00:00Z"}
    }' \
    --region $REGION 2>/dev/null || true

aws dynamodb put-item \
    --table-name collegesafe-messages \
    --item '{
        "id": {"N": "3"},
        "sender_id": {"S": "student-002"},
        "receiver_id": {"S": "counsellor-001"},
        "content": {"S": "Thank you for the resources you shared. The breathing exercises are really helpful!"},
        "created_at": {"S": "2024-03-21T14:30:00Z"}
    }' \
    --region $REGION 2>/dev/null || true

echo -e "${GREEN}✅ Messages table seeded${NC}"

# ===========================================
# SEED USER PROGRESS TABLE
# ===========================================
echo -e "${BLUE}📈 Seeding User Progress Table...${NC}"

aws dynamodb put-item \
    --table-name collegesafe-user-progress \
    --item '{
        "user_id": {"S": "student-001"},
        "resource_id": {"N": "1"},
        "progress": {"N": "100"},
        "completed": {"BOOL": true},
        "last_accessed_at": {"S": "2024-03-20T10:00:00Z"},
        "created_at": {"S": "2024-03-15T10:00:00Z"},
        "updated_at": {"S": "2024-03-20T10:00:00Z"}
    }' \
    --region $REGION 2>/dev/null || true

aws dynamodb put-item \
    --table-name collegesafe-user-progress \
    --item '{
        "user_id": {"S": "student-001"},
        "resource_id": {"N": "2"},
        "progress": {"N": "50"},
        "completed": {"BOOL": false},
        "last_accessed_at": {"S": "2024-03-21T14:00:00Z"},
        "created_at": {"S": "2024-03-20T14:00:00Z"},
        "updated_at": {"S": "2024-03-21T14:00:00Z"}
    }' \
    --region $REGION 2>/dev/null || true

aws dynamodb put-item \
    --table-name collegesafe-user-progress \
    --item '{
        "user_id": {"S": "student-002"},
        "resource_id": {"N": "3"},
        "progress": {"N": "75"},
        "completed": {"BOOL": false},
        "last_accessed_at": {"S": "2024-03-22T09:00:00Z"},
        "created_at": {"S": "2024-03-21T09:00:00Z"},
        "updated_at": {"S": "2024-03-22T09:00:00Z"}
    }' \
    --region $REGION 2>/dev/null || true

echo -e "${GREEN}✅ User Progress table seeded${NC}"

# ===========================================
# SEED SESSIONS TABLE (Authentication)
# ===========================================
echo -e "${BLUE}🔐 Seeding Sessions Table...${NC}"

aws dynamodb put-item \
    --table-name collegesafe-sessions \
    --item '{
        "sid": {"S": "sess_abc123def456"},
        "sess": {"S": "{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2024-03-26T10:00:00Z\",\"httpOnly\":true,\"path\":\"/\"},\"userId\":\"student-001\"}"},
        "expire": {"S": "2024-03-26T10:00:00Z"}
    }' \
    --region $REGION 2>/dev/null || true

echo -e "${GREEN}✅ Sessions table seeded${NC}"

echo ""
echo "=================================================="
echo -e "${GREEN}✅ ALL TABLES SEEDED WITH SAMPLE DATA${NC}"
echo "=================================================="
echo ""

# Display table item counts
echo -e "${BLUE}📊 Table Statistics:${NC}"
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
echo -e "${BLUE}These tables correspond to your migration schema:${NC}"
echo "  • Figure 52: DynamoDB Tables List"
echo "  • Figure 53: Admin User in collegesafe-users table"
echo "  • Figure 54: collegesafe-counselling-sessions table (Appointments)"
echo "  • Figure 55: collegesafe-resources table (Educational Materials)"
echo "  • Figure 56: collegesafe-users table"

