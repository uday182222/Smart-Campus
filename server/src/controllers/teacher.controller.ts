import { Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { AppError, NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';

/**
 * Teacher Controller
 * Dashboard, classes, students, messages, calendar for teacher role
 */

function getTodayStartEnd() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);
  return { start: today, end };
}

export const teacherController = {
  /**
   * GET /teacher/dashboard
   * Returns today's schedule, stats, upcoming events for the teacher
   */
  async getTeacherDashboard(req: AuthRequest, res: Response) {
    try {
      const teacherId = req.user?.id;
      const schoolId = req.user?.schoolId;
      if (!teacherId || !schoolId) throw new ForbiddenError('Authentication required');

      const teacherClasses = await prisma.teacherClass.findMany({
        where: { teacherId },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              section: true,
              roomNumber: true,
              schedule: true,
            },
          },
        },
      });

      // Build today's classes from schedule: filter by current day of week
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 Sun .. 6 Sat
      const todayClassesRaw = teacherClasses.map((tc) => {
        const schedule = tc.class.schedule as any;
        const slots = Array.isArray(schedule?.slots) ? schedule.slots : [];
        const slot =
          slots.find((s: any) => s.day === dayOfWeek || s.dayOfWeek === dayOfWeek) ||
          slots[0] ||
          {};
        return {
          id: tc.id,
          className: tc.class.name,
          section: tc.class.section,
          subject: tc.subject,
          startTime: slot.startTime || '08:00',
          endTime: slot.endTime || '09:00',
          room: tc.class.roomNumber || '—',
        };
      });
      const todayClasses = todayClassesRaw.sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      );

      // Total students across teacher's classes (students with metadata.classId in teacher's classIds)
      const classIds = teacherClasses.map((tc) => tc.classId);
      const allStudentsForCount = await prisma.user.findMany({
        where: { role: 'STUDENT', schoolId },
        select: { id: true, metadata: true },
      });
      const totalStudents =
        classIds.length > 0
          ? allStudentsForCount.filter((s) => {
              const meta = s.metadata as any;
              return meta?.classId && classIds.includes(meta.classId);
            }).length
          : 0;

      // Pending homework: homework by this teacher with submissions not graded
      const homeworkByTeacher = await prisma.homework.findMany({
        where: { teacherId },
        select: { id: true },
      });
      const hwIds = homeworkByTeacher.map((h) => h.id);
      const pendingHomework =
        hwIds.length === 0
          ? 0
          : await prisma.homeworkSubmission.count({
              where: {
                homeworkId: { in: hwIds },
                status: 'submitted',
                grade: null,
              },
            });
      const pendingGradingCount = pendingHomework;

      // Unread messages (notifications with category message for this user, not read)
      const unreadMessages = await prisma.notification.count({
        where: {
          userId: teacherId,
          category: 'message',
          readAt: null,
        },
      });

      // Upcoming events (next 3 school events)
      const { start, end } = getTodayStartEnd();
      const endPlus7 = new Date(end);
      endPlus7.setDate(endPlus7.getDate() + 7);
      const events = await prisma.event.findMany({
        where: {
          schoolId,
          status: { not: 'cancelled' },
          startDate: { gte: start, lte: endPlus7 },
        },
        orderBy: { startDate: 'asc' },
        take: 3,
        select: {
          id: true,
          title: true,
          startDate: true,
          type: true,
        },
      });
      const upcomingEvents = events.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.startDate.toISOString().split('T')[0],
        type: e.type,
      }));

      return res.json({
        success: true,
        data: {
          todayClasses,
          totalStudents,
          pendingHomework: pendingGradingCount,
          unreadMessages,
          upcomingEvents,
        },
      });
    } catch (error) {
      logger.error('Teacher dashboard error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to load dashboard', 500);
    }
  },

  /**
   * GET /teacher/classes
   * Classes assigned to this teacher
   */
  async getMyClasses(req: AuthRequest, res: Response) {
    try {
      const teacherId = req.user?.id;
      const schoolId = req.user?.schoolId;
      if (!teacherId || !schoolId) throw new ForbiddenError('Authentication required');

      const teacherClasses = await prisma.teacherClass.findMany({
        where: { teacherId },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              section: true,
              currentStudents: true,
            },
          },
        },
      });

      const allStudents = await prisma.user.findMany({
        where: { role: 'STUDENT', schoolId },
        select: { id: true, metadata: true },
      });

      const byClassId = new Map<
        string,
        { id: string; name: string; section: string; studentCount: number; subjects: string[] }
      >();

      for (const tc of teacherClasses) {
        const studentCount =
          allStudents.filter((s) => {
            const meta = s.metadata as any;
            return meta?.classId && meta.classId === tc.classId;
          }).length || tc.class.currentStudents;

        const existing = byClassId.get(tc.classId);
        const subject = tc.subject || '';
        if (!existing) {
          byClassId.set(tc.classId, {
            id: tc.class.id,
            name: tc.class.name,
            section: tc.class.section,
            studentCount,
            subjects: subject ? [subject] : [],
          });
        } else {
          existing.studentCount = Math.max(existing.studentCount, studentCount);
          if (subject && !existing.subjects.includes(subject)) existing.subjects.push(subject);
        }
      }

      const list = Array.from(byClassId.values()).map((c) => ({
        id: c.id,
        name: c.name,
        section: c.section,
        studentCount: c.studentCount,
        // keep old shape compatibility (some screens read "subject")
        subject: c.subjects[0] ?? 'General',
        subjects: c.subjects,
      }));

      return res.json({ success: true, data: list });
    } catch (error) {
      logger.error('Teacher classes error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to load classes', 500);
    }
  },

  /**
   * GET /teacher/parents
   * Parents for students in teacher's assigned classes
   */
  async getParents(req: AuthRequest, res: Response) {
    try {
      const teacherId = req.user?.id;
      const schoolId = req.user?.schoolId;
      if (!teacherId || !schoolId) throw new ForbiddenError('Authentication required');

      const teacherClasses = await prisma.teacherClass.findMany({
        where: { teacherId },
        select: { classId: true },
      });
      const classIds = teacherClasses.map((tc) => tc.classId);
      if (classIds.length === 0) return res.json({ success: true, data: [] });

      const students = await prisma.user.findMany({
        where: { role: 'STUDENT', schoolId },
        select: { id: true, name: true, metadata: true },
      });
      const studentIds = students
        .filter((s) => {
          const meta = s.metadata as any;
          return meta?.classId && classIds.includes(meta.classId);
        })
        .map((s) => s.id);
      if (studentIds.length === 0) return res.json({ success: true, data: [] });

      const parentLinks = await prisma.parentStudent.findMany({
        where: { studentId: { in: studentIds } },
        include: {
          parent: { select: { id: true, name: true, email: true, phone: true } },
          student: { select: { id: true, name: true, metadata: true } },
        },
      });

      const seen = new Set<string>();
      const list = parentLinks
        .map((ps) => {
          const meta = (ps.student.metadata as any) || {};
          return {
            id: ps.parent.id,
            name: ps.parent.name,
            email: ps.parent.email,
            phone: ps.parent.phone,
            studentId: ps.student.id,
            studentName: ps.student.name,
            classId: meta?.classId ?? null,
          };
        })
        .filter((row) => {
          const key = `${row.id}:${row.studentId}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

      return res.json({ success: true, data: list });
    } catch (error) {
      logger.error('Teacher parents error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to load parents', 500);
    }
  },

  /**
   * GET /teacher/classes/:classId/students
   * All students in a class (by metadata.classId)
   */
  async getClassStudents(req: AuthRequest, res: Response) {
    try {
      const teacherId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const { classId } = req.params;
      if (!teacherId || !schoolId) throw new ForbiddenError('Authentication required');

      const teacherClass = await prisma.teacherClass.findFirst({
        where: { teacherId, classId },
        include: { class: true },
      });
      if (!teacherClass) throw new NotFoundError('Class not found or not assigned to you');

      const allSchoolStudents = await prisma.user.findMany({
        where: { role: 'STUDENT', schoolId },
        select: {
          id: true,
          name: true,
          email: true,
          photo: true,
          metadata: true,
        },
      });
      const students = allSchoolStudents.filter(
        (s) => (s.metadata as any)?.classId === classId
      );

      const parentStudentFull = await prisma.parentStudent.findMany({
        where: { studentId: { in: students.map((s) => s.id) }, isPrimary: true },
        include: { parent: { select: { id: true, name: true, phone: true } } },
      });
      const parentByStudentId = new Map(parentStudentFull.map((ps) => [ps.studentId, ps.parent]));

      const list = students.map((s) => {
        const parent = parentByStudentId.get(s.id);
        return {
          id: s.id,
          name: s.name,
          email: s.email,
          parentId: parent?.id ?? null,
          parentName: parent?.name ?? null,
          parentPhone: parent?.phone ?? null,
          avatarUrl: s.photo ?? null,
        };
      });

      return res.json({ success: true, data: list });
    } catch (error) {
      logger.error('Teacher class students error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to load students', 500);
    }
  },

  /**
   * GET /teacher/messages
   * Messages to/from this teacher (using Notification with category 'message')
   */
  async getMessages(req: AuthRequest, res: Response) {
    try {
      const teacherId = req.user?.id;
      if (!teacherId) throw new ForbiddenError('Authentication required');

      const notifications = await prisma.notification.findMany({
        where: {
          category: 'message',
          userId: teacherId,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      const fromUserIds: string[] = [];
      const seen = new Set<string>();
      for (const n of notifications) {
        const d = n.data as Record<string, unknown> | null;
        const id = d && typeof d.fromUserId === 'string' ? d.fromUserId : undefined;
        if (id && !seen.has(id)) {
          seen.add(id);
          fromUserIds.push(id);
        }
      }
      const fromUsers =
        fromUserIds.length > 0
          ? await prisma.user.findMany({
              where: { id: { in: fromUserIds } },
              select: { id: true, name: true, role: true },
            })
          : [];
      const fromMap = new Map(fromUsers.map((u) => [u.id, u]));

      const list = notifications.map((n) => {
        const fromUserId = (n.data as any)?.fromUserId;
        const fromUser = fromUserId ? fromMap.get(fromUserId) : null;
        return {
          id: n.id,
          fromName: fromUser?.name ?? (n.data as any)?.fromName ?? 'Unknown',
          fromRole: fromUser?.role ?? (n.data as any)?.fromRole ?? 'USER',
          message: n.body,
          createdAt: n.createdAt.toISOString(),
          isRead: !!n.readAt,
        };
      });

      return res.json({ success: true, data: list });
    } catch (error) {
      logger.error('Teacher messages error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to load messages', 500);
    }
  },

  /**
   * POST /teacher/messages
   * Body: { toUserId, message }
   */
  async sendMessage(req: AuthRequest, res: Response) {
    try {
      const teacherId = req.user?.id;
      const { toUserId, message } = req.body as { toUserId: string; message: string };
      if (!teacherId) throw new ForbiddenError('Authentication required');
      if (!toUserId || !message?.trim()) throw new ValidationError('toUserId and message are required');

      const teacher = await prisma.user.findUnique({
        where: { id: teacherId },
        select: { name: true, role: true },
      });
      const toUser = await prisma.user.findFirst({
        where: { id: toUserId },
      });
      if (!toUser) throw new NotFoundError('Recipient not found');

      await prisma.notification.create({
        data: {
          userId: toUserId,
          category: 'message',
          title: `Message from ${teacher?.name ?? 'Teacher'}`,
          body: message.trim(),
          data: {
            fromUserId: teacherId,
            fromName: teacher?.name ?? 'Teacher',
            fromRole: teacher?.role ?? 'TEACHER',
          } as any,
          channels: ['in_app'] as any,
        },
      });

      logger.info(`Teacher ${teacherId} sent message to ${toUserId}`);
      return res.status(201).json({ success: true, message: 'Message sent' });
    } catch (error) {
      logger.error('Teacher send message error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to send message', 500);
    }
  },

  /**
   * GET /teacher/calendar
   * Query: month (1-12), year
   * Returns school events for that month
   */
  async getCalendarEvents(req: AuthRequest, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const month = parseInt(String(req.query.month), 10);
      const year = parseInt(String(req.query.year), 10);
      if (!schoolId) throw new ForbiddenError('School access required');
      if (!month || month < 1 || month > 12 || !year) {
        throw new ValidationError('Valid month (1-12) and year are required');
      }

      const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const end = new Date(year, month, 0, 23, 59, 59, 999);

      const events = await prisma.event.findMany({
        where: {
          schoolId,
          status: { not: 'cancelled' },
          startDate: { gte: start, lte: end },
        },
        orderBy: { startDate: 'asc' },
        select: {
          id: true,
          title: true,
          startDate: true,
          type: true,
          description: true,
        },
      });

      const list = events.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.startDate.toISOString().split('T')[0],
        type: e.type,
        description: e.description ?? '',
      }));

      return res.json({ success: true, data: list });
    } catch (error) {
      logger.error('Teacher calendar error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to load calendar', 500);
    }
  },
};
