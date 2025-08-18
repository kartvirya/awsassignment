# 📬 SNS (Simple Notification Service) Screenshot Guide

## ✅ SNS is Now Fully Configured and Ready!

### 🎯 What's Been Set Up:

1. **SNS Topic Created**: `college-safe-serverless-dev-notifications`
2. **Lambda Integration**: All 6 Lambda functions have SNS permissions
3. **Environment Variables**: SNS_TOPIC_ARN added to all Lambda functions
4. **IAM Permissions**: SNS:Publish permissions granted to Lambda roles

### 📸 Screenshots for Your Assignment:

## Figure 70: Creating SNS Topic
**URL**: https://ap-southeast-2.console.aws.amazon.com/sns/v3/home?region=ap-southeast-2#/topics
- Shows the SNS topic list with `college-safe-serverless-dev-notifications`

## Figure 71-72: Email Subscription
**To add email subscription:**
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:ap-southeast-2:643303011818:college-safe-serverless-dev-notifications \
  --protocol email \
  --notification-endpoint your-email@example.com \
  --region ap-southeast-2
```
- After running this command, check email for confirmation
- Click the confirmation link
- Take screenshot of subscription confirmation page

## Figure 73-74: Appointment Scheduled Notification
**Send scheduled notification:**
```bash
./sns-quick-commands.sh
# Select option 2
```
Or directly:
```bash
aws sns publish \
  --topic-arn arn:aws:sns:ap-southeast-2:643303011818:college-safe-serverless-dev-notifications \
  --subject "Appointment Scheduled - CollegeSafe" \
  --message "Your appointment with Dr. Jane Smith is confirmed for March 25, 2024 at 10:00 AM" \
  --region ap-southeast-2
```
- Screenshot the email received

## Figure 75-76: Appointment Cancelled Notification
**Send cancellation notification:**
```bash
./sns-quick-commands.sh
# Select option 3
```
Or directly:
```bash
aws sns publish \
  --topic-arn arn:aws:sns:ap-southeast-2:643303011818:college-safe-serverless-dev-notifications \
  --subject "Appointment Cancelled - CollegeSafe" \
  --message "Your appointment scheduled for March 25, 2024 has been cancelled. Please reschedule." \
  --region ap-southeast-2
```
- Screenshot the cancellation email

### 🛠️ Available Tools:

1. **sns-quick-commands.sh** - Interactive menu for all SNS operations
2. **sns-demo-interface.html** - Visual interface showing the notification system
3. **test-sns-notifications.sh** - Comprehensive testing script

### 📋 Quick Test Workflow:

1. **Add Email Subscription:**
```bash
# Replace with your email
EMAIL="your-email@example.com"
aws sns subscribe \
  --topic-arn arn:aws:sns:ap-southeast-2:643303011818:college-safe-serverless-dev-notifications \
  --protocol email \
  --notification-endpoint $EMAIL \
  --region ap-southeast-2
```

2. **Confirm Subscription:**
- Check your email inbox
- Click the confirmation link from AWS
- Screenshot the confirmation page

3. **Send Test Notifications:**
```bash
# Run the quick commands script
./sns-quick-commands.sh

# Or send notifications directly:

# Appointment Scheduled
aws sns publish \
  --topic-arn arn:aws:sns:ap-southeast-2:643303011818:college-safe-serverless-dev-notifications \
  --subject "Appointment Scheduled - CollegeSafe" \
  --message "Dear John Doe, Your counselling appointment is confirmed for March 25, 2024 at 10:00 AM with Dr. Jane Smith." \
  --region ap-southeast-2

# Appointment Cancelled
aws sns publish \
  --topic-arn arn:aws:sns:ap-southeast-2:643303011818:college-safe-serverless-dev-notifications \
  --subject "Appointment Cancelled - CollegeSafe" \
  --message "Dear John Doe, Your appointment on March 25, 2024 has been cancelled. Please reschedule." \
  --region ap-southeast-2
```

4. **Check Subscriptions:**
```bash
aws sns list-subscriptions-by-topic \
  --topic-arn arn:aws:sns:ap-southeast-2:643303011818:college-safe-serverless-dev-notifications \
  --region ap-southeast-2 \
  --output table
```

### 🔗 AWS Console Links:

- **SNS Topics List**: https://ap-southeast-2.console.aws.amazon.com/sns/v3/home?region=ap-southeast-2#/topics
- **Topic Details**: https://ap-southeast-2.console.aws.amazon.com/sns/v3/home?region=ap-southeast-2#/topic/arn:aws:sns:ap-southeast-2:643303011818:college-safe-serverless-dev-notifications
- **Subscriptions**: Click on the topic → Subscriptions tab

### 📝 Sample Notification Messages:

**Appointment Scheduled:**
```
Subject: Appointment Scheduled - CollegeSafe
Message:
Dear [Student Name],

Your counselling appointment has been successfully scheduled.

Details:
- Counsellor: Dr. Jane Smith
- Date: March 25, 2024
- Time: 10:00 AM
- Type: Individual Session
- Location: Student Wellness Center, Room 203

Please arrive 5 minutes early for your appointment. If you need to reschedule, please contact us at least 24 hours in advance.

Best regards,
CollegeSafe Mental Health Support Team
```

**Appointment Cancelled:**
```
Subject: Appointment Cancelled - CollegeSafe
Message:
Dear [Student Name],

Your counselling appointment has been cancelled.

Original Details:
- Counsellor: Dr. Jane Smith
- Date: March 25, 2024
- Time: 10:00 AM

To reschedule your appointment, please visit our booking system at https://collegesafe.edu/appointments or call (555) 123-4567.

We apologize for any inconvenience.

Best regards,
CollegeSafe Mental Health Support Team
```

### ✨ Integration with Lambda Functions:

All Lambda functions now have:
- `SNS_TOPIC_ARN` environment variable
- IAM permissions to publish to SNS
- Can send notifications programmatically

Example Lambda code to send notification:
```python
import boto3
import os

sns = boto3.client('sns')
topic_arn = os.environ['SNS_TOPIC_ARN']

def send_notification(subject, message):
    response = sns.publish(
        TopicArn=topic_arn,
        Subject=subject,
        Message=message
    )
    return response['MessageId']
```

### 🎯 Complete Setup Status:

- ✅ SNS Topic: Created and configured
- ✅ Display Name: Set to "CollegeSafe"
- ✅ Lambda Integration: All functions updated
- ✅ IAM Permissions: SNS publish access granted
- ✅ Environment Variables: SNS_TOPIC_ARN configured
- ✅ Testing Scripts: Ready to use
- ✅ Documentation: Complete

---

Generated: $(date)
Region: ap-southeast-2
Account: 643303011818
Topic ARN: arn:aws:sns:ap-southeast-2:643303011818:college-safe-serverless-dev-notifications
