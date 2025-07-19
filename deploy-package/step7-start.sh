#!/bin/bash
echo "Step 7: Starting application..."
npm run db:migrate || echo "Migration failed, but continuing..."
npm run db:create-default-user || echo "User creation failed, but continuing..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup
echo "✅ Application started!"
echo "Check status: pm2 status"
echo "View logs: pm2 logs collegesafe"
