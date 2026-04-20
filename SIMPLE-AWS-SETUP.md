# ✅ SIMPLE AWS SETUP - No CLI Complexity!

## Using AWS Console (Web Interface) - 30 Minutes Total

Instead of fighting with CLI prompts, let's use the AWS Console web interface. It's visual, simple, and foolproof!

---

## Step 1: Create Cognito User Pool (10 minutes)

### 1.1 Open AWS Console

**Login to:** https://console.aws.amazon.com/
- Use your NEW AWS account

### 1.2 Go to Cognito

**Search:** "Cognito" in top search bar
**Click:** Amazon Cognito

### 1.3 Create User Pool

**Click:** "Create user pool"

**Step 1 - Configure sign-in:**
- Sign-in options: ✅ Email
- **Click:** Next

**Step 2 - Configure security:**
- Password policy: 
  - ✅ Password minimum length: 8
  - ✅ Contains lowercase letters
  - ✅ Contains uppercase letters  
  - ✅ Contains numbers
  - ✅ Contains symbols
- Multi-factor authentication: No MFA
- **Click:** Next

**Step 3 - Configure sign-up:**
- Self-registration: ✅ Enable
- Required attributes: ✅ email, ✅ name
- Custom attributes: 
  - Add: `role` (String)
  - Add: `schoolId` (String)
- **Click:** Next

**Step 4 - Configure message delivery:**
- Email provider: Send email with Amazon SES
- **Click:** Next

**Step 5 - Integrate your app:**
- User pool name: `SmartCampusUserPool`
- App client name: `SmartCampusWebClient`
- **Click:** Next

**Step 6 - Review and create:**
- **Review** all settings
- **Click:** Create user pool

**✅ SAVE THESE VALUES:**
```
User Pool ID: us-east-1_XXXXXX
App Client ID: xxxxxxxxxxxxxxxxxxxx
```

### 1.4 Create User Groups

**In your user pool:**
- **Click:** Groups tab
- **Click:** Create group

**Create these 5 groups:**

1. Group name: `SuperAdmin` → Create
2. Group name: `SchoolAdmin` → Create  
3. Group name: `Teacher` → Create
4. Group name: `Parent` → Create
5. Group name: `Student` → Create

✅ **Cognito setup complete!**

---

## Step 2: Create S3 Bucket (5 minutes)

### 2.1 Go to S3

**Search:** "S3" in top search bar
**Click:** S3

### 2.2 Create Bucket

**Click:** Create bucket

**Bucket name:** `smart-campus-assets-2025` (must be globally unique)
- If taken, try: `smart-campus-assets-YOUR-NAME`

**Region:** US East (N. Virginia) us-east-1

**Object Ownership:** ACLs disabled

**Block Public Access:** 
- ✅ Block all public access (we'll configure specific access later)

**Bucket Versioning:** Disable

**Tags:** 
- Key: Application, Value: SmartCampus

**Click:** Create bucket

### 2.3 Configure CORS

**Click:** Your bucket → Permissions tab → CORS

**Click:** Edit → Paste this:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"]
    }
]
```

**Click:** Save changes

✅ **S3 bucket created!**

**SAVE THIS:**
```
S3 Bucket Name: smart-campus-assets-2025
```

---

## Step 3: Create DynamoDB Table (5 minutes)

### 3.1 Go to DynamoDB

**Search:** "DynamoDB" in top search bar
**Click:** DynamoDB

### 3.2 Create Table

**Click:** Create table

**Table name:** `SmartCampus-Schools`

**Partition key:** `schoolId` (String)

**Table settings:** Default settings

**Click:** Create table

**Wait** 30 seconds for table to be created

✅ **DynamoDB table created!**

---

## Step 4: Update Your App Configuration (5 minutes)

### 4.1 Update aws-config.ts

**File:** `/Users/udaytomar/Developer/Smart-Campus/SmartCampusMobile/src/aws-config.ts`

**Replace the placeholder values with:**

```typescript
export const awsConfig = {
  region: 'us-east-1',
  
  cognito: {
    userPoolId: 'us-east-1_XXXXXX',      // ← From Step 1
    userPoolClientId: 'xxxxxxxxxxxx',     // ← From Step 1
    identityPoolId: '',                   // Optional for now
    region: 'us-east-1',
  },
  
  storage: {
    bucket: 'smart-campus-assets-2025',   // ← From Step 2
    region: 'us-east-1',
  },
  
  userGroups: {
    SUPER_ADMIN: 'SuperAdmin',
    SCHOOL_ADMIN: 'SchoolAdmin',
    TEACHER: 'Teacher',
    PARENT: 'Parent',
    STUDENT: 'Student',
  }
};
```

---

## Step 5: Test AWS Connection (5 minutes)

### 5.1 Start the app

```bash
cd /Users/udaytomar/Developer/Smart-Campus/SmartCampusMobile
npm start
```

### 5.2 Test authentication

- Try creating a test user in Cognito Console
- Test login in your app
- Verify it connects to AWS

---

## ✅ DONE! AWS Setup Complete!

**What you now have:**
- ✅ Cognito User Pool with 5 groups
- ✅ S3 Bucket for logos
- ✅ DynamoDB table for schools
- ✅ All configured in your app

**No Amplify CLI complexity!**
**No automation issues!**
**Just simple, direct AWS services!**

---

## 🎯 Next: Connect Your App

Follow the next guide to connect your React Native app to these AWS services.

**Total time:** 30 minutes
**Cost:** $0 (free tier)
**Complexity:** LOW - just web interface!

🚀 **Ready to use!**

