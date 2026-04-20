import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('Creating test data...');

    // Create school
    const school = await prisma.school.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440000' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test School',
        address: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'India',
        contactEmail: 'school@test.com',
        contactPhone: '1234567890',
        status: 'active',
        subscriptionPlan: 'basic',
        subscriptionStart: new Date(),
        subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      },
    });
    console.log('✅ School created:', school.id);

    // Create teacher
    const teacher = await prisma.user.upsert({
      where: { email: 'teacher@test.com' },
      update: {},
      create: {
        email: 'teacher@test.com',
        name: 'Test Teacher',
        role: 'TEACHER',
        schoolId: school.id,
        status: 'ACTIVE',
        metadata: {},
        preferences: {},
      },
    });
    console.log('✅ Teacher created:', teacher.id);

    // Create class
    const classRecord = await prisma.class.upsert({
      where: {
        schoolId_name_section: {
          schoolId: school.id,
          name: '5',
          section: 'A',
        },
      },
      update: {},
      create: {
        id: 'class_123',
        schoolId: school.id,
        name: '5',
        section: 'A',
        capacity: 40,
        currentStudents: 2,
        subjects: ['Math', 'Science'],
        schedule: {},
      },
    });
    console.log('✅ Class created:', classRecord.id);

    // Create students
    const student1 = await prisma.user.upsert({
      where: { email: 'student1@test.com' },
      update: {},
      create: {
        email: 'student1@test.com',
        name: 'Student One',
        role: 'STUDENT',
        schoolId: school.id,
        status: 'ACTIVE',
        metadata: {},
        preferences: {},
      },
    });
    console.log('✅ Student 1 created:', student1.id);

    const student2 = await prisma.user.upsert({
      where: { email: 'student2@test.com' },
      update: {},
      create: {
        email: 'student2@test.com',
        name: 'Student Two',
        role: 'STUDENT',
        schoolId: school.id,
        status: 'ACTIVE',
        metadata: {},
        preferences: {},
      },
    });
    console.log('✅ Student 2 created:', student2.id);

    // Update test script to use actual student IDs
    console.log('\n📝 Update your test script with these IDs:');
    console.log(`Teacher ID: ${teacher.id}`);
    console.log(`Student 1 ID: ${student1.id}`);
    console.log(`Student 2 ID: ${student2.id}`);
    console.log(`Class ID: ${classRecord.id}`);
    console.log(`School ID: ${school.id}`);

    console.log('\n✅ Test data created successfully!');
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();

