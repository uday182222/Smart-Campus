import { Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { AppError, NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/notification.service';

/**
 * Announcements Controller
 * Handles all announcement-related operations
 */

interface CreateAnnouncementBody {
  title: string;
  message: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  targetAudience?: {
    roles?: string[];
    classIds?: string[];
    userIds?: string[];
    all?: boolean;
  };
  channels?: string[];
  scheduledFor?: string; // ISO date string
}

export const announcementsController = {
  /**
   * POST /api/announcements
   * Create a new announcement
   */
  async createAnnouncement(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const {
        title,
        message,
        priority = 'normal',
        targetAudience = { all: true },
        channels = ['push', 'in_app'],
        scheduledFor,
      }: CreateAnnouncementBody = req.body;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Authorization check - only admins, principals, or office staff can create announcements
      const allowedRoles = ['ADMIN', 'PRINCIPAL', 'OFFICE_STAFF', 'SUPER_ADMIN'];
      if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Only authorized staff can create announcements');
      }

      // Validate required fields
      if (!title || !message) {
        throw new ValidationError('title and message are required');
      }

      // Validate priority
      const validPriorities = ['low', 'normal', 'high', 'urgent'];
      if (!validPriorities.includes(priority)) {
        throw new ValidationError(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
      }

      // Validate channels
      const validChannels = ['push', 'in_app', 'email', 'sms', 'whatsapp'];
      channels.forEach((channel) => {
        if (!validChannels.includes(channel)) {
          throw new ValidationError(`Invalid channel: ${channel}. Must be one of: ${validChannels.join(', ')}`);
        }
      });

      // Parse scheduled date if provided
      let scheduledDate: Date | null = null;
      if (scheduledFor) {
        scheduledDate = new Date(scheduledFor);
        if (isNaN(scheduledDate.getTime())) {
          throw new ValidationError('Invalid scheduledFor format. Use ISO 8601 format');
        }
      }

      // Determine status
      const status = scheduledDate && scheduledDate > new Date() ? 'scheduled' : 'draft';

      // Create announcement
      const announcement = await prisma.announcement.create({
        data: {
          schoolId: schoolId,
          title,
          message,
          priority,
          targetAudience: targetAudience as any,
          channels: channels as any,
          scheduledFor: scheduledDate,
          status,
          createdBy: userId!,
        },
      });

      // If not scheduled, send immediately
      if (status === 'draft' && !scheduledDate) {
        // Determine target users
        let targetUserIds: string[] = [];

        if (targetAudience.all) {
          // Get all users in school
          const users = await prisma.user.findMany({
            where: {
              schoolId: schoolId,
              status: 'ACTIVE',
            },
            select: { id: true },
          });
          targetUserIds = users.map((u) => u.id);
        } else {
          // Get users based on roles
          if (targetAudience.roles && targetAudience.roles.length > 0) {
            const users = await prisma.user.findMany({
              where: {
                schoolId: schoolId,
                role: { in: targetAudience.roles as any[] },
                status: 'ACTIVE',
              },
              select: { id: true },
            });
            targetUserIds.push(...users.map((u) => u.id));
          }

          // Get users from specific classes
          if (targetAudience.classIds && targetAudience.classIds.length > 0) {
            // In production, you'd query students by class
            // For now, we'll skip this
          }

          // Add specific user IDs
          if (targetAudience.userIds && targetAudience.userIds.length > 0) {
            targetUserIds.push(...targetAudience.userIds);
          }

          // Remove duplicates
          targetUserIds = [...new Set(targetUserIds)];
        }

        // Send notifications
        if (targetUserIds.length > 0) {
          await NotificationService.sendNotification({
            userIds: targetUserIds,
            category: 'announcement',
            title,
            body: message,
            data: {
              announcementId: announcement.id,
              type: 'announcement',
            },
            channels: channels as any,
            priority: priority as any,
          });

          // Update announcement
          await prisma.announcement.update({
            where: { id: announcement.id },
            data: {
              status: 'sent',
              sentAt: new Date(),
              deliveryCount: targetUserIds.length,
            },
          });
        }
      }

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: userId!,
          action: 'ANNOUNCEMENT_CREATED',
          resource: 'Announcement',
          resourceId: announcement.id,
          details: {
            title,
            priority,
            status,
            scheduledFor: scheduledDate,
          },
        },
      });

      logger.info(`Announcement created: ${announcement.id} by ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Announcement created successfully',
        data: {
          announcement: {
            id: announcement.id,
            schoolId: announcement.schoolId,
            title: announcement.title,
            message: announcement.message,
            priority: announcement.priority,
            targetAudience: announcement.targetAudience,
            channels: announcement.channels,
            scheduledFor: announcement.scheduledFor,
            status: announcement.status,
            sentAt: announcement.sentAt,
            deliveryCount: announcement.deliveryCount,
            acknowledgmentCount: announcement.acknowledgmentCount,
            createdBy: announcement.createdBy,
            createdAt: announcement.createdAt,
          },
        },
      });
    } catch (error) {
      logger.error('Error creating announcement:', error);
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
   * GET /api/announcements/:schoolId
   * Get all announcements for a school
   */
  async getAnnouncements(req: AuthRequest, res: Response) {
    try {
      const { schoolId } = req.params;
      const userSchoolId = req.user?.schoolId;
      const { status, priority, page = '1', limit = '20' } = req.query;

      if (!userSchoolId) {
        throw new ForbiddenError('School access required');
      }

      // Verify access
      if (schoolId !== userSchoolId && req.user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('You do not have access to this school');
      }

      // Verify school exists
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
      });

      if (!school) {
        throw new NotFoundError('School not found');
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      // Build where clause
      const where: any = {
        schoolId: schoolId,
      };

      if (status) {
        where.status = status;
      }

      if (priority) {
        where.priority = priority;
      }

      // Get total count
      const total = await prisma.announcement.count({ where });

      // Get announcements
      const announcements = await prisma.announcement.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limitNum,
      });

      logger.info(`Retrieved ${announcements.length} announcements for school ${schoolId}`);

      res.json({
        success: true,
        data: {
          announcements: announcements.map((ann) => ({
            id: ann.id,
            schoolId: ann.schoolId,
            title: ann.title,
            message: ann.message,
            priority: ann.priority,
            targetAudience: ann.targetAudience,
            channels: ann.channels,
            scheduledFor: ann.scheduledFor,
            sentAt: ann.sentAt,
            status: ann.status,
            deliveryCount: ann.deliveryCount,
            acknowledgmentCount: ann.acknowledgmentCount,
            createdBy: ann.createdBy,
            createdAt: ann.createdAt,
          })),
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      logger.error('Error getting announcements:', error);
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

