# Smart Campus Mobile - Test Suite

## Overview

Comprehensive test suite for the Smart Campus mobile application covering integration tests and E2E tests.

## Test Structure

```
tests/
├── setup.ts                          # Global test setup and mocks
├── factories/
│   └── mockData.ts                   # Mock data factories
├── integration/
│   ├── teacher-flow.test.ts          # Teacher workflow tests
│   ├── parent-flow.test.ts           # Parent workflow tests
│   └── admin-flow.test.ts            # Admin workflow tests
├── e2e/
│   └── critical-paths.test.ts        # Critical path E2E tests
└── jest.config.js                    # Jest configuration
```

## Setup

### Install Dependencies

```bash
npm install --save-dev @testing-library/react-native @testing-library/jest-native jest-expo
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run integration tests only
npm run test:integration

# Run E2E tests only
npm run test:e2e

# Run with coverage
npm run test:coverage
```

## Test Categories

### Integration Tests

Test complete user workflows with mocked API responses:

#### 1. Teacher Flow (`teacher-flow.test.ts`)
- ✅ Login as teacher
- ✅ Mark attendance (single & bulk)
- ✅ Create homework assignments
- ✅ Enter marks for students
- ✅ Update existing records

**Test Coverage:**
- Login and authentication
- Attendance marking (28 tests)
- Homework creation and updates
- Marks entry and validation
- Complete teacher daily workflow

#### 2. Parent Flow (`parent-flow.test.ts`)
- ✅ Login as parent
- ✅ View children list
- ✅ View child dashboard
- ✅ Check attendance history
- ✅ View homework assignments
- ✅ Track transport/bus location

**Test Coverage:**
- Parent authentication
- Children management
- Dashboard data fetching
- Attendance monitoring
- Transport tracking
- Complete parent monitoring workflow

#### 3. Admin Flow (`admin-flow.test.ts`)
- ✅ Login as admin
- ✅ Create users (Teacher, Parent, Student, Staff)
- ✅ Bulk import users from CSV
- ✅ View dashboard analytics
- ✅ Manage users (update, deactivate, reset password)
- ✅ Send announcements

**Test Coverage:**
- Admin authentication
- User creation and management
- Bulk user import
- Analytics fetching
- Announcement system
- Complete admin setup workflow

### E2E Tests (`critical-paths.test.ts`)

Test critical user journeys end-to-end:

#### Critical Paths Tested:
1. **Teacher Daily Workflow**: Login → Mark attendance → Assign homework
2. **Parent Monitoring**: Login → Select child → View dashboard → Track bus
3. **Admin Setup**: Login → Create users → Send welcome announcement
4. **Real-time Transport**: Helper updates location → Parent sees live tracking
5. **Academic Performance**: Homework assigned → Submitted → Marks entered → Parent notified
6. **Emergency Notification**: Admin sends emergency → All users receive

#### Additional Test Scenarios:
- **Performance Tests**: Workflow completion time, bulk operations
- **Error Recovery**: Network errors, session timeout, retry logic
- **Data Consistency**: Real-time data sync across screens
- **Offline Mode**: Queue actions, sync when back online
- **Security Tests**: Unauthorized access, cross-school data protection

## Mock Data

### Available Mock Data

The `tests/factories/mockData.ts` file provides:

- `mockUser` - Teacher, Parent, Admin, Student users
- `mockAuthResponse` - Authentication responses
- `mockClass` - Class data
- `mockStudents` - Student records
- `mockAttendance` - Attendance records
- `mockHomework` - Homework assignments
- `mockMarks` - Marks/grades
- `mockParentDashboard` - Complete parent dashboard data
- `mockAdminAnalytics` - Admin analytics data
- `mockTransportRoute` - Transport route data
- `mockNotification` - Notification records
- `mockEvent` - Calendar events
- `mockGalleryItem` - Gallery items

### Factory Functions

Use factory functions to create custom test data:

```typescript
import { createMockStudent, createMockAttendance } from '../factories/mockData';

const customStudent = createMockStudent({ name: 'Custom Name', rollNumber: '999' });
const customAttendance = createMockAttendance({ status: 'absent', date: new Date() });
```

## API Client Mocking

All tests mock the `apiClient` service:

```typescript
import apiClient from '../../services/apiClient';

jest.mock('../../services/apiClient');

// Mock a successful response
(apiClient.get as jest.Mock).mockResolvedValueOnce({
  success: true,
  data: { ... }
});

// Mock an error response
(apiClient.post as jest.Mock).mockRejectedValueOnce({
  message: 'Error message',
  statusCode: 400,
});
```

## Test Patterns

### Standard Test Pattern

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should perform action successfully', async () => {
    // Arrange
    (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    // Act
    const result = await apiClient.post('/endpoint', data);

    // Assert
    expect(result.success).toBe(true);
    expect(apiClient.post).toHaveBeenCalledWith('/endpoint', data);
  });
});
```

### Workflow Test Pattern

```typescript
it('should complete full workflow', async () => {
  // Step 1: Login
  (apiClient.post as jest.Mock).mockResolvedValueOnce(mockAuthResponse);
  const login = await apiClient.post('/auth/login', credentials);
  expect(login.success).toBe(true);

  // Step 2: Perform action
  (apiClient.post as jest.Mock).mockResolvedValueOnce(mockActionResponse);
  const action = await apiClient.post('/action', data);
  expect(action.success).toBe(true);

  // Verify all calls made
  expect(apiClient.post).toHaveBeenCalledTimes(2);
});
```

## Coverage Goals

- **Services**: 80%+ coverage
- **Components**: 70%+ coverage
- **Screens**: 60%+ coverage
- **Overall**: 60%+ coverage

Run `npm run test:coverage` to generate coverage report.

## Continuous Integration

Add to your CI/CD pipeline:

```yaml
# .github/workflows/test.yml
name: Run Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## Future Enhancements

### E2E Testing with Detox

For real E2E testing on devices/simulators:

```bash
# Install Detox
npm install --save-dev detox detox-expo-helpers

# Configure Detox in package.json
"detox": {
  "configurations": {
    "ios.sim.debug": {
      "device": { "type": "iPhone 15 Pro" },
      "app": "ios.debug"
    }
  }
}

# Run Detox tests
npm run test:e2e
```

### Visual Regression Testing

Add visual regression tests with `jest-image-snapshot`:

```bash
npm install --save-dev jest-image-snapshot
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `beforeEach` to reset mocks
3. **Meaningful Names**: Test names should describe what they verify
4. **Arrange-Act-Assert**: Follow AAA pattern
5. **Mock External Dependencies**: Mock all API calls and external services
6. **Test Edge Cases**: Include error scenarios and validation tests
7. **Performance**: Keep tests fast (< 100ms per test)

## Troubleshooting

### Common Issues

**Issue**: Tests timing out
```bash
# Increase timeout in jest.config.js
testTimeout: 10000 // 10 seconds
```

**Issue**: Module not found errors
```bash
# Add to jest.config.js transformIgnorePatterns
transformIgnorePatterns: ['node_modules/(?!(your-module)/)']
```

**Issue**: Async warnings
```bash
# Ensure all async operations are awaited
await waitFor(() => expect(element).toBeDefined());
```

## Resources

- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Jest Documentation](https://jestjs.io/)
- [Detox Documentation](https://wix.github.io/Detox/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

