import { NextFunction, Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { AppError, ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

type PeriodInput = {
  dayOfWeek: number;
  periodNumber: number;
  subject: string;
  teacherId?: string | null;
  startTime: string;
  endTime: string;
  roomNumber?: string | null;
};

function formatPeriod(
  p: {
    id: string;
    classId: string;
    dayOfWeek: number;
    periodNumber: number;
    subject: string;
    startTime: string;
    endTime: string;
    roomNumber: string | null;
    teacher: { id: string; name: string } | null;
    class?: { name: string; section: string };
  },
) {
  return {
    id: p.id,
    classId: p.classId,
    dayOfWeek: p.dayOfWeek,
    periodNumber: p.periodNumber,
    subject: p.subject,
    startTime: p.startTime,
    endTime: p.endTime,
    roomNumber: p.roomNumber,
    teacher: p.teacher ? { id: p.teacher.id, name: p.teacher.name } : null,
    ...(p.class ? { className: `${p.class.name} ${p.class.section}` } : {}),
  };
}

async function getClassInSchool(classId: string, schoolId: string) {
  const cls = await prisma.class.findFirst({
    where: { id: classId, schoolId },
    select: { id: true, name: true, section: true, schoolId: true },
  });
  if (!cls) throw new NotFoundError('Class not found');
  return cls;
}

async function buildClassTimetableData(classId: string, schoolId: string) {
  const cls = await getClassInSchool(classId, schoolId);

  const periods = await prisma.timetablePeriod.findMany({
    where: { classId, schoolId },
    orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
    include: {
      teacher: { select: { id: true, name: true } },
    },
  });

  return {
    classId: cls.id,
    className: `${cls.name} ${cls.section}`,
    periods: periods.map((p) => formatPeriod(p)),
  };
}

function validatePeriodInput(period: PeriodInput, index: number) {
  if (period.dayOfWeek < 1 || period.dayOfWeek > 6) {
    throw new ValidationError(`periods[${index}].dayOfWeek must be 1–6 (Mon–Sat)`);
  }
  if (!Number.isInteger(period.periodNumber) || period.periodNumber < 1) {
    throw new ValidationError(`periods[${index}].periodNumber must be a positive integer`);
  }
  if (!period.subject?.trim()) {
    throw new ValidationError(`periods[${index}].subject is required`);
  }
  if (!TIME_RE.test(period.startTime) || !TIME_RE.test(period.endTime)) {
    throw new ValidationError(`periods[${index}].startTime/endTime must be HH:MM (24-hour)`);
  }
  if (period.startTime >= period.endTime) {
    throw new ValidationError(`periods[${index}].endTime must be after startTime`);
  }
}

async function assertCanEditClassTimetable(userId: string, role: string, classId: string, schoolId: string) {
  const elevated = ['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'].includes(role);
  if (elevated) return;

  if (role !== 'TEACHER') {
    throw new ForbiddenError('Only teachers or admins can update timetables');
  }

  const link = await prisma.teacherClass.findFirst({
    where: { teacherId: userId, classId, class: { schoolId } },
  });
  if (!link) {
    throw new ForbiddenError('You are not assigned to this class');
  }
}

export const timetableController = {
  /** GET /timetable/class/:classId — class timetable (parent, teacher, admin) */
  async getClassTimetable(req: AuthRequest, res: Response) {
    try {
      const { classId } = req.params;
      const schoolId = req.user?.schoolId;
      if (!schoolId) throw new ForbiddenError('School access required');

      const data = await buildClassTimetableData(classId, schoolId);

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('getClassTimetable error:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /** GET /timetable/student/:studentId — parent timetable via student (A7) */
  async getStudentTimetable(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;
      const userId = req.user!.id;
      const role = req.user!.role;
      const schoolId = req.user?.schoolId;
      if (!schoolId) throw new ForbiddenError('School access required');

      if (role === 'PARENT') {
        const link = await prisma.parentStudent.findFirst({
          where: { parentId: userId, studentId },
        });
        if (!link) throw new ForbiddenError('Access denied to this student');
      }

      const student = await prisma.user.findFirst({
        where: { id: studentId, schoolId, role: 'STUDENT' },
        select: { metadata: true },
      });
      if (!student) throw new NotFoundError('Student not found');

      const classId = (student.metadata as { classId?: string } | null)?.classId;
      if (!classId) {
        throw new NotFoundError('Student has no class assigned');
      }

      const data = await buildClassTimetableData(classId, schoolId);

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error('getStudentTimetable error:', error);
      return next(error);
    }
  },

  /** GET /timetable/teacher/me — teacher's own periods across classes (D6) */
  async getMyTimetable(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const schoolId = req.user?.schoolId;
      if (!schoolId) throw new ForbiddenError('School access required');

      const periods = await prisma.timetablePeriod.findMany({
        where: { schoolId, teacherId: userId },
        orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }, { startTime: 'asc' }],
        include: {
          teacher: { select: { id: true, name: true } },
          class: { select: { name: true, section: true } },
        },
      });

      return res.json({
        success: true,
        data: {
          teacherId: userId,
          periods: periods.map((p) => formatPeriod(p)),
        },
      });
    } catch (error) {
      logger.error('getMyTimetable error:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /** PUT /timetable/class/:classId — replace class timetable (A17 teacher upload) */
  async upsertClassTimetable(req: AuthRequest, res: Response) {
    try {
      const { classId } = req.params;
      const userId = req.user!.id;
      const role = req.user!.role;
      const schoolId = req.user?.schoolId;
      if (!schoolId) throw new ForbiddenError('School access required');

      const cls = await getClassInSchool(classId, schoolId);
      await assertCanEditClassTimetable(userId, role, classId, schoolId);

      const body = req.body as { periods?: PeriodInput[] };
      if (!Array.isArray(body.periods)) {
        throw new ValidationError('periods array is required');
      }

      const seen = new Set<string>();
      for (let i = 0; i < body.periods.length; i++) {
        const p = body.periods[i];
        validatePeriodInput(p, i);
        const key = `${p.dayOfWeek}-${p.periodNumber}`;
        if (seen.has(key)) {
          throw new ValidationError(`Duplicate slot dayOfWeek=${p.dayOfWeek} periodNumber=${p.periodNumber}`);
        }
        seen.add(key);

        const tid = p.teacherId?.trim() || null;
        if (tid) {
          const teacher = await prisma.user.findFirst({
            where: { id: tid, schoolId, role: 'TEACHER', status: 'ACTIVE' },
          });
          if (!teacher) {
            throw new ValidationError(`periods[${i}].teacherId is not a valid teacher in this school`);
          }
        }
      }

      const normalized = body.periods.map((p) => ({
        ...p,
        teacherId: p.teacherId?.trim() ? p.teacherId.trim() : null,
      }));

      await prisma.$transaction(async (tx) => {
        await tx.timetablePeriod.deleteMany({ where: { classId, schoolId } });
        if (normalized.length > 0) {
          await tx.timetablePeriod.createMany({
            data: normalized.map((p) => ({
              classId,
              schoolId,
              dayOfWeek: p.dayOfWeek,
              periodNumber: p.periodNumber,
              subject: p.subject.trim(),
              teacherId: p.teacherId,
              startTime: p.startTime,
              endTime: p.endTime,
              roomNumber: p.roomNumber?.trim() || null,
            })),
          });
        }
      });

      const periods = await prisma.timetablePeriod.findMany({
        where: { classId, schoolId },
        orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
        include: { teacher: { select: { id: true, name: true } } },
      });

      logger.info(`Timetable updated for class ${classId} by user ${userId}`);
      return res.json({
        success: true,
        message: 'Timetable saved',
        data: {
          classId: cls.id,
          className: `${cls.name} ${cls.section}`,
          periods: periods.map((p) => formatPeriod(p)),
        },
      });
    } catch (error) {
      logger.error('upsertClassTimetable error:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
};
