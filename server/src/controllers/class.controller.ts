import { NextFunction, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { AppError, BadRequestError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/** Live student count per class (enrollment via users.metadata.classId). */
async function liveStudentCountsForSchool(schoolId: string): Promise<Map<string, number>> {
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT', schoolId },
    select: { metadata: true },
  });
  const counts = new Map<string, number>();
  for (const s of students) {
    const cid = (s.metadata as { classId?: string } | null)?.classId;
    if (!cid) continue;
    counts.set(cid, (counts.get(cid) ?? 0) + 1);
  }
  return counts;
}

/** Students enrolled in a class (users.metadata.classId), matching teacher.controller getClassStudents. */
async function resolveClassStudents(classId: string, schoolId: string) {
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT', schoolId },
    select: { id: true, name: true, photo: true, metadata: true },
    orderBy: { name: 'asc' },
  });
  return students
    .filter((s) => (s.metadata as { classId?: string } | null)?.classId === classId)
    .map((s) => ({
      id: s.id,
      name: s.name,
      photo: s.photo ?? null,
      rollNumber: (s.metadata as { rollNumber?: string } | null)?.rollNumber ?? null,
    }));
}

export const classController = {
  /** GET /classes — list classes (filter by schoolId from JWT) */
  async list(req: AuthRequest, res: Response) {
    const schoolId = req.user?.schoolId;
    if (!schoolId) throw new AppError('School access required', 403);

    const classes = await prisma.class.findMany({
      where: { schoolId },
      orderBy: [{ name: 'asc' }, { section: 'asc' }],
      include: {
        _count: { select: { teachers: true, attendance: true } },
        school: { select: { name: true } },
        teachers: {
          include: {
            teacher: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
    const studentCounts = await liveStudentCountsForSchool(schoolId);
    const classesWithLiveCounts = classes.map((cls) => ({
      ...cls,
      currentStudents: studentCounts.get(cls.id) ?? 0,
    }));
    return res.json({ success: true, data: { classes: classesWithLiveCounts } });
  },

  /** GET /classes/today — get today's classes for the logged-in teacher */
  async today(req: AuthRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) throw new AppError('Authentication required', 401);

    const teacherClasses = await prisma.teacherClass.findMany({
      where: { teacherId: userId },
      include: {
        class: {
          include: {
            school: { select: { name: true } },
          },
        },
      },
    });
    const classes = teacherClasses.map((tc) => ({
      ...tc.class,
      isClassTeacher: tc.isClassTeacher,
      assignedSubject: tc.subject,
    }));
    return res.json({ success: true, data: { classes } });
  },

  /** GET /classes/:id — get one class with teachers and students */
  async getOne(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const cls = await prisma.class.findUnique({
      where: { id },
      include: {
        school: true,
        teachers: {
          include: {
            teacher: { select: { id: true, name: true, email: true } },
          },
        },
      }
    });
    if (!cls) throw new AppError('Class not found', 404);

    const students = await resolveClassStudents(id, cls.schoolId);

    return res.json({
      success: true,
      data: {
        class: { ...cls, currentStudents: students.length },
        students,
      },
    });
  },

  /** GET /classes/:classId/students — students in a class */
  async listStudents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { classId } = req.params;
      const schoolId = req.user?.schoolId;
      if (!schoolId) throw new ForbiddenError('School access required');

      const cls = await prisma.class.findUnique({ where: { id: classId } });
      if (!cls) throw new AppError('Class not found', 404);
      if (cls.schoolId !== schoolId) {
        throw new ForbiddenError('Access denied: class does not belong to your school');
      }

      const students = await resolveClassStudents(classId, schoolId);
      return res.json({ success: true, data: students });
    } catch (error) {
      logger.error('listStudents error:', error);
      return next(error);
    }
  },

  /** POST /classes — create class (ADMIN/PRINCIPAL) */
  async create(req: AuthRequest, res: Response) {
    const body = req.body;
    const schoolId = body.schoolId ?? req.user?.schoolId;
    if (!schoolId) throw new AppError('schoolId required', 400);

    const cls = await prisma.class.create({
      data: {
        schoolId,
        name: body.name,
        section: body.section || 'A',
        roomNumber: body.roomNumber ?? null,
        capacity: body.capacity ?? 40,
        currentStudents: body.currentStudents ?? 0,
        subjects: body.subjects ?? [],
        schedule: body.schedule ?? undefined
      }
    });
    logger.info(`Class created: ${cls.id}`);
    return res.status(201).json({ success: true, data: { class: cls } });
  },

  /** PUT /classes/:id — update class */
  async update(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const body = req.body;
    const existing = await prisma.class.findUnique({ where: { id } });
    if (!existing) throw new AppError('Class not found', 404);

    const cls = await prisma.class.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        section: body.section ?? existing.section,
        roomNumber: body.roomNumber !== undefined ? body.roomNumber : existing.roomNumber,
        capacity: body.capacity ?? existing.capacity,
        currentStudents: body.currentStudents ?? existing.currentStudents,
        subjects: body.subjects ?? existing.subjects,
        schedule: body.schedule !== undefined ? body.schedule : existing.schedule
      }
    });
    return res.json({ success: true, data: { class: cls } });
  },

  /** DELETE /classes/:id — delete class */
  async remove(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const existing = await prisma.class.findUnique({ where: { id } });
    if (!existing) throw new AppError('Class not found', 404);
    await prisma.class.delete({ where: { id } });
    logger.info(`Class deleted: ${id}`);
    return res.json({ success: true, message: 'Class deleted' });
  },

  /** PATCH /classes/:classId/class-teacher — designate class teacher (ADMIN/PRINCIPAL) */
  async setClassTeacher(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { classId } = req.params;
      const schoolId = req.user?.schoolId;
      const { teacherId } = req.body as { teacherId?: string };

      if (!schoolId) throw new ForbiddenError('School access required');
      if (!teacherId?.trim()) throw new BadRequestError('teacherId is required');

      const cls = await prisma.class.findFirst({
        where: { id: classId, schoolId },
      });
      if (!cls) throw new ForbiddenError('Class not found in your school');

      const assignment = await prisma.teacherClass.findFirst({
        where: { classId, teacherId: teacherId.trim() },
      });
      if (!assignment) {
        throw new BadRequestError('Teacher is not assigned to this class');
      }

      const updated = await prisma.$transaction(async (tx) => {
        await tx.teacherClass.updateMany({
          where: { classId },
          data: { isClassTeacher: false },
        });
        return tx.teacherClass.update({
          where: { id: assignment.id },
          data: { isClassTeacher: true },
          include: {
            teacher: { select: { id: true, name: true, email: true } },
            class: { select: { id: true, name: true, section: true } },
          },
        });
      });

      logger.info(`Class teacher set: class=${classId} teacher=${teacherId} by user=${req.user?.id}`);
      return res.json({ success: true, data: { assignment: updated } });
    } catch (error) {
      logger.error('setClassTeacher error:', error);
      return next(error);
    }
  },
};
