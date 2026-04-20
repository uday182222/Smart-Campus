import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = 'password123';
const DEMO_SCHOOL_CODE = 'SCH-DEMO-01';

async function main() {
  console.log('🚀 Creating demo users for all roles...\n');

  try {
    // Find an existing demo school by code
    let school = await prisma.school.findFirst({
      where: { schoolCode: DEMO_SCHOOL_CODE },
    });

    if (!school) {
      // Fallback: pick any school so we don't touch schema/school_code
      school = await prisma.school.findFirst();
    }

    if (!school) {
      throw new Error('No school found in database. Please create a school first.');
    }

    console.log('Using school:', school.name, '| id:', school.id, '| code:', school.schoolCode);

    const users: Array<{ email: string; name: string; role: UserRole }> = [
      {
        email: 'admin@demo.com',
        name: 'Demo Admin',
        role: UserRole.ADMIN,
      },
      {
        email: 'teacher@demo.com',
        name: 'Demo Teacher',
        role: UserRole.TEACHER,
      },
      {
        email: 'parent@demo.com',
        name: 'Demo Parent',
        role: UserRole.PARENT,
      },
      {
        email: 'student@demo.com',
        name: 'Demo Student',
        role: UserRole.STUDENT,
      },
      {
        email: 'bushelper@demo.com',
        name: 'Demo Bus Helper',
        role: UserRole.BUS_HELPER,
      },
      {
        email: 'staff@demo.com',
        name: 'Demo Office Staff',
        role: UserRole.OFFICE_STAFF,
      },
    ];

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    for (const u of users) {
      const existing = await prisma.user.findUnique({
        where: { email: u.email },
      });

      if (!existing) {
        await prisma.user.create({
          data: {
            email: u.email,
            name: u.name,
            role: u.role,
            status: UserStatus.ACTIVE,
            password: hashedPassword,
            schoolId: school.id,
          },
        });
        console.log(`✅ Created ${u.role}: ${u.email}`);
      } else {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            role: u.role,
            status: UserStatus.ACTIVE,
            password: hashedPassword,
            schoolId: school.id,
          },
        });
        console.log(`ℹ️ Updated ${u.role}: ${u.email}`);
      }
    }

    console.log('\n========================================');
    console.log('🎉 Demo users for all roles created/updated!\n');
    console.log('📋 LOGIN CREDENTIALS (all use the same password):');
    console.log('========================================');
    console.log('');
    console.log('ADMIN:        admin@demo.com      / password123');
    console.log('TEACHER:      teacher@demo.com    / password123');
    console.log('PARENT:       parent@demo.com     / password123');
    console.log('STUDENT:      student@demo.com    / password123');
    console.log('BUS_HELPER:   bushelper@demo.com  / password123');
    console.log('OFFICE_STAFF: staff@demo.com      / password123');
    console.log('');
    console.log('School Code (mobile first screen): SCH-DEMO-01');
    console.log('========================================\n');
  } catch (err) {
    console.error('❌ Error creating demo users for roles:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

