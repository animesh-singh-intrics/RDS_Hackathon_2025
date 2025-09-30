#!/bin/bash

echo "🚀 Setting up React-Node.js Full-Stack Application..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then 
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $NODE_VERSION"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install client and server dependencies
echo "📦 Installing client and server dependencies..."
npm run install:all

# Copy environment files
echo "🔧 Setting up environment files..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file"
else
    echo "⚠️  .env file already exists"
fi

if [ ! -f client/.env ]; then
    cp client/.env.example client/.env
    echo "✅ Created client/.env file"
else
    echo "⚠️  client/.env file already exists"
fi

# Build the project
echo "🏗️  Building the project..."
npm run build

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "🚀 To start development:"
echo "   npm run dev"
echo ""
echo "📚 Don't forget to read the DEVELOPMENT_GUIDE.md before coding!"
echo "🌐 Frontend will be available at: http://localhost:3000"
echo "🔧 Backend will be available at: http://localhost:5000"
echo "🏥 API Health check: http://localhost:5000/api/health"