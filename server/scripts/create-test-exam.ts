import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestExam() {
  try {
    console.log('Creating test exam...');

    // Find class
    const classRecord = await prisma.class.findFirst({
      where: { id: 'class_123' }
    });

    if (!classRecord) {
      console.error('Class not found');
      process.exit(1);
    }

    // Create exam
    const exam = await prisma.exam.upsert({
      where: {
        id: 'exam_test_123'
      },
      update: {},
      create: {
        id: 'exam_test_123',
        classId: 'class_123',
        name: 'Mathematics Mid-Term Exam',
        subject: 'Mathematics',
        examType: 'mid_term',
        date: new Date('2025-02-15'),
        maxMarks: 100,
        passingMarks: 40,
      },
    });

    console.log('✅ Exam created:', exam.id);
    console.log('   Name:', exam.name);
    console.log('   Subject:', exam.subject);
    console.log('   Max Marks:', exam.maxMarks);
    console.log('');
    console.log('📝 Use this exam ID for testing:');
    console.log('   EXAM_ID:', exam.id);

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createTestExam();

