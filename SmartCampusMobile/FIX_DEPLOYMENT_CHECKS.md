# How to Fix Deployment Check Failures

## Current Status

**Deployment Check Results:**
- ✅ Passed: 35/57 (61.4%)
- ❌ Failed: 13
- ⚠️ Warnings: 9

**Status:** ❌ DEPLOYMENT BLOCKED

---

## Required Fixes (13 Failed Checks)

### 1. Environment Variables (6 failures)

**Issue:** Missing required environment variables

**Fix:**

```bash
cd SmartCampusMobile

# Create .env file from template
cp .env.example .env

# Edit .env file and add your values
nano .env  # or use your preferred editor
```

**Add these values to `.env`:**

```bash
# API URL
EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1
# For production: https://your-production-api.com/api/v1

# Google Maps API Key (get from Google Cloud Console)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...your-key-here

# AWS Cognito
EXPO_PUBLIC_AWS_REGION=eu-north-1
EXPO_PUBLIC_AWS_COGNITO_USER_POOL_ID=eu-north-1_xxxxx
EXPO_PUBLIC_AWS_COGNITO_CLIENT_ID=xxxxxxxxxxxxx
```

**How to get these values:**

**Google Maps API Key:**
1. Go to: https://console.cloud.google.com/
2. Create/select project
3. Enable "Maps SDK for Android" and "Maps SDK for iOS"
4. Go to Credentials
5. Create API key
6. Copy and paste into .env

**AWS Cognito Values:**
1. Go to: https://console.aws.amazon.com/cognito/
2. Select your User Pool
3. User Pool ID: Copy from "User pool overview"
4. Client ID: Go to "App integration" → "App clients" → Copy client ID

---

### 2. API Connection (2 failures)

**Issue:** API endpoint not reachable

**Fix:**

**Option 1: Start Local Server**
```bash
# In a new terminal
cd /Users/udaytomar/Developer/Smart-Campus/server
source venv/bin/activate  # if using Python venv
# OR for Node.js:
npm run dev
```

**Option 2: Use Production URL**
```bash
# In .env file
EXPO_PUBLIC_API_URL=https://your-production-api.com/api/v1
```

**Verify API is working:**
```bash
curl http://localhost:5000/api/v1/health
# Should return: {"status":"healthy"}
```

---

### 3. AWS Cognito Configuration (1 failure)

**Issue:** Cognito not configured

**Fix:**

Add to `.env`:
```bash
EXPO_PUBLIC_AWS_REGION=eu-north-1
EXPO_PUBLIC_AWS_COGNITO_USER_POOL_ID=eu-north-1_xxxxx
EXPO_PUBLIC_AWS_COGNITO_CLIENT_ID=xxxxxxxxxxxxx
```

**Already have Cognito setup?**
Check your AWS credentials in `server/.env` or AWS console.

---

### 4. Google Maps API Key (1 failure)

**Issue:** API key not set

**Fix:**

See "Environment Variables" section above for how to get the key.

**Test your key:**
```bash
# Replace YOUR_KEY with your actual key
curl "https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=Museum&inputtype=textquery&key=YOUR_KEY"
```

---

### 5. App Scheme (1 failure)

**Issue:** Deep linking scheme not configured

**Fix:**

Edit `SmartCampusMobile/app.json`:

```json
{
  "expo": {
    "scheme": "smartcampus",
    // ... rest of config
  }
}
```

Or add to `.env`:
```bash
EXPO_PUBLIC_APP_SCHEME=smartcampus
```

---

### 6. Privacy Policy URL (1 failure)

**Issue:** Privacy policy URL not set in app.json

**Fix:**

**Option 1: Use Hosted URL (Recommended)**

1. Host your privacy policy online (GitHub Pages, website, etc.)
2. Add to `app.json`:

```json
{
  "expo": {
    "extra": {
      "privacyPolicyUrl": "https://smartcampus.com/privacy",
      "termsOfServiceUrl": "https://smartcampus.com/terms"
    }
  }
}
```

**Option 2: Quick Fix for Development**

Use placeholder URLs for now:
```json
{
  "expo": {
    "extra": {
      "privacyPolicyUrl": "https://example.com/privacy-placeholder",
      "termsOfServiceUrl": "https://example.com/terms-placeholder"
    }
  }
}
```

⚠️ **Warning:** Must use real URLs before App Store/Play Store submission.

---

### 7. Terms of Service URL (1 failure)

**Issue:** Terms URL not set

**Fix:** Same as Privacy Policy URL above.

---

## Optional Warnings (9 warnings)

These won't block deployment but should be addressed for production:

### EXPO_PUBLIC_SENTRY_DSN

**What:** Error tracking service

**Setup:**
1. Sign up at sentry.io
2. Create project
3. Copy DSN
4. Add to .env:
```bash
EXPO_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

### EAS Project ID

**What:** Required for push notifications

**Setup:**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Link project
eas init

# Project ID will be added to app.json automatically
```

### iOS Background Modes

**What:** Allow app to receive notifications in background

**Fix:** Add to `app.json`:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": [
          "remote-notification",
          "fetch",
          "processing"
        ]
      }
    }
  }
}
```

### Android google-services.json

**What:** Firebase configuration for Android push notifications

**Setup:**
1. Go to: https://console.firebase.google.com/
2. Create/select project
3. Add Android app
4. Download `google-services.json`
5. Place in `SmartCampusMobile/android/app/`

**Or add to app.json:**
```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

---

## Quick Fix: Create .env File

**Create this file: `SmartCampusMobile/.env`**

```bash
# Minimum configuration for development
EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE
EXPO_PUBLIC_AWS_REGION=eu-north-1
EXPO_PUBLIC_AWS_COGNITO_USER_POOL_ID=eu-north-1_xxxxx
EXPO_PUBLIC_AWS_COGNITO_CLIENT_ID=xxxxxxxxxxxxx
```

**Then update `app.json`:**

```json
{
  "expo": {
    "scheme": "smartcampus",
    "extra": {
      "privacyPolicyUrl": "https://example.com/privacy",
      "termsOfServiceUrl": "https://example.com/terms"
    }
  }
}
```

**Run check again:**
```bash
npm run deployment-check
```

---

## Expected Result After Fixes

```
🔍 Running Smart Campus Pre-Deployment Checks...
============================================================

1. Checking Environment Variables
============================================================
✅ EXPO_PUBLIC_API_URL: Set
✅ EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: Set
✅ EXPO_PUBLIC_AWS_REGION: Set
✅ EXPO_PUBLIC_AWS_COGNITO_USER_POOL_ID: Set
✅ EXPO_PUBLIC_AWS_COGNITO_CLIENT_ID: Set

📊 Deployment Check Results
============================================================

Total Checks: 57
Passed: 48
Failed: 0
Warnings: 9

Pass Rate: 84.2%

✅ DEPLOYMENT READY WITH WARNINGS
Consider addressing warnings before production release
```

---

## Verify Fixes

**After making changes, run:**

```bash
# Check environment variables are loaded
cd SmartCampusMobile
cat .env

# Run deployment check
npm run deployment-check

# If all green, run tests
npm test

# Start app to verify
npm start
```

---

## Production Checklist

Before deploying to App Store / Play Store:

### Required
- [ ] All environment variables set (production values)
- [ ] API endpoint reachable (HTTPS)
- [ ] AWS Cognito configured
- [ ] Google Maps API key valid
- [ ] App icons (1024x1024)
- [ ] Splash screen configured
- [ ] app.json: scheme set
- [ ] Privacy policy URL (real, hosted)
- [ ] Terms of service URL (real, hosted)

### Recommended
- [ ] EAS project ID configured
- [ ] Push notification certificates (iOS)
- [ ] Firebase configured (Android push)
- [ ] Sentry error tracking
- [ ] Analytics configured
- [ ] App store screenshots ready
- [ ] App description written
- [ ] Keywords optimized for SEO

---

## Need Help?

**If you're stuck:**

1. **Check existing AWS setup:**
   ```bash
   cat /Users/udaytomar/Developer/Smart-Campus/server/.env | grep AWS
   ```

2. **Use existing credentials:**
   - Copy AWS values from server/.env to SmartCampusMobile/.env
   - Add `EXPO_PUBLIC_` prefix

3. **Contact Support:**
   - Email: support@smartcampus.com
   - Check: docs/TROUBLESHOOTING.md

---

## Quick Command Reference

```bash
# Check deployment status
npm run deployment-check

# View detailed report
cat deployment-check-*.txt

# Start development server (after fixes)
npm start

# Run tests
npm test

# Build for production (after all checks pass)
npm run build:android
npm run build:ios
```

---

**Next Step:** Create `.env` file and run `npm run deployment-check` again! 🚀

