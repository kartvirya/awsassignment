# CollegeSafe Production Deployment Guide

This guide covers deploying CollegeSafe to production using Docker Compose with Nginx reverse proxy and Amazon RDS.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx (80)    │───▶│  App (3001)     │───▶│  Amazon RDS     │
│   Reverse Proxy │    │  Backend API    │    │  PostgreSQL     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│  Static Files   │    │  Redis (6379)   │
│  Frontend       │    │  Sessions       │
└─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- Docker and Docker Compose installed
- Amazon RDS PostgreSQL instance
- Domain name (optional, for SSL)
- Server with at least 2GB RAM and 20GB storage

## 🔧 Amazon RDS Setup

### 1. Create RDS Instance

1. Go to AWS RDS Console
2. Create a PostgreSQL instance with these settings:
   - **Engine**: PostgreSQL 14+
   - **Instance**: db.t3.micro (for testing) or db.t3.small+ (for production)
   - **Storage**: 20GB+ (General Purpose SSD)
   - **Multi-AZ**: Enabled for production
   - **Publicly accessible**: Yes (for initial setup)
   - **VPC Security Group**: Allow port 5432 from your server IP

### 2. Configure Security Group

Create a security group with these rules:
```
Type: PostgreSQL
Protocol: TCP
Port: 5432
Source: Your server IP or 0.0.0.0/0 (for testing)
```

### 3. Get Connection Details

Note down these details:
- **Endpoint**: `your-instance.region.rds.amazonaws.com`
- **Port**: 5432
- **Database name**: `collegesafe`
- **Username**: `postgres` (or your custom username)
- **Password**: Your chosen password

## 🚀 Deployment Steps

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd collegesafe
```

### 2. Configure Environment

```bash
# Copy example environment file
cp env.example .env

# Edit .env with your RDS details
nano .env
```

**Required .env variables:**
```env
# Database Configuration (Amazon RDS)
DATABASE_URL=postgresql://username:password@your-rds-endpoint.amazonaws.com:5432/collegesafe

# Security (CHANGE THESE!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2024
SESSION_SECRET=your-session-secret-key-change-this-in-production-2024

# Server Configuration
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
```

### 3. Deploy

```bash
# Option 1: Use deployment script (recommended)
./scripts/deploy.sh

# Option 2: Manual deployment
npm run build
docker-compose up --build -d
```

### 4. Verify Deployment

```bash
# Check service status
docker-compose ps

# Check logs
docker-compose logs -f

# Health check
curl http://localhost/health

# Test application
curl http://localhost
```

## 🔒 SSL/HTTPS Setup (Optional)

### 1. Using Let's Encrypt

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates to nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/
```

### 2. Update Nginx Configuration

Uncomment SSL configuration in `nginx/nginx.conf`:
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    # ... rest of SSL config
}
```

## 📊 Monitoring and Maintenance

### Health Checks

```bash
# Application health
curl http://localhost/health

# Database connection
docker-compose exec app node -e "require('./dist/db').checkDatabaseConnection().then(console.log)"

# Service status
docker-compose ps
```

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f nginx

# Nginx access logs
tail -f nginx/logs/access.log
```

### Backup

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

### Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up --build -d

# Or use deployment script
./scripts/deploy.sh
```

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

1. **Database Connection Pool**
   ```env
   DB_POOL_MAX=50
   DB_POOL_MIN=5
   ```

2. **Nginx Worker Processes**
   ```nginx
   worker_processes auto;
   worker_connections 1024;
   ```

3. **Node.js Memory**
   ```bash
   # Add to Dockerfile
   ENV NODE_OPTIONS="--max-old-space-size=2048"
   ```

## 🔐 Security Checklist

- [ ] Changed default JWT_SECRET
- [ ] Changed default SESSION_SECRET
- [ ] Configured RDS security group
- [ ] Enabled SSL/HTTPS
- [ ] Set up firewall rules
- [ ] Configured rate limiting
- [ ] Enabled CORS properly
- [ ] Set up monitoring
- [ ] Configured backups
- [ ] Updated dependencies

## 📞 Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Verify configuration: `docker-compose config`
3. Test connectivity: `curl http://localhost/health`
4. Check AWS RDS console for database issues

## 🎯 Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Security groups configured
- [ ] Load testing completed
- [ ] Documentation updated 