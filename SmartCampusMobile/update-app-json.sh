#!/bin/bash
# Script to update app.json with required fields

echo "Updating app.json..."

# Backup original
cp app.json app.json.backup.$(date +%Y%m%d_%H%M%S)

# Use node to update JSON properly
node -e "
const fs = require('fs');
const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));

// Add scheme
appJson.expo.scheme = 'smartcampus';

// Add extra section
if (!appJson.expo.extra) {
  appJson.expo.extra = {};
}
appJson.expo.extra.privacyPolicyUrl = 'https://example.com/privacy';
appJson.expo.extra.termsOfServiceUrl = 'https://example.com/terms';
appJson.expo.extra.eas = { projectId: 'placeholder-project-id' };

// Add iOS background modes
if (!appJson.expo.ios.infoPlist) {
  appJson.expo.ios.infoPlist = {};
}
appJson.expo.ios.infoPlist.UIBackgroundModes = ['remote-notification', 'fetch', 'processing'];

// Write updated JSON
fs.writeFileSync('app.json', JSON.stringify(appJson, null, 2));
console.log('✅ app.json updated successfully!');
"
