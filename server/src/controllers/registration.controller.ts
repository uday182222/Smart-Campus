import { Response } from 'express';
import { PrismaClient, UserRole, UserStatus, RegistrationStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const registrationController = {
  /** POST /registration/request — PUBLIC. Submit a registration request. */
  async submitRequest(req: AuthRequest, res: Response) {
    const { schoolCode, studentName, classId, parentName, parentEmail, parentPhone, password } = req.body;
    if (!schoolCode || !studentName || !classId || !parentName || !parentEmail || !parentPhone || !password) {
      throw new AppError('Missing required fields: schoolCode, studentName, classId, parentName, parentEmail, parentPhone, password', 400);
    }
    const school = await prisma.school.findUnique({
      where: { schoolCode }
    });
    if (!school || !school.isActive) {
      return res.status(404).json({ success: false, message: 'Invalid school code' });
    }
    if (!school.registrationOpen) {
      return res.status(403).json({ success: false, message: 'Registration is closed for this school' });
    }
    const schoolClass = await prisma.class.findFirst({
      where: { id: classId, schoolId: school.id }
    });
    if (!schoolClass) {
      return res.status(400).json({ success: false, message: 'Invalid class selected' });
    }
    const existing = await prisma.registrationRequest.findFirst({
      where: {
        schoolId: school.id,
        parentEmail: parentEmail.trim().toLowerCase(),
        status: RegistrationStatus.PENDING
      }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A pending request for this email already exists for this school.' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.registrationRequest.create({
      data: {
        schoolId: school.id,
        classId: schoolClass.id,
        studentName: studentName.trim(),
        className: `${schoolClass.name} ${schoolClass.section || ''}`.trim(),
        parentName: parentName.trim(),
        parentEmail: parentEmail.trim().toLowerCase(),
        parentPhone: (parentPhone || '').trim(),
        password: hashedPassword,
        status: RegistrationStatus.PENDING
      }
    });
    logger.info(`Registration request submitted for ${parentEmail} at school ${school.id}`);
    return res.status(201).json({ success: true, message: 'Request submitted. You will be notified when approved.' });
  },

  /** GET /registration/requests — ADMIN/PRINCIPAL. List PENDING requests for admin's school. */
  async getPendingRequests(req: AuthRequest, res: Response) {
    const schoolId = req.user!.schoolId;
    if (!schoolId) throw new AppError('School access required', 403);
    const requests = await prisma.registrationRequest.findMany({
      where: { schoolId, status: RegistrationStatus.PENDING },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        studentName: true,
        className: true,
        parentName: true,
        parentEmail: true,
        parentPhone: true,
        createdAt: true
      }
    });
    return res.json({ success: true, data: requests });
  },

  /** GET /registration/requests/:id — ADMIN/PRINCIPAL. Full detail for one request. */
  async getRequestDetail(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;
    if (!schoolId) throw new AppError('School access required', 403);
    const request = await prisma.registrationRequest.findUnique({
      where: { id },
      include: { school: { select: { name: true } } }
    });
    if (!request || request.schoolId !== schoolId) {
      throw new AppError('Request not found', 404);
    }
    return res.json({ success: true, data: request });
  },

  /** POST /registration/requests/:id/approve — ADMIN/PRINCIPAL. Create parent + student, link, mark approved. */
  async approveRequest(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;
    if (!schoolId) throw new AppError('School access required', 403);
    const request = await prisma.registrationRequest.findUnique({
      where: { id }
    });
    if (!request || request.schoolId !== schoolId) {
      throw new AppError('Request not found', 404);
    }
    if (request.status !== RegistrationStatus.PENDING) {
      throw new AppError('Request is not pending', 400);
    }
    const existingUser = await prisma.user.findUnique({
      where: { email: request.parentEmail }
    });
    if (existingUser) {
      throw new AppError('A user with this email already exists. Reject the request or use a different flow.', 400);
    }
    const parent = await prisma.user.create({
      data: {
        name: request.parentName,
        email: request.parentEmail,
        phone: request.parentPhone || null,
        password: request.password,
        role: UserRole.PARENT,
        schoolId: request.schoolId,
        status: UserStatus.ACTIVE
      }
    });
    const student = await prisma.user.create({
      data: {
        name: request.studentName,
        email: `${request.parentEmail}+student-${request.id.slice(0, 8)}@smartcampus.local`,
        metadata: request.classId
          ? { ...(request as any).metadata, classId: request.classId }
          : undefined,
        role: UserRole.STUDENT,
        schoolId: request.schoolId,
        status: UserStatus.ACTIVE
      }
    });
    await prisma.parentStudent.create({
      data: {
        parentId: parent.id,
        studentId: student.id,
        relationship: 'parent',
        isPrimary: true
      }
    });
    await prisma.registrationRequest.update({
      where: { id },
      data: {
        status: RegistrationStatus.APPROVED,
        reviewedBy: req.user!.id,
        reviewedAt: new Date()
      }
    });
    await prisma.notification.create({
      data: {
        userId: parent.id,
        category: 'registration',
        title: 'Registration approved',
        body: `Your registration for ${request.studentName} has been approved. You can now log in.`,
        channels: { inApp: true },
        priority: 'normal',
        status: 'pending'
      }
    });
    logger.info(`Registration approved: ${id}, parent ${parent.id}, student ${student.id}`);
    return res.json({ success: true, message: 'Registration approved. Parent and student accounts created.' });
  },

  /** POST /registration/requests/:id/reject — ADMIN/PRINCIPAL. Body: { reason } */
  async rejectRequest(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { reason } = req.body;
    const schoolId = req.user!.schoolId;
    if (!schoolId) throw new AppError('School access required', 403);
    const request = await prisma.registrationRequest.findUnique({
      where: { id }
    });
    if (!request || request.schoolId !== schoolId) {
      throw new AppError('Request not found', 404);
    }
    if (request.status !== RegistrationStatus.PENDING) {
      throw new AppError('Request is not pending', 400);
    }
    await prisma.registrationRequest.update({
      where: { id },
      data: {
        status: RegistrationStatus.REJECTED,
        adminNote: reason != null ? String(reason) : null,
        reviewedBy: req.user!.id,
        reviewedAt: new Date()
      }
    });
    logger.info(`Registration rejected: ${id}`);
    return res.json({ success: true, message: 'Registration rejected.' });
  },

  /** GET /registration/status/:email/:schoolCode — PUBLIC. Check status of a request. */
  async getRequestStatus(req: AuthRequest, res: Response) {
    const { email, schoolCode } = req.params;
    if (!email || !schoolCode) {
      throw new AppError('email and schoolCode required', 400);
    }
    const school = await prisma.school.findUnique({
      where: { schoolCode }
    });
    if (!school) {
      return res.status(404).json({ success: false, message: 'Invalid school code' });
    }
    const request = await prisma.registrationRequest.findFirst({
      where: {
        schoolId: school.id,
        parentEmail: email.trim().toLowerCase()
      },
      orderBy: { createdAt: 'desc' }
    });
    if (!request) {
      return res.json({ success: true, data: { status: null, adminNote: null } });
    }
    return res.json({
      success: true,
      data: {
        status: request.status,
        adminNote: request.adminNote ?? undefined
      }
    });
  }
};
