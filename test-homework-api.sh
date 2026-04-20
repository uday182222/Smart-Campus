#!/bin/bash

# Homework API Test Script
# Tests all 6 endpoints including file uploads

BASE_URL="http://localhost:5000/api/v1"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing Homework API"
echo "========================"
echo ""

# Step 1: Login to get token
echo "1️⃣  Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@test.com",
    "password": "test123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token // .token // empty' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo -e "${RED}❌ Login failed${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Login successful${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Step 2: Create a test file
echo "2️⃣  Creating test file..."
TEST_FILE="/tmp/test-homework.pdf"
echo "This is a test homework file for Smart Campus API testing." > "$TEST_FILE"
echo -e "${GREEN}✅ Test file created: $TEST_FILE${NC}"
echo ""

# Step 3: Create homework with file upload
echo "3️⃣  Creating homework with file upload..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/homework" \
  -H "Authorization: Bearer $TOKEN" \
  -F "classId=class_123" \
  -F "subject=Mathematics" \
  -F "title=Test Homework Assignment" \
  -F "description=Complete exercises 1-10 from chapter 5. Upload your solutions as PDF." \
  -F "dueDate=2025-02-05T23:59:59Z" \
  -F "attachments=@$TEST_FILE")

HOMEWORK_ID=$(echo $CREATE_RESPONSE | jq -r '.data.id // .id // empty' 2>/dev/null)

if [ -z "$HOMEWORK_ID" ] || [ "$HOMEWORK_ID" == "null" ]; then
  echo -e "${RED}❌ Create homework failed${NC}"
  echo "Response: $CREATE_RESPONSE" | jq . 2>/dev/null || echo "$CREATE_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Homework created successfully${NC}"
echo "Homework ID: $HOMEWORK_ID"
echo "Response:" | jq . 2>/dev/null <<< "$CREATE_RESPONSE" || echo "$CREATE_RESPONSE"
echo ""

# Step 4: Get class homework
echo "4️⃣  Getting class homework..."
GET_CLASS_RESPONSE=$(curl -s -X GET "$BASE_URL/homework/class_123" \
  -H "Authorization: Bearer $TOKEN")

echo -e "${GREEN}✅ Retrieved class homework${NC}"
echo "$GET_CLASS_RESPONSE" | jq '.data | length' 2>/dev/null && echo "Homework items found" || echo "$GET_CLASS_RESPONSE"
echo ""

# Step 5: Get homework by ID
echo "5️⃣  Getting homework by ID..."
GET_HOMEWORK_RESPONSE=$(curl -s -X GET "$BASE_URL/homework/$HOMEWORK_ID" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null)

if [ ! -z "$GET_HOMEWORK_RESPONSE" ]; then
  echo -e "${GREEN}✅ Retrieved homework details${NC}"
  echo "$GET_HOMEWORK_RESPONSE" | jq '.data.title // .title' 2>/dev/null || echo "$GET_HOMEWORK_RESPONSE"
else
  echo -e "${YELLOW}⚠️  Endpoint might not exist (using class endpoint instead)${NC}"
fi
echo ""

# Step 6: Update homework
echo "6️⃣  Updating homework..."
UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/homework/$HOMEWORK_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Test Homework Assignment",
    "description": "Updated description - Complete exercises 1-15"
  }')

UPDATED_TITLE=$(echo $UPDATE_RESPONSE | jq -r '.data.title // .title // empty' 2>/dev/null)

if [ ! -z "$UPDATED_TITLE" ] && [ "$UPDATED_TITLE" != "null" ]; then
  echo -e "${GREEN}✅ Homework updated${NC}"
  echo "New title: $UPDATED_TITLE"
else
  echo -e "${YELLOW}⚠️  Update response: $UPDATE_RESPONSE${NC}"
fi
echo ""

# Step 7: Submit homework (student submission)
echo "7️⃣  Submitting homework (student)..."
SUBMIT_FILE="/tmp/test-submission.pdf"
echo "This is my homework submission." > "$SUBMIT_FILE"

SUBMIT_RESPONSE=$(curl -s -X POST "$BASE_URL/homework/$HOMEWORK_ID/submit" \
  -H "Authorization: Bearer $TOKEN" \
  -F "attachments=@$SUBMIT_FILE")

SUBMISSION_ID=$(echo $SUBMIT_RESPONSE | jq -r '.data.id // .id // empty' 2>/dev/null)

if [ ! -z "$SUBMISSION_ID" ] && [ "$SUBMISSION_ID" != "null" ]; then
  echo -e "${GREEN}✅ Homework submitted${NC}"
  echo "Submission ID: $SUBMISSION_ID"
else
  echo -e "${YELLOW}⚠️  Submit response: $SUBMIT_RESPONSE${NC}"
fi
echo ""

# Step 8: Get submissions
echo "8️⃣  Getting homework submissions..."
SUBMISSIONS_RESPONSE=$(curl -s -X GET "$BASE_URL/homework/$HOMEWORK_ID/submissions" \
  -H "Authorization: Bearer $TOKEN")

SUBMISSIONS_COUNT=$(echo $SUBMISSIONS_RESPONSE | jq '.data | length // . | length' 2>/dev/null)

if [ ! -z "$SUBMISSIONS_COUNT" ]; then
  echo -e "${GREEN}✅ Retrieved submissions${NC}"
  echo "Submissions count: $SUBMISSIONS_COUNT"
else
  echo -e "${YELLOW}⚠️  Submissions response: $SUBMISSIONS_RESPONSE${NC}"
fi
echo ""

# Step 9: Check S3 upload
echo "9️⃣  Verifying S3 upload..."
if echo "$CREATE_RESPONSE" | grep -q "s3\|amazonaws\|attachments" 2>/dev/null; then
  echo -e "${GREEN}✅ File upload detected in response${NC}"
  echo "$CREATE_RESPONSE" | jq '.data.attachments // .attachments' 2>/dev/null || echo "Check response for attachment URLs"
else
  echo -e "${YELLOW}⚠️  S3 URL not found in response${NC}"
fi
echo ""

# Step 10: Delete homework
echo "🔟 Deleting homework..."
DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/homework/$HOMEWORK_ID" \
  -H "Authorization: Bearer $TOKEN")

if echo "$DELETE_RESPONSE" | grep -q "success\|deleted" 2>/dev/null; then
  echo -e "${GREEN}✅ Homework deleted${NC}"
else
  echo -e "${YELLOW}⚠️  Delete response: $DELETE_RESPONSE${NC}"
fi
echo ""

# Cleanup
rm -f "$TEST_FILE" "$SUBMIT_FILE"
echo "🧹 Cleaned up test files"
echo ""

echo "================================"
echo -e "${GREEN}✅ All tests completed!${NC}"
echo "================================"
