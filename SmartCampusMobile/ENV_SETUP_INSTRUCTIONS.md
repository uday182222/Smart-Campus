# Environment Setup Instructions

## ✅ .env File Created!

The `.env` file has been created with placeholder values. Now you need to replace the placeholders with real values.

---

## 🔧 What to Replace

### 1. Google Maps API Key (Optional for now)

**Current:** `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=PLACEHOLDER_GOOGLE_MAPS_KEY`

**Where to get it:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Create/select project
3. Enable Maps SDK for Android and iOS
4. Create API key
5. Copy and replace `PLACEHOLDER_GOOGLE_MAPS_KEY`

**Or keep placeholder** for now if you don't need maps yet.

---

### 2. AWS Cognito Credentials (Optional for now)

**Current values:**
```
EXPO_PUBLIC_AWS_COGNITO_USER_POOL_ID=PLACEHOLDER_USER_POOL_ID
EXPO_PUBLIC_AWS_COGNITO_CLIENT_ID=PLACEHOLDER_CLIENT_ID
```

**If you have AWS Cognito already setup:**

Check your server configuration:
```bash
cat /Users/udaytomar/Developer/Smart-Campus/server/.env | grep COGNITO
```

Copy those values (without AWS_ prefix, add EXPO_PUBLIC_ prefix instead).

**Or keep placeholders** and the app will work in mock mode.

---

### 3. Update app.json

Edit `SmartCampusMobile/app.json` and add these sections:

**Add after line 7 (after "icon"):**
```json
"scheme": "smartcampus",
```

**Add at the end (before closing braces):**
```json
"extra": {
  "privacyPolicyUrl": "https://example.com/privacy",
  "termsOfServiceUrl": "https://example.com/terms",
  "eas": {
    "projectId": "placeholder-project-id"
  }
}
```

**Full example in:** `app.json.fixed`

---

## 🚀 Quick Test

After creating .env and updating app.json:

```bash
# Run deployment check again
npm run deployment-check
```

**Expected improvement:**
- Failed checks should reduce from 13 to ~7
- Passed checks should increase to ~43

---

## 🎯 Minimum to Run App

**For local development and testing, you ONLY need:**

1. ✅ `.env` file created (done!)
2. ✅ Backend server running
3. ⚠️ app.json updated (scheme + extra)

**Everything else can use placeholders for now.**

---

## 🏃 Start the App

```bash
# Terminal 1: Start backend
cd /Users/udaytomar/Developer/Smart-Campus/server
npm run dev

# Terminal 2: Start mobile app
cd /Users/udaytomar/Developer/Smart-Campus/SmartCampusMobile
npm start
```

---

## 📝 Next Steps

1. **Update app.json** (2 minutes)
   - Add `scheme`
   - Add `extra` section
   - See `app.json.fixed` for reference

2. **Run check** (30 seconds)
   ```bash
   npm run deployment-check
   ```

3. **Start backend** (if not running)
   ```bash
   cd ../server && npm run dev
   ```

4. **Test the app** (run on simulator/device)
   ```bash
   npm start
   ```

---

**Your .env file is ready! Now update app.json and you're good to go!** 🎉

