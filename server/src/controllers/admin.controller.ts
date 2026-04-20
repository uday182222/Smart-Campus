import { Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { AppError, NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';
import { CognitoService } from '../services/cognito.service';
import { NotificationService } from '../services/notification.service';
import Papa from 'papaparse';

/**
 * Admin Controller
 * Complete user and school management with AWS Cognito integration, bulk import, and analytics
 */

// TypeScript interfaces
interface CreateUserBody {
  email: string;
  name: string;
  role: 'TEACHER' | 'PARENT' | 'STUDENT' | 'OFFICE_STAFF' | 'BUS_HELPER';
  schoolId: string;
  phone?: string;
  classIds?: string[];
  parentId?: string; // For students
}

interface UpdateUserBody {
  name?: string;
  phone?: string;
  classIds?: string[];
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

interface BulkImportBody {
  role: string;
}

interface SendAnnouncementBody {
  title: string;
  message: string;
  targetAudience: string | string[];
  priority?: 'normal' | 'important' | 'urgent';
  scheduledFor?: string; // ISO date
  classIds?: string[];
}

// Removed: generateTemporaryPassword (unused - using CognitoService instead)

/**
 * Parse CSV file and validate rows
 */
function parseCSV(csvContent: string): Array<{
  email: string;
  name: string;
  phone?: string;
  classId?: string;
  parentEmail?: string;
}> {
  const result = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  if (result.errors.length > 0) {
    throw new ValidationError(`CSV parsing errors: ${result.errors.map((e) => e.message).join(', ')}`);
  }

  return result.data as any[];
}

export const adminController = {
  /**
   * POST /api/admin/user
   * Create new user (Teacher, Parent, Student, Staff)
   */
  async createUser(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const {
        email,
        name,
        role,
        schoolId: userSchoolId,
        phone,
        classIds,
        parentId,
      }: CreateUserBody = req.body;

      // Authorization check
      const allowedRoles = ['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'];
      if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Only administrators can create users');
      }

      if (!schoolId && !userSchoolId) {
        throw new ForbiddenError('School access required');
      }

      const targetSchoolId = userSchoolId || schoolId;

      // Validate required fields
      if (!email || !name || !role || !targetSchoolId) {
        throw new ValidationError('email, name, role, and schoolId are required');
      }

      // Validate role
      const validRoles = ['TEACHER', 'PARENT', 'STUDENT', 'OFFICE_STAFF', 'BUS_HELPER'];
      if (!validRoles.includes(role)) {
        throw new ValidationError(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ValidationError('Invalid email format');
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ValidationError('User with this email already exists');
      }

      // Verify school exists
      const school = await prisma.school.findUnique({
        where: { id: targetSchoolId },
      });

      if (!school) {
        throw new NotFoundError('School not found');
      }

      // Validate classIds if provided
      if (classIds && classIds.length > 0) {
        const classes = await prisma.class.findMany({
          where: {
            id: { in: classIds },
            schoolId: targetSchoolId,
          },
        });

        if (classes.length !== classIds.length) {
          throw new ValidationError('One or more classes not found or do not belong to this school');
        }
      }

      // Validate parent if student
      if (role === 'STUDENT' && parentId) {
        const parent = await prisma.user.findFirst({
          where: {
            id: parentId,
            role: 'PARENT',
            schoolId: targetSchoolId,
          },
        });

        if (!parent) {
          throw new NotFoundError('Parent not found or does not belong to this school');
        }
      }

      // Create user in Cognito
      let cognitoId: string | null = null;
      let temporaryPassword: string | null = null;

      try {
        const cognitoResult = await CognitoService.createUser(email, name, role);
        cognitoId = cognitoResult.cognitoId;
        temporaryPassword = cognitoResult.temporaryPassword;
      } catch (cognitoError: any) {
        logger.error('Cognito user creation failed:', cognitoError);
        // Continue with database creation even if Cognito fails
        // In production, you might want to throw here
        if (cognitoError.message?.includes('already exists')) {
          throw new ValidationError('User with this email already exists in Cognito');
        }
      }

      // Prepare user metadata
      const metadata: any = {};
      if (role === 'STUDENT' && classIds && classIds.length > 0) {
        metadata.classId = classIds[0]; // Primary class
        metadata.allClassIds = classIds;
      }
      if (role === 'STUDENT' && parentId) {
        metadata.parentId = parentId;
      }

      // Create user in database
      const user = await prisma.user.create({
        data: {
          email,
          name,
          role: role as any,
          schoolId: targetSchoolId,
          phone: phone || null,
          metadata: metadata as any,
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

      // Link student to parent if provided
      if (role === 'STUDENT' && parentId) {
        await prisma.parentStudent.create({
          data: {
            parentId,
            studentId: user.id,
            relationship: 'parent',
            isPrimary: true,
          },
        });
      }

      // Assign teacher to classes if provided
      if (role === 'TEACHER' && classIds && classIds.length > 0) {
        await Promise.all(
              classIds.map((classId) =>
                prisma.teacherClass.create({
                  data: {
                    teacherId: user.id,
                    classId,
                  } as any,
                })
              )
        );
      }

      // TODO: Send welcome email with credentials
      // In production, integrate with email service (SES, SendGrid, etc.)
      if (temporaryPassword) {
        logger.info(`Temporary password for ${email}: ${temporaryPassword}`);
        // Email would be sent here
      }

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: userId!,
          action: 'USER_CREATED',
          resource: 'User',
          resourceId: user.id,
          details: {
            email,
            role,
            schoolId: targetSchoolId,
            cognitoId,
          },
        },
      });

      logger.info(`User created: ${user.id} by ${userId}`);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          userId: user.id,
          temporaryPassword: temporaryPassword || null,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            schoolId: user.schoolId,
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
   * GET /api/admin/users
   * Get all users in school
   */
  async getUsers(req: AuthRequest, res: Response) {
    try {
      const schoolId = req.query.schoolId as string;
      const userSchoolId = req.user?.schoolId;
      const { role, status, search, limit = '50', offset = '0' } = req.query;

      // Authorization check
      const allowedRoles = ['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN', 'OFFICE_STAFF'];
      if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Only administrators and staff can view users');
      }

      if (!userSchoolId) {
        throw new ForbiddenError('School access required');
      }

      const targetSchoolId = schoolId || userSchoolId;

      // Verify access
      if (targetSchoolId !== userSchoolId && req.user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('You do not have access to this school');
      }

      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);

      // Build where clause
      const where: any = {
        schoolId: targetSchoolId,
      };

      if (role) {
        where.role = role;
      }

      if (status) {
        where.status = status;
      }

      // Search by name or email
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      // Get total count
      const total = await prisma.user.count({ where });

      // Get users
      const users = await prisma.user.findMany({
        where,
        include: {
          school: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offsetNum,
        take: limitNum,
      });

      // Format response
      const formattedUsers = users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId,
        school: user.school,
        phone: user.phone,
        status: user.status,
        photo: user.photo,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));

      logger.info(`Retrieved ${formattedUsers.length} users for school ${targetSchoolId}`);

      res.json({
        success: true,
        data: {
          users: formattedUsers,
          total,
          pagination: {
            limit: limitNum,
            offset: offsetNum,
            hasMore: offsetNum + limitNum < total,
          },
        },
      });
    } catch (error) {
      logger.error('Error getting users:', error);
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
   * PUT /api/admin/user/:userId
   * Update user details
   */
  async updateUser(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const { name, phone, classIds, status }: UpdateUserBody = req.body;

      // Authorization check
      const allowedRoles = ['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'];
      if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Only administrators can update users');
      }

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Get existing user
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          school: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      // Verify same school
      if (existingUser.schoolId !== schoolId && req.user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Cannot update user from different school');
      }

      // Build update data
      const updateData: any = {};

      if (name !== undefined) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (status !== undefined) {
        updateData.status = status;
        // If deactivating, also disable in Cognito
        if (status === 'INACTIVE' && existingUser.cognitoId) {
          await CognitoService.disableUser(existingUser.cognitoId);
        }
      }

      // Update metadata if classIds provided
      if (classIds !== undefined) {
        const metadata = (existingUser.metadata as any) || {};
        if (classIds.length > 0) {
          metadata.classId = classIds[0];
          metadata.allClassIds = classIds;
        } else {
          delete metadata.classId;
          delete metadata.allClassIds;
        }
        updateData.metadata = metadata as any;

        // Update teacher-class relationships if teacher
        if (existingUser.role === 'TEACHER') {
          // Delete existing relationships
          await prisma.teacherClass.deleteMany({
            where: { teacherId: userId },
          });

          // Create new relationships
          if (classIds.length > 0) {
            await Promise.all(
              classIds.map((classId) =>
                prisma.teacherClass.create({
                  data: {
                    teacherId: userId,
                    classId,
                  } as any,
                })
              )
            );
          }
        }
      }

      // Update user
      const updated = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
          school: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Update Cognito attributes if name or phone changed
      if ((name !== undefined || phone !== undefined) && existingUser.cognitoId) {
        await CognitoService.updateUserAttributes(existingUser.cognitoId, {
          name: name || existingUser.name,
          phone: phone || existingUser.phone || undefined,
        });
      }

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: currentUserId!,
          action: 'USER_UPDATED',
          resource: 'User',
          resourceId: userId,
          details: {
            changes: Object.keys(updateData),
          },
        },
      });

      logger.info(`User updated: ${userId} by ${currentUserId}`);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: {
          user: {
            id: updated.id,
            email: updated.email,
            name: updated.name,
            role: updated.role,
            phone: updated.phone,
            status: updated.status,
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
   * DELETE /api/admin/user/:userId
   * Deactivate user (soft delete)
   */
  async deactivateUser(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.id;
      const schoolId = req.user?.schoolId;

      // Authorization check
      const allowedRoles = ['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'];
      if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Only administrators can deactivate users');
      }

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify same school
      if (user.schoolId !== schoolId && req.user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Cannot deactivate user from different school');
      }

      // Prevent deactivating self
      if (userId === currentUserId) {
        throw new ValidationError('Cannot deactivate your own account');
      }

      // Disable user in Cognito
      if (user.cognitoId) {
        await CognitoService.disableUser(user.cognitoId);
      }

      // Mark as inactive in database
      const deactivated = await prisma.user.update({
        where: { id: userId },
        data: {
          status: 'INACTIVE',
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: currentUserId!,
          action: 'USER_DEACTIVATED',
          resource: 'User',
          resourceId: userId,
          details: {
            email: user.email,
            role: user.role,
          },
        },
      });

      logger.info(`User deactivated: ${userId} by ${currentUserId}`);

      res.json({
        success: true,
        message: 'User deactivated successfully',
        data: {
          user: {
            id: deactivated.id,
            email: deactivated.email,
            status: deactivated.status,
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
   * POST /api/admin/user/:userId/reset-password
   * Reset user password
   */
  async resetPassword(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.id;
      const schoolId = req.user?.schoolId;

      // Authorization check
      const allowedRoles = ['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'];
      if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Only administrators can reset passwords');
      }

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify same school
      if (user.schoolId !== schoolId && req.user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Cannot reset password for user from different school');
      }

      if (!user.cognitoId) {
        throw new ValidationError('User does not have a Cognito account');
      }

      // Trigger password reset in Cognito
      await CognitoService.resetPassword(user.cognitoId);

      // TODO: Send reset link email
      // In production, Cognito will send the reset email automatically

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: currentUserId!,
          action: 'PASSWORD_RESET',
          resource: 'User',
          resourceId: userId,
          details: {
            email: user.email,
          },
        },
      });

      logger.info(`Password reset initiated for user: ${userId} by ${currentUserId}`);

      res.json({
        success: true,
        message: 'Password reset email sent successfully',
      });
    } catch (error) {
      logger.error('Error resetting password:', error);
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
   * POST /api/admin/users/bulk-import
   * Bulk import users from CSV
   */
  async bulkImport(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const file = req.file;
      const { role }: BulkImportBody = req.body;

      // Authorization check
      const allowedRoles = ['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'];
      if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Only administrators can import users');
      }

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      if (!file) {
        throw new ValidationError('CSV file is required');
      }

      if (!role) {
        throw new ValidationError('role is required');
      }

      // Validate role
      const validRoles = ['TEACHER', 'PARENT', 'STUDENT', 'OFFICE_STAFF', 'BUS_HELPER'];
      if (!validRoles.includes(role)) {
        throw new ValidationError(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
      }

      // Parse CSV
      const csvContent = file.buffer.toString('utf-8');
      const rows = parseCSV(csvContent);

      if (rows.length === 0) {
        throw new ValidationError('CSV file is empty or has no valid rows');
      }

      // Validate CSV structure
      const requiredColumns = ['email', 'name'];
      const firstRow = rows[0];
      const missingColumns = requiredColumns.filter((col) => !(col in firstRow));
      if (missingColumns.length > 0) {
        throw new ValidationError(`CSV missing required columns: ${missingColumns.join(', ')}`);
      }

      // Verify school exists
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
      });

      if (!school) {
        throw new NotFoundError('School not found');
      }

      // Process users in batch
      const results = {
        imported: 0,
        failed: 0,
        errors: [] as Array<{ row: number; email: string; error: string }>,
      };

      // Process in batches of 10 to avoid overwhelming the system
      const batchSize = 10;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (row, index) => {
            const rowNumber = i + index + 2; // +2 because CSV is 1-indexed and has header

            try {
              const email = row.email?.trim();
              const name = row.name?.trim();
              const phone = row.phone?.trim();
              const classId = row.classId?.trim();

              if (!email || !name) {
                results.failed++;
                results.errors.push({
                  row: rowNumber,
                  email: email || 'N/A',
                  error: 'Missing required fields: email or name',
                });
                return;
              }

              // Validate email format
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(email)) {
                results.failed++;
                results.errors.push({
                  row: rowNumber,
                  email,
                  error: 'Invalid email format',
                });
                return;
              }

              // Check if user already exists
              const existingUser = await prisma.user.findUnique({
                where: { email },
              });

              if (existingUser) {
                results.failed++;
                results.errors.push({
                  row: rowNumber,
                  email,
                  error: 'User already exists',
                });
                return;
              }

              // Validate class if provided
              let classIds: string[] = [];
              if (classId) {
                const classRecord = await prisma.class.findFirst({
                  where: {
                    id: classId,
                    schoolId,
                  },
                });

                if (!classRecord) {
                  results.failed++;
                  results.errors.push({
                    row: rowNumber,
                    email,
                    error: `Class ${classId} not found`,
                  });
                  return;
                }

                classIds = [classId];
              }

              // Create user in Cognito
              let cognitoId: string | null = null;

              try {
                const cognitoResult = await CognitoService.createUser(email, name, role);
                cognitoId = cognitoResult.cognitoId;
                // temporaryPassword not used in bulk import
              } catch (cognitoError: any) {
                if (cognitoError.message?.includes('already exists')) {
                  results.failed++;
                  results.errors.push({
                    row: rowNumber,
                    email,
                    error: 'User already exists in Cognito',
                  });
                  return;
                }
                // Continue with database creation even if Cognito fails
                logger.warn(`Cognito creation failed for ${email}, continuing with database creation`);
              }

              // Prepare metadata
              const metadata: any = {};
              if (role === 'STUDENT' && classIds.length > 0) {
                metadata.classId = classIds[0];
              }

              // Create user in database
              const user = await prisma.user.create({
                data: {
                  email,
                  name,
                  role: role as any,
                  schoolId,
                  phone: phone || null,
                  metadata: metadata as any,
                  preferences: {},
                  cognitoId: cognitoId || null,
                  status: 'ACTIVE',
                },
              });

              // Assign teacher to class if provided
              if (role === 'TEACHER' && classIds.length > 0) {
                await Promise.all(
                  classIds.map((cid) =>
                  prisma.teacherClass.create({
                    data: {
                      teacherId: user.id,
                      classId: cid,
                    } as any,
                  })
                  )
                );
              }

              results.imported++;

              // TODO: Send welcome email with temporary password
            } catch (error: any) {
              results.failed++;
              results.errors.push({
                row: rowNumber,
                email: row.email || 'N/A',
                error: error.message || 'Unknown error',
              });
            }
          })
        );
      }

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: userId!,
          action: 'BULK_USER_IMPORT',
          resource: 'User',
          details: {
            role,
            imported: results.imported,
            failed: results.failed,
            total: rows.length,
          },
        },
      });

      logger.info(`Bulk import completed: ${results.imported} imported, ${results.failed} failed`);

      res.status(201).json({
        success: true,
        message: `Bulk import completed: ${results.imported} imported, ${results.failed} failed`,
        data: {
          imported: results.imported,
          failed: results.failed,
          total: rows.length,
          errors: results.errors.slice(0, 50), // Limit errors to first 50
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

  /**
   * GET /api/admin/analytics/dashboard
   * Get dashboard analytics for admin
   */
  async getDashboardAnalytics(req: AuthRequest, res: Response) {
    try {
      const schoolId = req.query.schoolId as string;
      const userSchoolId = req.user?.schoolId;

      // Authorization check
      const allowedRoles = ['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'];
      if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Only administrators can view analytics');
      }

      if (!userSchoolId) {
        throw new ForbiddenError('School access required');
      }

      const targetSchoolId = schoolId || userSchoolId;

      // Verify access
      if (targetSchoolId !== userSchoolId && req.user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('You do not have access to this school');
      }

      // Get total users by role
      const usersByRole = await prisma.user.groupBy({
        by: ['role'],
        where: {
          schoolId: targetSchoolId,
        },
        _count: {
          id: true,
        },
      });

      const roleCounts: Record<string, number> = {};
      usersByRole.forEach((group) => {
        roleCounts[group.role] = group._count.id;
      });

      // Get active vs inactive users
      const usersByStatus = await prisma.user.groupBy({
        by: ['status'],
        where: {
          schoolId: targetSchoolId,
        },
        _count: {
          id: true,
        },
      });

      const statusCounts: Record<string, number> = {};
      usersByStatus.forEach((group) => {
        statusCounts[group.status] = group._count.id;
      });

      // Get today's attendance percentage
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayAttendance = await prisma.attendance.findMany({
        where: {
          date: {
            gte: today,
            lt: tomorrow,
          },
          class: {
            schoolId: targetSchoolId,
          },
        },
      });

      const totalRecords = todayAttendance.length;
      const presentCount = todayAttendance.filter((a) => a.status === 'present').length;
      const attendancePercentage = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

      // Get pending homework count
      const pendingHomework = await prisma.homework.count({
        where: {
          dueDate: {
            gte: today,
          },
          class: {
            schoolId: targetSchoolId,
          },
        },
      });

      // Get upcoming events (next 7 days)
      const sevenDaysLater = new Date(today);
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

      const upcomingEvents = await prisma.event.findMany({
        where: {
          schoolId: targetSchoolId,
          startDate: {
            gte: today,
            lte: sevenDaysLater,
          },
          status: { not: 'cancelled' },
        },
        orderBy: {
          startDate: 'asc',
        },
        take: 10,
      });

      // Get recent activities (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const recentActivities = await prisma.activityLog.findMany({
        where: {
          timestamp: {
            gte: yesterday,
          },
          user: {
            schoolId: targetSchoolId,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 20,
      });

      logger.info(`Retrieved dashboard analytics for school ${targetSchoolId}`);

      res.json({
        success: true,
        data: {
          analytics: {
            users: {
              byRole: roleCounts,
              byStatus: statusCounts,
              total: Object.values(roleCounts).reduce((sum, count) => sum + count, 0),
              active: statusCounts.ACTIVE || 0,
              inactive: statusCounts.INACTIVE || 0,
            },
            attendance: {
              todayPercentage: parseFloat(attendancePercentage.toFixed(2)),
              todayRecords: totalRecords,
              todayPresent: presentCount,
            },
            homework: {
              pending: pendingHomework,
            },
            events: {
              upcoming: upcomingEvents.length,
              nextEvents: upcomingEvents.map((event) => ({
                id: event.id,
                title: event.title,
                startDate: event.startDate,
                type: event.type,
              })),
            },
            activities: {
              recent: recentActivities.map((activity) => ({
                id: activity.id,
                action: activity.action,
                resource: activity.resource,
                user: activity.user,
                timestamp: activity.timestamp,
              })),
            },
          },
        },
      });
    } catch (error) {
      logger.error('Error getting dashboard analytics:', error);
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
   * POST /api/admin/announcement
   * Send school-wide announcement
   */
  async sendAnnouncement(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const schoolId = req.user?.schoolId;
      let {
        title,
        message,
        targetAudience,
        targetRoles,
        priority = 'normal',
        scheduledFor,
        classIds,
      }: SendAnnouncementBody & { targetRoles?: string[] } = req.body;

      // Map targetRoles (mobile) to targetAudience
      if (targetRoles && Array.isArray(targetRoles) && targetRoles.length > 0) {
        const map: Record<string, string> = {
          All: 'all',
          Teachers: 'teachers',
          Parents: 'parents',
          Students: 'students',
          'Bus Helpers': 'bus_helpers',
        };
        targetAudience = targetRoles.map((r) => map[r] || r.toLowerCase()).filter(Boolean);
      }

      // Authorization check
      const allowedRoles = ['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'];
      if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Only administrators can send announcements');
      }

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Validate required fields
      if (!title || !message) {
        throw new ValidationError('title and message are required');
      }

      // Parse target audience
      const parsedAudience = Array.isArray(targetAudience) ? targetAudience : [targetAudience];
      const validAudiences = ['all', 'teachers', 'parents', 'students', 'classes', 'bus_helpers'];
      const invalidAudiences = parsedAudience.filter((a) => !validAudiences.includes(a));
      if (invalidAudiences.length > 0) {
        throw new ValidationError(`Invalid targetAudience: ${invalidAudiences.join(', ')}`);
      }

      // Get target user IDs
      const targetUserIds: string[] = [];
      for (const audience of parsedAudience) {
        switch (audience) {
          case 'all':
            const allUsers = await prisma.user.findMany({
              where: {
                schoolId,
                status: 'ACTIVE',
              },
              select: { id: true },
            });
            targetUserIds.push(...allUsers.map((u) => u.id));
            break;

          case 'teachers':
            const teachers = await prisma.user.findMany({
              where: {
                schoolId,
                role: 'TEACHER',
                status: 'ACTIVE',
              },
              select: { id: true },
            });
            targetUserIds.push(...teachers.map((u) => u.id));
            break;

          case 'parents':
            const parents = await prisma.user.findMany({
              where: {
                schoolId,
                role: 'PARENT',
                status: 'ACTIVE',
              },
              select: { id: true },
            });
            targetUserIds.push(...parents.map((u) => u.id));
            break;

          case 'students':
            const students = await prisma.user.findMany({
              where: {
                schoolId,
                role: 'STUDENT',
                status: 'ACTIVE',
              },
              select: { id: true },
            });
            targetUserIds.push(...students.map((u) => u.id));
            break;

          case 'bus_helpers':
            const busHelpers = await prisma.user.findMany({
              where: {
                schoolId,
                role: 'BUS_HELPER',
                status: 'ACTIVE',
              },
              select: { id: true },
            });
            targetUserIds.push(...busHelpers.map((u) => u.id));
            break;

          case 'classes':
            if (!classIds || classIds.length === 0) {
              throw new ValidationError('classIds is required when targetAudience includes "classes"');
            }

            // Get students from specified classes
            const classStudents = await prisma.user.findMany({
              where: {
                schoolId,
                role: 'STUDENT',
                status: 'ACTIVE',
              },
              select: {
                id: true,
                metadata: true,
              },
            });

            classStudents.forEach((student) => {
              const metadata = student.metadata as any;
              if (metadata?.classId && classIds.includes(metadata.classId)) {
                targetUserIds.push(student.id);
              }
            });
            break;
        }
      }

      // Remove duplicates
      const uniqueUserIds = [...new Set(targetUserIds)];

      if (uniqueUserIds.length === 0) {
        throw new ValidationError('No recipients found for the specified target audience');
      }

      // Create announcement record
      const scheduledDate = scheduledFor ? new Date(scheduledFor) : null;
      const isScheduled = scheduledDate && scheduledDate > new Date();

      const announcement = await prisma.announcement.create({
        data: {
          schoolId,
          title,
          message,
          priority,
          targetAudience: parsedAudience as any,
          channels: ['push', 'in_app'] as any,
          scheduledFor: scheduledDate,
          status: isScheduled ? 'scheduled' : 'draft',
          createdBy: userId!,
        },
      });

      // Send notifications if not scheduled
      if (!isScheduled) {
      // Map priority to notification service format
      const notificationPriority = priority === 'urgent' ? 'high' : priority === 'important' ? 'high' : 'normal';

      await NotificationService.sendNotification({
        userIds: uniqueUserIds,
        category: 'announcement',
        title,
        body: message,
        data: {
          announcementId: announcement.id,
          type: 'announcement',
        },
        channels: ['push', 'in_app'],
        priority: notificationPriority,
      });

        // Update announcement status
        await prisma.announcement.update({
          where: { id: announcement.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
            deliveryCount: uniqueUserIds.length,
          },
        });
      }

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: userId!,
          action: 'ANNOUNCEMENT_SENT',
          resource: 'Announcement',
          resourceId: announcement.id,
          details: {
            title,
            recipientCount: uniqueUserIds.length,
            scheduled: isScheduled,
          },
        },
      });

      logger.info(`Announcement sent: ${announcement.id} to ${uniqueUserIds.length} recipients`);

      res.status(201).json({
        success: true,
        message: isScheduled ? 'Announcement scheduled successfully' : 'Announcement sent successfully',
        data: {
          announcementId: announcement.id,
          recipientCount: uniqueUserIds.length,
          scheduled: isScheduled,
          scheduledFor: scheduledDate,
        },
      });
    } catch (error) {
      logger.error('Error sending announcement:', error);
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

  async getSchoolStats(req: AuthRequest, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) throw new ForbiddenError('School access required');
      const allowedRoles = ['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'];
      if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Only administrators can view stats');
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const [
        totalStudents,
        totalTeachers,
        totalClasses,
        totalParents,
        pendingRequests,
        todayAttendance,
        feeStructures,
        feePayments,
      ] = await Promise.all([
        prisma.user.count({ where: { schoolId, role: 'STUDENT' } }),
        prisma.user.count({ where: { schoolId, role: 'TEACHER' } }),
        prisma.class.count({ where: { schoolId } }),
        prisma.user.count({ where: { schoolId, role: 'PARENT' } }),
        prisma.registrationRequest.count({ where: { schoolId, status: 'PENDING' } }),
        prisma.attendance.findMany({
          where: { date: { gte: today, lt: tomorrow }, class: { schoolId } },
        }),
        prisma.feeStructure.findMany({ where: { schoolId, isActive: true } }),
        prisma.feePayment.findMany({
          where: { feeStructure: { schoolId } },
          select: { amountPaid: true },
        }),
      ]);
      const present = todayAttendance.filter((a) => a.status === 'present').length;
      const absent = todayAttendance.length - present;
      const totalToday = todayAttendance.length;
      const percentage = totalToday > 0 ? Math.round((present / totalToday) * 100) : 0;
      const totalFeesCollected = feePayments.reduce((s, p) => s + p.amountPaid, 0);
      const totalExpected = feeStructures.reduce((s, f) => s + f.amount, 0);
      const totalFeesDue = Math.max(0, totalExpected - totalFeesCollected);
      return res.json({
        success: true,
        data: {
          totalStudents,
          totalTeachers,
          totalClasses,
          totalParents,
          pendingRequests,
          todayAttendance: { present, absent, percentage },
          totalFeesDue: Math.round(totalFeesDue * 100) / 100,
          totalFeesCollected: Math.round(totalFeesCollected * 100) / 100,
        },
      });
    } catch (error) {
      logger.error('Error getSchoolStats:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async getAttendanceReport(req: AuthRequest, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) throw new ForbiddenError('School access required');
      const allowedRoles = ['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'];
      if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Only administrators can view reports');
      }
      const { startDate, endDate, classId } = req.query;
      if (!startDate || !endDate) {
        throw new ValidationError('startDate and endDate are required');
      }
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      const where: any = {
        date: { gte: start, lte: end },
        class: { schoolId },
      };
      if (classId && typeof classId === 'string') where.classId = classId;
      const records = await prisma.attendance.findMany({
        where,
        select: { date: true, status: true },
      });
      const byDate: Record<string, { present: number; absent: number }> = {};
      records.forEach((r) => {
        const d = r.date.toISOString().split('T')[0];
        if (!byDate[d]) byDate[d] = { present: 0, absent: 0 };
        if (r.status === 'present') byDate[d].present++;
        else byDate[d].absent++;
      });
      const result = Object.entries(byDate)
        .map(([date, v]) => {
          const total = v.present + v.absent;
          return {
            date,
            present: v.present,
            absent: v.absent,
            total,
            percentage: total > 0 ? Math.round((v.present / total) * 100) : 0,
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date));
      res.json({ success: true, data: result });
      return;
    } catch (error) {
      logger.error('Error getAttendanceReport:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async getFeeReport(req: AuthRequest, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) throw new ForbiddenError('School access required');
      const allowedRoles = ['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'];
      if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Only administrators can view reports');
      }
      const [structures, payments, students] = await Promise.all([
        prisma.feeStructure.findMany({ where: { schoolId, isActive: true } }),
        prisma.feePayment.findMany({
          where: { feeStructure: { schoolId } },
          include: { feeStructure: true },
        }),
        prisma.user.findMany({
          where: { schoolId, role: 'STUDENT' },
          select: { id: true, name: true },
        }),
      ]);
      const totalExpected = structures.reduce((s, f) => s + f.amount, 0);
      const totalPaid = payments.reduce((s, p) => s + p.amountPaid, 0);
      const totalDue = Math.max(0, totalExpected - totalPaid);
      const now = new Date();
      const totalOverdue = structures
        .filter((f) => f.dueDate && f.dueDate < now)
        .reduce((s, f) => s + f.amount, 0);
      const paidByStudent: Record<string, number> = {};
      payments.forEach((p) => {
        paidByStudent[p.studentId] = (paidByStudent[p.studentId] || 0) + p.amountPaid;
      });
      const expectedPerStudent = students.length ? totalExpected / students.length : 0;
      const byStudent = students.map((st) => {
        const amountPaid = paidByStudent[st.id] || 0;
        const amount = expectedPerStudent;
        const due = amount - amountPaid;
        let status = 'PENDING';
        if (due <= 0) status = 'PAID';
        else if (structures.some((f) => f.dueDate && f.dueDate < now)) status = 'OVERDUE';
        return {
          studentId: st.id,
          studentName: st.name,
          amount: Math.round(amount * 100) / 100,
          amountPaid: Math.round(amountPaid * 100) / 100,
          status,
        };
      });
      res.json({
        success: true,
        data: {
          totalDue: Math.round(totalDue * 100) / 100,
          totalPaid: Math.round(totalPaid * 100) / 100,
          totalOverdue: Math.round(totalOverdue * 100) / 100,
          byStudent,
        },
      });
      return;
    } catch (error) {
      logger.error('Error getFeeReport:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async getAnnouncements(req: AuthRequest, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) throw new ForbiddenError('School access required');
      const allowedRoles = ['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'];
      if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Only administrators can view announcements');
      }
      const list = await prisma.announcement.findMany({
        where: { schoolId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return res.json({ success: true, data: { announcements: list } });
    } catch (error) {
      logger.error('Error getAnnouncements:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async updateSchoolProfile(req: AuthRequest, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) throw new ForbiddenError('School access required');
      const allowedRoles = ['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'];
      if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Only administrators can update school');
      }
      const { name, primaryColor, secondaryColor } = req.body;
      const data: any = {};
      if (name != null) data.name = name;
      if (primaryColor != null) data.primaryColor = primaryColor;
      if (secondaryColor != null) data.secondaryColor = secondaryColor;
      if (Object.keys(data).length === 0) {
        const school = await prisma.school.findUnique({ where: { id: schoolId } });
        return res.json({ success: true, data: { school } });
      }
      const school = await prisma.school.update({
        where: { id: schoolId },
        data,
      });
      return res.json({ success: true, data: { school } });
    } catch (error) {
      logger.error('Error updateSchoolProfile:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  async uploadSchoolLogo(req: AuthRequest, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) throw new ForbiddenError('School access required');
      const allowedRoles = ['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'];
      if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Only administrators can upload logo');
      }
      const file = (req as any).file;
      if (!file || !file.buffer) throw new ValidationError('Logo file is required');
      const { uploadToS3 } = await import('../middleware/s3Upload');
      const url = await uploadToS3(file, `schools/${schoolId}`);
      await prisma.school.update({
        where: { id: schoolId },
        data: { logoUrl: url },
      });
      const school = await prisma.school.findUnique({ where: { id: schoolId } });
      res.json({ success: true, data: { school } });
      return;
    } catch (error) {
      logger.error('Error uploadSchoolLogo:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * GET /admin/school — Get admin's school (for profile, includes schoolCodeChangedAt)
   */
  async getSchool(req: AuthRequest, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) throw new ForbiddenError('School access required');
      const allowedRoles = ['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'];
      if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Only administrators can view school');
      }
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: {
          id: true,
          name: true,
          schoolCode: true,
          schoolCodeChangedAt: true,
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true,
        },
      });
      if (!school) throw new NotFoundError('School not found');
      return res.json({ success: true, data: { school } });
    } catch (error) {
      logger.error('Error getSchool:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * PATCH /admin/school/code — Change school code (once per week)
   */
  async updateSchoolCode(req: AuthRequest, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) throw new ForbiddenError('School access required');
      const allowedRoles = ['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'];
      if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Only administrators can change school code');
      }
      const { newCode } = req.body as { newCode?: string };
      const trimmed = typeof newCode === 'string' ? newCode.trim().toUpperCase() : '';
      if (!trimmed || trimmed.length < 3 || trimmed.length > 20) {
        throw new ValidationError('School code must be 3–20 characters');
      }
      if (!/^[A-Z0-9\-]+$/.test(trimmed)) {
        throw new ValidationError('School code can only contain letters, numbers, and hyphens');
      }
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { schoolCodeChangedAt: true, schoolCode: true },
      });
      if (!school) throw new NotFoundError('School not found');
      const now = new Date();
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
      if (school.schoolCodeChangedAt) {
        const nextAllowed = new Date(school.schoolCodeChangedAt.getTime() + oneWeekMs);
        if (now < nextAllowed) {
          return res.status(400).json({
            success: false,
            message: `You can change the school code once per week. Next change available on ${nextAllowed.toISOString().split('T')[0]}.`,
            nextChangeAllowedAt: nextAllowed.toISOString(),
          });
        }
      }
      const existing = await prisma.school.findUnique({ where: { schoolCode: trimmed } });
      if (existing && existing.id !== schoolId) {
        throw new ValidationError('This school code is already in use');
      }
      const updated = await prisma.school.update({
        where: { id: schoolId },
        data: { schoolCode: trimmed, schoolCodeChangedAt: now },
      });
      return res.json({
        success: true,
        data: {
          school: updated,
          message: 'School code updated successfully.',
        },
      });
    } catch (error) {
      logger.error('Error updateSchoolCode:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * GET /admin/fees — Fee management: summary + byClass with students and their fees
   */
  async getFeeManagement(req: AuthRequest, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) throw new ForbiddenError('School access required');
      const [structures, payments, students, classes, attendance] = await Promise.all([
        prisma.feeStructure.findMany({ where: { schoolId, isActive: true }, orderBy: { dueDate: 'asc' } }),
        prisma.feePayment.findMany({ where: { feeStructure: { schoolId } }, include: { feeStructure: true } }),
        prisma.user.findMany({
          where: { schoolId, role: 'STUDENT' },
          select: { id: true, name: true },
        }),
        prisma.class.findMany({ where: { schoolId }, select: { id: true, name: true, section: true } }),
        prisma.attendance.findMany({
          where: { class: { schoolId } },
          select: { studentId: true, classId: true },
          orderBy: { date: 'desc' },
          distinct: ['studentId'],
        }),
      ]);
      const now = new Date();
      const studentToClass: Record<string, string> = {};
      attendance.forEach((a) => {
        if (!studentToClass[a.studentId]) studentToClass[a.studentId] = a.classId;
      });
      const paymentByKey: Record<string, { id: string; paidAt: Date; amountPaid: number }> = {};
      payments.forEach((p) => {
        const key = `${p.feeStructureId}-${p.studentId}`;
        paymentByKey[key] = { id: p.id, paidAt: p.paidAt, amountPaid: p.amountPaid };
      });
      const totalDue = structures.reduce((s, f) => s + f.amount, 0) * students.length;
      const totalPaid = payments.reduce((s, p) => s + p.amountPaid, 0);
      const totalOverdue = structures
        .filter((f) => f.dueDate && f.dueDate < now)
        .reduce((s, f) => s + f.amount * students.length, 0);

      const byClass: Array<{
        classId: string;
        className: string;
        studentCount: number;
        students: Array<{
          studentId: string;
          studentName: string;
          parentName: string;
          parentEmail: string;
          fees: Array<{
            id: string;
            name: string;
            amount: number;
            dueDate: string | null;
            status: string;
            paidDate: string | null;
          }>;
        }>;
      }> = [];

      for (const cls of classes) {
        const classStudents = students.filter((s) => studentToClass[s.id] === cls.id);
        const parentLinks = await prisma.parentStudent.findMany({
          where: { studentId: { in: classStudents.map((s) => s.id) } },
          include: { parent: { select: { name: true, email: true } } },
        });
        const parentByStudent: Record<string, { name: string; email: string }> = {};
        parentLinks.forEach((pl) => {
          parentByStudent[pl.studentId] = { name: pl.parent.name, email: pl.parent.email };
        });
        const studentsWithFees = classStudents.map((st) => {
          const fees = structures.map((f) => {
            const key = `${f.id}-${st.id}`;
            const pay = paymentByKey[key];
            let status = 'PENDING';
            if (pay) status = 'PAID';
            else if (f.dueDate && f.dueDate < now) status = 'OVERDUE';
            return {
              id: pay ? pay.id : `pending-${f.id}::${st.id}`,
              name: f.name,
              amount: f.amount,
              dueDate: f.dueDate ? f.dueDate.toISOString().split('T')[0] : null,
              status,
              paidDate: pay ? pay.paidAt.toISOString().split('T')[0] : null,
            };
          });
          const parent = parentByStudent[st.id];
          return {
            studentId: st.id,
            studentName: st.name,
            parentName: parent?.name ?? '—',
            parentEmail: parent?.email ?? '—',
            fees,
          };
        });
        byClass.push({
          classId: cls.id,
          className: `${cls.name} ${cls.section}`.trim(),
          studentCount: classStudents.length,
          students: studentsWithFees,
        });
      }

      const unclassed = students.filter((s) => !studentToClass[s.id]);
      if (unclassed.length > 0) {
        const parentLinks = await prisma.parentStudent.findMany({
          where: { studentId: { in: unclassed.map((s) => s.id) } },
          include: { parent: { select: { name: true, email: true } } },
        });
        const parentByStudent: Record<string, { name: string; email: string }> = {};
        parentLinks.forEach((pl) => {
          parentByStudent[pl.studentId] = { name: pl.parent.name, email: pl.parent.email };
        });
        byClass.push({
          classId: '_unclassed',
          className: 'Unassigned',
          studentCount: unclassed.length,
          students: unclassed.map((st) => {
            const fees = structures.map((f) => {
              const key = `${f.id}-${st.id}`;
              const pay = paymentByKey[key];
              let status = 'PENDING';
              if (pay) status = 'PAID';
              else if (f.dueDate && f.dueDate < now) status = 'OVERDUE';
              return {
                id: pay ? pay.id : `pending-${f.id}::${st.id}`,
                name: f.name,
                amount: f.amount,
                dueDate: f.dueDate ? f.dueDate.toISOString().split('T')[0] : null,
                status,
                paidDate: pay ? pay.paidAt.toISOString().split('T')[0] : null,
              };
            });
            const parent = parentByStudent[st.id];
            return {
              studentId: st.id,
              studentName: st.name,
              parentName: parent?.name ?? '—',
              parentEmail: parent?.email ?? '—',
              fees,
            };
          }),
        });
      }

      return res.json({
        success: true,
        data: {
          summary: {
            totalDue: Math.round(totalDue * 100) / 100,
            totalPaid: Math.round(totalPaid * 100) / 100,
            totalOverdue: Math.round(totalOverdue * 100) / 100,
            totalStudents: students.length,
          },
          byClass,
        },
      });
    } catch (error) {
      logger.error('Error getFeeManagement:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * PATCH /admin/fees/:feeId — Update fee payment status (PAID: set paidAt; or create payment for pending)
   */
  async updateFeeStatus(req: AuthRequest, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) throw new ForbiddenError('School access required');
      const { feeId } = req.params;
      const { status, paidDate } = req.body as { status?: string; paidDate?: string };
      if (!status || !['PAID', 'PENDING', 'OVERDUE'].includes(status)) {
        throw new ValidationError('status must be PAID, PENDING, or OVERDUE');
      }
      if (status === 'PAID' && feeId.startsWith('pending-')) {
        const rest = feeId.replace('pending-', '');
        const [feeStructureId, studentId] = rest.split('::');
        if (!feeStructureId || !studentId) throw new ValidationError('Invalid fee id');
        const structure = await prisma.feeStructure.findFirst({
          where: { id: feeStructureId, schoolId },
        });
        if (!structure) throw new NotFoundError('Fee structure not found');
        const paidAt = paidDate ? new Date(paidDate) : new Date();
        const payment = await prisma.feePayment.create({
          data: {
            feeStructureId,
            studentId,
            amountPaid: structure.amount,
            paidAt,
            paymentMethod: 'manual',
            reference: 'Admin',
          },
          include: { feeStructure: true },
        });
        return res.json({ success: true, data: payment });
      }
      const payment = await prisma.feePayment.findFirst({
        where: { id: feeId, feeStructure: { schoolId } },
        include: { feeStructure: true },
      });
      if (!payment) throw new NotFoundError('Fee payment not found');
      if (status === 'PAID') {
        const paidAt = paidDate ? new Date(paidDate) : new Date();
        await prisma.feePayment.update({
          where: { id: feeId },
          data: { paidAt, amountPaid: payment.feeStructure.amount },
        });
        const updated = await prisma.feePayment.findUnique({
          where: { id: feeId },
          include: { feeStructure: true },
        });
        return res.json({ success: true, data: updated });
      }
      if (status === 'PENDING') {
        await prisma.feePayment.delete({ where: { id: feeId } });
        return res.json({ success: true, data: { deleted: true } });
      }
      return res.json({ success: true, data: payment });
    } catch (error) {
      logger.error('Error updateFeeStatus:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * POST /admin/fees — Add fee entry (create FeeStructure for school)
   */
  async addFeeEntry(req: AuthRequest, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) throw new ForbiddenError('School access required');
      const { name, amount, dueDate } = req.body as {
        name: string;
        amount: number;
        dueDate?: string;
      };
      if (!name || amount == null) throw new ValidationError('name and amount required');
      const structure = await prisma.feeStructure.create({
        data: {
          schoolId,
          name,
          type: 'tuition',
          amount: Number(amount),
          currency: 'INR',
          dueDate: dueDate ? new Date(dueDate) : null,
          isActive: true,
        },
      });
      return res.status(201).json({ success: true, data: structure });
    } catch (error) {
      logger.error('Error addFeeEntry:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * POST /admin/fees/class — Create fee for all students in a class (one FeeStructure)
   */
  async addClassFee(req: AuthRequest, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) throw new ForbiddenError('School access required');
      const { classId, name, amount, dueDate } = req.body as {
        classId: string;
        name: string;
        amount: number;
        dueDate?: string;
      };
      if (!classId || !name || amount == null) throw new ValidationError('classId, name and amount required');
      const structure = await prisma.feeStructure.create({
        data: {
          schoolId,
          name,
          type: 'tuition',
          amount: Number(amount),
          currency: 'INR',
          dueDate: dueDate ? new Date(dueDate) : null,
          isActive: true,
        },
      });
      const count = await prisma.attendance.findMany({
        where: { classId },
        distinct: ['studentId'],
        select: { studentId: true },
      });
      return res.json({ success: true, data: { created: structure.id, studentCount: count.length } });
    } catch (error) {
      logger.error('Error addClassFee:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * POST /admin/fees/reminders — Send fee reminders to parents
   */
  async sendFeeReminders(req: AuthRequest, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) throw new ForbiddenError('School access required');
      const { studentIds, status } = req.body as { studentIds?: string[]; status?: string };
      let targetStudentIds: string[] = [];
      if (studentIds?.length) {
        targetStudentIds = studentIds;
      } else if (status) {
        const [structures, payments] = await Promise.all([
          prisma.feeStructure.findMany({ where: { schoolId, isActive: true } }),
          prisma.feePayment.findMany({ where: { feeStructure: { schoolId } }, select: { studentId: true, feeStructureId: true } }),
        ]);
        const now = new Date();
        const paidKeys = new Set(payments.map((p) => `${p.feeStructureId}-${p.studentId}`));
        const students = await prisma.user.findMany({
          where: { schoolId, role: 'STUDENT' },
          select: { id: true },
        });
        students.forEach((st) => {
          const hasOverdue = structures.some((f) => {
            const key = `${f.id}-${st.id}`;
            if (paidKeys.has(key)) return false;
            return f.dueDate && f.dueDate < now;
          });
          const hasPending = structures.some((f) => {
            const key = `${f.id}-${st.id}`;
            if (paidKeys.has(key)) return false;
            return !f.dueDate || f.dueDate >= now;
          });
          if (status === 'OVERDUE' && hasOverdue) targetStudentIds.push(st.id);
          if (status === 'PENDING' && (hasPending || hasOverdue)) targetStudentIds.push(st.id);
        });
        targetStudentIds = [...new Set(targetStudentIds)];
      }
      const parentLinks = await prisma.parentStudent.findMany({
        where: { studentId: { in: targetStudentIds } },
        include: { parent: { select: { id: true } }, student: { select: { name: true } } },
      });
      let sent = 0;
      for (const pl of parentLinks) {
        const studentName = (pl as any).student?.name ?? 'student';
        await prisma.notification.create({
          data: {
            userId: pl.parent.id,
            title: 'Fee Payment Reminder',
            body: `Your child ${studentName}'s fee payment is ${status ?? 'pending'}. Please pay by the due date.`,
            category: 'fee',
            channels: ['push'],
            priority: 'normal',
            status: 'pending',
          },
        });
        sent++;
      }
      return res.json({ success: true, data: { sent } });
    } catch (error) {
      logger.error('Error sendFeeReminders:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  /**
   * GET /admin/fees/export — Export fee report as CSV
   */
  async exportFeeReport(req: AuthRequest, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) throw new ForbiddenError('School access required');
      const format = (req.query.format as string) || 'csv';
      if (format !== 'csv') {
        return res.status(400).json({ success: false, message: 'Only format=csv supported' });
      }
      const [structures, payments, students, attendance] = await Promise.all([
        prisma.feeStructure.findMany({ where: { schoolId, isActive: true } }),
        prisma.feePayment.findMany({ where: { feeStructure: { schoolId } }, include: { feeStructure: true } }),
        prisma.user.findMany({ where: { schoolId, role: 'STUDENT' }, select: { id: true, name: true } }),
        prisma.attendance.findMany({
          where: { class: { schoolId } },
          select: { studentId: true, classId: true },
          orderBy: { date: 'desc' },
          distinct: ['studentId'],
        }),
      ]);
      const classes = await prisma.class.findMany({ where: { schoolId }, select: { id: true, name: true, section: true } });
      const classById: Record<string, string> = {};
      classes.forEach((c) => { classById[c.id] = `${c.name} ${c.section}`.trim(); });
      const studentToClass: Record<string, string> = {};
      attendance.forEach((a) => {
        if (!studentToClass[a.studentId]) studentToClass[a.studentId] = classById[a.classId] ?? '';
      });
      const paymentByKey: Record<string, { paidAt: Date }> = {};
      payments.forEach((p) => {
        paymentByKey[`${p.feeStructureId}-${p.studentId}`] = { paidAt: p.paidAt };
      });
      const rows: string[][] = [['Student Name', 'Class', 'Fee Name', 'Amount', 'Due Date', 'Status', 'Paid Date']];
      const now = new Date();
      students.forEach((st) => {
        const className = studentToClass[st.id] ?? '';
        structures.forEach((f) => {
          const key = `${f.id}-${st.id}`;
          const pay = paymentByKey[key];
          const status = pay ? 'PAID' : f.dueDate && f.dueDate < now ? 'OVERDUE' : 'PENDING';
          rows.push([
            st.name,
            className,
            f.name,
            String(f.amount),
            f.dueDate ? f.dueDate.toISOString().split('T')[0] : '',
            status,
            pay ? pay.paidAt.toISOString().split('T')[0] : '',
          ]);
        });
      });
      const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=fee-report.csv');
      return res.send(csv);
    } catch (error) {
      logger.error('Error exportFeeReport:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
};

