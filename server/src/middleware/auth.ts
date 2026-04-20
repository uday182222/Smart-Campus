import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AppError, UnauthorizedError, ForbiddenError } from '../utils/errors';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    schoolId?: string;
  };
}

export const authMiddleware = {
  authenticate: async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');

      if (!token) {
        throw new UnauthorizedError('Access token required');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedError('Invalid or expired token');
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId || undefined
      };

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new UnauthorizedError('Invalid token'));
      }
    }
  },

  authorize: (...roles: string[]) => {
    return (req: AuthRequest, _res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new UnauthorizedError('Authentication required'));
      }

      if (!roles.includes(req.user.role)) {
        return next(new ForbiddenError('Insufficient permissions'));
      }

      next();
    };
  },

  requireSchool: (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user?.schoolId) {
      return next(new ForbiddenError('School access required'));
    }
    next();
  },

  requireSuperAdmin: (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ success: false, message: 'Super admin access required' });
      return;
    }
    next();
  },

  requireAdmin: (req: AuthRequest, _res: Response, next: NextFunction) => {
    const adminRoles = ['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'];
    if (!req.user || !adminRoles.includes(req.user.role)) {
      return next(new ForbiddenError('Admin access required'));
    }
    next();
  },

  requireTeacher: (req: AuthRequest, _res: Response, next: NextFunction) => {
    const teacherRoles = ['TEACHER', 'ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'];
    if (!req.user || !teacherRoles.includes(req.user.role)) {
      return next(new ForbiddenError('Teacher access required'));
    }
    next();
  },

  requireParent: (req: AuthRequest, _res: Response, next: NextFunction) => {
    const parentRoles = ['PARENT', 'ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'];
    if (!req.user || !parentRoles.includes(req.user.role)) {
      return next(new ForbiddenError('Parent access required'));
    }
    next();
  }
};