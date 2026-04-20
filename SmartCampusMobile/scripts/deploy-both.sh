#!/bin/bash

# Dual Platform Deployment Script for Smart Campus
# This script builds for both iOS and Android simultaneously

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Smart Campus - Dual Platform Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo -e "${RED}❌ EAS CLI is not installed${NC}"
    echo "Install it with: npm install -g eas-cli"
    exit 1
fi

echo -e "${GREEN}✅ EAS CLI is installed${NC}"

# Check if logged in to Expo
if ! eas whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Expo${NC}"
    echo "Logging in..."
    eas login
fi

echo -e "${GREEN}✅ Logged in to Expo${NC}"
echo ""

# Prompt for build type
echo -e "${YELLOW}Select build type:${NC}"
echo "1) Development (for testing)"
echo "2) Preview (internal distribution)"
echo "3) Production (App Stores)"
read -p "Enter choice (1-3): " build_choice

case $build_choice in
    1)
        BUILD_PROFILE="development"
        ;;
    2)
        BUILD_PROFILE="preview"
        ;;
    3)
        BUILD_PROFILE="production"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}Building for both iOS and Android with profile: ${BUILD_PROFILE}${NC}"
echo ""

# Start build for both platforms
eas build --platform all --profile ${BUILD_PROFILE}

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ Builds Completed Successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    
    if [ "$BUILD_PROFILE" = "production" ]; then
        read -p "Do you want to submit to both app stores now? (y/n): " submit_choice
        
        if [ "$submit_choice" = "y" ] || [ "$submit_choice" = "Y" ]; then
            echo ""
            echo -e "${BLUE}Submitting to App Stores...${NC}"
            eas submit --platform all --latest
            
            if [ $? -eq 0 ]; then
                echo ""
                echo -e "${GREEN}✅ Successfully submitted to both App Stores!${NC}"
                echo -e "${YELLOW}iOS: Check App Store Connect${NC}"
                echo -e "${YELLOW}Android: Check Google Play Console${NC}"
            fi
        else
            echo ""
            echo -e "${YELLOW}Builds completed. You can submit later with:${NC}"
            echo "eas submit --platform all --latest"
        fi
    fi
else
    echo ""
    echo -e "${RED}❌ Build failed. Check the error messages above.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Deployment Summary:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}iOS Build:${NC}"
if [ "$BUILD_PROFILE" = "production" ]; then
    echo "  - Type: Production (.ipa)"
    echo "  - Destination: App Store"
elif [ "$BUILD_PROFILE" = "preview" ]; then
    echo "  - Type: Preview (Ad-hoc)"
    echo "  - Destination: Internal distribution"
else
    echo "  - Type: Development"
    echo "  - Destination: Testing"
fi

echo ""
echo -e "${BLUE}Android Build:${NC}"
if [ "$BUILD_PROFILE" = "production" ]; then
    echo "  - Type: Production (.aab)"
    echo "  - Destination: Google Play Store"
elif [ "$BUILD_PROFILE" = "preview" ]; then
    echo "  - Type: Preview (.apk)"
    echo "  - Destination: Internal distribution"
else
    echo "  - Type: Development (.apk)"
    echo "  - Destination: Testing"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Monitor build status in Expo dashboard"
echo "2. Test builds thoroughly before going live"
echo "3. Prepare app store listings and assets"
echo "4. Submit for review when ready"
echo "5. Monitor user feedback after launch"
echo ""

echo -e "${BLUE}Useful Commands:${NC}"
echo "  View builds:    eas build:list"
echo "  Check status:   eas build:view [BUILD_ID]"
echo "  Submit later:   eas submit --platform all --latest"
echo "  OTA update:     eas update --branch production"
echo ""


