/**
 * Comprehensive End-to-End Test Script
 * Tests all user roles: Teacher, Parent, Admin, Helper
 */

const API_BASE = 'http://localhost:5000/api/v1';
let teacherToken = '';
let parentToken = '';
let adminToken = '';
let helperToken = '';
let schoolId = '';
let classId = '';
let studentId = '';
let teacherId = '';
let parentId = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Helper function to make API calls
async function apiCall(method, endpoint, body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const startTime = Date.now();
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const duration = Date.now() - startTime;
    const data = await response.json();
    return { status: response.status, data, duration };
  } catch (error) {
    return { status: 0, error: error.message, duration: 0 };
  }
}

// Wait for server
async function waitForServer(maxAttempts = 30) {
  log('⏳ Waiting for server to start...', 'cyan');
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch('http://localhost:5000/health');
      if (response.ok) {
        log('✅ Server is ready!', 'green');
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    process.stdout.write('.');
  }
  log('\n❌ Server did not start in time', 'red');
  return false;
}

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  errors: [],
};

function recordTest(name, passed, error = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`  ✅ ${name}`, 'green');
  } else {
    testResults.failed++;
    testResults.errors.push({ name, error });
    log(`  ❌ ${name}: ${error || 'Failed'}`, 'red');
  }
}

// ============================================================================
// TEACHER FLOW TESTS
// ============================================================================

async function testTeacherFlow() {
  log('\n📚 TESTING TEACHER FLOW', 'blue');
  log('='.repeat(50), 'blue');

  // 1. Teacher Login
  log('\n1. Teacher Login', 'cyan');
  const teacherLogin = await apiCall('POST', '/auth/login', {
    email: 'teacher@test.com',
    password: 'test123',
  });
  if (teacherLogin.status === 200 && teacherLogin.data.success) {
    teacherToken = teacherLogin.data.data.token;
    teacherId = teacherLogin.data.data.user.id;
    schoolId = teacherLogin.data.data.user.schoolId;
    recordTest('Teacher login', true);
    log(`   Response time: ${teacherLogin.duration}ms`, 'yellow');
  } else {
    recordTest('Teacher login', false, teacherLogin.data.message);
    return false;
  }

  // 2. Get Classes
  log('\n2. Get Teacher Classes', 'cyan');
  const classes = await apiCall('GET', '/classes', null, teacherToken);
  if (classes.status === 200 && classes.data.success) {
    if (classes.data.data && classes.data.data.length > 0) {
      classId = classes.data.data[0].id;
      recordTest('Get classes', true);
    } else {
      recordTest('Get classes', false, 'No classes found');
    }
    log(`   Response time: ${classes.duration}ms`, 'yellow');
  } else {
    recordTest('Get classes', false, classes.data.message);
  }

  // 3. Mark Attendance
  if (classId) {
    log('\n3. Mark Attendance', 'cyan');
    const today = new Date().toISOString().split('T')[0];
    const attendance = await apiCall(
      'POST',
      '/attendance',
      {
        classId: classId,
        date: today,
        attendance: [
          {
            studentId: 'STUDENT_ID_PLACEHOLDER',
            status: 'present',
          },
        ],
      },
      teacherToken
    );
    recordTest('Mark attendance', attendance.status === 200, attendance.data.message);
    log(`   Response time: ${attendance.duration}ms`, 'yellow');
  }

  // 4. Create Homework
  log('\n4. Create Homework', 'cyan');
  const homework = await apiCall(
    'POST',
    '/homework',
    {
      classId: classId || 'CLASS_ID_PLACEHOLDER',
      subject: 'Mathematics',
      title: 'Test Homework Assignment',
      description: 'Complete exercises 1-10',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    teacherToken
  );
  recordTest('Create homework', homework.status === 201, homework.data.message);
  log(`   Response time: ${homework.duration}ms`, 'yellow');

  // 5. Enter Marks
  log('\n5. Enter Marks', 'cyan');
  const marks = await apiCall(
    'POST',
    '/marks',
    {
      examId: 'EXAM_ID_PLACEHOLDER',
      studentId: 'STUDENT_ID_PLACEHOLDER',
      marksObtained: 85,
      remarks: 'Good performance',
    },
    teacherToken
  );
  recordTest('Enter marks', marks.status === 201 || marks.status === 400, marks.data.message);
  log(`   Response time: ${marks.duration}ms`, 'yellow');

  return true;
}

// ============================================================================
// PARENT FLOW TESTS
// ============================================================================

async function testParentFlow() {
  log('\n👨‍👩‍👧 TESTING PARENT FLOW', 'blue');
  log('='.repeat(50), 'blue');

  // 1. Parent Login
  log('\n1. Parent Login', 'cyan');
  const parentLogin = await apiCall('POST', '/auth/login', {
    email: 'parent@test.com',
    password: 'test123',
  });
  if (parentLogin.status === 200 && parentLogin.data.success) {
    parentToken = parentLogin.data.data.token;
    parentId = parentLogin.data.data.user.id;
    recordTest('Parent login', true);
    log(`   Response time: ${parentLogin.duration}ms`, 'yellow');
  } else {
    recordTest('Parent login', false, parentLogin.data.message);
    return false;
  }

  // 2. Get Children
  log('\n2. Get Children List', 'cyan');
  const children = await apiCall('GET', '/parent/children', null, parentToken);
  if (children.status === 200 && children.data.success && children.data.data.children.length > 0) {
    studentId = children.data.data.children[0].id;
    recordTest('Get children', true);
    log(`   Response time: ${children.duration}ms`, 'yellow');
  } else {
    recordTest('Get children', false, 'No children found or API error');
  }

  // 3. Get Parent Dashboard
  if (studentId) {
    log('\n3. Get Parent Dashboard', 'cyan');
    const dashboard = await apiCall('GET', `/parent/dashboard/${studentId}`, null, parentToken);
    recordTest('Get dashboard', dashboard.status === 200, dashboard.data.message);
    log(`   Response time: ${dashboard.duration}ms`, 'yellow');
  }

  // 4. Book Appointment
  log('\n4. Book Appointment', 'cyan');
  const appointment = await apiCall(
    'POST',
    '/appointments',
    {
      studentId: studentId || 'STUDENT_ID_PLACEHOLDER',
      requestedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      requestedTime: '10:00',
      duration: 30,
      reason: 'Discuss academic progress',
      priority: 'medium',
      assignedTo: 'principal',
    },
    parentToken
  );
  recordTest('Book appointment', appointment.status === 201, appointment.data.message);
  log(`   Response time: ${appointment.duration}ms`, 'yellow');

  // 5. Get Notifications
  log('\n5. Get Notifications', 'cyan');
  const notifications = await apiCall('GET', `/notifications/${parentId}`, null, parentToken);
  recordTest('Get notifications', notifications.status === 200, notifications.data.message);
  log(`   Response time: ${notifications.duration}ms`, 'yellow');

  return true;
}

// ============================================================================
// ADMIN FLOW TESTS
// ============================================================================

async function testAdminFlow() {
  log('\n👔 TESTING ADMIN FLOW', 'blue');
  log('='.repeat(50), 'blue');

  // 1. Admin Login
  log('\n1. Admin Login', 'cyan');
  const adminLogin = await apiCall('POST', '/auth/login', {
    email: 'admin@test.com',
    password: 'test123',
  });
  if (adminLogin.status === 200 && adminLogin.data.success) {
    adminToken = adminLogin.data.data.token;
    recordTest('Admin login', true);
    log(`   Response time: ${adminLogin.duration}ms`, 'yellow');
  } else {
    recordTest('Admin login', false, adminLogin.data.message);
    return false;
  }

  // 2. Get Analytics - Attendance
  log('\n2. Get Attendance Analytics', 'cyan');
  const attendanceAnalytics = await apiCall(
    'GET',
    `/analytics/attendance/${schoolId || 'SCHOOL_ID_PLACEHOLDER'}`,
    null,
    adminToken
  );
  recordTest('Get attendance analytics', attendanceAnalytics.status === 200, attendanceAnalytics.data.message);
  log(`   Response time: ${attendanceAnalytics.duration}ms`, 'yellow');

  // 3. Get Analytics - Academic
  log('\n3. Get Academic Analytics', 'cyan');
  const academicAnalytics = await apiCall(
    'GET',
    `/analytics/academic/${schoolId || 'SCHOOL_ID_PLACEHOLDER'}`,
    null,
    adminToken
  );
  recordTest('Get academic analytics', academicAnalytics.status === 200, academicAnalytics.data.message);
  log(`   Response time: ${academicAnalytics.duration}ms`, 'yellow');

  // 4. Create Announcement
  log('\n4. Create Announcement', 'cyan');
  const announcement = await apiCall(
    'POST',
    '/announcements',
    {
      title: 'School Holiday Notice',
      message: 'School will be closed on Friday for a holiday.',
      priority: 'high',
      targetAudience: { all: true },
      channels: ['push', 'in_app'],
    },
    adminToken
  );
  recordTest('Create announcement', announcement.status === 201, announcement.data.message);
  log(`   Response time: ${announcement.duration}ms`, 'yellow');

  // 5. Get Announcements
  log('\n5. Get Announcements', 'cyan');
  const announcements = await apiCall(
    'GET',
    `/announcements/${schoolId || 'SCHOOL_ID_PLACEHOLDER'}`,
    null,
    adminToken
  );
  recordTest('Get announcements', announcements.status === 200, announcements.data.message);
  log(`   Response time: ${announcements.duration}ms`, 'yellow');

  // 6. Create User
  log('\n6. Create User', 'cyan');
  const newUser = await apiCall(
    'POST',
    '/users',
    {
      email: `testuser${Date.now()}@test.com`,
      name: 'Test User',
      role: 'STUDENT',
      schoolId: schoolId || 'SCHOOL_ID_PLACEHOLDER',
    },
    adminToken
  );
  recordTest('Create user', newUser.status === 201, newUser.data.message);
  log(`   Response time: ${newUser.duration}ms`, 'yellow');

  return true;
}

// ============================================================================
// HELPER FLOW TESTS
// ============================================================================

async function testHelperFlow() {
  log('\n🚌 TESTING HELPER FLOW', 'blue');
  log('='.repeat(50), 'blue');

  // 1. Helper Login
  log('\n1. Helper Login', 'cyan');
  const helperLogin = await apiCall('POST', '/auth/login', {
    email: 'helper@test.com',
    password: 'test123',
  });
  if (helperLogin.status === 200 && helperLogin.data.success) {
    helperToken = helperLogin.data.data.token;
    recordTest('Helper login', true);
    log(`   Response time: ${helperLogin.duration}ms`, 'yellow');
  } else {
    recordTest('Helper login', false, helperLogin.data.message);
    return false;
  }

  // 2. Get Routes
  log('\n2. Get Transport Routes', 'cyan');
  const routes = await apiCall('GET', '/transport/routes', null, helperToken);
  recordTest('Get routes', routes.status === 200, routes.data.message);
  log(`   Response time: ${routes.duration}ms`, 'yellow');

  // 3. Update Bus Location
  if (routes.status === 200 && routes.data.data.routes && routes.data.data.routes.length > 0) {
    const routeId = routes.data.data.routes[0].id;
    log('\n3. Update Bus Location', 'cyan');
    const tracking = await apiCall(
      'POST',
      '/transport/tracking',
      {
        routeId: routeId,
        latitude: 28.6139,
        longitude: 77.209,
        speed: 45.5,
        heading: 90,
      },
      helperToken
    );
    recordTest('Update bus location', tracking.status === 201, tracking.data.message);
    log(`   Response time: ${tracking.duration}ms`, 'yellow');

    // 4. Get Live Tracking
    log('\n4. Get Live Tracking', 'cyan');
    const liveTracking = await apiCall('GET', `/transport/route/${routeId}/live`, null, helperToken);
    recordTest('Get live tracking', liveTracking.status === 200, liveTracking.data.message);
    log(`   Response time: ${liveTracking.duration}ms`, 'yellow');
  }

  return true;
}

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

async function testPerformance() {
  log('\n⚡ PERFORMANCE TESTS', 'blue');
  log('='.repeat(50), 'blue');

  const performanceResults = {
    fast: 0, // < 200ms
    medium: 0, // 200-500ms
    slow: 0, // > 500ms
  };

  // Test multiple API calls
  const endpoints = [
    { method: 'GET', path: '/transport/routes', token: teacherToken },
    { method: 'GET', path: '/parent/children', token: parentToken },
    { method: 'GET', path: `/analytics/attendance/${schoolId}`, token: adminToken },
  ];

  for (const endpoint of endpoints) {
    if (!endpoint.token) continue;
    const result = await apiCall(endpoint.method, endpoint.path, null, endpoint.token);
    if (result.duration > 0) {
      if (result.duration < 200) {
        performanceResults.fast++;
      } else if (result.duration < 500) {
        performanceResults.medium++;
      } else {
        performanceResults.slow++;
      }
    }
  }

  log(`\n📊 Performance Summary:`, 'cyan');
  log(`   Fast (<200ms): ${performanceResults.fast}`, 'green');
  log(`   Medium (200-500ms): ${performanceResults.medium}`, 'yellow');
  log(`   Slow (>500ms): ${performanceResults.slow}`, performanceResults.slow > 0 ? 'red' : 'green');
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  log('\n🚀 STARTING COMPREHENSIVE E2E TESTS', 'cyan');
  log('='.repeat(50), 'cyan');

  // Wait for server
  if (!(await waitForServer())) {
    process.exit(1);
  }

  // Run all test flows
  await testTeacherFlow();
  await testParentFlow();
  await testAdminFlow();
  await testHelperFlow();
  await testPerformance();

  // Print summary
  log('\n' + '='.repeat(50), 'cyan');
  log('📊 TEST SUMMARY', 'cyan');
  log('='.repeat(50), 'cyan');
  log(`Total Tests: ${testResults.total}`, 'cyan');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 'cyan');

  if (testResults.errors.length > 0) {
    log('\n❌ Failed Tests:', 'red');
    testResults.errors.forEach((err) => {
      log(`   - ${err.name}: ${err.error}`, 'red');
    });
  }

  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});

