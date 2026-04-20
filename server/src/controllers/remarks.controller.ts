import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export const remarksController = {
  /** POST /remarks — create remark */
  async create(req: AuthRequest, res: Response) {
    const teacherId = req.user?.id;
    const schoolId = req.user?.schoolId;
    if (!teacherId || !schoolId) throw new AppError('Authentication required', 403);

    const { studentId, content, type } = req.body;
    if (!studentId || !content) throw new AppError('studentId and content required', 400);

    const student = await prisma.user.findFirst({
      where: { id: studentId, role: 'STUDENT', schoolId },
    });
    if (!student) throw new NotFoundError('Student not found');

    const remark = await prisma.remark.create({
      data: {
        studentId,
        teacherId,
        content: String(content),
        category: req.body.category || 'general',
        remarkType: type || 'neutral',
        isPrivate: req.body.isPrivate === true,
      },
    });
    logger.info(`Remark created: ${remark.id}`);
    return res.status(201).json({ success: true, data: { remark } });
  },

  /** GET /remarks/student/:studentId */
  async getByStudent(req: AuthRequest, res: Response) {
    const { studentId } = req.params;
    const schoolId = req.user?.schoolId;
    if (!schoolId) throw new AppError('School access required', 403);

    const remarks = await prisma.remark.findMany({
      where: {
        studentId,
        teacher: { schoolId },
      },
      orderBy: { createdAt: 'desc' },
      include: { teacher: { select: { id: true, name: true } } },
    });
    return res.json({ success: true, data: { remarks } });
  },

  /** GET /remarks/class/:classId — remarks for students in class */
  async getByClass(req: AuthRequest, res: Response) {
    const { classId } = req.params;
    const schoolId = req.user?.schoolId;
    if (!schoolId) throw new AppError('School access required', 403);

    const attendanceRecords = await prisma.attendance.findMany({
      where: { classId },
      select: { studentId: true },
      distinct: ['studentId'],
    });
    const studentIds = attendanceRecords.map((a) => a.studentId);
    if (studentIds.length === 0) {
      return res.json({ success: true, data: { remarks: [] } });
    }

    const remarks = await prisma.remark.findMany({
      where: { studentId: { in: studentIds } },
      orderBy: { createdAt: 'desc' },
      include: { teacher: { select: { id: true, name: true } } },
    });
    return res.json({ success: true, data: { remarks } });
  },

  /** PUT /remarks/:id */
  async update(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const teacherId = req.user?.id;
    if (!teacherId) throw new AppError('Authentication required', 403);

    const existing = await prisma.remark.findFirst({
      where: { id, teacherId },
    });
    if (!existing) throw new NotFoundError('Remark not found');

    const { content, type, isPrivate } = req.body;
    const remark = await prisma.remark.update({
      where: { id },
      data: {
        ...(content !== undefined && { content }),
        ...(type !== undefined && { remarkType: type }),
        ...(isPrivate !== undefined && { isPrivate }),
      },
    });
    return res.json({ success: true, data: { remark } });
  },

  /** DELETE /remarks/:id */
  async remove(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const teacherId = req.user?.id;
    if (!teacherId) throw new AppError('Authentication required', 403);

    const existing = await prisma.remark.findFirst({
      where: { id, teacherId },
    });
    if (!existing) throw new NotFoundError('Remark not found');

    await prisma.remark.delete({ where: { id } });
    logger.info(`Remark deleted: ${id}`);
    return res.json({ success: true, message: 'Remark deleted' });
  },
};
