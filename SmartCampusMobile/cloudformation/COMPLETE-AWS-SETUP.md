# 🚀 Complete AWS Setup Guide for Smart Campus

This guide provides a complete, step-by-step process to deploy and configure AWS infrastructure for the Smart Campus mobile application.

## 📋 Prerequisites

Before you begin, ensure you have:

- [ ] AWS Account with administrative access
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Node.js 16+ and npm installed
- [ ] Basic understanding of AWS services
- [ ] Terminal/Command line access

## 🎯 Quick Start (5 Steps)

### Step 1: Deploy AWS Infrastructure

```bash
cd cloudformation
chmod +x deploy-all.sh
./deploy-all.sh
```

This deploys:
- ✅ Cognito User Pool with 5 user groups (SuperAdmin, SchoolAdmin, Teacher, Parent, Student)
- ✅ DynamoDB tables for all app data (11 tables)
- ✅ S3 bucket for school logos and media files

**Expected Output:** All 3 CloudFormation stacks deployed successfully

### Step 2: Update Configuration

After deployment, the script will create `aws-outputs.json`. Extract the values and update `src/aws-config.ts`:

```typescript
export const awsConfig = {
  region: 'eu-north-1',
  
  cognito: {
    userPoolId: 'YOUR_USER_POOL_ID',      // From aws-outputs.json
    userPoolClientId: 'YOUR_CLIENT_ID',    // From aws-outputs.json
    identityPoolId: 'YOUR_IDENTITY_POOL_ID', // From aws-outputs.json
    region: 'eu-north-1',
  },
  
  storage: {
    bucket: 'smartcampus-logos-2025',     // From aws-outputs.json
    region: 'eu-north-1',
  },
  
  // DynamoDB table names (already configured)
};
```

### Step 3: Create Cognito Users

First, update the USER_POOL_ID in `create-cognito-users.sh`:

```bash
# Edit the file and update USER_POOL_ID
nano create-cognito-users.sh

# Then run it
chmod +x create-cognito-users.sh
./create-cognito-users.sh
```

This creates test users for all roles with password: `SmartCampus123!`

### Step 4: Populate Sample Data

```bash
cd cloudformation
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
node create-sample-data.js
```

This populates DynamoDB with:
- ✅ 3 sample schools
- ✅ Sample users data
- ✅ Sample calendar events

### Step 5: Test the Integration

```bash
cd ..
npm install
npm start
```

Try logging in with:
- **Email:** `admin@smartcampus.com`
- **Password:** `SmartCampus123!`
- **School ID:** (Not required for Super Admin)

---

## 📊 What Gets Created

### AWS Cognito
- **User Pool:** SmartCampusUserPool
- **User Pool Client:** SmartCampusWebClient
- **Identity Pool:** SmartCampusIdentityPool
- **User Groups:** SuperAdmin, SchoolAdmin, Teacher, Parent, Student

### DynamoDB Tables (11 total)
1. `SmartCampus-Schools` - School information
2. `SmartCampus-Users` - User profiles
3. `SmartCampus-Attendance` - Attendance records
4. `SmartCampus-Homework` - Homework assignments
5. `SmartCampus-Fees` - Fee management
6. `SmartCampus-Communications` - Messages and announcements
7. `SmartCampus-Notifications` - Push notifications
8. `SmartCampus-Transport` - Bus tracking
9. `SmartCampus-Gallery` - Photo gallery
10. `SmartCampus-Calendar` - Events and calendar
11. `SmartCampus-Analytics` - Usage analytics

### S3 Storage
- **Bucket:** `smartcampus-logos-2025`
- **Purpose:** School logos, media files, documents
- **Access:** Public read, authenticated write

---

## 👥 Test Users Created

### Super Admin
- **Email:** `admin@smartcampus.com`
- **Password:** `SmartCampus123!`
- **Role:** SuperAdmin
- **Access:** All schools, full system access

### School Admins

**Lotus Public School:**
- **Email:** `admin@lotuspublic.edu`
- **Password:** `SmartCampus123!`
- **School ID:** `SCH-2025-A12`
- **Role:** SchoolAdmin

**Sunrise Academy:**
- **Email:** `admin@sunriseacademy.edu`
- **Password:** `SmartCampus123!`
- **School ID:** `SCH-2025-B45`
- **Role:** SchoolAdmin

**Demo School:**
- **Email:** `admin@school.com`
- **Password:** `SmartCampus123!`
- **School ID:** `SCH001`
- **Role:** SchoolAdmin

### Teachers

- **Email:** `teacher@lotuspublic.edu` (School: SCH-2025-A12)
- **Email:** `teacher@sunriseacademy.edu` (School: SCH-2025-B45)
- **Email:** `teacher@school.com` (School: SCH001)
- **Password:** `SmartCampus123!`

### Parents

- **Email:** `parent@lotuspublic.edu` (School: SCH-2025-A12)
- **Email:** `parent@sunriseacademy.edu` (School: SCH-2025-B45)
- **Email:** `parent@school.com` (School: SCH001)
- **Password:** `SmartCampus123!`

---

## 🔧 Manual Setup (Alternative)

If the automated scripts don't work, follow these manual steps:

### Deploy Cognito Stack

```bash
aws cloudformation deploy \
  --template-file cognito-stack.yaml \
  --stack-name SmartCampus-Cognito \
  --capabilities CAPABILITY_IAM \
  --region eu-north-1
```

### Deploy S3 Stack

```bash
aws cloudformation deploy \
  --template-file s3-stack.yaml \
  --stack-name SmartCampus-S3 \
  --region eu-north-1
```

### Deploy DynamoDB Stack

```bash
aws cloudformation deploy \
  --template-file dynamodb-stack.yaml \
  --stack-name SmartCampus-DynamoDB \
  --region eu-north-1
```

### Get Stack Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name SmartCampus-Cognito \
  --region eu-north-1 \
  --query 'Stacks[0].Outputs' \
  --output table
```

---

## 🧪 Testing the Integration

### 1. Test Login Flow

```bash
npm start
```

1. Open the app
2. Select login type (Super Admin or School User)
3. Enter credentials
4. Verify successful login

### 2. Test Data Access

- Navigate to different screens
- Verify data loads from DynamoDB
- Check that school-specific data is filtered correctly

### 3. Test S3 Upload

- Upload a school logo
- Verify it appears in S3 bucket
- Check that the URL is accessible

---

## 💰 Cost Estimation

### AWS Free Tier (First 12 months)

- **Cognito:** 50,000 MAUs free/month (then $0.0055/MAU)
- **DynamoDB:** 25 GB storage, 25 WCU, 25 RCU free
- **S3:** 5 GB storage, 20,000 GET requests, 2,000 PUT requests

### Expected Monthly Cost (After Free Tier)

**Low Usage (100 active users):**
- Cognito: ~$0.50
- DynamoDB: ~$1.00
- S3: ~$0.25
- **Total: ~$2/month**

**Medium Usage (1,000 active users):**
- Cognito: ~$5.00
- DynamoDB: ~$5.00
- S3: ~$1.00
- **Total: ~$11/month**

**High Usage (10,000 active users):**
- Cognito: ~$50.00
- DynamoDB: ~$25.00
- S3: ~$5.00
- **Total: ~$80/month**

---

## 🔒 Security Best Practices

### 1. Enable MFA for Production

```bash
aws cognito-idp set-user-pool-mfa-config \
  --user-pool-id YOUR_USER_POOL_ID \
  --mfa-configuration OPTIONAL \
  --software-token-mfa-configuration Enabled=true
```

### 2. Set Up CloudWatch Alarms

- Monitor Cognito login failures
- Track DynamoDB throttling
- Alert on S3 unauthorized access

### 3. Enable AWS Backup

```bash
aws backup create-backup-plan \
  --backup-plan file://backup-plan.json
```

### 4. Rotate Secrets

- Change default passwords immediately
- Use AWS Secrets Manager for API keys
- Implement password expiration policies

---

## 🆘 Troubleshooting

### Issue: CloudFormation deployment fails

**Solution:**
```bash
# Check for existing resources
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE

# Delete failed stack
aws cloudformation delete-stack --stack-name SmartCampus-Cognito

# Retry deployment
./deploy-all.sh
```

### Issue: "Access Denied" when creating users

**Solution:**
- Verify AWS credentials have admin permissions
- Check IAM user has `cognito-idp:*` permissions
- Ensure you're in the correct region

### Issue: DynamoDB table not found

**Solution:**
```bash
# List all tables
aws dynamodb list-tables --region eu-north-1

# Verify table names match config
cat ../src/aws-config.ts | grep Table
```

### Issue: S3 bucket name already taken

**Solution:**
- Edit `s3-stack.yaml` and change bucket name to something unique
- S3 bucket names must be globally unique across all AWS accounts

### Issue: Cognito users can't login

**Solution:**
```bash
# Check user status
aws cognito-idp admin-get-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username user@example.com

# Reset password
aws cognito-idp admin-set-user-password \
  --user-pool-id YOUR_USER_POOL_ID \
  --username user@example.com \
  --password NewPassword123! \
  --permanent
```

---

## 🔄 Update and Maintenance

### Update CloudFormation Stacks

```bash
cd cloudformation
./deploy-all.sh  # Automatically updates existing stacks
```

### Backup DynamoDB Data

```bash
# Enable point-in-time recovery
aws dynamodb update-continuous-backups \
  --table-name SmartCampus-Schools \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

### Monitor Costs

```bash
# View current month's costs
aws ce get-cost-and-usage \
  --time-period Start=2025-10-01,End=2025-10-31 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

---

## 📚 Additional Resources

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [S3 Security Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)
- [AWS Amplify for React Native](https://docs.amplify.aws/react-native/)

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] AWS account created and configured
- [ ] AWS CLI installed and configured
- [ ] Node.js and npm installed
- [ ] Project dependencies installed

### Infrastructure Deployment
- [ ] CloudFormation stacks deployed
- [ ] Stack outputs retrieved
- [ ] Configuration files updated
- [ ] Cognito users created
- [ ] Sample data populated

### Testing
- [ ] Login flow tested
- [ ] Data retrieval verified
- [ ] S3 upload/download tested
- [ ] Role-based access verified

### Security
- [ ] Default passwords changed
- [ ] MFA enabled (production)
- [ ] CloudWatch alarms configured
- [ ] Backup enabled

### Production Ready
- [ ] Performance tested
- [ ] Security audit completed
- [ ] Cost monitoring enabled
- [ ] Documentation updated

---

## 🎉 Next Steps

Once AWS is fully set up and tested:

1. **Configure App for Production**
   - Update `app.json` with proper bundle identifiers
   - Set up environment variables
   - Configure EAS build profiles

2. **Build for App Stores**
   ```bash
   eas build --platform all --profile production
   ```

3. **Submit to Stores**
   ```bash
   eas submit --platform all --latest
   ```

4. **Monitor and Maintain**
   - Set up CloudWatch dashboards
   - Configure alerts
   - Monitor costs
   - Regular backups

---

**Questions or Issues?**

Check the troubleshooting section or review the AWS documentation. For app-specific issues, refer to the main README.md.

**Last Updated:** October 2025  
**AWS Region:** eu-north-1 (Stockholm)  
**Status:** Production Ready ✅

