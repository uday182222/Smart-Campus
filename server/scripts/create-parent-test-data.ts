import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createParentTestData() {
  try {
    console.log('Creating parent test data...');

    // Find or create school
    let school = await prisma.school.findFirst({
      where: { id: 'SCH001' }
    });

    if (!school) {
      school = await prisma.school.create({
        data: {
          id: 'SCH001',
          name: 'Test School',
          address: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'India',
          contactEmail: 'test@school.com',
          contactPhone: '1234567890',
          subscriptionStart: new Date(),
          subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Find existing student
    let student = await prisma.user.findFirst({
      where: {
        email: 'student1@test.com',
        role: 'STUDENT',
      },
    });

    if (!student) {
      student = await prisma.user.create({
        data: {
          email: 'student1@test.com',
          name: 'Student One',
          role: 'STUDENT',
          schoolId: school.id,
          status: 'ACTIVE',
        },
      });
      console.log('✅ Created student:', student.id);
    }

    // Create parent user
    const parentEmail = 'parent@test.com';
    let parent = await prisma.user.findFirst({
      where: {
        email: parentEmail,
        role: 'PARENT',
      },
    });

    if (!parent) {
      parent = await prisma.user.create({
        data: {
          email: parentEmail,
          name: 'Parent User',
          role: 'PARENT',
          schoolId: school.id,
          status: 'ACTIVE',
        },
      });
      console.log('✅ Created parent:', parent.id);
    }

    // Link parent to student
    await prisma.parentStudent.upsert({
      where: {
        parentId_studentId: {
          parentId: parent.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        parentId: parent.id,
        studentId: student.id,
        relationship: 'Father',
        isPrimary: true,
      },
    });

    console.log('✅ Linked parent to student');
    console.log('');
    console.log('📝 Test Credentials:');
    console.log('   Parent Email: parent@test.com');
    console.log('   Student ID:', student.id);
    console.log('   Parent ID:', parent.id);
    console.log('');
    console.log('💡 Note: You need to set password for parent user via auth/register or update password');

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createParentTestData();

