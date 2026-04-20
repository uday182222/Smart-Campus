#!/bin/bash

# Smart Campus - Create Cognito Test Users
# This script creates test users in AWS Cognito for each role

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REGION="eu-north-1"
USER_POOL_ID="eu-north-1_JrEsAN4go"  # Update this with your actual User Pool ID
TEMP_PASSWORD="SmartCampus123!"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Smart Campus - Create Cognito Users${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Function to create user
create_user() {
    local email=$1
    local name=$2
    local group=$3
    local school_id=$4
    
    echo -e "${YELLOW}📝 Creating user: ${email}${NC}"
    
    # Create user
    if [ -z "$school_id" ]; then
        # Super admin doesn't need school ID
        aws cognito-idp admin-create-user \
            --user-pool-id "${USER_POOL_ID}" \
            --username "${email}" \
            --user-attributes \
                Name=email,Value="${email}" \
                Name=name,Value="${name}" \
                Name=email_verified,Value=true \
            --message-action SUPPRESS \
            --region "${REGION}" 2>/dev/null || echo -e "${YELLOW}User may already exist${NC}"
    else
        aws cognito-idp admin-create-user \
            --user-pool-id "${USER_POOL_ID}" \
            --username "${email}" \
            --user-attributes \
                Name=email,Value="${email}" \
                Name=name,Value="${name}" \
                Name=custom:schoolId,Value="${school_id}" \
                Name=email_verified,Value=true \
            --message-action SUPPRESS \
            --region "${REGION}" 2>/dev/null || echo -e "${YELLOW}User may already exist${NC}"
    fi
    
    # Set permanent password
    aws cognito-idp admin-set-user-password \
        --user-pool-id "${USER_POOL_ID}" \
        --username "${email}" \
        --password "${TEMP_PASSWORD}" \
        --permanent \
        --region "${REGION}" 2>/dev/null || echo -e "${YELLOW}Password may already be set${NC}"
    
    # Add to group
    aws cognito-idp admin-add-user-to-group \
        --user-pool-id "${USER_POOL_ID}" \
        --username "${email}" \
        --group-name "${group}" \
        --region "${REGION}" 2>/dev/null || echo -e "${YELLOW}User may already be in group${NC}"
    
    echo -e "${GREEN}✅ User created: ${email} (Group: ${group})${NC}"
    echo ""
}

echo -e "${BLUE}Creating test users with temporary password: ${TEMP_PASSWORD}${NC}"
echo ""

# Create Super Admin
create_user "admin@smartcampus.com" "Super Admin" "SuperAdmin" ""

# Create School Admin for Lotus Public School
create_user "admin@lotuspublic.edu" "Dr. Rajesh Kumar" "SchoolAdmin" "SCH-2025-A12"

# Create School Admin for Sunrise Academy
create_user "admin@sunriseacademy.edu" "Mrs. Priya Sharma" "SchoolAdmin" "SCH-2025-B45"

# Create School Admin for Demo School
create_user "admin@school.com" "Demo Admin" "SchoolAdmin" "SCH001"

# Create Teachers
create_user "teacher@lotuspublic.edu" "Mrs. Anita Verma" "Teacher" "SCH-2025-A12"
create_user "teacher@sunriseacademy.edu" "Mr. Vikram Singh" "Teacher" "SCH-2025-B45"
create_user "teacher@school.com" "Demo Teacher" "Teacher" "SCH001"

# Create Parents
create_user "parent@lotuspublic.edu" "Mr. Amit Patel" "Parent" "SCH-2025-A12"
create_user "parent@sunriseacademy.edu" "Mrs. Neha Gupta" "Parent" "SCH-2025-B45"
create_user "parent@school.com" "Demo Parent" "Parent" "SCH001"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ All users created successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Login Credentials:${NC}"
echo ""
echo -e "${YELLOW}Super Admin:${NC}"
echo "  Email: admin@smartcampus.com"
echo "  Password: ${TEMP_PASSWORD}"
echo "  (No School ID required)"
echo ""
echo -e "${YELLOW}School Admin (Lotus Public School):${NC}"
echo "  Email: admin@lotuspublic.edu"
echo "  Password: ${TEMP_PASSWORD}"
echo "  School ID: SCH-2025-A12"
echo ""
echo -e "${YELLOW}School Admin (Sunrise Academy):${NC}"
echo "  Email: admin@sunriseacademy.edu"
echo "  Password: ${TEMP_PASSWORD}"
echo "  School ID: SCH-2025-B45"
echo ""
echo -e "${YELLOW}School Admin (Demo School):${NC}"
echo "  Email: admin@school.com"
echo "  Password: ${TEMP_PASSWORD}"
echo "  School ID: SCH001"
echo ""
echo -e "${YELLOW}Teacher (Lotus):${NC}"
echo "  Email: teacher@lotuspublic.edu"
echo "  Password: ${TEMP_PASSWORD}"
echo "  School ID: SCH-2025-A12"
echo ""
echo -e "${YELLOW}Parent (Lotus):${NC}"
echo "  Email: parent@lotuspublic.edu"
echo "  Password: ${TEMP_PASSWORD}"
echo "  School ID: SCH-2025-A12"
echo ""
echo -e "${GREEN}🎉 All set! You can now login to the app.${NC}"

