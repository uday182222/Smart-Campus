// Homework Management Data Models

export type HomeworkStatus = 'draft' | 'assigned' | 'submitted' | 'graded' | 'overdue' | 'returned';

export interface Homework {
  id: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  title: string;
  description: string;
  dueDate: Date;
  assignedDate: Date;
  attachments: HomeworkAttachment[];
  status: HomeworkStatus;
  totalMarks?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date; // Soft delete
  version: number; // For version history
}

export interface HomeworkAttachment {
  id: string;
  name: string;
  url: string; // S3 URL
  type: string; // 'image' | 'pdf' | 'document'
  mimeType: string;
  size: number; // In bytes
  uploadedAt: Date;
}

export interface HomeworkSubmission {
  id: string;
  homeworkId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  submittedAt: Date;
  textResponse?: string;
  attachments: HomeworkAttachment[];
  grade?: string;
  marksObtained?: number;
  teacherRemarks?: string;
  gradedAt?: Date;
  status: 'pending' | 'submitted' | 'late' | 'graded' | 'returned';
  isLate: boolean;
}

export interface HomeworkStatistics {
  homeworkId: string;
  totalStudents: number;
  submittedCount: number;
  pendingCount: number;
  lateCount: number;
  gradedCount: number;
  submissionPercentage: number;
  averageGrade?: number;
  submissionTimeline: Array<{
    date: Date;
    count: number;
  }>;
}

export type HomeworkStats = HomeworkStatistics;

export interface HomeworkFilters {
  classId?: string;
  subjectId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: HomeworkStatus;
  searchTerm?: string;
}

export interface HomeworkDraft {
  title: string;
  description: string;
  subjectId: string;
  classId: string;
  dueDate: Date;
  attachments: HomeworkAttachment[];
  savedAt: Date;
}

export interface HomeworkVersion {
  id: string;
  homeworkId: string;
  version: number;
  title: string;
  description: string;
  dueDate: Date;
  modifiedBy: string;
  modifiedAt: Date;
  changes: string[];
}

// Helper Functions

export const isHomeworkOverdue = (homework: Homework): boolean => {
  const now = new Date();
  return homework.dueDate < now && homework.status === 'assigned';
};

export const canSubmitHomework = (homework: Homework): boolean => {
  const now = new Date();
  return homework.dueDate >= now && homework.status === 'assigned';
};

export const canEditSubmission = (submission: HomeworkSubmission, homework: Homework): boolean => {
  return submission.status === 'submitted' && canSubmitHomework(homework);
};

export const getHomeworkStatusColor = (status: HomeworkStatus): string => {
  switch (status) {
    case 'draft':
      return '#6B7280'; // Gray
    case 'assigned':
      return '#3B82F6'; // Blue
    case 'submitted':
      return '#10B981'; // Green
    case 'graded':
      return '#8B5CF6'; // Purple
    case 'overdue':
      return '#EF4444'; // Red
    case 'returned':
      return '#F59E0B'; // Orange
    default:
      return '#6B7280';
  }
};

export const getSubmissionStatusColor = (status: HomeworkSubmission['status']): string => {
  switch (status) {
    case 'pending':
      return '#F59E0B'; // Orange
    case 'submitted':
      return '#3B82F6'; // Blue
    case 'late':
      return '#EF4444'; // Red
    case 'graded':
      return '#10B981'; // Green
    case 'returned':
      return '#8B5CF6'; // Purple
    default:
      return '#6B7280';
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const getFileIcon = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
  return '📎';
};

export const getDaysUntilDue = (dueDate: Date): number => {
  const now = new Date();
  const diff = dueDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const getDueDateText = (dueDate: Date): string => {
  const days = getDaysUntilDue(dueDate);
  
  if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''}`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days <= 7) return `Due in ${days} days`;
  
  return `Due on ${dueDate.toLocaleDateString()}`;
};

export const calculateSubmissionPercentage = (stats: HomeworkStatistics): number => {
  if (stats.totalStudents === 0) return 0;
  return Math.round((stats.submittedCount / stats.totalStudents) * 100);
};

export const validateHomework = (homework: Partial<Homework>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!homework.title || homework.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (homework.title && homework.title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }
  
  if (!homework.description || homework.description.trim().length === 0) {
    errors.push('Description is required');
  }
  
  if (homework.description && homework.description.length > 5000) {
    errors.push('Description must be less than 5000 characters');
  }
  
  if (!homework.subjectId) {
    errors.push('Subject is required');
  }
  
  if (!homework.classId) {
    errors.push('Class is required');
  }
  
  if (!homework.dueDate) {
    errors.push('Due date is required');
  }
  
  if (homework.dueDate && homework.dueDate < new Date()) {
    errors.push('Due date must be in the future');
  }
  
  if (homework.attachments && homework.attachments.length > 5) {
    errors.push('Maximum 5 attachments allowed');
  }
  
  if (homework.attachments) {
    const oversizedFiles = homework.attachments.filter(att => att.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      errors.push('Files must be less than 10MB each');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};