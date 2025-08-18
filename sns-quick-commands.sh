#!/bin/bash

# Quick SNS Commands for Testing
REGION="ap-southeast-2"
TOPIC_ARN="arn:aws:sns:ap-southeast-2:643303011818:college-safe-serverless-dev-notifications"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo "=================================================="
echo -e "${BLUE}📬 SNS QUICK COMMANDS${NC}"
echo "=================================================="
echo ""

echo -e "${YELLOW}Select an action:${NC}"
echo "1. Subscribe an email address"
echo "2. Send appointment scheduled notification"
echo "3. Send appointment cancelled notification"
echo "4. Send appointment reminder"
echo "5. List all subscriptions"
echo "6. Send custom message"
echo "7. Delete a subscription"
echo "8. Exit"
echo ""

read -p "Enter choice (1-8): " choice

case $choice in
    1)
        read -p "Enter email address: " EMAIL
        aws sns subscribe \
            --topic-arn $TOPIC_ARN \
            --protocol email \
            --notification-endpoint "$EMAIL" \
            --region $REGION
        echo -e "${GREEN}✅ Subscription request sent to $EMAIL${NC}"
        echo -e "${YELLOW}Check email for confirmation link${NC}"
        ;;
    
    2)
        MESSAGE="Dear John Doe,

Your counselling appointment has been successfully scheduled.

Details:
- Counsellor: Dr. Jane Smith
- Date: March 25, 2024
- Time: 10:00 AM
- Type: Individual Session

Please arrive 5 minutes early for your appointment.

Best regards,
CollegeSafe Mental Health Support Team"
        
        aws sns publish \
            --topic-arn $TOPIC_ARN \
            --subject "Appointment Scheduled - CollegeSafe" \
            --message "$MESSAGE" \
            --region $REGION
        echo -e "${GREEN}✅ Scheduled notification sent${NC}"
        ;;
    
    3)
        MESSAGE="Dear John Doe,

Your counselling appointment has been cancelled.

Details:
- Counsellor: Dr. Jane Smith
- Date: March 25, 2024
- Time: 10:00 AM

Please visit our booking system to reschedule at your convenience.

Best regards,
CollegeSafe Mental Health Support Team"
        
        aws sns publish \
            --topic-arn $TOPIC_ARN \
            --subject "Appointment Cancelled - CollegeSafe" \
            --message "$MESSAGE" \
            --region $REGION
        echo -e "${GREEN}✅ Cancellation notification sent${NC}"
        ;;
    
    4)
        MESSAGE="Dear Jane Wilson,

This is a reminder about your upcoming counselling appointment tomorrow.

Details:
- Counsellor: Dr. Michael Chen
- Date: March 26, 2024
- Time: 2:00 PM
- Type: Group Session

Please arrive 5 minutes early.

Best regards,
CollegeSafe Mental Health Support Team"
        
        aws sns publish \
            --topic-arn $TOPIC_ARN \
            --subject "Appointment Reminder - CollegeSafe" \
            --message "$MESSAGE" \
            --region $REGION
        echo -e "${GREEN}✅ Reminder notification sent${NC}"
        ;;
    
    5)
        echo -e "${BLUE}Current Subscriptions:${NC}"
        aws sns list-subscriptions-by-topic \
            --topic-arn $TOPIC_ARN \
            --region $REGION \
            --output table
        ;;
    
    6)
        read -p "Enter subject: " SUBJECT
        read -p "Enter message: " CUSTOM_MESSAGE
        aws sns publish \
            --topic-arn $TOPIC_ARN \
            --subject "$SUBJECT" \
            --message "$CUSTOM_MESSAGE" \
            --region $REGION
        echo -e "${GREEN}✅ Custom message sent${NC}"
        ;;
    
    7)
        echo "Current subscriptions:"
        aws sns list-subscriptions-by-topic \
            --topic-arn $TOPIC_ARN \
            --region $REGION \
            --query 'Subscriptions[].{Endpoint:Endpoint,Arn:SubscriptionArn}' \
            --output table
        read -p "Enter Subscription ARN to delete: " SUB_ARN
        aws sns unsubscribe --subscription-arn "$SUB_ARN" --region $REGION
        echo -e "${GREEN}✅ Subscription deleted${NC}"
        ;;
    
    8)
        echo "Exiting..."
        exit 0
        ;;
    
    *)
        echo -e "${RED}Invalid choice${NC}"
        ;;
esac

echo ""
echo -e "${BLUE}Done! Check the AWS Console for results:${NC}"
echo "https://$REGION.console.aws.amazon.com/sns/v3/home?region=$REGION#/topic/$TOPIC_ARN"

