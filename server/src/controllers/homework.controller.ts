import { Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { AppError, NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';
import { uploadMultipleToS3, deleteMultipleFromS3 } from '../middleware/s3Upload';
import { NotificationService } from '../services/notification.service';

/**
 * Homework Controller
 * Handles all homework-related operations with S3 file uploads
 */

// Type definitions
interface CreateHomeworkBody {
  classId: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string; // ISO date string
  attachments?: string[]; // URLs from S3 uploads
}

interface UpdateHomeworkBody {
  subject?: string;
  title?: string;
  description?: string;
  dueDate?: string;
  status?: 'active' | 'archived';
  attachments?: string[];
}

// SubmitHomeworkBody interface removed - not needed

export const homeworkController = {
  /**
   * GET /api/homework/:classId
   * Get all homework assignments for a class
   */
  async getClassHomework(req: AuthRequest, res: Response) {
    try {
      const { classId } = req.params;
      const { status, subject } = req.query;
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Verify class exists and belongs to user's school
      const classRecord = await prisma.class.findFirst({
        where: {
          id: classId,
          schoolId: schoolId
        }
      });

      if (!classRecord) {
        throw new NotFoundError('Class not found');
      }

      // Build filter
      const where: any = {
        classId: classId
      };

      if (status) {
        where.status = status;
      }

      if (subject) {
        where.subject = subject;
      }

      // Get homework assignments
      const homework = await prisma.homework.findMany({
        where,
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          class: {
            select: {
              id: true,
              name: true,
              section: true
            }
          },
          _count: {
            select: {
              submissions: true
            }
          }
        },
        orderBy: {
          dueDate: 'asc'
        }
      });

      logger.info(`Retrieved ${homework.length} homework assignments for class ${classId}`);

      res.status(200).json({
        success: true,
        data: {
          classId: classId,
          className: `${classRecord.name}${classRecord.section ? ` ${classRecord.section}` : ''}`,
          homework: homework.map(hw => ({
            id: hw.id,
            subject: hw.subject,
            title: hw.title,
            description: hw.description,
            dueDate: hw.dueDate.toISOString(),
            attachments: hw.attachments || [],
            status: hw.status,
            teacher: {
              id: hw.teacher.id,
              name: hw.teacher.name,
              email: hw.teacher.email
            },
            submissionCount: hw._count.submissions,
            createdAt: hw.createdAt,
            updatedAt: hw.updatedAt
          }))
        }
      });
    } catch (error) {
      logger.error('Error getting class homework:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve homework', 500);
    }
  },

  /**
   * POST /api/homework
   * Create new homework assignment with file uploads
   */
  async createHomework(req: AuthRequest, res: Response) {
    try {
      const teacherId = req.user?.id;
      const schoolId = req.user?.schoolId;

      if (!teacherId) {
        throw new ForbiddenError('Teacher access required');
      }

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      const { classId, subject, title, description, dueDate } = req.body as CreateHomeworkBody;

      // Validate required fields
      if (!classId || !subject || !title || !description || !dueDate) {
        throw new ValidationError('Missing required fields: classId, subject, title, description, dueDate');
      }

      // Validate date
      const dueDateObj = new Date(dueDate);
      if (isNaN(dueDateObj.getTime())) {
        throw new ValidationError('Invalid dueDate format. Use ISO 8601 format');
      }

      // Verify class exists
      const classRecord = await prisma.class.findFirst({
        where: {
          id: classId,
          schoolId: schoolId
        }
      });

      if (!classRecord) {
        throw new NotFoundError('Class not found');
      }

      // Handle file uploads if any
      let attachmentUrls: string[] = [];
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        try {
          attachmentUrls = await uploadMultipleToS3(req.files as Express.Multer.File[], 'homework');
        } catch (uploadError) {
          logger.error('Error uploading files:', uploadError);
          throw new AppError('Failed to upload attachments', 500);
        }
      } else if (req.body.attachments && Array.isArray(req.body.attachments)) {
        // If attachments are already URLs (from previous uploads)
        attachmentUrls = req.body.attachments;
      }

      // Create homework
      const homework = await prisma.homework.create({
        data: {
          classId: classId,
          teacherId: teacherId,
          subject: subject,
          title: title,
          description: description,
          dueDate: dueDateObj,
          attachments: attachmentUrls.length > 0 ? (attachmentUrls as any) : null,
          status: 'active'
        },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          class: {
            select: {
              id: true,
              name: true,
              section: true
            }
          }
        }
      });

      logger.info(`Homework created: ${homework.id} by teacher ${teacherId}`);

      // Get all students in the class to notify them
      const students = await prisma.user.findMany({
        where: {
          role: 'STUDENT',
          schoolId: schoolId,
          // In production, you'd filter by class membership via a junction table
          // For now, we'll get all students in the school
        },
        select: {
          id: true,
        },
      });

      const studentIds = students.map((s) => s.id);

      // Send notifications to students
      if (studentIds.length > 0) {
        await NotificationService.notifyHomeworkAssigned(
          classId,
          title,
          dueDateObj,
          studentIds
        );
      }

      res.status(201).json({
        success: true,
        message: 'Homework created successfully',
        data: {
          id: homework.id,
          classId: homework.classId,
          className: `${homework.class.name}${homework.class.section ? ` ${homework.class.section}` : ''}`,
          subject: homework.subject,
          title: homework.title,
          description: homework.description,
          dueDate: homework.dueDate.toISOString(),
          attachments: attachmentUrls,
          status: homework.status,
          teacher: {
            id: homework.teacher.id,
            name: homework.teacher.name
          },
          createdAt: homework.createdAt,
          updatedAt: homework.updatedAt
        }
      });
    } catch (error) {
      logger.error('Error creating homework:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create homework', 500);
    }
  },

  /**
   * PUT /api/homework/:id
   * Update homework assignment
   */
  async updateHomework(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const teacherId = req.user?.id;
      const schoolId = req.user?.schoolId;

      if (!teacherId) {
        throw new ForbiddenError('Teacher access required');
      }

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      const { subject, title, description, dueDate, status, attachments } = req.body as UpdateHomeworkBody;

      // Find homework
      const homework = await prisma.homework.findFirst({
        where: { id },
        include: {
          class: {
            select: {
              schoolId: true
            }
          }
        }
      });

      if (!homework) {
        throw new NotFoundError('Homework not found');
      }

      // Verify school access and teacher ownership
      if (homework.class.schoolId !== schoolId) {
        throw new ForbiddenError('Access denied to this homework');
      }

      if (homework.teacherId !== teacherId) {
        throw new ForbiddenError('Only the creator can edit this homework');
      }

      // Handle new file uploads if any
      let newAttachmentUrls: string[] = homework.attachments ? (homework.attachments as string[]) : [];
      
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        try {
          const uploadedUrls = await uploadMultipleToS3(req.files as Express.Multer.File[], 'homework');
          newAttachmentUrls = [...newAttachmentUrls, ...uploadedUrls];
        } catch (uploadError) {
          logger.error('Error uploading files:', uploadError);
          throw new AppError('Failed to upload attachments', 500);
        }
      } else if (attachments && Array.isArray(attachments)) {
        // Replace with new attachment URLs
        newAttachmentUrls = attachments;
      }

      // Validate dueDate if provided
      let dueDateObj = homework.dueDate;
      if (dueDate) {
        dueDateObj = new Date(dueDate);
        if (isNaN(dueDateObj.getTime())) {
          throw new ValidationError('Invalid dueDate format. Use ISO 8601 format');
        }
      }

      // Update homework
      const updated = await prisma.homework.update({
        where: { id },
        data: {
          subject: subject || homework.subject,
          title: title || homework.title,
          description: description || homework.description,
          dueDate: dueDateObj,
          status: status || homework.status,
          attachments: newAttachmentUrls.length > 0 ? (newAttachmentUrls as any) : null
        },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          class: {
            select: {
              id: true,
              name: true,
              section: true
            }
          }
        }
      });

      logger.info(`Homework ${id} updated by teacher ${teacherId}`);

      res.status(200).json({
        success: true,
        message: 'Homework updated successfully',
        data: {
          id: updated.id,
          classId: updated.classId,
          className: `${updated.class.name}${updated.class.section ? ` ${updated.class.section}` : ''}`,
          subject: updated.subject,
          title: updated.title,
          description: updated.description,
          dueDate: updated.dueDate.toISOString(),
          attachments: newAttachmentUrls,
          status: updated.status,
          teacher: {
            id: updated.teacher.id,
            name: updated.teacher.name
          },
          updatedAt: updated.updatedAt
        }
      });
    } catch (error) {
      logger.error('Error updating homework:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update homework', 500);
    }
  },

  /**
   * DELETE /api/homework/:id
   * Delete homework assignment
   */
  async deleteHomework(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const teacherId = req.user?.id;
      const schoolId = req.user?.schoolId;

      if (!teacherId) {
        throw new ForbiddenError('Teacher access required');
      }

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Find homework
      const homework = await prisma.homework.findFirst({
        where: { id },
        include: {
          class: {
            select: {
              schoolId: true
            }
          }
        }
      });

      if (!homework) {
        throw new NotFoundError('Homework not found');
      }

      // Verify school access and teacher ownership
      if (homework.class.schoolId !== schoolId) {
        throw new ForbiddenError('Access denied to this homework');
      }

      if (homework.teacherId !== teacherId) {
        throw new ForbiddenError('Only the creator can delete this homework');
      }

      // Delete attachments from S3 if any
      if (homework.attachments && Array.isArray(homework.attachments)) {
        try {
          await deleteMultipleFromS3(homework.attachments as string[]);
        } catch (deleteError) {
          logger.error('Error deleting files from S3:', deleteError);
          // Continue with homework deletion even if S3 deletion fails
        }
      }

      // Delete homework (cascade will delete submissions)
      await prisma.homework.delete({
        where: { id }
      });

      logger.info(`Homework ${id} deleted by teacher ${teacherId}`);

      res.status(200).json({
        success: true,
        message: 'Homework deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting homework:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete homework', 500);
    }
  },

  /**
   * POST /api/homework/:id/submit
   * Submit homework (student submission)
   */
  async submitHomework(req: AuthRequest, res: Response) {
    try {
      const { id: homeworkId } = req.params;
      const studentId = req.user?.id;
      const schoolId = req.user?.schoolId;

      if (!studentId) {
        throw new ForbiddenError('Student access required');
      }

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Verify user is a student
      const student = await prisma.user.findFirst({
        where: {
          id: studentId,
          role: 'STUDENT',
          schoolId: schoolId
        }
      });

      if (!student) {
        throw new ForbiddenError('Only students can submit homework');
      }

      // Find homework
      const homework = await prisma.homework.findFirst({
        where: { id: homeworkId },
        include: {
          class: {
            select: {
              schoolId: true
            }
          }
        }
      });

      if (!homework) {
        throw new NotFoundError('Homework not found');
      }

      // Verify school access
      if (homework.class.schoolId !== schoolId) {
        throw new ForbiddenError('Access denied to this homework');
      }

      // Check if submission already exists
      const existingSubmission = await prisma.homeworkSubmission.findFirst({
        where: {
          homeworkId: homeworkId,
          studentId: studentId
        }
      });

      // Handle file uploads if any
      let attachmentUrls: string[] = [];
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        try {
          attachmentUrls = await uploadMultipleToS3(req.files as Express.Multer.File[], 'homework/submissions');
        } catch (uploadError) {
          logger.error('Error uploading submission files:', uploadError);
          throw new AppError('Failed to upload submission attachments', 500);
        }
      } else if (req.body.attachments && Array.isArray(req.body.attachments)) {
        attachmentUrls = req.body.attachments;
      }

      // Determine submission status (late or submitted)
      const now = new Date();
      const isLate = now > homework.dueDate;
      const status = isLate ? 'late' : 'submitted';

      let submission;

      if (existingSubmission) {
        // Update existing submission
        // Delete old attachments from S3 if replacing
        if (existingSubmission.attachments && Array.isArray(existingSubmission.attachments)) {
          try {
            await deleteMultipleFromS3(existingSubmission.attachments as string[]);
          } catch (deleteError) {
            logger.error('Error deleting old submission files:', deleteError);
          }
        }

        submission = await prisma.homeworkSubmission.update({
          where: { id: existingSubmission.id },
          data: {
            status: status,
            submittedAt: now,
            attachments: attachmentUrls.length > 0 ? (attachmentUrls as any) : null
          },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            homework: {
              select: {
                id: true,
                title: true,
                dueDate: true
              }
            }
          }
        });
      } else {
        // Create new submission
        submission = await prisma.homeworkSubmission.create({
          data: {
            homeworkId: homeworkId,
            studentId: studentId,
            status: status,
            submittedAt: now,
            attachments: attachmentUrls.length > 0 ? (attachmentUrls as any) : null
          },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            homework: {
              select: {
                id: true,
                title: true,
                dueDate: true
              }
            }
          }
        });
      }

      logger.info(`Homework ${homeworkId} submitted by student ${studentId} (${status})`);

      res.status(existingSubmission ? 200 : 201).json({
        success: true,
        message: existingSubmission ? 'Submission updated' : 'Homework submitted successfully',
        data: {
          id: submission.id,
          homeworkId: submission.homeworkId,
          homeworkTitle: submission.homework.title,
          studentId: submission.studentId,
          studentName: submission.student.name,
          status: submission.status,
          submittedAt: submission.submittedAt?.toISOString(),
          attachments: attachmentUrls,
          isLate: isLate,
          dueDate: submission.homework.dueDate.toISOString()
        }
      });
    } catch (error) {
      logger.error('Error submitting homework:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to submit homework', 500);
    }
  },

  /**
   * GET /api/homework/:id/submissions
   * Get all submissions for a homework assignment
   */
  async getHomeworkSubmissions(req: AuthRequest, res: Response) {
    try {
      const { id: homeworkId } = req.params;
      const { status } = req.query;
      const teacherId = req.user?.id;
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Find homework
      const homework = await prisma.homework.findFirst({
        where: { id: homeworkId },
        include: {
          class: {
            select: {
              schoolId: true
            }
          }
        }
      });

      if (!homework) {
        throw new NotFoundError('Homework not found');
      }

      // Verify school access
      if (homework.class.schoolId !== schoolId) {
        throw new ForbiddenError('Access denied to this homework');
      }

      // Verify teacher access (only teacher who created or admin can view)
      if (teacherId && homework.teacherId !== teacherId) {
        const user = await prisma.user.findFirst({
          where: { id: teacherId, schoolId: schoolId }
        });
        if (!user || (user.role !== 'ADMIN' && user.role !== 'PRINCIPAL' && user.role !== 'SUPER_ADMIN')) {
          throw new ForbiddenError('Only the teacher who created this homework can view submissions');
        }
      }

      // Build filter
      const where: any = {
        homeworkId: homeworkId
      };

      if (status) {
        where.status = status;
      }

      // Get submissions
      const submissions = await prisma.homeworkSubmission.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              photo: true
            }
          }
        },
        orderBy: {
          submittedAt: 'desc'
        }
      });

      logger.info(`Retrieved ${submissions.length} submissions for homework ${homeworkId}`);

      res.status(200).json({
        success: true,
        data: {
          homeworkId: homeworkId,
          homeworkTitle: homework.title,
          dueDate: homework.dueDate.toISOString(),
          totalSubmissions: submissions.length,
          submissions: submissions.map(sub => ({
            id: sub.id,
            studentId: sub.studentId,
            studentName: sub.student.name,
            studentEmail: sub.student.email,
            studentPhoto: sub.student.photo,
            status: sub.status,
            submittedAt: sub.submittedAt?.toISOString(),
            attachments: sub.attachments || [],
            teacherRemarks: sub.teacherRemarks,
            grade: sub.grade,
            createdAt: sub.createdAt
          }))
        }
      });
    } catch (error) {
      logger.error('Error getting homework submissions:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve submissions', 500);
    }
  }
};

