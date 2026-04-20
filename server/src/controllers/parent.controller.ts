import { Response } from 'express';
import { UserStatus } from '@prisma/client';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { AppError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';

/**
 * Parent Controller
 * Handles all parent-specific operations
 */

export const parentController = {
  /**
   * Get parent's children list
   * GET /api/parent/children
   */
  async getChildren(req: AuthRequest, res: Response) {
    try {
      const parentId = req.user!.id;

      // Get all children linked to this parent
      const parentStudents = await prisma.parentStudent.findMany({
        where: {
          parentId: parentId,
        },
        include: {
          student: {
            include: {
              school: {
                select: {
                  id: true,
                  name: true,
                  logoUrl: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
      const schoolId = parentStudents[0]?.student.schoolId;
      const classIds = new Set<string>();
      parentStudents.forEach((ps) => {
        const meta = ps.student.metadata as { classId?: string } | null;
        if (meta?.classId) classIds.add(meta.classId);
      });
      const classes = classIds.size > 0 && schoolId
        ? await prisma.class.findMany({
            where: { id: { in: Array.from(classIds) }, schoolId },
            select: { id: true, name: true, section: true },
          })
        : [];
      const classMap = new Map(classes.map((c) => [c.id, c]));

      const children = parentStudents.map((ps) => {
        const meta = (ps.student.metadata as { classId?: string; rollNumber?: string } | null) || {};
        const cls = meta.classId ? classMap.get(meta.classId) : null;
        return {
          id: ps.student.id,
          studentId: ps.student.id,
          name: ps.student.name,
          className: cls ? cls.name : '',
          section: cls?.section ?? '',
          rollNumber: meta.rollNumber ?? '',
          avatarUrl: ps.student.photo ?? null,
        };
      });

      logger.info(`Parent ${parentId} fetched ${children.length} children`);

      res.json({
        success: true,
        message: 'Children retrieved successfully',
        data: {
          children,
          total: children.length,
        },
      });
    } catch (error) {
      logger.error('Get children error:', error);
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
   * Get parent dashboard data for a specific student
   * GET /api/parent/dashboard/:studentId
   */
  async getDashboard(req: AuthRequest, res: Response) {
    try {
      const parentId = req.user!.id;
      const { studentId } = req.params;

      // Verify parent has access to this student
      const parentStudent = await prisma.parentStudent.findFirst({
        where: {
          parentId: parentId,
          studentId: studentId,
        },
        include: {
          student: {
            include: {
              school: {
                select: {
                  id: true,
                  name: true,
                  logoUrl: true,
                },
              },
            },
          },
        },
      });

      if (!parentStudent) {
        throw new ForbiddenError('You do not have access to this student');
      }

      const student = parentStudent.student;

      // Get recent attendance (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentAttendance = await prisma.attendance.findMany({
        where: {
          studentId: studentId,
          date: {
            gte: thirtyDaysAgo,
          },
        },
        orderBy: {
          date: 'desc',
        },
        take: 10,
        include: {
          student: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Calculate attendance statistics
      const attendanceStats = await prisma.attendance.groupBy({
        by: ['status'],
        where: {
          studentId: studentId,
          date: {
            gte: thirtyDaysAgo,
          },
        },
        _count: {
          status: true,
        },
      });

      const totalDays = attendanceStats.reduce((sum, stat) => sum + stat._count.status, 0);
      const presentDays = attendanceStats.find((s) => s.status === 'present')?._count.status || 0;
      const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      // Get student's class from attendance records
      const studentAttendance = await prisma.attendance.findFirst({
        where: { studentId: studentId },
        select: { classId: true },
        orderBy: { date: 'desc' },
      });

      const studentClassId = studentAttendance?.classId;

      // Get recent homework (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentHomework = studentClassId
        ? await prisma.homework.findMany({
            where: {
              classId: studentClassId,
              createdAt: {
                gte: sevenDaysAgo,
              },
            },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              photo: true,
            },
          },
          class: {
            select: {
              id: true,
              name: true,
              section: true,
            },
          },
          submissions: {
            where: {
              studentId: studentId,
            },
            take: 1,
            orderBy: {
              submittedAt: 'desc',
            },
          },
        },
        orderBy: {
          dueDate: 'asc',
        },
        take: 5,
          })
        : [];

      // Get recent marks (last 3 exams)
      const recentMarks = await prisma.marks.findMany({
        where: {
          studentId: studentId,
        },
        include: {
          exam: {
            select: {
              id: true,
              name: true,
              subject: true,
              examType: true,
              date: true,
              maxMarks: true,
              passingMarks: true,
            },
          },
          teacher: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          enteredAt: 'desc',
        },
        take: 5,
      });

      // Calculate marks statistics
      const marksStats = {
        totalExams: recentMarks.length,
        averageMarks: 0,
        averagePercentage: 0,
        passed: 0,
        failed: 0,
      };

      if (recentMarks.length > 0) {
        const totalMarks = recentMarks.reduce((sum, mark) => sum + mark.marksObtained, 0);
        const totalMaxMarks = recentMarks.reduce((sum, mark) => sum + (mark.exam?.maxMarks || 0), 0);
        marksStats.averageMarks = totalMarks / recentMarks.length;
        marksStats.averagePercentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
        marksStats.passed = recentMarks.filter(
          (mark) => mark.marksObtained >= (mark.exam?.passingMarks || 0)
        ).length;
        marksStats.failed = recentMarks.length - marksStats.passed;
      }

      const absentDays = attendanceStats.find((s) => s.status === 'absent')?._count.status || 0;
      const lateDays = attendanceStats.find((s) => s.status === 'late')?._count.status || 0;
      const lastAtt = recentAttendance[0];
      const homeworkPending = recentHomework.filter((hw) => hw.submissions.length === 0).length;
      const homeworkSubmitted = recentHomework.filter((hw) => hw.submissions.length > 0).length;
      const now = new Date();
      const homeworkOverdue = recentHomework.filter((hw) => hw.submissions.length === 0 && hw.dueDate < now).length;
      const lastMark = recentMarks[0];
      const maxMarksLast = lastMark?.exam?.maxMarks || 0;
      const pctLast = lastMark && maxMarksLast > 0 ? lastMark.marksObtained / maxMarksLast : 0;
      const grade = pctLast >= 0.9 ? 'A+' : pctLast >= 0.8 ? 'A' : pctLast >= 0.7 ? 'B' : pctLast >= 0.6 ? 'C' : pctLast > 0 ? 'F' : '—';

      const meta = student.metadata as { classId?: string } | null;
      const studentClass = meta?.classId
        ? await prisma.class.findUnique({ where: { id: meta.classId }, select: { name: true, section: true } })
        : null;

      const feeStructures = student.schoolId
        ? await prisma.feeStructure.findMany({ where: { schoolId: student.schoolId, isActive: true } })
        : [];
      const payments = await prisma.feePayment.findMany({
        where: { studentId: studentId },
        include: { feeStructure: true },
      });
      const totalDue = feeStructures.reduce((s, f) => s + f.amount, 0);
      const totalPaid = payments.reduce((s, p) => s + p.amountPaid, 0);
      const nextDue = feeStructures.find((f) => {
        const paid = payments.find((p) => p.feeStructureId === f.id);
        return !paid || paid.amountPaid < f.amount;
      });
      const feesStatus = totalDue <= totalPaid ? 'PAID' : (nextDue?.dueDate && new Date(nextDue.dueDate) < now ? 'OVERDUE' : 'PENDING');

      const dashboardData = {
        student: {
          id: student.id,
          name: student.name,
          className: studentClass?.name ?? '',
          section: studentClass?.section ?? '',
          rollNumber: (student.metadata as { rollNumber?: string } | null)?.rollNumber ?? '',
        },
        attendance: {
          percentage: Math.round(attendancePercentage * 100) / 100,
          present: presentDays,
          absent: absentDays,
          late: lateDays,
          lastUpdated: lastAtt?.markedAt?.toISOString() ?? null,
        },
        homework: {
          pending: homeworkPending,
          submitted: homeworkSubmitted,
          overdue: homeworkOverdue,
          recent: recentHomework.slice(0, 3).map((hw) => ({
            id: hw.id,
            title: hw.title,
            subject: hw.subject,
            dueDate: hw.dueDate.toISOString(),
            status: hw.submissions.length > 0 ? 'SUBMITTED' : hw.dueDate < now ? 'OVERDUE' : 'PENDING',
          })),
        },
        marks: {
          average: Math.round((marksStats.averagePercentage || 0) * 100) / 100,
          lastExam: lastMark
            ? {
                subject: lastMark.exam?.subject ?? '',
                marks: lastMark.marksObtained,
                maxMarks: maxMarksLast,
                grade,
              }
            : null,
        },
        fees: {
          totalDue: totalDue - totalPaid,
          nextDueDate: nextDue?.dueDate?.toISOString().split('T')[0] ?? null,
          status: feesStatus,
        },
        bus: {
          routeName: null as string | null,
          nextStop: null as string | null,
          eta: null as string | null,
        },
      };

      logger.info(`Parent ${parentId} fetched dashboard for student ${studentId}`);

      res.json({
        success: true,
        message: 'Dashboard data retrieved successfully',
        data: dashboardData,
      });
    } catch (error) {
      logger.error('Get dashboard error:', error);
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

  async getAttendanceHistory(req: AuthRequest, res: Response) {
    try {
      const parentId = req.user!.id;
      const { studentId } = req.params;
      const month = parseInt(String(req.query.month), 10) || new Date().getMonth() + 1;
      const year = parseInt(String(req.query.year), 10) || new Date().getFullYear();

      const link = await prisma.parentStudent.findFirst({
        where: { parentId, studentId },
      });
      if (!link) throw new ForbiddenError('Access denied');

      const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const end = new Date(year, month, 0, 23, 59, 59, 999);

      const records = await prisma.attendance.findMany({
        where: { studentId, date: { gte: start, lte: end } },
        include: { class: { select: { id: true } } },
        orderBy: { date: 'asc' },
      });

      const present = records.filter((r) => r.status === 'present').length;
      const absent = records.filter((r) => r.status === 'absent').length;
      const late = records.filter((r) => r.status === 'late').length;
      const total = records.length;
      const percentage = total > 0 ? Math.round(((present + late) / total) * 10000) / 100 : 0;

      const list = records.map((r) => ({
        date: r.date.toISOString().split('T')[0],
        status: r.status.toUpperCase(),
        subject: (r.class as any)?.subject ?? '',
      }));

      res.json({
        success: true,
        data: {
          records: list,
          summary: { present, absent, late, percentage, total },
        },
      });
    } catch (error) {
      logger.error('Get attendance history error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async getHomework(req: AuthRequest, res: Response) {
    try {
      const parentId = req.user!.id;
      const { studentId } = req.params;

      const link = await prisma.parentStudent.findFirst({
        where: { parentId, studentId },
      });
      if (!link) throw new ForbiddenError('Access denied');

      const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: { metadata: true, schoolId: true },
      });
      const classId = (student?.metadata as { classId?: string } | null)?.classId;
      if (!classId) {
        res.json({ success: true, data: [] });
        return;
      }

      const homework = await prisma.homework.findMany({
        where: { classId },
        include: {
          teacher: { select: { name: true } },
          submissions: { where: { studentId }, take: 1 },
        },
        orderBy: { dueDate: 'desc' },
      });

      const now = new Date();
      const list = homework.map((hw) => {
        const sub = hw.submissions[0];
        const submitted = !!sub;
        let submissionStatus: 'SUBMITTED' | 'PENDING' | 'OVERDUE' = 'PENDING';
        if (submitted) submissionStatus = 'SUBMITTED';
        else if (hw.dueDate < now) submissionStatus = 'OVERDUE';

        return {
          id: hw.id,
          title: hw.title,
          subject: hw.subject,
          dueDate: hw.dueDate.toISOString(),
          description: hw.description,
          teacherName: hw.teacher.name,
          submissionStatus,
        };
      });

      res.json({ success: true, data: list });
    } catch (error) {
      logger.error('Get homework error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async getMarks(req: AuthRequest, res: Response) {
    try {
      const parentId = req.user!.id;
      const { studentId } = req.params;

      const link = await prisma.parentStudent.findFirst({
        where: { parentId, studentId },
      });
      if (!link) throw new ForbiddenError('Access denied');

      const marks = await prisma.marks.findMany({
        where: { studentId },
        include: { exam: true },
        orderBy: { enteredAt: 'desc' },
      });

      const bySubject = new Map<string, { subject: string; marks: number; maxMarks: number; grade: string; examType: string; date: string }[]>();
      let totalMarks = 0;
      let totalMax = 0;
      for (const m of marks) {
        const max = m.exam?.maxMarks ?? 0;
        const sub = m.exam?.subject ?? 'General';
        totalMarks += m.marksObtained;
        totalMax += max;
        const pct = max > 0 ? m.marksObtained / max : 0;
        const grade = pct >= 0.9 ? 'A+' : pct >= 0.8 ? 'A' : pct >= 0.7 ? 'B' : pct >= 0.6 ? 'C' : 'F';
        if (!bySubject.has(sub)) bySubject.set(sub, []);
        bySubject.get(sub)!.push({
          subject: sub,
          marks: m.marksObtained,
          maxMarks: max,
          grade,
          examType: m.exam?.examType ?? '',
          date: m.exam?.date?.toISOString().split('T')[0] ?? '',
        });
      }
      const average = marks.length > 0 && totalMax > 0 ? Math.round((totalMarks / totalMax) * 10000) / 100 : 0;
      const pctOverall = totalMax > 0 ? totalMarks / totalMax : 0;
      const overallGrade = pctOverall >= 0.9 ? 'A+' : pctOverall >= 0.8 ? 'A' : pctOverall >= 0.7 ? 'B' : pctOverall >= 0.6 ? 'C' : 'F';

      const bySubjectList = Array.from(bySubject.entries()).map(([subject, entries]) => ({
        subject,
        entries,
      }));

      const examsMap = new Map<string, { examType: string; date: string; subjects: { subject: string; marks: number; maxMarks: number }[] }>();
      for (const m of marks) {
        const examId = m.examId;
        const key = `${m.exam?.date?.toISOString() ?? ''}-${examId}`;
        if (!examsMap.has(key)) {
          examsMap.set(key, {
            examType: m.exam?.examType ?? '',
            date: m.exam?.date?.toISOString().split('T')[0] ?? '',
            subjects: [],
          });
        }
        examsMap.get(key)!.subjects.push({
          subject: m.exam?.subject ?? '',
          marks: m.marksObtained,
          maxMarks: m.exam?.maxMarks ?? 0,
        });
      }

      res.json({
        success: true,
        data: {
          overall: { average, grade: overallGrade, rank: null },
          bySubject: bySubjectList,
          exams: Array.from(examsMap.values()),
        },
      });
    } catch (error) {
      logger.error('Get marks error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async getFeeStatus(req: AuthRequest, res: Response) {
    try {
      const parentId = req.user!.id;
      const { studentId } = req.params;

      const link = await prisma.parentStudent.findFirst({
        where: { parentId, studentId },
      });
      if (!link) throw new ForbiddenError('Access denied');

      const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: { schoolId: true },
      });
      if (!student?.schoolId) {
        res.json({
          success: true,
          data: {
            feeStructures: [],
            summary: { totalDue: 0, totalPaid: 0, totalOverdue: 0, totalExpected: 0, percentCollected: 0 },
          },
        });
        return;
      }

      const structures = await prisma.feeStructure.findMany({
        where: { schoolId: student.schoolId, isActive: true },
      });
      const payments = await prisma.feePayment.findMany({
        where: { studentId },
        include: { feeStructure: true },
      });
      const now = new Date();
      let totalDue = 0;
      let totalPaid = 0;
      let totalOverdue = 0;
      const feeStructures = structures.map((f) => {
        const pay = payments.find((p) => p.feeStructureId === f.id);
        const paid = pay?.amountPaid ?? 0;
        const due = f.amount - paid;
        if (due > 0) {
          totalDue += due;
          if (f.dueDate && new Date(f.dueDate) < now) totalOverdue += due;
        }
        totalPaid += paid;
        let status = 'PAID';
        if (due > 0) status = f.dueDate && new Date(f.dueDate) < now ? 'OVERDUE' : 'PENDING';
        const dueDateStr = f.dueDate?.toISOString().split('T')[0] ?? null;
        return {
          id: f.id,
          name: f.name,
          amount: f.amount,
          amountPaid: paid,
          balanceDue: due,
          dueDate: dueDateStr,
          status,
          paidDate: pay?.paidAt?.toISOString().split('T')[0] ?? null,
          paidAt: pay?.paidAt?.toISOString() ?? null,
          paymentMethod: pay?.paymentMethod ?? null,
          paymentReference: pay?.reference ?? null,
        };
      });

      const totalExpected = structures.reduce((s, f) => s + f.amount, 0);
      const pctCollected = totalExpected > 0 ? Math.min(100, Math.round((totalPaid / totalExpected) * 100)) : 0;

      res.json({
        success: true,
        data: {
          feeStructures,
          summary: {
            totalDue,
            totalPaid,
            totalOverdue,
            totalExpected,
            percentCollected: pctCollected,
          },
        },
      });
    } catch (error) {
      logger.error('Get fee status error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async getAppointments(req: AuthRequest, res: Response) {
    try {
      const parentId = req.user!.id;
      const appointments = await prisma.appointment.findMany({
        where: { parentId },
        orderBy: { requestedDate: 'desc' },
      });
      const studentIds = [...new Set(appointments.map((a) => a.studentId))];
      const students = studentIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: studentIds } },
            select: { id: true, name: true },
          })
        : [];
      const nameMap = new Map(students.map((s) => [s.id, s.name]));
      res.json({
        success: true,
        data: appointments.map((a) => ({
          id: a.id,
          studentId: a.studentId,
          studentName: nameMap.get(a.studentId) ?? '',
          requestedDate: a.requestedDate.toISOString().split('T')[0],
          requestedTime: a.requestedTime,
          duration: a.duration,
          reason: a.reason,
          status: a.status,
          approvedDate: a.approvedDate?.toISOString().split('T')[0] ?? null,
          approvedTime: a.approvedTime,
          assignedTo: a.assignedTo,
        })),
      });
    } catch (error) {
      logger.error('Get appointments error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async bookAppointment(req: AuthRequest, res: Response) {
    try {
      const parentId = req.user!.id;
      const body = req.body as { teacherId?: string; studentId: string; date: string; time: string; duration: number; reason: string };
      const { teacherId, studentId, date, time, duration, reason } = body;
      if (!studentId || !date || !time || !duration || !reason) {
        return res.status(400).json({ success: false, message: 'studentId, date, time, duration, reason required' });
      }
      const link = await prisma.parentStudent.findFirst({
        where: { parentId, studentId },
      });
      if (!link) throw new ForbiddenError('Access denied to this student');

      const requestedDate = new Date(date);
      if (isNaN(requestedDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid date' });
      }

      const assignedTo = teacherId ? 'teacher' : 'principal';
      const assignedPersonId = teacherId ?? null;

      const appointment = await prisma.appointment.create({
        data: {
          parentId,
          studentId,
          requestedDate,
          requestedTime: time,
          duration: Number(duration) || 30,
          reason,
          assignedTo,
          assignedPersonId,
        },
      });
      logger.info(`Parent ${parentId} booked appointment ${appointment.id}`);
      return res.status(201).json({ success: true, data: { id: appointment.id, status: 'pending' } });
    } catch (error) {
      logger.error('Book appointment error:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async getTeachersForParent(req: AuthRequest, res: Response) {
    try {
      const schoolId = req.user!.schoolId;
      if (!schoolId) {
        res.status(403).json({ success: false, message: 'School access required' });
        return;
      }
      const teachers = await prisma.user.findMany({
        where: { schoolId, role: 'TEACHER', status: UserStatus.ACTIVE },
        include: {
          teacherClasses: { take: 1, select: { subject: true, isClassTeacher: true } },
        },
        orderBy: { name: 'asc' },
      });
      const data = teachers.map((t) => ({
        id: t.id,
        name: t.name,
        email: t.email,
        subject: t.teacherClasses[0]?.subject ?? 'General',
      }));
      res.json({ success: true, data });
    } catch (error) {
      logger.error('Get teachers for parent error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async getNotifications(req: AuthRequest, res: Response) {
    try {
      const parentId = req.user!.id;
      const list = await prisma.notification.findMany({
        where: { userId: parentId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      res.json({
        success: true,
        data: list.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.body,
          category: n.category,
          isRead: !!n.readAt,
          createdAt: n.createdAt.toISOString(),
        })),
      });
    } catch (error) {
      logger.error('Get notifications error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async markNotificationRead(req: AuthRequest, res: Response) {
    try {
      const parentId = req.user!.id;
      const { id } = req.params;
      const n = await prisma.notification.findFirst({
        where: { id, userId: parentId },
      });
      if (!n) {
        res.status(404).json({ success: false, message: 'Notification not found' });
        return;
      }
      await prisma.notification.update({
        where: { id },
        data: { readAt: new Date() },
      });
      res.json({ success: true });
    } catch (error) {
      logger.error('Mark notification read error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, message: error.message });
        return;
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
};

