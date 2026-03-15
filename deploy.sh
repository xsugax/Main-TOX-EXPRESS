#!/bin/bash

# TOX Express Delivery Services - One-Click Deployment Script
# Run this script to deploy your website to production

echo "🚀 TOX Express Delivery Services - Deployment Script"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install express

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create data directory if it doesn't exist
if [ ! -d "data" ]; then
    mkdir data
    echo "📁 Created data directory"
fi

# Start the server
echo "🚀 Starting TOX Express Delivery Services server..."
echo ""
echo "🌐 Your website will be available at:"
echo "   Local: http://localhost:3000"
echo "   Admin: http://localhost:3000/admin.html"
echo ""
echo "📊 Admin Password: ToxAdmin2026"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

node server.js