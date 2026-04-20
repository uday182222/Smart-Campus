import { AttendanceRecord, AttendanceStats, ClassAttendance, StudentAttendance } from '../models/AttendanceModel';
import { apiClient } from './apiClient';

export class AttendanceService {
  private static instance: AttendanceService;

  static getInstance(): AttendanceService {
    if (!AttendanceService.instance) {
      AttendanceService.instance = new AttendanceService();
    }
    return AttendanceService.instance;
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
   * Get classes for a teacher
   * Note: This still uses mock data as there's no backend endpoint yet
   */
  async getClassesForTeacher(teacherId: string): Promise<ClassAttendance[]> {
    // TODO: Implement when backend endpoint is available
    // For now, return empty array or use cached data
    return [];
  }

  /**
   * Get attendance for a specific class and date
   * GET /api/attendance/:classId/:date
   */
  async getClassAttendance(classId: string, date: Date): Promise<AttendanceRecord[]> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await apiClient.get(`/attendance/${classId}/${dateStr}`);

      if (response.success && response.data) {
        // Transform API response to AttendanceRecord format
        return response.data.attendance.map((item: any) => ({
          id: item.id || '',
          studentId: item.studentId,
          studentName: item.studentName,
          classId: item.classId,
          className: item.className,
          date: new Date(item.date),
          status: item.status || 'not_marked',
          markedBy: item.markedBy || '',
          markedAt: item.markedAt ? new Date(item.markedAt) : new Date(),
          remarks: item.remarks || '',
          subject: '', // Not in API response, can be added later
        }));
      }

      return [];
    } catch (error) {
      console.error('Error getting class attendance:', error);
      throw error;
    }
  }

  /**
   * Mark attendance for multiple students (bulk)
   * POST /api/attendance
   */
  async markAttendance(attendanceRecords: Omit<AttendanceRecord, 'id' | 'markedAt'>[]): Promise<{ success: boolean; message: string }> {
    try {
      if (attendanceRecords.length === 0) {
        throw new Error('No attendance records provided');
      }

      // Get classId and date from first record (assuming all are for same class/date)
      const firstRecord = attendanceRecords[0];
      const classId = firstRecord.classId;
      const date = firstRecord.date.toISOString().split('T')[0];

      // Prepare bulk attendance payload
      const bulkPayload = {
        classId: classId,
        date: date,
        attendance: attendanceRecords.map(record => ({
          studentId: record.studentId,
          status: record.status,
          remarks: record.remarks || undefined,
        })),
      };

      const response = await apiClient.post('/attendance', bulkPayload);

      if (response.success) {
        return {
          success: true,
          message: response.message || 'Attendance marked successfully',
        };
      }

      throw new Error(response.error?.message || 'Failed to mark attendance');
    } catch (error) {
      console.error('Error marking attendance:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to mark attendance',
      };
    }
  }

  /**
   * Mark single attendance record
   * POST /api/attendance
   */
  async markSingleAttendance(
    classId: string,
    studentId: string,
    date: Date,
    status: 'present' | 'absent' | 'late' | 'half_day',
    remarks?: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const payload = {
        classId: classId,
        studentId: studentId,
        date: date.toISOString().split('T')[0],
        status: status,
        remarks: remarks,
      };

      const response = await apiClient.post('/attendance', payload);

      if (response.success) {
        return {
          success: true,
          message: response.message || 'Attendance marked successfully',
          data: response.data,
        };
      }

      throw new Error(response.error?.message || 'Failed to mark attendance');
    } catch (error) {
      console.error('Error marking single attendance:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to mark attendance',
      };
    }
  }

  /**
   * Update attendance record
   * PUT /api/attendance/:id
   */
  async updateAttendance(
    recordId: string,
    updates: { status?: 'present' | 'absent' | 'late' | 'half_day'; remarks?: string }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.put(`/attendance/${recordId}`, updates);

      if (response.success) {
        return {
          success: true,
          message: response.message || 'Attendance updated successfully',
        };
      }

      throw new Error(response.error?.message || 'Failed to update attendance');
    } catch (error) {
      console.error('Error updating attendance:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update attendance',
      };
    }
  }

  /**
   * Get attendance history for a student
   * GET /api/attendance/history/:studentId
   */
  async getStudentAttendanceStats(
    studentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AttendanceStats> {
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const response = await apiClient.get(
        `/attendance/history/${studentId}?startDate=${startDateStr}&endDate=${endDateStr}`
      );

      if (response.success && response.data) {
        const stats = response.data.statistics;
        const history = response.data.history;

        return {
          totalDays: stats.total,
          presentDays: stats.present,
          absentDays: stats.absent,
          lateDays: stats.late,
          attendancePercentage: stats.attendancePercentage,
          recentRecords: history.slice(0, 10).map((record: any) => ({
            id: record.id,
            studentId: record.studentId,
            studentName: record.studentName || '',
            classId: record.classId,
            className: record.className,
            date: new Date(record.date),
            status: record.status,
            markedBy: record.markedBy || '',
            markedAt: record.markedAt ? new Date(record.markedAt) : new Date(),
            remarks: record.remarks || '',
            subject: '',
          })),
        };
      }

      // Return empty stats if no data
      return {
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        attendancePercentage: 0,
        recentRecords: [],
      };
    } catch (error) {
      console.error('Error getting student attendance stats:', error);
      // Return empty stats on error
      return {
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        attendancePercentage: 0,
        recentRecords: [],
      };
    }
  }

  /**
   * Get attendance for a parent's children
   * Uses student history endpoint for each child
   */
  async getChildrenAttendance(parentId: string, date: Date): Promise<StudentAttendance[]> {
    try {
      // TODO: Get children IDs from parent-student relationship
      // For now, this is a placeholder that would need parent-student endpoint
      // You can call getStudentAttendanceStats for each child
      return [];
    } catch (error) {
      console.error('Error getting children attendance:', error);
      return [];
    }
  }

  /**
   * Get monthly attendance report
   * Uses analytics endpoint
   */
  async getMonthlyReport(classId: string, month: number, year: number): Promise<AttendanceRecord[]> {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      // Use analytics endpoint with date range
      const response = await apiClient.get(
        `/attendance/analytics/${classId}?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
      );

      if (response.success && response.data) {
        // Get daily trend and convert to records
        // This is a simplified version - you might want to use a different endpoint
        return [];
      }

      return [];
    } catch (error) {
      console.error('Error getting monthly report:', error);
      return [];
    }
  }

  /**
   * Get class attendance analytics
   * GET /api/attendance/analytics/:classId
   */
  async getClassAnalytics(
    classId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    classStatistics: any;
    studentStatistics: any[];
    dailyTrend: any[];
    lowAttendanceStudents: any[];
  }> {
    try {
      let url = `/attendance/analytics/${classId}`;
      if (startDate && endDate) {
        url += `?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`;
      }

      const response = await apiClient.get(url);

      if (response.success && response.data) {
        return {
          classStatistics: response.data.classStatistics,
          studentStatistics: response.data.studentStatistics,
          dailyTrend: response.data.dailyTrend,
          lowAttendanceStudents: response.data.lowAttendanceStudents,
        };
      }

      throw new Error('Failed to get analytics');
    } catch (error) {
      console.error('Error getting class analytics:', error);
      throw error;
    }
  }

  /**
   * Get attendance summary for dashboard
   * Uses class attendance endpoint for today
   */
  async getAttendanceSummary(teacherId: string): Promise<{
    todayPresent: number;
    todayAbsent: number;
    todayLate: number;
    totalStudents: number;
    attendancePercentage: number;
  }> {
    try {
      // TODO: Get teacher's classes first, then get today's attendance for each
      // For now, return placeholder data
      // This would require a "get teacher classes" endpoint
      return {
        todayPresent: 0,
        todayAbsent: 0,
        todayLate: 0,
        totalStudents: 0,
        attendancePercentage: 0,
      };
    } catch (error) {
      console.error('Error getting attendance summary:', error);
      return {
        todayPresent: 0,
        todayAbsent: 0,
        todayLate: 0,
        totalStudents: 0,
        attendancePercentage: 0,
      };
    }
  }

  /**
   * Get pending attendance for today
   * Classes where attendance hasn't been marked yet
   */
  static async getPendingAttendance(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const response = await apiClient.get('/attendance/pending');
      return { success: true, data: response.data?.data || [] };
    } catch (error: any) {
      console.error('AttendanceService.getPendingAttendance error:', error);
      // Return demo data on error
      return { success: true, data: [{ classId: '1', className: 'Class 10-A' }] };
    }
  }
}

export default AttendanceService.getInstance();
