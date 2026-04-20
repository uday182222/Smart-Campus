#!/bin/bash

echo "🚀 Building Smart Campus APK..."
echo "=================================="

cd "$(dirname "$0")"

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g eas-cli
fi

# Check if logged in to EAS
if ! eas whoami &> /dev/null; then
    echo "🔐 Please log in to EAS:"
    eas login
fi

# Build APK using EAS Build (preview profile is configured for APK)
echo "🔨 Building APK (this may take 10-20 minutes)..."
eas build --platform android --profile preview --non-interactive

echo ""
echo "✅ Build initiated!"
echo "📱 You'll receive a download link once the build completes."
echo "💡 Check build status: eas build:list"
