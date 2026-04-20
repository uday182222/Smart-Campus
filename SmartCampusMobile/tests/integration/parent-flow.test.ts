/**
 * Parent Flow Integration Tests
 * Tests: Login → View Child Dashboard → Check Attendance → View Transport
 */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import apiClient from '../../services/apiClient';
import {
  mockUser,
  mockAuthResponse,
  mockParentDashboard,
  mockTransportRoute,
  createSuccessResponse,
  createErrorResponse,
} from '../factories/mockData';

jest.mock('../../services/apiClient');

describe('Parent Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Parent Login Flow', () => {
    it('should successfully login as parent', async () => {
      const parentAuthResponse = {
        ...mockAuthResponse,
        data: {
          user: mockUser.parent,
          token: 'parent-jwt-token',
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce(parentAuthResponse);

      const result = await apiClient.post('/auth/login', {
        email: 'parent@school.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(result.data.user.role).toBe('PARENT');
      expect(result.data.token).toBeDefined();
    });

    it('should fetch parent profile after login', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({ user: mockUser.parent })
      );

      const result = await apiClient.get('/auth/profile');

      expect(result.success).toBe(true);
      expect(result.data.user.role).toBe('PARENT');
    });
  });

  describe('View Children Flow', () => {
    beforeEach(() => {
      (apiClient.setToken as jest.Mock).mockResolvedValueOnce(undefined);
    });

    it('should fetch list of children', async () => {
      const childrenResponse = createSuccessResponse({
        children: [
          {
            id: 'student-1',
            name: 'Alice Johnson',
            class: 'Grade 5A',
            rollNumber: '001',
            photo: 'https://example.com/photo.jpg',
          },
          {
            id: 'student-2',
            name: 'Bob Johnson',
            class: 'Grade 3B',
            rollNumber: '045',
            photo: 'https://example.com/photo2.jpg',
          },
        ],
        total: 2,
      });

      (apiClient.get as jest.Mock).mockResolvedValueOnce(childrenResponse);

      const result = await apiClient.get('/parent/children');

      expect(result.success).toBe(true);
      expect(result.data.children).toHaveLength(2);
      expect(result.data.children[0].name).toBe('Alice Johnson');
    });

    it('should handle parent with no children', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({ children: [], total: 0 })
      );

      const result = await apiClient.get('/parent/children');

      expect(result.success).toBe(true);
      expect(result.data.children).toHaveLength(0);
    });
  });

  describe('View Child Dashboard Flow', () => {
    beforeEach(() => {
      (apiClient.setToken as jest.Mock).mockResolvedValueOnce(undefined);
    });

    it('should fetch complete dashboard for a child', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockParentDashboard);

      const result = await apiClient.get('/parent/dashboard/student-1');

      expect(result.success).toBe(true);
      expect(result.data.student).toBeDefined();
      expect(result.data.attendance).toBeDefined();
      expect(result.data.homework).toBeDefined();
      expect(result.data.marks).toBeDefined();
      expect(result.data.notifications).toBeDefined();
    });

    it('should verify attendance statistics', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockParentDashboard);

      const result = await apiClient.get('/parent/dashboard/student-1');

      const attendance = result.data.attendance;
      expect(attendance.thisMonth.present).toBe(20);
      expect(attendance.thisMonth.absent).toBe(2);
      expect(attendance.thisMonth.percentage).toBe(87);
      expect(attendance.today.status).toBe('present');
    });

    it('should verify homework statistics', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockParentDashboard);

      const result = await apiClient.get('/parent/dashboard/student-1');

      const homework = result.data.homework;
      expect(homework.pending).toBe(3);
      expect(homework.completed).toBe(12);
      expect(homework.overdue).toBe(0);
      expect(homework.recentAssignments).toHaveLength(1);
    });

    it('should verify marks statistics', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockParentDashboard);

      const result = await apiClient.get('/parent/dashboard/student-1');

      const marks = result.data.marks;
      expect(marks.recentExams).toHaveLength(2);
      expect(marks.averagePercentage).toBe(81.5);
      expect(marks.recentExams[0].subject).toBe('Mathematics');
      expect(marks.recentExams[0].grade).toBe('A');
    });

    it('should handle unauthorized access to another parent child', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce({
        message: 'You do not have access to this student',
        statusCode: 403,
      });

      try {
        await apiClient.get('/parent/dashboard/other-student-id');
      } catch (error: any) {
        expect(error.message).toBe('You do not have access to this student');
        expect(error.statusCode).toBe(403);
      }
    });
  });

  describe('Check Attendance History Flow', () => {
    beforeEach(() => {
      (apiClient.setToken as jest.Mock).mockResolvedValueOnce(undefined);
    });

    it('should fetch attendance history for a month', async () => {
      const attendanceHistory = createSuccessResponse({
        records: [
          { date: '2024-12-01', status: 'present' },
          { date: '2024-12-02', status: 'present' },
          { date: '2024-12-03', status: 'absent' },
          { date: '2024-12-04', status: 'late' },
        ],
        summary: {
          present: 2,
          absent: 1,
          late: 1,
          total: 4,
          percentage: 75,
        },
      });

      (apiClient.get as jest.Mock).mockResolvedValueOnce(attendanceHistory);

      const result = await apiClient.get(
        '/attendance/student/student-1?startDate=2024-12-01&endDate=2024-12-31'
      );

      expect(result.success).toBe(true);
      expect(result.data.records).toHaveLength(4);
      expect(result.data.summary.percentage).toBe(75);
    });

    it('should fetch detailed attendance for a specific date', async () => {
      const detailResponse = createSuccessResponse({
        date: '2024-12-02',
        status: 'present',
        markedAt: '2024-12-02T09:00:00Z',
        markedBy: 'teacher-1',
        markedByName: 'Ms. Sarah Wilson',
        notes: '',
      });

      (apiClient.get as jest.Mock).mockResolvedValueOnce(detailResponse);

      const result = await apiClient.get('/attendance/student/student-1/date/2024-12-02');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('present');
      expect(result.data.markedByName).toBe('Ms. Sarah Wilson');
    });
  });

  describe('View Transport Flow', () => {
    beforeEach(() => {
      (apiClient.setToken as jest.Mock).mockResolvedValueOnce(undefined);
    });

    it('should fetch assigned transport route for student', async () => {
      const transportResponse = createSuccessResponse({
        route: mockTransportRoute,
        assignedStop: {
          id: 'stop-1',
          name: 'Main Gate',
          address: '123 Main St',
          latitude: 40.7128,
          longitude: -74.006,
        },
        currentLocation: {
          latitude: 40.7228,
          longitude: -74.016,
          timestamp: new Date('2024-12-02T07:25:00'),
        },
        eta: '5 minutes',
      });

      (apiClient.get as jest.Mock).mockResolvedValueOnce(transportResponse);

      const result = await apiClient.get('/transport/student/student-1/route');

      expect(result.success).toBe(true);
      expect(result.data.route).toBeDefined();
      expect(result.data.assignedStop.name).toBe('Main Gate');
      expect(result.data.eta).toBe('5 minutes');
    });

    it('should fetch live tracking for bus', async () => {
      const liveTrackingResponse = createSuccessResponse({
        routeId: 'route-1',
        latestLocation: {
          latitude: 40.7228,
          longitude: -74.016,
          speed: 30,
          heading: 45,
          timestamp: new Date('2024-12-02T07:25:00'),
        },
        currentStop: {
          id: 'stop-1',
          name: 'Main Gate',
          status: 'approaching',
        },
        recentPath: [
          { latitude: 40.7128, longitude: -74.006, timestamp: new Date('2024-12-02T07:20:00') },
          { latitude: 40.7178, longitude: -74.011, timestamp: new Date('2024-12-02T07:22:30') },
          { latitude: 40.7228, longitude: -74.016, timestamp: new Date('2024-12-02T07:25:00') },
        ],
      });

      (apiClient.get as jest.Mock).mockResolvedValueOnce(liveTrackingResponse);

      const result = await apiClient.get('/transport/tracking/route-1/live');

      expect(result.success).toBe(true);
      expect(result.data.latestLocation).toBeDefined();
      expect(result.data.latestLocation.speed).toBe(30);
      expect(result.data.recentPath).toHaveLength(3);
    });

    it('should handle student with no transport assigned', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce({
        message: 'No transport route assigned to this student',
        statusCode: 404,
      });

      try {
        await apiClient.get('/transport/student/student-1/route');
      } catch (error: any) {
        expect(error.message).toBe('No transport route assigned to this student');
        expect(error.statusCode).toBe(404);
      }
    });
  });

  describe('View Homework Flow', () => {
    beforeEach(() => {
      (apiClient.setToken as jest.Mock).mockResolvedValueOnce(undefined);
    });

    it('should fetch homework assignments for student', async () => {
      const homeworkResponse = createSuccessResponse({
        assignments: [
          {
            id: 'homework-1',
            subject: 'Mathematics',
            title: 'Algebra Practice',
            dueDate: '2024-12-10',
            status: 'pending',
            submittedAt: null,
          },
          {
            id: 'homework-2',
            subject: 'Science',
            title: 'Lab Report',
            dueDate: '2024-12-08',
            status: 'submitted',
            submittedAt: '2024-12-07T10:00:00Z',
          },
        ],
        summary: {
          pending: 1,
          completed: 1,
          overdue: 0,
        },
      });

      (apiClient.get as jest.Mock).mockResolvedValueOnce(homeworkResponse);

      const result = await apiClient.get('/homework/student/student-1');

      expect(result.success).toBe(true);
      expect(result.data.assignments).toHaveLength(2);
      expect(result.data.summary.pending).toBe(1);
    });
  });

  describe('Complete Parent Workflow', () => {
    it('should complete full parent workflow: login → view children → dashboard → attendance → transport', async () => {
      // Step 1: Login
      const parentAuthResponse = {
        ...mockAuthResponse,
        data: {
          user: mockUser.parent,
          token: 'parent-jwt-token',
        },
      };
      (apiClient.post as jest.Mock).mockResolvedValueOnce(parentAuthResponse);
      const loginResult = await apiClient.post('/auth/login', {
        email: 'parent@school.com',
        password: 'password123',
      });
      expect(loginResult.data.user.role).toBe('PARENT');

      // Step 2: Set token
      await apiClient.setToken(loginResult.data.token);

      // Step 3: Get children list
      (apiClient.get as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({
          children: [{ id: 'student-1', name: 'Alice Johnson', class: 'Grade 5A' }],
          total: 1,
        })
      );
      const childrenResult = await apiClient.get('/parent/children');
      expect(childrenResult.data.children).toHaveLength(1);

      // Step 4: View child dashboard
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockParentDashboard);
      const dashboardResult = await apiClient.get('/parent/dashboard/student-1');
      expect(dashboardResult.data.attendance).toBeDefined();

      // Step 5: Check transport
      (apiClient.get as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({
          route: mockTransportRoute,
          assignedStop: { id: 'stop-1', name: 'Main Gate' },
          eta: '5 minutes',
        })
      );
      const transportResult = await apiClient.get('/transport/student/student-1/route');
      expect(transportResult.data.route).toBeDefined();

      // Verify all API calls
      expect(apiClient.post).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledTimes(3);
      expect(apiClient.setToken).toHaveBeenCalled();
    });
  });
});

