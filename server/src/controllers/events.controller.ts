import { Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { AppError, NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';
import { EventType } from '@prisma/client';

/**
 * School Events Controller
 * CRUD for SchoolEvent (admin creates), all roles read.
 * getEventsByDate returns events + teacher's classes + homework due by role.
 */

function parseDateOnly(dateStr: string): Date {
  const d = new Date(dateStr + 'T00:00:00.000Z');
  if (isNaN(d.getTime())) throw new ValidationError('Invalid date format. Use YYYY-MM-DD');
  return d;
}

export const eventsController = {
  /**
   * POST /events — ADMIN/PRINCIPAL only
   * Body: { title, description?, date, endDate?, type }
   */
  async createEvent(req: AuthRequest, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const userId = req.user?.id;
      if (!schoolId || !userId) throw new ForbiddenError('School access required');

      const { title, description, date, endDate, type } = req.body as {
        title?: string;
        description?: string;
        date?: string;
        endDate?: string;
        type?: EventType;
      };
      if (!title?.trim()) throw new ValidationError('title is required');
      const dateObj = date ? parseDateOnly(date) : new Date();
      const endDateObj = endDate ? parseDateOnly(endDate) : null;
      const eventType = type && Object.values(EventType).includes(type) ? type : EventType.EVENT;

      const event = await prisma.schoolEvent.create({
        data: {
          schoolId,
          title: title.trim(),
          description: description?.trim() || null,
          date: dateObj,
          endDate: endDateObj,
          type: eventType,
          createdBy: userId,
        },
      });

      return res.status(201).json({
        success: true,
        data: {
          id: event.id,
          title: event.title,
          description: event.description,
          date: event.date.toISOString().split('T')[0],
          endDate: event.endDate?.toISOString().split('T')[0] ?? null,
          type: event.type,
          createdBy: event.createdBy,
          createdAt: event.createdAt.toISOString(),
        },
      });
    } catch (error) {
      logger.error('Create event error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create event', 500);
    }
  },

  /**
   * GET /events — all authenticated
   * Query: month (1-12), year, type? (optional)
   */
  async getEvents(req: AuthRequest, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) throw new ForbiddenError('School access required');

      const month = parseInt(String(req.query.month), 10);
      const year = parseInt(String(req.query.year), 10);
      const type = req.query.type as EventType | undefined;
      if (!month || month < 1 || month > 12 || !year) {
        throw new ValidationError('Valid month (1-12) and year are required');
      }

      const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const end = new Date(year, month, 0, 23, 59, 59, 999);

      const where: any = { schoolId, date: { gte: start, lte: end } };
      if (type && Object.values(EventType).includes(type)) where.type = type;

      let events: {
        id: string;
        title: string;
        description: string | null;
        date: Date;
        endDate: Date | null;
        type: EventType;
        createdBy: string;
      }[] = [];
      try {
        events = await prisma.schoolEvent.findMany({
          where,
          orderBy: { date: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            date: true,
            endDate: true,
            type: true,
            createdBy: true,
          },
        });
      } catch (error: any) {
        // If the DB is missing the table (e.g. migrations not applied yet), don't crash the server.
        if (error?.code === 'P2021') {
          return res.json({ success: true, data: [] });
        }
        throw error;
      }

      const list = events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description ?? '',
        date: e.date.toISOString().split('T')[0],
        endDate: e.endDate?.toISOString().split('T')[0] ?? null,
        type: e.type,
        createdBy: e.createdBy,
      }));

      return res.json({ success: true, data: list });
    } catch (error) {
      logger.error('Get events error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch events', 500);
    }
  },

  /**
   * GET /events/date/:date — all roles
   * :date = YYYY-MM-DD
   * Returns: events, classes (teacher), homeworkDue (teacher/parent), reminders (empty)
   */
  async getEventsByDate(req: AuthRequest, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const userId = req.user?.id;
      const role = req.user?.role;
      if (!schoolId || !userId) throw new ForbiddenError('Authentication required');

      const dateStr = req.params.date;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) throw new ValidationError('Date must be YYYY-MM-DD');
      const dayStart = parseDateOnly(dateStr);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      // School events for this date (or overlapping multi-day)
      let events: {
        id: string;
        title: string;
        description: string | null;
        date: Date;
        endDate: Date | null;
        type: EventType;
        createdBy: string;
      }[] = [];
      try {
        events = await prisma.schoolEvent.findMany({
          where: {
            schoolId,
            OR: [
              { date: { gte: dayStart, lte: dayEnd } },
              {
                AND: [
                  { endDate: { not: null } },
                  { date: { lte: dayEnd } },
                  { endDate: { gte: dayStart } },
                ],
              },
            ],
          },
          orderBy: { date: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            date: true,
            endDate: true,
            type: true,
            createdBy: true,
          },
        });
      } catch (error: any) {
        if (error?.code === 'P2021') {
          return res.json({ success: true, data: { events: [], classes: [], homeworkDue: [], reminders: [] } });
        }
        throw error;
      }

      const eventsList = events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description ?? '',
        date: e.date.toISOString().split('T')[0],
        endDate: e.endDate?.toISOString().split('T')[0] ?? null,
        type: e.type,
        createdBy: e.createdBy,
      }));

      type ClassRow = {
        id: string;
        name: string;
        section: string;
        subject: string;
        startTime: string;
        endTime: string;
        room: string;
      };
      let classes: ClassRow[] = [];

      if (role === 'TEACHER' || role === 'ADMIN' || role === 'PRINCIPAL') {
        const teacherClasses = await prisma.teacherClass.findMany({
          where: { teacherId: userId },
          include: {
            class: {
              select: {
                id: true,
                name: true,
                section: true,
                roomNumber: true,
                schedule: true,
              },
            },
          },
        });
        const dayOfWeek = dayStart.getDay(); // 0 Sun .. 6 Sat
        for (const tc of teacherClasses) {
          const schedule = tc.class.schedule as any;
          const slots = Array.isArray(schedule?.slots) ? schedule.slots : [];
          const slot = slots.find((s: any) => s.day === dayOfWeek || s.dayOfWeek === dayOfWeek) || slots[0] || {};
          classes.push({
            id: tc.class.id,
            name: tc.class.name,
            section: tc.class.section,
            subject: tc.subject,
            startTime: slot.startTime || '08:00',
            endTime: slot.endTime || '09:00',
            room: tc.class.roomNumber || '—',
          });
        }
        classes.sort((a, b) => a.startTime.localeCompare(b.startTime));
      }

      type HomeworkRow = { id: string; title: string; subject: string; className: string };
      let homeworkDue: HomeworkRow[] = [];

      const dueStart = new Date(dayStart);
      dueStart.setHours(0, 0, 0, 0);
      const dueEnd = new Date(dayStart);
      dueEnd.setHours(23, 59, 59, 999);

      if (role === 'TEACHER' || role === 'ADMIN' || role === 'PRINCIPAL') {
        const homework = await prisma.homework.findMany({
          where: {
            teacherId: userId,
            dueDate: { gte: dueStart, lte: dueEnd },
            status: 'active',
          },
          include: { class: { select: { name: true, section: true } } },
        });
        homeworkDue = homework.map((h) => ({
          id: h.id,
          title: h.title,
          subject: h.subject,
          className: `${h.class.name} ${h.class.section}`,
        }));
      } else if (role === 'PARENT') {
        const links = await prisma.parentStudent.findMany({
          where: { parentId: userId },
          select: { studentId: true },
        });
        const studentIds = links.map((l) => l.studentId);
        const students = await prisma.user.findMany({
          where: { id: { in: studentIds }, role: 'STUDENT' },
          select: { id: true, metadata: true },
        });
        const classIds = students
          .map((s) => (s.metadata as any)?.classId)
          .filter(Boolean) as string[];
        if (classIds.length > 0) {
          const homework = await prisma.homework.findMany({
            where: {
              classId: { in: classIds },
              dueDate: { gte: dueStart, lte: dueEnd },
              status: 'active',
            },
            include: { class: { select: { name: true, section: true } } },
          });
          homeworkDue = homework.map((h) => ({
            id: h.id,
            title: h.title,
            subject: h.subject,
            className: `${h.class.name} ${h.class.section}`,
          }));
        }
      }

      return res.json({
        success: true,
        data: {
          events: eventsList,
          classes,
          homeworkDue,
          reminders: [],
        },
      });
    } catch (error) {
      logger.error('Get events by date error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch date details', 500);
    }
  },

  /**
   * PATCH /events/:id — ADMIN only
   */
  async updateEvent(req: AuthRequest, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const userId = req.user?.id;
      if (!schoolId || !userId) throw new ForbiddenError('School access required');

      const eventId = req.params.id;
      const existing = await prisma.schoolEvent.findFirst({
        where: { id: eventId, schoolId },
      });
      if (!existing) throw new NotFoundError('Event not found');

      const { title, description, date, endDate, type } = req.body as {
        title?: string;
        description?: string;
        date?: string;
        endDate?: string;
        type?: EventType;
      };

      const updateData: any = {};
      if (title !== undefined) updateData.title = title.trim();
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (date !== undefined) updateData.date = parseDateOnly(date);
      if (endDate !== undefined) updateData.endDate = endDate ? parseDateOnly(endDate) : null;
      if (type !== undefined && Object.values(EventType).includes(type)) updateData.type = type;

      const event = await prisma.schoolEvent.update({
        where: { id: eventId },
        data: updateData,
      });

      return res.json({
        success: true,
        data: {
          id: event.id,
          title: event.title,
          description: event.description,
          date: event.date.toISOString().split('T')[0],
          endDate: event.endDate?.toISOString().split('T')[0] ?? null,
          type: event.type,
          createdBy: event.createdBy,
          updatedAt: event.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      logger.error('Update event error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update event', 500);
    }
  },

  /**
   * DELETE /events/:id — ADMIN only
   */
  async deleteEvent(req: AuthRequest, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) throw new ForbiddenError('School access required');

      const eventId = req.params.id;
      const existing = await prisma.schoolEvent.findFirst({
        where: { id: eventId, schoolId },
      });
      if (!existing) throw new NotFoundError('Event not found');

      await prisma.schoolEvent.delete({ where: { id: eventId } });
      return res.json({ success: true, message: 'Event deleted' });
    } catch (error) {
      logger.error('Delete event error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete event', 500);
    }
  },

  /**
   * GET /events/upcoming — all roles, next 5 events from today
   */
  async getUpcomingEvents(req: AuthRequest, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) throw new ForbiddenError('School access required');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const events = await prisma.schoolEvent.findMany({
        where: { schoolId, date: { gte: today } },
        orderBy: { date: 'asc' },
        take: 5,
        select: {
          id: true,
          title: true,
          description: true,
          date: true,
          endDate: true,
          type: true,
        },
      });

      const list = events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description ?? '',
        date: e.date.toISOString().split('T')[0],
        endDate: e.endDate?.toISOString().split('T')[0] ?? null,
        type: e.type,
      }));

      return res.json({ success: true, data: list });
    } catch (error) {
      logger.error('Get upcoming events error:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch upcoming events', 500);
    }
  },
};
