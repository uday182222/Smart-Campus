# Smart Campus — Deep Dive & What Remains

A single reference for **how the app works** and **what’s left to do**.

---

## 1. What Is Smart Campus?

A **school management platform** for:

- **Students** — homework, attendance, grades (future)
- **Teachers** — attendance, homework, marks, remarks, announcements, class notes
- **Parents** — child’s attendance, homework, fees, transport, communication
- **Admins** — schools, users, classes, fees, transport, announcements, analytics
- **Super admins** — multi-school oversight

The repo has **multiple apps**:

| App | Location | Stack | Purpose |
|-----|----------|--------|---------|
| **Flutter mobile** | `smart_campus/` | Flutter, Firebase (Auth + Firestore + FCM) | Main mobile app you’re editing |
| **React Native mobile** | `SmartCampusMobile/` | React Native, Expo | Alternative mobile (deployment guide targets this) |
| **Backend** | `server/` | Node, TypeScript, PostgreSQL/Prisma, AWS | API and DB |
| **Web** | `smart-campus-react/` | React, TypeScript | Web admin/front |

Your current work is in the **Flutter app** (`smart_campus/`).

---

## 2. How the Flutter App Works

### Entry & auth

- **Entry:** `lib/main.dart` → Firebase/FCM init → `SplashScreen`.
- **After splash:** if not logged in → `LoginScreen`; if logged in → `MainNavigationScreen(userRole)`.
- **Roles:** `super_admin`, `school_admin`, `teacher`, `parent`, `student` (see `lib/core/constants/app_constants.dart`).

### Navigation

- **No named routes** in `MaterialApp`; everything uses `Navigator.push` / `pushReplacement` / `pushAndRemoveUntil` with `MaterialPageRoute`.
- **Risk:** `NotificationsScreen` uses `pushNamed('/announcements', ...)` etc.; those routes are **not** registered on `MaterialApp`, so deep links from notifications can break until you add a route table.

### Role-based home

- **Super admin** → `AdminDashboard` (sidebar).
- **School admin** → `SchoolAdminDashboard` (sidebar).
- **Teacher** → `ModernTeacherDashboard` (in-dashboard nav to attendance, homework, timetable, exam marks, remarks, announcements, communication approval, class notes).
- **Parent** → Tab bar: Home, Attendance, Homework, Announcements, Events, Profile; plus flows for communication, bus tracking, fees, gallery, appointments, afterschool, timetable, etc.
- **Student** → Same tab bar as parent (student-specific screens can be added later).

### Data & state

- **Auth:** `AuthService` (singleton-style), Firebase Auth, current user from `getCurrentUserModel()`.
- **Backend:** Firestore for most data (attendance, homework, fees, transport, gallery, appointments, announcements, analytics, etc.).
- **State:** Mostly **local `setState`** in screens; **Provider** is in `pubspec.yaml` but **not** used in the app (no `MultiProvider` in `main.dart`).
- **Theme:** `ThemeModeProvider` (ChangeNotifier) in `lib/theme/modern_theme.dart` for theme switching.
- **Mock data:** Many services call `initializeMockData()` from `main.dart`; for production you’ll want to rely on real Firestore/API and gate or remove mock inits.

### Main features (Flutter app)

- **Auth:** Login, role-based home.
- **Teacher:** Attendance (mark, history, analytics), homework (create/edit/list), timetable, exam marks, remarks, announcements, communication approval, class notes.
- **Parent:** Dashboard, attendance, homework list, announcements, events, profile, communication, bus tracking, fees, gallery, appointments, afterschool, timetable, holiday/absence requests.
- **Admin:** Schools, users, students, teachers, classes, fees (management, dues, stats, payments), transport (routes), announcements, attendance monitoring, statistics, activity log, reports, data export, gallery management.
- **Shared:** Gallery, appointments, afterschool, campus map, notifications, profile, settings.

---

## 3. High-Level “How Much Is Done” (from project docs)

- **PROJECT_OVERVIEW.md:** ~80% complete; core features (attendance, homework, marks, transport, calendar, gallery, notifications, analytics) implemented; mobile + web + backend functional; 94 automated tests (likely server/RN).
- **MASTER_FEATURE_CHECKLIST.md:** 287/358 features (80%) complete; 71 remaining. Checklist is oriented to **React Native + backend** (AWS, DynamoDB, etc.), but the **gaps** are still useful:
  - **Teacher:** Submission tracking (homework), marks entry UI, marks viewing/editing/analytics, remarks, timetable (view/video).
  - **Parent/Student:** Calendar integration, homework **submission**, timetable view, progress reports, communication, fees, transport, engagement.
  - **Admin / Principal / Super admin / Office staff:** Largely not started in that checklist (the Flutter app already has many admin screens; completion varies).

So: **overall product** is roughly **80%** by feature count; **Flutter app** has a lot of screens and flows already, with some incomplete or stub flows (see below).

---

## 4. What Remains — In-Code (Flutter)

These are **TODOs / missing pieces** found in the Flutter codebase:

### Screens / flows to implement or fix

- **communication_detail_screen.dart:** Edit functionality.
- **teacher_announcement_screen.dart:** “Show unread only” filter.
- **statistics_screen.dart:** PDF export, Excel export.
- **admin_dashboard.dart:** Navigate to full activity log.
- **activity_details_screen.dart:** Email/SMS sharing, navigate to user profile, school details, activity report, export activity data.
- **activity_log_screen.dart:** CSV/PDF export, filtering by selected filters.
- **events_screen.dart:** Navigate to add event, event detail; filter.
- **settings_screen.dart:** Change password, privacy policy, terms of service.
- **student_profile_screen.dart / class_detail_screen.dart / teacher_profile_screen.dart:** Actual delete (backend/real delete), not just UI.
- **student_form_screen.dart / teacher_form_screen.dart:** Photo upload.
- **class_detail_screen.dart:** Navigate to filtered student list.
- **home_screen.dart:** Navigate to notifications, attendance, homework, announcements, events.
- **add_student_screen.dart:** Save to database or state layer (not just UI).
- **homework_screen.dart:** Navigate to add homework, homework detail.
- **attendance_screen.dart:** Filter; navigate to attendance marking.
- **profile_screen.dart:** Navigate to settings, personal info, academic records, notifications, library, parking, cafeteria, app/privacy settings, help; implement logout.
- **events_screen.dart:** Filter functionality.

### Technical debt / risks

- **Named routes:** Add a proper route table and use it for notification deep links (`/announcements`, `/homework`, `/transport`, `/attendance`).
- **Provider:** Either use it (e.g. wrap app with `MultiProvider`) or remove from `pubspec.yaml`.
- **Tests:** Only a few tests under `test/`; no broad widget/integration coverage.
- **Assets:** No `flutter: assets:` in `pubspec.yaml`; add if you use images/fonts.
- **Production:** Replace or gate mock data inits so production uses only Firestore/API.

---

## 5. What Remains — By Feature Area (from docs + code)

| Area | Status | Remaining |
|------|--------|-----------|
| **Attendance** | Strong in Flutter | Filters, navigation to marking from list, ensure backend sync |
| **Homework** | Create/edit/list done | Submission tracking (teacher), **student submission flow** (submit work, uploads, notify teacher) |
| **Marks** | Backend/models exist | **Marks entry UI** (teacher), marks viewing/editing/analytics, export |
| **Remarks** | Screens exist | Full add/view flows and persistence |
| **Timetable** | Screens exist | Full view (teacher/parent), video support if required |
| **Communication** | Partial | Edit in detail screen, approval flows, optional WhatsApp (docs) |
| **Admin** | Many screens | Activity log/export, statistics export (PDF/Excel), real delete, photo upload on forms |
| **Settings / legal** | Basic | Change password, privacy policy, terms of service |
| **Profile / home** | Partial | All “navigate to…” items, logout, real delete where needed |
| **Events** | List exists | Add event, event detail, filters |
| **Deployment** | Guide is for Expo/RN | Flutter-specific iOS/Android store steps |

---

## 6. Summary Table — “How much” and “What’s left”

| Question | Answer |
|----------|--------|
| **How much of the app is done?** | **~80%** overall (docs); Flutter app has **most screens and flows** in place, with several incomplete or stub implementations. |
| **What’s production-ready?** | Auth, role-based home, attendance, homework (create/edit/list), many admin and parent screens, notifications, Firestore integration. |
| **What’s clearly remaining?** | (1) **Student homework submission**, (2) **Teacher marks entry + marks analytics**, (3) **TODOs in code** (exports, filters, navigation, settings, real delete, photo upload), (4) **Named routes** for deep links, (5) **Settings/legal** (password, privacy, terms), (6) **Flutter deployment** guide. |
| **Biggest gaps for “full” experience?** | Homework submission (student), marks entry (teacher), and wiring all “navigate to…” / “implement…” items so every path works end-to-end. |

---

## 7. Suggested order of work (if you want to close the gap)

1. **Quick wins:** Add the missing navigations and filters (events, attendance, homework, profile, home_screen), and implement logout in profile.
2. **Deep links:** Define a route table and use it for notification taps (`/announcements`, `/homework`, etc.).
3. **Student homework submission:** Submit work (text + files), save to Firestore, notify teacher.
4. **Teacher marks entry:** Marks entry screen (by exam/subject/class), save to backend; then marks viewing/analytics/export.
5. **Settings:** Change password, privacy policy, terms of service.
6. **Admin/forms:** Real delete where needed, photo upload on student/teacher forms, add_student save to DB.
7. **Exports:** Statistics (PDF/Excel), activity log (CSV/PDF), and any other export TODOs.
8. **Production:** Turn off or gate mock data, add assets if needed, add Flutter-specific deployment steps (or point from main deployment doc to Flutter build/release).

If you tell me your priority (e.g. “student submission” or “marks entry” or “fix all navigation”), I can break that into concrete file-level steps next.
