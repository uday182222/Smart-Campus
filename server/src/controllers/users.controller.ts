import { Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { AppError, NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcrypt';

/**
 * Users Controller
 * Handles all user management operations including CRUD and bulk import
 */

interface CreateUserBody {
  email: string;
  password?: string;
  name: string;
  role: string;
  schoolId?: string;
  phone?: string;
  metadata?: any;
  cognitoId?: string;
}

interface UpdateUserBody {
  name?: string;
  phone?: string;
  role?: string;
  status?: string;
  photo?: string;
  metadata?: any;
  preferences?: any;
  pushToken?: string;
}

interface BulkImportUser {
  email: string;
  name: string;
  role: string;
  phone?: string;
  schoolId?: string;
  metadata?: any;
}

interface BulkImportBody {
  users: BulkImportUser[];
  sendCredentials?: boolean;
}

export const usersController = {
  /**
   * POST /api/users
   * Create a new user (with optional Cognito integration)
   */
  async createUser(req: AuthRequest, res: Response) {
    try {
      const currentUserId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const {
        email,
        password,
        name,
        role,
        schoolId: userSchoolId,
        phone,
        metadata,
        cognitoId,
      }: CreateUserBody = req.body;

      // Authorization check
      if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN') {
        throw new ForbiddenError('Only admins can create users');
      }

      // Validate required fields
      if (!email || !name || !role) {
        throw new ValidationError('email, name, and role are required');
      }

      // Validate role
      const validRoles = ['PARENT', 'TEACHER', 'ADMIN', 'PRINCIPAL', 'SUPER_ADMIN', 'OFFICE_STAFF', 'BUS_HELPER', 'STUDENT'];
      if (!validRoles.includes(role)) {
        throw new ValidationError(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
      }

      // Determine school ID
      const targetSchoolId = userSchoolId || schoolId;
      if (!targetSchoolId && role !== 'SUPER_ADMIN') {
        throw new ValidationError('schoolId is required for non-super-admin users');
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ValidationError('User with this email already exists');
      }

      // Verify school exists (if provided)
      if (targetSchoolId) {
        const school = await prisma.school.findUnique({
          where: { id: targetSchoolId },
        });

        if (!school) {
          throw new NotFoundError('School not found');
        }
      }

      // Hash password if provided (for non-Cognito users)
      // Note: Password is not stored in database for Cognito users
      if (password) {
        await bcrypt.hash(password, 12);
        // In production, you would store this or use it for Cognito
      }

      // TODO: Create user in Cognito if cognitoId is not provided
      // For now, we'll just store the cognitoId if provided
      // In production, you would:
      // 1. Create user in Cognito User Pool
      // 2. Get the Cognito user ID
      // 3. Store it in cognitoId field

      // Create user in database
      const user = await prisma.user.create({
        data: {
          email,
          name,
          role: role as any,
          schoolId: targetSchoolId || null,
          phone: phone || null,
          metadata: metadata || {},
          preferences: {},
          cognitoId: cognitoId || null,
          status: 'ACTIVE',
        },
        include: {
          school: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: currentUserId!,
          action: 'USER_CREATED',
          resource: 'User',
          resourceId: user.id,
          details: {
            email,
            role,
            schoolId: targetSchoolId,
          },
        },
      });

      logger.info(`User created: ${user.id} by ${currentUserId}`);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            schoolId: user.schoolId,
            school: user.school,
            phone: user.phone,
            status: user.status,
            cognitoId: user.cognitoId,
            createdAt: user.createdAt,
          },
        },
      });
    } catch (error) {
      logger.error('Error creating user:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  },

  /**
   * PUT /api/users/:id
   * Update an existing user
   */
  async updateUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const updateData: UpdateUserBody = req.body;

      // Authorization check
      if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN' && id !== currentUserId) {
        throw new ForbiddenError('You can only update your own profile or must be an admin');
      }

      // Get existing user
      const existingUser = await prisma.user.findUnique({
        where: { id },
        include: {
          school: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      // Verify same school (unless super admin or updating own profile)
      if (
        req.user?.role !== 'SUPER_ADMIN' &&
        id !== currentUserId &&
        existingUser.schoolId !== schoolId
      ) {
        throw new ForbiddenError('Cannot update user from different school');
      }

      // Build update data
      const data: any = {};

      if (updateData.name !== undefined) data.name = updateData.name;
      if (updateData.phone !== undefined) data.phone = updateData.phone;
      if (updateData.photo !== undefined) data.photo = updateData.photo;
      if (updateData.metadata !== undefined) data.metadata = updateData.metadata as any;
      if (updateData.preferences !== undefined) data.preferences = updateData.preferences as any;
      if (updateData.pushToken !== undefined) data.pushToken = updateData.pushToken;

      // Only admins can change role and status
      if (req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN') {
        if (updateData.role !== undefined) {
          const validRoles = ['PARENT', 'TEACHER', 'ADMIN', 'PRINCIPAL', 'SUPER_ADMIN', 'OFFICE_STAFF', 'BUS_HELPER', 'STUDENT'];
          if (!validRoles.includes(updateData.role)) {
            throw new ValidationError(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
          }
          data.role = updateData.role as any;
        }
        if (updateData.status !== undefined) {
          const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'GRADUATED'];
          if (!validStatuses.includes(updateData.status)) {
            throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
          }
          data.status = updateData.status as any;
        }
      }

      // Update user
      const updated = await prisma.user.update({
        where: { id },
        data,
        include: {
          school: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: currentUserId!,
          action: 'USER_UPDATED',
          resource: 'User',
          resourceId: id,
          details: {
            changes: Object.keys(data),
          },
        },
      });

      logger.info(`User updated: ${id} by ${currentUserId}`);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: {
          user: {
            id: updated.id,
            email: updated.email,
            name: updated.name,
            role: updated.role,
            schoolId: updated.schoolId,
            school: updated.school,
            phone: updated.phone,
            photo: updated.photo,
            status: updated.status,
            metadata: updated.metadata,
            preferences: updated.preferences,
            lastLogin: updated.lastLogin,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
          },
        },
      });
    } catch (error) {
      logger.error('Error updating user:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  },

  /**
   * DELETE /api/users/:id
   * Deactivate a user (soft delete)
   */
  async deleteUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.id;
      const schoolId = req.user?.schoolId;

      // Authorization check
      if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN') {
        throw new ForbiddenError('Only admins can deactivate users');
      }

      // Cannot delete yourself
      if (id === currentUserId) {
        throw new ValidationError('You cannot deactivate your own account');
      }

      // Get existing user
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      // Verify same school (unless super admin)
      if (req.user?.role !== 'SUPER_ADMIN' && existingUser.schoolId !== schoolId) {
        throw new ForbiddenError('Cannot deactivate user from different school');
      }

      // Soft delete - set status to INACTIVE
      const updated = await prisma.user.update({
        where: { id },
        data: {
          status: 'INACTIVE',
        },
      });

      // TODO: Disable user in Cognito
      // In production, you would:
      // 1. Disable the user in Cognito User Pool
      // 2. Optionally delete the user from Cognito

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: currentUserId!,
          action: 'USER_DEACTIVATED',
          resource: 'User',
          resourceId: id,
          details: {
            email: existingUser.email,
            role: existingUser.role,
          },
        },
      });

      logger.info(`User deactivated: ${id} by ${currentUserId}`);

      res.json({
        success: true,
        message: 'User deactivated successfully',
        data: {
          user: {
            id: updated.id,
            email: updated.email,
            name: updated.name,
            status: updated.status,
          },
        },
      });
    } catch (error) {
      logger.error('Error deactivating user:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  },

  /**
   * POST /api/users/bulk-import
   * Bulk import users from CSV/JSON
   */
  async bulkImportUsers(req: AuthRequest, res: Response) {
    try {
      const currentUserId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const { users }: BulkImportBody = req.body;

      // Authorization check
      if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN') {
        throw new ForbiddenError('Only admins can bulk import users');
      }

      if (!users || !Array.isArray(users) || users.length === 0) {
        throw new ValidationError('users array is required and must not be empty');
      }

      if (users.length > 1000) {
        throw new ValidationError('Cannot import more than 1000 users at once');
      }

      const results = {
        success: [] as any[],
        failed: [] as any[],
      };

      // Process each user
      for (const userData of users) {
        try {
          // Validate user data
          if (!userData.email || !userData.name || !userData.role) {
            results.failed.push({
              email: userData.email || 'unknown',
              error: 'Missing required fields: email, name, role',
            });
            continue;
          }

          // Check if user already exists
          const existing = await prisma.user.findUnique({
            where: { email: userData.email },
          });

          if (existing) {
            results.failed.push({
              email: userData.email,
              error: 'User already exists',
            });
            continue;
          }

          // Determine school ID
          const targetSchoolId = userData.schoolId || schoolId;
          if (!targetSchoolId && userData.role !== 'SUPER_ADMIN') {
            results.failed.push({
              email: userData.email,
              error: 'schoolId is required for non-super-admin users',
            });
            continue;
          }

          // Create user
          const user = await prisma.user.create({
            data: {
              email: userData.email,
              name: userData.name,
              role: userData.role as any,
              schoolId: targetSchoolId || null,
              phone: userData.phone || null,
              metadata: userData.metadata || {},
              preferences: {},
              status: 'ACTIVE',
            },
          });

          // TODO: Create user in Cognito if sendCredentials is true
          // In production, you would:
          // 1. Generate a temporary password
          // 2. Create user in Cognito
          // 3. Send credentials via email/SMS

          results.success.push({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          });
        } catch (error: any) {
          results.failed.push({
            email: userData.email || 'unknown',
            error: error.message || 'Unknown error',
          });
        }
      }

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: currentUserId!,
          action: 'BULK_USER_IMPORT',
          resource: 'User',
          resourceId: null,
          details: {
            total: users.length,
            success: results.success.length,
            failed: results.failed.length,
          },
        },
      });

      logger.info(`Bulk import completed: ${results.success.length} success, ${results.failed.length} failed`);

      res.status(201).json({
        success: true,
        message: `Bulk import completed: ${results.success.length} users created, ${results.failed.length} failed`,
        data: {
          total: users.length,
          success: results.success.length,
          failed: results.failed.length,
          results,
        },
      });
    } catch (error) {
      logger.error('Error bulk importing users:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  },
};

