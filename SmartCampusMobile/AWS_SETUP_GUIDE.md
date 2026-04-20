# 🚀 AWS Setup Guide for Smart Campus

This guide will help you set up all AWS infrastructure for the Smart Campus mobile app.

## 📋 Prerequisites

- AWS Account
- AWS CLI installed and configured
- Node.js and npm installed
- Basic understanding of AWS services

## 🏗️ Infrastructure Overview

The Smart Campus app uses the following AWS services:

1. **AWS Cognito** - User authentication and authorization
2. **Amazon DynamoDB** - NoSQL database for all app data
3. **Amazon S3** - Storage for school logos and media files

## 🎯 Step 1: Deploy AWS Infrastructure

### Option 1: Automated Deployment (Recommended)

Run the automated deployment script:

```bash
cd cloudformation
./deploy-all.sh
```

This will:
- Deploy Cognito User Pool with 5 user groups (SuperAdmin, SchoolAdmin, Teacher, Parent, Student)
- Create DynamoDB tables for all app data
- Set up S3 bucket for media storage
- Save all outputs to `aws-outputs.json`

### Option 2: Manual Deployment

Deploy each stack individually:

```bash
# 1. Deploy Cognito
aws cloudformation deploy \
  --template-file cognito-stack.yaml \
  --stack-name SmartCampus-Cognito \
  --capabilities CAPABILITY_IAM \
  --region eu-north-1

# 2. Deploy S3
aws cloudformation deploy \
  --template-file s3-stack.yaml \
  --stack-name SmartCampus-S3 \
  --region eu-north-1

# 3. Deploy DynamoDB
aws cloudformation deploy \
  --template-file dynamodb-stack.yaml \
  --stack-name SmartCampus-DynamoDB \
  --region eu-north-1
```

## 📝 Step 2: Get Stack Outputs

Get the resource IDs created by CloudFormation:

```bash
# Cognito outputs
aws cloudformation describe-stacks \
  --stack-name SmartCampus-Cognito \
  --region eu-north-1 \
  --query 'Stacks[0].Outputs'

# S3 outputs
aws cloudformation describe-stacks \
  --stack-name SmartCampus-S3 \
  --region eu-north-1 \
  --query 'Stacks[0].Outputs'

# DynamoDB outputs
aws cloudformation describe-stacks \
  --stack-name SmartCampus-DynamoDB \
  --region eu-north-1 \
  --query 'Stacks[0].Outputs'
```

## 🔧 Step 3: Update Configuration

Update `src/aws-config.ts` with your stack outputs:

```typescript
export const awsConfig = {
  region: 'eu-north-1',
  
  cognito: {
    userPoolId: 'YOUR_USER_POOL_ID',      // From Cognito stack output
    userPoolClientId: 'YOUR_CLIENT_ID',    // From Cognito stack output
    identityPoolId: 'YOUR_IDENTITY_POOL_ID', // From Cognito stack output
    region: 'eu-north-1',
  },
  
  storage: {
    bucket: 'YOUR_BUCKET_NAME',            // From S3 stack output
    region: 'eu-north-1',
  },
  
  // DynamoDB table names are already configured
};
```

## 👥 Step 4: Create Test Users

Create test users in Cognito for each role:

### Using AWS CLI:

```bash
# Super Admin
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username admin@smartcampus.com \
  --user-attributes Name=email,Value=admin@smartcampus.com Name=name,Value="Super Admin" \
  --temporary-password "TempPass123!" \
  --region eu-north-1

aws cognito-idp admin-add-user-to-group \
  --user-pool-id YOUR_USER_POOL_ID \
  --username admin@smartcampus.com \
  --group-name SuperAdmin \
  --region eu-north-1

# School Admin
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username schooladmin@smartcampus.com \
  --user-attributes Name=email,Value=schooladmin@smartcampus.com Name=name,Value="School Admin" Name=custom:schoolId,Value="SCH001" \
  --temporary-password "TempPass123!" \
  --region eu-north-1

aws cognito-idp admin-add-user-to-group \
  --user-pool-id YOUR_USER_POOL_ID \
  --username schooladmin@smartcampus.com \
  --group-name SchoolAdmin \
  --region eu-north-1

# Teacher
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username teacher@smartcampus.com \
  --user-attributes Name=email,Value=teacher@smartcampus.com Name=name,Value="Test Teacher" Name=custom:schoolId,Value="SCH001" \
  --temporary-password "TempPass123!" \
  --region eu-north-1

aws cognito-idp admin-add-user-to-group \
  --user-pool-id YOUR_USER_POOL_ID \
  --username teacher@smartcampus.com \
  --group-name Teacher \
  --region eu-north-1

# Parent
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username parent@smartcampus.com \
  --user-attributes Name=email,Value=parent@smartcampus.com Name=name,Value="Test Parent" Name=custom:schoolId,Value="SCH001" \
  --temporary-password "TempPass123!" \
  --region eu-north-1

aws cognito-idp admin-add-user-to-group \
  --user-pool-id YOUR_USER_POOL_ID \
  --username parent@smartcampus.com \
  --group-name Parent \
  --region eu-north-1
```

### Using AWS Console:

1. Go to AWS Cognito Console
2. Select your User Pool
3. Click "Users" → "Create user"
4. Enter user details and temporary password
5. Go to "Groups" and add user to appropriate group

## 🧪 Step 5: Test the Integration

1. Install dependencies:
```bash
npm install
```

2. Start the app:
```bash
npm start
```

3. Try logging in with a test user
4. Verify that AWS Cognito authentication works

## 🗄️ Step 6: Populate Initial Data

Add sample school data to DynamoDB:

```bash
# Create a sample school
aws dynamodb put-item \
  --table-name SmartCampus-Schools \
  --item '{
    "schoolId": {"S": "SCH001"},
    "name": {"S": "Demo School"},
    "address": {"S": "123 Main St"},
    "phone": {"S": "+1234567890"},
    "email": {"S": "info@demoschool.com"},
    "adminEmail": {"S": "admin@demoschool.com"},
    "adminName": {"S": "Principal Smith"},
    "status": {"S": "active"},
    "createdAt": {"S": "2025-10-14T00:00:00Z"}
  }' \
  --region eu-north-1
```

## 📊 Monitoring and Management

### View CloudFormation Stacks:
```bash
aws cloudformation list-stacks --region eu-north-1
```

### Delete All Resources (BE CAREFUL!):
```bash
aws cloudformation delete-stack --stack-name SmartCampus-DynamoDB --region eu-north-1
aws cloudformation delete-stack --stack-name SmartCampus-S3 --region eu-north-1
aws cloudformation delete-stack --stack-name SmartCampus-Cognito --region eu-north-1
```

## 🔒 Security Best Practices

1. **Enable MFA** for production Cognito users
2. **Use environment variables** for sensitive configuration
3. **Enable CloudWatch** logging for monitoring
4. **Set up AWS Backup** for DynamoDB tables
5. **Use IAM roles** with least privilege principle
6. **Enable versioning** on S3 bucket (already configured)

## 💰 Cost Optimization

- DynamoDB uses **PAY_PER_REQUEST** billing (pay only for what you use)
- Cognito offers **50,000 free MAUs** per month
- S3 charges for storage and requests - use lifecycle policies
- Consider **AWS Free Tier** limits

## 🆘 Troubleshooting

### Issue: CloudFormation deployment fails
- Check AWS CLI credentials: `aws sts get-caller-identity`
- Verify region is correct: `eu-north-1`
- Check for existing resources with same names

### Issue: Cognito user creation fails
- Verify User Pool ID is correct
- Check password meets policy requirements
- Ensure email format is valid

### Issue: DynamoDB access denied
- Check IAM role permissions
- Verify Cognito Identity Pool is configured
- Ensure user is authenticated

## 📚 Additional Resources

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS Amplify Documentation](https://docs.amplify.aws/)

## ✅ Checklist

- [ ] AWS CLI installed and configured
- [ ] CloudFormation stacks deployed
- [ ] Configuration updated in `src/aws-config.ts`
- [ ] Test users created
- [ ] Sample data populated
- [ ] App tested with AWS integration
- [ ] Security settings reviewed

## 🎉 Next Steps

Once AWS is fully set up:
1. Proceed with app store deployment
2. Configure EAS Build for Expo
3. Submit to iOS App Store and Google Play Store

---

**Need Help?** Check the troubleshooting section or create an issue in the repository.


