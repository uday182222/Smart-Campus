import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const examController = {
  /** GET /exams?classId= — list exams for a class */
  async list(req: AuthRequest, res: Response) {
    const classId = req.query.classId as string;
    const schoolId = req.user?.schoolId;
    if (!schoolId) throw new AppError('School access required', 403);
    if (!classId) throw new AppError('classId required', 400);

    const exams = await prisma.exam.findMany({
      where: {
        classId,
        class: { schoolId },
      },
      orderBy: { date: 'desc' },
      include: { class: { select: { name: true, section: true } } },
    });
    return res.json({ success: true, data: { exams } });
  },

  /** POST /exams — create exam */
  async create(req: AuthRequest, res: Response) {
    const teacherId = req.user?.id;
    const schoolId = req.user?.schoolId;
    if (!teacherId || !schoolId) throw new AppError('Authentication required', 403);

    const { classId, name, subject, examType, date, maxMarks, passingMarks } = req.body;
    if (!classId || !name || !subject || !examType || !date) {
      throw new AppError('classId, name, subject, examType, date required', 400);
    }

    const cls = await prisma.class.findFirst({
      where: { id: classId, schoolId },
    });
    if (!cls) throw new AppError('Class not found', 404);

    const exam = await prisma.exam.create({
      data: {
        classId,
        name,
        subject,
        examType: examType || 'mid_term',
        date: new Date(date),
        maxMarks: Number(maxMarks) || 100,
        passingMarks: Number(passingMarks) ?? 40,
      },
    });
    logger.info(`Exam created: ${exam.id}`);
    return res.status(201).json({ success: true, data: { exam } });
  },
};
