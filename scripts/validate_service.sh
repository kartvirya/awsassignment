#!/bin/bash

# Check if the application is running via PM2
if pm2 show collegesafe > /dev/null 2>&1; then
    echo "CollegeSafe PM2 process is running"
    
    # Check if the application is responding to health checks
    if curl -f -s http://localhost:3000/health > /dev/null 2>&1; then
        echo "CollegeSafe application is healthy"
        exit 0
    else
        echo "CollegeSafe application is not responding to health checks"
        exit 1
    fi
else
    echo "CollegeSafe application is not running"
    exit 1
fi
