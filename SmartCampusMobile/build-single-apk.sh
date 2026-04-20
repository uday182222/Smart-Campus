#!/bin/bash

# Build Single APK for Smart Campus
# This script builds a single APK file using EAS Build

set -e

cd "$(dirname "$0")"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Building Smart Campus APK${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Install EAS CLI if not available
if ! command -v eas &> /dev/null; then
    echo -e "${YELLOW}📦 Installing EAS CLI...${NC}"
    npm install -g eas-cli
fi

echo -e "${GREEN}✅ EAS CLI ready${NC}"

# Check login status
if ! eas whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Expo${NC}"
    echo -e "${YELLOW}Please log in when prompted...${NC}"
    eas login
fi

echo -e "${GREEN}✅ Logged in to Expo${NC}"

# Check if EAS project is configured
if ! grep -q '"projectId"' app.json 2>/dev/null; then
    echo -e "${YELLOW}⚙️  Configuring EAS project (first time setup)...${NC}"
    echo -e "${YELLOW}Please accept when prompted to create EAS project...${NC}"
    eas init
fi

echo ""

# Build APK using preview profile (configured for APK in eas.json)
echo -e "${BLUE}🔨 Building APK (this will take 10-20 minutes)...${NC}"
echo -e "${YELLOW}The build is running in the cloud. You'll get a download link when it completes.${NC}"
echo ""

eas build --platform android --profile preview

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ APK Build Initiated Successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${YELLOW}📱 Next Steps:${NC}"
    echo "1. Wait for build to complete (check your email or Expo dashboard)"
    echo "2. Download the APK from: https://expo.dev/accounts/$(eas whoami 2>/dev/null | head -n1 | awk '{print $2}')/projects/smart-campus/builds"
    echo "3. Or run: eas build:list (to see build status)"
    echo ""
    echo -e "${BLUE}💡 To download the latest build:${NC}"
    echo "   eas build:list --platform android --limit 1"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Build failed. Please check the error messages above.${NC}"
    exit 1
fi
