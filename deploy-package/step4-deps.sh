#!/bin/bash
echo "Step 4: Installing dependencies..."
npm config set registry https://registry.npmjs.org/
npm cache clean --force
npm install --no-audit --no-fund --silent || npm install --production --no-audit --no-fund --silent
echo "✅ Dependencies installed"
