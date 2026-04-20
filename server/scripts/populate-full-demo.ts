/**
 * Populates SCH-DEMO-01 with realistic parent-app test data (attendance, homework, marks, fees, events, bus route, notifications, gallery).
 * Safe to re-run: clears and recreates demo-scoped rows for the demo student/class.
 */
import { UserRole, UserStatus, EventType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import prisma from '../src/config/database';

function dateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

export async function populateFullDemo(): Promise<void> {
  const school = await prisma.school.findFirst({ where: { schoolCode: 'SCH-DEMO-01' } });
  if (!school) throw new Error('Demo school not found (schoolCode SCH-DEMO-01). Run create-demo-users first.');

  const student = await prisma.user.findFirst({
    where: { email: 'student@demo.com', schoolId: school.id, role: UserRole.STUDENT },
  });
  const parent = await prisma.user.findFirst({
    where: { email: 'parent@demo.com', schoolId: school.id, role: UserRole.PARENT },
  });
  const teacher = await prisma.user.findFirst({
    where: { email: 'teacher@demo.com', schoolId: school.id, role: UserRole.TEACHER },
  });
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@demo.com', schoolId: school.id, role: UserRole.ADMIN },
  });
  if (!student || !parent || !teacher) {
    throw new Error('Missing demo student/parent/teacher — run npx ts-node scripts/create-demo-users.ts');
  }

  const cls = await prisma.class.findFirst({
    where: { schoolId: school.id, name: 'Class 10-A', section: 'A' },
  });
  if (!cls) throw new Error('Demo class Class 10-A not found');

  await prisma.parentStudent.upsert({
    where: { parentId_studentId: { parentId: parent.id, studentId: student.id } },
    update: { relationship: 'parent', isPrimary: true },
    create: {
      parentId: parent.id,
      studentId: student.id,
      relationship: 'parent',
      isPrimary: true,
    },
  });

  await prisma.user.update({
    where: { id: student.id },
    data: {
      name: 'Aarav Singh',
      status: UserStatus.ACTIVE,
      metadata: { classId: cls.id } as object,
    },
  });
  await prisma.user.update({
    where: { id: parent.id },
    data: { name: 'Rajesh Singh', status: UserStatus.ACTIVE },
  });

  // --- Reset demo-scoped data ---
  await prisma.attendance.deleteMany({ where: { studentId: student.id } });
  await prisma.homeworkSubmission.deleteMany({ where: { studentId: student.id } });
  await prisma.homework.deleteMany({ where: { classId: cls.id } });
  const existingMarks = await prisma.marks.findMany({ where: { studentId: student.id }, select: { examId: true } });
  const examIds = [...new Set(existingMarks.map((m) => m.examId))];
  await prisma.marks.deleteMany({ where: { studentId: student.id } });
  if (examIds.length > 0) await prisma.exam.deleteMany({ where: { id: { in: examIds } } });

  await prisma.feePayment.deleteMany({ where: { studentId: student.id } });
  await prisma.feeStructure.deleteMany({ where: { schoolId: school.id } });

  await prisma.notification.deleteMany({ where: { userId: parent.id } });
  await prisma.schoolEvent.deleteMany({ where: { schoolId: school.id } });

  const routeId = 'demo-route-north-001';
  await prisma.route.deleteMany({ where: { id: routeId } });

  await prisma.galleryItem.deleteMany({ where: { schoolId: school.id, caption: { startsWith: '[Demo]' } } });

  // --- Attendance: last ~25 weekdays ---
  const days: Date[] = [];
  for (let i = 1; i <= 45 && days.length < 28; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (d.getDay() !== 0 && d.getDay() !== 6) days.push(dateOnly(d));
  }
  for (const date of days) {
    const rand = Math.random();
    const status = rand > 0.12 ? 'present' : rand > 0.05 ? 'late' : 'absent';
    await prisma.attendance.create({
      data: {
        studentId: student.id,
        classId: cls.id,
        teacherId: teacher.id,
        date,
        status,
      },
    });
  }
  console.log('✅ Attendance created');

  // --- Homework ---
  const homeworkItems = [
    { title: 'Chapter 5 Exercise', subject: 'Mathematics', daysFromNow: 3 },
    { title: 'Solar System Essay', subject: 'Science', daysFromNow: 5 },
    { title: 'Grammar Worksheet', subject: 'English', daysFromNow: -2 },
    { title: 'Map Work', subject: 'Social Studies', daysFromNow: 7 },
    { title: 'Hindi Poem', subject: 'Hindi', daysFromNow: 4 },
  ];
  for (const hw of homeworkItems) {
    const row = await prisma.homework.create({
      data: {
        title: hw.title,
        subject: hw.subject,
        description: `Complete ${hw.title} and submit by the due date.`,
        classId: cls.id,
        dueDate: new Date(Date.now() + hw.daysFromNow * 86400000),
        teacherId: teacher.id,
      },
    });
    if (hw.daysFromNow < 0) {
      await prisma.homeworkSubmission.create({
        data: {
          homeworkId: row.id,
          studentId: student.id,
          status: 'OVERDUE',
        },
      });
    } else if (hw.daysFromNow <= 4) {
      await prisma.homeworkSubmission.create({
        data: {
          homeworkId: row.id,
          studentId: student.id,
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      });
    } else {
      await prisma.homeworkSubmission.create({
        data: {
          homeworkId: row.id,
          studentId: student.id,
          status: 'PENDING',
        },
      });
    }
  }
  console.log('✅ Homework created');

  // --- Exams + marks ---
  const subjects = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies'];
  const examTypes = ['MIDTERM', 'QUIZ', 'ASSIGNMENT'] as const;
  for (const subject of subjects) {
    for (const examType of examTypes) {
      const exam = await prisma.exam.create({
        data: {
          classId: cls.id,
          name: `${subject} ${examType}`,
          subject,
          examType,
          date: dateOnly(new Date(Date.now() - Math.floor(Math.random() * 40) * 86400000)),
          maxMarks: 100,
          passingMarks: 35,
        },
      });
      await prisma.marks.create({
        data: {
          examId: exam.id,
          studentId: student.id,
          teacherId: teacher.id,
          marksObtained: Math.floor(65 + Math.random() * 30),
        },
      });
    }
  }
  console.log('✅ Marks created');

  // --- Fee structures + payments ---
  const feeDefs: (
    | { name: string; amount: number; paid: true; paidDaysAgo: number }
    | { name: string; amount: number; paid: false; dueDaysFromNow: number }
  )[] = [
    { name: 'Term 1 Tuition Fee', amount: 25000, paid: true, paidDaysAgo: 30 },
    { name: 'Term 2 Tuition Fee', amount: 25000, paid: false, dueDaysFromNow: 30 },
    { name: 'Transport Fee', amount: 8000, paid: true, paidDaysAgo: 45 },
    { name: 'Library Fee', amount: 2000, paid: false, dueDaysFromNow: -15 },
    { name: 'Sports Fee', amount: 3000, paid: false, dueDaysFromNow: 60 },
  ];
  for (const f of feeDefs) {
    const dueDate = f.paid
      ? new Date(Date.now() - f.paidDaysAgo * 86400000)
      : new Date(Date.now() + f.dueDaysFromNow * 86400000);
    const structure = await prisma.feeStructure.create({
      data: {
        schoolId: school.id,
        name: f.name,
        type: 'tuition',
        amount: f.amount,
        dueDate,
        isActive: true,
      },
    });
    if (f.paid) {
      await prisma.feePayment.create({
        data: {
          feeStructureId: structure.id,
          studentId: student.id,
          amountPaid: f.amount,
          paidAt: new Date(Date.now() - f.paidDaysAgo * 86400000),
          paymentMethod: 'UPI',
          reference: `DEMO-${structure.id.slice(0, 8)}`,
        },
      });
    }
  }
  console.log('✅ Fees created');

  // --- Notifications (body + channels required) ---
  const channels = ['in_app'] as any;
  const notifs = [
    { title: 'Attendance Alert', body: 'Aarav was marked absent on Monday. Please inform the school if this is incorrect.', category: 'attendance' },
    { title: 'Fee Reminder', body: 'Term 2 Tuition Fee of ₹25,000 is due in 30 days. Please pay at the school office.', category: 'fees' },
    { title: 'Homework Due', body: 'Grammar Worksheet is overdue. Please ensure Aarav submits it immediately.', category: 'homework' },
    { title: 'PTM Scheduled', body: 'Parent-Teacher Meeting is scheduled for April 10th at 10:00 AM in the school auditorium.', category: 'announcement' },
    { title: 'Exam Results', body: 'Mid-term examination results are now available. Check the report card for details.', category: 'marks' },
    { title: 'School Event', body: 'Annual Sports Day is on April 15th. Students are requested to wear sports uniform.', category: 'announcement' },
  ];
  for (const n of notifs) {
    await prisma.notification.create({
      data: {
        userId: parent.id,
        title: n.title,
        body: n.body,
        category: n.category,
        channels,
        priority: 'normal',
        status: 'delivered',
      },
    });
  }
  console.log('✅ Notifications created');

  // --- School events ---
  const creatorId = admin?.id ?? teacher.id;
  const events = [
    { title: 'Parent-Teacher Meeting', description: 'Quarterly PTM for all classes', date: new Date('2026-04-10'), type: EventType.MEETING },
    { title: 'Annual Sports Day', description: 'Annual sports day with various events', date: new Date('2026-04-15'), type: EventType.EVENT },
    { title: 'Mid-Term Exams', description: 'Mid-term examinations for all classes', date: new Date('2026-04-20'), type: EventType.EXAM },
    { title: 'Summer Break', description: 'School closes for summer vacation', date: new Date('2026-05-01'), type: EventType.HOLIDAY },
  ];
  for (const e of events) {
    await prisma.schoolEvent.create({
      data: {
        schoolId: school.id,
        title: e.title,
        description: e.description,
        date: dateOnly(e.date),
        type: e.type,
        createdBy: creatorId,
      },
    });
  }
  console.log('✅ Events created');

  // --- Bus route (stops must include `students: [{ id, name }]`) ---
  const hash = await bcrypt.hash('password123', 12);
  let busHelper = await prisma.user.findFirst({ where: { role: UserRole.BUS_HELPER, schoolId: school.id } });
  if (!busHelper) {
    busHelper = await prisma.user.create({
      data: {
        name: 'Ram Driver',
        email: 'bushelper@demo.com',
        password: hash,
        role: UserRole.BUS_HELPER,
        schoolId: school.id,
        phone: '+919876543210',
        status: UserStatus.ACTIVE,
      },
    });
  }
  const stops = [
    { id: 'stop-1', name: 'Rajouri Garden Metro', address: 'Rajouri Garden', latitude: 28.6448, longitude: 77.1121, sequence: 1, estimatedTime: '07:30', students: [] as { id: string; name: string }[] },
    { id: 'stop-2', name: 'Tagore Garden', address: 'Tagore Garden', latitude: 28.6502, longitude: 77.1205, sequence: 2, estimatedTime: '07:40', students: [] as { id: string; name: string }[] },
    {
      id: 'stop-3',
      name: 'Subhash Nagar',
      address: 'Subhash Nagar',
      latitude: 28.6478,
      longitude: 77.1334,
      sequence: 3,
      estimatedTime: '07:50',
      students: [{ id: student.id, name: student.name }],
    },
    { id: 'stop-4', name: 'Tilak Nagar', address: 'Tilak Nagar', latitude: 28.6421, longitude: 77.1027, sequence: 4, estimatedTime: '08:00', students: [] as { id: string; name: string }[] },
    { id: 'stop-5', name: 'School Gate', address: 'School', latitude: 28.635, longitude: 77.115, sequence: 5, estimatedTime: '08:30', students: [] as { id: string; name: string }[] },
  ];
  await prisma.route.create({
    data: {
      id: routeId,
      schoolId: school.id,
      name: 'Route 1 - North Zone',
      busNumber: 'DL 01 AB 1234',
      helperId: busHelper.id,
      helperName: busHelper.name,
      helperPhone: busHelper.phone ?? '+919876543210',
      startTime: '07:30',
      endTime: '08:30',
      status: 'active',
      stops: stops as any,
    },
  });
  console.log('✅ Bus route created');

  // --- Gallery placeholders ---
  const demoUrls = [
    'https://picsum.photos/seed/smartcampus1/800/600',
    'https://picsum.photos/seed/smartcampus2/800/600',
    'https://picsum.photos/seed/smartcampus3/800/600',
  ];
  for (let i = 0; i < demoUrls.length; i++) {
    await prisma.galleryItem.create({
      data: {
        schoolId: school.id,
        uploadedBy: teacher.id,
        type: 'image',
        url: demoUrls[i],
        thumbnailUrl: demoUrls[i],
        caption: `[Demo] Sports Day ${i + 1}`,
        event: 'Sports Day',
        fileSize: BigInt(120000 + i * 1000),
        visibility: 'public',
      },
    });
  }
  console.log('✅ Gallery items created');

  // --- Sample appointments ---
  await prisma.appointment.deleteMany({ where: { parentId: parent.id, studentId: student.id } });
  await prisma.appointment.create({
    data: {
      parentId: parent.id,
      studentId: student.id,
      requestedDate: new Date(Date.now() + 7 * 86400000),
      requestedTime: '10:00',
      duration: 30,
      reason: 'Academic progress discussion',
      status: 'pending',
      assignedTo: 'teacher',
      assignedPersonId: teacher.id,
    },
  });
  console.log('✅ Appointments created');

  console.log('\n🎉 Full demo data populated!');
  console.log('Parent:  parent@demo.com / password123');
  console.log('Student: Aarav Singh · Class 10-A');
}

async function main() {
  try {
    await populateFullDemo();
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void main();
}
