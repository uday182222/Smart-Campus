#!/bin/bash

# Smart Campus Flutter App Setup Script

echo "🚀 Setting up Smart Campus Flutter App..."

# Check if Flutter is installed
if ! command -v flutter &> /dev/null; then
    echo "❌ Flutter is not installed. Please install Flutter first."
    echo "Visit: https://flutter.dev/docs/get-started/install"
    exit 1
fi

# Check Flutter version
echo "📱 Flutter version:"
flutter --version

# Get dependencies
echo "📦 Installing dependencies..."
flutter pub get

# Check for connected devices
echo "🔍 Checking for available devices..."
flutter devices

# Run Flutter doctor to check setup
echo "🏥 Running Flutter doctor..."
flutter doctor

echo "✅ Setup complete!"
echo ""
echo "📱 To run the app:"
echo "   flutter run"
echo ""
echo "📱 To run on specific platform:"
echo "   flutter run -d ios     # iOS Simulator"
echo "   flutter run -d android # Android Emulator"
echo "   flutter run -d macos   # macOS Desktop"
echo "   flutter run -d chrome  # Web Browser"
echo ""
echo "🔧 Development commands:"
echo "   flutter pub get        # Install dependencies"
echo "   flutter clean          # Clean build cache"
echo "   flutter build apk      # Build Android APK"
echo "   flutter build ios      # Build iOS app"
echo ""
echo "🎯 Happy coding!" 