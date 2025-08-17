#!/bin/bash

# CollegeSafe Serverless Deployment Script
# This script deploys the serverless application to AWS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STAGE=${1:-dev}
REGION=${AWS_REGION:-us-east-1}
SERVICE_NAME="collegesafe-serverless"

echo -e "${BLUE}🚀 CollegeSafe Serverless Deployment${NC}"
echo -e "${BLUE}=====================================${NC}"
echo -e "Stage: ${GREEN}$STAGE${NC}"
echo -e "Region: ${GREEN}$REGION${NC}"
echo -e "Service: ${GREEN}$SERVICE_NAME${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials are not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

# Check if Serverless Framework is installed
if ! command -v serverless &> /dev/null; then
    echo -e "${YELLOW}⚠️  Serverless Framework is not installed globally. Installing...${NC}"
    npm install -g serverless
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Build the project
echo -e "${YELLOW}🔨 Building project...${NC}"
npm run build
echo -e "${GREEN}✅ Project built successfully${NC}"
echo ""

# Set environment variables
echo -e "${YELLOW}🔧 Setting environment variables...${NC}"
export AWS_REGION=$REGION
export STAGE=$STAGE

# Generate JWT secret if not set
if [ -z "$JWT_SECRET" ]; then
    export JWT_SECRET=$(openssl rand -base64 32)
    echo -e "${YELLOW}⚠️  JWT_SECRET not set, generated a new one: ${JWT_SECRET:0:20}...${NC}"
fi

echo -e "${GREEN}✅ Environment variables configured${NC}"
echo ""

# Deploy to AWS
echo -e "${YELLOW}🚀 Deploying to AWS...${NC}"
echo -e "This may take several minutes..."

# Deploy using Serverless Framework
if serverless deploy --stage $STAGE --region $REGION --verbose; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    
    # Get deployment outputs
    echo -e "${BLUE}📊 Deployment Information:${NC}"
    echo -e "Stage: ${GREEN}$STAGE${NC}"
    echo -e "Region: ${GREEN}$REGION${NC}"
    echo -e "Service: ${GREEN}$SERVICE_NAME${NC}"
    
    # Get API Gateway URL
    API_URL=$(aws apigateway get-rest-apis --region $REGION --query "items[?name=='$SERVICE_NAME-$STAGE'].id" --output text)
    if [ ! -z "$API_URL" ]; then
        echo -e "API Gateway URL: ${GREEN}https://$API_URL.execute-api.$REGION.amazonaws.com/$STAGE${NC}"
    fi
    
    # Get CloudFront distribution
    CF_DISTRIBUTION=$(aws cloudformation describe-stacks --stack-name $SERVICE_NAME-$STAGE --region $REGION --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" --output text 2>/dev/null || echo "Not available")
    if [ "$CF_DISTRIBUTION" != "Not available" ] && [ ! -z "$CF_DISTRIBUTION" ]; then
        echo -e "CloudFront Distribution: ${GREEN}$CF_DISTRIBUTION${NC}"
    fi
    
    # Get S3 bucket name
    S3_BUCKET=$(aws cloudformation describe-stacks --stack-name $SERVICE_NAME-$STAGE --region $REGION --query "Stacks[0].Outputs[?OutputKey=='ResourcesBucketName'].OutputValue" --output text 2>/dev/null || echo "Not available")
    if [ "$S3_BUCKET" != "Not available" ] && [ ! -z "$S3_BUCKET" ]; then
        echo -e "S3 Bucket: ${GREEN}$S3_BUCKET${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}🔗 Quick Links:${NC}"
    echo -e "Health Check: ${GREEN}https://$API_URL.execute-api.$REGION.amazonaws.com/$STAGE/health${NC}"
    echo -e "CloudWatch Logs: ${GREEN}https://console.aws.amazon.com/cloudwatch/home?region=$REGION#logsV2:log-groups/log-group/$SERVICE_NAME-$STAGE${NC}"
    echo -e "DynamoDB Tables: ${GREEN}https://console.aws.amazon.com/dynamodb/home?region=$REGION#tables${NC}"
    echo -e "S3 Bucket: ${GREEN}https://console.aws.amazon.com/s3/buckets/$S3_BUCKET${NC}"
    
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${YELLOW}💡 Next steps:${NC}"
    echo -e "1. Test the API endpoints"
    echo -e "2. Set up CloudWatch alarms"
    echo -e "3. Configure custom domain (optional)"
    echo -e "4. Set up monitoring dashboards"
    
else
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo -e "${YELLOW}💡 Troubleshooting tips:${NC}"
    echo -e "1. Check AWS credentials and permissions"
    echo -e "2. Verify that the region is correct"
    echo -e "3. Check CloudFormation stack for errors"
    echo -e "4. Review CloudWatch logs for details"
    exit 1
fi

