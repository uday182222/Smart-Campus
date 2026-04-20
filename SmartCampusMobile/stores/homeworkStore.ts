import { create } from 'zustand';
import { Homework, HomeworkStats, HomeworkSubmission } from '../models/HomeworkModel';
import HomeworkService from '../services/HomeworkService';

interface HomeworkState {
  // Data
  homework: Homework[];
  stats: HomeworkStats | null;
  selectedHomework: Homework | null;
  submissions: HomeworkSubmission[];
  selectedClassId: string | null;

  // UI State
  loading: boolean;
  creating: boolean;
  error: string | null;

  // Form State
  createForm: {
    title: string;
    description: string;
    subject: string;
    classId: string;
    dueDate: Date;
    attachments: string[];
  };

  // Actions
  setHomework: (homework: Homework[]) => void;
  setStats: (stats: HomeworkStats | null) => void;
  setSelectedHomework: (homework: Homework | null) => void;
  setSubmissions: (submissions: HomeworkSubmission[]) => void;
  setSelectedClassId: (classId: string | null) => void;
  updateCreateForm: (updates: Partial<HomeworkState['createForm']>) => void;
  resetCreateForm: () => void;

  // Async Actions
  loadHomework: (teacherId: string, classId?: string) => Promise<void>;
  loadStats: (teacherId: string) => Promise<void>;
  loadSubmissions: (homeworkId: string) => Promise<void>;
  createHomework: (homeworkData: {
    classId: string;
    subject: string;
    title: string;
    description: string;
    dueDate: Date;
    attachments?: string[];
  }) => Promise<{ success: boolean; message: string; homework?: Homework }>;
  updateHomework: (homeworkId: string, updates: Partial<Homework>) => Promise<{ success: boolean; message: string }>;
  deleteHomework: (homeworkId: string) => Promise<{ success: boolean; message: string }>;
  refresh: (teacherId: string, classId?: string) => Promise<void>;
  reset: () => void;
}

const initialCreateForm = {
  title: '',
  description: '',
  subject: '',
  classId: '',
  dueDate: new Date(),
  attachments: [],
};

export const useHomeworkStore = create<HomeworkState>((set, get) => ({
  // Initial State
  homework: [],
  stats: null,
  selectedHomework: null,
  submissions: [],
  selectedClassId: null,
  loading: false,
  creating: false,
  error: null,
  createForm: initialCreateForm,

  // Setters
  setHomework: (homework) => set({ homework }),
  setStats: (stats) => set({ stats }),
  setSelectedHomework: (homework) => set({ selectedHomework: homework }),
  setSubmissions: (submissions) => set({ submissions }),
  setSelectedClassId: (classId) => set({ selectedClassId: classId }),
  
  updateCreateForm: (updates) => set((state) => ({
    createForm: { ...state.createForm, ...updates }
  })),
  
  resetCreateForm: () => set({ createForm: initialCreateForm }),

  // Async Actions
  loadHomework: async (teacherId: string, classId?: string) => {
    try {
      set({ loading: true, error: null });
      
      let homeworkList: Homework[] = [];
      
      if (classId) {
        // Load homework for specific class
        homeworkList = await HomeworkService.getClassHomework(classId);
      } else {
        // Load all homework for teacher
        homeworkList = await HomeworkService.getHomeworkForTeacher(teacherId);
      }

      set({ homework: homeworkList, loading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to load homework', 
        loading: false 
      });
      console.error('Error loading homework:', error);
    }
  },

  loadStats: async (teacherId: string) => {
    try {
      const stats = await HomeworkService.getHomeworkStats(teacherId);
      set({ stats });
    } catch (error: any) {
      console.error('Error loading homework stats:', error);
      // Don't set error for stats as it's not critical
    }
  },

  loadSubmissions: async (homeworkId: string) => {
    try {
      const submissions = await HomeworkService.getHomeworkSubmissions(homeworkId);
      set({ submissions });
    } catch (error: any) {
      set({ error: error.message || 'Failed to load submissions' });
      console.error('Error loading submissions:', error);
    }
  },

  createHomework: async (homeworkData) => {
    try {
      set({ creating: true, error: null });

      const result = await HomeworkService.createHomeworkJSON(
        homeworkData.classId,
        homeworkData.subject,
        homeworkData.title,
        homeworkData.description,
        homeworkData.dueDate,
        homeworkData.attachments
      );

      if (result.success && result.homework) {
        // Add new homework to list
        set((state) => ({
          homework: [result.homework!, ...state.homework],
          creating: false,
        }));
        
        // Reset form
        get().resetCreateForm();
        
        // Reload stats
        await get().loadStats('teacher_1'); // TODO: Get actual teacher ID
        
        return result;
      }

      set({ creating: false });
      return result;
    } catch (error: any) {
      set({ 
        creating: false, 
        error: error.message || 'Failed to create homework' 
      });
      return { success: false, message: error.message || 'Failed to create homework' };
    }
  },

  updateHomework: async (homeworkId: string, updates: Partial<Homework>) => {
    try {
      set({ loading: true, error: null });

      const result = await HomeworkService.updateHomework(homeworkId, updates);

      if (result.success) {
        // Update homework in list
        set((state) => ({
          homework: state.homework.map(hw =>
            hw.id === homeworkId ? { ...hw, ...updates } : hw
          ),
          loading: false,
        }));
      } else {
        set({ loading: false });
      }

      return result;
    } catch (error: any) {
      set({ 
        loading: false, 
        error: error.message || 'Failed to update homework' 
      });
      return { success: false, message: error.message || 'Failed to update homework' };
    }
  },

  deleteHomework: async (homeworkId: string) => {
    try {
      set({ loading: true, error: null });

      const result = await HomeworkService.deleteHomework(homeworkId);

      if (result.success) {
        // Remove homework from list
        set((state) => ({
          homework: state.homework.filter(hw => hw.id !== homeworkId),
          loading: false,
        }));
      } else {
        set({ loading: false });
      }

      return result;
    } catch (error: any) {
      set({ 
        loading: false, 
        error: error.message || 'Failed to delete homework' 
      });
      return { success: false, message: error.message || 'Failed to delete homework' };
    }
  },

  refresh: async (teacherId: string, classId?: string) => {
    try {
      await Promise.all([
        get().loadHomework(teacherId, classId),
        get().loadStats(teacherId),
      ]);
    } catch (error: any) {
      set({ error: error.message || 'Failed to refresh' });
    }
  },

  reset: () => set({
    homework: [],
    stats: null,
    selectedHomework: null,
    submissions: [],
    selectedClassId: null,
    loading: false,
    creating: false,
    error: null,
    createForm: initialCreateForm,
  }),
}));

