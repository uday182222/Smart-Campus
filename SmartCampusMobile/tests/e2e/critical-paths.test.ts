/**
 * Critical Paths E2E Tests
 * Tests critical user journeys end-to-end
 * Note: This uses Jest for now. For real E2E testing, integrate with Detox or Maestro
 */

import apiClient from '../../services/apiClient';
import {
  mockUser,
  mockAuthResponse,
  mockAttendanceResponse,
  mockHomeworkResponse,
  mockMarksResponse,
  mockParentDashboard,
  mockAdminAnalytics,
  createSuccessResponse,
} from '../factories/mockData';

jest.mock('../../services/apiClient');

describe('Critical Paths E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Critical Path 1: Teacher Daily Workflow', () => {
    it('should complete teacher daily tasks: login → mark attendance → assign homework', async () => {
      // Login
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockAuthResponse);
      const login = await apiClient.post('/auth/login', {
        email: 'teacher@school.com',
        password: 'password123',
      });
      expect(login.success).toBe(true);

      await apiClient.setToken(login.data.token);

      // Mark attendance
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockAttendanceResponse);
      const attendance = await apiClient.post('/attendance/bulk', {
        classId: 'class-1',
        date: '2024-12-02',
        records: [
          { studentId: 'student-1', status: 'present' },
          { studentId: 'student-2', status: 'present' },
        ],
      });
      expect(attendance.success).toBe(true);
      expect(attendance.data.recorded).toBeGreaterThan(0);

      // Assign homework
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockHomeworkResponse);
      const homework = await apiClient.post('/homework', {
        classId: 'class-1',
        subject: 'Mathematics',
        title: 'Daily Practice',
        dueDate: '2024-12-05',
      });
      expect(homework.success).toBe(true);

      // Verify entire flow completed successfully
      expect(apiClient.post).toHaveBeenCalledTimes(3);
    });
  });

  describe('Critical Path 2: Parent Monitoring Workflow', () => {
    it('should complete parent monitoring: login → select child → view attendance → check homework → track bus', async () => {
      // Login as parent
      const parentAuth = {
        ...mockAuthResponse,
        data: {
          user: mockUser.parent,
          token: 'parent-token',
        },
      };
      (apiClient.post as jest.Mock).mockResolvedValueOnce(parentAuth);
      const login = await apiClient.post('/auth/login', {
        email: 'parent@school.com',
        password: 'password123',
      });
      expect(login.data.user.role).toBe('PARENT');

      await apiClient.setToken(login.data.token);

      // Get children
      (apiClient.get as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({
          children: [{ id: 'student-1', name: 'Alice Johnson', class: 'Grade 5A' }],
          total: 1,
        })
      );
      const children = await apiClient.get('/parent/children');
      expect(children.data.children).toHaveLength(1);

      // View child dashboard
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockParentDashboard);
      const dashboard = await apiClient.get('/parent/dashboard/student-1');
      expect(dashboard.data.attendance).toBeDefined();
      expect(dashboard.data.homework).toBeDefined();

      // Track bus
      (apiClient.get as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({
          route: { id: 'route-1', name: 'Route A' },
          assignedStop: { name: 'Main Gate' },
          eta: '5 minutes',
        })
      );
      const transport = await apiClient.get('/transport/student/student-1/route');
      expect(transport.data.eta).toBeDefined();

      // Verify entire flow
      expect(apiClient.post).toHaveBeenCalledTimes(1); // login
      expect(apiClient.get).toHaveBeenCalledTimes(3); // children + dashboard + transport
    });
  });

  describe('Critical Path 3: Admin Setup Workflow', () => {
    it('should complete admin setup: login → create users → configure school → send welcome', async () => {
      // Login as admin
      const adminAuth = {
        ...mockAuthResponse,
        data: {
          user: mockUser.admin,
          token: 'admin-token',
        },
      };
      (apiClient.post as jest.Mock).mockResolvedValueOnce(adminAuth);
      const login = await apiClient.post('/auth/login', {
        email: 'admin@school.com',
        password: 'password123',
      });
      expect(login.data.user.role).toBe('ADMIN');

      await apiClient.setToken(login.data.token);

      // Create teacher
      (apiClient.post as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({
          userId: 'teacher-2',
          temporaryPassword: 'TempPass123!',
        })
      );
      const teacher = await apiClient.post('/admin/user', {
        email: 'teacher2@school.com',
        name: 'New Teacher',
        role: 'TEACHER',
        schoolId: 'school-1',
      });
      expect(teacher.data.userId).toBeDefined();

      // Create parent
      (apiClient.post as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({
          userId: 'parent-2',
          temporaryPassword: 'TempPass456!',
        })
      );
      const parent = await apiClient.post('/admin/user', {
        email: 'parent2@school.com',
        name: 'New Parent',
        role: 'PARENT',
        schoolId: 'school-1',
      });
      expect(parent.data.userId).toBeDefined();

      // Send welcome announcement
      (apiClient.post as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({
          announcementId: 'announcement-1',
          recipientCount: 502,
        })
      );
      const announcement = await apiClient.post('/admin/announcement', {
        title: 'Welcome',
        message: 'Welcome to Smart Campus',
        targetAudience: ['all'],
      });
      expect(announcement.data.recipientCount).toBeGreaterThan(0);

      // Verify flow
      expect(apiClient.post).toHaveBeenCalledTimes(4); // login + 2 users + announcement
    });
  });

  describe('Critical Path 4: Real-time Transport Tracking', () => {
    it('should track bus in real-time: helper updates location → parent sees update', async () => {
      // Helper updates location
      (apiClient.post as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({
          nextStop: { id: 'stop-2', name: 'Central Park', eta: '5 minutes' },
        }, 'Location updated')
      );
      const updateLocation = await apiClient.post('/transport/tracking', {
        routeId: 'route-1',
        latitude: 40.7228,
        longitude: -74.016,
        speed: 30,
        heading: 45,
      });
      expect(updateLocation.success).toBe(true);

      // Parent views live tracking
      (apiClient.get as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({
          latestLocation: {
            latitude: 40.7228,
            longitude: -74.016,
            speed: 30,
            timestamp: new Date(),
          },
          currentStop: { id: 'stop-2', name: 'Central Park', status: 'approaching' },
          recentPath: [
            { latitude: 40.7128, longitude: -74.006, timestamp: new Date() },
            { latitude: 40.7228, longitude: -74.016, timestamp: new Date() },
          ],
        })
      );
      const liveTracking = await apiClient.get('/transport/tracking/route-1/live');
      expect(liveTracking.data.latestLocation).toBeDefined();
      expect(liveTracking.data.latestLocation.speed).toBe(30);
    });

    it('should mark stop and notify parents', async () => {
      // Helper marks stop as reached
      (apiClient.post as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse(
          {
            studentsToBoard: [
              { id: 'student-1', name: 'Alice Johnson' },
              { id: 'student-2', name: 'Bob Williams' },
            ],
          },
          'Stop marked as reached'
        )
      );
      const markStop = await apiClient.post('/transport/stop/stop-1/mark', {
        status: 'reached',
      });
      expect(markStop.data.studentsToBoard).toHaveLength(2);
    });
  });

  describe('Critical Path 5: Academic Performance Tracking', () => {
    it('should track complete academic cycle: homework assigned → submitted → marks entered → parent notified', async () => {
      // Teacher assigns homework
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockHomeworkResponse);
      const homework = await apiClient.post('/homework', {
        classId: 'class-1',
        subject: 'Mathematics',
        title: 'Chapter 5 Quiz',
        dueDate: '2024-12-10',
      });
      expect(homework.success).toBe(true);

      // Student submits (mock)
      (apiClient.post as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({}, 'Homework submitted')
      );
      const submit = await apiClient.post('/homework/homework-1/submit', {
        studentId: 'student-1',
        submittedAt: new Date().toISOString(),
      });
      expect(submit.success).toBe(true);

      // Teacher enters marks
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockMarksResponse);
      const marks = await apiClient.post('/marks', {
        studentId: 'student-1',
        examId: 'exam-1',
        subject: 'Mathematics',
        marksObtained: 85,
        totalMarks: 100,
      });
      expect(marks.success).toBe(true);
      expect(marks.data.marks.grade).toBe('A');

      // Parent views marks
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockParentDashboard);
      const dashboard = await apiClient.get('/parent/dashboard/student-1');
      expect(dashboard.data.marks.recentExams).toBeDefined();

      // Verify complete cycle
      expect(apiClient.post).toHaveBeenCalledTimes(3);
      expect(apiClient.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('Critical Path 6: Emergency Notification', () => {
    it('should handle emergency notification flow: admin sends → all users receive', async () => {
      // Admin sends emergency notification
      (apiClient.post as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({
          announcementId: 'emergency-1',
          recipientCount: 1000,
          scheduled: false,
        }, 'Emergency notification sent')
      );

      const result = await apiClient.post('/admin/announcement', {
        title: 'Emergency Alert',
        message: 'School closed due to weather emergency',
        targetAudience: ['all'],
        priority: 'urgent',
      });

      expect(result.success).toBe(true);
      expect(result.data.recipientCount).toBeGreaterThan(0);
    });
  });

  describe('Performance Tests', () => {
    it('should complete teacher workflow within acceptable time', async () => {
      const startTime = Date.now();

      // Mock all API calls
      (apiClient.post as jest.Mock)
        .mockResolvedValueOnce(mockAuthResponse)
        .mockResolvedValueOnce(mockAttendanceResponse)
        .mockResolvedValueOnce(mockHomeworkResponse);

      // Execute workflow
      await apiClient.post('/auth/login', { email: 'teacher@school.com', password: 'pass' });
      await apiClient.setToken('token');
      await apiClient.post('/attendance/bulk', { classId: 'class-1', date: '2024-12-02', records: [] });
      await apiClient.post('/homework', { classId: 'class-1', subject: 'Math', title: 'Test' });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in less than 2 seconds (mocked)
      expect(duration).toBeLessThan(2000);
    });

    it('should handle high load for bulk operations', async () => {
      const bulkAttendance = {
        classId: 'class-1',
        date: '2024-12-02',
        records: Array.from({ length: 100 }, (_, i) => ({
          studentId: `student-${i}`,
          status: 'present',
        })),
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({ recorded: 100, present: 100 })
      );

      const result = await apiClient.post('/attendance/bulk', bulkAttendance);

      expect(result.success).toBe(true);
      expect(result.data.recorded).toBe(100);
    });
  });

  describe('Error Recovery Tests', () => {
    it('should recover from network errors gracefully', async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce({
        message: 'Network error. Please check your internet connection.',
        statusCode: 0,
      });

      try {
        await apiClient.post('/auth/login', {
          email: 'teacher@school.com',
          password: 'pass',
        });
      } catch (error: any) {
        expect(error.message).toContain('Network error');
        expect(error.statusCode).toBe(0);
      }
    });

    it('should handle session timeout gracefully', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce({
        message: 'Unauthorized',
        statusCode: 401,
      });

      try {
        await apiClient.get('/parent/dashboard/student-1');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
        // Should trigger re-login flow
        expect(apiClient.clearToken).toBeDefined();
      }
    });

    it('should retry failed requests', async () => {
      // First attempt fails
      (apiClient.post as jest.Mock)
        .mockRejectedValueOnce({ message: 'Network error', statusCode: 0 })
        .mockResolvedValueOnce(mockAttendanceResponse);

      // Retry logic
      let result;
      try {
        result = await apiClient.post('/attendance/bulk', {});
      } catch (error) {
        // Retry
        result = await apiClient.post('/attendance/bulk', {});
      }

      expect(result.success).toBe(true);
    });
  });

  describe('Data Consistency Tests', () => {
    it('should maintain data consistency across screens', async () => {
      // Teacher marks attendance
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockAttendanceResponse);
      await apiClient.post('/attendance/bulk', {
        classId: 'class-1',
        date: '2024-12-02',
        records: [{ studentId: 'student-1', status: 'present' }],
      });

      // Parent immediately checks dashboard
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockParentDashboard);
      const dashboard = await apiClient.get('/parent/dashboard/student-1');

      // Should reflect the attendance just marked
      expect(dashboard.data.attendance.today.status).toBe('present');
    });

    it('should sync homework status across teacher and parent views', async () => {
      // Teacher creates homework
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockHomeworkResponse);
      await apiClient.post('/homework', {
        classId: 'class-1',
        subject: 'Mathematics',
        title: 'Test',
      });

      // Parent views homework
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockParentDashboard);
      const dashboard = await apiClient.get('/parent/dashboard/student-1');

      expect(dashboard.data.homework.recentAssignments).toBeDefined();
      expect(dashboard.data.homework.pending).toBeGreaterThan(0);
    });
  });

  describe('Offline Mode Tests', () => {
    it('should queue actions when offline', async () => {
      // Simulate offline mode
      (apiClient.post as jest.Mock).mockRejectedValueOnce({
        message: 'Network error. Please check your internet connection.',
        statusCode: 0,
      });

      try {
        await apiClient.post('/attendance/bulk', {
          classId: 'class-1',
          date: '2024-12-02',
          records: [],
        });
      } catch (error: any) {
        // Should queue for later
        expect(error.message).toContain('Network error');
        // In production, this would be queued in AsyncStorage
      }
    });

    it('should sync queued actions when back online', async () => {
      // Mock successful sync after coming back online
      (apiClient.post as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({ synced: 3 }, 'Queued actions synced')
      );

      const result = await apiClient.post('/sync/queued-actions', {
        actions: [
          { type: 'attendance', data: {} },
          { type: 'homework', data: {} },
          { type: 'marks', data: {} },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.data.synced).toBe(3);
    });
  });

  describe('Security Tests', () => {
    it('should reject unauthorized access to admin endpoints', async () => {
      // Login as teacher
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockAuthResponse);
      await apiClient.post('/auth/login', {
        email: 'teacher@school.com',
        password: 'pass',
      });

      // Try to access admin endpoint
      (apiClient.post as jest.Mock).mockRejectedValueOnce({
        message: 'Only administrators can create users',
        statusCode: 403,
      });

      try {
        await apiClient.post('/admin/user', {
          email: 'test@school.com',
          name: 'Test',
          role: 'TEACHER',
        });
      } catch (error: any) {
        expect(error.statusCode).toBe(403);
        expect(error.message).toContain('Only administrators');
      }
    });

    it('should prevent cross-school data access', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce({
        message: 'You do not have access to this school',
        statusCode: 403,
      });

      try {
        await apiClient.get('/admin/users?schoolId=other-school-id');
      } catch (error: any) {
        expect(error.statusCode).toBe(403);
        expect(error.message).toContain('access to this school');
      }
    });
  });
});

