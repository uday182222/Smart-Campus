import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = 'password123';

async function createDemoUsers() {
  console.log('🚀 Creating demo users for Smart Campus...\n');

  try {
    // 1. Create a demo school first
    let school = await prisma.school.findFirst({
      where: { name: 'Demo School' }
    });

    if (!school) {
      school = await prisma.school.create({
        data: {
          id: 'demo-school-001',
          name: 'Demo School',
          contactEmail: 'admin@demoschool.com',
          contactPhone: '1234567890',
          address: '123 Education Street',
          city: 'Demo City',
          state: 'Demo State',
          zipCode: '12345',
          schoolCode: 'SCH-DEMO-01',
          primaryColor: '#1E40AF',
          secondaryColor: '#3B82F6',
          status: 'active',
          subscriptionPlan: 'premium',
          subscriptionStart: new Date(),
          subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        }
      });
      console.log('✅ Created Demo School');
    } else {
      // Ensure existing demo school has branding fields
      school = await prisma.school.update({
        where: { id: school.id },
        data: {
          schoolCode: school.schoolCode ?? 'SCH-DEMO-01',
          primaryColor: school.primaryColor ?? '#1E40AF',
          secondaryColor: school.secondaryColor ?? '#3B82F6',
        }
      });
      console.log('ℹ️  Demo School already exists');
    }

    // 2. Create a demo class
    let demoClass = await prisma.class.findFirst({
      where: { name: 'Class 10-A', schoolId: school.id }
    });

    if (!demoClass) {
      demoClass = await prisma.class.create({
        data: {
          id: 'demo-class-001',
          name: 'Class 10-A',
          section: 'A',
          schoolId: school.id,
          capacity: 40,
          currentStudents: 5,
          subjects: ['Mathematics', 'Science', 'English', 'History'],
        }
      });
      console.log('✅ Created Demo Class: Class 10-A');
    } else {
      console.log('ℹ️  Demo Class already exists');
    }

    // 3. Create demo users
    const users = [
      {
        id: 'demo-teacher-001',
        email: 'teacher@demo.com',
        name: 'John Teacher',
        role: UserRole.TEACHER,
        schoolId: school.id,
      },
      {
        id: 'demo-parent-001',
        email: 'parent@demo.com',
        name: 'Mary Parent',
        role: UserRole.PARENT,
        schoolId: school.id,
      },
      {
        id: 'demo-admin-001',
        email: 'admin@demo.com',
        name: 'Admin User',
        role: UserRole.ADMIN,
        schoolId: school.id,
      },
      {
        id: 'demo-student-001',
        email: 'student@demo.com',
        name: 'Tom Student',
        role: UserRole.STUDENT,
        schoolId: school.id,
      },
    ];

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    for (const userData of users) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (!existingUser) {
        const user = await prisma.user.create({
          data: {
            ...userData,
            status: UserStatus.ACTIVE,
          }
        });
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        });
        console.log(`✅ Created ${userData.role}: ${userData.email}`);
      } else {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { password: hashedPassword }
        });
        console.log(`ℹ️  User already exists: ${userData.email} (password updated)`);
      }
    }

    // 4. Link teacher to class
    const teacher = await prisma.user.findUnique({
      where: { email: 'teacher@demo.com' }
    });

    if (teacher && demoClass) {
      const existingLink = await prisma.teacherClass.findFirst({
        where: { teacherId: teacher.id, classId: demoClass.id }
      });

      if (!existingLink) {
        await prisma.teacherClass.create({
          data: {
            teacherId: teacher.id,
            classId: demoClass.id,
            subject: 'Mathematics',
            isClassTeacher: true,
          }
        });
        console.log('✅ Linked teacher to Class 10-A');
      }
    }

    // 5. Link student to parent
    const student = await prisma.user.findUnique({
      where: { email: 'student@demo.com' }
    });
    const parent = await prisma.user.findUnique({
      where: { email: 'parent@demo.com' }
    });

    if (student && parent) {
      const existingRelation = await prisma.parentStudent.findFirst({
        where: { parentId: parent.id, studentId: student.id }
      });

      if (!existingRelation) {
        await prisma.parentStudent.create({
          data: {
            parentId: parent.id,
            studentId: student.id,
            relationship: 'parent',
            isPrimary: true,
          }
        });
        console.log('✅ Linked parent to student');
      }
    }

    console.log('\n========================================');
    console.log('🎉 Demo users created successfully!\n');
    console.log('📋 LOGIN CREDENTIALS:');
    console.log('========================================');
    console.log('');
    console.log('👨‍🏫 TEACHER:  teacher@demo.com / password123 / School ID: demo-school-001');
    console.log('👨‍👩‍👧 PARENT:   parent@demo.com / password123 / School ID: demo-school-001');
    console.log('👔 ADMIN:    admin@demo.com / password123 / School ID: demo-school-001');
    console.log('🎓 STUDENT:  student@demo.com / password123 / School ID: demo-school-001');
    console.log('');
    console.log('School Code: SCH-DEMO-01 (share this with parents/students for registration)');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error creating demo users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUsers();
