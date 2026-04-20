# 📱 App Store & Play Store Deployment Guide

## Complete guide to publishing Smart Campus on iOS App Store and Google Play Store

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Expo EAS Build Setup](#expo-eas-build-setup)
3. [iOS App Store Deployment](#ios-app-store-deployment)
4. [Android Play Store Deployment](#android-play-store-deployment)
5. [App Store Optimization (ASO)](#app-store-optimization)
6. [Post-Launch Monitoring](#post-launch-monitoring)

---

## Prerequisites

### Required Accounts & Fees

#### Apple Developer Account
- **Cost:** $99/year
- **URL:** https://developer.apple.com/
- **Required for:** iOS app distribution
- **Processing Time:** 1-2 business days

#### Google Play Developer Account
- **Cost:** $25 one-time fee
- **URL:** https://play.google.com/console/
- **Required for:** Android app distribution
- **Processing Time:** 48 hours (can be up to 1 week)

### Required Tools

```bash
# Check installations
node --version    # Need 18+
npm --version     # Need 9+
expo --version    # Need 49+

# Install if missing
npm install -g expo-cli
npm install -g eas-cli
```

### Required Assets

Create these before starting:

1. **App Icon** - 1024x1024px (PNG, no transparency)
2. **App Screenshots:**
   - iOS: Various iPhone & iPad sizes
   - Android: 16:9 ratio, various sizes
3. **Feature Graphic** (Android) - 1024x500px
4. **App Store Screenshots** - See detailed requirements below
5. **Privacy Policy URL** (required)
6. **Terms of Service URL** (optional but recommended)

---

## Expo EAS Build Setup (30 minutes)

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli

# Login to Expo
eas login

# Enter your Expo credentials
# (Create account at expo.dev if needed)
```

### Step 2: Configure EAS

```bash
cd /Users/udaytomar/Developer/Smart-Campus/SmartCampusMobile

# Initialize EAS
eas build:configure
```

This creates `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.9.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "channel": "production"
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-email@example.com",
        "ascAppId": "your-asc-app-id",
        "appleTeamId": "your-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### Step 3: Update app.json

**Update:** `app.json`

```json
{
  "expo": {
    "name": "Smart Campus",
    "slug": "smart-campus",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "scheme": "smartcampus",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#3B82F6"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.smartcampus.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses the camera to upload profile pictures and school logos.",
        "NSPhotoLibraryUsageDescription": "This app accesses your photo library to select profile pictures and school logos.",
        "NSMicrophoneUsageDescription": "This app uses the microphone for video calls with teachers."
      },
      "config": {
        "googleMapsApiKey": "YOUR_GOOGLE_MAPS_API_KEY"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#3B82F6"
      },
      "package": "com.smartcampus.app",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ],
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
        }
      }
    },
    "web": {
      "favicon": "./assets/favicon.png",
      "bundler": "metro"
    },
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow Smart Campus to access your photos to upload profile pictures."
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "Allow Smart Campus to access your camera."
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    },
    "owner": "your-expo-username"
  }
}
```

---

## iOS App Store Deployment

### Phase 1: Apple Developer Account Setup (1 hour)

#### Step 1: Enroll in Apple Developer Program

1. **Go to:** https://developer.apple.com/programs/enroll/
2. **Sign in** with your Apple ID
3. **Select:** Individual or Organization
4. **Payment:** $99/year
5. **Wait** for approval (1-2 business days)

#### Step 2: Create App Store Connect Account

1. **Go to:** https://appstoreconnect.apple.com/
2. **Sign in** with Apple ID
3. **Accept** agreements

#### Step 3: Create App ID

1. **Navigate:** Certificates, Identifiers & Profiles
2. **Click:** Identifiers → (+)
3. **Select:** App IDs
4. **Configure:**
   ```
   Description: Smart Campus
   Bundle ID: com.smartcampus.app (Explicit)
   
   Capabilities:
   ✓ Push Notifications
   ✓ Sign in with Apple
   ✓ Associated Domains
   ```
5. **Register**

#### Step 4: Create App in App Store Connect

1. **Go to:** Apps → (+) → New App
2. **Fill in:**
   ```
   Platform: iOS
   Name: Smart Campus
   Primary Language: English (U.S.)
   Bundle ID: com.smartcampus.app
   SKU: SMARTCAMPUS2025
   User Access: Full Access
   ```

### Phase 2: Prepare Assets (2-3 hours)

#### Required Screenshots Sizes:

**iPhone:**
- 6.9" (iPhone 16 Pro Max): 1320 x 2868 pixels
- 6.7" (iPhone 15 Pro Max): 1290 x 2796 pixels
- 6.5" (iPhone 14 Plus): 1284 x 2778 pixels
- 5.5" (iPhone 8 Plus): 1242 x 2208 pixels

**iPad Pro:**
- 12.9" (6th gen): 2048 x 2732 pixels
- 11" (6th gen): 1668 x 2388 pixels

**Number needed:** 3-10 screenshots per device size (minimum 3)

#### Create Screenshots:

**Option 1: Using Simulator**
```bash
# Start iOS simulator
npm run ios

# Take screenshots:
# Cmd + S in simulator
# Screenshots saved to Desktop
```

**Option 2: Using Design Tools**
- Use Figma/Sketch
- Templates: https://www.appstorescreenshot.com/

**Best Practices:**
- Show key features
- Add captions/text overlay
- Use real data (not placeholder)
- Consistent branding
- Show value proposition

### Phase 3: Build for iOS (30 minutes)

#### Step 1: Build with EAS

```bash
cd SmartCampusMobile

# Build for iOS
eas build --platform ios --profile production

# This will:
# 1. Ask for Apple ID credentials
# 2. Generate/update signing credentials
# 3. Build the app
# 4. Upload to Expo servers
```

**Follow prompts:**

```
✔ App store or Ad Hoc? › app-store

# Apple credentials
✔ What is your Apple ID? › your-email@apple.com
✔ Provide your Apple ID password: › ••••••••

# 2FA code
✔ One-time password from SMS: › 123456

# Team selection
✔ Select team › YourTeamName (ABC123)

# Build starts...
⚙️  Build details: https://expo.dev/accounts/[username]/projects/smart-campus/builds/[build-id]

✅ Build finished successfully!
```

**Build time:** 10-20 minutes

#### Step 2: Download .ipa File

```bash
# Download when ready
eas build:download --platform ios --latest
```

Or download from: https://expo.dev/accounts/[username]/projects/smart-campus/builds

### Phase 4: Upload to App Store Connect (20 minutes)

#### Option 1: Using Transporter (Mac only - Recommended)

1. **Download Transporter** from Mac App Store
2. **Sign in** with Apple ID
3. **Click:** (+) → Select your .ipa file
4. **Click:** Deliver
5. **Wait:** Processing (5-30 minutes)

#### Option 2: Using EAS Submit

```bash
eas submit --platform ios --latest

# Follow prompts:
✔ ASC API Key configuration
✔ Path: ./path-to-key.json
```

### Phase 5: Complete App Store Listing (1-2 hours)

1. **Go to:** App Store Connect → My Apps → Smart Campus

2. **App Information:**
   ```
   Name: Smart Campus
   Subtitle: School Management Made Easy
   Category: Education
   Secondary Category: Productivity
   ```

3. **Pricing and Availability:**
   ```
   Price: Free
   Availability: All countries
   ```

4. **App Privacy:**
   ```
   Data Types Collected:
   ✓ Contact Info (email, name, phone)
   ✓ User Content (photos, assignments)
   ✓ Usage Data (analytics)
   
   Privacy Policy URL: https://yourdomain.com/privacy
   ```

5. **Version Information:**
   ```
   Description:
   Smart Campus is a comprehensive school management system that connects students, teachers, parents, and administrators. 
   
   Features:
   • Real-time attendance tracking
   • Homework management
   • Fee payment system
   • Transport tracking
   • Parent-teacher communication
   • School announcements
   • Performance analytics
   
   Perfect for schools looking to digitalize their operations and improve communication.
   
   Keywords: school, education, management, student, teacher, parent, attendance, homework
   
   Support URL: https://yourdomain.com/support
   Marketing URL: https://yourdomain.com
   
   Copyright: 2025 Smart Campus Inc.
   
   What's New in This Version:
   - Initial release
   - Complete school management features
   - Real-time notifications
   - Multi-role access
   ```

6. **Screenshots:**
   - Upload all prepared screenshots
   - Add captions/descriptions

7. **App Review Information:**
   ```
   Contact Email: support@yourdomain.com
   Contact Phone: +1-555-XXX-XXXX
   
   Demo Account:
   Username: demo@school.com
   Password: Demo@123
   School ID: SCH001
   
   Notes:
   This app requires users to have a school account. Use the demo credentials to test all features.
   ```

8. **Build:**
   - Select the uploaded build
   - Wait for processing to complete

### Phase 6: Submit for Review (5 minutes)

1. **Click:** "Add for Review"
2. **Select:** Manual Release or Automatic
3. **Review:** Export Compliance
   ```
   Does your app use encryption? 
   → No (or configure based on your needs)
   ```
4. **Click:** "Submit for Review"

**Review Time:** 1-3 days (typically 24-48 hours)

---

## Android Play Store Deployment

### Phase 1: Google Play Console Setup (30 minutes)

#### Step 1: Create Developer Account

1. **Go to:** https://play.google.com/console/signup
2. **Sign in** with Google account
3. **Pay:** $25 one-time fee
4. **Complete:** Developer profile
5. **Wait:** Approval (24-48 hours)

#### Step 2: Create App

1. **Go to:** Play Console → Create app
2. **Fill in:**
   ```
   App name: Smart Campus
   Default language: English (United States)
   App or game: App
   Free or paid: Free
   
   Declarations:
   ✓ I confirm this app complies with Google Play policies
   ✓ I acknowledge that my app must comply with US export laws
   ```

### Phase 2: Set Up App Content (1 hour)

#### Complete All Required Sections:

**1. App Access:**
```
All or some functionality restricted: Yes
Provide demo credentials:
- Email: demo@school.com
- Password: Demo@123
- School ID: SCH001
```

**2. Ads:**
```
Does your app contain ads? No
```

**3. Content Rating:**
```
Complete questionnaire for Education category
Expected rating: PEGI 3 / ESRB Everyone
```

**4. Target Audience:**
```
Age groups: 13 and older
```

**5. News App:**
```
Is this a news app? No
```

**6. COVID-19 Contact Tracing:**
```
Is this a contact tracing app? No
```

**7. Data Safety:**
```
Data Collection:
✓ Personal info (name, email)
✓ Photos and videos
✓ App activity

Data Usage:
✓ App functionality
✓ Account management

Data Sharing: No third-party sharing

Security:
✓ Data encrypted in transit
✓ Users can request data deletion
✓ Follows Families Policy requirements
```

**8. Government Apps:**
```
Is this a government app? No
```

**9. Financial Features:**
```
Does your app offer financial features? Yes
- In-app payments for school fees
```

**10. Privacy Policy:**
```
Privacy Policy URL: https://yourdomain.com/privacy
```

### Phase 3: Prepare Assets (2 hours)

#### Required Graphics:

**App Icon:**
- 512 x 512 px
- 32-bit PNG
- No transparency

**Feature Graphic:**
- 1024 x 500 px
- JPG or 24-bit PNG

**Screenshots:**
- Phone: Minimum 2, maximum 8
  - Size: 16:9 ratio
  - Recommended: 1080 x 1920 px
- 7-inch Tablet: (Optional but recommended)
- 10-inch Tablet: (Optional but recommended)

**Promotional Graphics (Optional):**
- Promo graphic: 180 x 120 px
- TV banner: 1280 x 720 px

### Phase 4: Build for Android (20 minutes)

#### Step 1: Generate Keystore

```bash
cd SmartCampusMobile

# EAS handles keystore automatically
eas build --platform android --profile production

# Or manage your own:
eas credentials
```

#### Step 2: Build AAB (Android App Bundle)

```bash
eas build --platform android --profile production

# This creates .aab file (required for Play Store)
```

**Follow prompts:**

```
✔ Generate a new Android Keystore? › yes

# Keystore details
✔ Keystore password: › ••••••••
✔ Key alias: › smartcampuskey
✔ Key password: › ••••••••

# Build starts...
⚙️  Build details: https://expo.dev/accounts/[username]/projects/smart-campus/builds/[build-id]

✅ Build finished successfully!
```

#### Step 3: Download .aab File

```bash
eas build:download --platform android --latest
```

### Phase 5: Upload to Play Console (30 minutes)

#### Create Internal Testing Track First:

1. **Navigate:** Testing → Internal testing
2. **Click:** Create new release
3. **Upload:** App bundle (.aab file)
4. **Release name:** 1.0.0 (1)
5. **Release notes:**
   ```
   Initial release of Smart Campus
   - Complete school management features
   - Real-time attendance tracking
   - Homework management
   - Fee payment system
   - Parent-teacher communication
   ```
6. **Click:** Review release → Start rollout

#### Add Testers:

```
Create email list:
- test1@example.com
- test2@example.com

Share opt-in URL with testers
```

**Test for 1-2 days before production**

### Phase 6: Production Release (15 minutes)

1. **Navigate:** Production → Create new release
2. **Promote** from Internal testing or upload new .aab
3. **Countries:** Select all (or specific)
4. **Rollout percentage:** Start with 20% (recommended)
5. **Click:** Review release → Start rollout to production

### Phase 7: Complete Store Listing (30 minutes)

**Main Store Listing:**

```
App name: Smart Campus

Short description (80 chars):
Complete school management system for students, teachers, parents, and admins.

Full description (4000 chars):
🏫 Smart Campus - Revolutionizing School Management

Smart Campus is the all-in-one school management solution that brings together students, teachers, parents, and administrators on a single platform.

✨ KEY FEATURES

📊 For School Administrators:
• Manage multiple schools from one dashboard
• Track school-wide analytics and performance
• Manage teachers, students, and staff
• Generate comprehensive reports
• Fee management and tracking

👨‍🏫 For Teachers:
• Mark attendance quickly
• Assign and grade homework
• Track student performance
• Communicate with parents
• Manage class schedules

👨‍👩‍👧 For Parents:
• Monitor child's attendance and grades
• View homework and assignments
• Track fee payments
• Real-time bus tracking
• Direct messaging with teachers

🎓 For Students:
• View attendance records
• Check homework and deadlines
• Access class schedule
• View performance metrics
• School announcements

🚀 POWERFUL FEATURES

• Real-time Notifications
• Multi-language Support
• Offline Access
• Secure & Private
• Easy to Use
• Cloud Backup
• Regular Updates

📱 PERFECT FOR

• Primary & Secondary Schools
• Private & Public Schools
• International Schools
• Education Institutions
• After-school Programs

🔒 SECURITY & PRIVACY

Your data security is our top priority. All information is encrypted and stored securely. We never share your data with third parties.

📞 SUPPORT

Need help? Contact us:
Email: support@smartcampus.com
Website: www.smartcampus.com

Download Smart Campus today and experience the future of school management!

App category: Education
Tags: school, management, education, student, teacher, attendance
```

**Graphics:**
- Upload app icon
- Upload feature graphic
- Upload all screenshots
- Upload promo graphics (optional)

**Contact Details:**
```
Email: support@yourdomain.com
Phone: +1-XXX-XXX-XXXX
Website: https://yourdomain.com
```

**Save** all changes

### Phase 8: Submit for Review

1. **Check:** All sections marked complete ✅
2. **Navigate:** Publishing overview
3. **Click:** "Send X changes for review"
4. **Confirm:** Submit

**Review Time:** 1-7 days (usually 2-3 days)

---

## App Store Optimization (ASO)

### Keywords Research

**Tools:**
- App Annie
- Sensor Tower
- Mobile Action

**Target Keywords:**
- school management
- education app
- student attendance
- homework tracker
- parent teacher communication
- school fees
- class schedule
- educational software

### App Icon Best Practices

1. **Simple & recognizable**
2. **Works at all sizes**
3. **No text** (or minimal)
4. **Consistent branding**
5. **Test on both light/dark backgrounds**

### Screenshots Best Practices

1. **Show 5 key features**
2. **Use captions**
3. **Real data, not placeholders**
4. **Localize for major markets**
5. **First 2-3 are most important**

### Description Optimization

**iOS (4000 chars):**
- First 170 chars are most important (shown without expansion)
- Use bullet points
- Include keywords naturally
- Clear call to action

**Android (4000 chars):**
- First 80 chars shown in search results
- Use formatting (bullets, spacing)
- Include keywords in first paragraph
- Update regularly

---

## Post-Launch Monitoring

### Week 1 Checklist:

- [ ] Monitor crash reports (daily)
- [ ] Respond to user reviews (within 24h)
- [ ] Track download numbers
- [ ] Monitor app performance
- [ ] Check conversion rate
- [ ] Review analytics

### Tools to Use:

**Expo Analytics:**
```bash
# View builds
eas build:list

# View submissions
eas submit:list
```

**App Store Connect:**
- App Analytics
- Crash reports
- User reviews
- Sales & Trends

**Google Play Console:**
- Statistics
- Crashes & ANRs
- User reviews
- Pre-launch reports

### Update Strategy:

**Minor Updates (Bug fixes):**
- Every 2-4 weeks
- Version: 1.0.1, 1.0.2, etc.

**Major Updates (Features):**
- Every 2-3 months
- Version: 1.1.0, 1.2.0, etc.

**Update Process:**
```bash
# Update version in app.json
"version": "1.0.1"

# iOS: Increment buildNumber
"buildNumber": "2"

# Android: Increment versionCode
"versionCode": 2

# Build
eas build --platform all --profile production

# Submit
eas submit --platform all --latest
```

---

## Troubleshooting

### Common iOS Issues:

**1. Build fails - Missing credentials**
```bash
eas credentials
# Regenerate credentials
```

**2. App rejected - Metadata issue**
- Update description/screenshots
- Resubmit with changes

**3. App rejected - Demo account issue**
- Ensure demo account works
- Provide clear instructions

### Common Android Issues:

**1. Upload rejected - Duplicate package**
```bash
# Increment versionCode in app.json
```

**2. Policy violation**
- Review Data Safety section
- Update privacy policy
- Resubmit

**3. Pending publication**
- Can take up to 7 days
- Check spam folder for emails

---

## Cost Summary

### One-time Costs:
- Apple Developer: $99/year
- Google Play: $25 (one-time)
- **Total First Year:** $124

### Ongoing Costs:
- Apple Developer: $99/year
- Domain name: ~$15/year
- Hosting (privacy policy): ~$5/month
- **Total Yearly (after first):** ~$174/year

---

## Timeline Estimate

### From Start to Published:

**iOS:**
- Setup: 1 hour
- Assets: 2-3 hours
- Build & Upload: 1 hour
- Store Listing: 2 hours
- Review: 1-3 days
**Total: ~3-5 days**

**Android:**
- Setup: 30 min
- Assets: 2 hours  
- Build & Upload: 30 min
- Store Listing: 1 hour
- Review: 2-7 days
**Total: ~3-8 days**

**Both Platforms: 1-2 weeks** (including review time)

---

## Checklist Before Submission

### Technical:
- [ ] App builds successfully
- [ ] No crashes on startup
- [ ] All features work
- [ ] Demo account works
- [ ] Privacy policy accessible
- [ ] Terms of service accessible

### Content:
- [ ] App icon (all sizes)
- [ ] Screenshots (all required sizes)
- [ ] App description written
- [ ] Keywords researched
- [ ] Feature graphic created (Android)
- [ ] Demo credentials documented

### Legal:
- [ ] Privacy policy reviewed
- [ ] Terms of service reviewed
- [ ] Content rating completed
- [ ] Data safety completed
- [ ] Export compliance verified

### Marketing:
- [ ] Landing page ready
- [ ] Support email setup
- [ ] Social media ready
- [ ] Press kit prepared
- [ ] Launch announcement ready

---

## 🎉 Success Metrics

### Target for First Month:
- 100+ downloads
- 4.0+ star rating
- < 1% crash rate
- 50% retention (Day 7)
- 25% retention (Day 30)

### Target for First Year:
- 10,000+ downloads
- 4.5+ star rating
- < 0.1% crash rate
- Active user base
- Positive reviews

---

## Support Resources

**Expo EAS:**
- Docs: https://docs.expo.dev/eas/
- Discord: https://chat.expo.dev/

**Apple:**
- App Store Connect: https://appstoreconnect.apple.com/
- Guidelines: https://developer.apple.com/app-store/review/guidelines/

**Google:**
- Play Console: https://play.google.com/console
- Guidelines: https://play.google.com/about/developer-content-policy/

---

**🚀 You're ready to launch! Good luck with your app store submission!**

**Questions? Check the troubleshooting section or contact Expo support.**

