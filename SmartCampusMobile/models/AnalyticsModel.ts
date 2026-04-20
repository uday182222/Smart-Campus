export interface AnalyticsData {
  period: string;
  startDate: Date;
  endDate: Date;
  metrics: {
    attendance: AttendanceMetrics;
    academic: AcademicMetrics;
    financial: FinancialMetrics;
    communication: CommunicationMetrics;
    transport: TransportMetrics;
    engagement: EngagementMetrics;
  };
  trends: {
    attendance: TrendData[];
    performance: TrendData[];
    revenue: TrendData[];
    engagement: TrendData[];
  };
  insights: AnalyticsInsight[];
  generatedAt: Date;
}

export interface AttendanceMetrics {
  totalStudents: number;
  averageAttendance: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendanceByClass: ClassAttendanceData[];
  attendanceBySubject: SubjectAttendanceData[];
  topAbsentStudents: StudentAttendanceData[];
  attendanceTrend: number;
}

export interface AcademicMetrics {
  totalAssignments: number;
  completedAssignments: number;
  averageGrade: number;
  gradeDistribution: GradeDistribution[];
  subjectPerformance: SubjectPerformance[];
  topPerformers: StudentPerformance[];
  strugglingStudents: StudentPerformance[];
  homeworkCompletionRate: number;
}

export interface FinancialMetrics {
  totalRevenue: number;
  collectedFees: number;
  pendingFees: number;
  overdueFees: number;
  collectionRate: number;
  revenueByMonth: MonthlyRevenue[];
  feeCategories: FeeCategoryData[];
  paymentMethods: PaymentMethodData[];
}

export interface CommunicationMetrics {
  totalMessages: number;
  responseRate: number;
  averageResponseTime: number;
  messagesByType: MessageTypeData[];
  activeUsers: number;
  engagementScore: number;
}

export interface TransportMetrics {
  totalRoutes: number;
  activeRoutes: number;
  onTimePercentage: number;
  averageDelay: number;
  routeUtilization: RouteUtilization[];
  safetyIncidents: number;
}

export interface EngagementMetrics {
  appUsage: AppUsageData;
  featureUsage: FeatureUsageData[];
  userSatisfaction: number;
  activeUsers: number;
  sessionDuration: number;
}

export interface TrendData {
  date: Date;
  value: number;
  label?: string;
}

export interface ClassAttendanceData {
  classId: string;
  className: string;
  totalStudents: number;
  averageAttendance: number;
  attendanceRate: number;
}

export interface SubjectAttendanceData {
  subject: string;
  totalClasses: number;
  averageAttendance: number;
  attendanceRate: number;
}

export interface StudentAttendanceData {
  studentId: string;
  studentName: string;
  className: string;
  attendanceRate: number;
  absentDays: number;
}

export interface GradeDistribution {
  grade: string;
  count: number;
  percentage: number;
}

export interface SubjectPerformance {
  subject: string;
  averageGrade: number;
  totalStudents: number;
  passRate: number;
}

export interface StudentPerformance {
  studentId: string;
  studentName: string;
  className: string;
  averageGrade: number;
  totalAssignments: number;
  completedAssignments: number;
}

export interface MonthlyRevenue {
  month: string;
  year: number;
  amount: number;
  target: number;
}

export interface FeeCategoryData {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface PaymentMethodData {
  method: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface MessageTypeData {
  type: string;
  count: number;
  percentage: number;
}

export interface RouteUtilization {
  routeId: string;
  routeName: string;
  capacity: number;
  utilized: number;
  utilizationRate: number;
}

export interface AppUsageData {
  totalSessions: number;
  averageSessionDuration: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
}

export interface FeatureUsageData {
  feature: string;
  usageCount: number;
  uniqueUsers: number;
  averageUsageTime: number;
}

export interface AnalyticsInsight {
  id: string;
  type: 'positive' | 'negative' | 'neutral' | 'recommendation';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  category: string;
  actionable: boolean;
  actionText?: string;
  actionUrl?: string;
}

export interface AnalyticsFilters {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate?: Date;
  endDate?: Date;
  classIds?: string[];
  subjectIds?: string[];
  studentIds?: string[];
  includeInactive?: boolean;
}
