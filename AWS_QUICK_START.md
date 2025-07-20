# 🚀 AWS Quick Start Guide

## ⚡ 5-Minute Deployment

### 1. Create RDS Database
```bash
# Go to AWS RDS Console
# Create PostgreSQL database:
# - Engine: PostgreSQL 14+
# - Instance: db.t3.micro (free tier)
# - Storage: 20 GB
# - Publicly accessible: Yes
# - Database name: collegesafe
# Note down: endpoint, username, password
```

### 2. Launch EC2 Instance
```bash
# Go to AWS EC2 Console
# Launch instance:
# - AMI: Amazon Linux 2023
# - Type: t3.small
# - Security Group: Allow ports 22, 80, 443
# Note down: public IP, key file
```

### 3. Connect to EC2
```bash
ssh -i "your-key.pem" ec2-user@your-ec2-ip
```

### 4. Deploy Application
```bash
# Clone repository
git clone <your-repo-url>
cd collegesafe

# Configure environment
cp env.example .env
nano .env  # Add your RDS details

# Run AWS deployment script
chmod +x scripts/aws-deploy.sh
./scripts/aws-deploy.sh
```

### 5. Access Application
```
🌐 Application: http://your-ec2-ip
📊 Health: http://your-ec2-ip/health
🔧 API: http://your-ec2-ip/api
```

## 🔧 Required .env Configuration

```env
# Database (Amazon RDS)
DATABASE_URL=postgresql://postgres:password@your-rds-endpoint.amazonaws.com:5432/collegesafe

# Security (CHANGE THESE!)
JWT_SECRET=your-super-secret-jwt-key-2024
SESSION_SECRET=your-session-secret-key-2024

# Server
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
```

## 🛠️ Common Commands

```bash
# Service management
docker-compose up -d          # Start
docker-compose down           # Stop
docker-compose restart        # Restart
docker-compose logs -f        # Logs

# Health checks
curl http://localhost/health  # Health
docker-compose ps            # Status

# Updates
git pull origin main         # Pull code
./scripts/aws-deploy.sh      # Redeploy
```

## 🔒 Security Groups

### EC2 Security Group
- SSH (22): Your IP
- HTTP (80): 0.0.0.0/0
- HTTPS (443): 0.0.0.0/0

### RDS Security Group
- PostgreSQL (5432): EC2 Security Group ID

## 💰 Cost (Free Tier)
- EC2 t3.micro: Free (750h/month)
- RDS db.t3.micro: Free (750h/month)
- Data transfer: 15GB/month

## 🚨 Troubleshooting

### Database Connection Failed
```bash
# Check RDS security group
# Verify DATABASE_URL in .env
# Test connection
psql $DATABASE_URL
```

### Application Won't Start
```bash
# Check logs
docker-compose logs app

# Check environment
docker-compose exec app env | grep DATABASE
```

### Port Issues
```bash
# Check what's using port 80
sudo lsof -i :80

# Stop conflicting service
sudo systemctl stop nginx
```

## 📞 Support

- **Logs**: `docker-compose logs -f`
- **Health**: `curl http://localhost/health`
- **Status**: `docker-compose ps`
- **Config**: `docker-compose config`

---

🎉 **Your CollegeSafe app is now live on AWS!** 