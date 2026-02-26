#!/bin/bash

# EduConnect Backend Startup Script

echo "🚀 Starting EduConnect Backend..."
echo ""

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Creating backend/.env file..."
    cat > backend/.env << 'EOF'
MONGODB_URI=mongodb://localhost:27017/educonnect
PORT=3004
JWT_SECRET=your-secret-key-change-this-in-production
NODE_ENV=development
EOF
    echo "✅ .env file created"
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Starting MongoDB..."
    brew services start mongodb-community
    sleep 2
fi

# Navigate to backend directory and start server
cd backend
echo "📦 Installing dependencies..."
npm install
echo ""
echo "🔥 Starting backend server on port 3004..."
npm run dev
