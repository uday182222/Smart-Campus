#!/bin/bash

# Day 4: State Management & Testing - Bash Test Script
# Tests Zustand stores and screen integrations

set -e

echo "🧪 Day 4: State Management Testing"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Test function
test_check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $1"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $1"
        ((FAILED++))
    fi
}

# Change to mobile directory
cd SmartCampusMobile || exit 1

echo "📦 Test 1: Zustand Installation"
echo "-------------------------------"
if npm list zustand > /dev/null 2>&1; then
    ZUSTAND_VERSION=$(npm list zustand 2>/dev/null | grep zustand | head -1 | awk '{print $2}' | tr -d '└─')
    echo -e "${GREEN}✅ PASS${NC}: Zustand installed (version: $ZUSTAND_VERSION)"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Zustand not installed"
    ((FAILED++))
fi
echo ""

echo "📁 Test 2: Store Files Exist"
echo "----------------------------"
STORES=("stores/attendanceStore.ts" "stores/homeworkStore.ts" "stores/marksStore.ts" "stores/index.ts")
for store in "${STORES[@]}"; do
    if [ -f "$store" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $store exists"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $store missing"
        ((FAILED++))
    fi
done
echo ""

echo "🔍 Test 3: Store Exports"
echo "------------------------"
if grep -q "export.*useAttendanceStore" stores/index.ts 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: useAttendanceStore exported"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: useAttendanceStore not exported"
    ((FAILED++))
fi

if grep -q "export.*useHomeworkStore" stores/index.ts 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: useHomeworkStore exported"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: useHomeworkStore not exported"
    ((FAILED++))
fi

if grep -q "export.*useMarksStore" stores/index.ts 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: useMarksStore exported"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: useMarksStore not exported"
    ((FAILED++))
fi
echo ""

echo "📝 Test 4: Store Structure (attendanceStore)"
echo "---------------------------------------------"
if grep -q "create.*zustand" stores/attendanceStore.ts 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: Uses Zustand create"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Not using Zustand create"
    ((FAILED++))
fi

if grep -q "useAttendanceStore" stores/attendanceStore.ts 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: Store hook defined"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Store hook missing"
    ((FAILED++))
fi

if grep -q "loadClasses\|loadClassAttendance\|saveAttendance" stores/attendanceStore.ts 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: Key actions present"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Key actions missing"
    ((FAILED++))
fi
echo ""

echo "📝 Test 5: Store Structure (homeworkStore)"
echo "------------------------------------------"
if grep -q "create.*zustand" stores/homeworkStore.ts 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: Uses Zustand create"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Not using Zustand create"
    ((FAILED++))
fi

if grep -q "useHomeworkStore" stores/homeworkStore.ts 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: Store hook defined"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Store hook missing"
    ((FAILED++))
fi

if grep -q "loadHomework\|createHomework\|loadSubmissions" stores/homeworkStore.ts 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: Key actions present"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Key actions missing"
    ((FAILED++))
fi
echo ""

echo "📝 Test 6: Store Structure (marksStore)"
echo "----------------------------------------"
if grep -q "create.*zustand" stores/marksStore.ts 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: Uses Zustand create"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Not using Zustand create"
    ((FAILED++))
fi

if grep -q "useMarksStore" stores/marksStore.ts 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: Store hook defined"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Store hook missing"
    ((FAILED++))
fi

if grep -q "loadExamMarks\|enterMarks\|updateMarks" stores/marksStore.ts 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: Key actions present"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Key actions missing"
    ((FAILED++))
fi
echo ""

echo "🖥️  Test 7: Screen Integration (AttendanceScreen)"
echo "-------------------------------------------------"
if grep -q "useAttendanceStore" screens/AttendanceScreen.tsx 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: Uses attendance store"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Not using attendance store"
    ((FAILED++))
fi

if grep -q "from.*stores" screens/AttendanceScreen.tsx 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: Imports from stores"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Missing store import"
    ((FAILED++))
fi

# Check that old useState for main state is removed
if ! grep -q "useState<ClassAttendance\[\]>" screens/AttendanceScreen.tsx 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: Removed local classes state"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  WARN${NC}: Still has local classes state (may be intentional)"
fi
echo ""

echo "🖥️  Test 8: Screen Integration (HomeworkScreen)"
echo "------------------------------------------------"
if grep -q "useHomeworkStore" screens/HomeworkScreen.tsx 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: Uses homework store"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Not using homework store"
    ((FAILED++))
fi

if grep -q "from.*stores" screens/HomeworkScreen.tsx 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: Imports from stores"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Missing store import"
    ((FAILED++))
fi

# Check that old useState for homework is removed
if ! grep -q "useState<Homework\[\]>" screens/HomeworkScreen.tsx 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: Removed local homework state"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  WARN${NC}: Still has local homework state (may be intentional)"
fi
echo ""

echo "🔗 Test 9: Service Integration"
echo "------------------------------"
# Check attendance store uses services
if grep -q "AWSAttendanceService\|AttendanceService" stores/attendanceStore.ts 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: Attendance store uses services"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Attendance store missing service imports"
    ((FAILED++))
fi

# Check homework store uses services
if grep -q "HomeworkService" stores/homeworkStore.ts 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: Homework store uses services"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Homework store missing service imports"
    ((FAILED++))
fi

# Check marks store uses services
if grep -q "MarksService" stores/marksStore.ts 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: Marks store uses services"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Marks store missing service imports"
    ((FAILED++))
fi
echo ""

echo "📊 Test 10: TypeScript Types"
echo "----------------------------"
# Check for TypeScript interfaces in stores
if grep -q "interface.*State" stores/attendanceStore.ts 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: Attendance store has TypeScript interface"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  WARN${NC}: Attendance store may be missing TypeScript interface"
fi

if grep -q "interface.*State" stores/homeworkStore.ts 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: Homework store has TypeScript interface"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  WARN${NC}: Homework store may be missing TypeScript interface"
fi

if grep -q "interface.*State" stores/marksStore.ts 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: Marks store has TypeScript interface"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  WARN${NC}: Marks store may be missing TypeScript interface"
fi
echo ""

echo "📦 Test 11: Package Dependencies"
echo "---------------------------------"
if grep -q "\"zustand\"" package.json 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: Zustand in package.json"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}: Zustand not in package.json"
    ((FAILED++))
fi
echo ""

echo "🔍 Test 12: Code Quality Checks"
echo "-------------------------------"
# Check for common patterns
if grep -q "async.*Promise" stores/attendanceStore.ts 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: Async actions use Promise types"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  WARN${NC}: May be missing Promise types"
fi

# Check for error handling
if grep -q "catch.*error" stores/attendanceStore.ts 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC}: Error handling present"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  WARN${NC}: May be missing error handling"
fi
echo ""

# Summary
echo "=================================="
echo "📊 TEST SUMMARY"
echo "=================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    echo ""
    echo "✅ Day 4 implementation is complete and ready!"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the errors above.${NC}"
    exit 1
fi

