# 🚀 Smart Campus - Complete Setup Instructions

This is your complete guide to get Smart Campus running from scratch to production deployment.

## 📋 Table of Contents

1. [Initial Setup](#initial-setup)
2. [AWS Configuration](#aws-configuration)
3. [App Store Setup](#app-store-setup)
4. [Testing](#testing)
5. [Deployment](#deployment)
6. [Troubleshooting](#troubleshooting)

---

## 1. Initial Setup

### Prerequisites

Install required tools:

```bash
# Node.js (v18 or higher)
node --version  # Should be 18+

# Install dependencies
npm install

# Install EAS CLI globally
npm install -g eas-cli

# Install AWS CLI
# macOS:
brew install awscli

# Verify AWS CLI
aws --version
```

### Configure AWS Credentials

```bash
# Configure AWS with your credentials
aws configure

# Enter:
# AWS Access Key ID: [Your Access Key]
# AWS Secret Access Key: [Your Secret Key]
# Default region name: eu-north-1
# Default output format: json

# Verify configuration
aws sts get-caller-identity
```

### Login to Expo

```bash
# Login to Expo account
eas login

# If you don't have an account:
# 1. Go to https://expo.dev
# 2. Sign up for free
# 3. Then run: eas login
```

---

## 2. AWS Configuration

### Step 1: Deploy AWS Infrastructure

```bash
# Navigate to cloudformation directory
cd cloudformation

# Make script executable (if not already)
chmod +x deploy-all.sh

# Deploy all AWS resources
./deploy-all.sh

# This will:
# ✓ Create Cognito User Pool
# ✓ Create DynamoDB tables
# ✓ Create S3 bucket
# ✓ Configure IAM roles
# ✓ Save outputs to aws-outputs.json
```

### Step 2: Update AWS Configuration

The deployment script saves all resource IDs to `aws-outputs.json`. The `src/aws-config.ts` file should already have the correct values from your previous setup:

```typescript
// src/aws-config.ts
export const awsConfig = {
  region: 'eu-north-1',
  cognito: {
    userPoolId: 'eu-north-1_JrEsAN4go',  // ✓ Already configured
    userPoolClientId: '10cj3uqk2ragh21t73gn4513pa',  // ✓ Already configured
    // ...
  }
}
```

### Step 3: Create Test Users

Create test users in AWS Cognito:

```bash
# Super Admin
aws cognito-idp admin-create-user \
  --user-pool-id eu-north-1_JrEsAN4go \
  --username admin@smartcampus.com \
  --user-attributes Name=email,Value=admin@smartcampus.com Name=name,Value="Super Admin" \
  --temporary-password "TempPass123!" \
  --region eu-north-1

aws cognito-idp admin-add-user-to-group \
  --user-pool-id eu-north-1_JrEsAN4go \
  --username admin@smartcampus.com \
  --group-name SuperAdmin \
  --region eu-north-1

# Teacher
aws cognito-idp admin-create-user \
  --user-pool-id eu-north-1_JrEsAN4go \
  --username teacher@smartcampus.com \
  --user-attributes Name=email,Value=teacher@smartcampus.com Name=name,Value="Test Teacher" Name=custom:schoolId,Value="SCH001" \
  --temporary-password "TempPass123!" \
  --region eu-north-1

aws cognito-idp admin-add-user-to-group \
  --user-pool-id eu-north-1_JrEsAN4go \
  --username teacher@smartcampus.com \
  --group-name Teacher \
  --region eu-north-1

# Parent
aws cognito-idp admin-create-user \
  --user-pool-id eu-north-1_JrEsAN4go \
  --username parent@smartcampus.com \
  --user-attributes Name=email,Value=parent@smartcampus.com Name=name,Value="Test Parent" Name=custom:schoolId,Value="SCH001" \
  --temporary-password "TempPass123!" \
  --region eu-north-1

aws cognito-idp admin-add-user-to-group \
  --user-pool-id eu-north-1_JrEsAN4go \
  --username parent@smartcampus.com \
  --group-name Parent \
  --region eu-north-1
```

### Step 4: Add Sample School Data

```bash
# Create sample school
aws dynamodb put-item \
  --table-name SmartCampus-Schools \
  --item '{
    "schoolId": {"S": "SCH001"},
    "name": {"S": "Demo School"},
    "address": {"S": "123 Main Street, Demo City"},
    "phone": {"S": "+1-555-000-0000"},
    "email": {"S": "info@demoschool.com"},
    "adminEmail": {"S": "admin@demoschool.com"},
    "adminName": {"S": "Principal Demo"},
    "status": {"S": "active"},
    "createdAt": {"S": "2025-10-14T00:00:00Z"}
  }' \
  --region eu-north-1
```

---

## 3. App Store Setup

### iOS App Store

#### Step 1: Apple Developer Account

1. Go to [developer.apple.com/programs](https://developer.apple.com/programs)
2. Enroll in Apple Developer Program ($99/year)
3. Wait for approval (24-48 hours)

#### Step 2: App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - Platform: iOS
   - Name: Smart Campus
   - Primary Language: English
   - Bundle ID: `com.smartcampus.mobile`
   - SKU: `smart-campus-001`
4. Save the **App ID** from the URL (you'll need this for `eas.json`)

#### Step 3: Initialize EAS for iOS

```bash
# Initialize EAS project
eas init

# Configure iOS credentials
eas credentials

# Select:
# → iOS
# → Production
# → Generate new Apple Distribution Certificate
# → Generate new Provisioning Profile

# This will:
# ✓ Create certificates
# ✓ Create provisioning profiles
# ✓ Link to your Apple Developer account
```

### Android Google Play

#### Step 1: Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Pay $25 one-time registration fee
3. Create Developer Account

#### Step 2: Create App

1. Click "Create app"
2. Fill in:
   - App name: Smart Campus
   - Default language: English
   - App or game: App
   - Free or paid: Free
3. Accept declarations

#### Step 3: Configure Android

```bash
# Generate Android keystore
eas credentials

# Select:
# → Android
# → Production
# → Generate new Android Keystore

# This will:
# ✓ Create keystore
# ✓ Set passwords
# ✓ Configure signing
```

#### Step 4: Service Account (for automated submission)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable "Google Play Android Developer API"
3. Create Service Account
4. Download JSON key file
5. Save as: `android/service-account-key.json`
6. Grant access in Play Console

### Update Configuration Files

#### Update `app.json`:

```json
{
  "expo": {
    "name": "Smart Campus",
    "slug": "smart-campus",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.smartcampus.mobile",  // ← Keep this
      "buildNumber": "1"
    },
    "android": {
      "package": "com.smartcampus.mobile",  // ← Keep this
      "versionCode": 1
    },
    "extra": {
      "eas": {
        "projectId": "YOUR_PROJECT_ID"  // ← From eas init
      }
    },
    "owner": "your-expo-username"  // ← Your Expo username
  }
}
```

#### Update `eas.json`:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",  // ← Your Apple ID
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

---

## 4. Testing

### Local Testing

```bash
# Test on iOS (macOS only)
npm run ios

# Test on Android
npm run android

# Test authentication with these credentials:
# Email: teacher@smartcampus.com
# Password: TempPass123! (you'll be prompted to change it)
# School ID: SCH001
```

### Development Build Testing

```bash
# Build development version for testing
npm run build:android:dev

# Install on physical device
# Download from Expo dashboard
# Install APK on Android device
```

### Preview Build (Internal Testing)

```bash
# Build preview versions
npm run build:ios:preview    # For TestFlight
npm run build:android:preview  # For internal testers

# Distribute to team
# Collect feedback
```

---

## 5. Deployment

### Quick Deployment (Both Platforms)

```bash
# Complete deployment to both app stores
npm run deploy:all

# This will:
# ✓ Build for iOS
# ✓ Build for Android
# ✓ Prompt for submission
# ✓ Submit to both stores (if confirmed)
```

### Individual Platform Deployment

```bash
# iOS only
npm run deploy:ios

# Android only
npm run deploy:android
```

### Manual Step-by-Step

```bash
# 1. Build production versions
npm run build:all

# 2. Wait for builds to complete (check Expo dashboard)

# 3. Submit to stores
npm run submit:all

# 4. Monitor submission status in:
#    - App Store Connect (iOS)
#    - Google Play Console (Android)
```

---

## 6. Troubleshooting

### AWS Issues

**Problem: AWS credentials not configured**
```bash
aws configure
# Enter your credentials
```

**Problem: CloudFormation stack fails**
```bash
# Check stack status
aws cloudformation describe-stacks --stack-name SmartCampus-Cognito

# View error details
aws cloudformation describe-stack-events --stack-name SmartCampus-Cognito
```

### Build Issues

**Problem: EAS build fails**
```bash
# Clear cache and retry
eas build --platform ios --profile production --clear-cache
```

**Problem: Invalid credentials**
```bash
# Reset credentials
eas credentials
# Select platform → Remove all → Generate new
```

### Authentication Issues

**Problem: User not found**
```bash
# Verify user exists in Cognito
aws cognito-idp admin-get-user \
  --user-pool-id eu-north-1_JrEsAN4go \
  --username teacher@smartcampus.com
```

**Problem: School not found**
```bash
# Verify school exists in DynamoDB
aws dynamodb get-item \
  --table-name SmartCampus-Schools \
  --key '{"schoolId": {"S": "SCH001"}}'
```

---

## ✅ Setup Checklist

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] AWS CLI installed and configured
- [ ] EAS CLI installed
- [ ] Expo account created
- [ ] Apple Developer account (for iOS)
- [ ] Google Play account (for Android)

### AWS Setup
- [ ] AWS credentials configured
- [ ] CloudFormation stacks deployed
- [ ] Test users created
- [ ] Sample school data added
- [ ] AWS config file updated

### App Configuration
- [ ] EAS project initialized
- [ ] iOS credentials generated
- [ ] Android keystore created
- [ ] app.json updated
- [ ] eas.json updated

### Testing
- [ ] Local testing completed
- [ ] Development build tested
- [ ] Preview build tested
- [ ] Authentication verified
- [ ] All features working

### Store Setup
- [ ] App Store Connect app created
- [ ] Google Play Console app created
- [ ] Store listings prepared
- [ ] Screenshots ready
- [ ] Privacy policy created

### Deployment
- [ ] Production builds created
- [ ] Submitted to App Store
- [ ] Submitted to Google Play
- [ ] Monitoring set up
- [ ] Support ready

---

## 🎉 Next Steps After Setup

1. **Test thoroughly** - Make sure everything works
2. **Prepare marketing** - App descriptions, screenshots
3. **Set up analytics** - Track user behavior
4. **Plan updates** - Regular feature additions
5. **Monitor feedback** - Respond to reviews

---

## 📚 Additional Resources

- **AWS Setup**: [AWS_SETUP_GUIDE.md](AWS_SETUP_GUIDE.md)
- **Deployment**: [APP_STORE_DEPLOYMENT_GUIDE.md](APP_STORE_DEPLOYMENT_GUIDE.md)
- **Quick Reference**: [DEPLOYMENT_README.md](DEPLOYMENT_README.md)

---

## 🆘 Getting Help

- **Expo Discord**: https://chat.expo.dev/
- **Expo Forums**: https://forums.expo.dev/
- **AWS Support**: https://aws.amazon.com/support/
- **Stack Overflow**: Tag with `expo`, `react-native`, `aws`

---

## 🚀 Quick Commands Reference

```bash
# Development
npm start                    # Start dev server
npm run android             # Run on Android
npm run ios                 # Run on iOS

# Building
npm run build:all           # Build both platforms
npm run build:ios:prod      # Build iOS only
npm run build:android:prod  # Build Android only

# Deployment
npm run deploy:all          # Deploy to both stores
npm run deploy:ios          # Deploy to App Store
npm run deploy:android      # Deploy to Google Play

# AWS
npm run aws:deploy          # Deploy AWS infrastructure
npm run aws:outputs         # View AWS outputs

# Updates
npm run update:prod         # Push OTA update
```

---

**You're all set! 🎉**

Your Smart Campus app is now ready for deployment. Follow the steps above, and you'll have your app live on both app stores soon!

**Good luck with your launch! 🚀**








