# 🚀 AWS Setup - Step by Step Guide

## Prerequisites Checklist

Before we begin, ensure you have:

- [ ] AWS Account (with credit card for billing)
- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] Git installed
- [ ] Terminal/Command line access
- [ ] Code editor (VS Code recommended)
- [ ] Budget approval: $50-100/month for development

---

## Part 1: AWS Account Setup (15 minutes)

### Step 1: Create AWS Account

1. **Go to:** https://aws.amazon.com/
2. **Click:** "Create an AWS Account"
3. **Provide:**
   - Email address
   - Password
   - AWS account name: "SmartCampus"
4. **Contact Information:**
   - Choose "Personal" or "Professional"
   - Fill in details
5. **Payment Information:**
   - Add credit/debit card
   - Initial charge: $1 (verification)
6. **Identity Verification:**
   - Phone number
   - Receive verification code
7. **Support Plan:**
   - Choose "Basic Support (Free)"

### Step 2: Create IAM Admin User

**⚠️ Important:** Never use root account for daily operations

1. **Login to AWS Console:** https://console.aws.amazon.com/
2. **Navigate to IAM:**
   - Search for "IAM" in top search bar
   - Click "IAM" service

3. **Create User:**
   ```
   Users → Add users
   
   User name: amplify-admin
   Access type: ✓ Programmatic access
                ✓ AWS Management Console access
   
   Console password: Custom password
   ✓ Require password reset: No
   
   Click: Next: Permissions
   ```

4. **Attach Policies:**
   ```
   ✓ AdministratorAccess
   
   Click: Next: Tags
   Click: Next: Review
   Click: Create user
   ```

5. **Save Credentials:** 📝
   ```
   ⚠️ IMPORTANT: Save these immediately!
   
   Access key ID: AKIA...
   Secret access key: xxxxxxxxxx
   Console login link: https://xxxxx.signin.aws.amazon.com/console
   ```

**Keep these credentials SECURE and PRIVATE!**

---

## Part 2: Install & Configure AWS CLI (10 minutes)

### Step 1: Install AWS CLI

**macOS:**
```bash
# Using Homebrew
brew install awscli

# Verify installation
aws --version
# Should show: aws-cli/2.x.x
```

**Windows:**
```bash
# Download installer from:
# https://awscli.amazonaws.com/AWSCLIV2.msi

# Run installer
# Verify in Command Prompt:
aws --version
```

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

aws --version
```

### Step 2: Configure AWS CLI

```bash
aws configure

# Enter the following:
AWS Access Key ID: [Your Access Key from Step 2]
AWS Secret Access Key: [Your Secret Key from Step 2]
Default region name: us-east-1
Default output format: json
```

### Step 3: Test Configuration

```bash
# Test AWS connection
aws sts get-caller-identity

# Should return:
# {
#     "UserId": "AIDAXXXXXXXXX",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/amplify-admin"
# }
```

✅ **AWS CLI configured successfully!**

---

## Part 3: Install & Configure Amplify CLI (10 minutes)

### Step 1: Install Amplify CLI

```bash
# Install globally
npm install -g @aws-amplify/cli

# Verify installation
amplify --version
# Should show: 12.x.x or higher
```

### Step 2: Configure Amplify

```bash
amplify configure

# This will:
# 1. Open browser to AWS Console
# 2. Ask you to sign in (if not already)
```

**Follow the prompts:**

```
Specify the AWS Region
? region: us-east-1

Specify the username of the new IAM user:
? user name: amplify-cli-user
```

**Browser opens → Create IAM user:**
1. Click "Next: Permissions" (AdministratorAccess-Amplify already attached)
2. Click "Next: Tags"
3. Click "Next: Review"
4. Click "Create user"
5. **Download .csv file** with credentials
6. Click "Close"

**Back to terminal:**
```
Enter the access key of the newly created user:
? accessKeyId: AKIA... [From .csv file]
? secretAccessKey: xxxx... [From .csv file]

Profile Name: amplify-cli-user

Successfully set up the new user.
```

✅ **Amplify CLI configured successfully!**

---

## Part 4: Initialize Amplify in Your Project (15 minutes)

### Step 1: Navigate to Project

```bash
cd /Users/udaytomar/Developer/Smart-Campus/SmartCampusMobile
```

### Step 2: Initialize Amplify

```bash
amplify init
```

**Answer the prompts:**

```
? Enter a name for the project: SmartCampus

The following configuration will be applied:

Project information
| Name: SmartCampus
| Environment: dev
| Default editor: Visual Studio Code
| App type: javascript
| Javascript framework: react-native
| Source Directory Path: src
| Distribution Directory Path: /
| Build Command: npm run-script build
| Start Command: npm run-script start

? Initialize the project with the above configuration? Yes

? Select the authentication method you want to use: AWS profile
? Please choose the profile you want to use: amplify-cli-user

⠋ Initializing project in the cloud...

✅ Successfully created initial AWS cloud resources for deployments.
✅ Initialized your environment successfully.
```

**This creates:**
- `amplify/` folder in your project
- AWS resources in the cloud
- Configuration files

---

## Part 5: Add Authentication (Cognito) (20 minutes)

### Step 1: Add Auth Service

```bash
amplify add auth
```

**Configuration:**

```
? Do you want to use the default authentication and security configuration?
  ❯ Manual configuration

? Select the authentication/authorization services that you want to use:
  ❯ User Sign-Up, Sign-In, connected with AWS IAM controls

? Provide a friendly name for your resource:
  smartcampusauth

? Enter a name for your identity pool:
  smartcampusidentitypool

? Allow unauthenticated logins? 
  ❯ No

? Do you want to enable 3rd party authentication providers?
  ❯ No

? Provide a name for your user pool:
  smartcampususerpool

? How do you want users to be able to sign in?
  ❯ Email

? Do you want to add User Pool Groups?
  ❯ Yes

? Provide a name for your user pool group:
  SuperAdmin
? Do you want to add another User Pool Group?
  ❯ Yes
  
? Provide a name for your user pool group:
  SchoolAdmin
? Do you want to add another User Pool Group?
  ❯ Yes

? Provide a name for your user pool group:
  Teacher
? Do you want to add another User Pool Group?
  ❯ Yes

? Provide a name for your user pool group:
  Parent
? Do you want to add another User Pool Group?
  ❯ Yes

? Provide a name for your user pool group:
  Student
? Do you want to add another User Pool Group?
  ❯ No

? Do you want to add an admin queries API?
  ❯ Yes

? Do you want to restrict access to the admin queries API?
  ❯ Yes
? Select the group to restrict access with:
  ❯ SuperAdmin

? Multifactor authentication configuration:
  ❯ Optional (Individual users can enable MFA)

? For MFA types, which of the following services do you want to use?
  ❯ SMS Text Message

? SMS authentication message:
  Your verification code is {####}

? Email based user registration/forgot password:
  ❯ Enabled (Requires per-user email entry at registration)

? Specify an email verification subject:
  Your Smart Campus verification code

? Specify an email verification message:
  Your verification code is {####}

? Do you want to override the default password policy?
  ❯ Yes

? Enter the minimum password length:
  8

? Password policy requirements:
  ✓ Require at least one lowercase letter
  ✓ Require at least one uppercase letter
  ✓ Require at least one number
  ✓ Require at least one special character

? What attributes are required for signing up?
  ❯ Email, Name

? Do you want to enable any of the following capabilities?
  ✓ Add User to Group
  
? Do you want to edit your add-to-group function now?
  ❯ No

? Do you want to configure Lambda Triggers for Cognito?
  ❯ No
```

✅ **Auth service configured!**

---

## Part 6: Add Storage (S3) (15 minutes)

### Step 1: Add Storage Service

```bash
amplify add storage
```

**Configuration:**

```
? Select from one of the below mentioned services:
  ❯ Content (Images, audio, video, etc.)

? Provide a friendly name for your resource:
  schoolassets

? Provide bucket name:
  smartcampusschoolassets[UNIQUE_ID]

? Who should have access:
  ❯ Auth users only

? What kind of access do you want for Authenticated users?
  ✓ create/update
  ✓ read
  ✓ delete

? Do you want to add a Lambda Trigger for your S3 Bucket?
  ❯ Yes

? Select from the following options:
  ❯ Choose an existing function from the project
  ❯ Create a new function

? Provide an AWS Lambda function name:
  imageProcessor

? Choose the runtime:
  ❯ NodeJS

? Choose the function template:
  ❯ Hello World

? Do you want to configure advanced settings?
  ❯ No

? Do you want to edit the local lambda function now?
  ❯ No
```

✅ **Storage service configured!**

---

## Part 7: Add API (AppSync + DynamoDB) (20 minutes)

### Step 1: Add API Service

```bash
amplify add api
```

**Configuration:**

```
? Select from one of the below mentioned services:
  ❯ GraphQL

? Here is the GraphQL API that we will create. Select a setting to edit or continue:
  ❯ Continue

? Choose a schema template:
  ❯ Single object with fields (e.g., "Todo" with ID, name, description)

? Do you want to edit the schema now?
  ❯ Yes
```

**This opens:** `amplify/backend/api/SmartCampusAPI/schema.graphql`

### Step 2: Replace Schema

**Replace the entire file with:**

```graphql
# School Model
type School @model @auth(rules: [
  { allow: private, operations: [read] },
  { allow: groups, groups: ["SuperAdmin"], operations: [create, update, delete, read] }
]) {
  id: ID!
  schoolId: String! @index(name: "bySchoolId", queryField: "schoolBySchoolId")
  name: String!
  logo: LogoInfo!
  branding: BrandingInfo
  address: String!
  city: String!
  state: String!
  zipCode: String!
  country: String!
  phone: String!
  email: String! @index(name: "byEmail", queryField: "schoolByEmail")
  website: String
  adminName: String!
  adminEmail: String!
  adminPhone: String!
  status: SchoolStatus!
  subscription: SubscriptionInfo!
  stats: SchoolStats
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  createdBy: String!
}

type LogoInfo {
  url: String!
  thumbnailUrl: String
  fileName: String!
  fileSize: Int!
  uploadedAt: AWSDateTime!
}

type BrandingInfo {
  primaryColor: String!
  secondaryColor: String!
  accentColor: String!
}

enum SchoolStatus {
  ACTIVE
  INACTIVE
  PENDING
  SUSPENDED
}

type SubscriptionInfo {
  plan: SubscriptionPlan!
  validUntil: AWSDateTime!
  features: [String!]!
}

enum SubscriptionPlan {
  FREE
  BASIC
  PREMIUM
  ENTERPRISE
}

type SchoolStats {
  totalStudents: Int!
  totalTeachers: Int!
  totalParents: Int!
  totalStaff: Int!
}

# User Model
type User @model @auth(rules: [
  { allow: owner },
  { allow: groups, groups: ["SuperAdmin", "SchoolAdmin"], operations: [read, update] }
]) {
  id: ID!
  email: String!
  name: String!
  role: UserRole!
  schoolId: String! @index(name: "bySchool", queryField: "usersBySchool")
  schoolData: CachedSchoolData
  profilePicture: String
  phone: String
  createdAt: AWSDateTime!
  lastLogin: AWSDateTime
}

enum UserRole {
  SUPER_ADMIN
  SCHOOL_ADMIN
  TEACHER
  PARENT
  STUDENT
}

type CachedSchoolData {
  name: String!
  logo: String!
  primaryColor: String!
}

# Student Model
type Student @model @auth(rules: [
  { allow: groups, groups: ["SuperAdmin", "SchoolAdmin", "Teacher"], operations: [read, create, update] },
  { allow: owner, ownerField: "parentId", operations: [read] }
]) {
  id: ID!
  studentId: String! @index(name: "byStudentId", queryField: "studentByStudentId")
  schoolId: String! @index(name: "bySchoolId")
  name: String!
  grade: String!
  class: String!
  rollNumber: String!
  dateOfBirth: AWSDate!
  parentId: String!
  profilePicture: String
  status: String!
  createdAt: AWSDateTime!
}

# Attendance Model
type Attendance @model @auth(rules: [
  { allow: groups, groups: ["SuperAdmin", "SchoolAdmin", "Teacher"], operations: [create, update, read] },
  { allow: groups, groups: ["Parent"], operations: [read] }
]) {
  id: ID!
  studentId: String! @index(name: "byStudent", queryField: "attendanceByStudent")
  schoolId: String! @index(name: "bySchool")
  date: AWSDate! @index(name: "byDate")
  status: AttendanceStatus!
  markedBy: String!
  createdAt: AWSDateTime!
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
  EXCUSED
}

# Fee Model
type Fee @model @auth(rules: [
  { allow: groups, groups: ["SuperAdmin", "SchoolAdmin"], operations: [create, update, read, delete] },
  { allow: groups, groups: ["Parent"], operations: [read] }
]) {
  id: ID!
  studentId: String! @index(name: "byStudent")
  schoolId: String! @index(name: "bySchool")
  amount: Float!
  dueDate: AWSDate!
  status: FeeStatus!
  paymentDate: AWSDate
  createdAt: AWSDateTime!
}

enum FeeStatus {
  PENDING
  PAID
  OVERDUE
  PARTIAL
}
```

**Save the file** (`Cmd/Ctrl + S`)

✅ **API schema configured!**

---

## Part 8: Deploy Everything to AWS (10 minutes)

### Step 1: Push to Cloud

```bash
amplify push
```

**Confirm deployment:**

```
✔ Successfully pulled backend environment dev from the cloud.

Current Environment: dev

| Category | Resource name       | Operation | Provider plugin   |
| -------- | ------------------- | --------- | ----------------- |
| Auth     | smartcampusauth     | Create    | awscloudformation |
| Storage  | schoolassets        | Create    | awscloudformation |
| Function | imageProcessor      | Create    | awscloudformation |
| Api      | SmartCampusAPI      | Create    | awscloudformation |

? Are you sure you want to continue? (Y/n) Y

? Do you want to generate code for your newly created GraphQL API? Yes
? Choose the code generation language target: typescript
? Enter the file name pattern of graphql queries, mutations and subscriptions: src/graphql/**/*.ts
? Do you want to generate/update all possible GraphQL operations?: Yes
? Enter maximum statement depth: 2

⠋ Updating resources in the cloud. This may take a few minutes...

✅ All resources deployed successfully!
✅ GraphQL endpoint: https://xxxxx.appsync-api.us-east-1.amazonaws.com/graphql
✅ GraphQL API KEY: da2-xxxxx
```

**This creates:**
- ✅ Cognito User Pool
- ✅ S3 Bucket
- ✅ DynamoDB Tables (School, User, Student, Attendance, Fee)
- ✅ AppSync GraphQL API
- ✅ Lambda Functions
- ✅ IAM Roles & Policies

---

## Part 9: Install Amplify in React Native (10 minutes)

### Step 1: Install Dependencies

```bash
npm install aws-amplify @aws-amplify/ui-react-native amazon-cognito-identity-js
npm install @react-native-async-storage/async-storage
npm install react-native-get-random-values
npm install expo-image-picker
```

### Step 2: Configure Amplify in App

**Update `App.tsx`:**

```typescript
import { Amplify } from 'aws-amplify';
import awsconfig from './src/aws-exports';
import 'react-native-get-random-values'; // Must be first import!

// Configure Amplify
Amplify.configure(awsconfig);

// Rest of your app code...
export default function App() {
  return (
    <GluestackProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GluestackProvider>
  );
}
```

### Step 3: Update .gitignore

**Add to `.gitignore`:**

```
# Amplify
amplify/\#current-cloud-backend
amplify/.config/local-*
amplify/logs
amplify/mock-data
amplify/mock-api-resources
amplify/backend/amplify-meta.json
amplify/backend/.temp
build/
dist/
node_modules/
aws-exports.js
awsconfiguration.json
amplifyconfiguration.json
amplifyconfiguration.dart
amplify-build-config.json
amplify-gradle-config.json
amplifytools.xcconfig
.secret-*
**.sample

# AWS
src/aws-exports.js
```

✅ **Amplify configured in React Native!**

---

## Part 10: Test AWS Integration (15 minutes)

### Step 1: Start Development Server

```bash
npm start
```

### Step 2: Test Authentication

**Create test file:** `tests/aws-test.ts`

```typescript
import { Auth } from 'aws-amplify';

async function testAuth() {
  try {
    // Sign up
    const signUpResult = await Auth.signUp({
      username: 'test@school.com',
      password: 'Test@123',
      attributes: {
        email: 'test@school.com',
        name: 'Test User',
        'custom:role': 'teacher',
        'custom:schoolId': 'SCH-2025-A12'
      }
    });
    console.log('✅ Sign up successful:', signUpResult);
    
    // Sign in
    const signInResult = await Auth.signIn('test@school.com', 'Test@123');
    console.log('✅ Sign in successful:', signInResult);
    
    // Get current user
    const currentUser = await Auth.currentAuthenticatedUser();
    console.log('✅ Current user:', currentUser);
    
    return true;
  } catch (error) {
    console.error('❌ Auth test failed:', error);
    return false;
  }
}

// Run test
testAuth();
```

### Step 3: Test Storage (S3)

```typescript
import { Storage } from 'aws-amplify';

async function testStorage() {
  try {
    // Upload file
    const result = await Storage.put('test.txt', 'Hello AWS!', {
      level: 'public',
      contentType: 'text/plain'
    });
    console.log('✅ Upload successful:', result);
    
    // Get file URL
    const url = await Storage.get('test.txt', { level: 'public' });
    console.log('✅ File URL:', url);
    
    // List files
    const files = await Storage.list('', { level: 'public' });
    console.log('✅ Files:', files);
    
    return true;
  } catch (error) {
    console.error('❌ Storage test failed:', error);
    return false;
  }
}

testStorage();
```

### Step 4: Test API (GraphQL)

```typescript
import { API, graphqlOperation } from 'aws-amplify';

const createSchool = /* GraphQL */ `
  mutation CreateSchool($input: CreateSchoolInput!) {
    createSchool(input: $input) {
      id
      schoolId
      name
    }
  }
`;

async function testAPI() {
  try {
    const input = {
      schoolId: 'SCH-2025-TEST',
      name: 'Test School',
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'USA',
      phone: '555-0000',
      email: 'test@test.com',
      adminName: 'Admin',
      adminEmail: 'admin@test.com',
      adminPhone: '555-0001',
      status: 'ACTIVE',
      logo: {
        url: 'https://example.com/logo.png',
        fileName: 'logo.png',
        fileSize: 1000,
        uploadedAt: new Date().toISOString()
      },
      subscription: {
        plan: 'BASIC',
        validUntil: new Date().toISOString(),
        features: ['attendance', 'homework']
      },
      createdBy: 'test-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const result: any = await API.graphql(
      graphqlOperation(createSchool, { input })
    );
    
    console.log('✅ School created:', result.data.createSchool);
    return true;
  } catch (error) {
    console.error('❌ API test failed:', error);
    return false;
  }
}

testAPI();
```

✅ **All AWS services tested!**

---

## 📊 What You Now Have

### AWS Resources Created:

1. **Amazon Cognito**
   - User Pool: smartcampususerpool
   - Identity Pool: smartcampusidentitypool
   - User Groups: SuperAdmin, SchoolAdmin, Teacher, Parent, Student

2. **Amazon S3**
   - Bucket: smartcampusschoolassets[UNIQUE]
   - Lambda trigger: imageProcessor

3. **AWS AppSync**
   - GraphQL API endpoint
   - Real-time subscriptions
   - API Key for public access

4. **Amazon DynamoDB**
   - Tables: School, User, Student, Attendance, Fee
   - Global Secondary Indexes for queries

5. **AWS Lambda**
   - Image processor function
   - Auto-scaling

6. **AWS IAM**
   - Roles for authenticated users
   - Policies for resource access

---

## 💰 Current Costs

### AWS Free Tier (First 12 months):
- Cognito: First 50,000 MAU free
- S3: 5GB storage free
- DynamoDB: 25GB storage + 25 RCU/WCU free
- Lambda: 1M requests free
- AppSync: 250,000 queries free

### After Free Tier (Estimated for 1,000 users):
- Cognito: ~$5/month
- S3: ~$1/month
- DynamoDB: ~$5/month
- AppSync: ~$4/month
- Lambda: ~$1/month
- **Total: ~$16/month**

---

## ✅ Next Steps

1. ✅ AWS Setup Complete
2. ⏭️ Implement School Branding Service
3. ⏭️ Update AuthService to use Cognito
4. ⏭️ Test with real data
5. ⏭️ Deploy to App Store & Play Store

---

## 🆘 Troubleshooting

### Common Issues:

**1. "amplify: command not found"**
```bash
npm install -g @aws-amplify/cli
```

**2. "Access Denied" errors**
```bash
aws configure
# Re-enter credentials
```

**3. "Module not found: aws-exports"**
```bash
amplify push
# Regenerates aws-exports.js
```

**4. Build errors**
```bash
npm start -- --clear
# Clears Metro bundler cache
```

---

## 📞 Support Resources

- **AWS Amplify Docs:** https://docs.amplify.aws/
- **AWS Console:** https://console.aws.amazon.com/
- **Amplify Discord:** https://discord.gg/amplify
- **Stack Overflow:** Tag: aws-amplify

---

**🎉 Congratulations! AWS is now set up and ready to use!**

**Time taken:** ~2 hours
**Cost:** $0 (free tier) or ~$16/month
**Status:** ✅ Ready for development

Next: App Store & Play Store deployment guide →

