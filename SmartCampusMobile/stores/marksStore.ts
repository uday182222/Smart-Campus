import { create } from 'zustand';
import MarksService from '../services/MarksService';
import { Marks, ExamMarks, StudentMarks } from '../services/MarksService';

interface MarksState {
  // Data
  examMarks: ExamMarks | null;
  studentMarks: StudentMarks | null;
  selectedExamId: string | null;
  selectedStudentId: string | null;

  // UI State
  loading: boolean;
  saving: boolean;
  error: string | null;

  // Form State
  marksForm: {
    examId: string;
    studentId: string;
    marksObtained: number;
    remarks: string;
  };

  // Actions
  setExamMarks: (marks: ExamMarks | null) => void;
  setStudentMarks: (marks: StudentMarks | null) => void;
  setSelectedExamId: (examId: string | null) => void;
  setSelectedStudentId: (studentId: string | null) => void;
  updateMarksForm: (updates: Partial<MarksState['marksForm']>) => void;
  resetMarksForm: () => void;

  // Async Actions
  loadExamMarks: (examId: string) => Promise<void>;
  loadStudentMarks: (studentId: string, examId?: string, subject?: string) => Promise<void>;
  enterMarks: (examId: string, studentId: string, marksObtained: number, remarks?: string) => Promise<{ success: boolean; message: string }>;
  updateMarks: (marksId: string, marksObtained?: number, remarks?: string) => Promise<{ success: boolean; message: string }>;
  refresh: (examId?: string, studentId?: string) => Promise<void>;
  reset: () => void;
}

const initialMarksForm = {
  examId: '',
  studentId: '',
  marksObtained: 0,
  remarks: '',
};

export const useMarksStore = create<MarksState>((set, get) => ({
  // Initial State
  examMarks: null,
  studentMarks: null,
  selectedExamId: null,
  selectedStudentId: null,
  loading: false,
  saving: false,
  error: null,
  marksForm: initialMarksForm,

  // Setters
  setExamMarks: (marks) => set({ examMarks: marks }),
  setStudentMarks: (marks) => set({ studentMarks: marks }),
  setSelectedExamId: (examId) => set({ selectedExamId: examId }),
  setSelectedStudentId: (studentId) => set({ selectedStudentId: studentId }),
  
  updateMarksForm: (updates) => set((state) => ({
    marksForm: { ...state.marksForm, ...updates }
  })),
  
  resetMarksForm: () => set({ marksForm: initialMarksForm }),

  // Async Actions
  loadExamMarks: async (examId: string) => {
    try {
      set({ loading: true, error: null });
      const marks = await MarksService.getExamMarks(examId);
      set({ examMarks: marks, selectedExamId: examId, loading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to load exam marks', 
        loading: false 
      });
      console.error('Error loading exam marks:', error);
    }
  },

  loadStudentMarks: async (studentId: string, examId?: string, subject?: string) => {
    try {
      set({ loading: true, error: null });
      const marks = await MarksService.getStudentMarks(studentId, examId, subject);
      set({ studentMarks: marks, selectedStudentId: studentId, loading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to load student marks', 
        loading: false 
      });
      console.error('Error loading student marks:', error);
    }
  },

  enterMarks: async (examId: string, studentId: string, marksObtained: number, remarks?: string) => {
    try {
      set({ saving: true, error: null });

      const result = await MarksService.enterMarks(examId, studentId, marksObtained, remarks);

      if (result.success) {
        // Reload exam marks if we're viewing that exam
        if (get().selectedExamId === examId) {
          await get().loadExamMarks(examId);
        }
        
        // Reload student marks if we're viewing that student
        if (get().selectedStudentId === studentId) {
          await get().loadStudentMarks(studentId);
        }

        // Reset form
        get().resetMarksForm();
      }

      set({ saving: false });
      return result;
    } catch (error: any) {
      set({ 
        saving: false, 
        error: error.message || 'Failed to enter marks' 
      });
      return { success: false, message: error.message || 'Failed to enter marks' };
    }
  },

  updateMarks: async (marksId: string, marksObtained?: number, remarks?: string) => {
    try {
      set({ saving: true, error: null });

      const updates: { marksObtained?: number; remarks?: string } = {};
      if (marksObtained !== undefined) updates.marksObtained = marksObtained;
      if (remarks !== undefined) updates.remarks = remarks;

      const result = await MarksService.updateMarks(marksId, updates);

      if (result.success) {
        // Reload relevant data
        if (get().selectedExamId) {
          await get().loadExamMarks(get().selectedExamId);
        }
        if (get().selectedStudentId) {
          await get().loadStudentMarks(get().selectedStudentId);
        }
      }

      set({ saving: false });
      return result;
    } catch (error: any) {
      set({ 
        saving: false, 
        error: error.message || 'Failed to update marks' 
      });
      return { success: false, message: error.message || 'Failed to update marks' };
    }
  },

  refresh: async (examId?: string, studentId?: string) => {
    try {
      const promises: Promise<void>[] = [];
      
      if (examId) {
        promises.push(get().loadExamMarks(examId));
      }
      
      if (studentId) {
        promises.push(get().loadStudentMarks(studentId));
      }

      await Promise.all(promises);
    } catch (error: any) {
      set({ error: error.message || 'Failed to refresh' });
    }
  },

  reset: () => set({
    examMarks: null,
    studentMarks: null,
    selectedExamId: null,
    selectedStudentId: null,
    loading: false,
    saving: false,
    error: null,
    marksForm: initialMarksForm,
  }),
}));

