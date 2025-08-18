#!/bin/bash

echo "🚀 College Safe Serverless Deployment"
echo "====================================="

# Check if AWS CLI is configured
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS credentials not configured!"
    echo "Please run: aws configure"
    echo "You'll need:"
    echo "- AWS Access Key ID"
    echo "- AWS Secret Access Key" 
    echo "- Default region: ap-southeast-2"
    exit 1
fi

echo "✅ AWS credentials configured"

# Set environment variables
echo "Setting environment variables..."
export DATABASE_URL="postgresql://postgres:WlWXcf10suZlQZJYuhi@collegesafedatabase.clwecg6wi29u.ap-southeast-2.rds.amazonaws.com/collegesafe?sslmode=require"

# Deploy the serverless application
echo "🔨 Deploying serverless application..."
serverless deploy --stage dev --region ap-southeast-2

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo "✅ API Gateway + Lambda functions deployed"
    echo "✅ S3 bucket for file uploads created"
    echo "✅ SNS topic for notifications created"
    echo "✅ CloudWatch monitoring enabled"
    echo "✅ X-Ray tracing enabled"
    echo ""
    echo "📊 Next steps for your report:"
    echo "1. Test the API endpoints"
    echo "2. Check CloudWatch logs and metrics"
    echo "3. View X-Ray traces for performance analysis"
    echo "4. Take screenshots of monitoring dashboards"
else
    echo "❌ Deployment failed! Check the error messages above."
    exit 1
fi
