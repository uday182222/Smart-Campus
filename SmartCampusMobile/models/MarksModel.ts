// Marks Management Data Models

export type ExamType = 'unit_test' | 'mid_term' | 'final' | 'quarterly' | 'half_yearly' | 'annual';
export type GradeScale = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';

export interface ExamMarks {
  id: string;
  examId: string;
  examName: string;
  examType: ExamType;
  subjectId: string;
  subjectName: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  classId: string;
  className: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  grade: GradeScale;
  rank?: number;
  remarks?: string;
  enteredBy: string;
  enteredAt: Date;
  lastModifiedBy?: string;
  lastModifiedAt?: Date;
  isAbsent: boolean;
}

export interface Exam {
  id: string;
  name: string;
  type: ExamType;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  totalMarks: number;
  passingMarks: number;
  examDate: Date;
  resultDate?: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: Date;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
}

export interface MarksEntry {
  studentId: string;
  studentName: string;
  rollNumber: string;
  marksObtained: number | null;
  isAbsent: boolean;
  remarks?: string;
}

export interface GradeConfig {
  minPercentage: number;
  maxPercentage: number;
  grade: GradeScale;
  description: string;
}

export interface MarksStatistics {
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  highestMarks: number;
  lowestMarks: number;
  averageMarks: number;
  passCount: number;
  failCount: number;
  averagePercentage: number;
  passPercentage: number;
  gradeDistribution: Record<GradeScale, number>;
}

export interface StudentMarksHistory {
  studentId: string;
  studentName: string;
  rollNumber: string;
  exams: Array<{
    examId: string;
    examName: string;
    examType: ExamType;
    subjectName: string;
    marksObtained: number;
    totalMarks: number;
    percentage: number;
    grade: GradeScale;
    rank: number;
    examDate: Date;
  }>;
  overallAverage: number;
  overallPercentage: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface MarksAuditLog {
  id: string;
  examId: string;
  studentId: string;
  subjectId: string;
  previousMarks: number | null;
  newMarks: number;
  changedBy: string;
  changedAt: Date;
  reason?: string;
}

export interface BulkMarksImport {
  examId: string;
  subjectId: string;
  classId: string;
  entries: Array<{
    rollNumber: string;
    marksObtained: number;
    isAbsent: boolean;
  }>;
}

export interface MarksAnalytics {
  examId: string;
  examName: string;
  subjectName: string;
  className: string;
  statistics: MarksStatistics;
  topPerformers: Array<{
    studentId: string;
    studentName: string;
    marksObtained: number;
    percentage: number;
    rank: number;
  }>;
  weakStudents: Array<{
    studentId: string;
    studentName: string;
    marksObtained: number;
    percentage: number;
  }>;
  subjectWiseAverage: Record<string, number>;
  comparisonWithPrevious?: {
    previousExamId: string;
    previousExamName: string;
    averageChange: number;
    trend: 'improving' | 'declining' | 'stable';
  };
}

// Default Grade Configuration
export const DEFAULT_GRADE_CONFIG: GradeConfig[] = [
  { minPercentage: 90, maxPercentage: 100, grade: 'A+', description: 'Outstanding' },
  { minPercentage: 80, maxPercentage: 89, grade: 'A', description: 'Excellent' },
  { minPercentage: 70, maxPercentage: 79, grade: 'B+', description: 'Very Good' },
  { minPercentage: 60, maxPercentage: 69, grade: 'B', description: 'Good' },
  { minPercentage: 50, maxPercentage: 59, grade: 'C+', description: 'Above Average' },
  { minPercentage: 40, maxPercentage: 49, grade: 'C', description: 'Average' },
  { minPercentage: 33, maxPercentage: 39, grade: 'D', description: 'Pass' },
  { minPercentage: 0, maxPercentage: 32, grade: 'F', description: 'Fail' },
];

// Helper Functions
export const calculatePercentage = (obtained: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((obtained / total) * 100 * 100) / 100;
};

export const calculateGrade = (percentage: number, config: GradeConfig[] = DEFAULT_GRADE_CONFIG): GradeScale => {
  for (const gradeConfig of config) {
    if (percentage >= gradeConfig.minPercentage && percentage <= gradeConfig.maxPercentage) {
      return gradeConfig.grade;
    }
  }
  return 'F';
};

export const isPassingGrade = (grade: GradeScale): boolean => {
  return grade !== 'F';
};

export const getGradeColor = (grade: GradeScale): string => {
  switch (grade) {
    case 'A+':
    case 'A':
      return '#10B981'; // Green
    case 'B+':
    case 'B':
      return '#3B82F6'; // Blue
    case 'C+':
    case 'C':
      return '#F59E0B'; // Orange
    case 'D':
      return '#EF4444'; // Red
    case 'F':
      return '#DC2626'; // Dark Red
    default:
      return '#6B7280'; // Gray
  }
};

export const calculateRanks = (marksArray: ExamMarks[]): ExamMarks[] => {
  const sorted = [...marksArray]
    .filter(m => !m.isAbsent)
    .sort((a, b) => b.marksObtained - a.marksObtained);

  let currentRank = 1;
  let previousMarks = -1;
  let sameRankCount = 0;

  return marksArray.map(marks => {
    if (marks.isAbsent) {
      return { ...marks, rank: undefined };
    }

    const position = sorted.findIndex(m => m.studentId === marks.studentId);
    if (sorted[position].marksObtained === previousMarks) {
      sameRankCount++;
      return { ...marks, rank: currentRank };
    } else {
      currentRank += sameRankCount;
      sameRankCount = 1;
      previousMarks = sorted[position].marksObtained;
      return { ...marks, rank: currentRank };
    }
  });
};




