#!/bin/bash

# Seed Sample Data into DynamoDB Tables
set -e

echo "=================================================="
echo "🌱 SEEDING SAMPLE DATA INTO DYNAMODB TABLES"
echo "=================================================="
echo ""

REGION=$(aws configure get region || echo "ap-southeast-2")

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ===========================================
# SEED USERS TABLE (Figure 56)
# ===========================================
echo -e "${BLUE}👥 Seeding Users Table...${NC}"

# Admin user
aws dynamodb put-item \
    --table-name users \
    --item '{
        "userId": {"S": "admin-001"},
        "email": {"S": "admin@collegesafe.edu"},
        "name": {"S": "System Administrator"},
        "role": {"S": "admin"},
        "createdAt": {"S": "2024-01-01T00:00:00Z"},
        "status": {"S": "active"}
    }' \
    --region $REGION 2>/dev/null || echo "Admin user already exists"

# Sample students
aws dynamodb put-item \
    --table-name users \
    --item '{
        "userId": {"S": "student-001"},
        "email": {"S": "john.doe@student.edu"},
        "name": {"S": "John Doe"},
        "role": {"S": "student"},
        "createdAt": {"S": "2024-02-15T10:30:00Z"},
        "status": {"S": "active"},
        "phone": {"S": "+1234567890"}
    }' \
    --region $REGION 2>/dev/null || true

aws dynamodb put-item \
    --table-name users \
    --item '{
        "userId": {"S": "student-002"},
        "email": {"S": "jane.smith@student.edu"},
        "name": {"S": "Jane Smith"},
        "role": {"S": "student"},
        "createdAt": {"S": "2024-02-20T14:45:00Z"},
        "status": {"S": "active"},
        "phone": {"S": "+1234567891"}
    }' \
    --region $REGION 2>/dev/null || true

# Sample therapist
aws dynamodb put-item \
    --table-name users \
    --item '{
        "userId": {"S": "therapist-001"},
        "email": {"S": "dr.wilson@collegesafe.edu"},
        "name": {"S": "Dr. Sarah Wilson"},
        "role": {"S": "therapist"},
        "createdAt": {"S": "2024-01-10T09:00:00Z"},
        "status": {"S": "active"},
        "specialization": {"S": "Anxiety and Depression"}
    }' \
    --region $REGION 2>/dev/null || true

echo -e "${GREEN}✅ Users table seeded${NC}"

# ===========================================
# SEED APPOINTMENTS TABLE (Figure 54)
# ===========================================
echo -e "${BLUE}📅 Seeding Appointments Table...${NC}"

aws dynamodb put-item \
    --table-name appointments \
    --item '{
        "appointmentId": {"S": "apt-001"},
        "userId": {"S": "student-001"},
        "therapistId": {"S": "therapist-001"},
        "date": {"S": "2024-03-25"},
        "time": {"S": "10:00 AM"},
        "status": {"S": "scheduled"},
        "type": {"S": "In-person"},
        "notes": {"S": "Initial consultation"},
        "createdAt": {"S": "2024-03-20T15:30:00Z"}
    }' \
    --region $REGION 2>/dev/null || true

aws dynamodb put-item \
    --table-name appointments \
    --item '{
        "appointmentId": {"S": "apt-002"},
        "userId": {"S": "student-002"},
        "therapistId": {"S": "therapist-001"},
        "date": {"S": "2024-03-25"},
        "time": {"S": "2:00 PM"},
        "status": {"S": "scheduled"},
        "type": {"S": "Virtual"},
        "notes": {"S": "Follow-up session"},
        "createdAt": {"S": "2024-03-21T09:15:00Z"}
    }' \
    --region $REGION 2>/dev/null || true

aws dynamodb put-item \
    --table-name appointments \
    --item '{
        "appointmentId": {"S": "apt-003"},
        "userId": {"S": "student-001"},
        "therapistId": {"S": "therapist-001"},
        "date": {"S": "2024-03-22"},
        "time": {"S": "3:00 PM"},
        "status": {"S": "completed"},
        "type": {"S": "In-person"},
        "notes": {"S": "Stress management session"},
        "createdAt": {"S": "2024-03-15T11:00:00Z"}
    }' \
    --region $REGION 2>/dev/null || true

echo -e "${GREEN}✅ Appointments table seeded${NC}"

# ===========================================
# SEED EDUCATIONAL MATERIALS TABLE (Figure 55)
# ===========================================
echo -e "${BLUE}📚 Seeding Educational Materials Table...${NC}"

aws dynamodb put-item \
    --table-name educational-materials \
    --item '{
        "materialId": {"S": "mat-001"},
        "category": {"S": "Stress Management"},
        "title": {"S": "10 Ways to Manage College Stress"},
        "description": {"S": "A comprehensive guide to managing stress during college years"},
        "type": {"S": "Article"},
        "url": {"S": "https://collegesafe.edu/resources/stress-management"},
        "createdAt": {"S": "2024-01-15T10:00:00Z"},
        "author": {"S": "Dr. Sarah Wilson"}
    }' \
    --region $REGION 2>/dev/null || true

aws dynamodb put-item \
    --table-name educational-materials \
    --item '{
        "materialId": {"S": "mat-002"},
        "category": {"S": "Mental Health"},
        "title": {"S": "Understanding Anxiety in Students"},
        "description": {"S": "Learn about anxiety symptoms and coping strategies"},
        "type": {"S": "Video"},
        "url": {"S": "https://collegesafe.edu/videos/understanding-anxiety"},
        "duration": {"S": "15:30"},
        "createdAt": {"S": "2024-02-01T14:30:00Z"},
        "author": {"S": "Mental Health Team"}
    }' \
    --region $REGION 2>/dev/null || true

aws dynamodb put-item \
    --table-name educational-materials \
    --item '{
        "materialId": {"S": "mat-003"},
        "category": {"S": "Self-Care"},
        "title": {"S": "Daily Self-Care Checklist"},
        "description": {"S": "A downloadable PDF checklist for daily self-care activities"},
        "type": {"S": "PDF"},
        "url": {"S": "https://collegesafe.edu/downloads/self-care-checklist.pdf"},
        "createdAt": {"S": "2024-02-10T09:00:00Z"},
        "author": {"S": "Wellness Center"}
    }' \
    --region $REGION 2>/dev/null || true

echo -e "${GREEN}✅ Educational Materials table seeded${NC}"

# ===========================================
# SEED SESSIONS TABLE
# ===========================================
echo -e "${BLUE}🔐 Seeding Sessions Table...${NC}"

aws dynamodb put-item \
    --table-name sessions \
    --item '{
        "sessionId": {"S": "sess-001"},
        "userId": {"S": "student-001"},
        "token": {"S": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"},
        "expiresAt": {"S": "2024-03-26T10:00:00Z"},
        "createdAt": {"S": "2024-03-25T10:00:00Z"},
        "ipAddress": {"S": "192.168.1.100"}
    }' \
    --region $REGION 2>/dev/null || true

echo -e "${GREEN}✅ Sessions table seeded${NC}"

# ===========================================
# SEED MESSAGES TABLE
# ===========================================
echo -e "${BLUE}💬 Seeding Messages Table...${NC}"

aws dynamodb put-item \
    --table-name messages \
    --item '{
        "messageId": {"S": "msg-001"},
        "timestamp": {"N": "1711368000"},
        "fromUserId": {"S": "student-001"},
        "toUserId": {"S": "therapist-001"},
        "subject": {"S": "Appointment Confirmation"},
        "message": {"S": "Thank you for scheduling my appointment. Looking forward to our session."},
        "status": {"S": "read"},
        "type": {"S": "appointment"}
    }' \
    --region $REGION 2>/dev/null || true

aws dynamodb put-item \
    --table-name messages \
    --item '{
        "messageId": {"S": "msg-002"},
        "timestamp": {"N": "1711368600"},
        "fromUserId": {"S": "therapist-001"},
        "toUserId": {"S": "student-001"},
        "subject": {"S": "Re: Appointment Confirmation"},
        "message": {"S": "You are welcome! See you at the scheduled time."},
        "status": {"S": "read"},
        "type": {"S": "appointment"}
    }' \
    --region $REGION 2>/dev/null || true

echo -e "${GREEN}✅ Messages table seeded${NC}"

# ===========================================
# SEED THERAPISTS TABLE
# ===========================================
echo -e "${BLUE}👨‍⚕️ Seeding Therapists Table...${NC}"

aws dynamodb put-item \
    --table-name therapists \
    --item '{
        "therapistId": {"S": "therapist-001"},
        "specialization": {"S": "Anxiety and Depression"},
        "name": {"S": "Dr. Sarah Wilson"},
        "credentials": {"S": "Ph.D., Licensed Clinical Psychologist"},
        "availability": {"S": "Monday-Friday, 9AM-5PM"},
        "bio": {"S": "10 years of experience in student mental health"},
        "rating": {"N": "4.8"},
        "totalSessions": {"N": "250"}
    }' \
    --region $REGION 2>/dev/null || true

aws dynamodb put-item \
    --table-name therapists \
    --item '{
        "therapistId": {"S": "therapist-002"},
        "specialization": {"S": "Stress Management"},
        "name": {"S": "Dr. Michael Chen"},
        "credentials": {"S": "M.D., Psychiatrist"},
        "availability": {"S": "Tuesday-Thursday, 10AM-6PM"},
        "bio": {"S": "Specializing in stress and trauma counseling"},
        "rating": {"N": "4.9"},
        "totalSessions": {"N": "180"}
    }' \
    --region $REGION 2>/dev/null || true

echo -e "${GREEN}✅ Therapists table seeded${NC}"

# ===========================================
# SEED EMERGENCY CONTACTS TABLE
# ===========================================
echo -e "${BLUE}🚨 Seeding Emergency Contacts Table...${NC}"

aws dynamodb put-item \
    --table-name emergency-contacts \
    --item '{
        "contactId": {"S": "contact-001"},
        "userId": {"S": "student-001"},
        "name": {"S": "John Doe Sr."},
        "relationship": {"S": "Father"},
        "phone": {"S": "+1234567892"},
        "email": {"S": "john.doe.sr@email.com"},
        "isPrimary": {"BOOL": true}
    }' \
    --region $REGION 2>/dev/null || true

echo -e "${GREEN}✅ Emergency Contacts table seeded${NC}"

echo ""
echo "=================================================="
echo -e "${GREEN}✅ ALL TABLES SEEDED WITH SAMPLE DATA${NC}"
echo "=================================================="
echo ""

# Display table item counts
echo -e "${BLUE}📊 Table Statistics:${NC}"
echo "----------------------------"

for table in users appointments educational-materials sessions messages therapists emergency-contacts; do
    if aws dynamodb describe-table --table-name $table --region $REGION >/dev/null 2>&1; then
        COUNT=$(aws dynamodb scan --table-name $table --select COUNT --region $REGION --query 'Count' --output text 2>/dev/null || echo "0")
        echo -e "${GREEN}✅ $table: $COUNT items${NC}"
    fi
done

echo ""
echo -e "${YELLOW}📸 Tables are ready for screenshots!${NC}"
echo -e "View them at: https://$REGION.console.aws.amazon.com/dynamodbv2/home?region=$REGION#tables"

