# CollegeSafe Production Deployment Guide

This guide provides step-by-step instructions for deploying the CollegeSafe application to production with a real PostgreSQL database.

## Prerequisites

Before deploying, ensure you have:

1. **AWS CLI** configured with appropriate permissions
2. **Node.js 20.x** installed
3. **Docker** installed (for containerized deployment)
4. **Database credentials** for your PostgreSQL instance
5. **SSL certificates** (for HTTPS)

## Deployment Options

### Option 1: AWS CloudFormation + CodeDeploy

#### Step 1: Deploy Infrastructure

```bash
# Deploy the CloudFormation stack
aws cloudformation create-stack \
  --stack-name collegesafe-infrastructure \
  --template-body file://cloudformation.yml \
  --parameters ParameterKey=EnvironmentName,ParameterValue=Production \
               ParameterKey=DBPassword,ParameterValue=YourSecurePassword123! \
  --capabilities CAPABILITY_IAM

# Wait for stack creation to complete
aws cloudformation wait stack-create-complete \
  --stack-name collegesafe-infrastructure

# Get the database endpoint
DATABASE_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name collegesafe-infrastructure \
  --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
  --output text)

echo "Database endpoint: $DATABASE_ENDPOINT"
```

#### Step 2: Configure Environment Variables

```bash
# Set environment variables for CodeDeploy
export DATABASE_URL="postgresql://collegesafe:YourSecurePassword123!@$DATABASE_ENDPOINT:5432/collegesafe"
export SESSION_SECRET="your-super-secure-session-secret-key-change-this-in-production"
```

#### Step 3: Deploy Application

```bash
# Build the application
npm run prod:build

# Deploy using CodeDeploy (requires CodeDeploy application and deployment group setup)
aws deploy create-deployment \
  --application-name collegesafe-app \
  --deployment-group-name collegesafe-deployment-group \
  --s3-location bucket=your-deployment-bucket,key=collegesafe-app.zip,bundleType=zip
```

### Option 2: Docker Deployment

#### Step 1: Build Docker Image

```bash
# Build the Docker image
docker build -t collegesafe:latest .

# Test the image locally
docker run -p 3000:3000 --env-file .env.production collegesafe:latest
```

#### Step 2: Deploy with Docker Compose

```bash
# Copy the production environment file
cp .env.production .env

# Update database connection in .env
# DATABASE_URL=postgresql://username:password@hostname:5432/database

# Start the application stack
docker-compose up -d

# Check the logs
docker-compose logs -f app
```

### Option 3: Manual Server Deployment

#### Step 1: Prepare the Server

```bash
# Install Node.js 20.x
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Create application directory
sudo mkdir -p /opt/collegesafe
sudo chown $(whoami):$(whoami) /opt/collegesafe
```

#### Step 2: Deploy Application

```bash
# Clone the repository
git clone https://github.com/your-org/collegesafe.git /opt/collegesafe
cd /opt/collegesafe

# Install dependencies
npm install

# Build the application
npm run prod:build

# Create production environment file
cp .env.production .env

# Update environment variables in .env
# DATABASE_URL=postgresql://username:password@hostname:5432/database
# SESSION_SECRET=your-super-secure-session-secret
```

#### Step 3: Setup Database

```bash
# Run database migrations
npm run db:setup

# Verify database connection
npm run db:health
```

#### Step 4: Start Application

```bash
# Start with PM2
pm2 start dist/index.js --name collegesafe --max-memory-restart 512M

# Save PM2 configuration
pm2 save
pm2 startup

# Check application status
pm2 status
```

## Database Configuration

### PostgreSQL Requirements

- **Version**: PostgreSQL 15.x or higher
- **Extensions**: uuid-ossp, pgcrypto (optional)
- **Configuration**: UTF-8 encoding, timezone UTC

### Connection String Format

```
postgresql://username:password@hostname:5432/database?sslmode=require
```

### Environment Variables

```env
DATABASE_URL=postgresql://username:password@hostname:5432/database
DATABASE_CA_CERT=/path/to/ca-certificate.crt  # Optional for SSL
```

## Security Considerations

### Environment Variables

Ensure these are set securely:

```env
SESSION_SECRET=your-super-secure-session-secret-key-64-characters-or-more
CSRF_SECRET=your-csrf-secret-key-change-this-in-production
```

### Database Security

- Use strong passwords (minimum 12 characters)
- Enable SSL/TLS encryption
- Restrict database access to application servers only
- Regular backup and monitoring

### Application Security

- Enable HTTPS with valid SSL certificates
- Configure proper CORS settings
- Implement rate limiting
- Regular security updates

## Monitoring and Maintenance

### Health Checks

The application provides a health endpoint:

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-07-18T06:05:29.000Z",
  "version": "1.0.0",
  "environment": "production",
  "database": {
    "connected": true,
    "stats": {
      "users": 5,
      "sessions": 12,
      "resources": 8,
      "messages": 45
    }
  }
}
```

### Monitoring

Set up monitoring for:

- Application health endpoint
- Database connectivity
- Memory usage
- Response times
- Error rates

### Log Management

Logs are managed by PM2:

```bash
# View logs
pm2 logs collegesafe

# Log rotation
pm2 install pm2-logrotate
```

### Backup Strategy

1. **Database Backups**: Daily automated backups
2. **Application Files**: Version control and artifact storage
3. **Configuration**: Secure backup of environment files

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   npm run db:health
   ```
   Check DATABASE_URL format and network connectivity

2. **Migration Failures**
   ```bash
   npm run db:migrate
   ```
   Verify database user has CREATE privileges

3. **Application Won't Start**
   ```bash
   pm2 logs collegesafe
   ```
   Check environment variables and port availability

4. **Health Check Failures**
   ```bash
   curl -v http://localhost:3000/health
   ```
   Verify application is running and responding

### Performance Optimization

- Use connection pooling (already configured)
- Enable gzip compression
- Configure CDN for static assets
- Implement caching strategies
- Monitor and optimize database queries

## Scaling Considerations

### Horizontal Scaling

- Load balancer configuration
- Session storage in Redis
- Database read replicas
- Container orchestration (Kubernetes)

### Vertical Scaling

- Increase server resources
- Optimize database configuration
- Memory and CPU monitoring

## Support and Documentation

For additional support:

1. Check application logs: `pm2 logs collegesafe`
2. Review health endpoint: `curl http://localhost:3000/health`
3. Database connectivity: `npm run db:health`
4. Application status: `pm2 status`

## Version History

- **v1.0.0**: Initial production release with PostgreSQL database
- Database migration system
- Health monitoring
- Docker support
- AWS CloudFormation templates
