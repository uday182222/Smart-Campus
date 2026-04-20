# How to Start Smart Campus App

## ✅ Your Current Location

You're in: `/Users/udaytomar/Developer/Smart-Campus/SmartCampusMobile`

## 🚀 Correct Commands to Start

### Option 1: Two Separate Terminals

**Terminal 1 (Backend):**
```bash
cd /Users/udaytomar/Developer/Smart-Campus/server
npm run dev
```

**Terminal 2 (Mobile App) - You're already here!:**
```bash
# You're already in SmartCampusMobile, so just run:
npm start
```

### Option 2: One Terminal with Background Process

```bash
# Start backend in background
(cd /Users/udaytomar/Developer/Smart-Campus/server && npm run dev &)

# Start mobile app (in current directory)
npm start
```

---

## 📍 Path Reference

**Your current location:** `SmartCampusMobile/`

**To go to server:**
```bash
cd ../server    # Go up one level, then into server
# NOT: cd server (that looks for SmartCampusMobile/server which doesn't exist)
```

**Project structure:**
```
Smart-Campus/
├── server/              ← Backend is here
├── SmartCampusMobile/   ← You are here
└── smart-campus-react/
```

---

## 🎯 Simplest Way - Just Run This

Since you're already in SmartCampusMobile:

```bash
# Start the mobile app (you're in the right directory!)
npm start
```

**Then in a NEW terminal window:**
```bash
cd /Users/udaytomar/Developer/Smart-Campus/server
npm run dev
```

---

## ✅ What Happens Next

1. **Expo starts** and shows QR code
2. **Metro bundler** runs on port 8082 (or 8081)
3. **Press `i`** to open iOS simulator
4. **Press `a`** to open Android emulator
5. **Or scan QR** with Expo Go app on your phone

---

## 🐛 If You See Port Already in Use

The output showed port 8081 is already running. That's fine - Expo offered port 8082 and you accepted.

**To kill the old process (if needed):**
```bash
lsof -ti:8081 | xargs kill -9
```

---

## 📝 Remember

- You're IN SmartCampusMobile already
- Don't do `cd SmartCampusMobile` again (you're already there!)
- Backend is at `../server` (up one level)
- Just run `npm start` where you are!

---

**Next command:** Just type `npm start` in your current terminal! 🚀

