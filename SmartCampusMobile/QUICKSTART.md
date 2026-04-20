# ⚡ Smart Campus - Quick Start Guide

Get Smart Campus running in **20 minutes**!

---

## 🚀 Option 1: Full AWS Deployment (Recommended)

### Prerequisites
- AWS account
- AWS CLI configured (`aws configure`)
- Node.js 16+ installed

### Step 1: Deploy Everything
```bash
cd SmartCampusMobile
chmod +x scripts/deploy-aws-complete.sh
./scripts/deploy-aws-complete.sh
```

**What it does:**
- ✅ Deploys Cognito (authentication)
- ✅ Creates DynamoDB tables (database)
- ✅ Sets up S3 bucket (storage)
- ✅ Creates 10+ test users
- ✅ Populates sample data
- ✅ Updates config files

**Time:** 15-20 minutes

### Step 2: Test Locally
```bash
npm install
npm start
```

### Step 3: Login
- **Email:** `admin@smartcampus.com`
- **Password:** `SmartCampus123!`
- **School ID:** (Not required for Super Admin)

---

## 🏃 Option 2: Quick Test (No AWS)

### Step 1: Install
```bash
cd SmartCampusMobile
npm install
```

### Step 2: Run
```bash
npm start
```

### Step 3: Login (Mock Mode)
- **Email:** `admin@school.com`
- **Password:** `password123`
- **School ID:** `SCH001`

**Note:** This uses mock data, not real AWS

---

## 📱 Build for App Stores

### iOS & Android
```bash
# Login to EAS
eas login

# Build
eas build --platform all --profile production

# Submit
eas submit --platform all --latest
```

**Prerequisites:**
- Apple Developer Account ($99/year)
- Google Play Console ($25 one-time)

---

## 📚 Detailed Guides

- [Complete AWS Setup](cloudformation/COMPLETE-AWS-SETUP.md)
- [App Store Deployment](FINAL_DEPLOYMENT_GUIDE.md)
- [Deployment Status](DEPLOYMENT_STATUS.md)

---

## 🧪 Test Accounts

| Role | Email | Password | School ID |
|------|-------|----------|-----------|
| Super Admin | admin@smartcampus.com | SmartCampus123! | - |
| School Admin | admin@school.com | SmartCampus123! | SCH001 |
| Teacher | teacher@lotuspublic.edu | SmartCampus123! | SCH-2025-A12 |
| Parent | parent@lotuspublic.edu | SmartCampus123! | SCH-2025-A12 |

---

## 🆘 Troubleshooting

### AWS deployment fails
```bash
# Check AWS credentials
aws sts get-caller-identity

# Run again
./scripts/deploy-aws-complete.sh
```

### App won't start
```bash
# Clear cache
npm start -- --clear

# Or
expo start --clear
```

### Login fails
- Check AWS Cognito user exists
- Verify password is correct
- For school users, School ID must match

---

## 💰 Costs

- **Development:** FREE (AWS Free Tier)
- **Production (<1000 users):** ~$11/month
- **App Store Fees:** $99/year (iOS) + $25 one-time (Android)

---

## 📞 Need Help?

- Email: support@smartcampus.com
- Docs: [README_DEPLOYMENT.md](README_DEPLOYMENT.md)

---

**That's it! You're ready to go! 🎉**
