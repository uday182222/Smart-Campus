# Fix: "Network error — check server IP in .env.local"

When you see:
```text
ERROR [API] Network error — check server IP in .env.local and that phone & computer are on same WiFi
ERROR [API] Current baseURL: http://192.168.1.2:5000/api/v1
```

Do these in order:

## 1. Start the backend

The server must be running on your Mac so the app can call it.

```bash
cd server
npm run dev
```

Wait until you see something like: `Server running on port 5000`. Leave this terminal open.

---

## 2. Confirm your Mac’s IP

Your IP can change (e.g. after sleep or new WiFi). Get the current one:

```bash
ipconfig getifaddr en0
```

Example: `192.168.1.2`. If you get nothing, try `en1` or check **System Settings → Network → Wi‑Fi → Details**.

---

## 3. Point the app at that IP

In **SmartCampusMobile** create or edit `.env.local` (not committed to git):

```bash
EXPO_PUBLIC_API_URL=http://YOUR_MAC_IP:5000/api/v1
```

Example (replace with your IP from step 2):

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.2:5000/api/v1
```

Save the file.

---

## 4. Same WiFi and restart Expo

- Phone and Mac must be on the **same WiFi** (not phone on cellular).
- Restart Expo so it picks up the new env:
  - Stop Expo (Ctrl+C in the terminal where it’s running).
  - Start again: `cd SmartCampusMobile && npx expo start --clear`.
- Reload the app on the device (shake → Reload, or reopen from Expo Go).

---

## 5. Optional: test from the Mac

In a new terminal:

```bash
curl -s http://192.168.1.2:5000/health
```

(Use your real IP.) If this works, the server is reachable on the network; if the app still fails, the issue is likely firewall or a different IP on the phone’s network.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Run `cd server && npm run dev` and keep it running |
| 2 | Get Mac IP: `ipconfig getifaddr en0` |
| 3 | Set `EXPO_PUBLIC_API_URL=http://YOUR_IP:5000/api/v1` in `SmartCampusMobile/.env.local` |
| 4 | Same WiFi; restart Expo with `npx expo start --clear` and reload the app |

The server is configured to listen on `0.0.0.0`, so it accepts connections from your phone when the IP and WiFi are correct.
