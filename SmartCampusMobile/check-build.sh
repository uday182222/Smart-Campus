#!/bin/bash

echo "🔍 Checking Smart Campus APK Build Status..."
echo "=========================================="
echo ""

cd "$(dirname "$0")"

eas build:list --platform android --limit 1 --non-interactive 2>&1 | grep -v "DeprecationWarning\|punycode" | head -25

echo ""
echo "💡 To view detailed logs, visit the Logs URL above"
echo "📱 Once status shows 'finished', you can download the APK from the Build Artifacts URL"
