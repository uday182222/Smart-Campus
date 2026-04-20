/**
 * Smart Campus - Class Service
 * Handles class-related API calls
 */

import apiClient from './apiClient';

export interface ClassItem {
  id: string;
  name: string;
  grade: string;
  section: string;
  studentCount: number;
  teacherId?: string;
  schoolId: string;
}

export interface ScheduleItem {
  id: string;
  classId: string;
  className: string;
  subject: string;
  time: string;
  duration: number;
  room: string;
  dayOfWeek: number;
}

interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export const ClassService = {
  /**
   * Get all classes for teacher
   */
  getClasses: async (): Promise<ServiceResponse<ClassItem[]>> => {
    try {
      const response = await apiClient.get('/classes');
      return { success: true, data: response.data.data || response.data };
    } catch (error: any) {
      console.error('ClassService.getClasses error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  /**
   * Get today's classes for teacher
   */
  getTodayClasses: async (): Promise<ServiceResponse<ScheduleItem[]>> => {
    try {
      const response = await apiClient.get('/classes/today');
      return { success: true, data: response.data.data || response.data };
    } catch (error: any) {
      console.error('ClassService.getTodayClasses error:', error);
      // Return demo data on error
      return { 
        success: true, 
        data: [
          { id: '1', classId: '1', className: 'Class 10-A', subject: 'Mathematics', time: '8:00 AM', duration: 45, room: 'Room 101', dayOfWeek: new Date().getDay() },
          { id: '2', classId: '2', className: 'Class 10-B', subject: 'Physics', time: '9:30 AM', duration: 45, room: 'Lab 1', dayOfWeek: new Date().getDay() },
          { id: '3', classId: '3', className: 'Class 9-A', subject: 'Mathematics', time: '11:00 AM', duration: 45, room: 'Room 101', dayOfWeek: new Date().getDay() },
          { id: '4', classId: '4', className: 'Class 9-B', subject: 'Physics', time: '2:00 PM', duration: 45, room: 'Lab 2', dayOfWeek: new Date().getDay() },
        ]
      };
    }
  },

  /**
   * Get total students count
   */
  getTotalStudents: async (): Promise<ServiceResponse<number>> => {
    try {
      const response = await apiClient.get('/classes/students/count');
      return { success: true, data: response.data.data || response.data.count || 0 };
    } catch (error: any) {
      console.error('ClassService.getTotalStudents error:', error);
      // Return demo data on error
      return { success: true, data: 125 };
    }
  },

  /**
   * Get students in a specific class
   */
  getStudentsByClass: async (classId: string): Promise<ServiceResponse<any[]>> => {
    try {
      const response = await apiClient.get(`/classes/${classId}/students`);
      return { success: true, data: response.data?.data ?? response.data ?? [] };
    } catch (error: any) {
      console.error('ClassService.getStudentsByClass error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  /**
   * Get teacher's classes (GET /teacher/classes)
   */
  getTeacherClasses: async (): Promise<ServiceResponse<any[]>> => {
    try {
      const response = await apiClient.get('/teacher/classes');
      const data = (response as any)?.data ?? response;
      const list = Array.isArray(data) ? data : data?.data ?? [];
      return { success: true, data: list };
    } catch (error: any) {
      console.error('ClassService.getTeacherClasses error:', error);
      return { success: false, error: error?.message, data: [] };
    }
  },

  /**
   * Get students in a class for teacher (GET /teacher/classes/:classId/students)
   */
  getTeacherClassStudents: async (classId: string): Promise<ServiceResponse<any[]>> => {
    try {
      const response = await apiClient.get(`/teacher/classes/${classId}/students`);
      const data = (response as any)?.data ?? response;
      const list = Array.isArray(data) ? data : data?.data ?? [];
      return { success: true, data: list };
    } catch (error: any) {
      console.error('ClassService.getTeacherClassStudents error:', error);
      return { success: false, error: error?.message, data: [] };
    }
  },

  /**
   * Get class details
   */
  getClassDetails: async (classId: string): Promise<ServiceResponse<ClassItem>> => {
    try {
      const response = await apiClient.get(`/classes/${classId}`);
      return { success: true, data: response.data.data || response.data };
    } catch (error: any) {
      console.error('ClassService.getClassDetails error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get schedule for a specific day
   */
  getScheduleByDay: async (dayOfWeek: number): Promise<ServiceResponse<ScheduleItem[]>> => {
    try {
      const response = await apiClient.get(`/schedule/day/${dayOfWeek}`);
      return { success: true, data: response.data.data || response.data };
    } catch (error: any) {
      console.error('ClassService.getScheduleByDay error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  /**
   * Get weekly schedule
   */
  getWeeklySchedule: async (): Promise<ServiceResponse<ScheduleItem[]>> => {
    try {
      const response = await apiClient.get('/schedule/weekly');
      return { success: true, data: response.data.data || response.data };
    } catch (error: any) {
      console.error('ClassService.getWeeklySchedule error:', error);
      return { success: false, error: error.message, data: [] };
    }
  },
};

export default ClassService;

