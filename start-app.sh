#!/bin/bash

echo "🚀 Starting Smart Campus App..."
echo "================================"

cd /Users/udaytomar/Developer/Smart-Campus/SmartCampusMobile

# Kill any existing processes
pkill -f "expo start" 2>/dev/null
pkill -f "react-native" 2>/dev/null

# Wait a moment
sleep 2

echo ""
echo "✅ Starting Expo development server..."
echo ""
echo "📱 TO VIEW ON YOUR PHONE:"
echo "1. Download 'Expo Go' app from Play Store"
echo "2. Open Expo Go and tap 'Scan QR Code'"
echo "3. Scan the QR code that will appear below"
echo ""
echo "💻 TO VIEW ON COMPUTER:"
echo "Press 'w' - Open in web browser"
echo "Press 'a' - Open Android emulator"
echo "Press 'i' - Open iOS simulator"
echo ""
echo "Starting now..."
echo "================================"
echo ""

# Start expo
npx expo start --clear




