#!/bin/bash

# EduConnect Frontend Startup Script

echo "🚀 Starting EduConnect Frontend..."
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Creating .env file..."
    cat > .env << 'EOF'
VITE_API_URL=http://localhost:3004
PORT=3004
EOF
    echo "✅ .env file created"
fi

echo "📦 Installing dependencies..."
npm install
echo ""
echo "🔥 Starting frontend development server..."
npm run dev
