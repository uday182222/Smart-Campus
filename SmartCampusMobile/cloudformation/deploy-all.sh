#!/bin/bash

# Smart Campus AWS Infrastructure Deployment Script
# This script deploys all CloudFormation stacks for the Smart Campus app

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REGION="eu-north-1"
STACK_PREFIX="SmartCampus"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Smart Campus AWS Infrastructure Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Function to check if AWS CLI is installed
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
        echo "Visit: https://aws.amazon.com/cli/"
        exit 1
    fi
    echo -e "${GREEN}✅ AWS CLI is installed${NC}"
}

# Function to check AWS credentials
check_aws_credentials() {
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure'${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ AWS credentials are configured${NC}"
    echo ""
}

# Function to deploy a CloudFormation stack
deploy_stack() {
    local stack_name=$1
    local template_file=$2
    
    echo -e "${YELLOW}📦 Deploying ${stack_name}...${NC}"
    
    aws cloudformation deploy \
        --template-file "${template_file}" \
        --stack-name "${stack_name}" \
        --capabilities CAPABILITY_IAM \
        --region "${REGION}" \
        --no-fail-on-empty-changeset
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${stack_name} deployed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to deploy ${stack_name}${NC}"
        exit 1
    fi
    echo ""
}

# Function to get stack outputs
get_stack_outputs() {
    local stack_name=$1
    
    echo -e "${YELLOW}📋 Getting outputs for ${stack_name}...${NC}"
    aws cloudformation describe-stacks \
        --stack-name "${stack_name}" \
        --region "${REGION}" \
        --query 'Stacks[0].Outputs' \
        --output table
    echo ""
}

# Main deployment
main() {
    echo "Starting AWS infrastructure deployment..."
    echo ""
    
    # Check prerequisites
    check_aws_cli
    check_aws_credentials
    
    # Deploy stacks in order
    echo -e "${YELLOW}Step 1: Deploying Cognito Stack...${NC}"
    deploy_stack "${STACK_PREFIX}-Cognito" "cognito-stack.yaml"
    
    echo -e "${YELLOW}Step 2: Deploying S3 Stack...${NC}"
    deploy_stack "${STACK_PREFIX}-S3" "s3-stack.yaml"
    
    echo -e "${YELLOW}Step 3: Deploying DynamoDB Stack...${NC}"
    deploy_stack "${STACK_PREFIX}-DynamoDB" "dynamodb-stack.yaml"
    
    # Display all outputs
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Deployment Complete! 🎉${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    
    echo -e "${YELLOW}📋 Stack Outputs:${NC}"
    echo ""
    
    echo -e "${YELLOW}Cognito Stack Outputs:${NC}"
    get_stack_outputs "${STACK_PREFIX}-Cognito"
    
    echo -e "${YELLOW}S3 Stack Outputs:${NC}"
    get_stack_outputs "${STACK_PREFIX}-S3"
    
    echo -e "${YELLOW}DynamoDB Stack Outputs:${NC}"
    get_stack_outputs "${STACK_PREFIX}-DynamoDB"
    
    # Save outputs to a file
    echo -e "${YELLOW}💾 Saving outputs to aws-outputs.json...${NC}"
    
    cat > aws-outputs.json << EOF
{
  "cognito": $(aws cloudformation describe-stacks --stack-name "${STACK_PREFIX}-Cognito" --region "${REGION}" --query 'Stacks[0].Outputs' --output json),
  "s3": $(aws cloudformation describe-stacks --stack-name "${STACK_PREFIX}-S3" --region "${REGION}" --query 'Stacks[0].Outputs' --output json),
  "dynamodb": $(aws cloudformation describe-stacks --stack-name "${STACK_PREFIX}-DynamoDB" --region "${REGION}" --query 'Stacks[0].Outputs' --output json)
}
EOF
    
    echo -e "${GREEN}✅ Outputs saved to aws-outputs.json${NC}"
    echo ""
    
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Next Steps:${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo "1. Copy the output values to src/aws-config.ts"
    echo "2. Update the Identity Pool ID if created"
    echo "3. Test the AWS integration in your app"
    echo ""
    echo -e "${GREEN}🚀 Your AWS infrastructure is ready!${NC}"
}

# Run main function
main


