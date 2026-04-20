import { Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { AppError, NotFoundError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';

/**
 * Analytics Controller
 * Handles analytics and reporting endpoints
 */

export const analyticsController = {
  /**
   * GET /api/analytics/attendance/:schoolId
   * Get attendance analytics for a school
   */
  async getAttendanceAnalytics(req: AuthRequest, res: Response) {
    try {
      const { schoolId } = req.params;
      const userSchoolId = req.user?.schoolId;
      const { startDate, endDate, classId } = req.query;

      if (!userSchoolId) {
        throw new ForbiddenError('School access required');
      }

      // Verify access
      if (schoolId !== userSchoolId && req.user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('You do not have access to this school');
      }

      // Verify school exists
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
      });

      if (!school) {
        throw new NotFoundError('School not found');
      }

      // Build date range
      const start = startDate ? new Date(startDate as string) : new Date(new Date().setMonth(new Date().getMonth() - 1));
      const end = endDate ? new Date(endDate as string) : new Date();

      // Build where clause
      const where: any = {
        date: {
          gte: start,
          lte: end,
        },
        class: {
          schoolId: schoolId,
        },
      };

      if (classId) {
        where.classId = classId;
      }

      // Get all attendance records
      const attendanceRecords = await prisma.attendance.findMany({
        where,
        include: {
          class: {
            select: {
              id: true,
              name: true,
              section: true,
            },
          },
          student: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Calculate statistics
      const totalRecords = attendanceRecords.length;
      const presentCount = attendanceRecords.filter((r) => r.status === 'present').length;
      const absentCount = attendanceRecords.filter((r) => r.status === 'absent').length;
      const lateCount = attendanceRecords.filter((r) => r.status === 'late').length;
      const halfDayCount = attendanceRecords.filter((r) => r.status === 'half_day').length;

      const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

      // Group by date
      const byDate: Record<string, { present: number; absent: number; late: number; halfDay: number; total: number }> = {};
      attendanceRecords.forEach((record) => {
        const dateKey = record.date.toISOString().split('T')[0];
        if (!byDate[dateKey]) {
          byDate[dateKey] = { present: 0, absent: 0, late: 0, halfDay: 0, total: 0 };
        }
        byDate[dateKey].total++;
        const status = record.status as keyof typeof byDate[string];
        if (status in byDate[dateKey]) {
          byDate[dateKey][status]++;
        }
      });

      // Group by class
      const byClass: Record<string, { present: number; absent: number; late: number; halfDay: number; total: number; rate: number }> = {};
      attendanceRecords.forEach((record) => {
        const classKey = `${record.class.name}${record.class.section ? ` ${record.class.section}` : ''}`;
        if (!byClass[classKey]) {
          byClass[classKey] = { present: 0, absent: 0, late: 0, halfDay: 0, total: 0, rate: 0 };
        }
        byClass[classKey].total++;
        const status = record.status as keyof typeof byClass[string];
        if (status in byClass[classKey]) {
          byClass[classKey][status]++;
        }
      });

      // Calculate rates for each class
      Object.keys(byClass).forEach((classKey) => {
        const classData = byClass[classKey];
        classData.rate = classData.total > 0 ? (classData.present / classData.total) * 100 : 0;
      });

      // Get unique students
      const uniqueStudents = new Set(attendanceRecords.map((r) => r.studentId)).size;

      logger.info(`Retrieved attendance analytics for school ${schoolId}`);

      res.json({
        success: true,
        data: {
          school: {
            id: school.id,
            name: school.name,
          },
          period: {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
          },
          summary: {
            totalRecords,
            uniqueStudents,
            present: presentCount,
            absent: absentCount,
            late: lateCount,
            halfDay: halfDayCount,
            attendanceRate: parseFloat(attendanceRate.toFixed(2)),
          },
          byDate: Object.entries(byDate).map(([date, stats]) => ({
            date,
            ...stats,
            attendanceRate: stats.total > 0 ? parseFloat(((stats.present / stats.total) * 100).toFixed(2)) : 0,
          })),
          byClass: Object.entries(byClass).map(([className, stats]) => ({
            className,
            ...stats,
          })),
        },
      });
    } catch (error) {
      logger.error('Error getting attendance analytics:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  },

  /**
   * GET /api/analytics/academic/:schoolId
   * Get academic performance analytics for a school
   */
  async getAcademicAnalytics(req: AuthRequest, res: Response) {
    try {
      const { schoolId } = req.params;
      const userSchoolId = req.user?.schoolId;
      const { startDate, endDate, classId, subject } = req.query;

      if (!userSchoolId) {
        throw new ForbiddenError('School access required');
      }

      // Verify access
      if (schoolId !== userSchoolId && req.user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('You do not have access to this school');
      }

      // Verify school exists
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
      });

      if (!school) {
        throw new NotFoundError('School not found');
      }

      // Build where clause for exams
      const examWhere: any = {
        class: {
          schoolId: schoolId,
        },
      };

      if (classId) {
        examWhere.classId = classId;
      }

      if (startDate || endDate) {
        examWhere.date = {};
        if (startDate) examWhere.date.gte = new Date(startDate as string);
        if (endDate) examWhere.date.lte = new Date(endDate as string);
      }

      // Get all exams
      const exams = await prisma.exam.findMany({
        where: examWhere,
        include: {
          class: {
            select: {
              id: true,
              name: true,
              section: true,
            },
          },
        },
      });

      // Get all marks for these exams
      const examIds = exams.map((e) => e.id);
      const allMarks = examIds.length > 0 ? await prisma.marks.findMany({
        where: {
          examId: { in: examIds },
        },
        include: {
          exam: {
            select: {
              id: true,
              name: true,
              subject: true,
              maxMarks: true,
              passingMarks: true,
            },
          },
        },
      }) : [];

      // Map marks to exams
      const examsWithMarks = exams.map((exam) => ({
        ...exam,
        marks: allMarks.filter((mark) => mark.examId === exam.id),
      }));

      // Filter by subject if provided
      let filteredExams = examsWithMarks;
      if (subject) {
        filteredExams = examsWithMarks.filter((exam) => exam.subject === subject);
      }

      // Calculate statistics
      const totalExams = filteredExams.length;
      const totalMarks = filteredExams.reduce((sum, exam) => sum + exam.marks.length, 0);

      let totalMarksObtained = 0;
      let totalMaxMarks = 0;
      let passedCount = 0;
      let failedCount = 0;

      filteredExams.forEach((exam) => {
        exam.marks.forEach((mark: any) => {
          totalMarksObtained += mark.marksObtained;
          totalMaxMarks += exam.maxMarks;
          if (mark.marksObtained >= exam.passingMarks) {
            passedCount++;
          } else {
            failedCount++;
          }
        });
      });

      const averageMarks = totalMarks > 0 ? totalMarksObtained / totalMarks : 0;
      const averagePercentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;
      const passRate = totalMarks > 0 ? (passedCount / totalMarks) * 100 : 0;

      // Group by subject
      const bySubject: Record<string, { total: number; passed: number; failed: number; average: number; passRate: number }> = {};
      filteredExams.forEach((exam) => {
        if (!bySubject[exam.subject]) {
          bySubject[exam.subject] = { total: 0, passed: 0, failed: 0, average: 0, passRate: 0 };
        }
        exam.marks.forEach((mark: any) => {
          bySubject[exam.subject].total++;
          if (mark.marksObtained >= exam.passingMarks) {
            bySubject[exam.subject].passed++;
          } else {
            bySubject[exam.subject].failed++;
          }
        });
      });

      // Calculate averages and pass rates for each subject
      Object.keys(bySubject).forEach((subjectKey) => {
        const subjectData = bySubject[subjectKey];
        const subjectExams = filteredExams.filter((e) => e.subject === subjectKey);
        let subjectMarksObtained = 0;
        let subjectMaxMarks = 0;
        subjectExams.forEach((exam) => {
          exam.marks.forEach((mark: any) => {
            subjectMarksObtained += mark.marksObtained;
            subjectMaxMarks += exam.maxMarks;
          });
        });
        subjectData.average = subjectData.total > 0 ? subjectMarksObtained / subjectData.total : 0;
        subjectData.passRate = subjectData.total > 0 ? (subjectData.passed / subjectData.total) * 100 : 0;
      });

      // Group by class
      const byClass: Record<string, { total: number; passed: number; failed: number; average: number; passRate: number }> = {};
      filteredExams.forEach((exam) => {
        const classKey = `${exam.class.name}${exam.class.section ? ` ${exam.class.section}` : ''}`;
        if (!byClass[classKey]) {
          byClass[classKey] = { total: 0, passed: 0, failed: 0, average: 0, passRate: 0 };
        }
        exam.marks.forEach((mark: any) => {
          byClass[classKey].total++;
          if (mark.marksObtained >= exam.passingMarks) {
            byClass[classKey].passed++;
          } else {
            byClass[classKey].failed++;
          }
        });
      });

      // Calculate averages and pass rates for each class
      Object.keys(byClass).forEach((classKey) => {
        const classData = byClass[classKey];
        const classExams = filteredExams.filter((e) => `${e.class.name}${e.class.section ? ` ${e.class.section}` : ''}` === classKey);
        let classMarksObtained = 0;
        let classMaxMarks = 0;
        classExams.forEach((exam) => {
          exam.marks.forEach((mark: any) => {
            classMarksObtained += mark.marksObtained;
            classMaxMarks += exam.maxMarks;
          });
        });
        classData.average = classData.total > 0 ? classMarksObtained / classData.total : 0;
        classData.passRate = classData.total > 0 ? (classData.passed / classData.total) * 100 : 0;
      });

      logger.info(`Retrieved academic analytics for school ${schoolId}`);

      res.json({
        success: true,
        data: {
          school: {
            id: school.id,
            name: school.name,
          },
          summary: {
            totalExams,
            totalMarks,
            averageMarks: parseFloat(averageMarks.toFixed(2)),
            averagePercentage: parseFloat(averagePercentage.toFixed(2)),
            passed: passedCount,
            failed: failedCount,
            passRate: parseFloat(passRate.toFixed(2)),
          },
          bySubject: Object.entries(bySubject).map(([subject, stats]) => ({
            subject,
            ...stats,
            average: parseFloat(stats.average.toFixed(2)),
            passRate: parseFloat(stats.passRate.toFixed(2)),
          })),
          byClass: Object.entries(byClass).map(([className, stats]) => ({
            className,
            ...stats,
            average: parseFloat(stats.average.toFixed(2)),
            passRate: parseFloat(stats.passRate.toFixed(2)),
          })),
        },
      });
    } catch (error) {
      logger.error('Error getting academic analytics:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  },

  /**
   * GET /api/analytics/financial/:schoolId
   * Get financial analytics for a school
   */
  async getFinancialAnalytics(req: AuthRequest, res: Response) {
    try {
      const { schoolId } = req.params;
      const userSchoolId = req.user?.schoolId;
      const { startDate, endDate } = req.query;

      if (!userSchoolId) {
        throw new ForbiddenError('School access required');
      }

      // Verify access
      if (schoolId !== userSchoolId && req.user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('You do not have access to this school');
      }

      // Verify school exists
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
      });

      if (!school) {
        throw new NotFoundError('School not found');
      }

      // Build date range
      const start = startDate ? new Date(startDate as string) : new Date(new Date().setMonth(new Date().getMonth() - 1));
      const end = endDate ? new Date(endDate as string) : new Date();

      // TODO: Implement financial analytics when Fee/Payment models are added
      // For now, return placeholder structure

      logger.info(`Retrieved financial analytics for school ${schoolId}`);

      res.json({
        success: true,
        data: {
          school: {
            id: school.id,
            name: school.name,
          },
          period: {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
          },
          summary: {
            totalRevenue: 0,
            totalExpenses: 0,
            netIncome: 0,
            pendingPayments: 0,
            overduePayments: 0,
            totalStudents: 0,
            paidStudents: 0,
            unpaidStudents: 0,
          },
          byCategory: [],
          byMonth: [],
          message: 'Financial analytics will be available when fee management is implemented',
        },
      });
    } catch (error) {
      logger.error('Error getting financial analytics:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  },
};

