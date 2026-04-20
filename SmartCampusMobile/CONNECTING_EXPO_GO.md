# Connecting Expo Go (fix "request timed out")

If Expo Go shows **"unknown error"** or **"the request timed out"** when opening `exp://192.168.x.x:8083`, try these in order.

## 1. Use tunnel (bypasses firewall / LAN issues)

From the project folder:

```bash
cd SmartCampusMobile
npx expo start --tunnel --clear
```

Or use the script:

```bash
npm run start:tunnel:clear
```

Wait until you see **"Tunnel ready"** and a URL like `exp://xxx.ngrok.io:80`. In Expo Go, open that URL (or scan the tunnel QR code). This works even when your phone and computer are on different networks or a firewall blocks the LAN port.

---

## 2. Fix LAN connection (phone and computer on same Wi‑Fi)

- **Same network:** Phone and Mac must be on the **same Wi‑Fi** (not phone on cellular + Mac on Wi‑Fi).
- **Firewall (Mac):** System Settings → Network → Firewall → Options. Either turn off firewall temporarily to test, or allow incoming for **Node** (or add a rule for the port Expo uses, e.g. 8081/8083).
- **VPN:** Turn off VPN on both phone and Mac; try again.
- **Restart:** Stop Expo (`Ctrl+C`), then run again:
  ```bash
  npx expo start --clear
  ```
  Scan the new QR code in Expo Go.

---

## 3. Set packager hostname (if IP is wrong)

If your Mac’s IP is different from what Expo shows:

```bash
export REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.2
npx expo start --clear
```

Use your Mac’s actual IP (find it in System Settings → Network → Wi‑Fi → Details, or run `ipconfig getifaddr en0` in Terminal).

---

## 4. Backend API: "Network Error" when calling the server

If the app shows **`[API] Network error: Network Error`** when loading (e.g. GET `/schools/code/...`), the phone cannot reach your backend.

- **Cause:** In `.env` the app uses `EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1`. On a **physical device**, `localhost` is the phone, not your Mac where the server runs.
- **Fix:**
  1. Start your backend (e.g. from the `server/` folder: `npm start` so it listens on port 5000).
  2. In **SmartCampusMobile/.env**, set the API URL to your **computer’s IP** (same Wi‑Fi as the phone):
     ```bash
     EXPO_PUBLIC_API_URL=http://YOUR_MAC_IP:5000/api/v1
     ```
     Use the same IP Expo shows in the terminal (e.g. `192.168.1.2`). Find it with: `ipconfig getifaddr en0` (Mac) or System Settings → Network → Wi‑Fi.
  3. Restart Expo so it picks up the new env: stop the process, then run `npx expo start --clear` again.
- **Simulator:** iOS Simulator can use `localhost` because it runs on your Mac; no change needed if you only use the simulator.

---

## Quick reference

| Command              | Use case                          |
|----------------------|------------------------------------|
| `npm run start:clear`| Normal start (LAN, same Wi‑Fi)     |
| `npm run start:tunnel:clear` | When LAN times out (tunnel) |
