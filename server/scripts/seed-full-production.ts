/**
 * One-shot production-like seed for SCH-DEMO-01: all roles, classes, transport,
 * attendance, homework, exams/marks, fees, events, notifications, gallery, remarks,
 * appointments, registration requests. Idempotent for re-runs (cleans seed-scoped rows).
 *
 * Run from server/:  npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-full-production.ts
 */
import 'dotenv/config';
import { EventType, RegistrationStatus, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import prisma from '../src/config/database';

const DEMO_SCHOOL_CODE = 'SCH-DEMO-01';
const DEFAULT_PASSWORD = 'password123';
const ROUTE_ID = 'fullseed-route-north-001';
const SEED_TAG = '<!--fullprod-->';
const FEE_PREFIX = '[FullProd]';
const EXAM_PREFIX = '[FullProd]';

function dateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

const classSpecs = [
  { name: 'Nursery', section: 'A', room: '001' },
  { name: 'KG', section: 'A', room: '002' },
  { name: 'Grade 1', section: 'A', room: '101' },
  { name: 'Grade 1', section: 'B', room: '102' },
  { name: 'Grade 2', section: 'A', room: '103' },
  { name: 'Grade 3', section: 'A', room: '104' },
  { name: 'Grade 4', section: 'A', room: '201' },
  { name: 'Grade 5', section: 'A', room: '202' },
  { name: 'Grade 5', section: 'B', room: '203' },
  { name: 'Grade 6', section: 'A', room: '204' },
  { name: 'Grade 7', section: 'A', room: '301' },
  { name: 'Grade 8', section: 'A', room: '302' },
  { name: 'Grade 9', section: 'A', room: '303' },
  { name: 'Grade 10', section: 'A', room: '304' },
] as const;

const defaultSubjects = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies'];

type ClassKey =
  | 'nurseryA'
  | 'kgA'
  | 'g1a'
  | 'g1b'
  | 'g2a'
  | 'g3a'
  | 'g4a'
  | 'grade5A'
  | 'grade5B'
  | 'grade6A'
  | 'grade7A'
  | 'grade8A'
  | 'grade9A'
  | 'grade10A';

function classKeyFor(name: string, section: string): ClassKey {
  const n = name.toLowerCase().replace(/\s+/g, '');
  const s = section.toLowerCase();
  if (n === 'nursery' && s === 'a') return 'nurseryA';
  if (n === 'kg' && s === 'a') return 'kgA';
  if (n === 'grade1' && s === 'a') return 'g1a';
  if (n === 'grade1' && s === 'b') return 'g1b';
  if (n === 'grade2' && s === 'a') return 'g2a';
  if (n === 'grade3' && s === 'a') return 'g3a';
  if (n === 'grade4' && s === 'a') return 'g4a';
  if (n === 'grade5' && s === 'a') return 'grade5A';
  if (n === 'grade5' && s === 'b') return 'grade5B';
  if (n === 'grade6' && s === 'a') return 'grade6A';
  if (n === 'grade7' && s === 'a') return 'grade7A';
  if (n === 'grade8' && s === 'a') return 'grade8A';
  if (n === 'grade9' && s === 'a') return 'grade9A';
  if (n === 'grade10' && s === 'a') return 'grade10A';
  throw new Error(`Unknown class ${name} ${section}`);
}

async function upsertSchool() {
  const subStart = new Date();
  const subEnd = new Date();
  subEnd.setFullYear(subEnd.getFullYear() + 1);

  let school = await prisma.school.findFirst({ where: { schoolCode: DEMO_SCHOOL_CODE } });
  if (!school) {
    school = await prisma.school.create({
      data: {
        id: 'demo-school-001',
        name: 'Resonance Public School',
        schoolCode: DEMO_SCHOOL_CODE,
        address: '123 Education Lane, Delhi',
        city: 'Delhi',
        state: 'Delhi',
        zipCode: '110001',
        contactEmail: 'office@resonance.demo',
        contactPhone: '+911234567890',
        primaryColor: '#1E3FA0',
        secondaryColor: '#22C55E',
        isActive: true,
        registrationOpen: true,
        status: 'active',
        subscriptionPlan: 'premium',
        subscriptionStart: subStart,
        subscriptionEnd: subEnd,
      },
    });
    console.log('✅ School created:', school.name, '|', school.schoolCode);
  } else {
    school = await prisma.school.update({
      where: { id: school.id },
      data: {
        name: 'Resonance Public School',
        address: '123 Education Lane, Delhi',
        city: 'Delhi',
        state: 'Delhi',
        zipCode: '110001',
        contactEmail: 'office@resonance.demo',
        contactPhone: '+911234567890',
        primaryColor: '#1E3FA0',
        secondaryColor: '#22C55E',
        registrationOpen: true,
        isActive: true,
      },
    });
    console.log('✅ School updated:', school.name, '|', school.schoolCode);
  }
  return school;
}

async function ensureClasses(schoolId: string) {
  const byKey = {} as Record<ClassKey, { id: string; name: string; section: string }>;
  for (const c of classSpecs) {
    const existing = await prisma.class.findFirst({
      where: { schoolId, name: c.name, section: c.section },
    });
    const subjects = defaultSubjects as unknown as object;
    const cls =
      existing ??
      (await prisma.class.create({
        data: {
          schoolId,
          name: c.name,
          section: c.section,
          roomNumber: c.room,
          capacity: 40,
          currentStudents: 0,
          subjects,
        },
      }));
    byKey[classKeyFor(c.name, c.section)] = cls;
  }
  console.log('✅ Classes:', Object.keys(byKey).length);
  return byKey;
}

async function upsertUser(
  data: {
    email: string;
    name: string;
    role: UserRole;
    schoolId: string | null;
    phone?: string;
    passwordHash: string;
    metadata?: object;
    /** Stable id on first create (matches create-demo-users.ts) */
    fixedId?: string;
  },
) {
  const { fixedId, ...rest } = data;
  return prisma.user.upsert({
    where: { email: rest.email },
    update: {
      name: rest.name,
      role: rest.role,
      schoolId: rest.schoolId,
      phone: rest.phone,
      password: rest.passwordHash,
      status: UserStatus.ACTIVE,
      metadata: rest.metadata as object | undefined,
    },
    create: {
      ...(fixedId ? { id: fixedId } : {}),
      email: rest.email,
      name: rest.name,
      role: rest.role,
      schoolId: rest.schoolId,
      phone: rest.phone,
      password: rest.passwordHash,
      status: UserStatus.ACTIVE,
      metadata: rest.metadata as object | undefined,
    },
  });
}

async function clearSeedScopedData(params: {
  schoolId: string;
  classIds: string[];
  studentIds: string[];
  parentIds: string[];
  teacherIds: string[];
}) {
  const { schoolId, classIds, studentIds, parentIds, teacherIds } = params;

  await prisma.attendance.deleteMany({ where: { studentId: { in: studentIds } } });

  await prisma.homeworkSubmission.deleteMany({
    where: { homework: { classId: { in: classIds } }, studentId: { in: studentIds } },
  });
  await prisma.homeworkSubmission.deleteMany({
    where: { homework: { classId: { in: classIds } } },
  });
  await prisma.homework.deleteMany({ where: { classId: { in: classIds } } });

  const examsInClasses = await prisma.exam.findMany({
    where: { classId: { in: classIds } },
    select: { id: true },
  });
  const examIds = examsInClasses.map((e) => e.id);
  if (examIds.length) {
    await prisma.marks.deleteMany({ where: { examId: { in: examIds } } });
    await prisma.exam.deleteMany({ where: { id: { in: examIds } } });
  }

  const feeStructures = await prisma.feeStructure.findMany({
    where: { schoolId, name: { startsWith: FEE_PREFIX } },
    select: { id: true },
  });
  const fsIds = feeStructures.map((f) => f.id);
  if (fsIds.length) {
    await prisma.feePayment.deleteMany({ where: { feeStructureId: { in: fsIds } } });
    await prisma.feeStructure.deleteMany({ where: { id: { in: fsIds } } });
  }

  await prisma.schoolEvent.deleteMany({ where: { schoolId } });
  await prisma.notification.deleteMany({ where: { userId: { in: parentIds } } });
  await prisma.remark.deleteMany({
    where: { studentId: { in: studentIds }, teacherId: { in: teacherIds } },
  });
  await prisma.appointment.deleteMany({ where: { parentId: { in: parentIds } } });
  await prisma.registrationRequest.deleteMany({
    where: {
      schoolId,
      status: RegistrationStatus.PENDING,
      parentEmail: {
        in: ['ramesh.new@demo.com', 'sudhir.new@demo.com', 'ajay.new@demo.com'],
      },
    },
  });
  await prisma.galleryItem.deleteMany({
    where: { schoolId, caption: { startsWith: '[FullProd]' } },
  });
  // Remove every route for this school so no stale stop JSON (e.g. demo-route-north-001) hides the new route.
  await prisma.route.deleteMany({ where: { schoolId } });
  await prisma.teacherClass.deleteMany({ where: { teacherId: { in: teacherIds } } });

  console.log('🧹 Cleared previous full-seed rows for demo classes / users');
}

export async function seedFullProduction(): Promise<void> {
  console.log('🚀 Seeding full production-like data...\n');
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  const school = await upsertSchool();

  const classes = await ensureClasses(school.id);
  const grade5A = classes.grade5A;

  const admin = await upsertUser({
    email: 'admin@demo.com',
    name: 'Priya Sharma (Admin)',
    role: UserRole.ADMIN,
    schoolId: school.id,
    phone: '+911234567890',
    passwordHash,
    fixedId: 'demo-admin-001',
  });
  console.log('✅ Admin:', admin.email);

  const principal = await upsertUser({
    email: 'principal@demo.com',
    name: 'Dr. Kavita Menon (Principal)',
    role: UserRole.PRINCIPAL,
    schoolId: school.id,
    phone: '+919811100001',
    passwordHash,
  });
  console.log('✅ Principal:', principal.email);

  const office = await upsertUser({
    email: 'office@demo.com',
    name: 'Neha Gupta (Office)',
    role: UserRole.OFFICE_STAFF,
    schoolId: school.id,
    phone: '+919811100002',
    passwordHash,
  });
  console.log('✅ Office staff:', office.email);

  const teacherLegacy = await upsertUser({
    email: 'teacher@demo.com',
    name: 'John Teacher',
    role: UserRole.TEACHER,
    schoolId: school.id,
    phone: '+919811100003',
    passwordHash,
    fixedId: 'demo-teacher-001',
  });

  const teacherRows = [
    { email: 'priya@demo.com', name: 'Priya Sharma', subject: 'Mathematics', classKey: 'grade5A' as const },
    { email: 'rahul@demo.com', name: 'Rahul Verma', subject: 'Science', classKey: 'grade5B' as const },
    { email: 'anita@demo.com', name: 'Anita Patel', subject: 'English', classKey: 'grade6A' as const },
    { email: 'suresh@demo.com', name: 'Suresh Kumar', subject: 'Hindi', classKey: 'grade7A' as const },
    { email: 'meena@demo.com', name: 'Meena Joshi', subject: 'Social Studies', classKey: 'grade8A' as const },
  ];

  const teachers: { id: string; email: string; subject: string; classId: string }[] = [];
  for (const t of teacherRows) {
    const u = await upsertUser({
      email: t.email,
      name: t.name,
      role: UserRole.TEACHER,
      schoolId: school.id,
      phone: `+9198${String(Math.floor(10000000 + Math.random() * 89999999))}`,
      passwordHash,
    });
    teachers.push({ id: u.id, email: u.email, subject: t.subject, classId: classes[t.classKey].id });
  }
  console.log('✅ Teachers:', teachers.length + 1, '(incl. teacher@demo.com)');

  const busHelper = await upsertUser({
    email: 'bushelper@demo.com',
    name: 'Ram Kumar (Driver)',
    role: UserRole.BUS_HELPER,
    schoolId: school.id,
    phone: '+919876543210',
    passwordHash,
  });
  console.log('✅ Bus helper:', busHelper.email);

  type StudentRow = {
    student: { name: string; email: string };
    parent: { name: string; email: string };
    classKey: ClassKey;
  };

  const studentData: StudentRow[] = [
    { student: { name: 'Aarav Singh', email: 'student@demo.com' }, parent: { name: 'Rajesh Singh', email: 'parent@demo.com' }, classKey: 'grade5A' },
    { student: { name: 'Diya Patel', email: 'diya@student.demo.com' }, parent: { name: 'Amit Patel', email: 'amit.parent@demo.com' }, classKey: 'grade5A' },
    { student: { name: 'Arjun Sharma', email: 'arjun@student.demo.com' }, parent: { name: 'Vikram Sharma', email: 'vikram.parent@demo.com' }, classKey: 'grade5A' },
    { student: { name: 'Kavya Nair', email: 'kavya@student.demo.com' }, parent: { name: 'Sunil Nair', email: 'sunil.parent@demo.com' }, classKey: 'grade5A' },
    { student: { name: 'Rohan Gupta', email: 'rohan@student.demo.com' }, parent: { name: 'Sanjay Gupta', email: 'sanjay.parent@demo.com' }, classKey: 'grade5A' },
    { student: { name: 'Ishaan Mehta', email: 'ishaan@student.demo.com' }, parent: { name: 'Nitin Mehta', email: 'nitin.parent@demo.com' }, classKey: 'grade5B' },
    { student: { name: 'Ananya Kumar', email: 'ananya@student.demo.com' }, parent: { name: 'Deepak Kumar', email: 'deepak.parent@demo.com' }, classKey: 'grade5B' },
    { student: { name: 'Vivaan Joshi', email: 'vivaan@student.demo.com' }, parent: { name: 'Prakash Joshi', email: 'prakash.parent@demo.com' }, classKey: 'grade6A' },
    { student: { name: 'Aisha Khan', email: 'aisha@student.demo.com' }, parent: { name: 'Imran Khan', email: 'imran.parent@demo.com' }, classKey: 'grade6A' },
    { student: { name: 'Riya Kapoor', email: 'riya@student.demo.com' }, parent: { name: 'Rohit Kapoor', email: 'rohit.parent@demo.com' }, classKey: 'grade7A' },
  ];

  const students: {
    id: string;
    name: string;
    email: string;
    classId: string;
    parentId: string;
    parentEmail: string;
  }[] = [];

  for (const sd of studentData) {
    const classId = classes[sd.classKey].id;
    const parent = await upsertUser({
      email: sd.parent.email,
      name: sd.parent.name,
      role: UserRole.PARENT,
      schoolId: school.id,
      phone: `+9197${String(Math.floor(10000000 + Math.random() * 89999999))}`,
      passwordHash,
      ...(sd.parent.email === 'parent@demo.com' ? { fixedId: 'demo-parent-001' } : {}),
    });
    const student = await upsertUser({
      email: sd.student.email,
      name: sd.student.name,
      role: UserRole.STUDENT,
      schoolId: school.id,
      passwordHash,
      metadata: { classId },
      ...(sd.student.email === 'student@demo.com' ? { fixedId: 'demo-student-001' } : {}),
    });
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
    students.push({
      id: student.id,
      name: student.name,
      email: student.email,
      classId,
      parentId: parent.id,
      parentEmail: parent.email,
    });
  }
  console.log('✅ Students + parents:', students.length);

  const classIds = Object.values(classes).map((c) => c.id);
  const studentIds = students.map((s) => s.id);
  const parentIds = [...new Set(students.map((s) => s.parentId))];
  const teacherIds = [teacherLegacy.id, ...teachers.map((t) => t.id)];

  await clearSeedScopedData({ schoolId: school.id, classIds, studentIds, parentIds, teacherIds });

  for (const t of teachers) {
    await prisma.teacherClass.create({
      data: {
        teacherId: t.id,
        classId: t.classId,
        subject: t.subject,
        isClassTeacher: true,
      },
    });
  }
  const legacyClass10 = await prisma.class.findFirst({
    where: { schoolId: school.id, name: 'Class 10-A', section: 'A' },
  });
  if (legacyClass10) {
    await prisma.teacherClass.create({
      data: {
        teacherId: teacherLegacy.id,
        classId: legacyClass10.id,
        subject: 'Mathematics',
        isClassTeacher: true,
      },
    });
  }
  console.log('✅ Teacher–class links:', teachers.length + (legacyClass10 ? 1 : 0));

  const primaryTeacherId = teachers.find((t) => t.email === 'priya@demo.com')?.id ?? teachers[0].id;

  await prisma.class.update({
    where: { id: grade5A.id },
    data: {
      schedule: {
        periods: [
          { day: 'Monday', time: '08:00', subject: 'Mathematics', teacherId: primaryTeacherId },
          { day: 'Monday', time: '09:00', subject: 'Science', teacherId: teachers.find((x) => x.email === 'rahul@demo.com')?.id },
          { day: 'Tuesday', time: '08:00', subject: 'Mathematics', teacherId: primaryTeacherId },
          { day: 'Wednesday', time: '08:00', subject: 'English', teacherId: teachers.find((x) => x.email === 'anita@demo.com')?.id },
          { day: 'Thursday', time: '08:00', subject: 'Hindi', teacherId: teachers.find((x) => x.email === 'suresh@demo.com')?.id },
          { day: 'Friday', time: '08:00', subject: 'Social Studies', teacherId: teachers.find((x) => x.email === 'meena@demo.com')?.id },
        ],
      } as object,
    },
  });
  console.log('✅ Grade 5A schedule JSON updated');

  const grade5AEmails = studentData.filter((r) => r.classKey === 'grade5A').map((r) => r.student.email);
  const grade5AFromDb = await prisma.user.findMany({
    where: { schoolId: school.id, role: UserRole.STUDENT, email: { in: grade5AEmails } },
  });
  const byEmail = new Map(grade5AFromDb.map((u) => [u.email, u]));
  const grade5AStudentsOrdered = grade5AEmails.map((e) => byEmail.get(e)).filter(Boolean) as { id: string; name: string }[];

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
      students: grade5AStudentsOrdered.slice(0, 3).map((s) => ({ id: s.id, name: s.name })),
    },
    {
      id: 'stop-4',
      name: 'Tilak Nagar',
      address: 'Tilak Nagar',
      latitude: 28.6421,
      longitude: 77.1027,
      sequence: 4,
      estimatedTime: '08:00',
      students: grade5AStudentsOrdered.slice(3).map((s) => ({ id: s.id, name: s.name })),
    },
    { id: 'stop-5', name: 'School Gate', address: 'School', latitude: 28.635, longitude: 77.115, sequence: 5, estimatedTime: '08:30', students: [] as { id: string; name: string }[] },
  ];

  await prisma.route.create({
    data: {
      id: ROUTE_ID,
      schoolId: school.id,
      name: 'Route 1 - North Zone',
      busNumber: 'DL 01 AB 1234',
      helperId: busHelper.id,
      helperName: busHelper.name,
      helperPhone: busHelper.phone ?? '+919876543210',
      startTime: '07:30',
      endTime: '08:30',
      status: 'active',
      stops: stops as object,
    },
  });
  console.log('✅ Bus route created');

  const schoolDays: Date[] = [];
  for (let i = 1; i <= 50 && schoolDays.length < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (d.getDay() !== 0 && d.getDay() !== 6) schoolDays.push(dateOnly(d));
  }

  for (const student of students) {
    for (const day of schoolDays) {
      const rand = Math.random();
      const status = rand > 0.12 ? 'present' : rand > 0.05 ? 'late' : 'absent';
      await prisma.attendance.upsert({
        where: { studentId_date: { studentId: student.id, date: day } },
        create: {
          studentId: student.id,
          classId: student.classId,
          teacherId: primaryTeacherId,
          date: day,
          status,
        },
        update: { status, classId: student.classId, teacherId: primaryTeacherId },
      });
    }
  }
  console.log('✅ Attendance: ~30 days ×', students.length, 'students');

  const hwSpecs = [
    { title: 'Chapter 5 — Fractions', subject: 'Mathematics', days: 3, classKey: 'grade5A' as const, teacherEmail: 'priya@demo.com' },
    { title: 'Solar System Essay', subject: 'Science', days: 5, classKey: 'grade5A' as const, teacherEmail: 'rahul@demo.com' },
    { title: 'Grammar Worksheet pg 45', subject: 'English', days: -2, classKey: 'grade5A' as const, teacherEmail: 'anita@demo.com' },
    { title: 'Map Work — States of India', subject: 'Social Studies', days: 7, classKey: 'grade5A' as const, teacherEmail: 'meena@demo.com' },
    { title: 'Hindi Poem Recitation', subject: 'Hindi', days: 4, classKey: 'grade5A' as const, teacherEmail: 'suresh@demo.com' },
    { title: 'Algebra Practice Set', subject: 'Mathematics', days: 6, classKey: 'grade5B' as const, teacherEmail: 'priya@demo.com' },
    { title: 'Photosynthesis Diagram', subject: 'Science', days: 3, classKey: 'grade6A' as const, teacherEmail: 'rahul@demo.com' },
    { title: 'Essay — My Favourite Book', subject: 'English', days: 8, classKey: 'grade6A' as const, teacherEmail: 'anita@demo.com' },
  ];

  const homeworkList: { id: string; classId: string }[] = [];
  for (const hw of hwSpecs) {
    const tid = teachers.find((t) => t.email === hw.teacherEmail)?.id ?? primaryTeacherId;
    const h = await prisma.homework.create({
      data: {
        title: hw.title,
        subject: hw.subject,
        description: `${SEED_TAG} Complete ${hw.title} and submit by the due date.`,
        classId: classes[hw.classKey].id,
        dueDate: new Date(Date.now() + hw.days * 86400000),
        teacherId: tid,
      },
    });
    homeworkList.push(h);
  }

  const grade5AHomework = homeworkList.filter((h) => h.classId === grade5A.id);
  const grade5AStudents = students.filter((s) => s.classId === grade5A.id);
  for (const student of grade5AStudents) {
    for (const hw of grade5AHomework) {
      if (Math.random() > 0.3) {
        await prisma.homeworkSubmission.upsert({
          where: { homeworkId_studentId: { homeworkId: hw.id, studentId: student.id } },
          create: {
            homeworkId: hw.id,
            studentId: student.id,
            status: 'SUBMITTED',
            submittedAt: new Date(),
          },
          update: { status: 'SUBMITTED', submittedAt: new Date() },
        });
      } else if (Math.random() > 0.5) {
        await prisma.homeworkSubmission.upsert({
          where: { homeworkId_studentId: { homeworkId: hw.id, studentId: student.id } },
          create: { homeworkId: hw.id, studentId: student.id, status: 'PENDING' },
          update: { status: 'PENDING' },
        });
      }
    }
  }
  console.log('✅ Homework:', homeworkList.length, 'assignments (+ submissions for 5A)');

  const subjects = defaultSubjects;
  const examTypes = ['MIDTERM', 'QUIZ', 'ASSIGNMENT'] as const;
  const studentsByClass = new Map<string, typeof students>();
  for (const s of students) {
    const g = studentsByClass.get(s.classId) ?? [];
    g.push(s);
    studentsByClass.set(s.classId, g);
  }
  for (const [classId, group] of studentsByClass) {
    for (const subject of subjects) {
      for (const examType of examTypes) {
        const exam = await prisma.exam.create({
          data: {
            classId,
            name: `${EXAM_PREFIX} ${subject} ${examType}`,
            subject,
            examType,
            date: dateOnly(new Date(Date.now() - Math.floor(Math.random() * 60) * 86400000)),
            maxMarks: 100,
            passingMarks: 35,
          },
        });
        for (const student of group) {
          await prisma.marks.create({
            data: {
              examId: exam.id,
              studentId: student.id,
              teacherId: primaryTeacherId,
              marksObtained: Math.floor(55 + Math.random() * 45),
            },
          });
        }
      }
    }
  }
  console.log('✅ Marks: per-class exams (5 subjects × 3 types) × students in each class');

  const feeDefs: (
    | { name: string; amount: number; paid: true; paidDaysAgo: number }
    | { name: string; amount: number; paid: false; dueDaysFromNow: number }
  )[] = [
    { name: `${FEE_PREFIX} Term 1 Tuition Fee`, amount: 25000, paid: true, paidDaysAgo: 60 },
    { name: `${FEE_PREFIX} Term 2 Tuition Fee`, amount: 25000, paid: false, dueDaysFromNow: 30 },
    { name: `${FEE_PREFIX} Transport Fee`, amount: 8000, paid: true, paidDaysAgo: 45 },
    { name: `${FEE_PREFIX} Library Fee`, amount: 2000, paid: false, dueDaysFromNow: -15 },
    { name: `${FEE_PREFIX} Annual Sports Fee`, amount: 3000, paid: false, dueDaysFromNow: 60 },
    { name: `${FEE_PREFIX} Computer Lab Fee`, amount: 1500, paid: true, paidDaysAgo: 90 },
  ];

  const feeStructureRows: { id: string; paid: boolean; amount: number; paidDaysAgo?: number }[] = [];
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
    feeStructureRows.push({
      id: structure.id,
      paid: f.paid,
      amount: f.amount,
      paidDaysAgo: f.paid ? f.paidDaysAgo : undefined,
    });
  }

  for (const student of students) {
    for (const fs of feeStructureRows) {
      let paid = fs.paid;
      if (!paid && Math.random() > 0.75) paid = true;
      if (paid) {
        await prisma.feePayment.create({
          data: {
            feeStructureId: fs.id,
            studentId: student.id,
            amountPaid: fs.amount,
            paidAt: new Date(Date.now() - (fs.paidDaysAgo ?? 30) * 86400000),
            paymentMethod: 'UPI',
            reference: `FULLSEED-${student.id.slice(0, 6)}`,
          },
        });
      }
    }
  }
  console.log('✅ Fees:', feeDefs.length, 'structures ×', students.length, 'students');

  const eventData: { title: string; description: string; date: string; type: EventType }[] = [
    { title: 'Holi Celebration', description: 'School Holi celebration with colors and sweets', date: '2026-03-25', type: EventType.HOLIDAY },
    { title: 'Parent-Teacher Meeting', description: 'Quarterly PTM — all parents must attend', date: '2026-04-10', type: EventType.MEETING },
    { title: 'Mid-Term Exams Begin', description: 'Mid-term examinations for Grade 5-10', date: '2026-04-14', type: EventType.EXAM },
    { title: 'Annual Sports Day', description: 'Annual sports day — all students participate', date: '2026-04-18', type: EventType.EVENT },
    { title: 'Science Exhibition', description: 'Annual science project exhibition by students', date: '2026-04-22', type: EventType.EVENT },
    { title: 'Summer Break Begins', description: 'School closes for summer vacation', date: '2026-05-01', type: EventType.HOLIDAY },
    { title: 'Republic Day', description: 'Republic Day celebration in school ground', date: '2026-01-26', type: EventType.HOLIDAY },
    { title: 'Annual Day', description: 'School annual day — cultural performances', date: '2026-03-15', type: EventType.EVENT },
  ];
  for (const e of eventData) {
    await prisma.schoolEvent.create({
      data: {
        schoolId: school.id,
        title: e.title,
        description: e.description,
        date: dateOnly(new Date(e.date)),
        type: e.type,
        createdBy: admin.id,
      },
    });
  }
  console.log('✅ School events:', eventData.length);

  const channels = ['in_app'] as object;
  const notifData = [
    { title: 'Fee Payment Reminder', body: 'Term 2 Tuition Fee of ₹25,000 is due in 30 days. Please pay at the school office or contact admin.', category: 'fees' },
    { title: 'PTM Scheduled', body: 'Parent-Teacher Meeting is scheduled for April 10th at 10:00 AM. Your presence is mandatory.', category: 'announcement' },
    { title: 'Exam Schedule Released', body: 'Mid-term exam schedule for April has been released. Check the calendar for subject-wise dates.', category: 'marks' },
    { title: 'Sports Day Registration', body: 'Register your child for Annual Sports Day events. Registration closes April 12th.', category: 'announcement' },
    { title: 'Library Books Due', body: 'Library books issued last month are due for return. Please ensure your child returns them.', category: 'announcement' },
    { title: 'Attendance Alert', body: 'Your child was marked absent on multiple days this month. Please ensure regular attendance.', category: 'attendance' },
  ];
  for (const parentId of parentIds) {
    for (const n of notifData) {
      await prisma.notification.create({
        data: {
          userId: parentId,
          title: n.title,
          body: n.body,
          category: n.category,
          channels,
          priority: 'normal',
          status: 'delivered',
        },
      });
    }
  }
  console.log('✅ Notifications:', notifData.length, '×', parentIds.length, 'parents');

  const remarkData = [
    { category: 'academic', remarkType: 'POSITIVE', content: 'Excellent improvement in Mathematics. Keep up the great work!' },
    { category: 'behavior', remarkType: 'POSITIVE', content: 'Very active in class discussions. Shows great curiosity.' },
    { category: 'homework', remarkType: 'CONCERN', content: 'Missing homework submissions this week. Please ensure timely completion.' },
    { category: 'academic', remarkType: 'NEUTRAL', content: 'Participates well but needs to improve written work quality.' },
    { category: 'attendance', remarkType: 'CONCERN', content: 'Attendance has been irregular. Please ensure regular school attendance.' },
  ];
  for (let i = 0; i < Math.min(students.length, 5); i++) {
    const r = remarkData[i % remarkData.length];
    await prisma.remark.create({
      data: {
        studentId: students[i].id,
        teacherId: teacherIds[i % teacherIds.length],
        category: r.category,
        remarkType: r.remarkType,
        content: r.content,
      },
    });
  }
  console.log('✅ Remarks:', Math.min(students.length, 5));

  const times = ['09:00', '10:00', '11:00', '14:00'];
  for (const student of students.slice(0, 4)) {
    await prisma.appointment.create({
      data: {
        parentId: student.parentId,
        studentId: student.id,
        requestedDate: new Date(Date.now() + Math.floor(3 + Math.random() * 14) * 86400000),
        requestedTime: times[Math.floor(Math.random() * times.length)],
        duration: 30,
        reason: 'Academic progress discussion',
        status: 'pending',
        assignedTo: 'teacher',
        assignedPersonId: primaryTeacherId,
      },
    });
  }
  console.log('✅ Appointments: up to 4');

  const galleryItems = [
    { title: 'Annual Sports Day 2025', url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', category: 'sports' },
    { title: 'Science Exhibition', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800', category: 'academic' },
    { title: 'Republic Day Celebration', url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800', category: 'events' },
    { title: 'Classroom Activities', url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800', category: 'academic' },
    { title: 'School Library', url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800', category: 'facilities' },
    { title: 'Morning Assembly', url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800', category: 'events' },
    { title: 'Art & Craft', url: 'https://images.unsplash.com/photo-1460518451285-97b6aa326961?w=800', category: 'activities' },
    { title: 'Computer Lab', url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800', category: 'facilities' },
  ];
  for (const item of galleryItems) {
    await prisma.galleryItem.create({
      data: {
        schoolId: school.id,
        uploadedBy: admin.id,
        type: 'image',
        url: item.url,
        thumbnailUrl: item.url,
        caption: `[FullProd] ${item.title} · ${item.category}`,
        event: item.title,
        fileSize: BigInt(180000),
        visibility: 'public',
      },
    });
  }
  console.log('✅ Gallery:', galleryItems.length);

  const pendingRequests = [
    { studentName: 'Aditya Sharma', className: 'Grade 5 - A', parentName: 'Ramesh Sharma', parentEmail: 'ramesh.new@demo.com', parentPhone: '+919811234567' },
    { studentName: 'Priya Verma', className: 'Grade 6 - A', parentName: 'Sudhir Verma', parentEmail: 'sudhir.new@demo.com', parentPhone: '+919822345678' },
    { studentName: 'Karan Mehta', className: 'Grade 4 - A', parentName: 'Ajay Mehta', parentEmail: 'ajay.new@demo.com', parentPhone: '+919833456789' },
  ];
  for (const req of pendingRequests) {
    await prisma.registrationRequest.create({
      data: {
        schoolId: school.id,
        studentName: req.studentName,
        className: req.className,
        parentName: req.parentName,
        parentEmail: req.parentEmail,
        parentPhone: req.parentPhone,
        status: RegistrationStatus.PENDING,
        password: passwordHash,
      },
    });
  }
  console.log('✅ Pending registration requests:', pendingRequests.length);

  console.log('\n🎉 Full production-like data seeded!\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🏫  School:      Resonance Public School (' + DEMO_SCHOOL_CODE + ')');
  console.log('───────────────────────────────────────────────────────');
  console.log('👤  Admin:       admin@demo.com         / ' + DEFAULT_PASSWORD);
  console.log('👤  Principal:  principal@demo.com    / ' + DEFAULT_PASSWORD);
  console.log('👤  Office:      office@demo.com       / ' + DEFAULT_PASSWORD);
  console.log('👩‍🏫  Teachers:    teacher@demo.com, priya@demo.com, rahul@demo.com, … / ' + DEFAULT_PASSWORD);
  console.log('👨‍👩‍👧  Parent:      parent@demo.com        / ' + DEFAULT_PASSWORD);
  console.log('              (child: Aarav Singh, Grade 5 A)');
  console.log('🎓  Student:     student@demo.com       / ' + DEFAULT_PASSWORD);
  console.log('🚌  Bus helper:  bushelper@demo.com    / ' + DEFAULT_PASSWORD);
  console.log('───────────────────────────────────────────────────────');
  console.log('📊  Data: classes, teachers, 10 families, attendance, homework,');
  console.log('         exams/marks, fees, events, notifications, gallery,');
  console.log('         bus route, remarks, appointments, registration queue.');
  console.log('   (No Message / ClassPeriod models in schema — skipped.)');
  console.log('═══════════════════════════════════════════════════════');
}

async function main() {
  try {
    await seedFullProduction();
  } catch (e: unknown) {
    const err = e as Error;
    console.error('❌ Error:', err.message, err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void main();
}
