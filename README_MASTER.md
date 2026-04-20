# Smart Campus — Master Guide

## What is this?

School management app for students, teachers, parents, and admins.

## Apps in this repo

| Folder               | What it is                         | Status              |
|----------------------|------------------------------------|---------------------|
| server/              | Node.js API (PostgreSQL + S3)      | ✅ Production ready |
| SmartCampusMobile/   | React Native app (iOS + Android)   | ✅ Ready to build    |
| smart-campus-react/  | React web admin panel              | ⚠️ Partial          |
| smart_campus/        | Flutter app (old)                  | ❌ Replaced by RN    |

## Quick start

### Run server locally

```bash
cd server && npm install && npm run dev
```

### Run mobile app locally

```bash
cd SmartCampusMobile && npm install && npx expo start
```

## Demo credentials

- **admin@demo.com** / password123 — School ID: demo-school-001  
- **teacher@demo.com** / password123 — School ID: demo-school-001  
- **parent@demo.com** / password123 — School ID: demo-school-001  
- **student@demo.com** / password123 — School ID: demo-school-001  

## Deploy

- **Server:** see [server/README_DEPLOY.md](server/README_DEPLOY.md)  
- **Mobile:** see [SmartCampusMobile/DEPLOYMENT_GUIDE.md](SmartCampusMobile/DEPLOYMENT_GUIDE.md)
