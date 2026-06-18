import prisma from '../config/database';
import { logger } from '../utils/logger';

/**
 * Notification Service
 * Helper service for sending notifications
 */

interface SendNotificationOptions {
  userId?: string;
  userIds?: string[];
  category: string;
  title: string;
  body: string;
  data?: any;
  channels?: string[];
  priority?: 'low' | 'normal' | 'high';
}

interface ExpoPushOptions {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export class NotificationService {
  /**
   * Send push notification via Expo Push API
   */
  static async sendExpoPush(options: ExpoPushOptions): Promise<void> {
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: options.to,
          title: options.title,
          body: options.body,
          data: options.data ?? {},
        }),
      });

      if (!response.ok) {
        logger.warn(`Expo push failed with status ${response.status}`);
      }
    } catch (error) {
      logger.error('Error sending Expo push notification:', error);
    }
  }

  /**
   * Send notification(s) to user(s)
   */
  static async sendNotification(options: SendNotificationOptions): Promise<void> {
    try {
      const {
        userId,
        userIds,
        category,
        title,
        body,
        data,
        channels = ['push', 'in_app'],
        priority = 'normal',
      } = options;

      let targetUserIds: string[] = [];
      if (userId) {
        targetUserIds = [userId];
      } else if (userIds && userIds.length > 0) {
        targetUserIds = userIds;
      } else {
        logger.warn('No target users specified for notification');
        return;
      }

      await Promise.all(
        targetUserIds.map((targetUserId) =>
          prisma.notification.create({
            data: {
              userId: targetUserId,
              category,
              title,
              body,
              data: data ? (data as any) : null,
              channels: channels as any,
              priority,
              status: 'pending',
            },
          })
        )
      );

      logger.info(`Sent ${targetUserIds.length} notification(s) for category: ${category}`);
    } catch (error) {
      logger.error('Error sending notification:', error);
    }
  }

  /**
   * Notify parent(s) when a student is marked absent or late
   */
  static async notifyAttendanceMarked(studentId: string, status: string, date: string): Promise<void> {
    try {
      if (status !== 'absent' && status !== 'late') {
        return;
      }

      const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: { id: true, name: true },
      });

      if (!student) {
        logger.warn(`Student ${studentId} not found for attendance notification`);
        return;
      }

      const parentLinks = await prisma.parentStudent.findMany({
        where: { studentId },
        include: {
          parent: {
            select: { id: true, name: true, pushToken: true },
          },
        },
      });

      if (parentLinks.length === 0) {
        logger.warn(`No parents found for student ${studentId}`);
        return;
      }

      const statusLabel = status === 'absent' ? 'ABSENT' : 'LATE';
      const formattedDate = new Date(date).toLocaleDateString();

      for (const link of parentLinks) {
        const parent = link.parent;
        const alertBody = `${student.name} was marked ${statusLabel} today (${formattedDate})`;

        await prisma.notification.create({
          data: {
            userId: parent.id,
            category: 'ATTENDANCE',
            title: 'Attendance Alert',
            body: alertBody,
            data: {
              type: 'ATTENDANCE',
              studentId: student.id,
              studentName: student.name,
              status,
              date,
            } as any,
            channels: ['in_app', 'push'] as any,
            priority: 'high',
            status: 'sent',
            sentAt: new Date(),
          },
        });

        if (parent.pushToken) {
          await this.sendExpoPush({
            to: parent.pushToken,
            title: 'Attendance Alert 🔔',
            body: `${student.name} was marked ${statusLabel} today`,
            data: { type: 'ATTENDANCE', studentId: student.id },
          });
        }
      }
    } catch (error) {
      logger.error('Error sending attendance notification:', error);
    }
  }

  /**
   * Send notification when homework is assigned
   */
  static async notifyHomeworkAssigned(
    classId: string,
    homeworkTitle: string,
    dueDate: Date,
    studentIds: string[]
  ): Promise<void> {
    try {
      if (studentIds.length === 0) {
        logger.warn('No students to notify for homework');
        return;
      }

      await this.sendNotification({
        userIds: studentIds,
        category: 'homework',
        title: 'New Homework Assigned',
        body: `New homework: ${homeworkTitle}. Due: ${dueDate.toLocaleDateString()}`,
        data: {
          classId,
          homeworkTitle,
          dueDate: dueDate.toISOString(),
          type: 'homework',
        },
        channels: ['push', 'in_app'],
        priority: 'normal',
      });
    } catch (error) {
      logger.error('Error sending homework notification:', error);
    }
  }

  /**
   * Send notification when marks are entered
   */
  static async notifyMarksEntered(
    studentId: string,
    examName: string,
    subject: string,
    marksObtained: number,
    maxMarks: number
  ): Promise<void> {
    try {
      const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          name: true,
        },
      });

      if (!student) {
        logger.warn(`Student ${studentId} not found for marks notification`);
        return;
      }

      const parentLinks = await prisma.parentStudent.findMany({
        where: { studentId },
        select: { parentId: true },
      });

      const parentIds = parentLinks.map((link) => link.parentId);

      if (parentIds.length === 0) {
        logger.warn(`No parents found for student ${studentId}`);
        return;
      }

      const percentage = ((marksObtained / maxMarks) * 100).toFixed(1);

      await this.sendNotification({
        userIds: parentIds,
        category: 'marks',
        title: 'Marks Entered',
        body: `${student.name} scored ${marksObtained}/${maxMarks} (${percentage}%) in ${subject} - ${examName}`,
        data: {
          studentId,
          studentName: student.name,
          examName,
          subject,
          marksObtained,
          maxMarks,
          percentage: parseFloat(percentage),
          type: 'marks',
        },
        channels: ['push', 'in_app'],
        priority: 'normal',
      });
    } catch (error) {
      logger.error('Error sending marks notification:', error);
    }
  }
}
