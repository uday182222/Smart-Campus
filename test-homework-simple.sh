#!/bin/bash

BASE_URL="http://localhost:5000/api/v1"

echo "🧪 Testing Homework API"
echo "========================"
echo ""

# Step 1: Login
echo "1. Logging in..."
LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@test.com","password":"test123"}')

TOKEN=$(echo "$LOGIN" | jq -r '.data.token // .token // empty' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "❌ Login failed"
  echo "$LOGIN"
  exit 1
fi

echo "✅ Login successful"
echo ""

# Step 2: Create homework (no file)
echo "2. Creating homework..."
CREATE=$(curl -s -X POST "$BASE_URL/homework" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "classId": "class_123",
    "subject": "Mathematics",
    "title": "Test Homework Assignment",
    "description": "Complete exercises 1-10",
    "dueDate": "2025-02-05T23:59:59Z"
  }')

HOMEWORK_ID=$(echo "$CREATE" | jq -r '.data.id // .id // empty' 2>/dev/null)

if [ -z "$HOMEWORK_ID" ] || [ "$HOMEWORK_ID" == "null" ]; then
  echo "❌ Create failed"
  echo "$CREATE" | jq . 2>/dev/null || echo "$CREATE"
  exit 1
fi

echo "✅ Homework created: $HOMEWORK_ID"
echo ""

# Step 3: Get class homework
echo "3. Getting class homework..."
GET_CLASS=$(curl -s -X GET "$BASE_URL/homework/class_123" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Retrieved: $(echo "$GET_CLASS" | jq '.data | length' 2>/dev/null || echo 'response received') items"
echo ""

# Step 4: Create test file and upload
echo "4. Testing file upload..."
echo "Test file content" > /tmp/test-homework.pdf

UPLOAD=$(curl -s -X POST "$BASE_URL/homework" \
  -H "Authorization: Bearer $TOKEN" \
  -F "classId=class_123" \
  -F "subject=Math" \
  -F "title=Homework with File" \
  -F "description=Test with attachment" \
  -F "dueDate=2025-02-05T23:59:59Z" \
  -F "attachments=@/tmp/test-homework.pdf")

UPLOAD_ID=$(echo "$UPLOAD" | jq -r '.data.id // .id // empty' 2>/dev/null)

if [ ! -z "$UPLOAD_ID" ] && [ "$UPLOAD_ID" != "null" ]; then
  echo "✅ File upload successful: $UPLOAD_ID"
  echo "$UPLOAD" | jq '.data.attachments' 2>/dev/null || echo "Check response for attachments"
else
  echo "⚠️  Upload response:"
  echo "$UPLOAD" | jq . 2>/dev/null || echo "$UPLOAD" | head -5
fi

echo ""
echo "✅ Testing complete!"

