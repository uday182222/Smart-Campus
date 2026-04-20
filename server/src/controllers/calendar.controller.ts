import { Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { AppError, NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/notification.service';

/**
 * Calendar Controller
 * Complete school event management with reminders, RSVP, and attendance tracking
 */

// TypeScript interfaces
interface CreateEventBody {
  title: string;
  description?: string;
  eventType: 'holiday' | 'exam' | 'sports' | 'meeting' | 'celebration';
  startDate: string; // ISO date string
  endDate?: string; // ISO date string (optional, defaults to startDate)
  location?: string;
  targetAudience: string | string[]; // Can be string from form or array
  reminderBefore?: number; // minutes before event
  classIds?: string[];
  isAllDay?: boolean;
  attendanceRequired?: boolean;
  maxAttendees?: number;
}

interface UpdateEventBody {
  title?: string;
  description?: string;
  eventType?: 'holiday' | 'exam' | 'sports' | 'meeting' | 'celebration';
  startDate?: string;
  endDate?: string;
  location?: string;
  targetAudience?: string | string[];
  reminderBefore?: number;
  classIds?: string[];
  isAllDay?: boolean;
  attendanceRequired?: boolean;
  maxAttendees?: number;
  status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

interface RSVPBody {
  attending: boolean;
  notes?: string;
}

/**
 * Get target user IDs based on target audience
 */
async function getTargetUserIds(
  targetAudience: string | string[],
  schoolId: string,
  classIds?: string[]
): Promise<string[]> {
  const audiences = Array.isArray(targetAudience) ? targetAudience : [targetAudience];
  const userIds: string[] = [];

  for (const audience of audiences) {
    switch (audience) {
      case 'all':
        // Get all active users in school
        const allUsers = await prisma.user.findMany({
          where: {
            schoolId,
            status: 'ACTIVE',
          },
          select: { id: true },
        });
        userIds.push(...allUsers.map((u) => u.id));
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
        userIds.push(...teachers.map((u) => u.id));
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
        userIds.push(...parents.map((u) => u.id));
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
        userIds.push(...students.map((u) => u.id));
        break;

      case 'classes':
        if (!classIds || classIds.length === 0) {
          break;
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

        // Filter students by class (stored in metadata)
        classStudents.forEach((student) => {
          const metadata = student.metadata as any;
          if (metadata?.classId && classIds.includes(metadata.classId)) {
            userIds.push(student.id);
          }
        });

        // Also get teachers assigned to these classes
        const teacherClasses = await prisma.teacherClass.findMany({
          where: {
            classId: { in: classIds },
          },
          select: { teacherId: true },
        });
        userIds.push(...teacherClasses.map((tc) => tc.teacherId));
        break;
    }
  }

  // Remove duplicates
  return [...new Set(userIds)];
}

/**
 * Schedule event reminders
 */
async function scheduleReminders(
  eventId: string,
  userIds: string[],
  reminderBefore: number,
  _eventStartDate: Date
): Promise<void> {
  if (!reminderBefore || reminderBefore <= 0) return;

  // Reminder records are created for background job processing
  // Background job will send reminders at: eventStartDate - reminderBefore minutes

  // Create reminder records for each user
  await Promise.all(
    userIds.map((userId) =>
      prisma.eventReminder.create({
        data: {
          eventId,
          userId,
          timing: reminderBefore,
          channels: ['push', 'in_app'] as any,
          sent: false,
        },
      })
    )
  );

  logger.info(`Scheduled ${userIds.length} reminders for event ${eventId} (${reminderBefore} minutes before)`);
}

/**
 * Send event notifications to target audience
 */
async function sendEventNotifications(
  event: any,
  userIds: string[],
  notificationType: 'created' | 'updated' | 'cancelled'
): Promise<void> {
  if (userIds.length === 0) return;

  const messages = {
    created: {
      title: 'New Event: ' + event.title,
      body: `${event.title} is scheduled for ${new Date(event.startDate).toLocaleDateString()} at ${event.startTime}`,
    },
    updated: {
      title: 'Event Updated: ' + event.title,
      body: `${event.title} has been updated. Check the calendar for details.`,
    },
    cancelled: {
      title: 'Event Cancelled: ' + event.title,
      body: `${event.title} has been cancelled.`,
    },
  };

  const message = messages[notificationType];

  await NotificationService.sendNotification({
    userIds,
    category: 'calendar',
    title: message.title,
    body: message.body,
    data: {
      eventId: event.id,
      type: `event_${notificationType}`,
    },
    channels: ['push', 'in_app'],
    priority: 'normal',
  });
}

/**
 * Check if user can view event based on target audience
 */
async function canUserViewEvent(
  event: any,
  userId: string,
  userRole: string,
  _schoolId: string
): Promise<boolean> {
  // Super admin can view everything
  if (userRole === 'SUPER_ADMIN') return true;

  // Admins and staff can view all events in their school
  if (['ADMIN', 'PRINCIPAL', 'OFFICE_STAFF'].includes(userRole)) return true;

  const targetAudience = Array.isArray(event.targetAudience)
    ? event.targetAudience
    : [event.targetAudience];

  // Check if user matches target audience
  if (targetAudience.includes('all')) return true;

  if (targetAudience.includes('teachers') && userRole === 'TEACHER') return true;
  if (targetAudience.includes('parents') && userRole === 'PARENT') return true;
  if (targetAudience.includes('students') && userRole === 'STUDENT') return true;

  // Check class-specific events
  if (targetAudience.includes('classes')) {
    const classIds = (event.classIds as any) || [];

    // Teachers can view events for their classes
    if (userRole === 'TEACHER') {
      const teacherClasses = await prisma.teacherClass.findMany({
        where: { teacherId: userId },
        select: { classId: true },
      });
      const teacherClassIds = teacherClasses.map((tc) => tc.classId);
      return classIds.some((cid: string) => teacherClassIds.includes(cid));
    }

    // Students can view events for their class
    if (userRole === 'STUDENT') {
      const student = await prisma.user.findUnique({
        where: { id: userId },
        select: { metadata: true },
      });
      const metadata = student?.metadata as any;
      return classIds.includes(metadata?.classId);
    }

    // Parents can view events for their children's classes
    if (userRole === 'PARENT') {
      const parentStudents = await prisma.parentStudent.findMany({
        where: { parentId: userId },
        include: {
          student: {
            select: { metadata: true },
          },
        },
      });

      const studentClassIds: string[] = [];
      parentStudents.forEach((ps) => {
        const metadata = ps.student.metadata as any;
        if (metadata?.classId) {
          studentClassIds.push(metadata.classId);
        }
      });

      return classIds.some((cid: string) => studentClassIds.includes(cid));
    }
  }

  return false;
}

export const calendarController = {
  /**
   * POST /api/calendar/event
   * Create new event
   */
  async createEvent(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const {
        title,
        description,
        eventType,
        startDate,
        endDate,
        location,
        targetAudience,
        reminderBefore,
        classIds,
        isAllDay = false,
        attendanceRequired = false,
        maxAttendees,
      }: CreateEventBody = req.body;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Validate required fields
      if (!title || !eventType || !startDate) {
        throw new ValidationError('title, eventType, and startDate are required');
      }

      // Validate event type
      const validTypes = ['holiday', 'exam', 'sports', 'meeting', 'celebration'];
      if (!validTypes.includes(eventType)) {
        throw new ValidationError(`eventType must be one of: ${validTypes.join(', ')}`);
      }

      // Parse dates
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        throw new ValidationError('Invalid startDate format. Use ISO 8601 format');
      }

      const end = endDate ? new Date(endDate) : start;
      if (isNaN(end.getTime())) {
        throw new ValidationError('Invalid endDate format. Use ISO 8601 format');
      }

      if (end < start) {
        throw new ValidationError('endDate must be after or equal to startDate');
      }

      // Parse target audience
      const parsedTargetAudience = Array.isArray(targetAudience) ? targetAudience : [targetAudience];
      const validAudiences = ['all', 'teachers', 'parents', 'students', 'classes'];
      const invalidAudiences = parsedTargetAudience.filter((a) => !validAudiences.includes(a));
      if (invalidAudiences.length > 0) {
        throw new ValidationError(`Invalid targetAudience: ${invalidAudiences.join(', ')}. Must be one of: ${validAudiences.join(', ')}`);
      }

      // Validate classIds if targetAudience includes 'classes'
      let parsedClassIds: string[] = [];
      if (parsedTargetAudience.includes('classes')) {
        if (!classIds || classIds.length === 0) {
          throw new ValidationError('classIds is required when targetAudience includes "classes"');
        }

        parsedClassIds = classIds;

        // Verify classes exist
        const classes = await prisma.class.findMany({
          where: {
            id: { in: parsedClassIds },
            schoolId,
          },
        });

        if (classes.length !== parsedClassIds.length) {
          throw new ValidationError('One or more classes not found or do not belong to this school');
        }
      }

      // Get target user IDs for notifications
      const targetUserIds = await getTargetUserIds(parsedTargetAudience, schoolId, parsedClassIds);

      // Extract time from dates or use defaults
      const startTime = isAllDay ? '00:00' : start.toTimeString().slice(0, 5);
      const endTime = isAllDay ? '23:59' : end.toTimeString().slice(0, 5);

      // Create event
      const event = await prisma.event.create({
        data: {
          schoolId,
          title,
          description: description || '',
          startDate: start,
          endDate: end,
          startTime,
          endTime,
          type: eventType,
          location: location || '',
          targetAudience: parsedTargetAudience.join(',') as any,
          classIds: parsedClassIds.length > 0 ? (parsedClassIds as any) : null,
          isAllDay,
          reminderSettings: reminderBefore
            ? {
                enabled: true,
                reminderBefore,
              }
            : { enabled: false },
          attendanceRequired,
          maxAttendees: maxAttendees || null,
          status: 'scheduled',
          createdBy: userId!,
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

      // Schedule reminders if provided
      if (reminderBefore && reminderBefore > 0) {
        await scheduleReminders(event.id, targetUserIds, reminderBefore, start);
      }

      // Send notifications to target audience
      await sendEventNotifications(event, targetUserIds, 'created');

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: userId!,
          action: 'EVENT_CREATED',
          resource: 'Event',
          resourceId: event.id,
          details: {
            title,
            eventType,
            startDate: start.toISOString(),
            targetAudience: parsedTargetAudience,
          },
        },
      });

      logger.info(`Event created: ${event.id} by user ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        data: {
          eventId: event.id,
          event: {
            id: event.id,
            schoolId: event.schoolId,
            school: event.school,
            title: event.title,
            description: event.description,
            startDate: event.startDate,
            endDate: event.endDate,
            startTime: event.startTime,
            endTime: event.endTime,
            type: event.type,
            location: event.location,
            targetAudience: parsedTargetAudience,
            classIds: parsedClassIds,
            isAllDay: event.isAllDay,
            attendanceRequired: event.attendanceRequired,
            maxAttendees: event.maxAttendees,
            status: event.status,
            createdBy: event.createdBy,
            createdAt: event.createdAt,
          },
        },
      });
    } catch (error) {
      logger.error('Error creating event:', error);
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
   * GET /api/calendar/events
   * Get events for a school
   */
  async getEvents(req: AuthRequest, res: Response) {
    try {
      const schoolId = req.query.schoolId as string;
      const userSchoolId = req.user?.schoolId;
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const { startDate, endDate, eventType, targetAudience } = req.query;

      if (!userSchoolId) {
        throw new ForbiddenError('School access required');
      }

      const targetSchoolId = schoolId || userSchoolId;

      // Verify access
      if (targetSchoolId !== userSchoolId && userRole !== 'SUPER_ADMIN') {
        throw new ForbiddenError('You do not have access to this school');
      }

      // Build where clause
      const where: any = {
        schoolId: targetSchoolId,
        status: { not: 'cancelled' }, // Exclude cancelled events by default
      };

      if (startDate) {
        where.startDate = {
          gte: new Date(startDate as string),
        };
      }

      if (endDate) {
        where.endDate = {
          lte: new Date(endDate as string),
        };
      }

      if (eventType) {
        where.type = eventType;
      }

      if (targetAudience) {
        // For JSON field, we need to check if it contains the value
        where.targetAudience = {
          contains: targetAudience as string,
        } as any;
      }

      // Get all events matching filters
      const allEvents = await prisma.event.findMany({
        where,
        include: {
          school: {
            select: {
              id: true,
              name: true,
            },
          },
          attendees: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: {
          startDate: 'asc',
        },
      });

      // Filter events based on user permissions
      const visibleEvents = [];
      for (const event of allEvents) {
        const canView = await canUserViewEvent(event, userId!, userRole!, targetSchoolId);
        if (canView) {
          visibleEvents.push(event);
        }
      }

      // Format response
      const formattedEvents = visibleEvents.map((event) => {
        const targetAudienceArray = typeof event.targetAudience === 'string'
          ? event.targetAudience.split(',')
          : (event.targetAudience as any) || [];

        return {
          id: event.id,
          schoolId: event.schoolId,
          school: event.school,
          title: event.title,
          description: event.description,
          startDate: event.startDate,
          endDate: event.endDate,
          startTime: event.startTime,
          endTime: event.endTime,
          type: event.type,
          location: event.location,
          targetAudience: targetAudienceArray,
          classIds: event.classIds,
          isAllDay: event.isAllDay,
          attendanceRequired: event.attendanceRequired,
          maxAttendees: event.maxAttendees,
          currentAttendees: event.currentAttendees,
          attendeeCount: event.attendees.length,
          status: event.status,
          createdBy: event.createdBy,
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
        };
      });

      logger.info(`Retrieved ${formattedEvents.length} events for school ${targetSchoolId}`);

      res.json({
        success: true,
        data: {
          events: formattedEvents,
          total: formattedEvents.length,
        },
      });
    } catch (error) {
      logger.error('Error getting events:', error);
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
   * GET /api/calendar/event/:eventId
   * Get single event details
   */
  async getEventDetails(req: AuthRequest, res: Response) {
    try {
      const { eventId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Get event
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          school: {
            select: {
              id: true,
              name: true,
            },
          },
          attendees: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              status: true,
              responseDate: true,
            },
          },
          reminders: {
            where: {
              userId: userId!,
            },
            select: {
              id: true,
              timing: true,
              sent: true,
              sentAt: true,
            },
          },
        },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      // Verify same school
      if (event.schoolId !== schoolId && userRole !== 'SUPER_ADMIN') {
        throw new ForbiddenError('You do not have access to this event');
      }

      // Check if user can view this event
      const canView = await canUserViewEvent(event, userId!, userRole!, schoolId);
      if (!canView) {
        throw new ForbiddenError('You do not have permission to view this event');
      }

      const targetAudienceArray = typeof event.targetAudience === 'string'
        ? event.targetAudience.split(',')
        : (event.targetAudience as any) || [];

      logger.info(`Event ${eventId} viewed by user ${userId}`);

      res.json({
        success: true,
        data: {
          event: {
            id: event.id,
            schoolId: event.schoolId,
            school: event.school,
            title: event.title,
            description: event.description,
            startDate: event.startDate,
            endDate: event.endDate,
            startTime: event.startTime,
            endTime: event.endTime,
            type: event.type,
            location: event.location,
            targetAudience: targetAudienceArray,
            classIds: event.classIds,
            isAllDay: event.isAllDay,
            reminderSettings: event.reminderSettings,
            attendanceRequired: event.attendanceRequired,
            maxAttendees: event.maxAttendees,
            currentAttendees: event.currentAttendees,
            attendeeCount: event.attendees.length,
            attendees: event.attendees,
            userReminder: event.reminders[0] || null,
            status: event.status,
            createdBy: event.createdBy,
            createdAt: event.createdAt,
            updatedAt: event.updatedAt,
          },
        },
      });
    } catch (error) {
      logger.error('Error getting event details:', error);
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
   * PUT /api/calendar/event/:eventId
   * Update event
   */
  async updateEvent(req: AuthRequest, res: Response) {
    try {
      const { eventId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const schoolId = req.user?.schoolId;
      const updateData: UpdateEventBody = req.body;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Authorization check - only admins, principals, or event creator can update
      const allowedRoles = ['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'];
      if (!allowedRoles.includes(userRole!) && req.user?.id) {
        // Check if user is the creator
        const existingEvent = await prisma.event.findUnique({
          where: { id: eventId },
          select: { createdBy: true, schoolId: true },
        });

        if (!existingEvent) {
          throw new NotFoundError('Event not found');
        }

        if (existingEvent.createdBy !== userId || existingEvent.schoolId !== schoolId) {
          throw new ForbiddenError('Only administrators or event creator can update events');
        }
      }

      // Get existing event
      const existingEvent = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!existingEvent) {
        throw new NotFoundError('Event not found');
      }

      // Verify same school
      if (existingEvent.schoolId !== schoolId && userRole !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Cannot update event from different school');
      }

      // Build update data
      const data: any = {};

      if (updateData.title !== undefined) data.title = updateData.title;
      if (updateData.description !== undefined) data.description = updateData.description;
      if (updateData.eventType !== undefined) data.type = updateData.eventType;
      if (updateData.startDate !== undefined) {
        data.startDate = new Date(updateData.startDate);
        // Update startTime if not all day
        if (!existingEvent.isAllDay && !updateData.isAllDay) {
          data.startTime = new Date(updateData.startDate).toTimeString().slice(0, 5);
        }
      }
      if (updateData.endDate !== undefined) {
        data.endDate = new Date(updateData.endDate);
        // Update endTime if not all day
        if (!existingEvent.isAllDay && !updateData.isAllDay) {
          data.endTime = new Date(updateData.endDate).toTimeString().slice(0, 5);
        }
      }
      if (updateData.location !== undefined) data.location = updateData.location;
      if (updateData.targetAudience !== undefined) {
        const parsed = Array.isArray(updateData.targetAudience)
          ? updateData.targetAudience
          : [updateData.targetAudience];
        data.targetAudience = parsed.join(',') as any;
      }
      if (updateData.classIds !== undefined) {
        data.classIds = updateData.classIds.length > 0 ? (updateData.classIds as any) : null;
      }
      if (updateData.isAllDay !== undefined) {
        data.isAllDay = updateData.isAllDay;
        if (updateData.isAllDay) {
          data.startTime = '00:00';
          data.endTime = '23:59';
        }
      }
      if (updateData.attendanceRequired !== undefined) data.attendanceRequired = updateData.attendanceRequired;
      if (updateData.maxAttendees !== undefined) data.maxAttendees = updateData.maxAttendees || null;
      if (updateData.status !== undefined) data.status = updateData.status;

      // Handle reminder settings
      if (updateData.reminderBefore !== undefined) {
        const reminderSettings = updateData.reminderBefore > 0
          ? {
              enabled: true,
              reminderBefore: updateData.reminderBefore,
            }
          : { enabled: false };
        data.reminderSettings = reminderSettings as any;

        // Update reminders if changed
        if (updateData.reminderBefore > 0) {
          const targetAudience = data.targetAudience || existingEvent.targetAudience;
          const parsedAudience = typeof targetAudience === 'string' ? targetAudience.split(',') : targetAudience;
          const targetUserIds = await getTargetUserIds(
            parsedAudience,
            schoolId,
            updateData.classIds || (existingEvent.classIds as any)
          );

          // Delete old reminders
          await prisma.eventReminder.deleteMany({
            where: { eventId },
          });

          // Create new reminders
          const startDate = data.startDate || existingEvent.startDate;
          await scheduleReminders(eventId, targetUserIds, updateData.reminderBefore, startDate);
        }
      }

      // Update event
      const updated = await prisma.event.update({
        where: { id: eventId },
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

      // Get target user IDs for update notification
      const targetAudience = updated.targetAudience;
      const parsedAudience = typeof targetAudience === 'string' ? targetAudience.split(',') : targetAudience;
      const targetUserIds = await getTargetUserIds(
        parsedAudience,
        schoolId,
        updated.classIds as any
      );

      // Send update notification
      await sendEventNotifications(updated, targetUserIds, 'updated');

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: userId!,
          action: 'EVENT_UPDATED',
          resource: 'Event',
          resourceId: eventId,
          details: {
            changes: Object.keys(data),
          },
        },
      });

      logger.info(`Event updated: ${eventId} by user ${userId}`);

      res.json({
        success: true,
        message: 'Event updated successfully',
        data: {
          event: {
            id: updated.id,
            title: updated.title,
            description: updated.description,
            startDate: updated.startDate,
            endDate: updated.endDate,
            type: updated.type,
            location: updated.location,
            status: updated.status,
          },
        },
      });
    } catch (error) {
      logger.error('Error updating event:', error);
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
   * DELETE /api/calendar/event/:eventId
   * Delete event (soft delete)
   */
  async deleteEvent(req: AuthRequest, res: Response) {
    try {
      const { eventId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Authorization check
      const allowedRoles = ['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'];
      if (!allowedRoles.includes(userRole!) && req.user?.id) {
        const existingEvent = await prisma.event.findUnique({
          where: { id: eventId },
          select: { createdBy: true, schoolId: true },
        });

        if (!existingEvent) {
          throw new NotFoundError('Event not found');
        }

        if (existingEvent.createdBy !== userId || existingEvent.schoolId !== schoolId) {
          throw new ForbiddenError('Only administrators or event creator can delete events');
        }
      }

      // Get event
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      // Verify same school
      if (event.schoolId !== schoolId && userRole !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Cannot delete event from different school');
      }

      // Soft delete by setting status to cancelled
      const deleted = await prisma.event.update({
        where: { id: eventId },
        data: {
          status: 'cancelled',
        },
      });

      // Get target user IDs for cancellation notification
      const targetAudience = event.targetAudience;
      const parsedAudience = typeof targetAudience === 'string' ? targetAudience.split(',') : targetAudience;
      const targetUserIds = await getTargetUserIds(parsedAudience, schoolId, event.classIds as any);

      // Send cancellation notification
      await sendEventNotifications(deleted, targetUserIds, 'cancelled');

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: userId!,
          action: 'EVENT_DELETED',
          resource: 'Event',
          resourceId: eventId,
          details: {
            title: event.title,
          },
        },
      });

      logger.info(`Event deleted: ${eventId} by user ${userId}`);

      res.json({
        success: true,
        message: 'Event deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting event:', error);
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
   * POST /api/calendar/event/:eventId/rsvp
   * RSVP to an event
   */
  async rsvpEvent(req: AuthRequest, res: Response) {
    try {
      const { eventId } = req.params;
      const userId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const { attending }: RSVPBody = req.body;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      if (attending === undefined) {
        throw new ValidationError('attending is required (true or false)');
      }

      // Get event
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new NotFoundError('Event not found');
      }

      // Verify same school
      if (event.schoolId !== schoolId && req.user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Cannot RSVP to event from different school');
      }

      // Check if event allows RSVP
      if (!event.attendanceRequired) {
        throw new ValidationError('This event does not require RSVP');
      }

      // Check if event is full
      if (attending && event.maxAttendees && event.currentAttendees >= event.maxAttendees) {
        throw new ValidationError('Event is full. Cannot RSVP.');
      }

      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Check if RSVP already exists
      const existingRSVP = await prisma.eventAttendee.findFirst({
        where: {
          eventId,
          email: user.email,
        },
      });

      const status = attending ? 'confirmed' : 'declined';

      if (existingRSVP) {
        // Update existing RSVP
        const updated = await prisma.eventAttendee.update({
          where: { id: existingRSVP.id },
          data: {
            status,
            responseDate: new Date(),
          },
        });

        // Update event attendee count
        if (attending && existingRSVP.status !== 'confirmed') {
          await prisma.event.update({
            where: { id: eventId },
            data: {
              currentAttendees: {
                increment: 1,
              },
            },
          });
        } else if (!attending && existingRSVP.status === 'confirmed') {
          await prisma.event.update({
            where: { id: eventId },
            data: {
              currentAttendees: {
                decrement: 1,
              },
            },
          });
        }

        logger.info(`RSVP updated for event ${eventId} by user ${userId}`);

        res.json({
          success: true,
          message: 'RSVP updated successfully',
          data: {
            rsvp: {
              id: updated.id,
              status: updated.status,
              responseDate: updated.responseDate,
            },
          },
        });
      } else {
        // Create new RSVP
        const rsvp = await prisma.eventAttendee.create({
          data: {
            eventId,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            status,
            responseDate: new Date(),
          },
        });

        // Update event attendee count if attending
        if (attending) {
          await prisma.event.update({
            where: { id: eventId },
            data: {
              currentAttendees: {
                increment: 1,
              },
            },
          });
        }

        logger.info(`RSVP created for event ${eventId} by user ${userId}`);

        res.status(201).json({
          success: true,
          message: 'RSVP recorded successfully',
          data: {
            rsvp: {
              id: rsvp.id,
              status: rsvp.status,
              responseDate: rsvp.responseDate,
            },
          },
        });
      }
    } catch (error) {
      logger.error('Error recording RSVP:', error);
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
   * GET /api/calendar/upcoming
   * Get upcoming events (next 7 days)
   */
  async getUpcomingEvents(req: AuthRequest, res: Response) {
    try {
      const userId = req.query.userId as string;
      const currentUserId = req.user?.id;
      const userRole = req.user?.role;
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Verify user can access these events
      if (userId !== currentUserId && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
        throw new ForbiddenError('You can only view your own upcoming events');
      }

      // Verify user belongs to same school
      if (userRole !== 'SUPER_ADMIN') {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { schoolId: true },
        });

        if (!user) {
          throw new NotFoundError('User not found');
        }

        if (user.schoolId !== schoolId) {
          throw new ForbiddenError('Cannot access events from different school');
        }
      }

      // Calculate date range (today to +7 days)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sevenDaysLater = new Date(today);
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      sevenDaysLater.setHours(23, 59, 59, 999);

      // Get user details to determine relevant events
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            role: true,
            metadata: true,
          },
        });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Get all events in date range for the school
      const allEvents = await prisma.event.findMany({
        where: {
          schoolId,
          startDate: {
            gte: today,
            lte: sevenDaysLater,
          },
          status: { not: 'cancelled' },
        },
        include: {
          school: {
            select: {
              id: true,
              name: true,
            },
          },
          attendees: {
            where: {
              email: user.email || '',
            },
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: {
          startDate: 'asc',
        },
      });

      // Filter events based on user's role and classes
      const relevantEvents = [];
      for (const event of allEvents) {
        const canView = await canUserViewEvent(event, userId, user.role, schoolId);
        if (canView) {
          relevantEvents.push(event);
        }
      }

      // Format response
      const formattedEvents = relevantEvents.map((event) => {
        const targetAudienceArray = typeof event.targetAudience === 'string'
          ? event.targetAudience.split(',')
          : (event.targetAudience as any) || [];

        return {
          id: event.id,
          title: event.title,
          description: event.description,
          startDate: event.startDate,
          endDate: event.endDate,
          startTime: event.startTime,
          endTime: event.endTime,
          type: event.type,
          location: event.location,
          targetAudience: targetAudienceArray,
          isAllDay: event.isAllDay,
          attendanceRequired: event.attendanceRequired,
          userRSVP: event.attendees[0] || null,
          status: event.status,
        };
      });

      logger.info(`Retrieved ${formattedEvents.length} upcoming events for user ${userId}`);

      res.json({
        success: true,
        data: {
          events: formattedEvents,
          total: formattedEvents.length,
          dateRange: {
            start: today.toISOString(),
            end: sevenDaysLater.toISOString(),
          },
        },
      });
    } catch (error) {
      logger.error('Error getting upcoming events:', error);
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
