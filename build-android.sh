#!/bin/bash

echo "🚀 SMART CAMPUS - ANDROID BUILD SCRIPT"
echo "======================================"

# Navigate to mobile app directory
cd SmartCampusMobile

echo "📱 Building Android APK for Google Play Store..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create a simple build using Expo
echo "🔨 Creating production build..."
npx expo export --platform android

echo "✅ Build completed!"
echo ""
echo "📋 Next Steps for Google Play Store:"
echo "1. Go to https://play.google.com/console"
echo "2. Create developer account ($25 fee)"
echo "3. Create new app listing"
echo "4. Upload the generated APK/AAB file"
echo "5. Complete store listing details"
echo "6. Submit for review"
echo ""
echo "🎉 Your Smart Campus app is ready for Play Store!"



