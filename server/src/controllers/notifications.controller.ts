import { Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { AppError, NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/notification.service';

/**
 * Notifications Controller
 * Complete push notification management system with scheduling, preferences, and delivery tracking
 */

// TypeScript interfaces
interface SendNotificationBody {
  title: string;
  message: string;
  type: 'emergency' | 'announcement' | 'homework' | 'attendance' | 'transport' | 'fees';
  recipients?: string[]; // User IDs
  recipientType?: 'all' | 'teachers' | 'parents' | 'students' | 'staff';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduledFor?: string; // ISO date string
  data?: Record<string, any>; // Additional payload
}

interface UpdatePreferencesBody {
  userId: string;
  preferences: {
    emergency?: boolean;
    announcements?: boolean;
    homework?: boolean;
    attendance?: boolean;
    transport?: boolean;
    fees?: boolean;
    quietHoursStart?: string; // HH:mm
    quietHoursEnd?: string; // HH:mm
  };
}

interface SendTestNotificationBody {
  userId: string;
  message: string;
}

interface MarkAllReadBody {
  userId: string;
}

// Rate limiting: Track notification sends per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_NOTIFICATIONS_PER_MINUTE = 100;

function checkRateLimit(senderId: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(senderId);

  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(senderId, { count: 1, resetAt: now + 60000 }); // 1 minute window
    return true;
  }

  if (limit.count >= MAX_NOTIFICATIONS_PER_MINUTE) {
    return false;
  }

  limit.count++;
  return true;
}

/**
 * Get default notification preferences
 */
function getDefaultPreferences() {
  return {
    emergency: true,
    announcements: true,
    homework: true,
    attendance: true,
    transport: true,
    fees: true,
    quietHoursStart: null,
    quietHoursEnd: null,
  };
}

/**
 * Check if current time is within quiet hours
 */
function isQuietHours(quietHoursStart?: string | null, quietHoursEnd?: string | null): boolean {
  if (!quietHoursStart || !quietHoursEnd) return false;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight

  const [startHour, startMin] = quietHoursStart.split(':').map(Number);
  const [endHour, endMin] = quietHoursEnd.split(':').map(Number);
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  // Handle quiet hours that span midnight
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  }

  return currentTime >= startTime && currentTime <= endTime;
}

/**
 * Check if user has enabled this notification type
 */
function isNotificationTypeEnabled(
  preferences: any,
  type: string
): boolean {
  // Emergency notifications always enabled
  if (type === 'emergency') return true;

  const typeMap: Record<string, string> = {
    announcement: 'announcements',
    homework: 'homework',
    attendance: 'attendance',
    transport: 'transport',
    fees: 'fees',
  };

  const prefKey = typeMap[type];
  return preferences?.[prefKey] !== false; // Default to true if not set
}

export const notificationsController = {
  /**
   * POST /api/notifications/send
   * Send push notification to users
   */
  async sendNotification(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const {
        title,
        message,
        type,
        recipients,
        recipientType,
        priority = 'normal',
        scheduledFor,
        data,
      }: SendNotificationBody = req.body;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Validate required fields
      if (!title || !message || !type) {
        throw new ValidationError('title, message, and type are required');
      }

      // Validate type
      const validTypes = ['emergency', 'announcement', 'homework', 'attendance', 'transport', 'fees'];
      if (!validTypes.includes(type)) {
        throw new ValidationError(`type must be one of: ${validTypes.join(', ')}`);
      }

      // Validate priority
      const validPriorities = ['low', 'normal', 'high', 'urgent'];
      if (!validPriorities.includes(priority)) {
        throw new ValidationError(`priority must be one of: ${validPriorities.join(', ')}`);
      }

      // Rate limiting check
      if (!checkRateLimit(userId!)) {
        throw new ValidationError('Rate limit exceeded. Please wait before sending more notifications.');
      }

      // Determine target user IDs
      let targetUserIds: string[] = [];

      if (recipients && recipients.length > 0) {
        // Use provided recipient list
        targetUserIds = recipients;
      } else if (recipientType) {
        // Query users by role
        const roleMap: Record<string, string[]> = {
          all: ['PARENT', 'TEACHER', 'STUDENT', 'ADMIN', 'PRINCIPAL', 'OFFICE_STAFF'],
          teachers: ['TEACHER'],
          parents: ['PARENT'],
          students: ['STUDENT'],
          staff: ['ADMIN', 'PRINCIPAL', 'OFFICE_STAFF'],
        };

        const roles = roleMap[recipientType];
        if (!roles) {
          throw new ValidationError(`Invalid recipientType. Must be one of: ${Object.keys(roleMap).join(', ')}`);
        }

        const users = await prisma.user.findMany({
          where: {
            schoolId,
            role: { in: roles as any },
            status: 'ACTIVE',
          },
          select: { id: true },
        });

        targetUserIds = users.map((u) => u.id);
      } else {
        throw new ValidationError('Either recipients or recipientType must be provided');
      }

      if (targetUserIds.length === 0) {
        throw new ValidationError('No recipients found');
      }

      // Verify all users belong to same school (unless super admin)
      if (req.user?.role !== 'SUPER_ADMIN') {
        const users = await prisma.user.findMany({
          where: {
            id: { in: targetUserIds },
          },
          select: {
            id: true,
            schoolId: true,
          },
        });

        const invalidUsers = users.filter((u) => u.schoolId !== schoolId);
        if (invalidUsers.length > 0) {
          throw new ForbiddenError('Cannot send notifications to users from different schools');
        }
      }

      // Parse scheduled date if provided
      let scheduledDate: Date | null = null;
      if (scheduledFor) {
        scheduledDate = new Date(scheduledFor);
        if (isNaN(scheduledDate.getTime())) {
          throw new ValidationError('Invalid scheduledFor format. Use ISO 8601 format');
        }
      }

      const isScheduled = scheduledDate && scheduledDate > new Date();
      const status = isScheduled ? 'scheduled' : 'pending';

      // Create notification records
      const notifications = await Promise.all(
        targetUserIds.map((targetUserId) =>
          prisma.notification.create({
            data: {
              userId: targetUserId,
              category: type,
              title,
              body: message,
              data: data ? (data as any) : null,
              channels: ['push', 'in_app'] as any,
              priority,
              status,
            },
          })
        )
      );

      // If immediate (not scheduled), trigger push notifications
      if (!isScheduled) {
        // Get user preferences and filter based on them
        const usersWithPrefs = await Promise.all(
          targetUserIds.map(async (targetUserId) => {
            const user = await prisma.user.findUnique({
              where: { id: targetUserId },
              select: {
                id: true,
                preferences: true,
              },
            });

            const prefs = user?.preferences as any;
            const enabled = isNotificationTypeEnabled(prefs, type);

            // Check quiet hours (except for emergency)
            const inQuietHours = type !== 'emergency' && isQuietHours(
              prefs?.quietHoursStart,
              prefs?.quietHoursEnd
            );

            return {
              userId: targetUserId,
              enabled: enabled && !inQuietHours,
            };
          })
        );

        // Send only to users who have enabled this notification type and are not in quiet hours
        const enabledUserIds = usersWithPrefs
          .filter((u) => u.enabled)
          .map((u) => u.userId);

        if (enabledUserIds.length > 0) {
          // Trigger push notification service
          await NotificationService.sendNotification({
            userIds: enabledUserIds,
            category: type,
            title,
            body: message,
            data,
            channels: ['push', 'in_app'],
            priority: priority as any,
          });

          // Update notification status to sent
          await prisma.notification.updateMany({
            where: {
              id: { in: notifications.map((n) => n.id) },
              userId: { in: enabledUserIds },
            },
            data: {
              status: 'sent',
              sentAt: new Date(),
            },
          });
        }
      }

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: userId!,
          action: 'NOTIFICATION_SENT',
          resource: 'Notification',
          resourceId: notifications[0].id,
          details: {
            count: notifications.length,
            type,
            priority,
            scheduled: isScheduled,
            scheduledFor: scheduledDate,
          },
        },
      });

      logger.info(`Sent ${notifications.length} notification(s) by user ${userId} (scheduled: ${isScheduled})`);

      res.status(201).json({
        success: true,
        message: isScheduled
          ? 'Notification scheduled successfully'
          : 'Notification sent successfully',
        data: {
          notificationId: notifications[0].id,
          recipientCount: notifications.length,
          scheduled: isScheduled,
          scheduledFor: scheduledDate,
        },
      });
    } catch (error) {
      logger.error('Error sending notification:', error);
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
   * GET /api/notifications/:userId
   * Get all notifications for a user
   */
  async getUserNotifications(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const {
        status,
        type,
        limit = '50',
        offset = '0',
      } = req.query;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Verify user can access these notifications
      if (userId !== currentUserId && req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN') {
        throw new ForbiddenError('You do not have access to this user\'s notifications');
      }

      // Verify user belongs to same school
      if (req.user?.role !== 'SUPER_ADMIN') {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { schoolId: true },
        });

        if (!user) {
          throw new NotFoundError('User not found');
        }

        if (user.schoolId !== schoolId) {
          throw new ForbiddenError('Cannot access notifications from different school');
        }
      }

      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);

      // Build where clause
      const where: any = {
        userId,
      };

      if (status) {
        if (status === 'unread') {
          where.readAt = null;
        } else if (status === 'read') {
          where.readAt = { not: null };
        } else if (status !== 'all') {
          where.status = status;
        }
      }

      if (type) {
        where.category = type;
      }

      // Get total count
      const total = await prisma.notification.count({ where });

      // Get unread count
      const unreadCount = await prisma.notification.count({
        where: {
          userId,
          readAt: null,
        },
      });

      // Get notifications
      const notifications = await prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: offsetNum,
        take: limitNum,
      });

      logger.info(`Retrieved ${notifications.length} notifications for user ${userId}`);

      res.json({
        success: true,
        data: {
          notifications: notifications.map((n) => ({
            id: n.id,
            userId: n.userId,
            category: n.category,
            title: n.title,
            body: n.body,
            data: n.data,
            channels: n.channels,
            priority: n.priority,
            status: n.status,
            sentAt: n.sentAt,
            deliveredAt: n.deliveredAt,
            readAt: n.readAt,
            createdAt: n.createdAt,
          })),
          total,
          unreadCount,
          pagination: {
            limit: limitNum,
            offset: offsetNum,
            hasMore: offsetNum + limitNum < total,
          },
        },
      });
    } catch (error) {
      logger.error('Error getting notifications:', error);
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
   * PUT /api/notifications/:notificationId/read
   * Mark notification as read
   */
  async markAsRead(req: AuthRequest, res: Response) {
    try {
      const { notificationId } = req.params;
      const currentUserId = req.user?.id;
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Get notification
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
        include: {
          user: {
            select: {
              id: true,
              schoolId: true,
            },
          },
        },
      });

      if (!notification) {
        throw new NotFoundError('Notification not found');
      }

      // Verify user can mark this notification as read
      if (notification.userId !== currentUserId && req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN') {
        throw new ForbiddenError('You do not have access to this notification');
      }

      // Verify same school
      if (req.user?.role !== 'SUPER_ADMIN' && notification.user.schoolId !== schoolId) {
        throw new ForbiddenError('Cannot access notification from different school');
      }

      // Update notification
      const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: {
          readAt: new Date(),
          status: 'read',
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: currentUserId!,
          action: 'NOTIFICATION_READ',
          resource: 'Notification',
          resourceId: notificationId,
          details: {
            notificationId,
            userId: notification.userId,
          },
        },
      });

      logger.info(`Notification ${notificationId} marked as read by user ${currentUserId}`);

      res.json({
        success: true,
        message: 'Notification marked as read',
        data: {
          notification: {
            id: updated.id,
            userId: updated.userId,
            category: updated.category,
            title: updated.title,
            status: updated.status,
            readAt: updated.readAt,
          },
        },
      });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
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
   * PUT /api/notifications/read-all
   * Mark all notifications as read for a user
   */
  async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      const currentUserId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const { userId }: MarkAllReadBody = req.body;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Verify authenticated user matches
      if (userId !== currentUserId && req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN') {
        throw new ForbiddenError('You can only mark your own notifications as read');
      }

      // Verify user belongs to same school
      if (req.user?.role !== 'SUPER_ADMIN') {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { schoolId: true },
        });

        if (!user) {
          throw new NotFoundError('User not found');
        }

        if (user.schoolId !== schoolId) {
          throw new ForbiddenError('Cannot access notifications from different school');
        }
      }

      // Update all unread notifications
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          readAt: null,
        },
        data: {
          readAt: new Date(),
          status: 'read',
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: currentUserId!,
          action: 'NOTIFICATIONS_MARKED_ALL_READ',
          resource: 'Notification',
          details: {
            userId,
            updatedCount: result.count,
          },
        },
      });

      logger.info(`Marked ${result.count} notifications as read for user ${userId}`);

      res.json({
        success: true,
        message: 'All notifications marked as read',
        data: {
          updatedCount: result.count,
        },
      });
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
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
   * DELETE /api/notifications/:notificationId
   * Delete notification (soft delete - we'll use status field)
   */
  async deleteNotification(req: AuthRequest, res: Response) {
    try {
      const { notificationId } = req.params;
      const currentUserId = req.user?.id;
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Get notification
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
        include: {
          user: {
            select: {
              id: true,
              schoolId: true,
            },
          },
        },
      });

      if (!notification) {
        throw new NotFoundError('Notification not found');
      }

      // Verify notification belongs to user
      if (notification.userId !== currentUserId && req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN') {
        throw new ForbiddenError('You can only delete your own notifications');
      }

      // Verify same school
      if (req.user?.role !== 'SUPER_ADMIN' && notification.user.schoolId !== schoolId) {
        throw new ForbiddenError('Cannot access notification from different school');
      }

      // Soft delete by setting status to deleted
      // Since we don't have a deleted status, we'll delete the record
      // In production, you might want to add a deletedAt field
      await prisma.notification.delete({
        where: { id: notificationId },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: currentUserId!,
          action: 'NOTIFICATION_DELETED',
          resource: 'Notification',
          resourceId: notificationId,
          details: {
            notificationId,
            userId: notification.userId,
          },
        },
      });

      logger.info(`Notification ${notificationId} deleted by user ${currentUserId}`);

      res.json({
        success: true,
        message: 'Notification deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting notification:', error);
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
   * POST /api/notifications/preferences
   * Update notification preferences for a user
   */
  async updatePreferences(req: AuthRequest, res: Response) {
    try {
      const currentUserId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const { userId, preferences }: UpdatePreferencesBody = req.body;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Verify authenticated user matches
      if (userId !== currentUserId && req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN') {
        throw new ForbiddenError('You can only update your own preferences');
      }

      // Verify user exists and belongs to same school
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          schoolId: true,
          preferences: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (req.user?.role !== 'SUPER_ADMIN' && user.schoolId !== schoolId) {
        throw new ForbiddenError('Cannot update preferences for user from different school');
      }

      // Validate quiet hours format if provided
      if (preferences.quietHoursStart || preferences.quietHoursEnd) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (preferences.quietHoursStart && !timeRegex.test(preferences.quietHoursStart)) {
          throw new ValidationError('quietHoursStart must be in HH:mm format');
        }
        if (preferences.quietHoursEnd && !timeRegex.test(preferences.quietHoursEnd)) {
          throw new ValidationError('quietHoursEnd must be in HH:mm format');
        }
      }

      // Merge with existing preferences
      const existingPrefs = (user.preferences as any) || {};
      const notificationPrefs = existingPrefs.notifications || getDefaultPreferences();

      const updatedPrefs = {
        ...existingPrefs,
        notifications: {
          ...notificationPrefs,
          ...preferences,
        },
      };

      // Update user preferences
      await prisma.user.update({
        where: { id: userId },
        data: {
          preferences: updatedPrefs as any,
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: currentUserId!,
          action: 'NOTIFICATION_PREFERENCES_UPDATED',
          resource: 'User',
          resourceId: userId,
          details: {
            preferences,
          },
        },
      });

      logger.info(`Notification preferences updated for user ${userId}`);

      res.json({
        success: true,
        message: 'Preferences updated successfully',
        data: {
          preferences: updatedPrefs.notifications,
        },
      });
    } catch (error) {
      logger.error('Error updating preferences:', error);
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
   * GET /api/notifications/preferences/:userId
   * Get notification preferences for a user
   */
  async getPreferences(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.id;
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Verify user can access these preferences
      if (userId !== currentUserId && req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN') {
        throw new ForbiddenError('You do not have access to this user\'s preferences');
      }

      // Verify user exists and belongs to same school
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          schoolId: true,
          preferences: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (req.user?.role !== 'SUPER_ADMIN' && user.schoolId !== schoolId) {
        throw new ForbiddenError('Cannot access preferences from different school');
      }

      // Get preferences or return defaults
      const prefs = (user.preferences as any) || {};
      const notificationPrefs = prefs.notifications || getDefaultPreferences();

      res.json({
        success: true,
        data: {
          preferences: notificationPrefs,
        },
      });
    } catch (error) {
      logger.error('Error getting preferences:', error);
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
   * POST /api/notifications/test
   * Send test notification (for debugging)
   */
  async sendTestNotification(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const { userId: targetUserId, message }: SendTestNotificationBody = req.body;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Only allow in development mode or for admins
      const isDev = process.env.NODE_ENV !== 'production';
      const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'PRINCIPAL' || req.user?.role === 'SUPER_ADMIN';

      if (!isDev && !isAdmin) {
        throw new ForbiddenError('Test notifications are only available in development mode or for administrators');
      }

      if (!targetUserId || !message) {
        throw new ValidationError('userId and message are required');
      }

      // Verify target user exists and belongs to same school
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          schoolId: true,
          name: true,
        },
      });

      if (!targetUser) {
        throw new NotFoundError('Target user not found');
      }

      if (req.user?.role !== 'SUPER_ADMIN' && targetUser.schoolId !== schoolId) {
        throw new ForbiddenError('Cannot send test notification to user from different school');
      }

      // Send test notification immediately
      await NotificationService.sendNotification({
        userId: targetUserId,
        category: 'announcement',
        title: 'Test Notification',
        body: message,
        data: {
          type: 'test',
          sentBy: userId,
        },
        channels: ['push', 'in_app'],
        priority: 'normal',
      });

      // Create notification record
      const notification = await prisma.notification.create({
        data: {
          userId: targetUserId,
          category: 'announcement',
          title: 'Test Notification',
          body: message,
          data: {
            type: 'test',
            sentBy: userId,
          } as any,
          channels: ['push', 'in_app'] as any,
          priority: 'normal',
          status: 'sent',
          sentAt: new Date(),
        },
      });

      logger.info(`Test notification sent to ${targetUserId} by user ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Test notification sent successfully',
        data: {
          notificationId: notification.id,
          recipient: {
            id: targetUser.id,
            name: targetUser.name,
          },
        },
      });
    } catch (error) {
      logger.error('Error sending test notification:', error);
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
