#!/bin/bash

# Setup SNS for CollegeSafe Notifications
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

# ===========================================
# CHECK EXISTING SNS TOPIC
# ===========================================
echo -e "${BLUE}🔍 Checking existing SNS topics...${NC}"

EXISTING_TOPIC=$(aws sns list-topics --region $REGION --query "Topics[?contains(TopicArn, 'college-safe')].TopicArn" --output text 2>/dev/null | head -1)

if [ ! -z "$EXISTING_TOPIC" ]; then
    TOPIC_ARN=$EXISTING_TOPIC
    TOPIC_NAME=$(echo $TOPIC_ARN | awk -F: '{print $NF}')
    echo -e "${GREEN}✅ Found existing topic: $TOPIC_NAME${NC}"
else
    # Create new SNS topic
    echo -e "${BLUE}📮 Creating new SNS topic...${NC}"
    TOPIC_NAME="collegesafe-appointment-notifications"
    TOPIC_ARN=$(aws sns create-topic --name $TOPIC_NAME --region $REGION --query 'TopicArn' --output text)
    echo -e "${GREEN}✅ Created topic: $TOPIC_NAME${NC}"
fi

echo -e "   Topic ARN: $TOPIC_ARN"
echo ""

# ===========================================
# SET TOPIC ATTRIBUTES
# ===========================================
echo -e "${BLUE}⚙️ Configuring topic attributes...${NC}"

# Set display name
aws sns set-topic-attributes \
    --topic-arn $TOPIC_ARN \
    --attribute-name DisplayName \
    --attribute-value "CollegeSafe Notifications" \
    --region $REGION

echo -e "${GREEN}✅ Display name set${NC}"

# ===========================================
# CREATE SNS ACCESS POLICY
# ===========================================
echo -e "${BLUE}🔐 Setting topic access policy...${NC}"

cat > /tmp/sns-policy.json << EOL
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowLambdaToPublish",
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": [
        "SNS:Publish",
        "SNS:Subscribe"
      ],
      "Resource": "$TOPIC_ARN"
    },
    {
      "Sid": "AllowAccountOwner",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::$ACCOUNT_ID:root"
      },
      "Action": "SNS:*",
      "Resource": "$TOPIC_ARN"
    }
  ]
}
EOL

aws sns set-topic-attributes \
    --topic-arn $TOPIC_ARN \
    --attribute-name Policy \
    --attribute-value file:///tmp/sns-policy.json \
    --region $REGION

echo -e "${GREEN}✅ Access policy configured${NC}"
echo ""

# ===========================================
# CHECK EXISTING SUBSCRIPTIONS
# ===========================================
echo -e "${BLUE}📧 Checking existing subscriptions...${NC}"

SUBSCRIPTIONS=$(aws sns list-subscriptions-by-topic --topic-arn $TOPIC_ARN --region $REGION --query 'Subscriptions[].Endpoint' --output text 2>/dev/null)

if [ ! -z "$SUBSCRIPTIONS" ]; then
    echo -e "${YELLOW}Existing subscriptions found:${NC}"
    echo "$SUBSCRIPTIONS" | while read sub; do
        echo "  • $sub"
    done
else
    echo -e "${YELLOW}No existing subscriptions found${NC}"
fi

echo ""

# ===========================================
# ADD EMAIL SUBSCRIPTION
# ===========================================
echo -e "${BLUE}📧 Adding email subscription...${NC}"
echo ""
echo -e "${YELLOW}Would you like to add an email subscription for testing? (y/n)${NC}"
read -r ADD_EMAIL

if [[ "$ADD_EMAIL" == "y" || "$ADD_EMAIL" == "Y" ]]; then
    echo -e "${YELLOW}Enter email address for notifications:${NC}"
    read -r EMAIL_ADDRESS
    
    if [ ! -z "$EMAIL_ADDRESS" ]; then
        # Subscribe email
        SUBSCRIPTION_ARN=$(aws sns subscribe \
            --topic-arn $TOPIC_ARN \
            --protocol email \
            --notification-endpoint "$EMAIL_ADDRESS" \
            --region $REGION \
            --query 'SubscriptionArn' \
            --output text)
        
        echo -e "${GREEN}✅ Subscription request sent to: $EMAIL_ADDRESS${NC}"
        echo -e "${YELLOW}⚠️ Please check your email and confirm the subscription${NC}"
        echo ""
    fi
fi

# ===========================================
# CREATE LAMBDA FUNCTION FOR SNS INTEGRATION
# ===========================================
echo -e "${BLUE}🔧 Creating Lambda function for SNS integration...${NC}"

# Create Lambda function code
cat > /tmp/sns-lambda.py << 'EOL'
import json
import boto3
import os
from datetime import datetime

sns_client = boto3.client('sns')
TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')

def lambda_handler(event, context):
    """
    Handle appointment notifications via SNS
    """
    try:
        # Parse the event
        body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event.get('body', {})
        
        # Extract notification details
        notification_type = body.get('type', 'appointment')
        user_name = body.get('userName', 'Student')
        counsellor_name = body.get('counsellorName', 'Counsellor')
        appointment_date = body.get('date', datetime.now().strftime('%Y-%m-%d'))
        appointment_time = body.get('time', '10:00 AM')
        action = body.get('action', 'scheduled')
        
        # Create message based on action
        if action == 'scheduled':
            subject = "Appointment Scheduled - CollegeSafe"
            message = f"""
Dear {user_name},

Your counselling appointment has been successfully scheduled.

Details:
- Counsellor: {counsellor_name}
- Date: {appointment_date}
- Time: {appointment_time}
- Type: {notification_type.title()}

Please make sure to attend your appointment on time. If you need to reschedule, please contact us at least 24 hours in advance.

Best regards,
CollegeSafe Mental Health Support Team
            """
        elif action == 'cancelled':
            subject = "Appointment Cancelled - CollegeSafe"
            message = f"""
Dear {user_name},

Your counselling appointment has been cancelled.

Details:
- Counsellor: {counsellor_name}
- Date: {appointment_date}
- Time: {appointment_time}

If you would like to reschedule, please visit our booking system or contact support.

Best regards,
CollegeSafe Mental Health Support Team
            """
        elif action == 'reminder':
            subject = "Appointment Reminder - CollegeSafe"
            message = f"""
Dear {user_name},

This is a reminder about your upcoming counselling appointment.

Details:
- Counsellor: {counsellor_name}
- Date: {appointment_date}
- Time: {appointment_time}

Please arrive 5 minutes early for your appointment.

Best regards,
CollegeSafe Mental Health Support Team
            """
        else:
            subject = "CollegeSafe Notification"
            message = body.get('message', 'You have a new notification from CollegeSafe.')
        
        # Publish to SNS
        response = sns_client.publish(
            TopicArn=TOPIC_ARN,
            Subject=subject,
            Message=message
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Notification sent successfully',
                'messageId': response['MessageId']
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Failed to send notification',
                'details': str(e)
            })
        }
EOL

# Create Lambda deployment package
cd /tmp
zip sns-lambda.zip sns-lambda.py
cd - > /dev/null

# Check if Lambda function exists
FUNCTION_NAME="collegesafe-sns-notifications"
EXISTING_FUNCTION=$(aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>/dev/null)

if [ -z "$EXISTING_FUNCTION" ]; then
    echo -e "${BLUE}Creating Lambda function...${NC}"
    
    # Create IAM role for Lambda
    ROLE_NAME="collegesafe-sns-lambda-role"
    
    # Check if role exists
    EXISTING_ROLE=$(aws iam get-role --role-name $ROLE_NAME 2>/dev/null)
    
    if [ -z "$EXISTING_ROLE" ]; then
        # Create trust policy
        cat > /tmp/trust-policy.json << EOL
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOL
        
        # Create role
        aws iam create-role \
            --role-name $ROLE_NAME \
            --assume-role-policy-document file:///tmp/trust-policy.json \
            --description "Role for CollegeSafe SNS Lambda function" > /dev/null
        
        # Attach policies
        aws iam attach-role-policy \
            --role-name $ROLE_NAME \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        
        # Create and attach SNS publish policy
        cat > /tmp/sns-policy.json << EOL
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish",
        "sns:GetTopicAttributes",
        "sns:ListSubscriptionsByTopic"
      ],
      "Resource": "$TOPIC_ARN"
    }
  ]
}
EOL
        
        aws iam put-role-policy \
            --role-name $ROLE_NAME \
            --policy-name SNSPublishPolicy \
            --policy-document file:///tmp/sns-policy.json
        
        echo -e "${GREEN}✅ IAM role created${NC}"
        sleep 10  # Wait for role to propagate
    fi
    
    ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME"
    
    # Create Lambda function
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime python3.9 \
        --role $ROLE_ARN \
        --handler sns-lambda.lambda_handler \
        --zip-file fileb:///tmp/sns-lambda.zip \
        --description "CollegeSafe SNS notification handler" \
        --timeout 30 \
        --memory-size 256 \
        --environment "Variables={SNS_TOPIC_ARN=$TOPIC_ARN}" \
        --region $REGION > /dev/null
    
    echo -e "${GREEN}✅ Lambda function created${NC}"
else
    echo -e "${BLUE}Updating existing Lambda function...${NC}"
    
    # Update function code
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb:///tmp/sns-lambda.zip \
        --region $REGION > /dev/null
    
    # Update environment variables
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --environment "Variables={SNS_TOPIC_ARN=$TOPIC_ARN}" \
        --region $REGION > /dev/null
    
    echo -e "${GREEN}✅ Lambda function updated${NC}"
fi

# Clean up temp files
rm -f /tmp/sns-lambda.py /tmp/sns-lambda.zip /tmp/trust-policy.json /tmp/sns-policy.json

echo ""
echo "=================================================="
echo -e "${GREEN}✅ SNS SETUP COMPLETE${NC}"
echo "=================================================="
echo ""
echo -e "${BLUE}📋 Resources Created/Configured:${NC}"
echo "  • SNS Topic: $TOPIC_NAME"
echo "  • Topic ARN: $TOPIC_ARN"
echo "  • Lambda Function: $FUNCTION_NAME"
echo ""
echo -e "${BLUE}🔗 Console Links:${NC}"
echo "  • SNS Topic: https://$REGION.console.aws.amazon.com/sns/v3/home?region=$REGION#/topic/$TOPIC_ARN"
echo "  • Lambda Function: https://$REGION.console.aws.amazon.com/lambda/home?region=$REGION#/functions/$FUNCTION_NAME"
echo ""
echo -e "${YELLOW}📸 Ready for Screenshots:${NC}"
echo "  • Figure 70: SNS Topic created"
echo "  • Figure 71-72: Email subscriptions"
echo "  • Figure 73-76: Notification testing"
echo ""
echo -e "${BLUE}Next: Run ./test-sns-notifications.sh to send test notifications${NC}"

