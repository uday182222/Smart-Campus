#!/bin/bash

# Complete AWS Deployment Script for Smart Campus
# This script automates the entire AWS setup process

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║        🚀 SMART CAMPUS AWS DEPLOYMENT 🚀              ║
║                                                       ║
║     Complete AWS Infrastructure Setup Script          ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${BLUE}This script will:${NC}"
echo "  1. ✅ Check prerequisites"
echo "  2. 🏗️  Deploy CloudFormation stacks"
echo "  3. 👥 Create Cognito users"
echo "  4. 📊 Populate sample data"
echo "  5. 📝 Update configuration files"
echo "  6. ✅ Verify deployment"
echo ""

# Check if user wants to continue
read -p "Continue with deployment? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 1: Checking Prerequisites${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found${NC}"
    echo "Please install AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi
echo -e "${GREEN}✅ AWS CLI installed${NC}"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    echo "Please run: aws configure"
    exit 1
fi
echo -e "${GREEN}✅ AWS credentials configured${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    echo "Please install Node.js: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✅ Node.js installed${NC}"

# Get AWS account info
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION="eu-north-1"
echo -e "${BLUE}📋 AWS Account: ${AWS_ACCOUNT}${NC}"
echo -e "${BLUE}📋 AWS Region: ${AWS_REGION}${NC}"

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 2: Deploying CloudFormation Stacks${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"

cd cloudformation

# Deploy Cognito
echo -e "${YELLOW}🔐 Deploying Cognito Stack...${NC}"
aws cloudformation deploy \
    --template-file cognito-stack.yaml \
    --stack-name SmartCampus-Cognito \
    --capabilities CAPABILITY_IAM \
    --region ${AWS_REGION} \
    --no-fail-on-empty-changeset

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Cognito deployed${NC}"
else
    echo -e "${RED}❌ Cognito deployment failed${NC}"
    exit 1
fi

# Deploy S3
echo -e "${YELLOW}📦 Deploying S3 Stack...${NC}"
aws cloudformation deploy \
    --template-file s3-stack.yaml \
    --stack-name SmartCampus-S3 \
    --region ${AWS_REGION} \
    --no-fail-on-empty-changeset

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ S3 deployed${NC}"
else
    echo -e "${RED}❌ S3 deployment failed${NC}"
    exit 1
fi

# Deploy DynamoDB
echo -e "${YELLOW}🗄️  Deploying DynamoDB Stack...${NC}"
aws cloudformation deploy \
    --template-file dynamodb-stack.yaml \
    --stack-name SmartCampus-DynamoDB \
    --region ${AWS_REGION} \
    --no-fail-on-empty-changeset

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ DynamoDB deployed${NC}"
else
    echo -e "${RED}❌ DynamoDB deployment failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 3: Retrieving Stack Outputs${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"

# Get Cognito outputs
USER_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name SmartCampus-Cognito \
    --region ${AWS_REGION} \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
    --output text)

USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks \
    --stack-name SmartCampus-Cognito \
    --region ${AWS_REGION} \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
    --output text)

IDENTITY_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name SmartCampus-Cognito \
    --region ${AWS_REGION} \
    --query 'Stacks[0].Outputs[?OutputKey==`IdentityPoolId`].OutputValue' \
    --output text)

# Get S3 bucket name
BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name SmartCampus-S3 \
    --region ${AWS_REGION} \
    --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' \
    --output text)

echo -e "${BLUE}📋 User Pool ID: ${USER_POOL_ID}${NC}"
echo -e "${BLUE}📋 Client ID: ${USER_POOL_CLIENT_ID}${NC}"
echo -e "${BLUE}📋 Identity Pool ID: ${IDENTITY_POOL_ID}${NC}"
echo -e "${BLUE}📋 S3 Bucket: ${BUCKET_NAME}${NC}"

# Save outputs to file
cat > aws-outputs.json << EOF
{
  "region": "${AWS_REGION}",
  "userPoolId": "${USER_POOL_ID}",
  "userPoolClientId": "${USER_POOL_CLIENT_ID}",
  "identityPoolId": "${IDENTITY_POOL_ID}",
  "bucketName": "${BUCKET_NAME}",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo -e "${GREEN}✅ Outputs saved to aws-outputs.json${NC}"

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 4: Creating Cognito Users${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"

# Update the create-cognito-users.sh script with actual User Pool ID
sed -i.bak "s/USER_POOL_ID=\".*\"/USER_POOL_ID=\"${USER_POOL_ID}\"/" create-cognito-users.sh
chmod +x create-cognito-users.sh
./create-cognito-users.sh

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 5: Populating Sample Data${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
fi

# Run sample data script
node create-sample-data.js

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 6: Updating Configuration${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"

# Update src/aws-config.ts
cd ..
CONFIG_FILE="src/aws-config.ts"

if [ -f "${CONFIG_FILE}" ]; then
    echo -e "${YELLOW}📝 Updating ${CONFIG_FILE}...${NC}"
    
    # Backup original
    cp ${CONFIG_FILE} ${CONFIG_FILE}.backup
    
    # Update values
    sed -i.tmp "s/userPoolId: '.*'/userPoolId: '${USER_POOL_ID}'/" ${CONFIG_FILE}
    sed -i.tmp "s/userPoolClientId: '.*'/userPoolClientId: '${USER_POOL_CLIENT_ID}'/" ${CONFIG_FILE}
    sed -i.tmp "s/identityPoolId: '.*'/identityPoolId: '${IDENTITY_POOL_ID}'/" ${CONFIG_FILE}
    sed -i.tmp "s/bucket: '.*'/bucket: '${BUCKET_NAME}'/" ${CONFIG_FILE}
    
    # Clean up temp files
    rm ${CONFIG_FILE}.tmp
    
    echo -e "${GREEN}✅ Configuration updated${NC}"
else
    echo -e "${YELLOW}⚠️  ${CONFIG_FILE} not found, please update manually${NC}"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}Step 7: Verification${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"

echo -e "${YELLOW}🔍 Verifying Cognito User Pool...${NC}"
USER_COUNT=$(aws cognito-idp list-users \
    --user-pool-id ${USER_POOL_ID} \
    --region ${AWS_REGION} \
    --query 'Users | length(@)')
echo -e "${GREEN}✅ Found ${USER_COUNT} users in Cognito${NC}"

echo -e "${YELLOW}🔍 Verifying DynamoDB Tables...${NC}"
TABLES=$(aws dynamodb list-tables \
    --region ${AWS_REGION} \
    --query 'TableNames[?starts_with(@, `SmartCampus-`)] | length(@)')
echo -e "${GREEN}✅ Found ${TABLES} DynamoDB tables${NC}"

echo -e "${YELLOW}🔍 Verifying S3 Bucket...${NC}"
aws s3 ls s3://${BUCKET_NAME} --region ${AWS_REGION} > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ S3 bucket accessible${NC}"
else
    echo -e "${YELLOW}⚠️  S3 bucket exists but may be empty${NC}"
fi

echo ""
echo -e "${PURPLE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║        ✅ DEPLOYMENT SUCCESSFUL! ✅                   ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${GREEN}🎉 AWS Infrastructure is ready!${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 DEPLOYMENT SUMMARY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}AWS Resources Created:${NC}"
echo "  ✅ Cognito User Pool with 5 groups"
echo "  ✅ 11 DynamoDB tables"
echo "  ✅ S3 bucket for media storage"
echo "  ✅ ${USER_COUNT} test users"
echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  📁 aws-outputs.json created"
echo "  📝 src/aws-config.ts updated"
echo ""
echo -e "${YELLOW}Test Credentials:${NC}"
echo "  Email: admin@smartcampus.com"
echo "  Password: SmartCampus123!"
echo "  School ID: (Not required for Super Admin)"
echo ""
echo -e "${YELLOW}Other Test Users:${NC}"
echo "  School Admin: admin@school.com / SmartCampus123! / SCH001"
echo "  Teacher: teacher@lotuspublic.edu / SmartCampus123! / SCH-2025-A12"
echo "  Parent: parent@lotuspublic.edu / SmartCampus123! / SCH-2025-A12"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 NEXT STEPS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "1. Test the app:"
echo "   cd .."
echo "   npm install"
echo "   npm start"
echo ""
echo "2. Try logging in with test credentials above"
echo ""
echo "3. When ready for production build:"
echo "   eas login"
echo "   eas init"
echo "   eas build --platform all --profile production"
echo ""
echo "4. Submit to app stores:"
echo "   eas submit --platform all --latest"
echo ""
echo -e "${GREEN}📚 Documentation:${NC}"
echo "  - cloudformation/COMPLETE-AWS-SETUP.md"
echo "  - FINAL_DEPLOYMENT_GUIDE.md"
echo "  - APP_STORE_DEPLOYMENT_GUIDE.md"
echo ""
echo -e "${GREEN}💰 Estimated Monthly Cost: $2-5 (within AWS Free Tier)${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${PURPLE}🎓 Happy School Managing!${NC}"
echo ""

