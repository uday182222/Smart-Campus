import { apiClient } from './apiClient';

/**
 * Marks Service
 * Handles all marks-related API calls using the centralized apiClient
 */

export interface Marks {
  id: string;
  examId: string;
  studentId: string;
  marksObtained: number;
  maxMarks: number;
  percentage: string;
  remarks?: string;
  enteredAt: Date;
  status: 'PASS' | 'FAIL';
  exam?: {
    id: string;
    name: string;
    subject: string;
    examType: string;
    date: Date;
    maxMarks: number;
    passingMarks: number;
  };
  teacher?: {
    id: string;
    name: string;
    email: string;
  };
  student?: {
    id: string;
    name: string;
    email: string;
    photo?: string;
  };
}

export interface ExamMarks {
  exam: {
    id: string;
    name: string;
    subject: string;
    examType: string;
    date: Date;
    maxMarks: number;
    passingMarks: number;
    class: {
      id: string;
      name: string;
      section: string;
    };
  };
  marks: Marks[];
  statistics: {
    totalStudents: number;
    passed: number;
    failed: number;
    averageMarks: string;
    highestMarks: number;
    lowestMarks: number;
  };
}

export interface StudentMarks {
  student: {
    id: string;
    name: string;
    email: string;
    photo?: string;
  };
  marks: Marks[];
  statistics: {
    totalExams: number;
    passed: number;
    failed: number;
    averageMarks: string;
    averagePercentage: string;
    highestMarks: number;
    lowestMarks: number;
  };
}

export class MarksService {
  private static instance: MarksService;

  static getInstance(): MarksService {
    if (!MarksService.instance) {
      MarksService.instance = new MarksService();
    }
    return MarksService.instance;
  }

  constructor() {
    // Service now uses apiClient singleton
  }

  /**
   * Set authentication token (delegates to apiClient)
   */
  public async setToken(token: string) {
    await apiClient.setToken(token);
  }

  /**
   * Enter marks for a student in an exam
   * POST /api/marks
   */
  async enterMarks(
    examId: string,
    studentId: string,
    marksObtained: number,
    remarks?: string
  ): Promise<{ success: boolean; message: string; data?: Marks }> {
    try {
      const response = await apiClient.post('/marks', {
        examId,
        studentId,
        marksObtained,
        remarks,
      });

      if (response.success && response.data) {
        return {
          success: true,
          message: response.message || 'Marks entered successfully',
          data: {
            id: response.data.id,
            examId: response.data.examId,
            studentId: response.data.studentId,
            marksObtained: response.data.marksObtained,
            maxMarks: response.data.exam?.maxMarks || 0,
            percentage: response.data.percentage || '0.00',
            remarks: response.data.remarks,
            enteredAt: new Date(response.data.enteredAt),
            status: response.data.status,
            exam: response.data.exam,
            teacher: response.data.teacher,
          },
        };
      }

      throw new Error(response.message || 'Failed to enter marks');
    } catch (error: any) {
      console.error('Error entering marks:', error);
      return {
        success: false,
        message: error.message || 'Failed to enter marks',
      };
    }
  }

  /**
   * Update marks with audit trail
   * PUT /api/marks/:id
   */
  async updateMarks(
    marksId: string,
    updates: {
      marksObtained?: number;
      remarks?: string;
    }
  ): Promise<{ success: boolean; message: string; data?: Marks }> {
    try {
      const response = await apiClient.put(`/marks/${marksId}`, updates);

      if (response.success && response.data) {
        return {
          success: true,
          message: response.message || 'Marks updated successfully',
          data: {
            id: response.data.id,
            examId: response.data.examId,
            studentId: response.data.studentId,
            marksObtained: response.data.marksObtained,
            maxMarks: response.data.exam?.maxMarks || 0,
            percentage: response.data.percentage || '0.00',
            remarks: response.data.remarks,
            enteredAt: new Date(response.data.enteredAt),
            status: response.data.status,
            exam: response.data.exam,
            teacher: response.data.teacher,
          },
        };
      }

      throw new Error(response.message || 'Failed to update marks');
    } catch (error: any) {
      console.error('Error updating marks:', error);
      return {
        success: false,
        message: error.message || 'Failed to update marks',
      };
    }
  }

  /**
   * Get all marks for an exam
   * GET /api/marks/:examId
   */
  async getExamMarks(examId: string): Promise<ExamMarks | null> {
    try {
      const response = await apiClient.get(`/marks/${examId}`);

      if (response.success && response.data) {
        return {
          exam: {
            id: response.data.exam.id,
            name: response.data.exam.name,
            subject: response.data.exam.subject,
            examType: response.data.exam.examType,
            date: new Date(response.data.exam.date),
            maxMarks: response.data.exam.maxMarks,
            passingMarks: response.data.exam.passingMarks,
            class: response.data.exam.class,
          },
          marks: response.data.marks.map((mark: any) => ({
            id: mark.id,
            examId: mark.examId,
            studentId: mark.studentId,
            marksObtained: mark.marksObtained,
            maxMarks: response.data.exam.maxMarks,
            percentage: mark.percentage,
            remarks: mark.remarks,
            enteredAt: new Date(mark.enteredAt),
            status: mark.status,
            teacher: mark.teacher,
            student: mark.student,
          })),
          statistics: response.data.statistics,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting exam marks:', error);
      throw error;
    }
  }

  /**
   * Get all marks for a student
   * GET /api/marks/student/:studentId
   */
  async getStudentMarks(
    studentId: string,
    examId?: string,
    subject?: string
  ): Promise<StudentMarks | null> {
    try {
      let url = `/marks/student/${studentId}`;
      const params = new URLSearchParams();
      if (examId) params.append('examId', examId);
      if (subject) params.append('subject', subject);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await apiClient.get(url);

      if (response.success && response.data) {
        return {
          student: {
            id: response.data.student.id,
            name: response.data.student.name,
            email: response.data.student.email,
            photo: response.data.student.photo,
          },
          marks: response.data.marks.map((mark: any) => ({
            id: mark.id,
            examId: mark.examId,
            studentId: mark.studentId,
            marksObtained: mark.marksObtained,
            maxMarks: mark.maxMarks,
            percentage: mark.percentage,
            remarks: mark.remarks,
            enteredAt: new Date(mark.enteredAt),
            status: mark.status,
            exam: mark.exam,
            teacher: mark.teacher,
          })),
          statistics: response.data.statistics,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting student marks:', error);
      throw error;
    }
  }
}

export default MarksService.getInstance();

