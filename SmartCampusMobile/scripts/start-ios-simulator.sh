#!/bin/bash
# Run the app in the iOS Simulator (no physical device).
# From repo root: ./scripts/start-ios-simulator.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "📱 Smart Campus — iOS Simulator"
echo "================================"

if [[ "$(xcode-select -p 2>/dev/null)" != "/Applications/Xcode.app/Contents/Developer" ]]; then
  echo ""
  echo "❌ Active Xcode tools are not Xcode.app."
  echo "   Current: $(xcode-select -p 2>/dev/null || echo unknown)"
  echo ""
  echo "   Fix once (password required):"
  echo "     sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
  echo ""
  echo "   Then accept the license if prompted:"
  echo "     sudo xcodebuild -license accept"
  echo ""
  exit 1
fi

if ! xcrun simctl help >/dev/null 2>&1; then
  echo "❌ simctl not working. Open Xcode once (complete install), then retry."
  exit 1
fi

echo "✅ Xcode CLI + simctl OK"

if ! xcrun simctl list runtimes 2>/dev/null | grep -q 'com.apple.CoreSimulator.SimRuntime.iOS'; then
  echo ""
  echo "❌ No iOS Simulator runtime installed (this causes: No iOS devices available in Simulator.app)."
  echo ""
  echo "   Install one:"
  echo "     1. Open Xcode → Settings (⌘,) → Platforms (or \"Components\" in older Xcode)."
  echo "     2. Under iOS, click GET / + next to an iOS version and wait for the download."
  echo "     3. Verify: xcrun simctl list runtimes    (you should see an iOS line)"
  echo "     4. Optional: Window → Devices and Simulators → Simulators → + to add a device."
  echo ""
  exit 1
fi

echo "✅ At least one iOS Simulator runtime is installed"
echo ""

# Simulator talks to Metro on the Mac; API should be localhost when server runs on same machine.
if [[ -f .env.local ]]; then
  if ! grep -q 'EXPO_PUBLIC_API_URL=http://localhost:5000' .env.local 2>/dev/null; then
    echo "⚠️  Tip: set EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1 in .env.local for local API."
  fi
else
  echo 'EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1' >> .env.local
  echo "✅ Created .env.local with localhost API URL."
fi

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck disable=SC1091
  source "$NVM_DIR/nvm.sh"
  nvm use 22 2>/dev/null || nvm use
fi

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

echo "Starting Expo → iOS Simulator (Metro + Simulator)..."
exec npx expo start --ios --clear
