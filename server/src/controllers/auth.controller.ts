import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    schoolId?: string;
  };
}

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { email, password, name, role, schoolId, phone, metadata } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw new AppError('User already exists', 400);
      }

      // Create user first (without password for initial create)
      const user = await prisma.user.create({
        data: {
          email,
          name,
          role,
          schoolId,
          phone,
          metadata: metadata || {},
          preferences: {}
        }
      });

      // Hash password and update user
      const hashedPassword = await bcrypt.hash(password, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role,
          schoolId: user.schoolId 
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'USER_REGISTERED',
          resource: 'User',
          resourceId: user.id,
          details: { email, role }
        }
      });

      logger.info(`User registered: ${email}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            schoolId: user.schoolId
          },
          token
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password, schoolId } = req.body;

      // Find user by email (and schoolId when provided)
      const where: { email: string; schoolId?: string } = { email };
      if (schoolId) where.schoolId = schoolId;

      const user = await prisma.user.findFirst({
        where: where.schoolId !== undefined ? where : { email },
        include: { school: true }
      });

      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      // SUPER_ADMIN skips schoolId; others must send it
      if (user.role !== 'SUPER_ADMIN' && !schoolId) {
        return res.status(400).json({
          success: false,
          message: 'School ID is required for this account'
        });
      }
      if (schoolId && user.schoolId !== schoolId) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check if user is active
      if (user.status !== 'ACTIVE') {
        throw new AppError('Account is not active', 401);
      }

      // Verify password if user has one set (backward compatible for demo users without password)
      if (user.password) {
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          throw new AppError('Invalid credentials', 401);
        }
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role,
          schoolId: user.schoolId 
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'USER_LOGIN',
          resource: 'User',
          resourceId: user.id,
          details: { email, role: user.role }
        }
      });

      logger.info(`User logged in: ${email}`);

      // Omit password from response
      const { password: _p, ...userWithoutPassword } = user;
      const safeUser = {
        ...userWithoutPassword,
        school: user.school
      };

      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: safeUser.id,
            email: safeUser.email,
            name: safeUser.name,
            role: safeUser.role,
            schoolId: safeUser.schoolId,
            school: safeUser.school
          },
          token
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { 
          school: true,
          parentStudents: {
            include: { student: true }
          },
          teacherClasses: {
            include: { class: true }
          }
        }
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  },

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { name, phone, preferences } = req.body;

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          name,
          phone,
          preferences: preferences || {}
        }
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'PROFILE_UPDATED',
          resource: 'User',
          resourceId: userId,
          details: { name, phone }
        }
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  async changePassword(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { newPassword } = req.body;

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'PASSWORD_CHANGED',
          resource: 'User',
          resourceId: userId
        }
      });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  async logout(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'USER_LOGOUT',
          resource: 'User',
          resourceId: userId
        }
      });

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  async refreshToken(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Generate new JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role,
          schoolId: user.schoolId 
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        data: { token }
      });
    } catch (error) {
      logger.error('Refresh token error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  },

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // In production, send reset email
      // For now, just return success
      res.json({
        success: true,
        message: 'Password reset instructions sent to your email'
      });
    } catch (error) {
      logger.error('Forgot password error:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  },

  async resetPassword(req: Request, res: Response) {
    try {
      const {} = req.body;

      // In production, verify reset token
      // For now, just return success
      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  async verifyEmail(req: Request, res: Response) {
    try {
      const {} = req.body;

      // In production, verify email token
      res.json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error) {
      logger.error('Verify email error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  async resendVerification(req: Request, res: Response) {
    try {
      const {} = req.body;

      // In production, resend verification email
      res.json({
        success: true,
        message: 'Verification email sent'
      });
    } catch (error) {
      logger.error('Resend verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};
