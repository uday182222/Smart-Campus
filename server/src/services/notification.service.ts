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

export class NotificationService {
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

      // Determine target user IDs
      let targetUserIds: string[] = [];
      if (userId) {
        targetUserIds = [userId];
      } else if (userIds && userIds.length > 0) {
        targetUserIds = userIds;
      } else {
        logger.warn('No target users specified for notification');
        return;
      }

      // Create notifications
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
      // Don't throw - notification failures shouldn't break the main flow
    }
  }

  /**
   * Send notification to parents when attendance is marked
   */
  static async notifyAttendanceMarked(studentId: string, status: string, date: string): Promise<void> {
    try {
      // Get student's parent(s)
      const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          name: true,
          metadata: true,
        },
      });

      if (!student) {
        logger.warn(`Student ${studentId} not found for attendance notification`);
        return;
      }

      // Get parent IDs from student metadata or find parents linked to student
      // This is a simplified version - adjust based on your data model
      const parentIds: string[] = [];
      
      // If you have a parent-student relationship table, query it here
      // For now, we'll try to get from metadata
      if (student.metadata && typeof student.metadata === 'object') {
        const metadata = student.metadata as any;
        if (metadata.parentIds && Array.isArray(metadata.parentIds)) {
          parentIds.push(...metadata.parentIds);
        }
      }

      if (parentIds.length === 0) {
        logger.warn(`No parents found for student ${studentId}`);
        return;
      }

      const statusText = status === 'present' ? 'present' : status === 'absent' ? 'absent' : status === 'late' ? 'late' : status;

      await this.sendNotification({
        userIds: parentIds,
        category: 'attendance',
        title: 'Attendance Marked',
        body: `${student.name} was marked as ${statusText} on ${new Date(date).toLocaleDateString()}`,
        data: {
          studentId,
          studentName: student.name,
          status,
          date,
          type: 'attendance',
        },
        channels: ['push', 'in_app'],
        priority: status === 'absent' ? 'high' : 'normal',
      });
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
      // Get student's parent(s)
      const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          name: true,
          metadata: true,
        },
      });

      if (!student) {
        logger.warn(`Student ${studentId} not found for marks notification`);
        return;
      }

      // Get parent IDs
      const parentIds: string[] = [];
      if (student.metadata && typeof student.metadata === 'object') {
        const metadata = student.metadata as any;
        if (metadata.parentIds && Array.isArray(metadata.parentIds)) {
          parentIds.push(...metadata.parentIds);
        }
      }

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

