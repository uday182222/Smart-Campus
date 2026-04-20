#!/bin/bash

# Smart Campus Deployment Script
echo "🚀 Smart Campus Deployment Script"
echo "================================="

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "SmartCampusMobile" ]; then
    echo "❌ Please run this script from the Smart-Campus root directory"
    exit 1
fi

echo "📱 Starting Mobile App Deployment..."

# Navigate to mobile app directory
cd SmartCampusMobile

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install EAS CLI if not already installed
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g @expo/eas-cli
fi

# Login to Expo (will prompt for credentials)
echo "🔐 Logging into Expo..."
eas login

# Configure EAS build
echo "⚙️ Configuring EAS build..."
eas build:configure

# Build for Android
echo "🤖 Building Android app..."
eas build --platform android --profile production

# Build for iOS
echo "🍎 Building iOS app..."
eas build --platform ios --profile production

echo "✅ Mobile app builds completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Download the built apps from the Expo dashboard"
echo "2. Upload to Google Play Console and App Store Connect"
echo "3. Complete app store listings"
echo "4. Submit for review"
echo ""
echo "🔗 Useful Links:"
echo "- Expo Dashboard: https://expo.dev"
echo "- Google Play Console: https://play.google.com/console"
echo "- App Store Connect: https://appstoreconnect.apple.com"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT_GUIDE.md"



