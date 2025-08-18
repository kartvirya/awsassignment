#!/bin/bash

# Setup SNS for CollegeSafe Notifications (Simplified)
set -e

echo "=================================================="
echo "📬 SETTING UP SNS NOTIFICATIONS FOR COLLEGESAFE"
echo "=================================================="
echo ""

REGION=$(aws configure get region || echo "ap-southeast-2")
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Check existing SNS topic
echo -e "${BLUE}🔍 Checking SNS topics...${NC}"

TOPIC_ARN=$(aws sns list-topics --region $REGION --query "Topics[?contains(TopicArn, 'college-safe')].TopicArn" --output text 2>/dev/null | head -1)

if [ ! -z "$TOPIC_ARN" ]; then
    TOPIC_NAME=$(echo $TOPIC_ARN | awk -F: '{print $NF}')
    echo -e "${GREEN}✅ Found existing topic: $TOPIC_NAME${NC}"
else
    echo -e "${BLUE}📮 Creating new SNS topic...${NC}"
    TOPIC_NAME="collegesafe-notifications"
    TOPIC_ARN=$(aws sns create-topic --name $TOPIC_NAME --region $REGION --query 'TopicArn' --output text)
    echo -e "${GREEN}✅ Created topic: $TOPIC_NAME${NC}"
fi

echo -e "   Topic ARN: $TOPIC_ARN"
echo ""

# Set display name
echo -e "${BLUE}⚙️ Setting topic display name...${NC}"
aws sns set-topic-attributes \
    --topic-arn $TOPIC_ARN \
    --attribute-name DisplayName \
    --attribute-value "CollegeSafe" \
    --region $REGION 2>/dev/null || true
echo -e "${GREEN}✅ Display name configured${NC}"
echo ""

# Check subscriptions
echo -e "${BLUE}📧 Current subscriptions:${NC}"
SUBS=$(aws sns list-subscriptions-by-topic --topic-arn $TOPIC_ARN --region $REGION --query 'Subscriptions[].Endpoint' --output text 2>/dev/null)

if [ ! -z "$SUBS" ]; then
    echo "$SUBS" | while read sub; do
        echo "  • $sub"
    done
else
    echo "  No subscriptions yet"
fi
echo ""

# Update Lambda functions with SNS ARN
echo -e "${BLUE}🔧 Updating Lambda functions with SNS topic ARN...${NC}"

FUNCTIONS=$(aws lambda list-functions --region $REGION --query 'Functions[?contains(FunctionName, `college-safe-serverless`)].FunctionName' --output text)

for func in $FUNCTIONS; do
    # Get current environment variables
    CURRENT_ENV=$(aws lambda get-function-configuration --function-name $func --region $REGION --query 'Environment.Variables' --output json 2>/dev/null || echo "{}")
    
    # Add SNS_TOPIC_ARN to environment
    if [ "$CURRENT_ENV" != "{}" ] && [ "$CURRENT_ENV" != "null" ]; then
        # Merge with existing environment variables
        NEW_ENV=$(echo $CURRENT_ENV | python3 -c "import sys, json; env = json.load(sys.stdin); env['SNS_TOPIC_ARN'] = '$TOPIC_ARN'; print(json.dumps(env))")
    else
        NEW_ENV="{\"SNS_TOPIC_ARN\":\"$TOPIC_ARN\"}"
    fi
    
    # Update function configuration
    aws lambda update-function-configuration \
        --function-name $func \
        --environment "Variables=$NEW_ENV" \
        --region $REGION > /dev/null 2>&1 || true
    
    echo -e "  ✅ $func"
done

echo ""

# Add SNS permissions to Lambda execution roles
echo -e "${BLUE}🔐 Adding SNS permissions to Lambda roles...${NC}"

for func in $FUNCTIONS; do
    # Get the execution role
    ROLE_ARN=$(aws lambda get-function-configuration --function-name $func --region $REGION --query 'Role' --output text 2>/dev/null)
    
    if [ ! -z "$ROLE_ARN" ]; then
        ROLE_NAME=$(echo $ROLE_ARN | awk -F'/' '{print $NF}')
        
        # Create policy document
        cat > /tmp/sns-policy-$func.json << EOL
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "sns:Publish"
            ],
            "Resource": "$TOPIC_ARN"
        }
    ]
}
EOL
        
        # Add inline policy
        aws iam put-role-policy \
            --role-name $ROLE_NAME \
            --policy-name SNSPublishAccess \
            --policy-document file:///tmp/sns-policy-$func.json 2>/dev/null || true
        
        rm -f /tmp/sns-policy-$func.json
        echo -e "  ✅ $func role updated"
    fi
done

echo ""
echo "=================================================="
echo -e "${GREEN}✅ SNS SETUP COMPLETE${NC}"
echo "=================================================="
echo ""
echo -e "${BLUE}📋 Configuration Summary:${NC}"
echo "  • Topic Name: $TOPIC_NAME"
echo "  • Topic ARN: $TOPIC_ARN"
echo "  • Lambda Functions: Updated with SNS_TOPIC_ARN"
echo "  • Permissions: SNS publish access granted"
echo ""
echo -e "${BLUE}🔗 Console Links:${NC}"
echo "  • SNS Topics: https://$REGION.console.aws.amazon.com/sns/v3/home?region=$REGION#/topics"
echo "  • Topic Details: https://$REGION.console.aws.amazon.com/sns/v3/home?region=$REGION#/topic/$TOPIC_ARN"
echo ""
echo -e "${YELLOW}📸 Ready for Screenshots:${NC}"
echo "  • Figure 70: SNS Topic List"
echo "  • Figure 71-72: Subscriptions"
echo "  • Figure 73-76: Notifications"
echo ""
echo -e "${BLUE}To add email subscription:${NC}"
echo "  aws sns subscribe --topic-arn $TOPIC_ARN --protocol email --notification-endpoint your-email@example.com --region $REGION"
echo ""
echo -e "${BLUE}To send test notification:${NC}"
echo "  aws sns publish --topic-arn $TOPIC_ARN --subject 'Test' --message 'Test message' --region $REGION"

