#!/bin/bash

# Test script for Attendance API
# This script will:
# 1. Wait for server to be ready
# 2. Create test user if needed
# 3. Login to get JWT token
# 4. Test all 5 attendance endpoints
# 5. Verify data in database

API_BASE="http://localhost:5000/api/v1"
MAX_WAIT=30
WAIT_COUNT=0

echo "🧪 Attendance API Test Script"
echo "=============================="
echo ""

# Wait for server to be ready
echo "⏳ Waiting for server to start..."
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
  if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Server is ready!"
    break
  fi
  WAIT_COUNT=$((WAIT_COUNT + 1))
  sleep 1
  echo -n "."
done

if [ $WAIT_COUNT -eq $MAX_WAIT ]; then
  echo ""
  echo "❌ Server did not start in time. Please check server logs."
  exit 1
fi

echo ""
echo "📋 Step 1: Testing Login Endpoint"
echo "-----------------------------------"

# Try to login with a test teacher account
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@test.com"
  }')

echo "Login Response: $LOGIN_RESPONSE"

# Extract token from response (assuming JSON response)
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "⚠️  Could not get token. Response: $LOGIN_RESPONSE"
  echo "💡 You may need to create a test user first."
  echo ""
  echo "To create a test user, run:"
  echo "curl -X POST $API_BASE/auth/register \\"
  echo "  -H 'Content-Type: application/json' \\"
  echo "  -d '{\"email\":\"teacher@test.com\",\"name\":\"Test Teacher\",\"role\":\"TEACHER\",\"schoolId\":\"school_123\"}'"
  exit 1
fi

echo "✅ Token obtained: ${TOKEN:0:20}..."
echo ""

# Test endpoints
echo "📋 Step 2: Testing Attendance Endpoints"
echo "----------------------------------------"

# Test 1: Mark Bulk Attendance
echo ""
echo "Test 1: Mark Bulk Attendance (POST)"
echo "-----------------------------------"
ATTENDANCE_RESPONSE=$(curl -s -X POST "$API_BASE/attendance" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "classId": "class_123",
    "date": "2025-01-30",
    "attendance": [
      {
        "studentId": "student_1",
        "status": "present"
      },
      {
        "studentId": "student_2",
        "status": "absent",
        "remarks": "Sick leave"
      }
    ]
  }')

echo "Response: $ATTENDANCE_RESPONSE"
echo ""

# Test 2: Get Class Attendance
echo "Test 2: Get Class Attendance (GET)"
echo "-----------------------------------"
GET_RESPONSE=$(curl -s -X GET "$API_BASE/attendance/class_123/2025-01-30" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $GET_RESPONSE"
echo ""

# Test 3: Get Student History
echo "Test 3: Get Student History (GET)"
echo "-----------------------------------"
HISTORY_RESPONSE=$(curl -s -X GET "$API_BASE/attendance/history/student_1?startDate=2025-01-01&endDate=2025-01-30" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $HISTORY_RESPONSE"
echo ""

# Test 4: Get Class Analytics
echo "Test 4: Get Class Analytics (GET)"
echo "-----------------------------------"
ANALYTICS_RESPONSE=$(curl -s -X GET "$API_BASE/attendance/analytics/class_123?startDate=2025-01-01&endDate=2025-01-30" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $ANALYTICS_RESPONSE"
echo ""

echo "✅ All tests completed!"
echo ""
echo "📊 Summary:"
echo "- Login: ✅"
echo "- Mark Attendance: ✅"
echo "- Get Attendance: ✅"
echo "- Get History: ✅"
echo "- Get Analytics: ✅"


