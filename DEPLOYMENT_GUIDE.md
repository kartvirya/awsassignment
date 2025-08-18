# AWS Serverless Deployment Guide

## Architecture Overview

Your application has been converted from Express/Node.js to AWS Serverless architecture:

### Previous Architecture (Task #1)
- Express.js server on EC2/local
- PostgreSQL database (RDS)
- Direct server-to-client communication

### New Serverless Architecture (Task #2)
- **API Gateway** - REST API endpoint management
- **AWS Lambda** - Serverless compute functions
- **Amazon S3** - File storage and uploads
- **Amazon SNS** - Notifications system
- **Amazon CloudWatch** - Monitoring and logging
- **AWS X-Ray** - Performance tracing
- **Amazon RDS** - PostgreSQL database (existing)

## Deployment Steps

### 1. Configure AWS Credentials
```bash
aws configure
```
Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region: `ap-southeast-2`
- Default output format: `json`

### 2. Set Environment Variables
```bash
export DATABASE_URL="postgresql://postgres:WlWXcf10suZlQZJYuhi@collegesafedatabase.clwecg6wi29u.ap-southeast-2.rds.amazonaws.com/collegesafe?sslmode=require"
```

### 3. Deploy the Application
```bash
serverless deploy --stage dev --region ap-southeast-2
```

### 4. Get the API Gateway URL
After deployment, note the API Gateway endpoint URL from the output.

## Lambda Functions Created

1. **auth** - Authentication endpoints (`/api/login`, `/api/signup`, `/api/logout`, `/api/auth/user`)
2. **users** - User management (`/api/users`, `/api/users/role/{role}`, `/api/users/{id}/role`)
3. **resources** - Resource management (`/api/resources/*`)
4. **sessions** - Session management (`/api/sessions/*`)
5. **messages** - Messaging system (`/api/messages/*`)
6. **upload** - File upload with S3 integration (`/api/upload`)

## AWS Services Integration

### S3 Bucket
- **Purpose**: File uploads and storage
- **Features**: Presigned URLs for secure uploads
- **Bucket Name**: `college-safe-serverless-{stage}-uploads`

### SNS Topic
- **Purpose**: System notifications
- **Features**: Notifies when files are uploaded, sessions created
- **Topic Name**: `college-safe-serverless-{stage}-notifications`

### CloudWatch & X-Ray
- **Purpose**: Monitoring and performance analysis
- **Features**: 
  - Automatic logging for all Lambda functions
  - X-Ray tracing for performance monitoring
  - 30-day log retention
  - Request/response tracking

## Performance Monitoring Setup

The deployment automatically configures:

1. **CloudWatch Logs**: Each Lambda function has its own log group
2. **X-Ray Tracing**: Enabled for API Gateway and Lambda functions
3. **Metrics**: Request count, duration, error rates
4. **Alarms**: Can be configured for error thresholds

## Testing the Deployment

### 1. Test Authentication
```bash
curl -X POST https://your-api-id.execute-api.ap-southeast-2.amazonaws.com/dev/api/signup \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com", "password": "password123"}'
```

### 2. Test File Upload
```bash
curl -X POST https://your-api-id.execute-api.ap-southeast-2.amazonaws.com/dev/api/upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_ID" \
  -d '{"fileName": "test.pdf", "fileType": "application/pdf"}'
```

### 3. Monitor Performance
- Go to AWS CloudWatch Console
- Navigate to X-Ray traces
- View API Gateway and Lambda metrics

## Cost Optimization

The serverless setup includes:
- **Pay-per-request pricing** for Lambda and API Gateway
- **Free tier eligible** for most services
- **Automatic scaling** based on demand
- **No server maintenance** required

## Comparison with Previous Architecture

| Feature | Task #1 (Server) | Task #2 (Serverless) |
|---------|------------------|----------------------|
| Scalability | Manual scaling | Auto-scaling |
| Cost | Always running | Pay per use |
| Maintenance | Server updates | Zero maintenance |
| Monitoring | Manual setup | Built-in CloudWatch |
| File Storage | Local/mounted | S3 with CDN |
| Notifications | Manual | SNS integration |
| Availability | Single point | Multi-AZ redundancy |

## Architecture Diagram Files

Save these for your report:

1. **serverless.yml** - Infrastructure as Code
2. **lambda/** - Serverless function code
3. **DEPLOYMENT_GUIDE.md** - This deployment guide
4. **Performance screenshots** - From CloudWatch/X-Ray

## Report Requirements Met

✅ **Amazon API Gateway + AWS Lambda** - Core serverless compute  
✅ **Amazon S3** - File storage service  
✅ **Amazon SNS** - Notification service  
✅ **CloudWatch + X-Ray** - Performance monitoring  
✅ **Serverless architecture concepts** - Event-driven, pay-per-use  
✅ **Implementation completed** - Ready for deployment  
