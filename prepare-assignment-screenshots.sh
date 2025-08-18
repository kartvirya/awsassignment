#!/bin/bash

# Prepare AWS Resources for Assignment Screenshots
set -e

echo "=================================================="
echo "🎯 PREPARING AWS RESOURCES FOR ASSIGNMENT SCREENSHOTS"
echo "=================================================="
echo ""

REGION=$(aws configure get region || echo "ap-southeast-2")
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Region: $REGION${NC}"
echo -e "${BLUE}Account ID: $ACCOUNT_ID${NC}"
echo ""

# Function to check if resource exists
check_resource() {
    local resource_type=$1
    local resource_name=$2
    local status=$3
    
    if [ "$status" == "exists" ]; then
        echo -e "${GREEN}✅ $resource_type: $resource_name${NC}"
    else
        echo -e "${YELLOW}⚠️  $resource_type: $resource_name not found${NC}"
    fi
}

# ===========================================
# LAMBDA FUNCTIONS (Figures 57-60, 82-84)
# ===========================================
echo -e "${BLUE}📦 LAMBDA FUNCTIONS${NC}"
echo "-------------------"

LAMBDA_FUNCTIONS=$(aws lambda list-functions --region $REGION --query 'Functions[?contains(FunctionName, `college-safe`) || contains(FunctionName, `calmly`)].FunctionName' --output text 2>/dev/null)

if [ ! -z "$LAMBDA_FUNCTIONS" ]; then
    for func in $LAMBDA_FUNCTIONS; do
        # Check X-Ray tracing
        TRACING=$(aws lambda get-function-configuration --function-name $func --region $REGION --query 'TracingConfig.Mode' --output text 2>/dev/null)
        if [ "$TRACING" == "Active" ]; then
            echo -e "${GREEN}✅ $func (X-Ray: Active)${NC}"
        else
            echo -e "${YELLOW}⚠️  $func (X-Ray: $TRACING) - Enabling X-Ray...${NC}"
            aws lambda update-function-configuration --function-name $func --tracing-config Mode=Active --region $REGION >/dev/null 2>&1
            echo -e "${GREEN}   X-Ray enabled${NC}"
        fi
    done
else
    echo -e "${YELLOW}⚠️  No Lambda functions found${NC}"
fi

echo ""

# ===========================================
# DYNAMODB TABLES (Figures 52-56)
# ===========================================
echo -e "${BLUE}🗄️  DYNAMODB TABLES${NC}"
echo "-------------------"

TABLES=("users" "appointments" "educational-materials" "sessions" "messages")
for table in "${TABLES[@]}"; do
    EXISTS=$(aws dynamodb describe-table --table-name $table --region $REGION 2>/dev/null && echo "exists" || echo "")
    if [ "$EXISTS" == "exists" ]; then
        ITEM_COUNT=$(aws dynamodb scan --table-name $table --select COUNT --region $REGION --query 'Count' --output text 2>/dev/null || echo "0")
        echo -e "${GREEN}✅ Table: $table (Items: $ITEM_COUNT)${NC}"
    else
        echo -e "${YELLOW}⚠️  Table: $table not found${NC}"
    fi
done

echo ""

# ===========================================
# S3 BUCKETS (Figures 28-31)
# ===========================================
echo -e "${BLUE}🪣 S3 BUCKETS${NC}"
echo "-------------"

S3_BUCKETS=$(aws s3 ls | grep -E "college-safe|calmly" | awk '{print $3}' 2>/dev/null)

if [ ! -z "$S3_BUCKETS" ]; then
    for bucket in $S3_BUCKETS; do
        FILE_COUNT=$(aws s3 ls s3://$bucket --recursive --summarize | grep "Total Objects" | awk '{print $3}' 2>/dev/null || echo "0")
        echo -e "${GREEN}✅ Bucket: $bucket (Files: $FILE_COUNT)${NC}"
    done
else
    echo -e "${YELLOW}⚠️  No S3 buckets found${NC}"
fi

echo ""

# ===========================================
# API GATEWAY (Figures 62-69)
# ===========================================
echo -e "${BLUE}🌐 API GATEWAY${NC}"
echo "--------------"

API_IDS=$(aws apigateway get-rest-apis --region $REGION --query 'items[?contains(name, `college-safe`) || contains(name, `calmly`)].id' --output text 2>/dev/null)

if [ ! -z "$API_IDS" ]; then
    for api_id in $API_IDS; do
        API_NAME=$(aws apigateway get-rest-api --rest-api-id $api_id --region $REGION --query 'name' --output text 2>/dev/null)
        STAGE_NAMES=$(aws apigateway get-stages --rest-api-id $api_id --region $REGION --query 'item[].stageName' --output text 2>/dev/null)
        echo -e "${GREEN}✅ API: $API_NAME (ID: $api_id)${NC}"
        echo -e "   Stages: $STAGE_NAMES"
        echo -e "   URL: https://$api_id.execute-api.$REGION.amazonaws.com/"
    done
else
    # Check for HTTP APIs as well
    HTTP_APIS=$(aws apigatewayv2 get-apis --region $REGION --query 'Items[?contains(Name, `college-safe`) || contains(Name, `calmly`)].ApiId' --output text 2>/dev/null)
    if [ ! -z "$HTTP_APIS" ]; then
        for api_id in $HTTP_APIS; do
            API_NAME=$(aws apigatewayv2 get-api --api-id $api_id --region $REGION --query 'Name' --output text 2>/dev/null)
            API_ENDPOINT=$(aws apigatewayv2 get-api --api-id $api_id --region $REGION --query 'ApiEndpoint' --output text 2>/dev/null)
            echo -e "${GREEN}✅ HTTP API: $API_NAME${NC}"
            echo -e "   Endpoint: $API_ENDPOINT"
        done
    else
        echo -e "${YELLOW}⚠️  No API Gateway found${NC}"
    fi
fi

echo ""

# ===========================================
# SNS TOPICS (Figures 70-76)
# ===========================================
echo -e "${BLUE}📬 SNS TOPICS${NC}"
echo "-------------"

SNS_TOPICS=$(aws sns list-topics --region $REGION --query 'Topics[?contains(TopicArn, `college-safe`) || contains(TopicArn, `calmly`)].TopicArn' --output text 2>/dev/null)

if [ ! -z "$SNS_TOPICS" ]; then
    for topic in $SNS_TOPICS; do
        TOPIC_NAME=$(echo $topic | awk -F: '{print $NF}')
        SUB_COUNT=$(aws sns list-subscriptions-by-topic --topic-arn $topic --region $REGION --query 'Subscriptions | length(@)' --output text 2>/dev/null || echo "0")
        echo -e "${GREEN}✅ Topic: $TOPIC_NAME (Subscriptions: $SUB_COUNT)${NC}"
    done
else
    echo -e "${YELLOW}⚠️  No SNS topics found${NC}"
fi

echo ""

# ===========================================
# CLOUDWATCH & X-RAY (Figures 82-86)
# ===========================================
echo -e "${BLUE}📊 CLOUDWATCH & X-RAY${NC}"
echo "---------------------"

# Check CloudWatch Dashboard
DASHBOARD=$(aws cloudwatch get-dashboard --dashboard-name "college-safe-comprehensive-monitoring" --region $REGION 2>/dev/null && echo "exists" || echo "")
if [ "$DASHBOARD" == "exists" ]; then
    echo -e "${GREEN}✅ CloudWatch Dashboard: college-safe-comprehensive-monitoring${NC}"
    echo -e "   URL: https://$REGION.console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=college-safe-comprehensive-monitoring"
else
    echo -e "${YELLOW}⚠️  CloudWatch Dashboard not found${NC}"
fi

# Check X-Ray traces
TRACE_COUNT=$(aws xray get-trace-summaries --time-range-type LastHour --region $REGION --query 'TraceSummaries | length(@)' --output text 2>/dev/null || echo "0")
echo -e "${GREEN}✅ X-Ray Traces (Last Hour): $TRACE_COUNT${NC}"
echo -e "   Service Map: https://$REGION.console.aws.amazon.com/xray/home?region=$REGION#/service-map"
echo -e "   Traces: https://$REGION.console.aws.amazon.com/xray/home?region=$REGION#/traces"

# Check CloudWatch Alarms
ALARMS=$(aws cloudwatch describe-alarms --region $REGION --query 'MetricAlarms[?contains(AlarmName, `college-safe`) || contains(AlarmName, `calmly`)].AlarmName' --output text 2>/dev/null)
if [ ! -z "$ALARMS" ]; then
    echo -e "${GREEN}✅ CloudWatch Alarms:${NC}"
    for alarm in $ALARMS; do
        echo -e "   - $alarm"
    done
else
    echo -e "${YELLOW}⚠️  No CloudWatch Alarms found${NC}"
fi

echo ""

# ===========================================
# VPC & NETWORKING (Figures 21-27)
# ===========================================
echo -e "${BLUE}🔒 VPC & NETWORKING${NC}"
echo "-------------------"

# Check VPCs
VPCS=$(aws ec2 describe-vpcs --region $REGION --filters "Name=tag:Name,Values=*college-safe*,*calmly*" --query 'Vpcs[].{ID:VpcId,Name:Tags[?Key==`Name`].Value|[0]}' --output text 2>/dev/null)
if [ ! -z "$VPCS" ]; then
    echo -e "${GREEN}✅ VPCs found${NC}"
else
    echo -e "${YELLOW}⚠️  No tagged VPCs found${NC}"
fi

# Check Subnets
SUBNET_COUNT=$(aws ec2 describe-subnets --region $REGION --query 'Subnets | length(@)' --output text 2>/dev/null)
echo -e "${GREEN}✅ Total Subnets: $SUBNET_COUNT${NC}"

echo ""

# ===========================================
# EC2 INSTANCES (Figures 32-38)
# ===========================================
echo -e "${BLUE}💻 EC2 INSTANCES${NC}"
echo "----------------"

INSTANCES=$(aws ec2 describe-instances --region $REGION --filters "Name=instance-state-name,Values=running" --query 'Reservations[].Instances[].{ID:InstanceId,Name:Tags[?Key==`Name`].Value|[0],IP:PublicIpAddress,State:State.Name}' --output table 2>/dev/null)
if [ ! -z "$INSTANCES" ]; then
    echo "$INSTANCES"
else
    echo -e "${YELLOW}⚠️  No running EC2 instances found${NC}"
fi

echo ""
echo "=================================================="
echo -e "${BLUE}📸 SCREENSHOT PREPARATION URLS${NC}"
echo "=================================================="
echo ""

echo -e "${YELLOW}FOR FIGURES 82-84 (X-Ray):${NC}"
echo "1. X-Ray Service Map: https://$REGION.console.aws.amazon.com/xray/home?region=$REGION#/service-map"
echo "2. X-Ray Traces: https://$REGION.console.aws.amazon.com/xray/home?region=$REGION#/traces"
echo ""

echo -e "${YELLOW}FOR FIGURES 85-86 (CloudWatch):${NC}"
echo "1. CloudWatch Dashboard: https://$REGION.console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=college-safe-comprehensive-monitoring"
echo "2. CloudWatch Metrics: https://$REGION.console.aws.amazon.com/cloudwatch/home?region=$REGION#metricsV2:"
echo "3. CloudWatch Logs: https://$REGION.console.aws.amazon.com/cloudwatch/home?region=$REGION#logsV2:log-groups"
echo "4. CloudWatch Alarms: https://$REGION.console.aws.amazon.com/cloudwatch/home?region=$REGION#alarmsV2:"
echo ""

echo -e "${YELLOW}FOR FIGURES 52-56 (DynamoDB):${NC}"
echo "DynamoDB Tables: https://$REGION.console.aws.amazon.com/dynamodbv2/home?region=$REGION#tables"
echo ""

echo -e "${YELLOW}FOR FIGURES 57-60 (Lambda):${NC}"
echo "Lambda Functions: https://$REGION.console.aws.amazon.com/lambda/home?region=$REGION#/functions"
echo ""

echo -e "${YELLOW}FOR FIGURES 28-31 (S3):${NC}"
echo "S3 Buckets: https://s3.console.aws.amazon.com/s3/home?region=$REGION"
echo ""

echo -e "${YELLOW}FOR FIGURES 62-69 (API Gateway):${NC}"
echo "API Gateway: https://$REGION.console.aws.amazon.com/apigateway/home?region=$REGION#/apis"
echo ""

echo -e "${YELLOW}FOR FIGURES 70-76 (SNS):${NC}"
echo "SNS Topics: https://$REGION.console.aws.amazon.com/sns/v3/home?region=$REGION#/topics"
echo ""

echo "=================================================="
echo -e "${GREEN}✅ PREPARATION COMPLETE${NC}"
echo "=================================================="
