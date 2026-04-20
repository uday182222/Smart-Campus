# 🔑 How to Get AWS Credentials - Step by Step

**For Homework API S3 Upload**

---

## 📍 Where to Get Each Credential

### **1. AWS_REGION** ✅
**Value:** `eu-north-1` (or your preferred region)

**Where to find:**
- This is the AWS region where your resources are located
- Common regions:
  - `us-east-1` (N. Virginia) - Most common
  - `eu-north-1` (Stockholm) - You mentioned this
  - `ap-south-1` (Mumbai) - India
  - `eu-west-1` (Ireland)

**How to check:**
1. Go to AWS Console: https://console.aws.amazon.com/
2. Look at the top-right corner - it shows your current region
3. Or check where you created your S3 bucket

---

### **2. AWS_ACCESS_KEY_ID** 🔑
**Format:** `AKIA...` (starts with AKIA, 20 characters)

**Where to get:**
1. **Login to AWS Console:** https://console.aws.amazon.com/
2. **Click your username** (top-right corner)
3. **Click:** "Security credentials"
4. **Scroll down** to "Access keys" section
5. **Click:** "Create access key"
6. **Select:** "Application running outside AWS" (for local development)
7. **Click:** "Next"
8. **Optional:** Add description: "Smart Campus Homework API"
9. **Click:** "Create access key"
10. **⚠️ IMPORTANT:** Copy the **Access key ID** immediately
    - It looks like: `AKIAIOSFODNN7EXAMPLE`
    - You can only see it once!

---

### **3. AWS_SECRET_ACCESS_KEY** 🔐
**Format:** Long string (40 characters)

**Where to get:**
1. **Same page** as above (after creating access key)
2. **Click:** "Show" next to "Secret access key"
3. **⚠️ CRITICAL:** Copy this immediately
    - It looks like: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
    - You can **NEVER** see it again if you close this page!
4. **Click:** "Done"

**⚠️ SECURITY WARNING:**
- Never commit these to Git
- Never share them publicly
- Store them securely in `.env` file

---

### **4. AWS_S3_BUCKET** 📦
**Value:** `smartcampus-logos-2025` (or your bucket name)

**Where to find:**
1. **Go to S3 Console:** https://console.aws.amazon.com/s3/
2. **Look at your bucket list**
3. **Find your bucket** (e.g., `smartcampus-logos-2025`)
4. **Copy the exact name**

**OR Create a new bucket:**
1. **Click:** "Create bucket"
2. **Bucket name:** `smartcampus-logos-2025` (must be globally unique)
   - If taken, try: `smartcampus-logos-2025-YOURNAME`
3. **Region:** Choose same as `AWS_REGION`
4. **Click:** "Create bucket"

---

## 🚀 Quick Setup Steps

### **Step 1: Create IAM User (Recommended)**

**Why?** Don't use your root account credentials!

1. **Go to IAM:** https://console.aws.amazon.com/iam/
2. **Click:** "Users" → "Create user"
3. **Username:** `smart-campus-api-user`
4. **Access type:** ✅ Programmatic access
5. **Click:** "Next: Permissions"
6. **Attach policies:** ✅ `AmazonS3FullAccess` (for S3 uploads)
7. **Click:** "Next: Tags" → "Next: Review" → "Create user"
8. **⚠️ SAVE CREDENTIALS:**
   - Access Key ID
   - Secret Access Key
   - Download the `.csv` file

---

### **Step 2: Create S3 Bucket**

1. **Go to S3:** https://console.aws.amazon.com/s3/
2. **Click:** "Create bucket"
3. **Bucket name:** `smartcampus-logos-2025`
4. **Region:** `eu-north-1` (or your region)
5. **Block Public Access:** 
   - ✅ Uncheck "Block all public access" (for homework files)
   - OR keep it blocked and use signed URLs
6. **Click:** "Create bucket"

**Configure CORS:**
1. **Click your bucket** → "Permissions" tab
2. **Scroll to CORS** → "Edit"
3. **Paste this:**
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
```
4. **Click:** "Save changes"

---

### **Step 3: Add to .env File**

**File:** `server/.env`

```bash
# Create .env file if it doesn't exist
cd /Users/udaytomar/Developer/Smart-Campus/server
touch .env
```

**Add these lines:**
```env
# AWS Configuration
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET=smartcampus-logos-2025
```

**⚠️ Replace with YOUR actual values!**

---

### **Step 4: Verify Setup**

**Test AWS connection:**
```bash
cd /Users/udaytomar/Developer/Smart-Campus/server

# Install AWS SDK if not already installed
npm install @aws-sdk/client-s3

# Test connection (create test file)
node -e "
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
const client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
client.send(new ListBucketsCommand({})).then(data => {
  console.log('✅ AWS Connection Successful!');
  console.log('Buckets:', data.Buckets.map(b => b.Name));
}).catch(err => {
  console.error('❌ Error:', err.message);
});
"
```

---

## 🔒 Security Best Practices

### **✅ DO:**
- ✅ Use IAM user (not root account)
- ✅ Store credentials in `.env` file
- ✅ Add `.env` to `.gitignore`
- ✅ Use least privilege (only S3 access needed)
- ✅ Rotate keys regularly

### **❌ DON'T:**
- ❌ Commit `.env` to Git
- ❌ Share credentials publicly
- ❌ Use root account credentials
- ❌ Hardcode credentials in code

---

## 📋 Checklist

- [ ] Created AWS account
- [ ] Created IAM user with S3 access
- [ ] Saved Access Key ID
- [ ] Saved Secret Access Key
- [ ] Created S3 bucket
- [ ] Configured CORS on bucket
- [ ] Added credentials to `server/.env`
- [ ] Tested AWS connection
- [ ] Added `.env` to `.gitignore`

---

## 🆘 Troubleshooting

### **"Access Denied" Error**
- Check IAM user has `AmazonS3FullAccess` policy
- Verify credentials are correct in `.env`
- Check bucket name is correct

### **"Bucket Not Found" Error**
- Verify bucket name matches exactly
- Check bucket is in the same region as `AWS_REGION`
- Ensure bucket exists in your AWS account

### **"Invalid Credentials" Error**
- Re-create access keys
- Verify no extra spaces in `.env` file
- Check credentials are from the same AWS account

---

## 📞 Need Help?

1. **AWS Console:** https://console.aws.amazon.com/
2. **IAM Documentation:** https://docs.aws.amazon.com/iam/
3. **S3 Documentation:** https://docs.aws.amazon.com/s3/

---

## ✅ Quick Reference

**Where to find each value:**

| Credential | Where to Get |
|-----------|--------------|
| `AWS_REGION` | Top-right of AWS Console (or where you created bucket) |
| `AWS_ACCESS_KEY_ID` | IAM → Users → Security credentials → Create access key |
| `AWS_SECRET_ACCESS_KEY` | Same page as above (shown once only!) |
| `AWS_S3_BUCKET` | S3 Console → Your bucket name |

**Example `.env` file:**
```env
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET=smartcampus-logos-2025
```

---

**🎉 Once you have these, your Homework API will work!**

