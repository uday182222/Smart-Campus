# 🚀 Smart Campus - Complete Deployment Guide

Welcome to the Smart Campus deployment guide! This document will help you deploy your app to production with AWS backend and both app stores.

## 📚 Documentation Index

1. **[AWS Setup Guide](AWS_SETUP_GUIDE.md)** - Complete AWS infrastructure setup
2. **[App Store Deployment](APP_STORE_DEPLOYMENT_GUIDE.md)** - iOS and Android store deployment
3. **[This README](#quick-start)** - Quick start and overview

---

## 🎯 Quick Start

### Prerequisites Checklist

- [ ] AWS Account with credentials configured
- [ ] Expo Account (free tier is fine)
- [ ] Apple Developer Account ($99/year) for iOS
- [ ] Google Play Developer Account ($25 one-time) for Android
- [ ] Node.js 18+ installed
- [ ] EAS CLI installed globally

### Installation

```bash
# Install dependencies
npm install

# Install EAS CLI globally (if not already installed)
npm install -g eas-cli

# Login to Expo
eas login
```

---

## 🏗️ Deployment Pipeline

### Phase 1: AWS Infrastructure Setup

```bash
# 1. Navigate to cloudformation directory
cd cloudformation

# 2. Deploy all AWS resources
./deploy-all.sh

# 3. Update src/aws-config.ts with output values
# The script saves outputs to aws-outputs.json
```

**What this does:**
- Creates Cognito User Pool with user groups
- Sets up DynamoDB tables for all app data
- Configures S3 bucket for media storage
- Configures IAM roles and permissions

**Time required:** ~10-15 minutes

### Phase 2: Configure App for Stores

```bash
# 1. Initialize EAS project
eas init

# 2. Configure iOS credentials
eas credentials

# 3. Update app.json with your details
# - Bundle identifier (iOS)
# - Package name (Android)
# - App name and description
```

**What this does:**
- Links your app to Expo
- Generates Apple certificates and provisioning profiles
- Creates Android keystore
- Configures build settings

**Time required:** ~15-20 minutes

### Phase 3: Build & Deploy

#### Option 1: Deploy Both Platforms (Recommended)

```bash
# Build and deploy to both stores
npm run deploy:all

# Or manually:
./scripts/deploy-both.sh
```

#### Option 2: Deploy Individually

```bash
# iOS only
npm run deploy:ios
# Or: ./scripts/deploy-ios.sh

# Android only
npm run deploy:android
# Or: ./scripts/deploy-android.sh
```

**What this does:**
- Builds optimized production apps
- Uploads to respective app stores
- Handles code signing automatically

**Time required:** 
- Build: ~20-30 minutes
- Review: 1-7 days (varies by platform)

---

## 📱 Available NPM Scripts

### Development

```bash
npm start           # Start Expo dev server
npm run android     # Run on Android emulator/device
npm run ios         # Run on iOS simulator (macOS only)
npm run web         # Run in web browser
```

### Building

```bash
npm run build:ios:dev        # iOS development build
npm run build:ios:preview    # iOS preview build (TestFlight)
npm run build:ios:prod       # iOS production build

npm run build:android:dev    # Android development build
npm run build:android:preview # Android preview build (APK)
npm run build:android:prod   # Android production build (AAB)

npm run build:all           # Build both platforms (production)
```

### Deployment

```bash
npm run deploy:ios      # Full iOS deployment workflow
npm run deploy:android  # Full Android deployment workflow
npm run deploy:all      # Deploy to both stores
```

### Submission

```bash
npm run submit:ios      # Submit to App Store
npm run submit:android  # Submit to Google Play
npm run submit:all      # Submit to both stores
```

### Updates

```bash
npm run update:prod     # Push OTA update to production
npm run update:staging  # Push OTA update to staging
```

### AWS

```bash
npm run aws:deploy      # Deploy AWS infrastructure
npm run aws:outputs     # View AWS resource outputs
```

---

## 🔑 Configuration Files

### `app.json`
Main Expo configuration file. Update these values:

```json
{
  "expo": {
    "name": "Smart Campus",
    "slug": "smart-campus",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.smartcampus"  // ← Update
    },
    "android": {
      "package": "com.yourcompany.smartcampus"  // ← Update
    },
    "owner": "your-expo-username",  // ← Update
    "extra": {
      "eas": {
        "projectId": "auto-generated-by-eas-init"
      }
    }
  }
}
```

### `eas.json`
EAS Build and Submit configuration. Update for submission:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",  // ← Update
        "ascAppId": "1234567890",  // ← From App Store Connect
        "appleTeamId": "ABCDE12345"  // ← From Apple Developer
      },
      "android": {
        "serviceAccountKeyPath": "./android/service-account-key.json"
      }
    }
  }
}
```

### `src/aws-config.ts`
AWS service configuration. Auto-populated by deployment script:

```typescript
export const awsConfig = {
  region: 'eu-north-1',
  cognito: {
    userPoolId: 'eu-north-1_XXXXXX',  // From CloudFormation
    userPoolClientId: 'XXXXXXXXXX',    // From CloudFormation
    // ...
  }
}
```

---

## 🧪 Testing Before Deployment

### 1. Local Testing

```bash
# Test on iOS simulator
npm run ios

# Test on Android emulator
npm run android

# Test authentication flow
# Test all major features
```

### 2. Development Build Testing

```bash
# Build development version
eas build --platform android --profile development

# Install on physical device
# Test thoroughly
```

### 3. Preview Build Testing

```bash
# Build preview version
npm run build:ios:preview
npm run build:android:preview

# Distribute to internal testers
# Collect feedback
```

---

## 📊 Deployment Checklist

### Pre-Deployment

- [ ] All features tested and working
- [ ] AWS infrastructure deployed
- [ ] Authentication flows verified
- [ ] App icons and splash screens ready
- [ ] Privacy policy and terms created
- [ ] App descriptions written
- [ ] Screenshots prepared (all sizes)
- [ ] Test accounts created

### iOS Deployment

- [ ] Apple Developer account active
- [ ] App created in App Store Connect
- [ ] Bundle ID configured
- [ ] Certificates generated
- [ ] App metadata complete
- [ ] Screenshots uploaded
- [ ] Privacy policy URL added
- [ ] Test account provided
- [ ] Build submitted

### Android Deployment

- [ ] Google Play Console account active
- [ ] App created in Play Console
- [ ] Package name configured
- [ ] Keystore generated
- [ ] Store listing complete
- [ ] Screenshots uploaded
- [ ] Content rating completed
- [ ] Data safety form filled
- [ ] Build submitted

### Post-Deployment

- [ ] Monitor crash reports
- [ ] Respond to reviews
- [ ] Track analytics
- [ ] Plan updates
- [ ] Set up alerts

---

## 🔄 Update Workflow

### Version Updates

1. **Update version numbers** in `app.json`:
   ```json
   {
     "version": "1.0.1",  // Increment
     "ios": {
       "buildNumber": "2"  // Increment
     },
     "android": {
       "versionCode": 2  // Increment
     }
   }
   ```

2. **Build new version**:
   ```bash
   npm run build:all
   ```

3. **Submit to stores**:
   ```bash
   npm run submit:all
   ```

### OTA Updates (No Store Review)

For minor bug fixes and updates:

```bash
# Push update to production users
eas update --branch production --message "Bug fixes"

# Users get update automatically
```

**Note:** Only works for JavaScript changes, not native code.

---

## 📈 Monitoring & Analytics

### Crash Reporting

```bash
# View recent errors
eas logs --platform ios
eas logs --platform android
```

### Build Status

```bash
# List all builds
eas build:list

# View specific build
eas build:view [BUILD_ID]
```

### Analytics Tracking

- **iOS**: App Store Connect → Analytics
- **Android**: Google Play Console → Statistics

---

## 🆘 Troubleshooting

### Common Issues

**Build fails with "Invalid credentials"**
```bash
# Reset credentials
eas credentials
# Select platform → Reset/Remove
```

**Version already exists**
```bash
# Increment version in app.json
# iOS: buildNumber
# Android: versionCode
```

**Submission rejected**
```bash
# Check rejection reason
# Fix issues
# Resubmit: eas submit --platform [ios|android] --latest
```

### Getting Help

- **Expo Forums**: https://forums.expo.dev/
- **Discord**: https://chat.expo.dev/
- **Documentation**: https://docs.expo.dev/

---

## 📝 Environment Variables

Create `.env` file for sensitive data:

```env
# AWS
AWS_REGION=eu-north-1
AWS_USER_POOL_ID=eu-north-1_XXXXXX
AWS_USER_POOL_CLIENT_ID=XXXXXXXXXX

# App Store
APPLE_ID=your-apple-id@email.com
APPLE_TEAM_ID=ABCDE12345

# Google Play
GOOGLE_SERVICE_ACCOUNT=./android/service-account-key.json
```

**Important:** Never commit `.env` to version control!

---

## 🔒 Security Best Practices

1. **Never commit sensitive keys**
   - Use `.gitignore` for keys and certificates
   - Use environment variables
   - Use Expo Secrets for sensitive config

2. **Enable security features**
   - iOS: Face ID/Touch ID for sensitive operations
   - Android: Biometric authentication
   - Enable certificate pinning

3. **Regular updates**
   - Keep dependencies updated
   - Monitor security advisories
   - Update AWS IAM policies regularly

---

## 📅 Release Schedule Recommendation

- **Major updates**: Every 3-4 months
- **Minor updates**: Monthly
- **OTA updates**: As needed (bug fixes)
- **Security patches**: Immediate

---

## 🎉 Success Metrics

Track these KPIs post-deployment:

- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Crash-free rate (target: >99%)
- App Store ratings (target: 4.5+)
- User retention (7-day, 30-day)
- Feature adoption rates

---

## 📞 Support

For deployment support:

- **Email**: support@smartcampus.com
- **Documentation**: Check the guides linked at the top
- **Community**: Expo Discord and Forums

---

## ✅ Final Checklist Before Going Live

- [ ] All tests passing
- [ ] AWS infrastructure stable
- [ ] App store listings complete
- [ ] Privacy policy and terms live
- [ ] Support channels ready
- [ ] Monitoring set up
- [ ] Backup plan in place
- [ ] Team trained on update process
- [ ] Marketing materials ready
- [ ] Press release prepared (if applicable)

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Status**: Ready for Production 🚀

---

## 🚀 Quick Deploy Commands

```bash
# Complete deployment in 3 steps:

# Step 1: Deploy AWS (one-time)
cd cloudformation && ./deploy-all.sh

# Step 2: Initialize EAS (one-time)
eas init

# Step 3: Build and deploy
npm run deploy:all
```

That's it! Your app is now live on both app stores! 🎉








