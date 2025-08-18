#!/bin/bash

echo "🚀 Manual AWS Deployment for Task 2"
echo "=================================="

# Check AWS credentials
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS credentials not configured!"
    exit 1
fi
echo "✅ AWS credentials configured"

# Set variables
REGION="ap-southeast-2"
STACK_NAME="college-safe-serverless-dev"
BUCKET_NAME="college-safe-dev-uploads-$(date +%s)"

echo "📦 Creating S3 bucket: $BUCKET_NAME"
aws s3 mb s3://$BUCKET_NAME --region $REGION

echo "📬 Creating SNS topic..."
TOPIC_ARN=$(aws sns create-topic --name college-safe-notifications --region $REGION --output text --query 'TopicArn')
echo "Topic ARN: $TOPIC_ARN"

echo "🔧 Creating Lambda execution role..."
aws iam create-role --role-name lambda-execution-role \
  --assume-role-policy-document '{
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
  }' --region $REGION

aws iam attach-role-policy \
  --role-name lambda-execution-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

echo "📝 Packaging Lambda functions..."
cd lambda
for func in auth users resources sessions messages upload; do
  echo "Packaging $func..."
  zip -r $func.zip $func.js
done
cd ..

echo "🚀 Creating Lambda functions..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/lambda-execution-role"

for func in auth users resources sessions messages upload; do
  echo "Creating Lambda function: $func"
  aws lambda create-function \
    --function-name college-safe-$func \
    --runtime nodejs18.x \
    --role $ROLE_ARN \
    --handler $func.handler \
    --zip-file fileb://lambda/$func.zip \
    --environment Variables="{DATABASE_URL=$DATABASE_URL,NODE_ENV=production}" \
    --region $REGION \
    --timeout 30 \
    --memory-size 512
done

echo "🌐 Creating API Gateway..."
API_ID=$(aws apigateway create-rest-api --name college-safe-api --region $REGION --output text --query 'id')
echo "API Gateway ID: $API_ID"

echo "✅ Deployment completed!"
echo "📊 Resources created:"
echo "- S3 Bucket: $BUCKET_NAME"
echo "- SNS Topic: $TOPIC_ARN"
echo "- API Gateway: $API_ID"
echo "- 6 Lambda functions"

