# Simple Start Guide - No Confusion!

## ✅ The Right Command

You're in: `SmartCampusMobile/`

**Just run:**
```bash
npm start
```

**NOT:** `expo start` (expo is not installed globally, and you don't need it to be!)

---

## Why npm start Works

Your `package.json` has:
```json
{
  "scripts": {
    "start": "expo start"
  }
}
```

So `npm start` automatically runs `expo start` using the **local** expo from `node_modules`.

---

## 🎯 What Happens Next

1. Metro bundler starts
2. You'll see a QR code
3. Press `i` for iOS or `a` for Android
4. Or scan QR with Expo Go app

---

## 🔴 If You See EAS Login Prompt

Just press `Ctrl+C` to cancel, then run `npm start` again.

The EAS login is optional and not needed for local development.

---

## 🚀 Start Backend (Separate Terminal)

**Open a NEW terminal and run:**
```bash
cd /Users/udaytomar/Developer/Smart-Campus/server
npm run dev
```

---

## ✅ That's It!

**Current terminal:** Mobile app
**New terminal:** Backend server

Both running = App works! 🎉

