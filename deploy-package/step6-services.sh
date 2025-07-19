#!/bin/bash
echo "Step 6: Setting up services..."
cat > ecosystem.config.js << PM2EOF
module.exports = {
  apps: [{
    name: 'collegesafe',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: { NODE_ENV: 'production', PORT: 3000 },
    max_memory_restart: '500M',
    autorestart: true
  }]
};
PM2EOF

sudo tee /etc/nginx/sites-available/collegesafe > /dev/null << NGINXEOF
server {
    listen 80;
    server_name _;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINXEOF

sudo ln -sf /etc/nginx/sites-available/collegesafe /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
echo "✅ Services configured"
