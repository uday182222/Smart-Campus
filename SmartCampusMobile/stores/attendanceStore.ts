// @ts-nocheck
import { create } from 'zustand';
import { ClassAttendance, AttendanceRecord, AttendanceSummary, AttendanceStatus } from '../models/AttendanceModel';
import apiClient from '../services/apiClient';

interface AttendanceState {
  // Data
  classes: ClassAttendance[];
  selectedClass: ClassAttendance | null;
  attendanceRecords: AttendanceRecord[];
  summary: AttendanceSummary | null;
  selectedDate: Date;
  pendingChanges: Map<string, AttendanceStatus>;

  // UI State
  loading: boolean;
  saving: boolean;
  refreshing: boolean;
  error: string | null;

  // Actions
  setClasses: (classes: ClassAttendance[]) => void;
  setSelectedClass: (classItem: ClassAttendance | null) => void;
  setAttendanceRecords: (records: AttendanceRecord[]) => void;
  setSummary: (summary: AttendanceSummary | null) => void;
  setSelectedDate: (date: Date) => void;
  setPendingChanges: (changes: Map<string, AttendanceStatus>) => void;
  updatePendingChange: (studentId: string, status: AttendanceStatus) => void;
  clearPendingChanges: () => void;

  // Async Actions
  loadClasses: (teacherId: string) => Promise<void>;
  loadClassAttendance: (classId: string, date: Date) => Promise<void>;
  loadSummary: (teacherId: string) => Promise<void>;
  markAttendance: (studentId: string, status: AttendanceStatus) => void;
  saveAttendance: (classId: string, date: Date) => Promise<{ success: boolean; message: string }>;
  refresh: (teacherId: string, classId: string, date: Date) => Promise<void>;
  reset: () => void;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  // Initial State
  classes: [],
  selectedClass: null,
  attendanceRecords: [],
  summary: null,
  selectedDate: new Date(),
  pendingChanges: new Map(),
  loading: false,
  saving: false,
  refreshing: false,
  error: null,

  // Setters
  setClasses: (classes) => set({ classes }),
  setSelectedClass: (classItem) => set({ selectedClass: classItem }),
  setAttendanceRecords: (records) => set({ attendanceRecords: records }),
  setSummary: (summary) => set({ summary }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setPendingChanges: (changes) => set({ pendingChanges: changes }),
  
  updatePendingChange: (studentId, status) => {
    const { pendingChanges } = get();
    const newChanges = new Map(pendingChanges);
    newChanges.set(studentId, status);
    set({ pendingChanges: newChanges });
  },

  clearPendingChanges: () => set({ pendingChanges: new Map() }),

  // Async Actions
  loadClasses: async (_teacherId: string) => {
    try {
      set({ loading: true, error: null });
      const res = await apiClient.get<{ data: { classes: any[] } }>('/classes/today');
      const classList = (res as any).data?.classes ?? [];
      const classes: ClassAttendance[] = await Promise.all(
        classList.map(async (c: any) => {
          try {
            const r = await apiClient.get<{ data: { class: any; students: any[] } }>(`/classes/${c.id}`);
            const d = (r as any).data;
            const cls = d?.class ?? c;
            const students = (d?.students ?? []).map((s: any) => ({
              id: s.id,
              name: s.name ?? s.email ?? 'Student',
              rollNumber: s.email ?? s.id ?? '',
            }));
            return {
              id: cls.id,
              name: (cls.name ?? '') + (cls.section ? ` ${cls.section}` : ''),
              teacherId: '',
              teacherName: '',
              students,
              subject: '',
              schedule: '',
            };
          } catch {
            return {
              id: c.id,
              name: c.name + (c.section ? ` ${c.section}` : ''),
              teacherId: '',
              teacherName: '',
              students: [],
              subject: '',
              schedule: '',
            };
          }
        })
      );
      set({ classes, loading: false });
      if (classes.length > 0 && !get().selectedClass) {
        get().setSelectedClass(classes[0]);
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to load classes', loading: false });
      console.error('Error loading classes:', error);
    }
  },

  loadClassAttendance: async (classId: string, date: Date) => {
    try {
      set({ loading: true, error: null });
      const dateStr = date.toISOString().split('T')[0];
      const res = await apiClient.get<{ data: { attendance: any[]; summary?: any } }>(`/attendance/${classId}/${dateStr}`);
      const list = (res as any).data?.attendance ?? [];
      const records: AttendanceRecord[] = list.map((a: any) => ({
        id: a.id ?? a.studentId,
        studentId: a.studentId,
        studentName: a.studentName ?? a.student?.name ?? 'Student',
        classId,
        className: (res as any).data?.className ?? '',
        date: new Date(a.date ?? dateStr),
        status: (a.status === 'half_day' ? 'present' : a.status) as AttendanceStatus,
        markedBy: a.markedBy ?? '',
        markedAt: a.markedAt ? new Date(a.markedAt) : new Date(),
        remarks: a.remarks,
        subject: '',
      }));
      const sum = (res as any).data?.summary;
      const summary: AttendanceSummary | null = sum
        ? {
            todayPresent: sum.present ?? 0,
            todayAbsent: sum.absent ?? 0,
            todayLate: sum.late ?? 0,
            totalStudents: sum.total ?? 0,
            attendancePercentage: sum.total ? Math.round(((sum.present ?? 0) / sum.total) * 100) : 0,
          }
        : null;
      set({
        attendanceRecords: records,
        selectedDate: date,
        pendingChanges: new Map(),
        summary: summary ?? get().summary,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to load attendance', loading: false });
      console.error('Error loading class attendance:', error);
    }
  },

  loadSummary: async (_teacherId: string) => {
    // Summary is set from loadClassAttendance when loading a class; no separate endpoint
  },

  markAttendance: (studentId: string, status: AttendanceStatus) => {
    get().updatePendingChange(studentId, status);
    
    // Optimistically update UI
    const { attendanceRecords } = get();
    const updatedRecords = attendanceRecords.map(record =>
      record.studentId === studentId
        ? { ...record, status }
        : record
    );
    set({ attendanceRecords: updatedRecords });
  },

  saveAttendance: async (classId: string, date: Date, teacherId: string, subject: string, students: Array<{id: string, name: string}>) => {
    const { pendingChanges } = get();
    
    if (pendingChanges.size === 0) {
      return { success: false, message: 'No changes to save' };
    }

    try {
      set({ saving: true, error: null });

      const dateStr = date.toISOString().split('T')[0];
      const attendance = Array.from(pendingChanges.entries()).map(([studentId, status]) => ({
        studentId,
        status: status === 'excused' ? 'present' : status,
        remarks: undefined,
      }));

      await apiClient.post('/attendance', {
        classId,
        date: dateStr,
        attendance,
      });
      const result = { success: true, message: 'Saved' };

      if (result.success) {
        // Clear pending changes and reload
        set({ pendingChanges: new Map() });
        await get().loadClassAttendance(classId, date);
        await get().loadSummary(teacherId);
      }

      set({ saving: false });
      return result;
    } catch (error: any) {
      set({ 
        saving: false, 
        error: error.message || 'Failed to save attendance' 
      });
      return { success: false, message: error.message || 'Failed to save attendance' };
    }
  },

  refresh: async (teacherId: string, classId: string, date: Date) => {
    try {
      set({ refreshing: true });
      await Promise.all([
        get().loadClasses(teacherId),
        get().loadClassAttendance(classId, date),
        get().loadSummary(teacherId),
      ]);
      set({ refreshing: false });
    } catch (error: any) {
      set({ 
        refreshing: false, 
        error: error.message || 'Failed to refresh' 
      });
    }
  },

  reset: () => set({
    classes: [],
    selectedClass: null,
    attendanceRecords: [],
    summary: null,
    selectedDate: new Date(),
    pendingChanges: new Map(),
    loading: false,
    saving: false,
    refreshing: false,
    error: null,
  }),
}));

