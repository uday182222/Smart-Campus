import { Response } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { generateUniqueSchoolCode } from '../utils/schoolCode';

const prisma = new PrismaClient();

function randomPassword(length: number = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export const superadminController = {
  async getDashboardStats(_req: AuthRequest, res: Response) {
    const [totalSchools, activeSchools, totalStudents, totalTeachers, studentCountBySchool, recentSchools] = await Promise.all([
      prisma.school.count(),
      prisma.school.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.user.groupBy({
        by: ['schoolId'],
        where: { role: 'STUDENT', schoolId: { not: null } },
        _count: { id: true }
      }),
      prisma.school.findMany({ take: 5, orderBy: { createdAt: 'desc' } })
    ]);

    const countMap = new Map<string, number>();
    studentCountBySchool.forEach((row) => countMap.set(row.schoolId!, row._count.id));
    const sorted = [...studentCountBySchool].sort((a, b) => b._count.id - a._count.id);
    const topSchoolId = sorted[0]?.schoolId ?? null;
    const topSchool = topSchoolId
      ? await prisma.school.findUnique({
          where: { id: topSchoolId },
          select: { id: true, name: true, schoolCode: true }
        })
      : null;

    const mostActiveSchool = topSchool
      ? {
          id: topSchool.id,
          name: topSchool.name,
          schoolCode: topSchool.schoolCode,
          studentCount: countMap.get(topSchool.id) ?? 0
        }
      : null;

    const recentSchoolsPayload = recentSchools.map((s) => ({
      id: s.id,
      name: s.name,
      schoolCode: s.schoolCode,
      createdAt: s.createdAt,
      isActive: s.isActive,
      studentCount: countMap.get(s.id) ?? 0
    }));

    return res.json({
      success: true,
      data: {
        totalSchools,
        activeSchools,
        totalStudents,
        totalTeachers,
        mostActiveSchool,
        recentSchools: recentSchoolsPayload
      }
    });
  },

  async getAllSchools(_req: AuthRequest, res: Response) {
    const schools = await prisma.school.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true, registrationRequests: true }
        }
      }
    });

    const payload = schools.map((s) => ({
      id: s.id,
      name: s.name,
      schoolCode: s.schoolCode,
      primaryColor: s.primaryColor,
      secondaryColor: s.secondaryColor,
      logoUrl: s.logoUrl,
      isActive: s.isActive,
      registrationOpen: s.registrationOpen,
      createdAt: s.createdAt,
      _count: s._count
    }));

    return res.json({ success: true, data: { schools: payload } });
  },

  async createSchool(req: AuthRequest, res: Response) {
    const { name, address, primaryColor, secondaryColor } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new AppError('School name is required', 400);
    }

    const schoolCode = await generateUniqueSchoolCode(prisma);
    const slug = slugify(name) || 'school';
    const adminEmail = `admin@${slug}.smartcampus.app`;
    const plainPassword = randomPassword(12);

    const now = new Date();
    const subEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    const school = await prisma.school.create({
      data: {
        name: name.trim(),
        address: (address && typeof address === 'string' ? address.trim() : '') || 'Not provided',
        city: '',
        state: '',
        zipCode: '',
        country: 'India',
        contactEmail: adminEmail,
        contactPhone: '',
        schoolCode,
        primaryColor: primaryColor && typeof primaryColor === 'string' ? primaryColor : '#1E40AF',
        secondaryColor: secondaryColor && typeof secondaryColor === 'string' ? secondaryColor : '#3B82F6',
        isActive: true,
        registrationOpen: true,
        subscriptionStart: now,
        subscriptionEnd: subEnd
      }
    });

    const hashedPassword = await bcrypt.hash(plainPassword, 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: `${name.trim()} Admin`,
        role: 'ADMIN',
        schoolId: school.id,
        password: hashedPassword
      }
    });

    logger.info(`SuperAdmin created school: ${school.id} (${schoolCode}), admin: ${adminEmail}`);

    return res.status(201).json({
      success: true,
      data: {
        school: {
          id: school.id,
          name: school.name,
          schoolCode: school.schoolCode,
          primaryColor: school.primaryColor,
          secondaryColor: school.secondaryColor,
          isActive: school.isActive,
          createdAt: school.createdAt
        },
        adminCredentials: {
          email: adminEmail,
          password: plainPassword
        }
      }
    });
  },

  async getSchoolDetail(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            classes: true,
            registrationRequests: true
          }
        }
      }
    });
    if (!school) throw new AppError('School not found', 404);

    const [studentCount, teacherCount, adminUser] = await Promise.all([
      prisma.user.count({ where: { schoolId: id, role: 'STUDENT' } }),
      prisma.user.count({ where: { schoolId: id, role: 'TEACHER' } }),
      prisma.user.findFirst({
        where: { schoolId: id, role: 'ADMIN' },
        select: { id: true, email: true, name: true }
      })
    ]);

    const pendingRequests = await prisma.registrationRequest.count({
      where: { schoolId: id, status: 'PENDING' }
    });

    return res.json({
      success: true,
      data: {
        school: {
          id: school.id,
          name: school.name,
          schoolCode: school.schoolCode,
          address: school.address,
          primaryColor: school.primaryColor,
          secondaryColor: school.secondaryColor,
          logoUrl: school.logoUrl,
          isActive: school.isActive,
          registrationOpen: school.registrationOpen,
          createdAt: school.createdAt
        },
        counts: {
          students: studentCount,
          teachers: teacherCount,
          classes: school._count.classes,
          pendingRequests
        },
        admin: adminUser ? { email: adminUser.email, name: adminUser.name } : null
      }
    });
  },

  async toggleSchoolStatus(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      throw new AppError('isActive must be a boolean', 400);
    }
    const school = await prisma.school.update({
      where: { id },
      data: { isActive }
    });
    return res.json({ success: true, data: { school } });
  },

  async deleteSchool(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const school = await prisma.school.findUnique({ where: { id } });
    if (!school) throw new AppError('School not found', 404);

    const classIds = (await prisma.class.findMany({ where: { schoolId: id }, select: { id: true } })).map((c) => c.id);
    const homeworkIds = (await prisma.homework.findMany({ where: { classId: { in: classIds } }, select: { id: true } })).map((h) => h.id);
    const examIds = (await prisma.exam.findMany({ where: { classId: { in: classIds } }, select: { id: true } })).map((e) => e.id);

    await prisma.$transaction(async (tx) => {
      await tx.user.deleteMany({ where: { schoolId: id } });
      if (homeworkIds.length) await tx.homeworkSubmission.deleteMany({ where: { homeworkId: { in: homeworkIds } } });
      await tx.homework.deleteMany({ where: { classId: { in: classIds } } });
      if (examIds.length) await tx.marks.deleteMany({ where: { examId: { in: examIds } } });
      await tx.exam.deleteMany({ where: { classId: { in: classIds } } });
      await tx.attendance.deleteMany({ where: { classId: { in: classIds } } });
      await tx.teacherClass.deleteMany({ where: { classId: { in: classIds } } });
      await tx.class.deleteMany({ where: { schoolId: id } });
      await tx.registrationRequest.deleteMany({ where: { schoolId: id } });
      await tx.event.deleteMany({ where: { schoolId: id } });
      await tx.galleryItem.deleteMany({ where: { schoolId: id } });
      await tx.route.deleteMany({ where: { schoolId: id } });
      await tx.school.delete({ where: { id } });
    });

    logger.info(`SuperAdmin deleted school: ${id}`);
    return res.json({ success: true });
  },

  async resetAdminPassword(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const admin = await prisma.user.findFirst({
      where: { schoolId: id, role: 'ADMIN' }
    });
    if (!admin) throw new AppError('No admin user found for this school', 404);

    const newPassword = randomPassword(12);
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: admin.id },
      data: { password: hashed }
    });

    logger.info(`SuperAdmin reset admin password for school: ${id}`);
    return res.json({
      success: true,
      data: { email: admin.email, newPassword }
    });
  },

  async deleteAdminCredentials(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const admin = await prisma.user.findFirst({
      where: { schoolId: id, role: 'ADMIN' }
    });
    if (!admin) throw new AppError('No admin user found for this school', 404);
    await prisma.user.delete({ where: { id: admin.id } });
    logger.info(`SuperAdmin deleted admin for school: ${id}`);
    return res.json({ success: true });
  },

  async getSchoolUsers(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { role } = req.query;
    const school = await prisma.school.findUnique({ where: { id } });
    if (!school) throw new AppError('School not found', 404);

    const where: { schoolId: string; role?: UserRole } = { schoolId: id };
    if (role && typeof role === 'string' && ['ADMIN', 'TEACHER', 'PARENT', 'STUDENT', 'BUS_HELPER', 'OFFICE_STAFF', 'PRINCIPAL', 'SUPER_ADMIN'].includes(role)) {
      where.role = role as UserRole;
    }

    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, data: { users } });
  }
};
