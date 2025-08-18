#!/bin/bash

# Create DynamoDB Tables for College Safe Application
set -e

echo "=================================================="
echo "🗄️  CREATING DYNAMODB TABLES FOR COLLEGE SAFE"
echo "=================================================="
echo ""

REGION=$(aws configure get region || echo "ap-southeast-2")

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Function to create table
create_table() {
    local TABLE_NAME=$1
    local PARTITION_KEY=$2
    local PARTITION_KEY_TYPE=$3
    local SORT_KEY=$4
    local SORT_KEY_TYPE=$5
    
    echo -e "${BLUE}Creating table: $TABLE_NAME${NC}"
    
    # Check if table already exists
    if aws dynamodb describe-table --table-name $TABLE_NAME --region $REGION >/dev/null 2>&1; then
        echo -e "${YELLOW}Table $TABLE_NAME already exists, skipping...${NC}"
        return
    fi
    
    # Build the key schema
    KEY_SCHEMA="AttributeName=$PARTITION_KEY,KeyType=HASH"
    ATTRIBUTE_DEFINITIONS="AttributeName=$PARTITION_KEY,AttributeType=$PARTITION_KEY_TYPE"
    
    if [ ! -z "$SORT_KEY" ]; then
        KEY_SCHEMA="$KEY_SCHEMA AttributeName=$SORT_KEY,KeyType=RANGE"
        ATTRIBUTE_DEFINITIONS="$ATTRIBUTE_DEFINITIONS AttributeName=$SORT_KEY,AttributeType=$SORT_KEY_TYPE"
    fi
    
    # Create the table
    aws dynamodb create-table \
        --table-name $TABLE_NAME \
        --key-schema $KEY_SCHEMA \
        --attribute-definitions $ATTRIBUTE_DEFINITIONS \
        --billing-mode PAY_PER_REQUEST \
        --region $REGION \
        --output json > /dev/null
    
    echo -e "${GREEN}✅ Table $TABLE_NAME created successfully${NC}"
    
    # Wait for table to be active
    echo -e "   Waiting for table to be active..."
    aws dynamodb wait table-exists --table-name $TABLE_NAME --region $REGION
    echo -e "${GREEN}   Table is now active${NC}"
}

# ===========================================
# CREATE TABLES
# ===========================================

echo -e "${BLUE}📋 Creating DynamoDB Tables...${NC}"
echo ""

# 1. Users Table (Figure 56)
create_table "users" "userId" "S" "email" "S"

# 2. Appointments Table (Figure 54)
create_table "appointments" "appointmentId" "S" "userId" "S"

# 3. Educational Materials Table (Figure 55)
create_table "educational-materials" "materialId" "S" "category" "S"

# 4. Sessions Table
create_table "sessions" "sessionId" "S" "userId" "S"

# 5. Messages Table
create_table "messages" "messageId" "S" "timestamp" "N"

# 6. Therapists Table (optional)
create_table "therapists" "therapistId" "S" "specialization" "S"

# 7. Emergency Contacts Table (optional)
create_table "emergency-contacts" "contactId" "S" "userId" "S"

echo ""
echo -e "${BLUE}📊 Tables Created Summary:${NC}"
echo "----------------------------"

# List all tables
TABLES=$(aws dynamodb list-tables --region $REGION --query 'TableNames[]' --output text)
for table in $TABLES; do
    if [[ $table == *"users"* ]] || [[ $table == *"appointments"* ]] || [[ $table == *"educational-materials"* ]] || [[ $table == *"sessions"* ]] || [[ $table == *"messages"* ]] || [[ $table == *"therapists"* ]] || [[ $table == *"emergency-contacts"* ]]; then
        echo -e "${GREEN}✅ $table${NC}"
    fi
done

echo ""
echo "=================================================="
echo -e "${GREEN}✅ ALL TABLES CREATED SUCCESSFULLY${NC}"
echo "=================================================="
echo ""
echo -e "${YELLOW}Next Step: Run ./seed-dynamodb-data.sh to add sample data${NC}"

