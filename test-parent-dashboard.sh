#!/bin/bash

echo "🔍 Testing Parent Dashboard API"
echo "================================"
echo ""

# Login and get token
echo "1️⃣  Logging in as parent..."
TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"parent@test.com","password":"parent123"}' \
  | jq -r '.data.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Login failed!"
  exit 1
fi

echo "✅ Login successful"
echo ""

# Get children list
echo "2️⃣  Getting children list..."
CHILDREN_RESPONSE=$(curl -s -X GET "http://localhost:5000/api/v1/parent/children" \
  -H "Authorization: Bearer $TOKEN")

echo "$CHILDREN_RESPONSE" | jq '{success, message, total: .data.total, children: [.data.children[] | {id, name, email, relationship}]}'
echo ""

# Get first child ID
CHILD_ID=$(echo "$CHILDREN_RESPONSE" | jq -r '.data.children[0].id // empty')

if [ -z "$CHILD_ID" ] || [ "$CHILD_ID" = "null" ]; then
  echo "❌ No children found!"
  exit 1
fi

echo "✅ Using student ID: $CHILD_ID"
echo ""

# Get dashboard
echo "3️⃣  Getting dashboard data..."
DASHBOARD_RESPONSE=$(curl -s -X GET "http://localhost:5000/api/v1/parent/dashboard/$CHILD_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "$DASHBOARD_RESPONSE" | jq '{
  success,
  message,
  student: .data.student,
  statistics: {
    attendance: .data.statistics.attendance,
    homework: .data.statistics.homework,
    marks: .data.statistics.marks
  },
  recentActivity: (.data.recentActivity | length),
  notifications: (.data.notifications | length)
}'

echo ""
echo "✅ Dashboard test complete!"
echo ""
echo "💡 To see the visual dashboard:"
echo "   1. cd SmartCampusMobile && npm start"
echo "   2. Login with: parent@test.com / parent123"
echo "   3. Dashboard appears as first tab (🏠 Home icon)"

