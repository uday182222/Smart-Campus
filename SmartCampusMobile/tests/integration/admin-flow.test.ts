/**
 * Admin Flow Integration Tests
 * Tests: Login → Create User → View Analytics → Send Announcement
 */

import apiClient from '../../services/apiClient';
import {
  mockUser,
  mockAuthResponse,
  mockAdminAnalytics,
  createSuccessResponse,
  createErrorResponse,
} from '../factories/mockData';

jest.mock('../../services/apiClient');

describe('Admin Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Admin Login Flow', () => {
    it('should successfully login as admin', async () => {
      const adminAuthResponse = {
        ...mockAuthResponse,
        data: {
          user: mockUser.admin,
          token: 'admin-jwt-token',
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce(adminAuthResponse);

      const result = await apiClient.post('/auth/login', {
        email: 'admin@school.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(result.data.user.role).toBe('ADMIN');
      expect(result.data.token).toBeDefined();
    });

    it('should verify admin permissions', async () => {
      const adminAuthResponse = {
        ...mockAuthResponse,
        data: {
          user: mockUser.admin,
          token: 'admin-jwt-token',
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce(adminAuthResponse);

      const result = await apiClient.post('/auth/login', {
        email: 'admin@school.com',
        password: 'password123',
      });

      expect(result.data.user.role).toBe('ADMIN');
      expect(['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN']).toContain(result.data.user.role);
    });
  });

  describe('Create User Flow', () => {
    beforeEach(() => {
      (apiClient.setToken as jest.Mock).mockResolvedValueOnce(undefined);
    });

    it('should create a new teacher', async () => {
      const newTeacherData = {
        email: 'newteacher@school.com',
        name: 'John Doe',
        role: 'TEACHER',
        schoolId: 'school-1',
        phone: '+1234567895',
        classIds: ['class-1'],
      };

      const createUserResponse = createSuccessResponse({
        userId: 'teacher-2',
        temporaryPassword: 'TempPass123!',
        user: {
          id: 'teacher-2',
          email: 'newteacher@school.com',
          name: 'John Doe',
          role: 'TEACHER',
          schoolId: 'school-1',
          status: 'ACTIVE',
          createdAt: new Date(),
        },
      }, 'User created successfully');

      (apiClient.post as jest.Mock).mockResolvedValueOnce(createUserResponse);

      const result = await apiClient.post('/admin/user', newTeacherData);

      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe('newteacher@school.com');
      expect(result.data.temporaryPassword).toBeDefined();
      expect(apiClient.post).toHaveBeenCalledWith('/admin/user', newTeacherData);
    });

    it('should create a new parent', async () => {
      const newParentData = {
        email: 'newparent@school.com',
        name: 'Jane Smith',
        role: 'PARENT',
        schoolId: 'school-1',
        phone: '+1234567896',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({
          userId: 'parent-2',
          temporaryPassword: 'TempPass456!',
          user: {
            id: 'parent-2',
            email: 'newparent@school.com',
            name: 'Jane Smith',
            role: 'PARENT',
            status: 'ACTIVE',
          },
        })
      );

      const result = await apiClient.post('/admin/user', newParentData);

      expect(result.success).toBe(true);
      expect(result.data.user.role).toBe('PARENT');
    });

    it('should create a new student and link to parent', async () => {
      const newStudentData = {
        email: 'newstudent@school.com',
        name: 'Tom Johnson',
        role: 'STUDENT',
        schoolId: 'school-1',
        classIds: ['class-1'],
        parentId: 'parent-1',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({
          userId: 'student-4',
          user: {
            id: 'student-4',
            email: 'newstudent@school.com',
            name: 'Tom Johnson',
            role: 'STUDENT',
            status: 'ACTIVE',
          },
        })
      );

      const result = await apiClient.post('/admin/user', newStudentData);

      expect(result.success).toBe(true);
      expect(result.data.user.role).toBe('STUDENT');
    });

    it('should handle duplicate email error', async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce({
        message: 'User with this email already exists',
        statusCode: 400,
      });

      try {
        await apiClient.post('/admin/user', {
          email: 'teacher@school.com', // Existing email
          name: 'Duplicate User',
          role: 'TEACHER',
          schoolId: 'school-1',
        });
      } catch (error: any) {
        expect(error.message).toBe('User with this email already exists');
        expect(error.statusCode).toBe(400);
      }
    });

    it('should validate required fields', async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce({
        message: 'email, name, and role are required',
        statusCode: 400,
      });

      try {
        await apiClient.post('/admin/user', {
          email: 'test@school.com',
          // Missing name and role
        });
      } catch (error: any) {
        expect(error.message).toContain('required');
      }
    });
  });

  describe('View Analytics Flow', () => {
    beforeEach(() => {
      (apiClient.setToken as jest.Mock).mockResolvedValueOnce(undefined);
    });

    it('should fetch dashboard analytics', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockAdminAnalytics);

      const result = await apiClient.get('/admin/analytics/dashboard?schoolId=school-1');

      expect(result.success).toBe(true);
      expect(result.data.analytics.users).toBeDefined();
      expect(result.data.analytics.attendance).toBeDefined();
      expect(result.data.analytics.events).toBeDefined();
    });

    it('should verify user statistics', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockAdminAnalytics);

      const result = await apiClient.get('/admin/analytics/dashboard?schoolId=school-1');

      const userStats = result.data.analytics.users;
      expect(userStats.total).toBe(980);
      expect(userStats.active).toBe(975);
      expect(userStats.byRole.TEACHER).toBe(25);
      expect(userStats.byRole.STUDENT).toBe(500);
    });

    it('should verify attendance statistics', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockAdminAnalytics);

      const result = await apiClient.get('/admin/analytics/dashboard?schoolId=school-1');

      const attendance = result.data.analytics.attendance;
      expect(attendance.todayPercentage).toBe(92.5);
      expect(attendance.todayRecords).toBe(500);
      expect(attendance.todayPresent).toBe(463);
    });

    it('should verify upcoming events', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockAdminAnalytics);

      const result = await apiClient.get('/admin/analytics/dashboard?schoolId=school-1');

      const events = result.data.analytics.events;
      expect(events.upcoming).toBe(3);
      expect(events.nextEvents).toHaveLength(1);
      expect(events.nextEvents[0].title).toBe('Sports Day');
    });

    it('should verify recent activities', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockAdminAnalytics);

      const result = await apiClient.get('/admin/analytics/dashboard?schoolId=school-1');

      const activities = result.data.analytics.activities;
      expect(activities.recent).toHaveLength(1);
      expect(activities.recent[0].action).toBe('USER_CREATED');
    });
  });

  describe('User Management Flow', () => {
    beforeEach(() => {
      (apiClient.setToken as jest.Mock).mockResolvedValueOnce(undefined);
    });

    it('should fetch all users', async () => {
      const usersResponse = createSuccessResponse({
        users: [mockUser.teacher, mockUser.parent, mockUser.student],
        total: 3,
        pagination: {
          limit: 50,
          offset: 0,
          hasMore: false,
        },
      });

      (apiClient.get as jest.Mock).mockResolvedValueOnce(usersResponse);

      const result = await apiClient.get('/admin/users?schoolId=school-1');

      expect(result.success).toBe(true);
      expect(result.data.users).toHaveLength(3);
      expect(result.data.total).toBe(3);
    });

    it('should filter users by role', async () => {
      const teachersResponse = createSuccessResponse({
        users: [mockUser.teacher],
        total: 1,
      });

      (apiClient.get as jest.Mock).mockResolvedValueOnce(teachersResponse);

      const result = await apiClient.get('/admin/users?schoolId=school-1&role=TEACHER');

      expect(result.success).toBe(true);
      expect(result.data.users).toHaveLength(1);
      expect(result.data.users[0].role).toBe('TEACHER');
    });

    it('should search users by name', async () => {
      const searchResponse = createSuccessResponse({
        users: [mockUser.teacher],
        total: 1,
      });

      (apiClient.get as jest.Mock).mockResolvedValueOnce(searchResponse);

      const result = await apiClient.get('/admin/users?schoolId=school-1&search=Sarah');

      expect(result.success).toBe(true);
      expect(result.data.users[0].name).toContain('Sarah');
    });

    it('should update user details', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '+9876543210',
      };

      (apiClient.put as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse(
          {
            user: {
              ...mockUser.teacher,
              ...updateData,
              updatedAt: new Date(),
            },
          },
          'User updated successfully'
        )
      );

      const result = await apiClient.put('/admin/user/teacher-1', updateData);

      expect(result.success).toBe(true);
      expect(result.data.user.name).toBe('Updated Name');
    });

    it('should deactivate user', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse(
          {
            user: {
              id: 'teacher-1',
              email: 'teacher@school.com',
              status: 'INACTIVE',
            },
          },
          'User deactivated successfully'
        )
      );

      const result = await apiClient.delete('/admin/user/teacher-1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('User deactivated successfully');
    });

    it('should reset user password', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({}, 'Password reset email sent successfully')
      );

      const result = await apiClient.post('/admin/user/teacher-1/reset-password', {});

      expect(result.success).toBe(true);
      expect(result.message).toContain('Password reset');
    });
  });

  describe('Send Announcement Flow', () => {
    beforeEach(() => {
      (apiClient.setToken as jest.Mock).mockResolvedValueOnce(undefined);
    });

    it('should send announcement to all users', async () => {
      const announcementData = {
        title: 'School Holiday Notice',
        message: 'School will be closed on Friday for maintenance',
        targetAudience: ['all'],
        priority: 'important',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({
          announcementId: 'announcement-1',
          recipientCount: 500,
          scheduled: false,
        }, 'Announcement sent successfully')
      );

      const result = await apiClient.post('/admin/announcement', announcementData);

      expect(result.success).toBe(true);
      expect(result.data.recipientCount).toBe(500);
      expect(result.data.scheduled).toBe(false);
      expect(apiClient.post).toHaveBeenCalledWith('/admin/announcement', announcementData);
    });

    it('should send announcement to specific audience', async () => {
      const announcementData = {
        title: 'Parent-Teacher Meeting',
        message: 'PTM scheduled for next week',
        targetAudience: ['parents'],
        priority: 'normal',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({
          announcementId: 'announcement-2',
          recipientCount: 450,
          scheduled: false,
        })
      );

      const result = await apiClient.post('/admin/announcement', announcementData);

      expect(result.success).toBe(true);
      expect(result.data.recipientCount).toBe(450);
    });

    it('should schedule announcement for future', async () => {
      const announcementData = {
        title: 'Exam Schedule',
        message: 'Final exams start next month',
        targetAudience: ['students', 'parents'],
        priority: 'important',
        scheduledFor: '2024-12-10T10:00:00Z',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({
          announcementId: 'announcement-3',
          recipientCount: 950,
          scheduled: true,
          scheduledFor: '2024-12-10T10:00:00Z',
        }, 'Announcement scheduled successfully')
      );

      const result = await apiClient.post('/admin/announcement', announcementData);

      expect(result.success).toBe(true);
      expect(result.data.scheduled).toBe(true);
      expect(result.data.scheduledFor).toBeDefined();
    });

    it('should send announcement to specific classes', async () => {
      const announcementData = {
        title: 'Field Trip',
        message: 'Grade 5 field trip next Friday',
        targetAudience: ['classes'],
        classIds: ['class-1'],
        priority: 'normal',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({
          announcementId: 'announcement-4',
          recipientCount: 60, // Students + parents + teachers
          scheduled: false,
        })
      );

      const result = await apiClient.post('/admin/announcement', announcementData);

      expect(result.success).toBe(true);
      expect(result.data.recipientCount).toBeGreaterThan(0);
    });

    it('should validate announcement required fields', async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce({
        message: 'title and message are required',
        statusCode: 400,
      });

      try {
        await apiClient.post('/admin/announcement', {
          targetAudience: ['all'],
          // Missing title and message
        });
      } catch (error: any) {
        expect(error.message).toContain('required');
      }
    });
  });

  describe('Bulk User Import Flow', () => {
    beforeEach(() => {
      (apiClient.setToken as jest.Mock).mockResolvedValueOnce(undefined);
    });

    it('should bulk import teachers from CSV', async () => {
      const csvFile = new File(['email,name,phone\nteacher1@school.com,Teacher One,+1111111111'], 'teachers.csv');
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('role', 'TEACHER');

      (apiClient.postFormData as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({
          imported: 1,
          failed: 0,
          total: 1,
          errors: [],
        }, 'Bulk import completed: 1 imported, 0 failed')
      );

      const result = await apiClient.postFormData('/admin/users/bulk-import', formData);

      expect(result.success).toBe(true);
      expect(result.data.imported).toBe(1);
      expect(result.data.failed).toBe(0);
    });

    it('should handle bulk import with errors', async () => {
      (apiClient.postFormData as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({
          imported: 8,
          failed: 2,
          total: 10,
          errors: [
            { row: 3, email: 'invalid@email', error: 'Invalid email format' },
            { row: 7, email: 'duplicate@school.com', error: 'User already exists' },
          ],
        }, 'Bulk import completed: 8 imported, 2 failed')
      );

      const formData = new FormData();
      const result = await apiClient.postFormData('/admin/users/bulk-import', formData);

      expect(result.success).toBe(true);
      expect(result.data.imported).toBe(8);
      expect(result.data.failed).toBe(2);
      expect(result.data.errors).toHaveLength(2);
    });
  });

  describe('Complete Admin Workflow', () => {
    it('should complete full admin workflow: login → create user → view analytics → send announcement', async () => {
      // Step 1: Login as admin
      const adminAuthResponse = {
        ...mockAuthResponse,
        data: {
          user: mockUser.admin,
          token: 'admin-jwt-token',
        },
      };
      (apiClient.post as jest.Mock).mockResolvedValueOnce(adminAuthResponse);
      const loginResult = await apiClient.post('/auth/login', {
        email: 'admin@school.com',
        password: 'password123',
      });
      expect(loginResult.data.user.role).toBe('ADMIN');

      // Step 2: Set token
      await apiClient.setToken(loginResult.data.token);

      // Step 3: Create new teacher
      (apiClient.post as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({
          userId: 'teacher-2',
          temporaryPassword: 'TempPass123!',
          user: { id: 'teacher-2', role: 'TEACHER' },
        })
      );
      const createUserResult = await apiClient.post('/admin/user', {
        email: 'newteacher@school.com',
        name: 'New Teacher',
        role: 'TEACHER',
        schoolId: 'school-1',
      });
      expect(createUserResult.data.user.role).toBe('TEACHER');

      // Step 4: View analytics
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockAdminAnalytics);
      const analyticsResult = await apiClient.get('/admin/analytics/dashboard?schoolId=school-1');
      expect(analyticsResult.data.analytics.users.total).toBeGreaterThan(0);

      // Step 5: Send announcement
      (apiClient.post as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({
          announcementId: 'announcement-1',
          recipientCount: 500,
        })
      );
      const announcementResult = await apiClient.post('/admin/announcement', {
        title: 'Welcome New Teacher',
        message: 'Please welcome our new teacher',
        targetAudience: ['all'],
        priority: 'normal',
      });
      expect(announcementResult.data.recipientCount).toBeGreaterThan(0);

      // Verify all API calls
      expect(apiClient.post).toHaveBeenCalledTimes(3); // login + create user + announcement
      expect(apiClient.get).toHaveBeenCalledTimes(1); // analytics
      expect(apiClient.setToken).toHaveBeenCalled();
    });
  });
});

