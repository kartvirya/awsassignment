#!/bin/bash
echo "Uploading deployment package to EC2..."
scp -i "/Users/macbook/Downloads/bikash.pem" -r "deploy-package" ubuntu@"13.51.198.11":/home/ubuntu/
echo "✅ Upload complete!"
echo ""
echo "Next steps:"
echo "1. SSH: ssh -i /Users/macbook/Downloads/bikash.pem ubuntu@13.51.198.11"
echo "2. cd deploy-package"
echo "3. sudo ./step2-system.sh"
echo "4. sudo ./step3-database.sh"
echo "5. ./step4-deps.sh"
echo "6. ./step5-build.sh"
echo "7. sudo ./step6-services.sh"
echo "8. ./step7-start.sh"
