#!/bin/bash

echo "============================================"
echo "ParcelPeer Messaging & Notifications Setup"
echo "============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PostgreSQL is installed
echo -n "Checking PostgreSQL installation... "
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✓ Installed${NC}"
    PG_INSTALLED=true
else
    echo -e "${RED}✗ Not installed${NC}"
    PG_INSTALLED=false
fi

echo ""

if [ "$PG_INSTALLED" = false ]; then
    echo -e "${YELLOW}PostgreSQL is not installed.${NC}"
    echo ""
    echo "Options:"
    echo "1. Install PostgreSQL locally (for development)"
    echo "2. Use external PostgreSQL service (recommended)"
    echo ""
    echo "For option 1, run:"
    echo "  sudo apt-get update && sudo apt-get install postgresql postgresql-contrib"
    echo ""
    echo "For option 2, get a free database from:"
    echo "  - Neon: https://neon.tech"
    echo "  - Supabase: https://supabase.com"
    echo "  - Railway: https://railway.app"
    echo ""
    
    read -p "Do you want to install PostgreSQL locally now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Installing PostgreSQL..."
        sudo apt-get update
        sudo apt-get install -y postgresql postgresql-contrib
        
        echo "Starting PostgreSQL..."
        sudo service postgresql start
        
        echo "Creating database and user..."
        sudo -u postgres psql -c "CREATE DATABASE parcelpeer;"
        sudo -u postgres psql -c "CREATE USER parcelpeer WITH PASSWORD 'parcelpeer';"
        sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE parcelpeer TO parcelpeer;"
        
        DATABASE_URL="postgresql://parcelpeer:parcelpeer@localhost:5432/parcelpeer"
    else
        echo ""
        read -p "Enter your PostgreSQL connection string: " DATABASE_URL
    fi
else
    echo -e "${GREEN}PostgreSQL is installed!${NC}"
    echo ""
    
    # Check if database exists
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw parcelpeer; then
        echo -e "${GREEN}✓ Database 'parcelpeer' exists${NC}"
    else
        echo -e "${YELLOW}Creating database 'parcelpeer'...${NC}"
        sudo -u postgres psql -c "CREATE DATABASE parcelpeer;"
        sudo -u postgres psql -c "CREATE USER parcelpeer WITH PASSWORD 'parcelpeer';"
        sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE parcelpeer TO parcelpeer;"
        echo -e "${GREEN}✓ Database created${NC}"
    fi
    
    DATABASE_URL="postgresql://parcelpeer:parcelpeer@localhost:5432/parcelpeer"
fi

echo ""
echo "============================================"
echo "Creating .env file"
echo "============================================"

# Create .env file
cat > /app/.env << EOF
# Database
DATABASE_URL=${DATABASE_URL}

# Server
NODE_ENV=development
PORT=5000

# Firebase Admin (Get these from Firebase Console > Project Settings > Service Accounts)
# FIREBASE_PROJECT_ID=your-project-id
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# FIREBASE_CLIENT_EMAIL=firebase-adminsdk@project.iam.gserviceaccount.com

# Payment (Optional - get from Paystack dashboard)
# PAYSTACK_SECRET_KEY=sk_test_xxx
EOF

echo -e "${GREEN}✓ Created /app/.env${NC}"
echo ""

echo "============================================"
echo "Running Database Migrations"
echo "============================================"
cd /app
yarn db:push

echo ""
echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Update /app/.env with your Firebase credentials"
echo "2. (Optional) Add PAYSTACK_SECRET_KEY for payments"
echo "3. Start the server:"
echo "   cd /app"
echo "   yarn server:dev"
echo ""
echo "Server will run on: http://localhost:5000"
echo "WebSocket endpoint: ws://localhost:5000/ws"
echo ""
echo "📖 See MESSAGING_AND_NOTIFICATIONS_SETUP.md for detailed documentation"
echo ""
