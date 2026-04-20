/**
 * Automated Test Script for Attendance API
 * This script will test all 5 attendance endpoints
 */

const API_BASE = 'http://localhost:5000/api/v1';
let authToken = '';

// Helper function to make API calls
async function apiCall(method, endpoint, body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

// Wait for server to be ready
async function waitForServer(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch('http://localhost:5000/health');
      if (response.ok) {
        console.log('✅ Server is ready!');
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    process.stdout.write('.');
  }
  console.log('\n❌ Server did not start in time');
  return false;
}

// Test functions
async function testLogin() {
  console.log('\n📋 Test 1: Login & Get Token');
  console.log('-----------------------------------');
  
  const result = await apiCall('POST', '/auth/login', {
    email: 'teacher@test.com',
    password: 'test123' // Password is required by validator, but not actually checked in controller
  });

  if (result.status === 200 && result.data.success) {
    authToken = result.data.data.token;
    console.log('✅ Login successful');
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
    console.log(`   User: ${result.data.data.user.name} (${result.data.data.user.role})`);
    return true;
  } else {
    console.log('❌ Login failed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
    console.log('\n💡 You may need to create a test user first.');
    return false;
  }
}

async function testMarkAttendance() {
  console.log('\n📋 Test 2: Mark Bulk Attendance (POST)');
  console.log('-----------------------------------');
  
  const result = await apiCall('POST', '/attendance', {
    classId: 'class_123',
    date: '2025-01-30',
    attendance: [
      { studentId: 'b0466a75-65e0-42f2-9727-a8cdc5075f9a', status: 'present' },
      { studentId: '10267f0c-cc5f-4b4a-8467-9e53435d4017', status: 'absent', remarks: 'Sick leave' }
    ]
  }, authToken);

  if (result.status === 200 || result.status === 201) {
    console.log('✅ Attendance marked successfully');
    console.log(`   Message: ${result.data.message}`);
    if (result.data.data?.results) {
      console.log(`   Records created/updated: ${result.data.data.results.length}`);
    }
    return true;
  } else {
    console.log('❌ Failed to mark attendance');
    console.log(`   Status: ${result.status}`);
    console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
    return false;
  }
}

async function testGetAttendance() {
  console.log('\n📋 Test 3: Get Class Attendance (GET)');
  console.log('-----------------------------------');
  
  const result = await apiCall('GET', '/attendance/class_123/2025-01-30', null, authToken);

  if (result.status === 200) {
    console.log('✅ Attendance retrieved successfully');
    if (result.data.data) {
      console.log(`   Class: ${result.data.data.className}`);
      console.log(`   Date: ${result.data.data.date}`);
      console.log(`   Total students: ${result.data.data.summary?.total || 0}`);
      console.log(`   Present: ${result.data.data.summary?.present || 0}`);
      console.log(`   Absent: ${result.data.data.summary?.absent || 0}`);
    }
    return true;
  } else {
    console.log('❌ Failed to get attendance');
    console.log(`   Status: ${result.status}`);
    console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
    return false;
  }
}

async function testGetHistory() {
  console.log('\n📋 Test 4: Get Student History (GET)');
  console.log('-----------------------------------');
  
  const result = await apiCall('GET', '/attendance/history/b0466a75-65e0-42f2-9727-a8cdc5075f9a?startDate=2025-01-01&endDate=2025-01-30', null, authToken);

  if (result.status === 200) {
    console.log('✅ History retrieved successfully');
    if (result.data.data) {
      console.log(`   Student: ${result.data.data.studentName}`);
      console.log(`   Total records: ${result.data.data.statistics?.total || 0}`);
      console.log(`   Attendance %: ${result.data.data.statistics?.attendancePercentage || 0}%`);
    }
    return true;
  } else {
    console.log('❌ Failed to get history');
    console.log(`   Status: ${result.status}`);
    console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
    return false;
  }
}

async function testGetAnalytics() {
  console.log('\n📋 Test 5: Get Class Analytics (GET)');
  console.log('-----------------------------------');
  
  const result = await apiCall('GET', '/attendance/analytics/class_123?startDate=2025-01-01&endDate=2025-01-30', null, authToken);

  if (result.status === 200) {
    console.log('✅ Analytics retrieved successfully');
    if (result.data.data) {
      console.log(`   Class: ${result.data.data.className}`);
      console.log(`   Attendance %: ${result.data.data.classStatistics?.attendancePercentage || 0}%`);
      console.log(`   Low attendance students: ${result.data.data.lowAttendanceStudents?.length || 0}`);
    }
    return true;
  } else {
    console.log('❌ Failed to get analytics');
    console.log(`   Status: ${result.status}`);
    console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 Attendance API Test Suite');
  console.log('============================\n');

  // Wait for server
  console.log('⏳ Waiting for server to start...');
  const serverReady = await waitForServer();
  if (!serverReady) {
    process.exit(1);
  }

  // Run tests
  const results = {
    login: false,
    markAttendance: false,
    getAttendance: false,
    getHistory: false,
    getAnalytics: false
  };

  results.login = await testLogin();
  if (!results.login) {
    console.log('\n⚠️  Cannot proceed without authentication token');
    process.exit(1);
  }

  results.markAttendance = await testMarkAttendance();
  results.getAttendance = await testGetAttendance();
  results.getHistory = await testGetHistory();
  results.getAnalytics = await testGetAnalytics();

  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`Login:           ${results.login ? '✅' : '❌'}`);
  console.log(`Mark Attendance: ${results.markAttendance ? '✅' : '❌'}`);
  console.log(`Get Attendance:  ${results.getAttendance ? '✅' : '❌'}`);
  console.log(`Get History:     ${results.getHistory ? '✅' : '❌'}`);
  console.log(`Get Analytics:   ${results.getAnalytics ? '✅' : '❌'}`);

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  console.log(`\n✅ Passed: ${passed}/${total}`);

  if (passed === total) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test suite error:', error);
    process.exit(1);
  });
}

module.exports = { runTests, testLogin, testMarkAttendance, testGetAttendance, testGetHistory, testGetAnalytics };

