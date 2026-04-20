import { Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { AppError, NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/notification.service';

/**
 * Attendance Controller
 * Handles all attendance-related operations
 */

// Type definitions
interface MarkAttendanceBody {
  classId: string;
  studentId: string;
  date: string; // ISO date string
  status: 'present' | 'absent' | 'late' | 'half_day';
  remarks?: string;
}

interface BulkAttendanceBody {
  classId: string;
  date: string;
  attendance: Array<{
    studentId: string;
    status: 'present' | 'absent' | 'late' | 'half_day';
    remarks?: string;
  }>;
}

export const attendanceController = {
  /**
   * GET /api/attendance/:classId/:date
   * Get attendance for a specific class on a specific date
   */
  async getClassAttendance(req: AuthRequest, res: Response) {
    try {
      const { classId, date } = req.params;
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Validate date format
      const attendanceDate = new Date(date);
      if (isNaN(attendanceDate.getTime())) {
        throw new ValidationError('Invalid date format. Use YYYY-MM-DD');
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

      // Get all attendance records for this class and date
      const attendanceRecords = await prisma.attendance.findMany({
        where: {
          classId: classId,
          date: attendanceDate
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              photo: true
            }
          },
          class: {
            select: {
              id: true,
              name: true,
              section: true
            }
          }
        },
        orderBy: {
          student: {
            name: 'asc'
          }
        }
      });

      // Get all students in the school
      const allStudentsInSchool = await prisma.user.findMany({
        where: {
          role: 'STUDENT',
          schoolId: schoolId
        },
        select: {
          id: true,
          name: true,
          email: true,
          photo: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      // For MVP: Use all students in school (in production, you'd have a StudentClass junction table)
      const allStudents = allStudentsInSchool;

      // Create a map of students with attendance
      const attendanceMap = new Map(
        attendanceRecords.map(record => [record.studentId, record])
      );

      // Combine all students with their attendance status
      const result = allStudents.map(student => {
        const attendance = attendanceMap.get(student.id);
        return {
          id: attendance?.id || null,
          studentId: student.id,
          studentName: student.name,
          studentEmail: student.email,
          studentPhoto: student.photo,
          classId: classId,
          className: `${classRecord.name}${classRecord.section ? ` ${classRecord.section}` : ''}`,
          date: attendanceDate.toISOString().split('T')[0],
          status: attendance?.status || null,
          remarks: attendance?.remarks || null,
          markedBy: attendance?.teacherId || null,
          markedAt: attendance?.markedAt || null
        };
      });

      logger.info(`Retrieved attendance for class ${classId} on ${date}`);

      res.status(200).json({
        success: true,
        data: {
          classId: classId,
          className: `${classRecord.name}${classRecord.section ? ` ${classRecord.section}` : ''}`,
          date: attendanceDate.toISOString().split('T')[0],
          attendance: result,
          summary: {
            total: allStudents.length,
            present: attendanceRecords.filter(a => a.status === 'present').length,
            absent: attendanceRecords.filter(a => a.status === 'absent').length,
            late: attendanceRecords.filter(a => a.status === 'late').length,
            halfDay: attendanceRecords.filter(a => a.status === 'half_day').length,
            notMarked: allStudents.length - attendanceRecords.length
          }
        }
      });
    } catch (error) {
      logger.error('Error getting class attendance:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve attendance', 500);
    }
  },

  /**
   * POST /api/attendance
   * Mark attendance for one or multiple students
   */
  async markAttendance(req: AuthRequest, res: Response) {
    try {
      const teacherId = req.user?.id;
      const schoolId = req.user?.schoolId;

      if (!teacherId) {
        throw new ForbiddenError('Teacher access required');
      }

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      const body = req.body as MarkAttendanceBody | BulkAttendanceBody;

      // Check if it's bulk attendance
      if ('attendance' in body && Array.isArray(body.attendance)) {
        // Bulk attendance
        const { classId, date, attendance: attendanceList } = body as BulkAttendanceBody;

        // Validate date
        const attendanceDate = new Date(date);
        if (isNaN(attendanceDate.getTime())) {
          throw new ValidationError('Invalid date format. Use YYYY-MM-DD');
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

        // Process bulk attendance
        const results = await Promise.all(
          attendanceList.map(async (item) => {
            try {
              // Check if attendance already exists
              const existing = await prisma.attendance.findFirst({
                where: {
                  studentId: item.studentId,
                  date: attendanceDate
                }
              });

              if (existing) {
                // Update existing attendance
                const updated = await prisma.attendance.update({
                  where: { id: existing.id },
                  data: {
                    status: item.status,
                    remarks: item.remarks || null,
                    teacherId: teacherId,
                    markedAt: new Date()
                  },
                  include: {
                    student: {
                      select: {
                        id: true,
                        name: true
                      }
                    }
                  }
                });

                return {
                  studentId: item.studentId,
                  studentName: updated.student.name,
                  status: 'updated',
                  attendance: updated
                };
              } else {
                // Create new attendance
                const created = await prisma.attendance.create({
                  data: {
                    classId: classId,
                    studentId: item.studentId,
                    teacherId: teacherId,
                    date: attendanceDate,
                    status: item.status,
                    remarks: item.remarks || null
                  },
                  include: {
                    student: {
                      select: {
                        id: true,
                        name: true
                      }
                    }
                  }
                });

                return {
                  studentId: item.studentId,
                  studentName: created.student.name,
                  status: 'created',
                  attendance: created
                };
              }
            } catch (error) {
              logger.error(`Error marking attendance for student ${item.studentId}:`, error);
              return {
                studentId: item.studentId,
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
              };
            }
          })
        );

        logger.info(`Bulk attendance marked for class ${classId} on ${date} by teacher ${teacherId}`);

        // Send notifications for each attendance marked
        for (const result of results) {
          if (result.status === 'created' || result.status === 'updated') {
            const attendance = result.attendance;
            if (attendance) {
              await NotificationService.notifyAttendanceMarked(
                attendance.studentId,
                attendance.status,
                attendanceDate.toISOString().split('T')[0]
              );
            }
          }
        }

        res.status(200).json({
          success: true,
          message: `Attendance marked for ${results.filter(r => r.status !== 'error').length} students`,
          data: {
            classId: classId,
            date: attendanceDate.toISOString().split('T')[0],
            results: results
          }
        });
      } else {
        // Single attendance
        const { classId, studentId, date, status, remarks } = body as MarkAttendanceBody;

        // Validate inputs
        if (!classId || !studentId || !date || !status) {
          throw new ValidationError('Missing required fields: classId, studentId, date, status');
        }

        const validStatuses = ['present', 'absent', 'late', 'half_day'];
        if (!validStatuses.includes(status)) {
          throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        // Validate date
        const attendanceDate = new Date(date);
        if (isNaN(attendanceDate.getTime())) {
          throw new ValidationError('Invalid date format. Use YYYY-MM-DD');
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

        // Verify student exists and belongs to school
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

        // Check if attendance already exists
        const existing = await prisma.attendance.findFirst({
          where: {
            studentId: studentId,
            date: attendanceDate
          }
        });

        let attendance;

        if (existing) {
          // Update existing attendance
          attendance = await prisma.attendance.update({
            where: { id: existing.id },
            data: {
              status: status,
              remarks: remarks || null,
              teacherId: teacherId,
              markedAt: new Date()
            },
            include: {
              student: {
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
        } else {
          // Create new attendance
          attendance = await prisma.attendance.create({
            data: {
              classId: classId,
              studentId: studentId,
              teacherId: teacherId,
              date: attendanceDate,
              status: status,
              remarks: remarks || null
            },
            include: {
              student: {
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
        }

        logger.info(`Attendance marked for student ${studentId} on ${date} by teacher ${teacherId}`);

        // Send notification to parent
        await NotificationService.notifyAttendanceMarked(
          studentId,
          attendance.status,
          attendanceDate.toISOString().split('T')[0]
        );

        res.status(existing ? 200 : 201).json({
          success: true,
          message: existing ? 'Attendance updated' : 'Attendance marked',
          data: {
            id: attendance.id,
            studentId: attendance.studentId,
            studentName: attendance.student.name,
            classId: attendance.classId,
            className: `${attendance.class.name}${attendance.class.section ? ` ${attendance.class.section}` : ''}`,
            date: attendance.date.toISOString().split('T')[0],
            status: attendance.status,
            remarks: attendance.remarks,
            markedBy: attendance.teacherId,
            markedAt: attendance.markedAt
          }
        });
      }
    } catch (error) {
      logger.error('Error marking attendance:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to mark attendance', 500);
    }
  },

  /**
   * PUT /api/attendance/:id
   * Edit existing attendance record
   */
  async editAttendance(req: AuthRequest, res: Response) {
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

      const { status, remarks } = req.body;

      // Validate status if provided
      if (status) {
        const validStatuses = ['present', 'absent', 'late', 'half_day'];
        if (!validStatuses.includes(status)) {
          throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }
      }

      // Find attendance record
      const attendance = await prisma.attendance.findFirst({
        where: { id },
        include: {
          class: {
            select: {
              schoolId: true
            }
          }
        }
      });

      if (!attendance) {
        throw new NotFoundError('Attendance record not found');
      }

      // Verify school access
      if (attendance.class.schoolId !== schoolId) {
        throw new ForbiddenError('Access denied to this attendance record');
      }

      // Check if editing is allowed (e.g., within 7 days)
      const daysSinceMarked = Math.floor(
        (Date.now() - attendance.markedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceMarked > 7) {
        throw new ForbiddenError('Attendance can only be edited within 7 days');
      }

      // Update attendance
      const updated = await prisma.attendance.update({
        where: { id },
        data: {
          status: status || attendance.status,
          remarks: remarks !== undefined ? remarks : attendance.remarks,
          teacherId: teacherId,
          markedAt: new Date()
        },
        include: {
          student: {
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

      logger.info(`Attendance ${id} edited by teacher ${teacherId}`);

      res.status(200).json({
        success: true,
        message: 'Attendance updated successfully',
        data: {
          id: updated.id,
          studentId: updated.studentId,
          studentName: updated.student.name,
          classId: updated.classId,
          className: `${updated.class.name}${updated.class.section ? ` ${updated.class.section}` : ''}`,
          date: updated.date.toISOString().split('T')[0],
          status: updated.status,
          remarks: updated.remarks,
          markedBy: updated.teacherId,
          markedAt: updated.markedAt
        }
      });
    } catch (error) {
      logger.error('Error editing attendance:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to edit attendance', 500);
    }
  },

  /**
   * GET /api/attendance/history/:studentId
   * Get attendance history for a specific student
   */
  async getStudentHistory(req: AuthRequest, res: Response) {
    try {
      const { studentId } = req.params;
      const { startDate, endDate, limit = 100 } = req.query;
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Verify student exists and belongs to school
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

      // Build date filter
      const dateFilter: any = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate as string);
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate as string);
      }

      // Get attendance history
      const attendanceHistory = await prisma.attendance.findMany({
        where: {
          studentId: studentId,
          ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              section: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        },
        take: Number(limit)
      });

      // Calculate statistics
      const total = attendanceHistory.length;
      const present = attendanceHistory.filter(a => a.status === 'present').length;
      const absent = attendanceHistory.filter(a => a.status === 'absent').length;
      const late = attendanceHistory.filter(a => a.status === 'late').length;
      const halfDay = attendanceHistory.filter(a => a.status === 'half_day').length;
      const attendancePercentage = total > 0 ? ((present + late + halfDay) / total) * 100 : 0;

      logger.info(`Retrieved attendance history for student ${studentId}`);

      res.status(200).json({
        success: true,
        data: {
          studentId: studentId,
          studentName: student.name,
          history: attendanceHistory.map(record => ({
            id: record.id,
            classId: record.classId,
            className: `${record.class.name}${record.class.section ? ` ${record.class.section}` : ''}`,
            date: record.date.toISOString().split('T')[0],
            status: record.status,
            remarks: record.remarks,
            markedBy: record.teacherId,
            markedAt: record.markedAt
          })),
          statistics: {
            total: total,
            present: present,
            absent: absent,
            late: late,
            halfDay: halfDay,
            attendancePercentage: Math.round(attendancePercentage * 100) / 100
          }
        }
      });
    } catch (error) {
      logger.error('Error getting student attendance history:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve attendance history', 500);
    }
  },

  /**
   * GET /api/attendance/analytics/:classId
   * Get attendance analytics for a class
   */
  async getClassAnalytics(req: AuthRequest, res: Response) {
    try {
      const { classId } = req.params;
      const { startDate, endDate } = req.query;
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        throw new ForbiddenError('School access required');
      }

      // Verify class exists
      const classRecord = await prisma.class.findFirst({
        where: {
          id: classId,
          schoolId: schoolId
        },
        include: {
          teachers: {
            include: {
              teacher: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      if (!classRecord) {
        throw new NotFoundError('Class not found');
      }

      // Build date filter
      const dateFilter: any = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate as string);
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate as string);
      } else {
        // Default to last 30 days if no end date
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        dateFilter.gte = start;
        dateFilter.lte = end;
      }

      // Get all attendance records for the class
      const attendanceRecords = await prisma.attendance.findMany({
        where: {
          classId: classId,
          date: dateFilter
        },
        include: {
          student: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Get all students in the school (for analytics)
      // In production, you'd filter by class through a StudentClass junction table
      const students = await prisma.user.findMany({
        where: {
          role: 'STUDENT',
          schoolId: schoolId
        },
        select: {
          id: true,
          name: true
        }
      });

      // Calculate student-wise statistics
      const studentStats = students.map(student => {
        const studentRecords = attendanceRecords.filter(r => r.studentId === student.id);
        const total = studentRecords.length;
        const present = studentRecords.filter(r => r.status === 'present').length;
        const absent = studentRecords.filter(r => r.status === 'absent').length;
        const late = studentRecords.filter(r => r.status === 'late').length;
        const halfDay = studentRecords.filter(r => r.status === 'half_day').length;
        const percentage = total > 0 ? ((present + late + halfDay) / total * 100) : 0;

        return {
          studentId: student.id,
          studentName: student.name,
          total: total,
          present: present,
          absent: absent,
          late: late,
          halfDay: halfDay,
          attendancePercentage: Math.round(percentage * 100) / 100
        };
      });

      // Calculate class-wide statistics
      const totalRecords = attendanceRecords.length;
      const totalPresent = attendanceRecords.filter(r => r.status === 'present').length;
      const totalAbsent = attendanceRecords.filter(r => r.status === 'absent').length;
      const totalLate = attendanceRecords.filter(r => r.status === 'late').length;
      const totalHalfDay = attendanceRecords.filter(r => r.status === 'half_day').length;
      const classAttendancePercentage = totalRecords > 0
        ? ((totalPresent + totalLate + totalHalfDay) / totalRecords * 100)
        : 0;

      // Get daily attendance trend
      const dailyTrend = attendanceRecords.reduce((acc, record) => {
        const dateKey = record.date.toISOString().split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = { present: 0, absent: 0, late: 0, halfDay: 0, total: 0 };
        }
        const status = record.status as 'present' | 'absent' | 'late' | 'half_day';
        if (status === 'present') acc[dateKey].present++;
        else if (status === 'absent') acc[dateKey].absent++;
        else if (status === 'late') acc[dateKey].late++;
        else if (status === 'half_day') acc[dateKey].halfDay++;
        acc[dateKey].total++;
        return acc;
      }, {} as Record<string, { present: number; absent: number; late: number; halfDay: number; total: number }>);

      // Convert to array and calculate percentages
      const dailyTrendArray = Object.entries(dailyTrend).map(([date, stats]) => ({
        date,
        present: stats.present,
        absent: stats.absent,
        late: stats.late,
        halfDay: stats.halfDay,
        total: stats.total,
        attendancePercentage: stats.total > 0
          ? Math.round(((stats.present + stats.late + stats.halfDay) / stats.total) * 100 * 100) / 100
          : 0
      })).sort((a, b) => a.date.localeCompare(b.date));

      // Find students with low attendance (<75%)
      const lowAttendanceStudents = studentStats.filter(
        s => s.attendancePercentage < 75 && s.total > 0
      );

      logger.info(`Retrieved attendance analytics for class ${classId}`);

      res.status(200).json({
        success: true,
        data: {
          classId: classId,
          className: `${classRecord.name}${classRecord.section ? ` ${classRecord.section}` : ''}`,
          period: {
            startDate: dateFilter.gte?.toISOString().split('T')[0] || null,
            endDate: dateFilter.lte?.toISOString().split('T')[0] || null
          },
          classStatistics: {
            totalStudents: students.length,
            totalRecords: totalRecords,
            present: totalPresent,
            absent: totalAbsent,
            late: totalLate,
            halfDay: totalHalfDay,
            attendancePercentage: Math.round(classAttendancePercentage * 100) / 100
          },
          studentStatistics: studentStats.sort((a, b) => b.attendancePercentage - a.attendancePercentage),
          dailyTrend: dailyTrendArray,
          lowAttendanceStudents: lowAttendanceStudents.map(s => ({
            studentId: s.studentId,
            studentName: s.studentName,
            attendancePercentage: s.attendancePercentage,
            totalAbsent: s.absent
          }))
        }
      });
    } catch (error) {
      logger.error('Error getting class attendance analytics:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve attendance analytics', 500);
    }
  }
};

