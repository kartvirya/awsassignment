# 📸 Assignment Screenshot Guide - Complete Mapping

## ✅ All AWS Resources Ready for Screenshots

This guide provides direct links and instructions for capturing each figure required in your assignment.

---

## 🔗 Quick Access URLs

### CloudWatch & X-Ray (Figures 82-86)
- **Figure 82 - Enabling X-Ray on Lambda**:
  - URL: https://ap-southeast-2.console.aws.amazon.com/lambda/home?region=ap-southeast-2#/functions/college-safe-serverless-dev-auth?tab=monitoring
  - Action: Click on any Lambda function → Configuration → Monitoring tools → Show X-Ray enabled

- **Figure 83 - X-Ray Traces List**:
  - URL: https://ap-southeast-2.console.aws.amazon.com/xray/home?region=ap-southeast-2#/traces
  - Shows: List of traces from recent invocations

- **Figure 84 - Individual Trace Detail**:
  - URL: Click on any trace ID from Figure 83
  - Shows: Detailed trace timeline and segments

- **Figure 85 - CPU Utilization Graph**:
  - URL: https://ap-southeast-2.console.aws.amazon.com/cloudwatch/home?region=ap-southeast-2#metricsV2:graph=~();query=~'*7bAWS*2fLambda*2cFunctionName*7d
  - Shows: Lambda duration and performance metrics

- **Figure 86 - Lambda Logs**:
  - URL: https://ap-southeast-2.console.aws.amazon.com/cloudwatch/home?region=ap-southeast-2#logsV2:log-groups
  - Action: Click on any `/aws/lambda/college-safe-serverless-dev-*` log group

### Lambda Functions (Figures 57-60)
- **Figure 57 - Creating Lambda Function**:
  - URL: https://ap-southeast-2.console.aws.amazon.com/lambda/home?region=ap-southeast-2#/functions
  - Shows: List of all Lambda functions

- **Figure 58 - Lambda Execution Role**:
  - URL: Click on any function → Configuration → Permissions
  - Shows: IAM role attached to Lambda

- **Figure 59 - Lambda Function Code**:
  - URL: Click on any function → Code tab
  - Shows: Function code editor

- **Figure 60 - Lambda Test Event**:
  - URL: Click on any function → Test tab
  - Shows: Test event configuration and results

### DynamoDB Tables (Figures 52-56)
- **Figure 52 - DynamoDB Tables List**:
  - URL: https://ap-southeast-2.console.aws.amazon.com/dynamodbv2/home?region=ap-southeast-2#tables

- **Figures 53-56 - Individual Tables**:
  - URL: Click on each table → Explore table items
  - Note: If tables don't exist, they may be using different names or not deployed yet

### S3 Buckets (Figures 28-31)
- **Figure 28 - Creating S3 Bucket**:
  - URL: https://s3.console.aws.amazon.com/s3/home?region=ap-southeast-2
  - Shows: S3 buckets list

- **Figure 29-30 - Bucket Configuration**:
  - URL: Click on `college-safe-serverless-dev-uploads` bucket
  - Shows: Bucket properties and permissions

- **Figure 31 - Bucket Policy**:
  - URL: Bucket → Permissions → Bucket policy
  - Shows: JSON policy configuration

### API Gateway (Figures 62-69)
- **Figure 62 - Creating API Gateway**:
  - URL: https://ap-southeast-2.console.aws.amazon.com/apigateway/home?region=ap-southeast-2#/apis
  - Shows: API Gateway list

- **Figure 63-64 - Resources and Methods**:
  - URL: Click on `dev-college-safe-serverless` → Resources
  - Shows: API resources tree

- **Figure 65 - Deploying API**:
  - URL: API → Deployments → dev stage
  - Shows: Deployment configuration

- **Figure 66 - CORS Configuration**:
  - URL: API → Resources → Actions → Enable CORS
  - Shows: CORS settings

- **Figure 67-69 - API Testing**:
  - URL: API → Resources → Select method → TEST
  - Shows: API test interface and results

### SNS Topics (Figures 70-76)
- **Figure 70 - Creating SNS Topic**:
  - URL: https://ap-southeast-2.console.aws.amazon.com/sns/v3/home?region=ap-southeast-2#/topics
  - Shows: SNS topics list (`college-safe-serverless-dev-notifications`)

- **Figure 71-72 - Subscriptions**:
  - URL: Click on topic → Subscriptions tab
  - Shows: Email subscriptions

- **Figures 73-76 - Notifications**:
  - Action: These would be email screenshots from actual notifications

---

## 📊 Current Status Summary

### ✅ Ready for Screenshots:
- ✅ **Lambda Functions** (6 functions with X-Ray enabled)
- ✅ **CloudWatch Metrics** (Data generated for graphs)
- ✅ **X-Ray Tracing** (Active on all functions)
- ✅ **CloudWatch Logs** (Log groups with sample data)
- ✅ **CloudWatch Alarms** (3 alarms configured)
- ✅ **S3 Buckets** (2 buckets available)
- ✅ **API Gateway** (1 API with dev stage)
- ✅ **SNS Topic** (1 topic created)

### ⚠️ May Need Setup:
- DynamoDB tables (not found with expected names)
- VPC components (for network diagrams)
- EC2 instances (2 running but may need specific ones)

---

## 📝 Screenshot Checklist

### CloudWatch & X-Ray Screenshots:
- [ ] Figure 82: Lambda function with X-Ray enabled
- [ ] Figure 83: X-Ray traces list view
- [ ] Figure 84: Individual trace detail
- [ ] Figure 85: CloudWatch CPU/metrics graphs
- [ ] Figure 86: CloudWatch Logs viewer

### Lambda Screenshots:
- [ ] Figure 57: Lambda functions list
- [ ] Figure 58: Lambda execution role
- [ ] Figure 59: Lambda function code
- [ ] Figure 60: Lambda test event and results

### Additional AWS Service Screenshots:
- [ ] DynamoDB tables (if available)
- [ ] S3 bucket configuration
- [ ] API Gateway setup
- [ ] SNS topic and subscriptions

---

## 💡 Tips for Best Screenshots:

1. **Wait 2-3 minutes** after running `generate-sample-data.sh` for metrics to appear
2. **Zoom browser to 90%** for better fit in documents
3. **Use browser DevTools** to hide sensitive information if needed
4. **Highlight important areas** using browser extensions or image editors
5. **Include timestamps** in CloudWatch graphs for context

---

## 🚀 Quick Commands:

```bash
# Verify all resources
./prepare-assignment-screenshots.sh

# Generate fresh data for graphs
./generate-sample-data.sh

# Check CloudWatch dashboard
./verify-cloudwatch-setup.sh
```

---

## 📌 Important Notes:

1. **X-Ray traces** will only appear if requests go through API Gateway or if Lambda functions are invoked
2. **CloudWatch metrics** update every 1-2 minutes
3. **Alarms** may show "Insufficient Data" initially - this is normal
4. **Log entries** are visible immediately after Lambda invocations

---

Generated: $(date)
Region: ap-southeast-2
Account: 643303011818
