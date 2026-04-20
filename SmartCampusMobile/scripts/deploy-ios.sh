#!/bin/bash

# iOS Deployment Script for Smart Campus
# This script automates the iOS build and deployment process

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Smart Campus - iOS Deployment${NC}"
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
echo "3) Production (App Store)"
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
echo -e "${BLUE}Building iOS app with profile: ${BUILD_PROFILE}${NC}"
echo ""

# Start build
eas build --platform ios --profile ${BUILD_PROFILE}

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ iOS Build Completed Successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    
    if [ "$BUILD_PROFILE" = "production" ]; then
        read -p "Do you want to submit to App Store now? (y/n): " submit_choice
        
        if [ "$submit_choice" = "y" ] || [ "$submit_choice" = "Y" ]; then
            echo ""
            echo -e "${BLUE}Submitting to App Store...${NC}"
            eas submit --platform ios --latest
            
            if [ $? -eq 0 ]; then
                echo ""
                echo -e "${GREEN}✅ Successfully submitted to App Store!${NC}"
                echo -e "${YELLOW}Check App Store Connect for review status${NC}"
            fi
        else
            echo ""
            echo -e "${YELLOW}Build completed. You can submit later with:${NC}"
            echo "eas submit --platform ios --latest"
        fi
    fi
else
    echo ""
    echo -e "${RED}❌ Build failed. Check the error messages above.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Next steps:${NC}"
if [ "$BUILD_PROFILE" = "production" ]; then
    echo "1. Check App Store Connect for build status"
    echo "2. Add screenshots and metadata if not done"
    echo "3. Submit for review"
    echo "4. Monitor review status"
else
    echo "1. Download the build from Expo dashboard"
    echo "2. Install on test devices"
    echo "3. Test thoroughly before production build"
fi
echo ""

