#!/bin/bash

# Smart Campus Project Cleanup Script - SAFE FILES ONLY
# This script deletes ONLY files marked as 🟢 SAFE TO DELETE
# Run with: bash cleanup-project.sh

set -e  # Exit on error

PROJECT_ROOT="/Users/udaytomar/Developer/Smart-Campus"
cd "$PROJECT_ROOT"

echo "🧹 Smart Campus Project Cleanup - SAFE FILES ONLY"
echo "=================================================="
echo ""
echo "⚠️  WARNING: This will delete files marked as 🟢 SAFE TO DELETE"
echo "📝 Make sure you have committed your work or created a backup!"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Cleanup cancelled"
  exit 0
fi

echo ""
echo "🗑️  Starting cleanup..."
echo ""

# Counter for deleted files
DELETED=0

# Function to safely delete a file
delete_file() {
  if [ -f "$1" ] || [ -d "$1" ]; then
    rm -rf "$1"
    echo "✅ Deleted: $1"
    ((DELETED++))
  else
    echo "⚠️  Not found: $1 (skipping)"
  fi
}

# ============================================
# 🟢 SAFE TO DELETE - Duplicate Login Screens
# ============================================
echo "📋 Phase 1: Deleting duplicate login screens..."
delete_file "SmartCampusMobile/screens/LoginScreen.tsx"
delete_file "SmartCampusMobile/screens/EnhancedLoginScreen.tsx"
delete_file "SmartCampusMobile/screens/FreedomLoginScreen.tsx"
delete_file "SmartCampusMobile/screens/FreedomLoginScreenWeb.tsx"
delete_file "SmartCampusMobile/components/LoginTest.tsx"

# ============================================
# 🟢 SAFE TO DELETE - Duplicate Dashboard Screens
# ============================================
echo ""
echo "📋 Phase 2: Deleting duplicate dashboard screens..."
delete_file "SmartCampusMobile/screens/TeacherDashboard.tsx"
delete_file "SmartCampusMobile/screens/ParentDashboard.tsx"
delete_file "SmartCampusMobile/screens/AdminDashboard.tsx"
delete_file "SmartCampusMobile/screens/StudentDashboard.tsx"
delete_file "SmartCampusMobile/screens/MobileTeacherDashboard.tsx"
delete_file "SmartCampusMobile/screens/MobileParentDashboard.tsx"
delete_file "SmartCampusMobile/screens/MobileAdminDashboard.tsx"
delete_file "SmartCampusMobile/screens/EnhancedTeacherDashboard.tsx"
delete_file "SmartCampusMobile/screens/EnhancedParentDashboard.tsx"
delete_file "SmartCampusMobile/screens/EnhancedAdminDashboard.tsx"

# ============================================
# 🟢 SAFE TO DELETE - Legacy Firebase Files
# ============================================
echo ""
echo "📋 Phase 3: Deleting legacy Firebase files..."
delete_file "SmartCampusMobile/firebase.ts"

# ============================================
# 🟢 SAFE TO DELETE - Test/Demo Files
# ============================================
echo ""
echo "📋 Phase 4: Deleting test/demo files..."
delete_file "login-test.html"
delete_file "SmartCampusMobile/web-demo.html"
delete_file "test-login.js"
delete_file "test-navigation.js"
delete_file "smart-campus-react/src/App.test.tsx"

# ============================================
# 🟢 SAFE TO DELETE - Duplicate App Files
# ============================================
echo ""
echo "📋 Phase 5: Deleting duplicate App files..."
delete_file "SmartCampusMobile/App.simple.tsx"
delete_file "SmartCampusMobile/App.full.tsx"

# ============================================
# 🟢 SAFE TO DELETE - Build Artifacts
# ============================================
echo ""
echo "📋 Phase 6: Deleting build artifacts..."
delete_file "SmartCampusMobile/dist"

# ============================================
# 🟢 SAFE TO DELETE - Redundant Documentation
# ============================================
echo ""
echo "📋 Phase 7: Deleting redundant documentation..."
delete_file "ACTUAL_VS_PLANNED_STATUS.md"
delete_file "APP_IS_WORKING.md"
delete_file "ATTENDANCE_API_TEST_RESULTS.md"
delete_file "ATTENDANCE_API_TESTING_COMPLETE.md"
delete_file "COMPLETE_AWS_INTEGRATION_SUMMARY.md"
delete_file "COMPLETE_FEATURE_MATRIX.md"
delete_file "COMPLETE_IMPLEMENTATION_STATUS.md"
delete_file "COMPLETE_IMPLEMENTATION_SUMMARY.md"
delete_file "COMPLETE-IMPLEMENTATION-SUMMARY.md"
delete_file "COMPLETE_LAUNCH_GUIDE.md"
delete_file "COMPLETE_SYSTEM_STATUS.md"
delete_file "COMPLETE_TESTING_GUIDE.md"
delete_file "COMPLETE_TODO_STATUS.md"
delete_file "DAY_1_ATTENDANCE_API_COMPLETE.md"
delete_file "FINAL_BUILD_STATUS.md"
delete_file "FINAL_COMPREHENSIVE_STATUS.md"
delete_file "FINAL_PROJECT_COMPLETE.md"
delete_file "FINAL_STATUS_REPORT.md"
delete_file "HOMEWORK_API_SUMMARY.md"
delete_file "LATEST_BUILD_UPDATE.md"
delete_file "LAUNCH_NOW.md"
delete_file "PROJECT_COMPLETE_SUMMARY.md"
delete_file "PROJECT-STATUS-REPORT.md"
delete_file "ULTIMATE_FINAL_PROJECT_SUMMARY.md"
delete_file "ULTIMATE_PROJECT_STATUS.md"

# ============================================
# Update AppNavigator.tsx to remove unused imports
# ============================================
echo ""
echo "📋 Phase 8: Cleaning up AppNavigator.tsx imports..."
if [ -f "SmartCampusMobile/navigation/AppNavigator.tsx" ]; then
  # Remove unused imports (but keep file - it's needed)
  echo "⚠️  Note: AppNavigator.tsx has unused imports that should be removed manually"
  echo "   Remove lines 18-25 and 28-30 (legacy screen imports)"
fi

# ============================================
# Summary
# ============================================
echo ""
echo "✅ Cleanup Complete!"
echo "📊 Files/Folders Deleted: $DELETED"
echo ""
echo "📝 Next Steps:"
echo "   1. Manually remove unused imports from AppNavigator.tsx (lines 18-30)"
echo "   2. Review 🟡 PROBABLY SAFE files in CLEANUP_REPORT.md"
echo "   3. Check 🔴 REVIEW NEEDED files before deleting"
echo "   4. Test your app: cd SmartCampusMobile && npm start"
echo "   5. Commit changes: git add . && git commit -m 'Cleanup: Remove duplicate and unused files'"
echo ""
echo "⚠️  IMPORTANT: Update AppNavigator.tsx to remove unused screen imports!"
echo ""


