#!/bin/bash

echo "🚀 Deploying Smart Campus to AWS..."

# Set variables
PROJECT_NAME="smart-campus"
REGION="us-east-1"
STACK_NAME="smart-campus-backend"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if Amplify CLI is installed
if ! command -v amplify &> /dev/null; then
    echo "❌ Amplify CLI is not installed. Please install it first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Initialize Amplify project
echo "📦 Initializing Amplify project..."
amplify init --yes --name $PROJECT_NAME --environment dev --region $REGION

# Add authentication
echo "🔐 Adding authentication..."
amplify add auth --yes

# Add API Gateway
echo "🌐 Adding API Gateway..."
amplify add api --yes

# Add storage
echo "💾 Adding S3 storage..."
amplify add storage --yes

# Add Lambda functions
echo "⚡ Adding Lambda functions..."
amplify add function --yes

# Create DynamoDB tables
echo "🗄️ Creating DynamoDB tables..."
aws dynamodb create-table --cli-input-json file://aws-config/dynamodb-schemas/users.json
aws dynamodb create-table --cli-input-json file://aws-config/dynamodb-schemas/transport-routes.json
aws dynamodb create-table --cli-input-json file://aws-config/dynamodb-schemas/fee-structures.json

# Deploy the backend
echo "🚀 Deploying backend..."
amplify push --yes

# Get deployment outputs
echo "📋 Getting deployment outputs..."
amplify status

# Create SNS topics for notifications
echo "📱 Creating SNS topics..."
aws sns create-topic --name "smart-campus-transport-updates" --region $REGION
aws sns create-topic --name "smart-campus-fee-reminders" --region $REGION
aws sns create-topic --name "smart-campus-announcements" --region $REGION

# Set up CloudWatch alarms
echo "📊 Setting up monitoring..."
aws cloudwatch put-metric-alarm \
    --alarm-name "smart-campus-high-cpu" \
    --alarm-description "High CPU utilization" \
    --metric-name CPUUtilization \
    --namespace AWS/EC2 \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update your Flutter app with the new AWS configuration"
echo "2. Test the authentication flow"
echo "3. Verify DynamoDB tables are created"
echo "4. Test Lambda functions"
echo "5. Configure push notifications"
echo ""
echo "🔗 Useful links:"
echo "- AWS Console: https://console.aws.amazon.com/"
echo "- Amplify Console: https://console.aws.amazon.com/amplify/"
echo "- DynamoDB Console: https://console.aws.amazon.com/dynamodb/"
