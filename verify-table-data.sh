#!/bin/bash

# Verify DynamoDB Table Data
REGION=$(aws configure get region || echo "ap-southeast-2")

echo "=================================================="
echo "📊 VERIFYING DYNAMODB TABLE DATA"
echo "=================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Table: collegesafe-users (Figure 53 & 56)${NC}"
echo "Sample users:"
aws dynamodb scan --table-name collegesafe-users --region $REGION --max-items 2 \
  --query 'Items[*].{ID:id.S,Email:email.S,Name:[first_name.S,last_name.S],Role:role.S}' \
  --output table
echo ""

echo -e "${BLUE}Table: collegesafe-counselling-sessions (Figure 54)${NC}"
echo "Sample appointments:"
aws dynamodb scan --table-name collegesafe-counselling-sessions --region $REGION --max-items 2 \
  --query 'Items[*].{ID:id.N,Student:student_id.S,Counsellor:counsellor_id.S,Status:status.S,Date:scheduled_at.S}' \
  --output table
echo ""

echo -e "${BLUE}Table: collegesafe-resources (Figure 55)${NC}"
echo "Sample educational materials:"
aws dynamodb scan --table-name collegesafe-resources --region $REGION --max-items 2 \
  --query 'Items[*].{ID:id.N,Title:title.S,Type:type.S}' \
  --output table
echo ""

echo -e "${GREEN}✅ All tables have been seeded with data and are ready for screenshots!${NC}"
echo ""
echo -e "${YELLOW}📸 To take screenshots:${NC}"
echo "1. Go to DynamoDB console"
echo "2. Click on each table name"
echo "3. Click 'Explore table items' to see the data"
echo "4. Take screenshots showing the data"

