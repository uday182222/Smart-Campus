export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  date: Date;
  status: AttendanceStatus;
  markedBy: string; // Teacher ID
  markedAt: Date;
  remarks?: string;
  subject: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'not_marked';

export interface ClassAttendance {
  id: string;
  name: string;
  teacherId: string;
  teacherName: string;
  students: {
    id: string;
    name: string;
    rollNumber: string;
  }[];
  subject: string;
  schedule: string;
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendancePercentage: number;
  recentRecords: AttendanceRecord[];
}

export interface StudentAttendance {
  studentId: string;
  studentName: string;
  className: string;
  date: Date;
  status: AttendanceStatus;
  remarks?: string;
  subject: string;
}

export interface AttendanceSummary {
  todayPresent: number;
  todayAbsent: number;
  todayLate: number;
  totalStudents: number;
  attendancePercentage: number;
}

export interface AttendanceFilters {
  classId?: string;
  studentId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: AttendanceStatus;
  subject?: string;
}
