# Quick Fix: Environment Setup

## Step-by-Step Fix (5 minutes)

### Step 1: Create .env File

```bash
cd /Users/udaytomar/Developer/Smart-Campus/SmartCampusMobile

# Create .env file
cat > .env << 'EOF'
EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=PLACEHOLDER_KEY_REPLACE_ME
EXPO_PUBLIC_AWS_REGION=eu-north-1
EXPO_PUBLIC_AWS_COGNITO_USER_POOL_ID=eu-north-1_PLACEHOLDER
EXPO_PUBLIC_AWS_COGNITO_CLIENT_ID=PLACEHOLDER_CLIENT_ID
EXPO_PUBLIC_APP_SCHEME=smartcampus
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://example.com/privacy
EXPO_PUBLIC_TERMS_URL=https://example.com/terms
EOF
```

### Step 2: Update app.json

```bash
# Backup current app.json
cp app.json app.json.backup

# You need to manually edit app.json and add:
# 1. Add "scheme": "smartcampus" under "expo"
# 2. Add "extra" section with privacy and terms URLs
```

**Or manually edit `app.json` to add:**

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

### Step 3: Copy AWS Credentials from Server

If you already have AWS configured in your server:

```bash
# Copy AWS credentials from server
cd /Users/udaytomar/Developer/Smart-Campus

# Check server .env
cat server/.env | grep AWS

# Manually copy these values to SmartCampusMobile/.env with EXPO_PUBLIC_ prefix
```

### Step 4: Run Check Again

```bash
cd SmartCampusMobile
npm run deployment-check
```

---

## Expected Result

After fixes, you should see:

```
✅ ALL CHECKS PASSED - READY FOR DEPLOYMENT
```

Or at minimum:

```
✅ DEPLOYMENT READY WITH WARNINGS
Consider addressing warnings before production release
```

---

## If You Don't Have AWS/Google Maps Setup Yet

**Development Mode (Skip for Now):**

The app will work in development without these. To skip deployment checks temporarily:

```bash
# Build without pre-deployment check
expo build:android --no-prebuild

# Or disable the check temporarily in package.json
# Remove "prebuild" script
```

**For Testing Only:**

Create `.env` with placeholder values:

```bash
EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=PLACEHOLDER
EXPO_PUBLIC_AWS_REGION=eu-north-1
EXPO_PUBLIC_AWS_COGNITO_USER_POOL_ID=PLACEHOLDER
EXPO_PUBLIC_AWS_COGNITO_CLIENT_ID=PLACEHOLDER
```

⚠️ **Warning:** App features requiring these services won't work until real values are added.

---

## Need AWS/Google Setup?

**See detailed guides:**
- `/Users/udaytomar/Developer/Smart-Campus/HOW_TO_GET_AWS_CREDENTIALS.md`
- `/Users/udaytomar/Developer/Smart-Campus/AWS-SETUP-STEP-BY-STEP.md`
- `/Users/udaytomar/Developer/Smart-Campus/SIMPLE-AWS-SETUP.md`

---

**Quick help:** Run `npm run deployment-check` after each fix to track progress! 🎯

