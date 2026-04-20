import { Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { AppError, NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/notification.service';

/**
 * Marks Controller
 * Handles all marks-related operations with audit logging
 */

// Type definitions
interface CreateMarksBody {
  examId: string;
  studentId: string;
  marksObtained: number;
  remarks?: string;
}

interface UpdateMarksBody {
  marksObtained?: number;
  remarks?: string;
}

// MarksAuditLog interface - used in audit log details
// Type definition for audit trail structure

export const marksController = {
  /**
   * POST /api/marks
   * Enter marks for a student in an exam
   */
  async enterMarks(req: AuthRequest, res: Response) {
    try {
      const teacherId = req.user?.id;
      const schoolId = req.user?.schoolId;

      if (!teacherId) {
        throw new ForbiddenError('Teacher access required');
      }

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      const { examId, studentId, marksObtained, remarks } = req.body as CreateMarksBody;

      // Validate required fields
      if (!examId || !studentId || marksObtained === undefined) {
        throw new ValidationError('Missing required fields: examId, studentId, marksObtained');
      }

      // Validate marks
      if (typeof marksObtained !== 'number' || marksObtained < 0) {
        throw new ValidationError('marksObtained must be a non-negative number');
      }

      // Verify exam exists and belongs to teacher's school
      const exam = await prisma.exam.findFirst({
        where: {
          id: examId,
          class: {
            schoolId: schoolId
          }
        },
        include: {
          class: {
            include: {
              school: true
            }
          }
        }
      });

      if (!exam) {
        throw new NotFoundError('Exam not found');
      }

      // Validate marks don't exceed max marks
      if (marksObtained > exam.maxMarks) {
        throw new ValidationError(`Marks obtained (${marksObtained}) cannot exceed maximum marks (${exam.maxMarks})`);
      }

      // Verify student exists and belongs to the same school
      const student = await prisma.user.findFirst({
        where: {
          id: studentId,
          role: 'STUDENT',
          schoolId: schoolId
        }
      });

      if (!student) {
        throw new NotFoundError('Student not found');
      }

      // Check if marks already exist for this exam-student combination
      const existingMarks = await prisma.marks.findUnique({
        where: {
          examId_studentId: {
            examId: examId,
            studentId: studentId
          }
        }
      });

      if (existingMarks) {
        throw new ValidationError('Marks already entered for this student in this exam. Use PUT to update.');
      }

      // Create marks entry
      const marks = await prisma.marks.create({
        data: {
          examId: examId,
          studentId: studentId,
          teacherId: teacherId,
          marksObtained: marksObtained,
          remarks: remarks || null
        },
        include: {
          exam: {
            select: {
              id: true,
              name: true,
              subject: true,
              examType: true,
              maxMarks: true,
              passingMarks: true,
              date: true
            }
          },
          teacher: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Create audit log
      await prisma.activityLog.create({
        data: {
          userId: teacherId,
          action: 'MARKS_ENTERED',
          resource: 'Marks',
          resourceId: marks.id,
          details: {
            examId: examId,
            examName: exam.name,
            studentId: studentId,
            studentName: student.name,
            marksObtained: marksObtained,
            maxMarks: exam.maxMarks,
            passingMarks: exam.passingMarks,
            remarks: remarks || null,
            auditLog: {
              action: 'MARKS_ENTERED',
              newValue: {
                marksObtained: marksObtained,
                remarks: remarks || null
              },
              changedBy: teacherId,
              changedAt: new Date()
            }
          } as any
        }
      });

      logger.info(`Marks entered: ${marks.id} for student ${studentId} in exam ${examId} by teacher ${teacherId}`);

      // Send notification to parent
      await NotificationService.notifyMarksEntered(
        studentId,
        exam.name,
        exam.subject,
        marksObtained,
        exam.maxMarks
      );

      res.status(201).json({
        success: true,
        message: 'Marks entered successfully',
        data: {
          id: marks.id,
          examId: marks.examId,
          studentId: marks.studentId,
          marksObtained: marks.marksObtained,
          remarks: marks.remarks,
          enteredAt: marks.enteredAt,
          exam: marks.exam,
          teacher: marks.teacher,
          status: marks.marksObtained >= exam.passingMarks ? 'PASS' : 'FAIL'
        }
      });
    } catch (error) {
      logger.error('Error entering marks:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  },

  /**
   * PUT /api/marks/:id
   * Update marks with audit trail
   */
  async updateMarks(req: AuthRequest, res: Response) {
    try {
      const teacherId = req.user?.id;
      const schoolId = req.user?.schoolId;
      const { id } = req.params;

      if (!teacherId) {
        throw new ForbiddenError('Teacher access required');
      }

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      const { marksObtained, remarks } = req.body as UpdateMarksBody;

      // Find existing marks
      const existingMarks = await prisma.marks.findUnique({
        where: { id },
        include: {
          exam: {
            include: {
              class: {
                include: {
                  school: true
                }
              }
            }
          },
          teacher: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!existingMarks) {
        throw new NotFoundError('Marks record not found');
      }

      // Verify marks belong to teacher's school
      if (existingMarks.exam.class.schoolId !== schoolId) {
        throw new ForbiddenError('Access denied: Marks do not belong to your school');
      }

      // Verify teacher has permission (either the original teacher or admin)
      if (existingMarks.teacherId !== teacherId && req.user?.role !== 'ADMIN' && req.user?.role !== 'PRINCIPAL') {
        throw new ForbiddenError('You can only update marks you entered');
      }

      // Store old values for audit
      const oldValue = {
        marksObtained: existingMarks.marksObtained,
        remarks: existingMarks.remarks || undefined
      };

      // Validate marks if provided
      if (marksObtained !== undefined) {
        if (typeof marksObtained !== 'number' || marksObtained < 0) {
          throw new ValidationError('marksObtained must be a non-negative number');
        }

        if (marksObtained > existingMarks.exam.maxMarks) {
          throw new ValidationError(`Marks obtained (${marksObtained}) cannot exceed maximum marks (${existingMarks.exam.maxMarks})`);
        }
      }

      // Prepare update data
      const updateData: {
        marksObtained?: number;
        remarks?: string | null;
      } = {};

      if (marksObtained !== undefined) {
        updateData.marksObtained = marksObtained;
      }

      if (remarks !== undefined) {
        updateData.remarks = remarks || null;
      }

      // Update marks
      const updatedMarks = await prisma.marks.update({
        where: { id },
        data: updateData,
        include: {
          exam: {
            select: {
              id: true,
              name: true,
              subject: true,
              examType: true,
              maxMarks: true,
              passingMarks: true,
              date: true
            }
          },
          teacher: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Create audit log with old and new values
      await prisma.activityLog.create({
        data: {
          userId: teacherId,
          action: 'MARKS_UPDATED',
          resource: 'Marks',
          resourceId: id,
          details: {
            examId: existingMarks.examId,
            examName: existingMarks.exam.name,
            studentId: existingMarks.studentId,
            oldValue: oldValue,
            newValue: {
              marksObtained: updatedMarks.marksObtained,
              remarks: updatedMarks.remarks || null
            },
            auditLog: {
              action: 'MARKS_UPDATED',
              oldValue: oldValue,
              newValue: {
                marksObtained: updatedMarks.marksObtained,
                remarks: updatedMarks.remarks || null
              },
              changedBy: teacherId,
              changedAt: new Date()
            }
          } as any
        }
      });

      logger.info(`Marks updated: ${id} by teacher ${teacherId}. Old: ${oldValue.marksObtained}, New: ${updatedMarks.marksObtained}`);

      res.json({
        success: true,
        message: 'Marks updated successfully',
        data: {
          id: updatedMarks.id,
          examId: updatedMarks.examId,
          studentId: updatedMarks.studentId,
          marksObtained: updatedMarks.marksObtained,
          remarks: updatedMarks.remarks,
          enteredAt: updatedMarks.enteredAt,
          exam: updatedMarks.exam,
          teacher: updatedMarks.teacher,
          status: updatedMarks.marksObtained >= updatedMarks.exam.passingMarks ? 'PASS' : 'FAIL',
          auditTrail: {
            oldValue: oldValue,
            newValue: {
              marksObtained: updatedMarks.marksObtained,
              remarks: updatedMarks.remarks || null
            },
            changedBy: teacherId,
            changedAt: new Date()
          }
        }
      });
    } catch (error) {
      logger.error('Error updating marks:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  },

  /**
   * GET /api/marks/:examId
   * Get all marks for an exam
   */
  async getExamMarks(req: AuthRequest, res: Response) {
    try {
      const { examId } = req.params;
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Verify exam exists and belongs to user's school
      const exam = await prisma.exam.findFirst({
        where: {
          id: examId,
          class: {
            schoolId: schoolId
          }
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              section: true
            }
          }
        }
      });

      if (!exam) {
        throw new NotFoundError('Exam not found');
      }

      // Get all marks for this exam
      const marks = await prisma.marks.findMany({
        where: {
          examId: examId
        },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          enteredAt: 'desc'
        }
      });

      // Get student details for each mark
      const marksWithStudents = await Promise.all(
        marks.map(async (mark) => {
          const student = await prisma.user.findUnique({
            where: { id: mark.studentId },
            select: {
              id: true,
              name: true,
              email: true,
              photo: true
            }
          });

          return {
            id: mark.id,
            studentId: mark.studentId,
            student: student,
            marksObtained: mark.marksObtained,
            remarks: mark.remarks,
            enteredAt: mark.enteredAt,
            teacher: mark.teacher,
            status: mark.marksObtained >= exam.passingMarks ? 'PASS' : 'FAIL',
            percentage: ((mark.marksObtained / exam.maxMarks) * 100).toFixed(2)
          };
        })
      );

      logger.info(`Retrieved ${marks.length} marks for exam ${examId}`);

      res.json({
        success: true,
        message: 'Marks retrieved successfully',
        data: {
          exam: {
            id: exam.id,
            name: exam.name,
            subject: exam.subject,
            examType: exam.examType,
            date: exam.date,
            maxMarks: exam.maxMarks,
            passingMarks: exam.passingMarks,
            class: exam.class
          },
          marks: marksWithStudents,
          statistics: {
            totalStudents: marks.length,
            passed: marks.filter(m => m.marksObtained >= exam.passingMarks).length,
            failed: marks.filter(m => m.marksObtained < exam.passingMarks).length,
            averageMarks: marks.length > 0
              ? (marks.reduce((acc, m) => acc + m.marksObtained, 0) / marks.length).toFixed(2)
              : 0,
            highestMarks: marks.length > 0 ? Math.max(...marks.map(m => m.marksObtained)) : 0,
            lowestMarks: marks.length > 0 ? Math.min(...marks.map(m => m.marksObtained)) : 0
          }
        }
      });
    } catch (error) {
      logger.error('Error retrieving exam marks:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  },

  /**
   * GET /api/marks/student/:studentId
   * Get all marks for a student
   */
  async getStudentMarks(req: AuthRequest, res: Response) {
    try {
      const { studentId } = req.params;
      const schoolId = req.user?.schoolId;
      const { examId, subject } = req.query;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Verify student exists and belongs to user's school
      const student = await prisma.user.findFirst({
        where: {
          id: studentId,
          role: 'STUDENT',
          schoolId: schoolId
        }
      });

      if (!student) {
        throw new NotFoundError('Student not found');
      }

      // Build where clause
      const whereClause: any = {
        studentId: studentId
      };

      if (examId) {
        whereClause.examId = examId;
      }

      if (subject) {
        whereClause.exam = {
          subject: subject as string
        };
      }

      // Get all marks for this student
      const marks = await prisma.marks.findMany({
        where: whereClause,
        include: {
          exam: {
            select: {
              id: true,
              name: true,
              subject: true,
              examType: true,
              date: true,
              maxMarks: true,
              passingMarks: true,
              class: {
                select: {
                  id: true,
                  name: true,
                  section: true
                }
              }
            }
          },
          teacher: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          exam: {
            date: 'desc'
          }
        }
      });

      // Format marks with additional data
      const formattedMarks = marks.map(mark => ({
        id: mark.id,
        examId: mark.examId,
        exam: mark.exam,
        marksObtained: mark.marksObtained,
        maxMarks: mark.exam.maxMarks,
        percentage: ((mark.marksObtained / mark.exam.maxMarks) * 100).toFixed(2),
        remarks: mark.remarks,
        enteredAt: mark.enteredAt,
        teacher: mark.teacher,
        status: mark.marksObtained >= mark.exam.passingMarks ? 'PASS' : 'FAIL'
      }));

      // Calculate statistics
      const statistics = {
        totalExams: marks.length,
        passed: marks.filter(m => m.marksObtained >= m.exam.passingMarks).length,
        failed: marks.filter(m => m.marksObtained < m.exam.passingMarks).length,
        averageMarks: marks.length > 0
          ? (marks.reduce((acc, m) => acc + m.marksObtained, 0) / marks.length).toFixed(2)
          : 0,
        averagePercentage: marks.length > 0
          ? (marks.reduce((acc, m) => acc + (m.marksObtained / m.exam.maxMarks) * 100, 0) / marks.length).toFixed(2)
          : 0,
        highestMarks: marks.length > 0 ? Math.max(...marks.map(m => m.marksObtained)) : 0,
        lowestMarks: marks.length > 0 ? Math.min(...marks.map(m => m.marksObtained)) : 0
      };

      logger.info(`Retrieved ${marks.length} marks for student ${studentId}`);

      res.json({
        success: true,
        message: 'Student marks retrieved successfully',
        data: {
          student: {
            id: student.id,
            name: student.name,
            email: student.email,
            photo: student.photo
          },
          marks: formattedMarks,
          statistics: statistics
        }
      });
    } catch (error) {
      logger.error('Error retrieving student marks:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  }
};

