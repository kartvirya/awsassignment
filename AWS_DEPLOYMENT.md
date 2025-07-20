# 🚀 AWS EC2 + RDS Deployment Guide

This guide will walk you through deploying CollegeSafe to AWS EC2 with Amazon RDS PostgreSQL.

## 📋 Prerequisites

- AWS Account with appropriate permissions
- Domain name (optional, for SSL)
- SSH key pair for EC2 access
- Basic knowledge of AWS services

## 🗄️ Step 1: Create Amazon RDS Database

### 1.1 Navigate to RDS Console
1. Go to AWS Console → RDS
2. Click "Create database"

### 1.2 Configure Database
```
Database creation method: Standard create
Engine type: PostgreSQL
Version: PostgreSQL 14.x or higher
Template: Free tier (for testing) or Production
```

### 1.3 Database Settings
```
DB instance identifier: collegesafe-db
Master username: postgres (or your preferred username)
Master password: [Create a strong password]
```

### 1.4 Instance Configuration
```
DB instance class: 
- Free tier: db.t3.micro
- Production: db.t3.small or larger

Storage: 20 GB (General Purpose SSD)
Storage autoscaling: Enabled (recommended)
```

### 1.5 Connectivity
```
Network type: IPv4
VPC: Default VPC (or create custom)
Subnet group: Default
Publicly accessible: Yes (for initial setup)
VPC security group: Create new
Availability Zone: No preference
Database port: 5432
```

### 1.6 Security Group Configuration
Create a new security group with these rules:
```
Type: PostgreSQL
Protocol: TCP
Port: 5432
Source: Custom
IP: [Your EC2 security group ID] (we'll get this later)
```

### 1.7 Additional Configuration
```
Database name: collegesafe
Backup retention: 7 days
Monitoring: Enhanced monitoring (optional)
Maintenance window: No preference
Deletion protection: Enabled (recommended)
```

### 1.8 Create Database
Click "Create database" and wait for it to be available.

## ☁️ Step 2: Create EC2 Instance

### 2.1 Launch EC2 Instance
1. Go to AWS Console → EC2
2. Click "Launch instances"

### 2.2 Instance Configuration
```
Name: collegesafe-server
Application and OS Images: Amazon Linux 2023
Instance type: t3.small (2 vCPU, 2 GB RAM)
Key pair: Create new or select existing
Network settings: Create security group
```

### 2.3 Security Group for EC2
Create security group with these rules:
```
SSH (Port 22): Your IP address
HTTP (Port 80): 0.0.0.0/0
HTTPS (Port 443): 0.0.0.0/0 (if using SSL)
Custom TCP (Port 3001): 0.0.0.0/0 (for direct API access)
```

### 2.4 Storage
```
Root volume: 20 GB (General Purpose SSD)
Delete on termination: No (recommended)
```

### 2.5 Launch Instance
Click "Launch instance" and note the instance ID.

## 🔧 Step 3: Configure RDS Security Group

### 3.1 Update RDS Security Group
1. Go to RDS → Databases → Your database
2. Click on the security group
3. Add inbound rule:
```
Type: PostgreSQL
Protocol: TCP
Port: 5432
Source: Custom
Security Group: [Your EC2 security group ID]
```

## 🖥️ Step 4: Connect to EC2 and Setup

### 4.1 Connect to EC2
```bash
# Replace with your key file and instance details
ssh -i "your-key.pem" ec2-user@your-ec2-public-ip
```

### 4.2 Update System
```bash
sudo yum update -y
```

### 4.3 Install Docker and Docker Compose
```bash
# Install Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again to apply group changes
exit
# SSH back in
```

### 4.4 Install Git
```bash
sudo yum install -y git
```

## 📦 Step 5: Deploy Application

### 5.1 Clone Repository
```bash
git clone <your-repository-url>
cd collegesafe
```

### 5.2 Configure Environment
```bash
# Copy environment template
cp env.example .env

# Edit environment file
nano .env
```

### 5.3 Update .env with RDS Details
```env
# Application Environment
NODE_ENV=production

# Server Configuration
PORT=3001
HOST=0.0.0.0

# Database Configuration (Amazon RDS)
DATABASE_URL=postgresql://postgres:your-password@your-rds-endpoint.amazonaws.com:5432/collegesafe
DATABASE_CA_CERT=

# Security (CHANGE THESE!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2024
SESSION_SECRET=your-session-secret-key-change-this-in-production-2024

# CORS Configuration
CORS_ORIGIN=http://your-domain.com

# Database Pool Configuration
DB_POOL_MAX=20
DB_POOL_MIN=2
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000
DB_STATEMENT_TIMEOUT=30000
DB_QUERY_TIMEOUT=30000
DB_SSL_REJECT_UNAUTHORIZED=true

# Other settings...
```

### 5.4 Get RDS Endpoint
1. Go to RDS Console → Databases
2. Click on your database
3. Copy the "Endpoint" (without port number)
4. Update DATABASE_URL in .env

### 5.5 Deploy Application
```bash
# Make deployment script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh
```

### 5.6 Verify Deployment
```bash
# Check if services are running
docker-compose ps

# Check logs
docker-compose logs -f

# Test health endpoint
curl http://localhost/health

# Test application
curl http://localhost
```

## 🌐 Step 6: Configure Domain (Optional)

### 6.1 Point Domain to EC2
1. Go to your domain registrar
2. Create A record pointing to your EC2 public IP
3. Wait for DNS propagation (can take up to 48 hours)

### 6.2 SSL Certificate (Optional)
```bash
# Install certbot
sudo yum install -y certbot

# Get SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/

# Update nginx configuration for SSL
# Edit nginx/nginx.conf to enable SSL
```

## 📊 Step 7: Monitoring and Maintenance

### 7.1 Health Checks
```bash
# Application health
curl http://localhost/health

# Service status
docker-compose ps

# Database connection
docker-compose exec app node -e "require('./dist/db').checkDatabaseConnection().then(console.log)"
```

### 7.2 Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f nginx

# Nginx access logs
tail -f nginx/logs/access.log
```

### 7.3 Backup
```bash
# Database backup
docker-compose exec app pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Application backup
tar -czf collegesafe_backup_$(date +%Y%m%d_%H%M%S).tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=dist \
  .
```

### 7.4 Updates
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up --build -d

# Or use deployment script
./scripts/deploy.sh
```

## 🔒 Step 8: Security Hardening

### 8.1 Update Security Groups
- Remove port 3001 from EC2 security group (not needed with Nginx)
- Restrict SSH access to your IP only
- Consider using AWS Systems Manager Session Manager instead of SSH

### 8.2 Regular Updates
```bash
# Update system packages
sudo yum update -y

# Update Docker images
docker-compose pull
docker-compose up -d
```

### 8.3 Monitoring Setup
- Set up CloudWatch alarms for EC2 metrics
- Configure RDS monitoring
- Set up log aggregation (CloudWatch Logs)

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check RDS security group
   # Verify DATABASE_URL in .env
   # Test connection manually
   psql $DATABASE_URL
   ```

2. **Port Already in Use**
   ```bash
   # Check what's using port 80
   sudo lsof -i :80
   
   # Stop conflicting service
   sudo systemctl stop nginx
   ```

3. **Permission Denied**
   ```bash
   # Fix file permissions
   chmod +x scripts/deploy.sh
   chmod 755 uploads/
   ```

4. **Container Won't Start**
   ```bash
   # Check logs
   docker-compose logs app
   
   # Check environment variables
   docker-compose exec app env | grep DATABASE
   ```

### Performance Tuning

1. **EC2 Instance Size**
   - Start with t3.small
   - Monitor CPU and memory usage
   - Scale up if needed

2. **RDS Instance Size**
   - Start with db.t3.micro (free tier)
   - Monitor connections and performance
   - Scale up for production

3. **Database Connection Pool**
   ```env
   DB_POOL_MAX=50
   DB_POOL_MIN=5
   ```

## 💰 Cost Optimization

### Free Tier (12 months)
- EC2: t3.micro (750 hours/month)
- RDS: db.t3.micro (750 hours/month)
- Data transfer: 15 GB/month

### Production Recommendations
- EC2: t3.small or larger
- RDS: db.t3.small or larger
- Enable RDS Multi-AZ for high availability
- Use Reserved Instances for cost savings

## 📞 Support Commands

```bash
# Service management
docker-compose up -d          # Start services
docker-compose down           # Stop services
docker-compose restart        # Restart services
docker-compose logs -f        # View logs

# Health checks
curl http://localhost/health  # Application health
docker-compose ps            # Service status

# Configuration
docker-compose config        # Validate configuration
cat .env                     # Check environment variables
```

## 🎯 Deployment Checklist

- [ ] RDS database created and accessible
- [ ] EC2 instance launched with proper security groups
- [ ] Docker and Docker Compose installed
- [ ] Application code deployed
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Health checks passing
- [ ] Domain configured (optional)
- [ ] SSL certificates installed (optional)
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Security groups hardened
- [ ] Documentation updated

---

🎉 **Your CollegeSafe application is now running on AWS!**

Access your application at: `http://your-ec2-public-ip` or `http://your-domain.com` 