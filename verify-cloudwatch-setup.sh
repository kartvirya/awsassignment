#!/bin/bash

# Verify CloudWatch Setup Script
set -e

echo "🔍 Verifying CloudWatch Configuration..."
echo "========================================="

REGION=$(aws configure get region || echo "ap-southeast-2")

# Check if dashboard exists
echo ""
echo "📊 Checking Dashboard..."
DASHBOARD=$(aws cloudwatch get-dashboard --dashboard-name "college-safe-comprehensive-monitoring" --region $REGION 2>/dev/null || echo "NOT_FOUND")

if [ "$DASHBOARD" != "NOT_FOUND" ]; then
    echo "✅ Dashboard 'college-safe-comprehensive-monitoring' exists"
    echo "   View at: https://${REGION}.console.aws.amazon.com/cloudwatch/home?region=${REGION}#dashboards:name=college-safe-comprehensive-monitoring"
else
    echo "❌ Dashboard not found"
fi

# Check CloudWatch Alarms
echo ""
echo "🔔 Checking Alarms..."
ALARMS=$(aws cloudwatch describe-alarms --alarm-names "college-safe-high-error-rate" "college-safe-high-latency" "college-safe-lambda-throttles" --region $REGION 2>/dev/null | jq -r '.MetricAlarms[].AlarmName' 2>/dev/null)

if [ ! -z "$ALARMS" ]; then
    echo "✅ Found alarms:"
    echo "$ALARMS" | sed 's/^/   - /'
else
    echo "⚠️ No alarms found"
fi

# Check X-Ray traces
echo ""
echo "🗺️ Checking X-Ray Configuration..."
TRACES=$(aws xray get-trace-summaries --time-range-type LastHour --region $REGION 2>/dev/null | jq -r '.TraceSummaries | length' 2>/dev/null || echo "0")

if [ "$TRACES" != "0" ]; then
    echo "✅ Found $TRACES traces in the last hour"
    echo "   View Service Map: https://${REGION}.console.aws.amazon.com/xray/home?region=${REGION}#/service-map"
else
    echo "ℹ️ No traces found in the last hour (this is normal if there's no recent traffic)"
fi

# Check Lambda functions with tracing
echo ""
echo "🔍 Checking Lambda Function Tracing..."
FUNCTIONS=$(aws lambda list-functions --region $REGION 2>/dev/null | jq -r '.Functions[] | select(.FunctionName | contains("college-safe-serverless")) | .FunctionName' 2>/dev/null)

if [ ! -z "$FUNCTIONS" ]; then
    echo "Lambda functions found:"
    for func in $FUNCTIONS; do
        TRACING=$(aws lambda get-function-configuration --function-name $func --region $REGION 2>/dev/null | jq -r '.TracingConfig.Mode' 2>/dev/null || echo "Unknown")
        if [ "$TRACING" == "Active" ]; then
            echo "   ✅ $func - Tracing: Active"
        else
            echo "   ⚠️ $func - Tracing: $TRACING"
        fi
    done
else
    echo "⚠️ No Lambda functions found"
fi

# Check CloudWatch Log Groups
echo ""
echo "📝 Checking CloudWatch Log Groups..."
LOG_GROUPS=$(aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/college-safe-serverless" --region $REGION 2>/dev/null | jq -r '.logGroups[].logGroupName' 2>/dev/null)

if [ ! -z "$LOG_GROUPS" ]; then
    echo "✅ Found log groups:"
    echo "$LOG_GROUPS" | sed 's/^/   - /'
    echo ""
    echo "   Use CloudWatch Logs Insights with queries from: cloudwatch-logs-insights-queries.md"
else
    echo "⚠️ No log groups found"
fi

echo ""
echo "========================================="
echo "📌 Quick Links:"
echo "   • Dashboard: https://${REGION}.console.aws.amazon.com/cloudwatch/home?region=${REGION}#dashboards:name=college-safe-comprehensive-monitoring"
echo "   • X-Ray Service Map: https://${REGION}.console.aws.amazon.com/xray/home?region=${REGION}#/service-map"
echo "   • X-Ray Traces: https://${REGION}.console.aws.amazon.com/xray/home?region=${REGION}#/traces"
echo "   • CloudWatch Logs: https://${REGION}.console.aws.amazon.com/cloudwatch/home?region=${REGION}#logsV2:log-groups"
echo "   • CloudWatch Alarms: https://${REGION}.console.aws.amazon.com/cloudwatch/home?region=${REGION}#alarmsV2:"
echo ""
echo "💡 To generate test data:"
echo "   1. Make API calls to your Lambda functions"
echo "   2. Wait 1-2 minutes for metrics to appear"
echo "   3. Check the dashboard for graphs and traces"
