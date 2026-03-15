# TOX Express Delivery Services - Production Deployment Script
# Run this on your hosting server after uploading files

#!/bin/bash

echo "🚀 TOX Express Delivery Services - Production Deployment"
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing..."
    # For Ubuntu/Debian
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed"
else
    echo "❌ Dependency installation failed"
    exit 1
fi

# Create data directory
if [ ! -d "data" ]; then
    mkdir data
    echo "📁 Created data directory"
fi

# Install PM2 for production
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 process manager..."
    npm install -g pm2
fi

# Stop any existing processes
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Start the application
echo "🚀 Starting TOX Express Delivery Services server..."
pm2 start server.js --name "tox-express"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo ""
echo "🌐 Your website is running at:"
echo "   https://toxexpress.org"
echo ""
echo "👨‍💼 Admin Dashboard:"
echo "   https://toxexpress.org/admin.html"
echo "   Password: ToxAdmin2026 (CHANGE IN PRODUCTION!)"
echo ""
echo "📊 Operations Dashboard:"
echo "   https://toxexpress.org/dashboard.html"
echo ""
echo "🔧 Management Commands:"
echo "   pm2 status          # Check server status"
echo "   pm2 logs            # View server logs"
echo "   pm2 restart all     # Restart server"
echo "   pm2 stop all        # Stop server"
echo ""
echo "📞 Support: Check LAUNCH_CHECKLIST.md for troubleshooting"