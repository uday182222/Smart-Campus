#!/bin/bash

# Network Diagnostics for Expo Go Connectivity
# This script checks if your mobile device can reach the Metro bundler

echo "🔍 Expo Go Network Diagnostics"
echo "==============================="
echo ""

# Get local IP
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

if [ -z "$LOCAL_IP" ]; then
  echo "❌ Could not determine local IP address"
  echo "   Please check your network connection"
  exit 1
fi

echo "📍 Local IP Address: $LOCAL_IP"
echo ""

# Check Metro status
echo "🔍 Checking Metro Bundler..."
METRO_STATUS=$(curl -s http://localhost:8081/status 2>&1)

if echo "$METRO_STATUS" | grep -q "running"; then
  echo "✅ Metro bundler is running on localhost:8081"
else
  echo "❌ Metro bundler is not responding"
  echo "   Run: cd SmartCampusMobile && npm start"
  exit 1
fi
echo ""

# Check if port is open
echo "🔍 Checking Port 8081..."
if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "✅ Port 8081 is listening"
  PID=$(lsof -ti:8081 | head -1)
  echo "   Process ID: $PID"
else
  echo "❌ Port 8081 is not listening"
  exit 1
fi
echo ""

# Check firewall (macOS)
echo "🔍 Checking Firewall..."
if /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate | grep -q "enabled"; then
  echo "⚠️  Firewall is enabled - may block connections"
  echo "   Go to: System Preferences → Security & Privacy → Firewall → Firewall Options"
  echo "   Allow: node, expo, or disable firewall temporarily"
else
  echo "✅ Firewall is disabled (connections allowed)"
fi
echo ""

# Test if IP is reachable
echo "🔍 Testing Network Reachability..."
if ping -c 1 $LOCAL_IP >/dev/null 2>&1; then
  echo "✅ Your computer is reachable at $LOCAL_IP"
else
  echo "⚠️  Cannot ping $LOCAL_IP"
fi
echo ""

# Provide connection URLs
echo "📱 Connection URLs for Expo Go:"
echo "==============================="
echo ""
echo "Method 1: Scan QR Code (Recommended)"
echo "  → Expo should show a QR code in terminal"
echo "  → Scan with Expo Go app (Android) or Camera app (iOS)"
echo ""
echo "Method 2: Manual Entry"
echo "  → Open Expo Go app"
echo "  → Tap 'Enter URL manually'"
echo "  → Enter: exp://$LOCAL_IP:8081"
echo ""
echo "Method 3: LAN Connection"
echo "  → Ensure phone and computer are on same WiFi"
echo "  → WiFi name should match on both devices"
echo ""

# Check if phone and computer are on same network
echo "🔍 Network Checklist:"
echo "  1. ✓ Computer IP: $LOCAL_IP"
echo "  2. ? Phone connected to same WiFi?"
echo "  3. ? Firewall allows connections?"
echo "  4. ? Expo Go app installed on phone?"
echo ""

# Troubleshooting tips
echo "💡 Troubleshooting:"
echo "==============================="
echo ""
echo "If Expo Go still won't connect:"
echo ""
echo "Option 1: Use Tunnel Mode (slower but works anywhere)"
echo "  cd SmartCampusMobile"
echo "  expo start --tunnel"
echo "  → This works even on different networks"
echo ""
echo "Option 2: Use Localhost (simulator only)"
echo "  expo start --localhost"
echo "  → Only works for iOS Simulator / Android Emulator"
echo ""
echo "Option 3: Temporarily disable firewall"
echo "  System Preferences → Security & Privacy → Firewall → Turn Off"
echo "  → Remember to turn it back on later!"
echo ""

echo "🎯 Summary:"
echo "  Metro: ✅ Running"
echo "  IP: ✅ $LOCAL_IP"
echo "  Port: ✅ 8081 open"
echo "  URL: exp://$LOCAL_IP:8081"
echo ""
echo "Try scanning the QR code again, or use tunnel mode if issues persist!"

