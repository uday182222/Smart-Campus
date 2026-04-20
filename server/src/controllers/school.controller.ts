import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { generateUniqueSchoolCode } from '../utils/schoolCode';
import { uploadToS3 } from '../middleware/s3Upload';

const prisma = new PrismaClient();

export const schoolController = {
  /** GET /schools — list all schools (SUPER_ADMIN only) */
  async list(_req: AuthRequest, res: Response) {
    const schools = await prisma.school.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { users: true, classes: true } }
      }
    });
    return res.json({ success: true, data: { schools } });
  },

  /** GET /schools/:id — get one school */
  async getOne(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, classes: true } }
      }
    });
    if (!school) throw new AppError('School not found', 404);
    return res.json({ success: true, data: { school } });
  },

  /** POST /schools — create school (SUPER_ADMIN only). schoolCode is always generated server-side. */
  async create(req: AuthRequest, res: Response) {
    const body = req.body;
    const schoolCode = await generateUniqueSchoolCode(prisma);
    const school = await prisma.school.create({
      data: {
        name: body.name,
        address: body.address,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode || '',
        country: body.country || 'India',
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        logoUrl: body.logoUrl ?? null,
        schoolCode,
        primaryColor: body.primaryColor ?? '#1E40AF',
        secondaryColor: body.secondaryColor ?? '#3B82F6',
        isActive: body.isActive !== false,
        registrationOpen: body.registrationOpen !== false,
        status: body.status || 'active',
        subscriptionPlan: body.subscriptionPlan || 'basic',
        subscriptionStart: body.subscriptionStart ? new Date(body.subscriptionStart) : new Date(),
        subscriptionEnd: body.subscriptionEnd ? new Date(body.subscriptionEnd) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        settings: body.settings ?? undefined
      }
    });
    logger.info(`School created: ${school.id} (code: ${schoolCode})`);
    return res.status(201).json({ success: true, data: { school } });
  },

  /** GET /schools/code/:schoolCode — PUBLIC, no auth. Returns only safe fields for registration. */
  async getByCode(req: AuthRequest, res: Response) {
    const { schoolCode } = req.params;
    const school = await prisma.school.findUnique({
      where: { schoolCode: schoolCode || undefined },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        registrationOpen: true,
        isActive: true
      }
    });
    if (!school || !school.isActive) {
      return res.status(404).json({ success: false, message: 'Invalid school code' });
    }
    if (!school.registrationOpen) {
      return res.status(403).json({ success: false, message: 'Registration is closed for this school' });
    }
    return res.json({ success: true, data: school });
  },

  /** GET /schools/code/:schoolCode/classes — PUBLIC, no auth. Returns classes for registration flow. */
  async getClassesByCode(req: AuthRequest, res: Response) {
    const { schoolCode } = req.params;
    const school = await prisma.school.findUnique({
      where: { schoolCode: schoolCode || undefined },
      select: { id: true, isActive: true }
    });
    if (!school || !school.isActive) {
      return res.status(404).json({ success: false, message: 'Invalid school code' });
    }
    const classes = await prisma.class.findMany({
      where: { schoolId: school.id },
      select: { id: true, name: true, section: true, roomNumber: true },
      orderBy: [{ name: 'asc' }, { section: 'asc' }]
    });
    return res.json({ success: true, data: classes });
  },

  /** POST /schools/:id/logo — upload logo (SUPER_ADMIN or that school's ADMIN). Multipart field: logo */
  async uploadLogo(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const user = req.user!;
    if (user.role !== 'SUPER_ADMIN' && (user.role !== 'ADMIN' || user.schoolId !== id)) {
      throw new AppError('Forbidden', 403);
    }
    const school = await prisma.school.findUnique({ where: { id } });
    if (!school) throw new AppError('School not found', 404);
    const file = (req as any).file;
    if (!file) throw new AppError('No logo file uploaded (field: logo)', 400);
    const folder = `schools/${id}`;
    const url = await uploadToS3(file, folder);
    await prisma.school.update({
      where: { id },
      data: { logoUrl: url }
    });
    logger.info(`School logo updated: ${id}`);
    return res.json({ success: true, data: { logoUrl: url } });
  },

  /** PUT /schools/:id — update school */
  async update(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const body = req.body;
    const existing = await prisma.school.findUnique({ where: { id } });
    if (!existing) throw new AppError('School not found', 404);

    const school = await prisma.school.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        address: body.address ?? existing.address,
        city: body.city ?? existing.city,
        state: body.state ?? existing.state,
        zipCode: body.zipCode ?? existing.zipCode,
        country: body.country ?? existing.country,
        contactEmail: body.contactEmail ?? existing.contactEmail,
        contactPhone: body.contactPhone ?? existing.contactPhone,
        logoUrl: body.logoUrl !== undefined ? body.logoUrl : existing.logoUrl,
        primaryColor: body.primaryColor !== undefined ? body.primaryColor : existing.primaryColor,
        secondaryColor: body.secondaryColor !== undefined ? body.secondaryColor : existing.secondaryColor,
        isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
        registrationOpen: body.registrationOpen !== undefined ? body.registrationOpen : existing.registrationOpen,
        status: body.status ?? existing.status,
        subscriptionPlan: body.subscriptionPlan ?? existing.subscriptionPlan,
        subscriptionStart: body.subscriptionStart ? new Date(body.subscriptionStart) : undefined,
        subscriptionEnd: body.subscriptionEnd ? new Date(body.subscriptionEnd) : undefined,
        settings: body.settings !== undefined ? body.settings : undefined
      }
    });
    return res.json({ success: true, data: { school } });
  },

  /** DELETE /schools/:id — delete school (SUPER_ADMIN only) */
  async remove(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const existing = await prisma.school.findUnique({ where: { id } });
    if (!existing) throw new AppError('School not found', 404);
    await prisma.school.delete({ where: { id } });
    logger.info(`School deleted: ${id}`);
    return res.json({ success: true, message: 'School deleted' });
  }
};
