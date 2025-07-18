#!/bin/bash

# Update system packages
yum update -y

# Install Node.js 20.x
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

# Install PM2 globally
npm install -g pm2

# Create application directory if it doesn't exist
mkdir -p /home/ec2-user/collegesafe

# Clean up any previous deployment
rm -rf /home/ec2-user/collegesafe/* 