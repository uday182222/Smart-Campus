# Smart Campus — Login Details

Use these for local development and testing. **Change passwords in production.**

---

## 1. Developer / Super Admin (no school code)

**Use on first screen:** Tap **"Login as Developer (Super Admin)"** (below "Find My School"), then sign in with these credentials.

| Field    | Value |
|----------|--------|
| **Email**    | `superadmin@smartcampus.com` |
| **Password** | `Admin@123` |
| **School code** | Not required — leave blank |

**Create the Super Admin user (first time only):**

From the `server` folder run:

```bash
cd server
npx prisma db seed
```

This creates one Super Admin user with the credentials above (skips if one already exists). Then use **Login as Developer** in the app and sign in with that email and password.

---

## 2. School users (Admin, Teacher, Parent, Bus Helper, Student)

For these roles you **must** enter a **School Code** first (e.g. your school’s code from the `schools` table), then sign in with a user that belongs to that school.

| Role        | Typical email pattern     | Notes |
|------------|---------------------------|--------|
| **Admin / Principal** | `admin@yourschool.com`   | Same login flow as teacher/parent; role determines dashboard. |
| **Teacher**          | `teacher@yourschool.com` | After login → Teacher drawer (Dashboard, Attendance, Homework, etc.). |
| **Parent**           | `parent@yourschool.com`  | After login → Parent drawer (Dashboard, My Children, etc.). |
| **Bus Helper**       | `bushelper@yourschool.com`| After login → Bus Portal (ConductorPortal). |
| **Student**          | `student@yourschool.com` | After login → Student dashboard. |

**Steps:**

1. **School code** — Get from your `schools` table (e.g. `school_code` or a code you use for testing). Enter it on the first screen and tap **Find My School**.
2. **Email & password** — Use the email and password of a user that has `schoolId` set to that school and the desired `role`.

---

## 3. Quick reference — Where credentials live

| Source | What it tells you |
|--------|--------------------|
| **Database `users` table** | All users: `email`, `role`, `school_id`, `password` (bcrypt). |
| **Database `schools` table** | Schools and their `school_code` (if you use it for “Find My School”). |
| **Prisma Studio** | Run `npx prisma studio` in `server` to view/edit users and schools. |

---

## 4. Summary

- **Super Admin (Developer):** On the **first screen**, tap **"Login as Developer (Super Admin)"** → enter Super Admin **email** and **password** (no school code).
- **Everyone else:** Enter **School Code** → **Find My School** → enter **email** and **password** for a user of that school.

If you don’t have a Super Admin user yet, create one in the database as in section 1 (with `role = 'SUPER_ADMIN'`, `schoolId = NULL`, and a bcrypt-hashed password).
