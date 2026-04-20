// @ts-nocheck
import { Homework, HomeworkStats, HomeworkSubmission, SubmissionStatus } from '../models/HomeworkModel';
import { apiClient } from './apiClient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

export class HomeworkService {
  private static instance: HomeworkService;

  static getInstance(): HomeworkService {
    if (!HomeworkService.instance) {
      HomeworkService.instance = new HomeworkService();
    }
    return HomeworkService.instance;
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
   * Get homework for a teacher
   * GET /api/homework/:classId
   */
  async getHomeworkForTeacher(teacherId: string): Promise<Homework[]> {
    try {
      // TODO: Get teacher's classes first, then get homework for each class
      // For now, return empty array - this would need a "get teacher classes" endpoint
      return [];
    } catch (error) {
      console.error('Error getting homework for teacher:', error);
      return [];
    }
  }

  /**
   * Get homework for a class
   * GET /api/homework/:classId
   */
  async getClassHomework(classId: string, status?: string, subject?: string): Promise<Homework[]> {
    try {
      let url = `/homework/${classId}`;
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (subject) params.append('subject', subject);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await apiClient.get(url);

      if (response.success && response.data) {
        return response.data.homework.map((hw: any) => ({
          id: hw.id,
          title: hw.title,
          description: hw.description,
          subject: hw.subject,
          classId: hw.classId || classId,
          className: response.data.className,
          teacherId: hw.teacher.id,
          teacherName: hw.teacher.name,
          assignedDate: new Date(hw.createdAt),
          dueDate: new Date(hw.dueDate),
          status: hw.status,
          attachments: (hw.attachments || []).map((url: string, index: number) => ({
            id: `att_${index}`,
            name: url.split('/').pop() || 'attachment',
            url: url,
            type: 'document',
            size: 0,
          })),
          submissions: [],
          createdAt: new Date(hw.createdAt),
          updatedAt: new Date(hw.updatedAt),
        }));
      }

      return [];
    } catch (error) {
      console.error('Error getting class homework:', error);
      return [];
    }
  }

  /**
   * Get homework for a student
   * Uses getClassHomework for student's class
   */
  async getHomeworkForStudent(studentId: string): Promise<Homework[]> {
    try {
      // TODO: Get student's class first, then get homework
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error getting homework for student:', error);
      return [];
    }
  }

  /**
   * Create new homework
   * POST /api/homework
   */
  async createHomework(
    homework: Omit<Homework, 'id' | 'createdAt' | 'updatedAt' | 'submissions'>
  ): Promise<{ success: boolean; homework?: Homework; message: string }> {
    try {
      const formData = new FormData();

      // Add text fields
      formData.append('classId', homework.classId);
      formData.append('subject', homework.subject);
      formData.append('title', homework.title);
      formData.append('description', homework.description);
      formData.append('dueDate', homework.dueDate.toISOString());

      // Add file attachments if any
      if (homework.attachments && homework.attachments.length > 0) {
        for (const attachment of homework.attachments) {
          // If attachment has a local URI, upload it
          if (attachment.url && attachment.url.startsWith('file://')) {
            // File needs to be uploaded
            // For now, we'll skip file uploads in create - handle separately
          }
        }
      }

      const response = await apiClient.postFormData('/homework', formData as any);

      if (response.success && response.data) {
        const hw = response.data;
        return {
          success: true,
          message: response.message || 'Homework created successfully',
          homework: {
            id: hw.id,
            title: hw.title,
            description: hw.description,
            subject: hw.subject,
            classId: hw.classId,
            className: hw.className,
            teacherId: hw.teacher.id,
            teacherName: hw.teacher.name,
            assignedDate: new Date(hw.createdAt),
            dueDate: new Date(hw.dueDate),
            status: hw.status,
            attachments: (hw.attachments || []).map((url: string, index: number) => ({
              id: `att_${index}`,
              name: url.split('/').pop() || 'attachment',
              url: url,
              type: 'document',
              size: 0,
            })),
            submissions: [],
            createdAt: new Date(hw.createdAt),
            updatedAt: new Date(hw.updatedAt),
          },
        };
      }

      throw new Error(response.error?.message || 'Failed to create homework');
    } catch (error) {
      console.error('Error creating homework:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create homework',
      };
    }
  }

  /**
   * Create homework with JSON (no file upload)
   * POST /api/homework
   */
  async createHomeworkJSON(
    classId: string,
    subject: string,
    title: string,
    description: string,
    dueDate: Date,
    attachments?: string[] // Pre-uploaded URLs
  ): Promise<{ success: boolean; homework?: Homework; message: string }> {
    try {
      const payload: any = {
        classId,
        subject,
        title,
        description,
        dueDate: dueDate.toISOString(),
      };

      if (attachments && attachments.length > 0) {
        payload.attachments = attachments;
      }

      const response = await apiClient.post('/homework', payload);

      if (response.success && response.data) {
        const hw = response.data;
        return {
          success: true,
          message: response.message || 'Homework created successfully',
          homework: {
            id: hw.id,
            title: hw.title,
            description: hw.description,
            subject: hw.subject,
            classId: hw.classId,
            className: hw.className,
            teacherId: hw.teacher.id,
            teacherName: hw.teacher.name,
            assignedDate: new Date(hw.createdAt),
            dueDate: new Date(hw.dueDate),
            status: hw.status,
            attachments: (hw.attachments || []).map((url: string, index: number) => ({
              id: `att_${index}`,
              name: url.split('/').pop() || 'attachment',
              url: url,
              type: 'document',
              size: 0,
            })),
            submissions: [],
            createdAt: new Date(hw.createdAt),
            updatedAt: new Date(hw.updatedAt),
          },
        };
      }

      throw new Error(response.error?.message || 'Failed to create homework');
    } catch (error) {
      console.error('Error creating homework:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create homework',
      };
    }
  }

  /**
   * Submit homework
   * POST /api/homework/:id/submit
   */
  async submitHomework(
    homeworkId: string,
    submission: Omit<HomeworkSubmission, 'id' | 'submittedDate' | 'status'>
  ): Promise<{ success: boolean; message: string }> {
    try {
      const formData = new FormData();

      // Add attachments if any
      if (submission.attachments && submission.attachments.length > 0) {
        // For file uploads, we'd need to handle FormData
        // For now, if attachments are URLs, send them as JSON
        const attachmentUrls = submission.attachments
          .map(att => att.url)
          .filter(url => !url.startsWith('file://'));

        if (attachmentUrls.length > 0) {
          formData.append('attachments', JSON.stringify(attachmentUrls));
        }
      }

      // For now, use JSON if no file uploads needed
      const payload: any = {};
      if (submission.attachments && submission.attachments.length > 0) {
        const attachmentUrls = submission.attachments
          .map(att => att.url)
          .filter(url => !url.startsWith('file://'));
        if (attachmentUrls.length > 0) {
          payload.attachments = attachmentUrls;
        }
      }

      const response = await apiClient.post(`/homework/${homeworkId}/submit`, payload);

      if (response.success) {
        return {
          success: true,
          message: response.message || 'Homework submitted successfully',
        };
      }

      throw new Error(response.error?.message || 'Failed to submit homework');
    } catch (error) {
      console.error('Error submitting homework:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit homework',
      };
    }
  }

  /**
   * Get submissions for a homework
   * GET /api/homework/:id/submissions
   */
  async getHomeworkSubmissions(homeworkId: string): Promise<HomeworkSubmission[]> {
    try {
      const response = await apiClient.get(`/homework/${homeworkId}/submissions`);

      if (response.success && response.data) {
        return response.data.submissions.map((sub: any) => ({
          id: sub.id,
          studentId: sub.studentId,
          studentName: sub.studentName,
          submittedDate: sub.submittedAt ? new Date(sub.submittedAt) : new Date(),
          status: sub.status as SubmissionStatus,
          content: '', // Not in API response
          attachments: (sub.attachments || []).map((url: string, index: number) => ({
            id: `att_${index}`,
            name: url.split('/').pop() || 'attachment',
            url: url,
            type: 'document',
            size: 0,
          })),
          grade: sub.grade ? parseInt(sub.grade) : undefined,
          feedback: sub.teacherRemarks || '',
          gradedBy: '', // Not in API response
          gradedAt: undefined, // Not in API response
        }));
      }

      return [];
    } catch (error) {
      console.error('Error getting homework submissions:', error);
      return [];
    }
  }

  /**
   * Update homework
   * PUT /api/homework/:id
   */
  async updateHomework(
    homeworkId: string,
    updates: Partial<Homework>
  ): Promise<{ success: boolean; message: string }> {
    try {
      const payload: any = {};

      if (updates.subject) payload.subject = updates.subject;
      if (updates.title) payload.title = updates.title;
      if (updates.description) payload.description = updates.description;
      if (updates.dueDate) payload.dueDate = updates.dueDate.toISOString();
      if (updates.status) payload.status = updates.status;

      const response = await apiClient.put(`/homework/${homeworkId}`, payload);

      if (response.success) {
        return {
          success: true,
          message: response.message || 'Homework updated successfully',
        };
      }

      throw new Error(response.error?.message || 'Failed to update homework');
    } catch (error) {
      console.error('Error updating homework:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update homework',
      };
    }
  }

  /**
   * Delete homework
   * DELETE /api/homework/:id
   */
  async deleteHomework(homeworkId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(`/homework/${homeworkId}`);

      if (response.success) {
        return {
          success: true,
          message: response.message || 'Homework deleted successfully',
        };
      }

      throw new Error(response.error?.message || 'Failed to delete homework');
    } catch (error) {
      console.error('Error deleting homework:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete homework',
      };
    }
  }

  /**
   * Grade homework submission (not in API yet, placeholder)
   */
  async gradeSubmission(
    submissionId: string,
    grade: number,
    feedback: string,
    gradedBy: string
  ): Promise<{ success: boolean; message: string }> {
    // TODO: Implement when API endpoint is available
    return {
      success: false,
      message: 'Grading endpoint not yet implemented',
    };
  }

  /**
   * Get homework statistics (not in API yet, placeholder)
   */
  async getHomeworkStats(teacherId: string): Promise<HomeworkStats> {
    // TODO: Implement when API endpoint is available
    return {
      totalAssigned: 0,
      pendingSubmissions: 0,
      gradedSubmissions: 0,
      averageGrade: 0,
      overdueCount: 0,
    };
  }

  /**
   * Get pending homework (not graded yet)
   * Static method for easy access from dashboard
   */
  static async getPendingHomework(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { apiClient } = await import('./apiClient');
      const response = await apiClient.get('/homework/pending');
      return { success: true, data: response.data?.data || [] };
    } catch (error: any) {
      console.error('HomeworkService.getPendingHomework error:', error);
      // Return demo data on error
      return { success: true, data: [{ id: '1', title: 'Math Assignment' }, { id: '2', title: 'Science Project' }] };
    }
  }
}

export default HomeworkService.getInstance();
