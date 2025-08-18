# AWS Permissions Setup Guide for Task 2 Deployment

## Issue
Your IAM user `maulik` doesn't have the necessary permissions to deploy serverless infrastructure.

## Solution: Add Required Policies via AWS Console

### Step 1: Login to AWS Console
1. Go to https://console.aws.amazon.com
2. Login with your AWS account

### Step 2: Navigate to IAM
1. Search for "IAM" in the services
2. Click on "Users" in the left sidebar
3. Find and click on user "maulik"

### Step 3: Attach Required Policies
Click "Add permissions" > "Attach existing policies directly"

**Required Policies for Task 2:**
- ✅ `AWSLambda_FullAccess` (for Lambda functions)
- ✅ `AmazonS3FullAccess` (for file uploads)
- ✅ `AmazonSNSFullAccess` (for notifications)
- ✅ `AmazonAPIGatewayAdministrator` (for API Gateway)
- ✅ `CloudWatchFullAccess` (for monitoring)
- ✅ `IAMFullAccess` (for creating Lambda execution roles)
- ✅ `AWSCloudFormationFullAccess` (for infrastructure deployment)

**Alternative (Easier):**
- ✅ `AdministratorAccess` (gives all permissions - suitable for learning/development)

### Step 4: Apply Changes
1. Select all required policies
2. Click "Next: Review"
3. Click "Add permissions"

### Step 5: Verify Deployment Ready
After adding permissions, run:
```bash
./deploy.sh
```

## Free Tier Considerations
All services used are Free Tier eligible:
- Lambda: 1M requests/month free
- API Gateway: 1M API calls/month free
- S3: 5GB storage free
- SNS: 1,000 notifications free
- CloudWatch: Basic monitoring free

## Expected Deployment Output
```
✅ API Gateway + Lambda functions deployed
✅ S3 bucket for file uploads created
✅ SNS topic for notifications created
✅ CloudWatch monitoring enabled
✅ X-Ray tracing enabled
```

This will fulfill all Task 2 requirements!
