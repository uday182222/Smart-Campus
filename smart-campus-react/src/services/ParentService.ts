import { apiClient } from './apiClient';

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

class ParentService {
  async getChildren(): Promise<{ success: boolean; data: { children: ParentChild[]; total: number } }> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        data: { children: ParentChild[]; total: number };
      }>('/parent/children');

      if (response.success && response.data) {
        return {
          success: true,
          data: {
            children: response.data.children.map((child) => ({
              ...child,
              createdAt: new Date(child.createdAt),
            })),
            total: response.data.total,
          },
        };
      }

      throw new Error(response.message || 'Failed to get children');
    } catch (error: any) {
      console.error('Error getting children:', error);
      throw error;
    }
  }

  async getDashboard(studentId: string): Promise<ParentDashboardData> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        data: ParentDashboardData;
      }>(`/parent/dashboard/${studentId}`);

      if (response.success && response.data) {
        const data = response.data;
        return {
          ...data,
          statistics: {
            ...data.statistics,
            attendance: {
              ...data.statistics.attendance,
              recentRecords: data.statistics.attendance.recentRecords.map((record) => ({
                ...record,
                date: new Date(record.date),
              })),
            },
            homework: {
              ...data.statistics.homework,
              recent: data.statistics.homework.recent.map((hw) => ({
                ...hw,
                dueDate: new Date(hw.dueDate),
                submittedAt: hw.submittedAt ? new Date(hw.submittedAt) : undefined,
              })),
            },
            marks: {
              ...data.statistics.marks,
              recent: data.statistics.marks.recent.map((mark) => ({
                ...mark,
                examDate: mark.examDate ? new Date(mark.examDate) : undefined,
                enteredAt: new Date(mark.enteredAt),
              })),
            },
          },
          recentActivity: {
            ...data.recentActivity,
            notifications: data.recentActivity.notifications.map((notif) => ({
              ...notif,
              createdAt: new Date(notif.createdAt),
            })),
          },
        };
      }

      throw new Error(response.message || 'Failed to get dashboard');
    } catch (error: any) {
      console.error('Error getting dashboard:', error);
      throw error;
    }
  }
}

export const parentService = new ParentService();

