# Mobile App Test Checklist

**Prerequisites:** Server running at `http://localhost:5000` (or set `EXPO_PUBLIC_API_URL` in `.env`).  
**Start app:** `cd SmartCampusMobile && npx expo start --clear`, then open in iOS Simulator / Android emulator / Expo Go.

---

## Test 1 — Login flow

| Step | Action | Expected |
|------|--------|----------|
| 1.1 | Open app | First screen shows **"Enter School Code"** (not email/password). |
| 1.2 | Type `SCH-DEMO-01` → tap **"Find My School"** | School name appears; screen moves to credentials step (Back, school logo/name, email/password). |
| 1.3 | Enter `admin@demo.com` / `password123` → tap **Sign In** | Login succeeds; **Admin Dashboard** loads. |

**Notes:** If you see "Invalid school code", check server is running and base URL. From Registration you can tap "New here? Register your child" to reach the same flow.

---

## Test 2 — Registration flow

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | From login → tap **"New here? Register your child"** | **Registration** screen opens (Step 1 of 3). |
| 2.2 | Step 1: enter `SCH-DEMO-01` → **Verify School** | School verified; Step 2 (student info) shows. |
| 2.3 | Step 2: student name + class (e.g. Grade 5) → **Next** | Step 3 (parent details) shows. |
| 2.4 | Step 3: parent name, email, phone, password, confirm password, tick "I confirm..." → **Submit Registration Request** | Success message: "Request submitted! The school admin will review..." |
| 2.5 | Tap **Check Status** | Status (PENDING / APPROVED / REJECTED) and optional note appear. |

**Notes:** Use a **new email** for each test (or delete the previous request in DB) to avoid "A pending request for this email already exists".

---

## Test 3 — Admin sees pending request

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | Log in as admin (`admin@demo.com` / `password123`) | Admin Dashboard loads. |
| 3.2 | Check top of dashboard | **Amber card**: "X New Registration Request(s)" (if any pending). |
| 3.3 | Tap the amber card | **Pending Requests** screen with list of requests. |
| 3.4 | Find the request from Test 2 | Student name, class, parent name/email/phone, "X min/hours/days ago". |
| 3.5 | Tap **Approve** → confirm | Request disappears from list; parent/student accounts created. |
| 3.6 | Or tap **Reject** → enter reason → confirm | Request disappears; status REJECTED. |

---

## Test 4 — Each role + school header

| Role | Credentials | Expected |
|------|-------------|----------|
| Teacher | `teacher@demo.com` / `password123` | **Teacher Dashboard** loads; **school header** at top (logo/name, primary color). |
| Parent | `parent@demo.com` / `password123` | **Parent Dashboard** loads; **school header** at top; **child switcher** if multiple children. |
| Admin | `admin@demo.com` / `password123` | **Admin Dashboard**; **school header** at top. |
| Student | (e.g. after approving a registration) | **Student Dashboard**; **school header** at top. |

---

## Report template

When you finish testing, fill in:

- **What worked:** (e.g. Test 1 ✅, Test 2 steps 2.1–2.4 ✅)
- **What broke or crashed:** (screen name, step, and what happened)
- **Error messages:** (exact text or screenshot)

Then we fix any issues and move on to remaining features.
