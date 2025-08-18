#!/bin/bash

# Generate Sample Data for Screenshots
set -e

echo "=================================================="
echo "🚀 GENERATING SAMPLE DATA FOR SCREENSHOTS"
echo "=================================================="
echo ""

REGION=$(aws configure get region || echo "ap-southeast-2")
API_URL="https://56tt892n36.execute-api.ap-southeast-2.amazonaws.com/dev"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📊 Generating Lambda invocations for CloudWatch metrics...${NC}"

# Get Lambda function names
FUNCTIONS=$(aws lambda list-functions --region $REGION --query 'Functions[?contains(FunctionName, `college-safe-serverless-dev`)].FunctionName' --output text)

if [ ! -z "$FUNCTIONS" ]; then
    for func in $FUNCTIONS; do
        echo -e "Invoking $func..."
        
        # Create different test payloads based on function name
        if [[ $func == *"auth"* ]]; then
            PAYLOAD='{"body":"{\"email\":\"test@example.com\",\"password\":\"password123\"}"}'
        elif [[ $func == *"users"* ]]; then
            PAYLOAD='{"httpMethod":"GET","path":"/users"}'
        elif [[ $func == *"upload"* ]]; then
            PAYLOAD='{"body":"{\"fileName\":\"test.jpg\",\"fileType\":\"image/jpeg\"}"}'
        elif [[ $func == *"messages"* ]]; then
            PAYLOAD='{"body":"{\"message\":\"Test message\",\"userId\":\"user123\"}"}'
        elif [[ $func == *"sessions"* ]]; then
            PAYLOAD='{"body":"{\"sessionId\":\"session123\"}"}'
        elif [[ $func == *"resources"* ]]; then
            PAYLOAD='{"httpMethod":"GET","path":"/resources"}'
        else
            PAYLOAD='{"test":"data"}'
        fi
        
        # Invoke function multiple times to generate metrics
        for i in {1..5}; do
            aws lambda invoke \
                --function-name $func \
                --payload "$PAYLOAD" \
                --region $REGION \
                /tmp/response_$func_$i.json >/dev/null 2>&1 || true
            
            # Add some successful invocations
            if [ $i -eq 3 ]; then
                # Generate an error for error rate metrics
                aws lambda invoke \
                    --function-name $func \
                    --payload '{"error":"true"}' \
                    --region $REGION \
                    /tmp/error_$func.json >/dev/null 2>&1 || true
            fi
            
            sleep 0.5
        done
        
        echo -e "${GREEN}✅ Generated data for $func${NC}"
    done
else
    echo -e "${YELLOW}⚠️ No Lambda functions found${NC}"
fi

echo ""
echo -e "${BLUE}🔗 Testing API Gateway endpoints...${NC}"

# Test different API endpoints if they exist
ENDPOINTS=("/login" "/users" "/resources" "/sessions" "/messages" "/upload")

for endpoint in "${ENDPOINTS[@]}"; do
    echo -e "Testing $API_URL$endpoint..."
    curl -X GET "$API_URL$endpoint" \
        -H "Content-Type: application/json" \
        --max-time 5 \
        -o /dev/null -s -w "Status: %{http_code}\n" || echo "Endpoint not available"
    sleep 0.5
done

echo ""
echo -e "${BLUE}📈 Generating CloudWatch Logs...${NC}"

# Generate some log entries with different levels
for func in $FUNCTIONS; do
    # Create log entries through Lambda invocations
    echo -e "Generating logs for $func..."
    
    # Info log
    aws lambda invoke \
        --function-name $func \
        --payload '{"logLevel":"INFO","message":"Application started successfully"}' \
        --region $REGION \
        /tmp/info_log.json >/dev/null 2>&1 || true
    
    # Warning log
    aws lambda invoke \
        --function-name $func \
        --payload '{"logLevel":"WARN","message":"High memory usage detected"}' \
        --region $REGION \
        /tmp/warn_log.json >/dev/null 2>&1 || true
    
    # Error log (for error metrics)
    aws lambda invoke \
        --function-name $func \
        --payload '{"logLevel":"ERROR","message":"Database connection timeout"}' \
        --region $REGION \
        /tmp/error_log.json >/dev/null 2>&1 || true
done

echo -e "${GREEN}✅ Log entries generated${NC}"

echo ""
echo -e "${BLUE}⏱️ Waiting for metrics to propagate...${NC}"
echo "Metrics will appear in CloudWatch within 1-2 minutes"

echo ""
echo "=================================================="
echo -e "${GREEN}✅ SAMPLE DATA GENERATION COMPLETE${NC}"
echo "=================================================="
echo ""
echo -e "${YELLOW}📸 READY FOR SCREENSHOTS:${NC}"
echo ""
echo "1. Lambda Functions with invocation data"
echo "2. CloudWatch metrics showing:"
echo "   - Function invocations"
echo "   - Error rates"
echo "   - Duration metrics"
echo "   - Concurrent executions"
echo "3. X-Ray traces (if requests went through API Gateway)"
echo "4. CloudWatch Logs with various log levels"
echo "5. CloudWatch Alarms monitoring the metrics"
echo ""
echo -e "${BLUE}Wait 1-2 minutes before taking screenshots to ensure all metrics are visible.${NC}"

# Clean up temp files
rm -f /tmp/response_*.json /tmp/error_*.json /tmp/*_log.json 2>/dev/null

