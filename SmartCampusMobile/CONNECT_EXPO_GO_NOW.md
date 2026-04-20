# 📱 Connect Expo Go - Step by Step

## ✅ Your Connection Details

**Local IP:** `192.168.1.15`
**Port:** `8081`
**Connection URL:** `exp://192.168.1.15:8081`

---

## 🎯 Method 1: Scan QR Code (Easiest)

### On Your Phone:

1. **Open Expo Go app**
   - If not installed: Download from App Store (iOS) or Play Store (Android)

2. **Scan the QR code**
   - Look at your computer terminal (should show a big QR code)
   - **iOS:** Use Camera app to scan
   - **Android:** Use Expo Go app's built-in scanner

3. **Wait for app to load**
   - First load takes 30-60 seconds
   - You'll see "Downloading JavaScript bundle..."
   - Then splash screen appears
   - Then login screen!

---

## 🎯 Method 2: Manual URL Entry

If QR code doesn't work:

### On Your Phone:

1. **Open Expo Go app**

2. **Tap "Enter URL manually"**

3. **Type exactly:**
   ```
   exp://192.168.1.15:8081
   ```

4. **Tap "Connect"**

5. **Wait for bundle to download**

---

## ⚠️ If Still Not Working: Use Tunnel Mode

### On Your Computer:

```bash
# Press Ctrl+C in Expo terminal to stop

# Start with tunnel
cd /Users/udaytomar/Developer/Smart-Campus/SmartCampusMobile
npx expo start --tunnel

# This may take 1-2 minutes to start
# When ready, scan the NEW QR code
```

**Tunnel mode works on ANY network (even cellular)!**

---

## 🎮 Alternative: Use iOS Simulator (No Phone Needed)

If you have Xcode installed:

```bash
# In Expo terminal, press: i
```

iOS Simulator will open with your app!

---

## ✅ What You'll See When It Works

1. **Splash Screen** (blue background with logo)
2. **Login Screen** with:
   - Email input
   - Password input
   - Login button

3. **After login:**
   - Role-based dashboard
   - Bottom navigation
   - Your Smart Campus app! 🎉

---

## 🔑 Test Credentials

You'll need user accounts in your database. If you don't have any:

**Quick test user creation:**
```bash
cd /Users/udaytomar/Developer/Smart-Campus/server
# Check if you have a test data script
ls scripts/*.ts scripts/*.js
```

---

**Ready? Start with Method 1 (scan QR) or use tunnel mode!** 📱

