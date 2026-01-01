#!/bin/bash

# Scan Feature Test Helper Script

echo "🔍 ParcelPeer Scan Feature Test Helper"
echo "========================================"
echo ""

# Check if dependencies are installed
echo "📦 Checking dependencies..."
if grep -q "expo-barcode-scanner" /app/package.json; then
    echo "✅ expo-barcode-scanner is installed"
else
    echo "❌ expo-barcode-scanner not found"
    echo "   Run: cd /app && yarn add expo-barcode-scanner"
    exit 1
fi

echo ""
echo "🗄️  Database Migration Status..."
echo "   To apply migration, run:"
echo "   cd /app && npx tsx server/run-migration.ts"
echo ""

echo "📱 Starting Services..."
echo ""

# Function to check if port is in use
check_port() {
    nc -z localhost $1 2>/dev/null
    return $?
}

# Start backend
echo "🚀 Starting Backend Server (Port 5000)..."
cd /app
if check_port 5000; then
    echo "   ⚠️  Backend already running on port 5000"
else
    npm run server:dev > /tmp/backend-test.log 2>&1 &
    BACKEND_PID=$!
    echo "   Started backend with PID: $BACKEND_PID"
    sleep 3
    
    if check_port 5000; then
        echo "   ✅ Backend is running"
        echo "   📝 Logs: tail -f /tmp/backend-test.log"
    else
        echo "   ❌ Backend failed to start"
        echo "   Check logs: cat /tmp/backend-test.log"
    fi
fi

echo ""
echo "📱 To start Expo frontend, run:"
echo "   cd /app && npm run expo:dev"
echo ""

echo "🧪 Test Endpoints:"
echo "   Health Check: curl http://localhost:5000/health"
echo "   Get Parcels: curl http://localhost:5000/api/parcels"
echo ""

echo "📋 Test Tracking Code:"
echo "   Example code: GTW-ABC234"
echo "   Test lookup: curl http://localhost:5000/api/parcels/tracking/GTW-ABC234"
echo ""

echo "✨ Implementation complete! Ready to test."
echo ""
echo "Next steps:"
echo "1. Apply database migration"
echo "2. Start Expo dev server"
echo "3. Create a test parcel (will get tracking code)"
echo "4. Try scanning the tracking code"
