# CollegeSafe AWS Deployment Guide

This guide explains how to deploy the CollegeSafe application to AWS using either AWS CodePipeline with EC2 or AWS Elastic Beanstalk.

## Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI installed and configured
3. Node.js 20.x installed locally
4. Git repository set up

## Option 1: AWS CodePipeline with EC2 Deployment

### Step 1: Set Up AWS Infrastructure

1. Deploy the CloudFormation template:
```bash
aws cloudformation create-stack \
  --stack-name collegesafe-infrastructure \
  --template-body file://cloudformation.yml \
  --parameters ParameterKey=DBPassword,ParameterValue=your-secure-password \
  --capabilities CAPABILITY_IAM
```

2. Note the outputs (Database endpoint, EC2 public IP)

### Step 2: Set Up CodePipeline

1. Create an AWS CodePipeline that connects to your repository
2. Configure the pipeline stages:
   - Source: Your Git repository
   - Build: AWS CodeBuild (using buildspec.yml)
   - Deploy: AWS CodeDeploy (using appspec.yml)

### Step 3: Environment Variables

Set up the following environment variables in AWS Systems Manager Parameter Store:
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: "production"
- `PORT`: 3000

### Step 4: Deploy

1. Push your code to the repository
2. CodePipeline will automatically build and deploy
3. Monitor the deployment in AWS Console

## Option 2: AWS Elastic Beanstalk Deployment

### Step 1: Create Elastic Beanstalk Application

1. Create a new application in Elastic Beanstalk
2. Choose Node.js platform
3. Upload your application code
4. Configure environment variables

### Step 2: Database Setup

1. Create RDS instance using CloudFormation template
2. Configure security groups
3. Update environment variables with database connection

### Step 3: Deploy

1. Package your application:
```bash
zip -r collegesafe.zip . -x "node_modules/*" ".git/*"
```

2. Deploy using AWS Console or CLI:
```bash
aws elasticbeanstalk create-application-version \
  --application-name collegesafe \
  --version-label v1 \
  --source-bundle S3Bucket=your-bucket,S3Key=collegesafe.zip
```

## Monitoring and Maintenance

1. Set up CloudWatch alarms for:
   - CPU utilization
   - Memory usage
   - Error rates
   - Response times

2. Configure log groups in CloudWatch Logs

3. Set up AWS X-Ray for tracing (optional)

## Security Considerations

1. Use AWS Secrets Manager for sensitive data
2. Enable AWS WAF for web application firewall
3. Set up AWS Shield for DDoS protection
4. Configure SSL/TLS certificates using ACM

## Backup and Recovery

1. Enable automated RDS backups
2. Configure backup retention period
3. Test recovery procedures

## Scaling

1. Set up Auto Scaling groups
2. Configure scaling policies based on metrics
3. Use Application Load Balancer for distribution

## Troubleshooting

1. Check CloudWatch Logs
2. Monitor application logs via PM2
3. Review security group configurations
4. Verify database connectivity

## Cost Optimization

1. Use t2.micro/t3.micro instances for development
2. Enable auto-scaling based on demand
3. Monitor AWS Cost Explorer
4. Set up budget alerts

For additional support or questions, refer to AWS documentation or contact your AWS support team. 