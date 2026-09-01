import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';

export const supportController = {
  async createConcern(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const schoolId = req.user!.schoolId;
      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      const { subject, message } = req.body as { subject?: string; message?: string };
      if (!subject?.trim() || !message?.trim()) {
        return res.status(400).json({ success: false, message: 'subject and message required' });
      }

      const concern = await prisma.concern.create({
        data: {
          userId,
          schoolId,
          subject: subject.trim(),
          message: message.trim(),
        },
      });

      logger.info(`Concern ${concern.id} submitted by user ${userId}`);
      return res.status(200).json({ success: true, data: { id: concern.id } });
    } catch (error) {
      logger.error('Create concern error:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async getConcerns(req: AuthRequest, res: Response) {
    try {
      const schoolId = req.user!.schoolId;
      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      const concerns = await prisma.concern.findMany({
        where: { schoolId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      return res.json({ success: true, data: concerns });
    } catch (error) {
      logger.error('Get concerns error:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
};
