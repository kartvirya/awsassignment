#!/bin/bash

# Navigate to app directory
cd /home/ec2-user/collegesafe

# Install dependencies
npm install

# Build the application
npm run build

# Set environment variables
cat > .env << EOL
NODE_ENV=production
PORT=3000
DATABASE_URL=$DATABASE_URL
SESSION_SECRET=$SESSION_SECRET
EOL

# Run database migrations
echo "Running database migrations..."
npm run db:setup || {
  echo "Database migration failed. Check DATABASE_URL and connectivity."
  exit 1
}

# Set permissions
chmod +x scripts/*.sh
chown -R ec2-user:ec2-user /home/ec2-user/collegesafe 