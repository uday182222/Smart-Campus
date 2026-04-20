/**
 * Analytics Service
 * Handles all analytics-related API calls
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api/v1' 
  : 'https://your-production-api.com/api/v1';

export interface AttendanceAnalytics {
  school: {
    id: string;
    name: string;
  };
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalRecords: number;
    uniqueStudents: number;
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    attendanceRate: number;
  };
  byDate: Array<{
    date: string;
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    total: number;
    attendanceRate: number;
  }>;
  byClass: Array<{
    className: string;
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    total: number;
    rate: number;
  }>;
}

export interface AcademicAnalytics {
  school: {
    id: string;
    name: string;
  };
  summary: {
    totalExams: number;
    totalMarks: number;
    averageMarks: number;
    averagePercentage: number;
    passed: number;
    failed: number;
    passRate: number;
  };
  bySubject: Array<{
    subject: string;
    total: number;
    passed: number;
    failed: number;
    average: number;
    passRate: number;
  }>;
  byClass: Array<{
    className: string;
    total: number;
    passed: number;
    failed: number;
    average: number;
    passRate: number;
  }>;
}

export interface FinancialAnalytics {
  school: {
    id: string;
  name: string;
  };
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    pendingPayments: number;
    overduePayments: number;
    totalStudents: number;
    paidStudents: number;
    unpaidStudents: number;
  };
  byCategory: any[];
  byMonth: any[];
  message?: string;
}

class AnalyticsService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.loadToken();
  }

  /**
   * Load JWT token from storage
   */
  private async loadToken() {
    try {
      this.token = await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error loading auth token:', error);
    }
  }

  /**
   * Set authentication token
   */
  public async setToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem('authToken', token);
  }

  /**
   * Make authenticated API request
   */
  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    if (!this.token) {
      await this.loadToken();
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error?.message || 'API request failed');
    }

    return await response.json();
  }

  /**
   * Get attendance analytics for a school
   */
  async getAttendanceAnalytics(
    schoolId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      classId?: string;
    }
  ): Promise<AttendanceAnalytics> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.classId) params.append('classId', options.classId);

    const queryString = params.toString();
    const url = `/analytics/attendance/${schoolId}${queryString ? `?${queryString}` : ''}`;

    const response = await this.request(url);
    return response.data;
  }

  /**
   * Get academic analytics for a school
   */
  async getAcademicAnalytics(
    schoolId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      classId?: string;
      subject?: string;
    }
  ): Promise<AcademicAnalytics> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.classId) params.append('classId', options.classId);
    if (options?.subject) params.append('subject', options.subject);

    const queryString = params.toString();
    const url = `/analytics/academic/${schoolId}${queryString ? `?${queryString}` : ''}`;

    const response = await this.request(url);
    return response.data;
  }

  /**
   * Get financial analytics for a school
   */
  async getFinancialAnalytics(
    schoolId: string,
    options?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<FinancialAnalytics> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);

    const queryString = params.toString();
    const url = `/analytics/financial/${schoolId}${queryString ? `?${queryString}` : ''}`;

    const response = await this.request(url);
    return response.data;
  }
}

export default new AnalyticsService();
