#!/bin/bash

# Navigate to app directory
cd /home/ec2-user/collegesafe

# Ensure database is ready
echo "Checking database connectivity..."
npm run db:health || {
  echo "Database health check failed. Cannot start application."
  exit 1
}

# Start application with PM2
pm2 delete collegesafe 2>/dev/null || true
pm2 start dist/index.js --name collegesafe --max-memory-restart 512M

# Save PM2 process list and configure to start on system boot
pm2 save
pm2 startup systemd

# Wait for application to start
echo "Waiting for application to start..."
sleep 10

# Check if application is responding
echo "Checking application health..."
curl -f http://localhost:3000/health || {
  echo "Application health check failed"
  exit 1
}

echo "Application started successfully!"
