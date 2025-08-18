#!/bin/bash

# Delete existing DynamoDB tables
REGION=$(aws configure get region || echo "ap-southeast-2")

echo "Deleting existing DynamoDB tables..."

TABLES=("users" "appointments" "educational-materials" "sessions" "messages" "therapists" "emergency-contacts")

for table in "${TABLES[@]}"; do
    if aws dynamodb describe-table --table-name $table --region $REGION >/dev/null 2>&1; then
        echo "Deleting table: $table"
        aws dynamodb delete-table --table-name $table --region $REGION >/dev/null 2>&1
    fi
done

echo "Waiting for tables to be deleted..."
sleep 5
echo "Done"
