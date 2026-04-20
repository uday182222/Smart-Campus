#!/bin/bash

# Parent API Testing Script
# Tests parent dashboard endpoints

set -e

echo "🧪 Parent API Testing"
echo "====================="
echo ""

BASE_URL="http://localhost:5000/api/v1"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Login (using teacher for now, need parent user)
echo "📝 Step 1: Login"
echo "---------------"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@test.com","password":"test123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo -e "${RED}❌ Login failed${NC}"
  echo "$LOGIN_RESPONSE" | jq .
  exit 1
fi

echo -e "${GREEN}✅ Login successful${NC}"
echo "Token: ${TOKEN:0:30}..."
echo ""

# Step 2: Test GET /api/parent/children (will fail if not parent role)
echo "📝 Step 2: Test GET /api/parent/children"
echo "----------------------------------------"
CHILDREN_RESPONSE=$(curl -s -X GET "$BASE_URL/parent/children" \
  -H "Authorization: Bearer $TOKEN")

SUCCESS=$(echo "$CHILDREN_RESPONSE" | jq -r '.success // false')

if [ "$SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ Get children successful${NC}"
  CHILD_COUNT=$(echo "$CHILDREN_RESPONSE" | jq -r '.data.total // 0')
  echo "Children found: $CHILD_COUNT"
  echo "$CHILDREN_RESPONSE" | jq '.data.children[] | {id, name, email, relationship}' | head -20
else
  echo -e "${YELLOW}⚠️  Get children failed (expected if not parent role)${NC}"
  echo "$CHILDREN_RESPONSE" | jq '{success, message}' || echo "$CHILDREN_RESPONSE"
fi
echo ""

# Step 3: Test GET /api/parent/dashboard/:studentId
echo "📝 Step 3: Test GET /api/parent/dashboard/:studentId"
echo "---------------------------------------------------"
STUDENT_ID="b0466a75-65e0-42f2-9727-a8cdc5075f9a"
DASHBOARD_RESPONSE=$(curl -s -X GET "$BASE_URL/parent/dashboard/$STUDENT_ID" \
  -H "Authorization: Bearer $TOKEN")

SUCCESS=$(echo "$DASHBOARD_RESPONSE" | jq -r '.success // false')

if [ "$SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ Get dashboard successful${NC}"
  echo "$DASHBOARD_RESPONSE" | jq '{
    student: {name, email},
    statistics: {
      attendance: {totalDays, presentDays, attendancePercentage},
      homework: {total, pending, submitted},
      marks: {totalExams, averagePercentage, passed, failed}
    }
  }'
else
  echo -e "${YELLOW}⚠️  Get dashboard failed (expected if not parent role or no access)${NC}"
  echo "$DASHBOARD_RESPONSE" | jq '{success, message}' || echo "$DASHBOARD_RESPONSE"
fi
echo ""

echo "=================================="
echo "📊 TEST SUMMARY"
echo "=================================="
echo ""
echo "✅ Endpoints Created:"
echo "  - GET /api/parent/children"
echo "  - GET /api/parent/dashboard/:studentId"
echo ""
echo "✅ Services Created:"
echo "  - ParentService.getChildren()"
echo "  - ParentService.getDashboard(studentId)"
echo ""
echo "✅ Screen Updated:"
echo "  - ProductionParentDashboard.tsx"
echo ""
echo "💡 Note: Full testing requires:"
echo "  1. Create parent user in database"
echo "  2. Link parent to student via ParentStudent table"
echo "  3. Login as parent user"
echo "  4. Test endpoints with parent token"
echo ""

