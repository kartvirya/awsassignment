#!/bin/bash
echo "Step 5: Building application..."
cat > .env << ENVEOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://collegesafe:collegesafe123@localhost:5432/collegesafe_db
SESSION_SECRET=$(openssl rand -base64 32)
COOKIE_SECRET=$(openssl rand -base64 32)
CSRF_SECRET=$(openssl rand -base64 32)
ENVEOF
npm run build
echo "✅ Application built"
