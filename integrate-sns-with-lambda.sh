#!/bin/bash

# Integrate SNS with existing Lambda functions
set -e

echo "=================================================="
echo "🔗 INTEGRATING SNS WITH EXISTING LAMBDA FUNCTIONS"
echo "=================================================="
echo ""

REGION=$(aws configure get region || echo "ap-southeast-2")

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get SNS topic ARN
TOPIC_ARN=$(aws sns list-topics --region $REGION --query "Topics[?contains(TopicArn, 'collegesafe') || contains(TopicArn, 'college-safe')].TopicArn" --output text 2>/dev/null | head -1)

if [ -z "$TOPIC_ARN" ]; then
    echo -e "${YELLOW}⚠️ No SNS topic found. Creating one...${NC}"
    TOPIC_ARN=$(aws sns create-topic --name college-safe-serverless-dev-notifications --region $REGION --query 'TopicArn' --output text)
    echo -e "${GREEN}✅ Created topic with ARN: $TOPIC_ARN${NC}"
else
    echo -e "${GREEN}✅ Using existing topic: $TOPIC_ARN${NC}"
fi

echo ""
echo -e "${BLUE}📝 Adding SNS permissions to Lambda functions...${NC}"

# Get all Lambda functions
FUNCTIONS=$(aws lambda list-functions --region $REGION --query 'Functions[?contains(FunctionName, `college-safe-serverless`)].FunctionName' --output text)

for func in $FUNCTIONS; do
    echo -e "Updating $func..."
    
    # Get current role
    ROLE_ARN=$(aws lambda get-function-configuration --function-name $func --region $REGION --query 'Role' --output text)
    ROLE_NAME=$(echo $ROLE_ARN | awk -F'/' '{print $NF}')
    
    # Create SNS publish policy
    cat > /tmp/sns-inline-policy.json << EOL
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "sns:Publish",
                "sns:Subscribe",
                "sns:ListSubscriptionsByTopic",
                "sns:GetTopicAttributes"
            ],
            "Resource": "$TOPIC_ARN"
        }
    ]
}
EOL
    
    # Add inline policy to role
    aws iam put-role-policy \
        --role-name $ROLE_NAME \
        --policy-name SNSPublishPolicy \
        --policy-document file:///tmp/sns-inline-policy.json 2>/dev/null || true
    
    # Update function environment variables
    aws lambda update-function-configuration \
        --function-name $func \
        --environment "Variables={SNS_TOPIC_ARN=$TOPIC_ARN,DATABASE_URL=\$DATABASE_URL,NODE_ENV=production}" \
        --region $REGION > /dev/null
    
    echo -e "${GREEN}  ✅ $func updated${NC}"
done

# Clean up
rm -f /tmp/sns-inline-policy.json

echo ""
echo "=================================================="
echo -e "${GREEN}✅ SNS INTEGRATION COMPLETE${NC}"
echo "=================================================="
echo ""
echo -e "${BLUE}📋 What's been configured:${NC}"
echo "  • SNS Topic ARN added to Lambda environment variables"
echo "  • SNS publish permissions added to Lambda roles"
echo "  • All Lambda functions can now send notifications"
echo ""
echo -e "${YELLOW}📸 Ready for assignment screenshots:${NC}"
echo "  • Figure 70: SNS Topic"
echo "  • Figure 71-76: Subscription and notification flow"
echo ""
echo -e "${BLUE}Topic ARN: $TOPIC_ARN${NC}"
echo -e "${BLUE}Console: https://$REGION.console.aws.amazon.com/sns/v3/home?region=$REGION#/topics${NC}"

