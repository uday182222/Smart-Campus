# 🚀 New AWS Account Setup for Smart Campus

## Step-by-Step Guide to Create & Configure New AWS Account

---

## 📋 What You'll Do

1. Create new AWS account (15 minutes)
2. Set up IAM admin user (10 minutes)
3. Configure AWS CLI with new profile (5 minutes)
4. Test connection (2 minutes)
5. Initialize Amplify (5 minutes)

**Total Time:** ~40 minutes

---

## Step 1: Create New AWS Account (15 minutes)

### 1.1 Open AWS Signup

**Open this URL in your browser:**
```
https://portal.aws.amazon.com/billing/signup
```

### 1.2 Fill in Account Information

**Email:** Use a NEW email (different from existing AWS account)
- Example: `smartcampus@yourdomain.com`
- Or: `your.name+smartcampus@gmail.com` (Gmail trick)

**Password:** Create strong password
- Example: `SmartCampus2025!@#`

**AWS Account Name:**
```
Smart Campus Production
```

**Click:** Continue

### 1.3 Contact Information

**Account Type:** 
- Choose: `Professional` (recommended) or `Personal`

**Full Name:** Your name or company name
**Phone Number:** Your phone
**Country/Region:** United States (or your country)
**Address:** Your address

**Click:** Create Account and Continue

### 1.4 Payment Information

**Credit/Debit Card:**
- Card Number
- Expiration
- CVV
- Cardholder Name

**Note:** AWS will charge $1 for verification (refunded)

**Click:** Verify and Add

### 1.5 Identity Verification

**Phone Verification:**
- Enter phone number
- Choose: Text message (SMS) or Voice call
- Enter verification code
- Click: Continue

### 1.6 Select Support Plan

**Choose:** Basic support - free

**Click:** Complete sign up

### 1.7 Welcome Screen

**Click:** Go to the AWS Management Console

✅ **New AWS account created!**

---

## Step 2: Create IAM Admin User (10 minutes)

### 2.1 Access IAM Console

**In AWS Console:**
1. Search bar: Type "IAM"
2. Click: IAM (Identity and Access Management)

### 2.2 Create User

**Click:** Users (left sidebar) → Create user

**User name:**
```
smartcampus-admin
```

**Click:** Next

### 2.3 Set Permissions

**Click:** Attach policies directly

**Search and select:**
- ✅ AdministratorAccess

**Click:** Next

### 2.4 Review and Create

**Review:**
- User name: smartcampus-admin
- Permissions: AdministratorAccess

**Click:** Create user

✅ **User created!**

### 2.5 Create Access Keys

**Click:** The user you just created (`smartcampus-admin`)

**Click:** Security credentials tab

**Scroll down to:** Access keys

**Click:** Create access key

**Use case:**
- Select: Command Line Interface (CLI)
- Check: I understand...
- Click: Next

**Description (optional):**
```
Smart Campus CLI Access
```

**Click:** Create access key

### 2.6 SAVE CREDENTIALS IMMEDIATELY! 📝

```
⚠️ CRITICAL: Save these NOW! You won't see them again!

Access key ID:     AKIA........................
Secret access key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Copy to secure location or download .csv file!
```

**Click:** Download .csv file
**Click:** Done

✅ **Access keys created and saved!**

---

## Step 3: Configure AWS CLI with New Profile (5 minutes)

Now let's add this new AWS account as a separate profile:

### 3.1 Configure New Profile

**Run in terminal:**
```bash
aws configure --profile smartcampus
```

**When prompted, enter:**

```
AWS Access Key ID: [Paste your Access Key ID]
AWS Secret Access Key: [Paste your Secret Access Key]
Default region name: us-east-1
Default output format: json
```

### 3.2 Verify Configuration

**Test the new profile:**
```bash
aws sts get-caller-identity --profile smartcampus
```

**You should see:**
```json
{
    "UserId": "AIDAXXXXXXXXXX",
    "Account": "NEW_ACCOUNT_NUMBER",
    "Arn": "arn:aws:iam::NEW_ACCOUNT_NUMBER:user/smartcampus-admin"
}
```

✅ **New AWS profile configured!**

### 3.3 Set as Default for This Project (Optional)

**To always use this profile for Smart Campus:**
```bash
export AWS_PROFILE=smartcampus
```

**Or add to your shell config:**
```bash
echo 'export AWS_PROFILE=smartcampus' >> ~/.zshrc
source ~/.zshrc
```

---

## Step 4: Configure Amplify with New Profile (5 minutes)

### 4.1 Configure Amplify

**Run:**
```bash
amplify configure
```

**This will:**
1. Open browser to AWS Console
2. Sign you in (use new account if prompted)
3. Create Amplify IAM user

**Follow the prompts:**

```
Specify the AWS Region
? region: us-east-1

Specify the username of the new IAM user:
? user name: amplify-smartcampus
```

**In browser:**
1. Click: Next: Permissions
2. Click: Next: Tags
3. Click: Next: Review
4. Click: Create user
5. **Download .csv** with credentials
6. Click: Close

**Back in terminal:**
```
Enter the access key of the newly created user:
? accessKeyId: [From .csv file]
? secretAccessKey: [From .csv file]

Profile Name: smartcampus-amplify
```

✅ **Amplify configured with new AWS account!**

---

## Step 5: Initialize Amplify in Project (5 minutes)

### 5.1 Navigate to Project

```bash
cd /Users/udaytomar/Developer/Smart-Campus/SmartCampusMobile
```

### 5.2 Initialize Amplify

```bash
amplify init
```

**Configuration:**

```
? Enter a name for the project: SmartCampus
? Initialize the project with the above configuration? No
? Enter a name for the environment: dev
? Choose your default editor: Visual Studio Code
? Choose the type of app that you're building: javascript
? What javascript framework are you using: react-native
? Source Directory Path: ./
? Distribution Directory Path: /
? Build Command: npm run build
? Start Command: npm start
? Select the authentication method you want to use: AWS profile
? Please choose the profile you want to use: smartcampus-amplify
```

**This will take 2-3 minutes...**

✅ **Amplify initialized!**

---

## ✅ Verification Checklist

After completing all steps, verify:

- [ ] New AWS account created
- [ ] Can login to AWS Console
- [ ] IAM admin user created
- [ ] Access keys downloaded and saved
- [ ] AWS CLI configured with `smartcampus` profile
- [ ] Amplify configured with new account
- [ ] Amplify initialized in SmartCampusMobile folder
- [ ] `amplify/` folder exists in project

**Test command:**
```bash
aws sts get-caller-identity --profile smartcampus
amplify status
```

---

## 🎯 Next Steps (After This Setup)

Once verification is complete:

1. **Add Authentication (Cognito):**
   ```bash
   amplify add auth
   ```

2. **Add Storage (S3):**
   ```bash
   amplify add storage
   ```

3. **Add API (AppSync + DynamoDB):**
   ```bash
   amplify add api
   ```

4. **Deploy Everything:**
   ```bash
   amplify push
   ```

**Follow:** `AWS-SETUP-STEP-BY-STEP.md` (Parts 5-10)

---

## 💰 New AWS Account Benefits

**AWS Free Tier (12 months):**
- ✅ Cognito: 50,000 MAU free
- ✅ S3: 5GB storage free
- ✅ DynamoDB: 25GB free
- ✅ Lambda: 1M requests free
- ✅ AppSync: 250,000 queries free

**Perfect for Smart Campus development!**

---

## 🔐 Security Best Practices

**For your new AWS account:**

1. **Enable MFA (Multi-Factor Authentication):**
   - Go to: IAM → Users → Root user
   - Add MFA device

2. **Create Billing Alerts:**
   - Go to: Billing → Budgets
   - Create budget: $50/month
   - Get email alerts

3. **Never commit credentials:**
   - Keep .csv files secure
   - Don't share access keys
   - Rotate keys periodically

---

## 📞 Support

**If you need help:**

- AWS Support: https://console.aws.amazon.com/support/
- Amplify Discord: https://discord.gg/amplify
- Documentation: `AWS-SETUP-STEP-BY-STEP.md`

---

## ✅ Summary

You now have:
- ✅ Dedicated AWS account for Smart Campus
- ✅ Separate billing and resources
- ✅ IAM admin user configured
- ✅ AWS CLI profile: `smartcampus`
- ✅ Amplify profile: `smartcampus-amplify`
- ✅ Ready for Amplify services

**Status:** Ready to add Amplify services!

**Next:** Continue with AWS-SETUP-STEP-BY-STEP.md (Part 5)

