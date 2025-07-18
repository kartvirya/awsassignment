# CollegeSafe AWS EC2 Deployment Guide

This guide provides step-by-step instructions for deploying the CollegeSafe application on AWS EC2.

## Prerequisites

### AWS Requirements
- AWS Account with appropriate permissions
- EC2 instance (recommended: t3.medium or higher)
- Security Group configured for HTTP/HTTPS access
- Key pair for SSH access

### Local Requirements
- SSH access to your EC2 instance
- Git (optional, for cloning repository)

## Quick Start

### 1. Launch EC2 Instance

1. **Instance Type**: t3.medium (2 vCPUs, 4 GB RAM) minimum
2. **Operating System**: Ubuntu 22.04 LTS
3. **Storage**: 20 GB minimum (30 GB recommended)
4. **Security Group**: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

### 2. Connect to Your Instance

```bash
# Replace with your key file and instance IP
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 3. Prepare the Application

**Option A: Upload via SCP (Recommended)**
```bash
# From your local machine, upload the application
scp -i your-key.pem -r . ubuntu@your-ec2-ip:/home/ubuntu/collegesafe
```

**Option B: Clone from Repository**
```bash
# On the EC2 instance
git clone https://github.com/yourusername/collegesafe.git
cd collegesafe
```

### 4. Run the Deployment Script

```bash
# Make the script executable
chmod +x deploy-ec2.sh

# Run the deployment (requires sudo)
sudo ./deploy-ec2.sh
```

The script will automatically:
- Update system packages
- Install Node.js, PostgreSQL, Nginx, PM2
- Create application user and directories
- Setup database with proper credentials
- Build and deploy the application
- Configure reverse proxy with Nginx
- Setup process management with PM2
- Configure firewall and security
- Create backup scripts
- Run health checks

### 5. Access Your Application

After successful deployment:
- **Application**: `http://your-ec2-ip`
- **Health Check**: `http://your-ec2-ip/health`

## Script Options

The deployment script supports several options:

```bash
# Show help
sudo ./deploy-ec2.sh --help

# Run health checks only
sudo ./deploy-ec2.sh --health

# Restart services
sudo ./deploy-ec2.sh --restart

# Run backup manually
sudo ./deploy-ec2.sh --backup
```

## Post-Deployment

### Default Login Credentials

The application comes with default development users:
- **Admin**: `admin@example.com` / `password123`
- **Student**: `student@example.com` / `password123`
- **Counsellor**: `counsellor@example.com` / `password123`

### Useful Commands

```bash
# Check application status
sudo -u collegesafe pm2 status

# View application logs
sudo -u collegesafe pm2 logs

# Restart application
sudo -u collegesafe pm2 restart collegesafe

# Check Nginx status
sudo systemctl status nginx

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### File Locations

- **Application**: `/opt/collegesafe`
- **Logs**: `/var/log/collegesafe`
- **Nginx Config**: `/etc/nginx/sites-available/collegesafe`
- **Environment**: `/opt/collegesafe/.env`
- **Backup Script**: `/usr/local/bin/backup-collegesafe.sh`

## SSL/HTTPS Setup (Optional)

### Using Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### Using Custom SSL Certificate

```bash
# Copy your certificates to
sudo cp your-cert.crt /etc/ssl/certs/
sudo cp your-private.key /etc/ssl/private/

# Update Nginx configuration
sudo nano /etc/nginx/sites-available/collegesafe
```

## Monitoring and Maintenance

### Log Monitoring

```bash
# Application logs
sudo tail -f /var/log/collegesafe/combined.log

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# System logs
sudo tail -f /var/log/syslog
```

### Database Backup

Automated daily backups are configured at 2 AM. Manual backup:

```bash
# Run backup manually
sudo /usr/local/bin/backup-collegesafe.sh

# View backup files
ls -la /var/backups/collegesafe/
```

### Performance Monitoring

```bash
# Check system resources
htop

# Check disk usage
df -h

# Check memory usage
free -h

# Check PM2 process monitoring
sudo -u collegesafe pm2 monit
```

## Troubleshooting

### Common Issues

1. **Application not starting**
   ```bash
   # Check logs
   sudo -u collegesafe pm2 logs
   
   # Restart application
   sudo -u collegesafe pm2 restart collegesafe
   ```

2. **Database connection errors**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Check database connection
   sudo -u postgres psql -c "SELECT 1;" collegesafe_db
   ```

3. **Nginx not serving content**
   ```bash
   # Check Nginx configuration
   sudo nginx -t
   
   # Restart Nginx
   sudo systemctl restart nginx
   ```

4. **Permission issues**
   ```bash
   # Fix ownership
   sudo chown -R collegesafe:collegesafe /opt/collegesafe
   ```

### Health Check Endpoint

The application includes a health check endpoint at `/health` that returns:
- Application status
- Database connectivity
- System information

```bash
# Test health check
curl http://localhost/health
```

## Security Best Practices

### Implemented Security Features

1. **Firewall**: UFW configured for essential ports only
2. **User Isolation**: Application runs under dedicated user account
3. **File Permissions**: Restricted access to application files
4. **Nginx Security Headers**: XSS protection, content type validation
5. **Database Security**: Dedicated database user with limited privileges

### Additional Security Recommendations

1. **Regular Updates**
   ```bash
   # Update system packages monthly
   sudo apt update && sudo apt upgrade
   ```

2. **SSH Key Management**
   - Disable password authentication
   - Use strong SSH keys
   - Consider changing default SSH port

3. **Monitoring**
   - Set up CloudWatch for system monitoring
   - Configure log aggregation
   - Set up alerts for critical issues

## Scaling and High Availability

### Horizontal Scaling

1. **Load Balancer**: Use AWS Application Load Balancer
2. **Database**: Consider RDS with Multi-AZ deployment
3. **File Storage**: Use S3 for static assets
4. **Session Management**: Use Redis for session storage

### Vertical Scaling

1. **Instance Size**: Upgrade to larger instance types as needed
2. **PM2 Cluster Mode**: Already configured for multi-core usage
3. **Database Optimization**: Tune PostgreSQL for better performance

## Backup and Recovery

### Automated Backups

- **Daily**: Database and application files
- **Retention**: 30 days
- **Location**: `/var/backups/collegesafe/`

### Manual Backup

```bash
# Create manual backup
sudo /usr/local/bin/backup-collegesafe.sh

# Restore from backup
sudo -u postgres psql collegesafe_db < /var/backups/collegesafe/database_YYYYMMDD_HHMMSS.sql
```

## Support and Maintenance

### Regular Maintenance Tasks

1. **Monthly**: System updates and security patches
2. **Weekly**: Log file cleanup and performance review
3. **Daily**: Automated backups and health checks

### Getting Help

- Check application logs first
- Review Nginx error logs
- Consult system logs for system-level issues
- Use the health check endpoint for quick diagnostics

## Cost Optimization

### AWS Cost Management

1. **Instance Sizing**: Start with t3.medium, scale as needed
2. **Reserved Instances**: Use for long-term deployments
3. **Monitoring**: Set up billing alerts
4. **Cleanup**: Remove unused resources regularly

### Performance Optimization

1. **Caching**: Nginx caching for static assets
2. **Compression**: Gzip compression enabled
3. **Database**: Connection pooling and query optimization
4. **Monitoring**: Regular performance monitoring with PM2

---

## Quick Reference

| Service | Status Command | Log Location |
|---------|----------------|--------------|
| Application | `sudo -u collegesafe pm2 status` | `/var/log/collegesafe/` |
| Nginx | `sudo systemctl status nginx` | `/var/log/nginx/` |
| PostgreSQL | `sudo systemctl status postgresql` | `/var/log/postgresql/` |
| System | `sudo systemctl status collegesafe` | `/var/log/syslog` |

| Port | Service | Purpose |
|------|---------|---------|
| 22 | SSH | Remote access |
| 80 | HTTP | Web traffic |
| 443 | HTTPS | Secure web traffic |
| 3000 | Node.js | Application server (internal) |
| 5432 | PostgreSQL | Database (internal) |

For additional support or questions, refer to the application documentation or contact the development team.
