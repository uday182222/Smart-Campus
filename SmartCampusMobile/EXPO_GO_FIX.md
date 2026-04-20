# 🔧 Fix Expo Go "Unable to Open..." Error

## ✅ Diagnosis Complete

**Your Setup:**
- 📍 Local IP: `192.168.1.15`
- ✅ Metro bundler: Running on port 8081
- ✅ Backend: Running on port 5000

---

## 🎯 Quick Fixes (Try in Order)

### Fix 1: Use Tunnel Mode (Works Anywhere) ⭐ RECOMMENDED

```bash
# Stop current Expo (Ctrl+C)

# Start with tunnel
cd /Users/udaytomar/Developer/Smart-Campus/SmartCampusMobile
expo start --tunnel

# Wait for QR code, then scan with Expo Go
```

**Pros:** Works on any network, even cellular
**Cons:** Slightly slower

---

### Fix 2: Ensure Same WiFi Network

**Check:**
1. Your Mac WiFi: Click WiFi icon → Note network name
2. Your Phone WiFi: Settings → WiFi → Note network name
3. **Must be identical!**

**If different:** Connect phone to same WiFi as computer

---

### Fix 3: Use Simulator Instead (No Network Issues)

**iOS Simulator:**
```bash
# In Expo terminal, press: i
# Or run:
expo start --ios
```

**Android Emulator:**
```bash
# In Expo terminal, press: a
# Or run:
expo start --android
```

**Pros:** No network issues, faster development
**Cons:** Requires Xcode (iOS) or Android Studio

---

### Fix 4: Disable Firewall Temporarily

**On Mac:**
1. System Preferences → Security & Privacy
2. Click Firewall tab
3. Click lock icon → Enter password
4. Click "Turn Off Firewall"
5. Try Expo Go again
6. **Remember to turn it back on!**

---

### Fix 5: Manual URL Entry in Expo Go

```
1. Open Expo Go app on phone
2. Tap "Enter URL manually"
3. Type: exp://192.168.1.15:8081
4. Tap "Connect"
```

---

## 🚀 Recommended Solution

**Use tunnel mode for easiest setup:**

```bash
cd /Users/udaytomar/Developer/Smart-Campus/SmartCampusMobile

# Stop current server (Ctrl+C if running)

# Start with tunnel
npx expo start --tunnel

# Wait for QR code
# Scan with Expo Go app
# App will load! 🎉
```

---

## 🎯 Alternative: Use iOS Simulator (Best for Development)

**No network issues at all:**

```bash
cd /Users/udaytomar/Developer/Smart-Campus/SmartCampusMobile

npm start

# When Metro starts, press: i

# iOS Simulator will open with your app!
```

**Requirements:**
- Xcode installed (free from App Store)
- Takes 5-10 minutes first time

---

## ✅ Verify Fix

After trying a solution, you should see:
- App splash screen (blue background)
- Then login screen
- No "Unable to open..." error

---

## 📱 What to Do Next

Once app opens:

1. **You'll see login screen**
2. **Need test credentials** - Check your database for users
3. **Or create test user:**
   ```bash
   cd ../server
   # Run a test data script (if you have one)
   ```

---

**Try tunnel mode first - it's the easiest fix!** 🚀

```bash
npx expo start --tunnel
```

