import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const feeController = {
  /** GET /fees/:schoolId — list fee structures for a school */
  async listBySchool(req: AuthRequest, res: Response) {
    const { schoolId } = req.params;
    const structures = await prisma.feeStructure.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { payments: true } }
      }
    });
    return res.json({ success: true, data: { feeStructures: structures } });
  },

  /** POST /fees — create fee structure (ADMIN) */
  async createStructure(req: AuthRequest, res: Response) {
    const body = req.body;
    const schoolId = body.schoolId ?? req.user?.schoolId;
    if (!schoolId) throw new AppError('schoolId required', 400);

    const fee = await prisma.feeStructure.create({
      data: {
        schoolId,
        name: body.name,
        type: body.type || 'tuition',
        amount: Number(body.amount),
        currency: body.currency || 'INR',
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        isActive: body.isActive !== false
      }
    });
    logger.info(`Fee structure created: ${fee.id}`);
    return res.status(201).json({ success: true, data: { feeStructure: fee } });
  },

  /** GET /fees/student/:studentId — get fees/payments for a student */
  async getByStudent(req: AuthRequest, res: Response) {
    const { studentId } = req.params;
    const payments = await prisma.feePayment.findMany({
      where: { studentId },
      orderBy: { paidAt: 'desc' },
      include: {
        feeStructure: true
      }
    });
    return res.json({ success: true, data: { payments } });
  },

  /** POST /fees/payment — record a payment */
  async recordPayment(req: AuthRequest, res: Response) {
    const body = req.body;
    const payment = await prisma.feePayment.create({
      data: {
        feeStructureId: body.feeStructureId,
        studentId: body.studentId,
        amountPaid: Number(body.amountPaid),
        paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
        paymentMethod: body.paymentMethod || 'cash',
        reference: body.reference ?? null
      },
      include: { feeStructure: true }
    });
    logger.info(`Fee payment recorded: ${payment.id}`);
    return res.status(201).json({ success: true, data: { payment } });
  },

  /** GET /fees/dues/:schoolId — get fee structures that are overdue for the school */
  async getDues(req: AuthRequest, res: Response) {
    const { schoolId } = req.params;
    const now = new Date();
    const structures = await prisma.feeStructure.findMany({
      where: {
        schoolId,
        isActive: true,
        dueDate: { lt: now }
      },
      orderBy: { dueDate: 'asc' },
      include: {
        _count: { select: { payments: true } }
      }
    });
    return res.json({ success: true, data: { dues: structures } });
  }
};
