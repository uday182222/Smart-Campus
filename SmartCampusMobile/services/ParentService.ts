import { apiClient } from './apiClient';

/**
 * Parent Service
 * Handles all parent-related API calls using the centralized apiClient
 */

export interface ParentChild {
  id: string;
  name: string;
  email: string;
  photo?: string;
  role: string;
  status: string;
  relationship: string;
  isPrimary: boolean;
  school: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  createdAt: Date;
}

export interface ParentDashboardData {
  student: {
    id: string;
    name: string;
    email: string;
    photo?: string;
    school: {
      id: string;
      name: string;
      logoUrl?: string;
    };
    relationship: string;
    isPrimary: boolean;
  };
  statistics: {
    attendance: {
      totalDays: number;
      presentDays: number;
      absentDays: number;
      attendancePercentage: number;
      recentRecords: Array<{
        id: string;
        date: Date;
        status: string;
        remarks?: string;
        markedBy: string;
      }>;
    };
    homework: {
      total: number;
      pending: number;
      submitted: number;
      recent: Array<{
        id: string;
        title: string;
        subject: string;
        dueDate: Date;
        status: string;
        submittedAt?: Date;
        teacher: {
          id: string;
          name: string;
          photo?: string;
        };
        class: {
          id: string;
          name: string;
          section: string;
        };
      }>;
    };
    marks: {
      totalExams: number;
      averageMarks: number;
      averagePercentage: number;
      passed: number;
      failed: number;
      recent: Array<{
        id: string;
        examName: string;
        subject: string;
        marksObtained: number;
        maxMarks: number;
        percentage: string;
        status: string;
        remarks?: string;
        examDate?: Date;
        enteredAt: Date;
      }>;
    };
  };
  recentActivity: {
    notifications: Array<{
      id: string;
      title: string;
      message: string;
      type: string;
      read: boolean;
      createdAt: Date;
    }>;
  };
}

export class ParentService {
  private static instance: ParentService;

  static getInstance(): ParentService {
    if (!ParentService.instance) {
      ParentService.instance = new ParentService();
    }
    return ParentService.instance;
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
   * Get all children for the parent
   * GET /api/parent/children
   */
  async getChildren(): Promise<{ success: boolean; data: { children: ParentChild[]; total: number } }> {
    try {
      const response = await apiClient.get<any>('/parent/children');
      const data = response?.data ?? response;
      const list = Array.isArray(data?.children) ? data.children : [];
      return {
        success: true,
        data: {
          children: list.map((child: any) => ({
            id: child.id ?? child.studentId,
            name: child.name ?? 'Child',
            email: child.email ?? '',
            photo: child.avatarUrl ?? child.photo,
            role: 'STUDENT',
            status: 'ACTIVE',
            relationship: child.relationship ?? 'Child',
            isPrimary: child.isPrimary ?? false,
            school: child.school ?? { id: '', name: '', logoUrl: '' },
            createdAt: child.createdAt ? new Date(child.createdAt) : new Date(),
          })),
          total: list.length,
        },
      };
    } catch (error: any) {
      console.error('Error getting children:', error);
      return { success: false, data: { children: [], total: 0 } };
    }
  }

  /**
   * Get dashboard data for a specific student
   * GET /api/parent/dashboard/:studentId
   */
  async getDashboard(studentId: string): Promise<ParentDashboardData | any> {
    try {
      const response = await apiClient.get<any>(`/parent/dashboard/${studentId}`);
      const data = response?.data ?? response;
      if (!data) throw new Error('No dashboard data');
      return data;
    } catch (error: any) {
      console.error('Error getting dashboard:', error);
      throw error;
    }
  }
}

export default ParentService.getInstance();

