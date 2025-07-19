#!/bin/bash
echo "Step 3: Setting up database..."
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo -u postgres psql -c "CREATE DATABASE collegesafe_db;"
sudo -u postgres psql -c "CREATE USER collegesafe WITH PASSWORD 'collegesafe123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE collegesafe_db TO collegesafe;"
sudo -u postgres psql -c "ALTER USER collegesafe CREATEDB;"
echo "✅ Database setup complete"
