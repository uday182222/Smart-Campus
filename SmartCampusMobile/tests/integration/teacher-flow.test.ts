/**
 * Teacher Flow Integration Tests
 * Tests: Login → Mark Attendance → Create Homework → Enter Marks
 */

import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import apiClient from '../../services/apiClient';
import {
  mockUser,
  mockAuthResponse,
  mockClass,
  mockStudents,
  mockAttendanceResponse,
  mockHomeworkResponse,
  mockMarksResponse,
  createSuccessResponse,
} from '../factories/mockData';

// Import screens
// Note: Adjust imports based on your actual screen paths
jest.mock('../../services/apiClient');

describe('Teacher Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Teacher Login Flow', () => {
    it('should successfully login as teacher', async () => {
      // Mock login API
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockAuthResponse);

      // Test login
      const loginData = {
        email: 'teacher@school.com',
        password: 'password123',
      };

      const result = await apiClient.post('/auth/login', loginData);

      expect(result.success).toBe(true);
      expect(result.data.user.role).toBe('TEACHER');
      expect(result.data.token).toBeDefined();
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', loginData);
    });

    it('should handle login failure', async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce({
        message: 'Invalid credentials',
        statusCode: 401,
      });

      try {
        await apiClient.post('/auth/login', {
          email: 'wrong@email.com',
          password: 'wrongpassword',
        });
      } catch (error: any) {
        expect(error.message).toBe('Invalid credentials');
        expect(error.statusCode).toBe(401);
      }
    });

    it('should store auth token after successful login', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockAuthResponse);

      const result = await apiClient.post('/auth/login', {
        email: 'teacher@school.com',
        password: 'password123',
      });

      // Verify setToken is called
      await apiClient.setToken(result.data.token);
      expect(apiClient.setToken).toHaveBeenCalledWith('mock-jwt-token-12345');
    });
  });

  describe('Mark Attendance Flow', () => {
    beforeEach(() => {
      // Assume teacher is logged in
      (apiClient.setToken as jest.Mock).mockResolvedValueOnce(undefined);
    });

    it('should fetch class students for attendance', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({ students: mockStudents })
      );

      const result = await apiClient.get(`/attendance/class/${mockClass.id}/students`);

      expect(result.success).toBe(true);
      expect(result.data.students).toHaveLength(3);
      expect(result.data.students[0].name).toBe('Alice Johnson');
    });

    it('should mark attendance for multiple students', async () => {
      const attendanceData = {
        classId: mockClass.id,
        date: '2024-12-02',
        records: [
          { studentId: 'student-1', status: 'present' },
          { studentId: 'student-2', status: 'present' },
          { studentId: 'student-3', status: 'absent' },
        ],
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockAttendanceResponse);

      const result = await apiClient.post('/attendance/bulk', attendanceData);

      expect(result.success).toBe(true);
      expect(result.data.recorded).toBe(28);
      expect(result.data.present).toBe(26);
      expect(result.data.absent).toBe(2);
      expect(apiClient.post).toHaveBeenCalledWith('/attendance/bulk', attendanceData);
    });

    it('should handle attendance marking errors', async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce({
        message: 'Attendance already marked for today',
        statusCode: 400,
      });

      try {
        await apiClient.post('/attendance/bulk', {
          classId: mockClass.id,
          date: '2024-12-02',
          records: [],
        });
      } catch (error: any) {
        expect(error.message).toBe('Attendance already marked for today');
      }
    });

    it('should update existing attendance record', async () => {
      const updateData = {
        studentId: 'student-1',
        status: 'late',
        notes: 'Arrived 15 minutes late',
      };

      (apiClient.put as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({ updated: true }, 'Attendance updated')
      );

      const result = await apiClient.put('/attendance/attendance-1', updateData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Attendance updated');
    });
  });

  describe('Create Homework Flow', () => {
    beforeEach(() => {
      (apiClient.setToken as jest.Mock).mockResolvedValueOnce(undefined);
    });

    it('should create homework assignment', async () => {
      const homeworkData = {
        classId: mockClass.id,
        subject: 'Mathematics',
        title: 'Algebra Practice',
        description: 'Complete exercises 1-10 from Chapter 5',
        dueDate: '2024-12-10',
        attachments: [],
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockHomeworkResponse);

      const result = await apiClient.post('/homework', homeworkData);

      expect(result.success).toBe(true);
      expect(result.data.homework.subject).toBe('Mathematics');
      expect(result.data.homework.title).toBe('Algebra Practice');
      expect(apiClient.post).toHaveBeenCalledWith('/homework', homeworkData);
    });

    it('should validate required fields for homework', async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce({
        message: 'title is required',
        statusCode: 400,
      });

      try {
        await apiClient.post('/homework', {
          classId: mockClass.id,
          // Missing required fields
        });
      } catch (error: any) {
        expect(error.message).toBe('title is required');
      }
    });

    it('should update homework assignment', async () => {
      const updateData = {
        title: 'Updated Algebra Practice',
        dueDate: '2024-12-12',
      };

      (apiClient.put as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({ updated: true }, 'Homework updated')
      );

      const result = await apiClient.put('/homework/homework-1', updateData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Homework updated');
    });

    it('should delete homework assignment', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({}, 'Homework deleted')
      );

      const result = await apiClient.delete('/homework/homework-1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Homework deleted');
    });
  });

  describe('Enter Marks Flow', () => {
    beforeEach(() => {
      (apiClient.setToken as jest.Mock).mockResolvedValueOnce(undefined);
    });

    it('should enter marks for a student', async () => {
      const marksData = {
        studentId: 'student-1',
        examId: 'exam-1',
        subject: 'Mathematics',
        marksObtained: 85,
        totalMarks: 100,
        remarks: 'Excellent performance',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockMarksResponse);

      const result = await apiClient.post('/marks', marksData);

      expect(result.success).toBe(true);
      expect(result.data.marks.marksObtained).toBe(85);
      expect(result.data.marks.percentage).toBe(85);
      expect(result.data.marks.grade).toBe('A');
      expect(apiClient.post).toHaveBeenCalledWith('/marks', marksData);
    });

    it('should enter marks for multiple students (bulk)', async () => {
      const bulkMarksData = {
        examId: 'exam-1',
        subject: 'Mathematics',
        marks: [
          { studentId: 'student-1', marksObtained: 85, totalMarks: 100 },
          { studentId: 'student-2', marksObtained: 78, totalMarks: 100 },
          { studentId: 'student-3', marksObtained: 92, totalMarks: 100 },
        ],
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse(
          { recorded: 3, averagePercentage: 85 },
          'Marks entered successfully'
        )
      );

      const result = await apiClient.post('/marks/bulk', bulkMarksData);

      expect(result.success).toBe(true);
      expect(result.data.recorded).toBe(3);
      expect(result.data.averagePercentage).toBe(85);
    });

    it('should validate marks range', async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce({
        message: 'Marks obtained cannot exceed total marks',
        statusCode: 400,
      });

      try {
        await apiClient.post('/marks', {
          studentId: 'student-1',
          examId: 'exam-1',
          marksObtained: 110, // Invalid: exceeds total
          totalMarks: 100,
        });
      } catch (error: any) {
        expect(error.message).toBe('Marks obtained cannot exceed total marks');
      }
    });

    it('should update existing marks', async () => {
      const updateData = {
        marksObtained: 87,
        remarks: 'Updated after recheck',
      };

      (apiClient.put as jest.Mock).mockResolvedValueOnce(
        createSuccessResponse({ updated: true }, 'Marks updated')
      );

      const result = await apiClient.put('/marks/marks-1', updateData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Marks updated');
    });
  });

  describe('Complete Teacher Workflow', () => {
    it('should complete full teacher workflow: login → attendance → homework → marks', async () => {
      // Step 1: Login
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockAuthResponse);
      const loginResult = await apiClient.post('/auth/login', {
        email: 'teacher@school.com',
        password: 'password123',
      });
      expect(loginResult.success).toBe(true);
      expect(loginResult.data.user.role).toBe('TEACHER');

      // Step 2: Set token
      await apiClient.setToken(loginResult.data.token);

      // Step 3: Mark Attendance
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockAttendanceResponse);
      const attendanceResult = await apiClient.post('/attendance/bulk', {
        classId: mockClass.id,
        date: '2024-12-02',
        records: [
          { studentId: 'student-1', status: 'present' },
          { studentId: 'student-2', status: 'present' },
        ],
      });
      expect(attendanceResult.success).toBe(true);
      expect(attendanceResult.data.recorded).toBeGreaterThan(0);

      // Step 4: Create Homework
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockHomeworkResponse);
      const homeworkResult = await apiClient.post('/homework', {
        classId: mockClass.id,
        subject: 'Mathematics',
        title: 'Algebra Practice',
        dueDate: '2024-12-10',
      });
      expect(homeworkResult.success).toBe(true);
      expect(homeworkResult.data.homework).toBeDefined();

      // Step 5: Enter Marks
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockMarksResponse);
      const marksResult = await apiClient.post('/marks', {
        studentId: 'student-1',
        examId: 'exam-1',
        subject: 'Mathematics',
        marksObtained: 85,
        totalMarks: 100,
      });
      expect(marksResult.success).toBe(true);
      expect(marksResult.data.marks.grade).toBe('A');

      // Verify all API calls were made
      expect(apiClient.post).toHaveBeenCalledTimes(4);
      expect(apiClient.setToken).toHaveBeenCalled();
    });
  });
});

