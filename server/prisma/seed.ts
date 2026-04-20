/**
 * Seed script: creates default Super Admin for development.
 * Run: npx prisma db seed
 *
 * Default Super Admin credentials:
 *   Email:    superadmin@smartcampus.com
 *   Password: Admin@123
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SUPER_ADMIN_EMAIL = 'superadmin@smartcampus.com';
const SUPER_ADMIN_PASSWORD = 'Admin@123';

const DEMO_SCHOOL_CODE = 'SCH-DEMO-01';
const DEMO_TEACHER_EMAIL = 'teacher@demoschool.edu';
const DEMO_TEACHER_PASSWORD = 'Admin@123';
const DEMO_PARENT_EMAIL = 'parent@demo.com';
const DEMO_PARENT_PASSWORD = 'password123';

async function main() {
  const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
  const teacherPasswordHash = await bcrypt.hash(DEMO_TEACHER_PASSWORD, 10);
  const parentPasswordHash = await bcrypt.hash(DEMO_PARENT_PASSWORD, 10);

  // Ensure demo school exists (for app registration flow)
  let demoSchool = await prisma.school.findFirst({
    where: { schoolCode: DEMO_SCHOOL_CODE },
  });
  if (!demoSchool) {
    const subStart = new Date();
    const subEnd = new Date();
    subEnd.setFullYear(subEnd.getFullYear() + 1);
    demoSchool = await prisma.school.create({
      data: {
        name: 'Demo School',
        address: '123 Demo Street',
        city: 'Demo City',
        state: 'State',
        zipCode: '110001',
        country: 'India',
        contactEmail: 'contact@demoschool.edu',
        contactPhone: '+911234567890',
        schoolCode: DEMO_SCHOOL_CODE,
        isActive: true,
        registrationOpen: true,
        subscriptionPlan: 'basic',
        subscriptionStart: subStart,
        subscriptionEnd: subEnd,
      },
    });
    console.log('Demo school created with code:', DEMO_SCHOOL_CODE);
  } else {
    console.log('Demo school already exists:', DEMO_SCHOOL_CODE);
  }

  // Demo Teacher (school: Demo School, code SCH-DEMO-01)
  const existingTeacher = await prisma.user.findFirst({
    where: { email: DEMO_TEACHER_EMAIL },
  });
  if (existingTeacher) {
    await prisma.user.update({
      where: { id: existingTeacher.id },
      data: {
        role: 'TEACHER',
        status: 'ACTIVE',
        password: teacherPasswordHash,
        schoolId: demoSchool.id,
        name: 'Demo Teacher',
      },
    });
    console.log('Demo Teacher password reset:', DEMO_TEACHER_EMAIL);
  } else {
    await prisma.user.create({
      data: {
        email: DEMO_TEACHER_EMAIL,
        name: 'Demo Teacher',
        role: 'TEACHER',
        status: 'ACTIVE',
        password: teacherPasswordHash,
        schoolId: demoSchool.id,
      },
    });
    console.log('Demo Teacher created:', DEMO_TEACHER_EMAIL);
  }

  // Demo Parent (school: Demo School, code SCH-DEMO-01)
  const existingParent = await prisma.user.findFirst({
    where: { email: DEMO_PARENT_EMAIL },
  });
  if (existingParent) {
    await prisma.user.update({
      where: { id: existingParent.id },
      data: {
        role: 'PARENT',
        status: 'ACTIVE',
        password: parentPasswordHash,
        schoolId: demoSchool.id,
        name: 'Demo Parent',
      },
    });
    console.log('Demo Parent password reset:', DEMO_PARENT_EMAIL);
  } else {
    await prisma.user.create({
      data: {
        email: DEMO_PARENT_EMAIL,
        name: 'Demo Parent',
        role: 'PARENT',
        status: 'ACTIVE',
        password: parentPasswordHash,
        schoolId: demoSchool.id,
      },
    });
    console.log('Demo Parent created:', DEMO_PARENT_EMAIL);
  }

  const existing = await prisma.user.findFirst({
    where: { email: SUPER_ADMIN_EMAIL },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        password: hashedPassword,
        schoolId: null,
      },
    });
    console.log('Super Admin password reset for:', SUPER_ADMIN_EMAIL);
  } else {
    await prisma.user.create({
      data: {
        email: SUPER_ADMIN_EMAIL,
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        password: hashedPassword,
        schoolId: null,
      },
    });
    console.log('Super Admin created.');
  }

  console.log('\n--- Login credentials ---');
  console.log('Super Admin:', SUPER_ADMIN_EMAIL, '| Password:', SUPER_ADMIN_PASSWORD);
  console.log('Teacher:    ', DEMO_TEACHER_EMAIL, '| Password:', DEMO_TEACHER_PASSWORD);
  console.log('Parent:     ', DEMO_PARENT_EMAIL, '| Password:', DEMO_PARENT_PASSWORD);
  console.log('(School code for app:', DEMO_SCHOOL_CODE + ')');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
