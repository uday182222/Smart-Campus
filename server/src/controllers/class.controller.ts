import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

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
        school: { select: { name: true } }
      }
    });
    return res.json({ success: true, data: { classes } });
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
            school: { select: { name: true } }
          }
        }
      }
    });
    const classes = teacherClasses.map(tc => tc.class);
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
            teacher: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });
    if (!cls) throw new AppError('Class not found', 404);

    // Students: distinct studentIds from attendance for this class, with user details
    const attendanceRecords = await prisma.attendance.findMany({
      where: { classId: id },
      select: { studentId: true },
      distinct: ['studentId']
    });
    const studentIds = attendanceRecords.map(a => a.studentId);
    const students = studentIds.length
      ? await prisma.user.findMany({
          where: { id: { in: studentIds }, role: 'STUDENT' },
          select: { id: true, name: true, email: true }
        })
      : [];

    return res.json({
      success: true,
      data: {
        class: cls,
        students
      }
    });
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
  }
};
