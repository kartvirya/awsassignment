#!/bin/bash

# Test SNS Notifications for CollegeSafe
set -e

echo "=================================================="
echo "🧪 TESTING SNS NOTIFICATIONS"
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

# Get SNS topic ARN
TOPIC_ARN=$(aws sns list-topics --region $REGION --query "Topics[?contains(TopicArn, 'collegesafe-appointment-notifications')].TopicArn" --output text 2>/dev/null | head -1)

if [ -z "$TOPIC_ARN" ]; then
    echo -e "${RED}❌ SNS topic not found. Please run ./setup-sns-notifications.sh first${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Using SNS Topic: $TOPIC_ARN${NC}"
echo ""

# Function to test Lambda notification
test_lambda_notification() {
    local action=$1
    local description=$2
    
    echo -e "${BLUE}Testing: $description${NC}"
    
    FUNCTION_NAME="collegesafe-sns-notifications"
    
    # Create test payload
    if [ "$action" == "scheduled" ]; then
        PAYLOAD=$(cat <<EOL
{
  "body": {
    "type": "individual",
    "userName": "John Doe",
    "counsellorName": "Dr. Jane Smith",
    "date": "2024-03-25",
    "time": "10:00 AM",
    "action": "scheduled"
  }
}
EOL
        )
    elif [ "$action" == "cancelled" ]; then
        PAYLOAD=$(cat <<EOL
{
  "body": {
    "type": "individual",
    "userName": "John Doe",
    "counsellorName": "Dr. Jane Smith",
    "date": "2024-03-25",
    "time": "10:00 AM",
    "action": "cancelled"
  }
}
EOL
        )
    elif [ "$action" == "reminder" ]; then
        PAYLOAD=$(cat <<EOL
{
  "body": {
    "type": "individual",
    "userName": "Jane Wilson",
    "counsellorName": "Dr. Jane Smith",
    "date": "2024-03-26",
    "time": "2:00 PM",
    "action": "reminder"
  }
}
EOL
        )
    fi
    
    # Invoke Lambda function
    RESPONSE=$(aws lambda invoke \
        --function-name $FUNCTION_NAME \
        --payload "$(echo $PAYLOAD | base64)" \
        --region $REGION \
        /tmp/lambda-response.json 2>&1)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Notification sent successfully${NC}"
        cat /tmp/lambda-response.json | python3 -m json.tool 2>/dev/null || cat /tmp/lambda-response.json
    else
        echo -e "${RED}❌ Failed to send notification${NC}"
    fi
    
    echo ""
}

# Function to send direct SNS message
send_direct_message() {
    local subject=$1
    local message=$2
    
    echo -e "${BLUE}Sending direct SNS message...${NC}"
    
    MESSAGE_ID=$(aws sns publish \
        --topic-arn $TOPIC_ARN \
        --subject "$subject" \
        --message "$message" \
        --region $REGION \
        --query 'MessageId' \
        --output text)
    
    if [ ! -z "$MESSAGE_ID" ]; then
        echo -e "${GREEN}✅ Message sent successfully (ID: $MESSAGE_ID)${NC}"
    else
        echo -e "${RED}❌ Failed to send message${NC}"
    fi
    echo ""
}

# Main menu
while true; do
    echo -e "${YELLOW}Select notification type to test:${NC}"
    echo "1. Appointment Scheduled (Figure 73-74)"
    echo "2. Appointment Cancelled (Figure 75-76)"
    echo "3. Appointment Reminder"
    echo "4. Custom Message"
    echo "5. List Current Subscriptions"
    echo "6. Add Email Subscription"
    echo "7. Exit"
    echo ""
    echo -n "Enter choice (1-7): "
    read choice
    echo ""
    
    case $choice in
        1)
            test_lambda_notification "scheduled" "Appointment Scheduled Notification"
            ;;
        2)
            test_lambda_notification "cancelled" "Appointment Cancelled Notification"
            ;;
        3)
            test_lambda_notification "reminder" "Appointment Reminder Notification"
            ;;
        4)
            echo -n "Enter subject: "
            read SUBJECT
            echo -n "Enter message: "
            read MESSAGE
            send_direct_message "$SUBJECT" "$MESSAGE"
            ;;
        5)
            echo -e "${BLUE}Current Subscriptions:${NC}"
            aws sns list-subscriptions-by-topic \
                --topic-arn $TOPIC_ARN \
                --region $REGION \
                --query 'Subscriptions[].{Protocol:Protocol,Endpoint:Endpoint,Status:SubscriptionArn}' \
                --output table
            echo ""
            ;;
        6)
            echo -n "Enter email address: "
            read EMAIL
            if [ ! -z "$EMAIL" ]; then
                SUB_ARN=$(aws sns subscribe \
                    --topic-arn $TOPIC_ARN \
                    --protocol email \
                    --notification-endpoint "$EMAIL" \
                    --region $REGION \
                    --query 'SubscriptionArn' \
                    --output text)
                echo -e "${GREEN}✅ Subscription request sent to $EMAIL${NC}"
                echo -e "${YELLOW}Please check email and confirm subscription${NC}"
            fi
            echo ""
            ;;
        7)
            echo "Exiting..."
            break
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            ;;
    esac
done

# Clean up
rm -f /tmp/lambda-response.json

echo ""
echo -e "${GREEN}✅ Testing complete${NC}"

