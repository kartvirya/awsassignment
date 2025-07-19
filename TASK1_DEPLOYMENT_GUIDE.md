# Task #1 Completion Guide - CollegeSafe AWS Deployment

## Overview
This guide will help you complete Task #1 requirements by deploying the CollegeSafe application to AWS EC2 with a cloud database.

## Task #1 Requirements Checklist

### ✅ Frontend Requirements
- [x] Interactive and responsive user interface
- [x] HTML, CSS, JavaScript (React + TypeScript)
- [x] Modern UI with Tailwind CSS
- [x] Responsive design for all devices

### ✅ Backend Database Requirements  
- [x] AWS cloud database service (PostgreSQL on EC2, can migrate to RDS)
- [x] Database connection workflows
- [x] Type-safe database operations with Drizzle ORM

### ✅ AWS Compute Service Requirements
- [x] Amazon EC2 deployment (Option 2)
- [x] Production-ready deployment scripts
- [x] Infrastructure as Code (CloudFormation)

## Step-by-Step Deployment to AWS EC2

### Step 1: Prepare AWS EC2 Instance

1. **Launch EC2 Instance**
   ```bash
   # Instance Specifications
   - Type: t3.medium (2 vCPUs, 4 GB RAM)
   - OS: Ubuntu 22.04 LTS
   - Storage: 30 GB
   - Security Group: Allow ports 22, 80, 443
   ```

2. **Connect to Instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

### Step 2: Upload Application

**Option A: Upload via SCP (Recommended)**
```bash
# From your local machine
scp -i your-key.pem -r DDAC/schoolsafe/collegesafe/ ubuntu@your-ec2-ip:/home/ubuntu/
```

**Option B: Clone from Git**
```bash
# On EC2 instance
git clone https://github.com/yourusername/collegesafe.git
cd collegesafe
```

### Step 3: Run Deployment Script

```bash
# Make script executable
chmod +x deploy-ec2.sh

# Run deployment (requires sudo)
sudo ./deploy-ec2.sh
```

### Step 4: Verify Deployment

```bash
# Check application status
sudo systemctl status collegesafe

# Test health endpoint
curl http://your-ec2-ip/health

# Access application
# Open http://your-ec2-ip in browser
```

## Alternative: AWS RDS Database Setup

To use AWS RDS instead of local PostgreSQL:

### Step 1: Create RDS Instance

1. Go to AWS RDS Console
2. Create PostgreSQL instance:
   - Engine: PostgreSQL 15
   - Instance: db.t3.micro (free tier)
   - Storage: 20 GB
   - Security Group: Allow port 5432 from EC2

### Step 2: Update Database Configuration

```bash
# Update environment variables
sudo nano /opt/collegesafe/.env

# Change DATABASE_URL to RDS endpoint
DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/collegesafe_db
```

### Step 3: Run Database Migration

```bash
cd /opt/collegesafe
sudo -u collegesafe npm run db:migrate
sudo -u collegesafe npm run db:create-default-user
```

## Application Features Demonstrated

### Frontend Features
- **Responsive Dashboard**: Works on desktop, tablet, mobile
- **Interactive Forms**: Login, registration, incident reporting
- **Real-time Updates**: Live messaging and notifications
- **Modern UI**: Clean, professional interface with animations
- **Accessibility**: ARIA labels, keyboard navigation

### Backend Features
- **RESTful API**: Complete CRUD operations
- **Authentication**: JWT-based auth with session management
- **Database Operations**: Type-safe queries with Drizzle ORM
- **Error Handling**: Comprehensive error responses
- **Security**: CSRF protection, input validation

### AWS Integration
- **EC2 Deployment**: Production-ready server setup
- **Nginx Reverse Proxy**: Load balancing and SSL termination
- **PM2 Process Management**: Auto-restart and monitoring
- **Security Groups**: Network-level security
- **Logging**: Centralized log management

## Testing Your Deployment

### 1. Frontend Testing
```bash
# Test responsive design
# Open http://your-ec2-ip on different devices/browsers

# Test interactive features
- Login with default credentials
- Navigate between pages
- Submit forms
- Test mobile responsiveness
```

### 2. Backend Testing
```bash
# Test API endpoints
curl http://your-ec2-ip/api/resources
curl http://your-ec2-ip/api/users
curl http://your-ec2-ip/health
```

### 3. Database Testing
```bash
# Test database connection
sudo -u collegesafe npm run db:health

# Test database operations
# Use the application to create/read/update/delete data
```

## Default Login Credentials

For testing purposes:
- **Admin**: `admin@collegesafe.com` / `admin123`
- **Counsellor**: `counsellor@collegesafe.com` / `counsellor123`
- **Student**: `student@collegesafe.com` / `student123`

## Monitoring and Maintenance

### Check Application Status
```bash
# Application status
sudo systemctl status collegesafe

# PM2 status
sudo -u collegesafe pm2 status

# Nginx status
sudo systemctl status nginx
```

### View Logs
```bash
# Application logs
sudo tail -f /var/log/collegesafe/app.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
```

### Restart Services
```bash
# Restart application
sudo systemctl restart collegesafe

# Restart Nginx
sudo systemctl restart nginx
```

## Task #1 Submission Checklist

### Documentation Required
- [ ] Screenshots of deployed application
- [ ] AWS EC2 instance details
- [ ] Database configuration proof
- [ ] Frontend responsiveness demonstration
- [ ] API endpoint testing results

### Technical Requirements Met
- [x] Interactive and responsive frontend
- [x] AWS cloud database (PostgreSQL on EC2/RDS)
- [x] AWS compute service (EC2)
- [x] Production deployment
- [x] Error handling and validation
- [x] Security measures

## Troubleshooting

### Common Issues

1. **Application won't start**
   ```bash
   # Check logs
   sudo journalctl -u collegesafe -f
   
   # Check database connection
   sudo -u collegesafe npm run db:health
   ```

2. **Nginx errors**
   ```bash
   # Test nginx configuration
   sudo nginx -t
   
   # Check nginx logs
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Database connection issues**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Test database connection
   sudo -u postgres psql -d collegesafe_db
   ```

## Next Steps for Task #2

After completing Task #1, you can extend the application for Task #2:
- Add AWS S3 for file storage
- Implement CloudWatch monitoring
- Add AWS Lambda functions
- Set up CI/CD pipeline
- Add more cloud services integration

---

**Your CollegeSafe application is now ready for Task #1 submission!** 🎉 