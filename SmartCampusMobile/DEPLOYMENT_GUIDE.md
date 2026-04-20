# Smart Campus Mobile — Deployment Guide

## Section 1 — Prerequisites

- **Node.js** 18+, **npm**
- **Expo CLI** and **EAS CLI** (`npm install -g expo-cli eas-cli`)
- **Apple Developer account** ($99/year) for iOS distribution
- **Google Play Console account** ($25 one-time) for Android distribution
- **Railway account** (free tier works) for the backend API

---

## Section 2 — First time setup

```bash
npm install -g expo-cli eas-cli
cd SmartCampusMobile && npm install
eas login
eas build:configure
```

---

## Section 3 — Build for Android (Play Store)

```bash
# Build AAB for Play Store
eas build --platform android --profile production

# This creates an .aab file — download from expo.dev
# Upload to Google Play Console → Production → Create new release
```

### Step-by-step Play Store submission

1. Go to [play.google.com/console](https://play.google.com/console)
2. Create new app → **Smart Campus**
3. Fill in store listing (description, screenshots, icon)
4. Go to **Production** → **Releases** → **Create new release**
5. Upload the `.aab` file from the EAS build
6. Add release notes
7. Submit for review (typically 1–3 days)

---

## Section 4 — Build for iOS (App Store)

```bash
# Build IPA for App Store
eas build --platform ios --profile production

# Submit directly with EAS
eas submit --platform ios --profile production
```

### Step-by-step App Store submission

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Create new app → **Smart Campus**
3. Fill in app information (description, keywords, screenshots)
4. Upload build via EAS submit or Transporter
5. Submit for review (typically 1–7 days)

---

## Section 5 — Build both at once

```bash
eas build --platform all --profile production
```

---

## Section 6 — Update production API URL

1. After deploying the server to Railway, copy the public URL (e.g. `https://smart-campus-api.railway.app`).
2. Update `eas.json`: in the `production` (and optionally `preview`) profile, set:
   ```json
   "env": {
     "EXPO_PUBLIC_API_URL": "https://YOUR-RAILWAY-URL/api/v1"
   }
   ```
3. Update `SmartCampusMobile/.env.production` with the same `EXPO_PUBLIC_API_URL`.
4. Rebuild the app: `eas build --platform all --profile production`.

---

## Section 7 — App store assets needed

- **App icon:** 1024×1024 PNG (no transparency)
- **Android feature graphic:** 1024×500 PNG
- **Screenshots:** minimum 2 per device type  
  - **Android:** phone (e.g. 1080×1920), 7" tablet, 10" tablet  
  - **iOS:** 6.5" (1284×2778), 5.5" (1242×2208), iPad Pro 12.9"
- **Short description:** max 80 characters
- **Full description:** max 4000 characters

---

## Section 8 — Handoff checklist for client

- [ ] Railway server URL confirmed working
- [ ] Demo users tested (admin / teacher / parent / student)
- [ ] Android build tested on real device
- [ ] iOS build tested on real device
- [ ] Play Store listing approved
- [ ] App Store listing approved
- [ ] Client has Railway account credentials
- [ ] Client has Google Play Console access
- [ ] Client has App Store Connect access
- [ ] Client has AWS credentials (S3 bucket)
- [ ] Database backed up
- [ ] All env vars documented
