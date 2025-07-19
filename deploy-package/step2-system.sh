#!/bin/bash
echo "Step 2: Installing system dependencies..."
sudo apt update
sudo apt install -y nodejs npm postgresql postgresql-contrib nginx build-essential python3
sudo npm install -g pm2
echo "✅ System dependencies installed"
