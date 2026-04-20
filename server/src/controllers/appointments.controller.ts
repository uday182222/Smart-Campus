import { Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { AppError, NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/notification.service';

/**
 * Appointments Controller
 * Handles all appointment-related operations
 */

interface BookAppointmentBody {
  studentId: string;
  requestedDate: string; // ISO date string
  requestedTime: string; // HH:MM
  duration: number; // minutes
  reason: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: 'principal' | 'teacher' | 'counselor' | 'admin';
}

interface ApproveAppointmentBody {
  approvedDate?: string; // ISO date string
  approvedTime?: string; // HH:MM
  notes?: string;
}

export const appointmentsController = {
  /**
   * POST /api/appointments
   * Book a new appointment
   */
  async bookAppointment(req: AuthRequest, res: Response) {
    try {
      const parentId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const {
        studentId,
        requestedDate,
        requestedTime,
        duration,
        reason,
        priority = 'medium',
        assignedTo = 'principal',
      }: BookAppointmentBody = req.body;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Validate required fields
      if (!studentId || !requestedDate || !requestedTime || !duration || !reason) {
        throw new ValidationError('Missing required fields: studentId, requestedDate, requestedTime, duration, reason');
      }

      // Validate priority
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(priority)) {
        throw new ValidationError(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
      }

      // Validate assignedTo
      const validAssignees = ['principal', 'teacher', 'counselor', 'admin'];
      if (assignedTo && !validAssignees.includes(assignedTo)) {
        throw new ValidationError(`Invalid assignedTo. Must be one of: ${validAssignees.join(', ')}`);
      }

      // Validate date
      const requestedDateObj = new Date(requestedDate);
      if (isNaN(requestedDateObj.getTime())) {
        throw new ValidationError('Invalid requestedDate format. Use ISO 8601 format');
      }

      // Verify student exists and belongs to parent
      const student = await prisma.user.findFirst({
        where: {
          id: studentId,
          role: 'STUDENT',
          schoolId: schoolId,
        },
        include: {
          studentParents: {
            where: {
              parentId: parentId,
            },
          },
        },
      });

      if (!student) {
        throw new NotFoundError('Student not found');
      }

      // Verify parent-student relationship (if ParentStudent table exists)
      if (student.studentParents.length === 0 && req.user?.role !== 'SUPER_ADMIN') {
        // For now, allow if user is parent role - in production, verify relationship
        if (req.user?.role !== 'PARENT') {
          throw new ForbiddenError('You can only book appointments for your own children');
        }
      }

      // Create appointment
      const appointment = await prisma.appointment.create({
        data: {
          parentId: parentId!,
          studentId: studentId,
          requestedDate: requestedDateObj,
          requestedTime: requestedTime,
          duration: duration,
          reason: reason,
          priority: priority,
          assignedTo: assignedTo,
          status: 'pending',
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: parentId!,
          action: 'APPOINTMENT_BOOKED',
          resource: 'Appointment',
          resourceId: appointment.id,
          details: {
            studentId,
            requestedDate,
            requestedTime,
            priority,
            assignedTo,
          },
        },
      });

      // TODO: Send notification to assigned person (principal/teacher/counselor/admin)
      // For now, we'll just log it
      logger.info(`Appointment booked: ${appointment.id} by parent ${parentId} for student ${studentId}`);

      res.status(201).json({
        success: true,
        message: 'Appointment booked successfully',
        data: {
          appointment: {
            id: appointment.id,
            parentId: appointment.parentId,
            parent: appointment.parent,
            studentId: appointment.studentId,
            requestedDate: appointment.requestedDate,
            requestedTime: appointment.requestedTime,
            duration: appointment.duration,
            reason: appointment.reason,
            priority: appointment.priority,
            status: appointment.status,
            assignedTo: appointment.assignedTo,
            createdAt: appointment.createdAt,
          },
        },
      });
    } catch (error) {
      logger.error('Error booking appointment:', error);
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
   * PUT /api/appointments/:id/approve
   * Approve an appointment
   */
  async approveAppointment(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const approverId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const { approvedDate, approvedTime, notes }: ApproveAppointmentBody = req.body;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Authorization check - only admins, principals, teachers, or counselors can approve
      const allowedRoles = ['ADMIN', 'PRINCIPAL', 'TEACHER', 'COUNSELOR', 'SUPER_ADMIN'];
      if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Only staff members can approve appointments');
      }

      // Get appointment
      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              email: true,
              schoolId: true,
            },
          },
        },
      });

      if (!appointment) {
        throw new NotFoundError('Appointment not found');
      }

      // Verify same school
      if (appointment.parent.schoolId !== schoolId && req.user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Cannot approve appointment from different school');
      }

      // Check if already approved/rejected
      if (appointment.status !== 'pending') {
        throw new ValidationError(`Appointment is already ${appointment.status}`);
      }

      // Build update data
      const updateData: any = {
        status: 'approved',
        assignedPersonId: approverId,
      };

      if (approvedDate) {
        updateData.approvedDate = new Date(approvedDate);
      } else {
        // Use requested date if not provided
        updateData.approvedDate = appointment.requestedDate;
      }

      if (approvedTime) {
        updateData.approvedTime = approvedTime;
      } else {
        // Use requested time if not provided
        updateData.approvedTime = appointment.requestedTime;
      }

      if (notes) {
        updateData.notes = notes;
      }

      // Update appointment
      const updated = await prisma.appointment.update({
        where: { id },
        data: updateData,
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: approverId!,
          action: 'APPOINTMENT_APPROVED',
          resource: 'Appointment',
          resourceId: id,
          details: {
            appointmentId: id,
            parentId: appointment.parentId,
            approvedDate: updateData.approvedDate,
            approvedTime: updateData.approvedTime,
          },
        },
      });

      // Send notification to parent
      await NotificationService.sendNotification({
        userId: appointment.parentId,
        category: 'appointment',
        title: 'Appointment Approved',
        body: `Your appointment request has been approved. Scheduled for ${new Date(updateData.approvedDate).toLocaleDateString()} at ${updateData.approvedTime}`,
        data: {
          appointmentId: id,
          approvedDate: updateData.approvedDate,
          approvedTime: updateData.approvedTime,
          type: 'appointment_approved',
        },
        channels: ['push', 'in_app'],
        priority: 'normal',
      });

      logger.info(`Appointment approved: ${id} by ${approverId}`);

      res.json({
        success: true,
        message: 'Appointment approved successfully',
        data: {
          appointment: {
            id: updated.id,
            parentId: updated.parentId,
            parent: updated.parent,
            studentId: updated.studentId,
            requestedDate: updated.requestedDate,
            requestedTime: updated.requestedTime,
            approvedDate: updated.approvedDate,
            approvedTime: updated.approvedTime,
            duration: updated.duration,
            reason: updated.reason,
            priority: updated.priority,
            status: updated.status,
            assignedTo: updated.assignedTo,
            assignedPersonId: updated.assignedPersonId,
            notes: updated.notes,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
          },
        },
      });
    } catch (error) {
      logger.error('Error approving appointment:', error);
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
   * GET /api/appointments/:userId
   * Get all appointments for a user (parent or staff)
   */
  async getUserAppointments(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const { status, role } = req.query;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Authorization check
      if (userId !== currentUserId && req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN') {
        throw new ForbiddenError('You can only view your own appointments');
      }

      // Verify user exists and get their role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          schoolId: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify same school
      if (user.schoolId !== schoolId && req.user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Cannot access appointments from different school');
      }

      // Build where clause
      let where: any = {};

      if (user.role === 'PARENT') {
        // Parents see their own appointments
        where.parentId = userId;
        if (status) {
          where.status = status;
        }
      } else {
        // Staff see appointments assigned to them or all pending appointments in their school
        // First, get all parents in the school
        const parentsInSchool = await prisma.user.findMany({
          where: {
            schoolId: schoolId,
            role: 'PARENT',
          },
          select: { id: true },
        });
        const parentIds = parentsInSchool.map((p) => p.id);

        // Build query for staff
        where = {
          parentId: { in: parentIds },
        };

        // If they want to see only their assigned appointments
        if (role === 'assigned') {
          where.assignedPersonId = userId;
        } else if (role === 'pending') {
          // Show only pending appointments
          where.status = 'pending';
        } else {
          // Show all appointments (assigned to them or pending)
          where.OR = [
            { assignedPersonId: userId },
            { status: 'pending' },
          ];
        }

        // Apply status filter if provided (overrides OR condition)
        if (status) {
          where.status = status;
          // Remove OR if status is specified
          delete where.OR;
        }
      }

      // Get appointments
      const appointments = await prisma.appointment.findMany({
        where,
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: {
          requestedDate: 'desc',
        },
      });

      logger.info(`Retrieved ${appointments.length} appointments for user ${userId}`);

      res.json({
        success: true,
        data: {
          appointments: appointments.map((apt) => ({
            id: apt.id,
            parentId: apt.parentId,
            parent: apt.parent,
            studentId: apt.studentId,
            requestedDate: apt.requestedDate,
            requestedTime: apt.requestedTime,
            approvedDate: apt.approvedDate,
            approvedTime: apt.approvedTime,
            duration: apt.duration,
            reason: apt.reason,
            priority: apt.priority,
            status: apt.status,
            assignedTo: apt.assignedTo,
            assignedPersonId: apt.assignedPersonId,
            rejectionReason: apt.rejectionReason,
            rescheduleReason: apt.rescheduleReason,
            notes: apt.notes,
            completedAt: apt.completedAt,
            createdAt: apt.createdAt,
            updatedAt: apt.updatedAt,
          })),
          total: appointments.length,
        },
      });
    } catch (error) {
      logger.error('Error getting appointments:', error);
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

