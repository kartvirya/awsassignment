#!/bin/bash

# Create DynamoDB Tables for CollegeSafe Application
# Based on actual database migration schema

set -e

echo "=================================================="
echo "🗄️  CREATING DYNAMODB TABLES FOR COLLEGESAFE"
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
# CREATE TABLES BASED ON MIGRATION SCHEMA
# ===========================================

echo -e "${BLUE}📋 Creating DynamoDB Tables based on CollegeSafe schema...${NC}"
echo ""

# 1. Users Table (from migration: users table)
echo -e "${YELLOW}Creating Users table...${NC}"
create_table "collegesafe-users" "id" "S" "email" "S"

# 2. Resources Table (from migration: resources table)
echo -e "${YELLOW}Creating Resources table...${NC}"
create_table "collegesafe-resources" "id" "N" "" ""

# 3. Counselling Sessions Table (from migration: counselling_sessions table)
echo -e "${YELLOW}Creating Counselling Sessions table...${NC}"
create_table "collegesafe-counselling-sessions" "id" "N" "scheduled_at" "S"

# 4. Messages Table (from migration: messages table)
echo -e "${YELLOW}Creating Messages table...${NC}"
create_table "collegesafe-messages" "id" "N" "created_at" "S"

# 5. User Progress Table (from migration: user_progress table)
echo -e "${YELLOW}Creating User Progress table...${NC}"
create_table "collegesafe-user-progress" "user_id" "S" "resource_id" "N"

# 6. Sessions Table for authentication (from migration: sessions table)
echo -e "${YELLOW}Creating Sessions table...${NC}"
create_table "collegesafe-sessions" "sid" "S" "" ""

echo ""
echo -e "${BLUE}📊 Tables Created Summary:${NC}"
echo "----------------------------"

# List all tables
TABLES=$(aws dynamodb list-tables --region $REGION --query 'TableNames[]' --output text)
for table in $TABLES; do
    if [[ $table == *"collegesafe"* ]]; then
        echo -e "${GREEN}✅ $table${NC}"
    fi
done

echo ""
echo "=================================================="
echo -e "${GREEN}✅ ALL TABLES CREATED SUCCESSFULLY${NC}"
echo "=================================================="
echo ""
echo -e "${YELLOW}Tables match your database migration schema:${NC}"
echo "  • collegesafe-users (users table)"
echo "  • collegesafe-resources (resources table)"
echo "  • collegesafe-counselling-sessions (counselling_sessions table)"
echo "  • collegesafe-messages (messages table)"
echo "  • collegesafe-user-progress (user_progress table)"
echo "  • collegesafe-sessions (sessions table for auth)"
echo ""
echo -e "${YELLOW}Next Step: Run ./seed-collegesafe-data.sh to add sample data${NC}"

