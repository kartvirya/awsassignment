#!/bin/bash

# Deploy CloudWatch Dashboard Script
set -e

echo "🚀 Deploying CloudWatch Dashboard..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

# Get AWS region
REGION=$(aws configure get region || echo "ap-southeast-2")
echo "📍 Using region: $REGION"

# Deploy the enhanced dashboard
echo "📊 Creating enhanced monitoring dashboard..."
aws cloudwatch put-dashboard \
    --dashboard-name "college-safe-comprehensive-monitoring" \
    --dashboard-body file://cloudwatch-enhanced-dashboard.json \
    --region $REGION

if [ $? -eq 0 ]; then
    echo "✅ Dashboard created successfully!"
    echo "🔗 View your dashboard at: https://${REGION}.console.aws.amazon.com/cloudwatch/home?region=${REGION}#dashboards:name=college-safe-comprehensive-monitoring"
else
    echo "❌ Failed to create dashboard"
    exit 1
fi

# Create CloudWatch Alarms
echo "🔔 Setting up CloudWatch Alarms..."

# High Error Rate Alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "college-safe-high-error-rate" \
    --alarm-description "Alert when Lambda error rate is high" \
    --metric-name Errors \
    --namespace AWS/Lambda \
    --statistic Sum \
    --period 300 \
    --threshold 10 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --region $REGION \
    --treat-missing-data notBreaching

# High Latency Alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "college-safe-high-latency" \
    --alarm-description "Alert when API Gateway latency is high" \
    --metric-name Latency \
    --namespace AWS/ApiGateway \
    --dimensions Name=ApiName,Value=college-safe-serverless \
    --statistic Average \
    --period 300 \
    --threshold 5000 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --region $REGION \
    --treat-missing-data notBreaching

# Lambda Throttles Alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "college-safe-lambda-throttles" \
    --alarm-description "Alert when Lambda functions are being throttled" \
    --metric-name Throttles \
    --namespace AWS/Lambda \
    --statistic Sum \
    --period 300 \
    --threshold 5 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 1 \
    --region $REGION \
    --treat-missing-data notBreaching

echo "✅ Alarms configured successfully!"

# Enable X-Ray Service Map
echo "🗺️ Configuring X-Ray..."
echo "Note: X-Ray tracing is already enabled in serverless.yml"
echo "Service map will be available at: https://${REGION}.console.aws.amazon.com/xray/home?region=${REGION}#/service-map"

echo ""
echo "🎉 CloudWatch configuration complete!"
echo ""
echo "📋 Resources created:"
echo "  • Enhanced monitoring dashboard with graphs"
echo "  • X-Ray tracing (already enabled)"
echo "  • CloudWatch Alarms for errors, latency, and throttles"
echo "  • Log Insights queries (see cloudwatch-logs-insights-queries.md)"
echo ""
echo "🔍 To view traces:"
echo "  1. Go to X-Ray console"
echo "  2. Check Service Map for visual representation"
echo "  3. Use Traces section to see individual request traces"
