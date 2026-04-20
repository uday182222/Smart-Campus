# Smart Campus — Screens Audit Analysis

**Scope:** `smart_campus/lib/screens/`  
**Purpose:** List all screen files by feature; mark Used vs duplicate/legacy/demo; note backend (AWS/Firestore vs mock); recommend Keep or Delete.  
**No files were deleted** — analysis only.

---

## Backend note

- **Firestore/AWS:** App currently uses **Firebase Auth** + **Firestore** in services; many features still use **mock data** initialized in `main.dart` (e.g. `TransportService.initializeMockData()`, `FeeService.initializeMockData()`).
- **“Has AWS/Firestore?”** below means the screen uses a **service** that can talk to Firestore/backend; at runtime most of these still use mock data unless you switch services to real backend.

---

## 1. Auth & core

| File | Used? | Has AWS/Firestore? | Keep or Delete? | Reason |
|------|------|--------------------|----------------|--------|
| `splash/splash_screen.dart` | Yes | AuthService (Firebase) | **Keep** | App entry from main.dart |
| `main_navigation_screen.dart` | Yes | AuthService | **Keep** | Role-based shell after login |
| `auth/login_screen.dart` | Yes | AuthService (Firebase) | **Keep** | Login; navigated from splash |

---

## 2. Dashboards

| File | Used? | Has AWS/Firestore? | Keep or Delete? | Reason |
|------|------|--------------------|----------------|--------|
| `teacher/modern_teacher_dashboard.dart` | Yes | AuthService | **Keep** | Teacher home (from main_navigation) |
| `teacher/teacher_dashboard.dart` | No | AuthService | **Delete** | Legacy; teachers use ModernTeacherDashboard |
| `teacher/teacher_home_screen.dart` | No | AuthService | **Delete** | Unused; teachers get ModernTeacherDashboard |
| `parent/modern_parent_dashboard.dart` | Yes | — | **Keep** | Parent/student home (from main_navigation) |
| `parent/parent_dashboard.dart` | No | — | **Delete** | Legacy; parents use ModernParentDashboard |
| `parent/reference_parent_dashboard.dart` | No | — | **Delete** | Reference/demo; never imported |
| `admin/admin_dashboard.dart` | Yes | AuthService | **Keep** | Super-admin home |
| `admin/school_admin_dashboard.dart` | Yes | AuthService | **Keep** | School-admin home |

---

## 3. Home (standalone)

| File | Used? | Has AWS/Firestore? | Keep or Delete? | Reason |
|------|------|--------------------|----------------|--------|
| `home_screen.dart` | No | — | **Delete** | Imported in main_navigation_screen but never used (dead import) |

---

## 4. Attendance

| File | Used? | Has AWS/Firestore? | Keep or Delete? | Reason |
|------|------|--------------------|----------------|--------|
| `attendance/attendance_screen.dart` | Yes | Service (mock) | **Keep** | Parent tab + named route `/attendance` |
| `teacher/attendance_screen.dart` | Yes | Service (mock) | **Keep** | Teacher attendance (ModernTeacherDashboard) |
| `admin/attendance/attendance_monitoring_screen.dart` | Yes | Mock in screen | **Keep** | School admin sidebar |
| `teacher/widgets/attendance_card.dart` | Yes | — | **Keep** | Widget used by teacher attendance screen |

---

## 5. Homework

| File | Used? | Has AWS/Firestore? | Keep or Delete? | Reason |
|------|------|--------------------|----------------|--------|
| `homework/homework_screen.dart` | Yes | Service (mock) | **Keep** | Parent tab + named route `/homework` |
| `teacher/homework_screen.dart` | Yes | Service (mock) | **Keep** | Teacher homework (ModernTeacherDashboard) |

---

## 6. Announcements

| File | Used? | Has AWS/Firestore? | Keep or Delete? | Reason |
|------|------|--------------------|----------------|--------|
| `announcements/announcements_screen.dart` | Yes | AnnouncementService (mock) | **Keep** | Parent tab, admin, named route `/announcements` |
| `teacher/teacher_announcement_screen.dart` | Yes | AnnouncementService (mock) | **Keep** | Teacher announcements |
| `admin/announcements/announcement_management_screen.dart` | Yes | AnnouncementService (mock) | **Keep** | School admin sidebar |

---

## 7. Events

| File | Used? | Has AWS/Firestore? | Keep or Delete? | Reason |
|------|------|--------------------|----------------|--------|
| `events/events_screen.dart` | Yes | — | **Keep** | Parent tab; used by main_navigation_screen |
| `events_screen.dart` (root) | No | — | **Delete** | Duplicate; simpler StatelessWidget version, never imported |

---

## 8. Profile & settings

| File | Used? | Has AWS/Firestore? | Keep or Delete? | Reason |
|------|------|--------------------|----------------|--------|
| `profile/profile_screen.dart` | Yes | AuthService | **Keep** | Parent tab; admin profile; main_navigation |
| `profile/settings_screen.dart` | Yes | AuthService | **Keep** | From profile_screen |
| `profile_screen.dart` (root) | No | — | **Delete** | Duplicate; never imported (app uses profile/profile_screen.dart) |

---

## 9. Notifications

| File | Used? | Has AWS/Firestore? | Keep or Delete? | Reason |
|------|------|--------------------|----------------|--------|
| `notifications/notifications_screen.dart` | No (no in-app nav) | FCM / service | **Keep** | Exists for deep links / future “Notifications” from profile; push taps can target it |

---

## 10. Transport

| File | Used? | Has AWS/Firestore? | Keep or Delete? | Reason |
|------|------|--------------------|----------------|--------|
| `transport/parent_bus_tracking_screen.dart` | Yes | TransportService (mock) | **Keep** | Parent; named route `/transport` |
| `admin/transport/route_management_screen.dart` | Yes | TransportService (mock) | **Keep** | School admin (via FeeManagementScreen / sidebar) |
| `admin/transport/add_edit_route_screen.dart` | Yes | TransportService (mock) | **Keep** | From route_management_screen |
| `admin/transport/route_detail_screen.dart` | Yes | TransportService (mock) | **Keep** | From route_management_screen |
| `transport/helper_app_screen.dart` | No | TransportService (mock) | **Keep** | Helper app; no in-app nav yet — add route or link if needed |
| `transport/helper_route_detail_screen.dart` | Yes | TransportService (mock) | **Keep** | From helper_app_screen |

---

## 11. Fees

| File | Used? | Has AWS/Firestore? | Keep or Delete? | Reason |
|------|------|--------------------|----------------|--------|
| `admin/fees/fee_management_screen.dart` | Yes | FeeService (mock) | **Keep** | School admin sidebar |
| `admin/fees/fee_dues_screen.dart` | Yes | FeeService (mock) | **Keep** | Tab inside fee_management_screen |
| `admin/fees/fee_statistics_screen.dart` | Yes | FeeService (mock) | **Keep** | Tab inside fee_management_screen |
| `admin/fees/add_edit_fee_structure_screen.dart` | Yes | FeeService (mock) | **Keep** | From fee_management_screen |
| `admin/fees/record_payment_screen.dart` | Yes | FeeService (mock) | **Keep** | From fee_dues_screen |
| `admin/fees/fee_due_detail_screen.dart` | Yes | FeeService (mock) | **Keep** | From fee_dues_screen |
| `admin/fees/fees_tracking_screen.dart` | Yes | Mock in screen | **Keep** | School admin sidebar |
| `parent/parent_fees_screen.dart` | Yes | FeeService (mock) | **Keep** | From ModernParentDashboard |

---

## 12. Gallery

| File | Used? | Has AWS/Firestore? | Keep or Delete? | Reason |
|------|------|--------------------|----------------|--------|
| `gallery/gallery_screen.dart` | Yes | GalleryService (mock) | **Keep** | Parent; can show GalleryManagementScreen for admin |
| `gallery/gallery_detail_screen.dart` | Yes | GalleryService (mock) | **Keep** | From gallery_screen |
| `gallery/admin/gallery_management_screen.dart` | Yes | GalleryService (mock) | **Keep** | From gallery_screen (admin path) |
| `gallery/admin/upload_gallery_item_screen.dart` | Yes | GalleryService (mock) | **Keep** | From gallery_management_screen |

---

## 13. Appointments

| File | Used? | Has AWS/Firestore? | Keep or Delete? | Reason |
|------|------|--------------------|----------------|--------|
| `appointments/appointments_screen.dart` | Yes | AppointmentService (mock) | **Keep** | From ModernParentDashboard |
| `appointments/create_appointment_screen.dart` | Yes | AppointmentService (mock) | **Keep** | From appointments_screen |
| `appointments/appointment_detail_screen.dart` | Yes | AppointmentService (mock) | **Keep** | From appointments_screen |

---

## 14. After-school

| File | Used? | Has AWS/Firestore? | Keep or Delete? | Reason |
|------|------|--------------------|----------------|--------|
| `afterschool/afterschool_screen.dart` | Yes | AuthService / service | **Keep** | From ModernParentDashboard |
| `afterschool/activity_detail_screen.dart` | Yes | AuthService | **Keep** | From afterschool_screen |

---

## 15. Parent communication

| File | Used? | Has AWS/Firestore? | Keep or Delete? | Reason |
|------|------|--------------------|----------------|--------|
| `parent/parent_communication_screen.dart` | Yes | AuthService / service (mock) | **Keep** | From ModernParentDashboard |
| `parent/communication_history_screen.dart` | Yes | AuthService | **Keep** | From parent_communication_screen |
| `parent/communication_detail_screen.dart` | Yes | — | **Keep** | From communication_history_screen |
| `parent/holiday_request_screen.dart` | Yes | AuthService | **Keep** | From parent_communication_screen |
| `parent/absence_notification_screen.dart` | Yes | AuthService | **Keep** | From parent_communication_screen |
| `teacher/communication_approval_screen.dart` | Yes | AuthService | **Keep** | From ModernTeacherDashboard |
| `teacher/communication_approval_detail_screen.dart` | Yes | — | **Keep** | From communication_approval_screen |

---

## 16. Teacher: timetable, marks, remarks, class notes

| File | Used? | Has AWS/Firestore? | Keep or Delete? | Reason |
|------|------|--------------------|----------------|--------|
| `teacher/timetable_screen.dart` | Yes | — | **Keep** | From ModernTeacherDashboard |
| `teacher/exam_marks_screen.dart` | Yes | — | **Keep** | From ModernTeacherDashboard |
| `teacher/remarks_screen.dart` | Yes | AuthService / RemarksService (mock) | **Keep** | From ModernTeacherDashboard |
| `teacher/view_remarks_screen.dart` | Yes | RemarksService (mock) | **Keep** | From ModernTeacherDashboard |
| `teacher/class_notes_screen.dart` | No | — | **Keep** | Not linked from ModernTeacherDashboard; add nav if feature is needed |
| `teacher/widgets/teacher_quick_action_card.dart` | Yes | — | **Keep** | Reusable widget (e.g. teacher dashboard) |

---

## 17. Admin: schools, users, statistics, reports, export

| File | Used? | Has AWS/Firestore? | Keep or Delete? | Reason |
|------|------|--------------------|----------------|--------|
| `admin/schools/school_management_screen.dart` | Yes | — | **Keep** | AdminDashboard sidebar |
| `admin/schools/add_edit_school_screen.dart` | Yes | — | **Keep** | From school_management_screen |
| `admin/users/user_management_screen.dart` | Yes | Mock in screen | **Keep** | AdminDashboard & SchoolAdminDashboard sidebar |
| `admin/statistics/statistics_screen.dart` | Yes | — | **Keep** | AdminDashboard sidebar |
| `admin/statistics/activity_log_screen.dart` | Yes | — | **Keep** | From statistics_screen |
| `admin/statistics/activity_details_screen.dart` | Yes | — | **Keep** | From activity_log_screen |
| `admin/data_export/data_export_screen.dart` | Yes | — | **Keep** | School admin sidebar |
| `admin/reports/exam_reports_screen.dart` | Yes | Mock in screen | **Keep** | School admin sidebar |

---

## 18. Admin: students, teachers, classes (two sets)

| File | Used? | Has AWS/Firestore? | Keep or Delete? | Reason |
|------|------|--------------------|----------------|--------|
| `admin/students/student_list_screen.dart` | No | Mock in screen | **Keep** | Orphaned (not in any dashboard sidebar); add nav from UserManagement or separate “Students” if needed |
| `admin/students/student_form_screen.dart` | Yes | — | **Keep** | From student_list_screen |
| `admin/students/student_profile_screen.dart` | Yes | — | **Keep** | From student_list_screen |
| `admin/teachers/teacher_list_screen.dart` | No | — | **Keep** | Orphaned; add nav if “Teachers” section desired |
| `admin/teachers/teacher_form_screen.dart` | Yes | — | **Keep** | From teacher_list_screen |
| `admin/teachers/teacher_profile_screen.dart` | Yes | — | **Keep** | From teacher_list_screen (admin) |
| `admin/classes/class_list_screen.dart` | No | — | **Keep** | Orphaned; add nav if “Classes” section desired |
| `admin/classes/class_form_screen.dart` | Yes | — | **Keep** | From class_list_screen & class_detail_screen |
| `admin/classes/class_detail_screen.dart` | Yes | — | **Keep** | From class_list_screen |
| `admin/student/student_management_screen.dart` | No | — | **Review** | Alternate student UI; not in any dashboard; consider merging with admin/students/ or removing |
| `admin/student/add_student_screen.dart` | Yes | — | **Keep** | From student_management_screen only |

---

## 19. Teacher profile (teacher role)

| File | Used? | Has AWS/Firestore? | Keep or Delete? | Reason |
|------|------|--------------------|----------------|--------|
| `teacher/teacher_profile_screen.dart` | Yes | AuthService | **Keep** | Teacher profile (imported in main_navigation_screen; may be used for teacher role) |

---

## 20. Demo & other

| File | Used? | Has AWS/Firestore? | Keep or Delete? | Reason |
|------|------|--------------------|----------------|--------|
| `demo/modern_ui_demo_screen.dart` | Yes | — | **Keep** (optional) | Linked from ModernTeacherDashboard; demo/reference only — delete if you don’t need UI reference |
| `campus_map_screen.dart` | No | — | **Keep** | Not linked; add nav (e.g. from parent dashboard) if campus map is a feature, else delete |
| `teacher/widgets/attendance_card.dart` | Yes | — | **Keep** | Widget used by teacher attendance |

---

## Summary

- **Keep (actively used):** All screens that are reached from main_navigation_screen, dashboards, or other screens (including helper_route_detail from helper_app_screen).
- **Keep (orphaned but useful):**  
  - `student_list_screen`, `teacher_list_screen`, `class_list_screen` (and their form/detail screens) — add sidebar or nav to “Students”, “Teachers”, “Classes” if you want those flows.  
  - `class_notes_screen` — add a tile/card in ModernTeacherDashboard if you use class notes.  
  - `notifications_screen` — wire from profile “Notifications” and/or deep links.  
  - `helper_app_screen` — add route or entry point for transport helpers.  
  - `campus_map_screen` — add link if you offer campus map.
- **Delete (safe to remove):**  
  - `home_screen.dart` (unused; remove import from main_navigation_screen).  
  - `teacher/teacher_dashboard.dart`, `teacher/teacher_home_screen.dart` (legacy teacher home).  
  - `parent/parent_dashboard.dart`, `parent/reference_parent_dashboard.dart` (legacy/reference parent home).  
  - `events_screen.dart` (root), `profile_screen.dart` (root) (duplicates of `events/` and `profile/` versions).
- **Review:**  
  - `admin/student/student_management_screen.dart` and `add_student_screen.dart`: second student-management flow; consolidate with `admin/students/` or remove if not needed.  
  - `demo/modern_ui_demo_screen.dart`: remove if you don’t want a demo screen.

---

**Next steps (no deletes done in this audit):**

1. Remove dead import of `home_screen.dart` from `main_navigation_screen.dart` (and optionally delete `home_screen.dart`).  
2. Delete legacy/reference dashboards and root duplicates (see table rows marked **Delete**).  
3. Add navigation to orphaned screens (students, teachers, classes, class notes, notifications, helper app, campus map) if you want those features.  
4. Decide whether to keep or merge the `admin/student/` flow with `admin/students/`.
