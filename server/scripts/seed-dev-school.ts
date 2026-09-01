/**
 * Isolated developer school (SCH-DEV-01) — never touches demo-school-001 data.
 * Idempotent: safe to re-run (upsert + dev-scoped cleanup).
 *
 * Run from server/:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-dev-school.ts
 */
import 'dotenv/config';
import { EventType, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import prisma from '../src/config/database';

const DEV_SCHOOL_ID = 'dev-school-001';
const DEV_SCHOOL_CODE = 'SCH-DEV-01';
const DEV_PASSWORD = 'DevTest@2026';
const SEED_TAG = '<!--devschool-->';

const DEFAULT_SUBJECTS = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies'];
const EXAM_TYPES = ['MIDTERM', 'QUIZ', 'ASSIGNMENT'] as const;

const PRIMARY_DEV_EMAILS = [
  'dev.parent@sc.dev',
  'dev.teacher@sc.dev',
  'dev.admin@sc.dev',
  'dev.principal@sc.dev',
  'dev.bus@sc.dev',
] as const;

const CLASS_SPECS = [
  { id: 'dev-class-g1a', name: 'Grade 1', section: 'A', room: '101', studentNums: [1, 2, 3, 4, 5] },
  { id: 'dev-class-g2a', name: 'Grade 2', section: 'A', room: '102', studentNums: [6, 7, 8, 9, 10] },
  { id: 'dev-class-g5a', name: 'Grade 5', section: 'A', room: '201', studentNums: [11, 12, 13, 14, 15] },
  { id: 'dev-class-g5b', name: 'Grade 5', section: 'B', room: '202', studentNums: [16, 17, 18, 19, 20] },
] as const;

function dateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function schoolDays(count: number): Date[] {
  const days: Date[] = [];
  for (let i = 1; days.length < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (d.getDay() !== 0 && d.getDay() !== 6) days.push(dateOnly(d));
  }
  return days;
}

function attendanceStatus(studentIdx: number, dayIdx: number): string {
  const bucket = (studentIdx * 17 + dayIdx * 13) % 100;
  if (bucket < 88) return 'present';
  if (bucket < 95) return 'absent';
  return 'late';
}

async function upsertUser(data: {
  email: string;
  name: string;
  role: UserRole;
  schoolId: string;
  passwordHash: string;
  metadata?: object;
  fixedId?: string;
}) {
  const { fixedId, ...rest } = data;
  return prisma.user.upsert({
    where: { email: rest.email },
    update: {
      name: rest.name,
      role: rest.role,
      schoolId: rest.schoolId,
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
      password: rest.passwordHash,
      status: UserStatus.ACTIVE,
      metadata: rest.metadata as object | undefined,
    },
  });
}

async function upsertSchool() {
  console.log('🏫 Upserting dev school…');
  const subStart = new Date();
  const subEnd = new Date();
  subEnd.setFullYear(subEnd.getFullYear() + 1);

  const school = await prisma.school.upsert({
    where: { id: DEV_SCHOOL_ID },
    update: {
      name: 'Dev Test School',
      schoolCode: DEV_SCHOOL_CODE,
      address: '1 Developer Lane',
      city: 'Bengaluru',
      state: 'Karnataka',
      zipCode: '560001',
      contactEmail: 'dev-office@sc.dev',
      contactPhone: '+919900000001',
      primaryColor: '#1E3FA0',
      secondaryColor: '#3B82F6',
      isActive: true,
      registrationOpen: true,
      status: 'active',
    },
    create: {
      id: DEV_SCHOOL_ID,
      name: 'Dev Test School',
      schoolCode: DEV_SCHOOL_CODE,
      address: '1 Developer Lane',
      city: 'Bengaluru',
      state: 'Karnataka',
      zipCode: '560001',
      contactEmail: 'dev-office@sc.dev',
      contactPhone: '+919900000001',
      primaryColor: '#1E3FA0',
      secondaryColor: '#3B82F6',
      isActive: true,
      registrationOpen: true,
      status: 'active',
      subscriptionPlan: 'premium',
      subscriptionStart: subStart,
      subscriptionEnd: subEnd,
    },
  });
  console.log(`   ✅ ${school.name} (${school.schoolCode})\n`);
  return school;
}

async function clearDevSchoolSeedData(classIds: string[], teacherIds: string[]) {
  console.log('🧹 Clearing previous dev-school seed rows (scoped to dev-school-001 only)…');

  const devStudents = await prisma.user.findMany({
    where: { schoolId: DEV_SCHOOL_ID, role: UserRole.STUDENT, email: { endsWith: '@sc.dev' } },
    select: { id: true },
  });
  const studentIds = devStudents.map((s) => s.id);

  if (studentIds.length) {
    await prisma.attendance.deleteMany({ where: { studentId: { in: studentIds } } });
    await prisma.homeworkSubmission.deleteMany({ where: { studentId: { in: studentIds } } });
    await prisma.marks.deleteMany({ where: { studentId: { in: studentIds } } });
    await prisma.feePayment.deleteMany({
      where: { studentId: { in: studentIds }, reference: { startsWith: 'DEV-SCHOOL-' } },
    });
    await prisma.remark.deleteMany({
      where: { studentId: { in: studentIds }, content: { contains: SEED_TAG } },
    });
  }

  if (classIds.length) {
    await prisma.homework.deleteMany({ where: { classId: { in: classIds }, description: { contains: SEED_TAG } } });
    const exams = await prisma.exam.findMany({
      where: { classId: { in: classIds }, name: { startsWith: '[DevSchool]' } },
      select: { id: true },
    });
    if (exams.length) {
      await prisma.marks.deleteMany({ where: { examId: { in: exams.map((e) => e.id) } } });
      await prisma.exam.deleteMany({ where: { id: { in: exams.map((e) => e.id) } } });
    }
  }

  await prisma.feeStructure.deleteMany({
    where: { schoolId: DEV_SCHOOL_ID, name: { startsWith: '[DevSchool]' } },
  });
  await prisma.schoolEvent.deleteMany({
    where: { schoolId: DEV_SCHOOL_ID, description: { contains: SEED_TAG } },
  });
  await prisma.announcement.deleteMany({
    where: { schoolId: DEV_SCHOOL_ID, message: { contains: SEED_TAG } },
  });
  await prisma.route.deleteMany({ where: { schoolId: DEV_SCHOOL_ID, id: 'dev-route-001' } });

  if (teacherIds.length) {
    await prisma.teacherClass.deleteMany({
      where: {
        teacherId: { in: teacherIds },
        class: { schoolId: DEV_SCHOOL_ID },
      },
    });
  }

  console.log('   ✅ Dev-school scoped cleanup done\n');
}

async function migratePrimaryDevAccounts(passwordHash: string) {
  console.log('👤 Moving primary dev accounts to dev-school-001…');

  for (const email of PRIMARY_DEV_EMAILS) {
    const user = await prisma.user.upsert({
      where: { email },
      update: { schoolId: DEV_SCHOOL_ID, status: UserStatus.ACTIVE, password: passwordHash },
      create: {
        email,
        name: email.split('@')[0].replace(/\./g, ' '),
        role:
          email === 'dev.parent@sc.dev'
            ? UserRole.PARENT
            : email === 'dev.teacher@sc.dev'
              ? UserRole.TEACHER
              : email === 'dev.admin@sc.dev'
                ? UserRole.ADMIN
                : email === 'dev.principal@sc.dev'
                  ? UserRole.PRINCIPAL
                  : UserRole.BUS_HELPER,
        schoolId: DEV_SCHOOL_ID,
        password: passwordHash,
        status: UserStatus.ACTIVE,
      },
    });
    console.log(`   ✅ ${email} → ${DEV_SCHOOL_ID} (${user.id})`);
  }

  const devParent = await prisma.user.findUnique({ where: { email: 'dev.parent@sc.dev' } });
  const devTeacher = await prisma.user.findUnique({ where: { email: 'dev.teacher@sc.dev' } });

  if (devParent) {
    const staleLinks = await prisma.parentStudent.findMany({
      where: { parentId: devParent.id },
      include: { student: { select: { schoolId: true, email: true } } },
    });
    for (const link of staleLinks) {
      if (link.student.schoolId !== DEV_SCHOOL_ID) {
        await prisma.parentStudent.delete({ where: { id: link.id } });
        console.log(`   🗑️  Removed cross-school ParentStudent → ${link.student.email}`);
      }
    }
  }

  if (devTeacher) {
    const staleTc = await prisma.teacherClass.findMany({
      where: { teacherId: devTeacher.id },
      include: { class: { select: { schoolId: true, name: true, section: true } } },
    });
    for (const tc of staleTc) {
      if (tc.class.schoolId !== DEV_SCHOOL_ID) {
        await prisma.teacherClass.delete({ where: { id: tc.id } });
        console.log(`   🗑️  Removed cross-school TeacherClass → ${tc.class.name} ${tc.class.section}`);
      }
    }
  }

  console.log('');
}

async function upsertClasses() {
  console.log('📚 Upserting classes…');
  const subjects = DEFAULT_SUBJECTS as unknown as object;
  const byKey = new Map<string, { id: string; name: string; section: string }>();

  for (const spec of CLASS_SPECS) {
    const cls = await prisma.class.upsert({
      where: { id: spec.id },
      update: {
        schoolId: DEV_SCHOOL_ID,
        name: spec.name,
        section: spec.section,
        roomNumber: spec.room,
        capacity: 40,
        subjects,
      },
      create: {
        id: spec.id,
        schoolId: DEV_SCHOOL_ID,
        name: spec.name,
        section: spec.section,
        roomNumber: spec.room,
        capacity: 40,
        currentStudents: spec.studentNums.length,
        subjects,
      },
    });
    byKey.set(spec.id, cls);
    console.log(`   ✅ ${cls.name} ${cls.section} (${cls.id})`);
  }
  console.log('');
  return byKey;
}

type StudentRow = { id: string; name: string; email: string; classId: string; parentId: string; num: number };

async function upsertStudentsAndParents(passwordHash: string): Promise<StudentRow[]> {
  console.log('🎓 Upserting 20 students + 20 parents…');
  const students: StudentRow[] = [];

  for (const spec of CLASS_SPECS) {
    for (const num of spec.studentNums) {
      const studentEmail = `dev.student${num}@sc.dev`;
      const parentEmail = `dev.parent${num}@sc.dev`;
      const studentName = `Dev Student ${num}`;
      const parentName = `Dev Parent ${num}`;

      const parent = await upsertUser({
        email: parentEmail,
        name: parentName,
        role: UserRole.PARENT,
        schoolId: DEV_SCHOOL_ID,
        passwordHash,
        fixedId: `dev-parent-user-${String(num).padStart(2, '0')}`,
      });

      const student = await upsertUser({
        email: studentEmail,
        name: studentName,
        role: UserRole.STUDENT,
        schoolId: DEV_SCHOOL_ID,
        passwordHash,
        metadata: { classId: spec.id },
        fixedId: `dev-student-user-${String(num).padStart(2, '0')}`,
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
        classId: spec.id,
        parentId: parent.id,
        num,
      });
    }
  }

  console.log(`   ✅ ${students.length} student–parent pairs\n`);
  return students;
}

async function upsertTeachers(passwordHash: string, adminId: string) {
  console.log('👩‍🏫 Upserting teachers…');
  const teachers: { id: string; email: string }[] = [];

  const primaryTeacher = await upsertUser({
    email: 'dev.teacher@sc.dev',
    name: 'Dev Teacher',
    role: UserRole.TEACHER,
    schoolId: DEV_SCHOOL_ID,
    passwordHash,
  });
  teachers.push({ id: primaryTeacher.id, email: primaryTeacher.email });
  console.log(`   ✅ ${primaryTeacher.email}`);

  for (let i = 1; i <= 4; i++) {
    const t = await upsertUser({
      email: `dev.teacher${i}@sc.dev`,
      name: `Dev Teacher ${i}`,
      role: UserRole.TEACHER,
      schoolId: DEV_SCHOOL_ID,
      passwordHash,
      fixedId: `dev-teacher-user-${i}`,
    });
    teachers.push({ id: t.id, email: t.email });
    console.log(`   ✅ ${t.email}`);
  }

  const teacherByEmail = new Map(teachers.map((t) => [t.email, t.id]));
  const g1a = 'dev-class-g1a';
  const g2a = 'dev-class-g2a';
  const g5a = 'dev-class-g5a';
  const g5b = 'dev-class-g5b';

  const assignments: { teacherEmail: string; classId: string; subject: string; isClassTeacher: boolean }[] = [
    { teacherEmail: 'dev.teacher@sc.dev', classId: g5a, subject: 'Mathematics', isClassTeacher: true },
    { teacherEmail: 'dev.teacher@sc.dev', classId: g5b, subject: 'Science', isClassTeacher: false },
    { teacherEmail: 'dev.teacher1@sc.dev', classId: g1a, subject: 'Mathematics', isClassTeacher: true },
    { teacherEmail: 'dev.teacher1@sc.dev', classId: g1a, subject: 'English', isClassTeacher: false },
    { teacherEmail: 'dev.teacher2@sc.dev', classId: g2a, subject: 'Mathematics', isClassTeacher: true },
    { teacherEmail: 'dev.teacher2@sc.dev', classId: g2a, subject: 'Science', isClassTeacher: false },
    { teacherEmail: 'dev.teacher3@sc.dev', classId: g5a, subject: 'English', isClassTeacher: false },
    { teacherEmail: 'dev.teacher3@sc.dev', classId: g5a, subject: 'Hindi', isClassTeacher: false },
    { teacherEmail: 'dev.teacher4@sc.dev', classId: g5b, subject: 'Social Studies', isClassTeacher: true },
    { teacherEmail: 'dev.teacher4@sc.dev', classId: g5b, subject: 'Hindi', isClassTeacher: false },
  ];

  for (const a of assignments) {
    const teacherId = teacherByEmail.get(a.teacherEmail)!;
    await prisma.teacherClass.upsert({
      where: {
        teacherId_classId_subject: { teacherId, classId: a.classId, subject: a.subject },
      },
      update: { isClassTeacher: a.isClassTeacher },
      create: {
        teacherId,
        classId: a.classId,
        subject: a.subject,
        isClassTeacher: a.isClassTeacher,
      },
    });
  }

  console.log(`   ✅ ${assignments.length} TeacherClass rows\n`);
  return { teachers, primaryTeacherId: primaryTeacher.id, adminId };
}

async function seedAttendance(students: StudentRow[], primaryTeacherId: string) {
  console.log('📅 Seeding attendance (30 school days)…');
  const days = schoolDays(30);
  let count = 0;

  for (let si = 0; si < students.length; si++) {
    const s = students[si];
    for (let di = 0; di < days.length; di++) {
      const status = attendanceStatus(si, di);
      await prisma.attendance.upsert({
        where: { studentId_date: { studentId: s.id, date: days[di] } },
        create: {
          studentId: s.id,
          classId: s.classId,
          teacherId: primaryTeacherId,
          date: days[di],
          status,
        },
        update: { status, classId: s.classId, teacherId: primaryTeacherId },
      });
      count++;
    }
  }
  console.log(`   ✅ ${count} attendance records\n`);
}

const HOMEWORK_SPECS = [
  { id: 'dev-hw-01', classId: 'dev-class-g1a', subject: 'Mathematics', title: 'Counting Practice', days: 5, teacherEmail: 'dev.teacher1@sc.dev' },
  { id: 'dev-hw-02', classId: 'dev-class-g1a', subject: 'English', title: 'Alphabet Writing', days: 4, teacherEmail: 'dev.teacher1@sc.dev' },
  { id: 'dev-hw-03', classId: 'dev-class-g1a', subject: 'Science', title: 'Plants Around Us', days: 7, teacherEmail: 'dev.teacher1@sc.dev' },
  { id: 'dev-hw-04', classId: 'dev-class-g2a', subject: 'Mathematics', title: 'Addition Worksheet', days: 3, teacherEmail: 'dev.teacher2@sc.dev' },
  { id: 'dev-hw-05', classId: 'dev-class-g2a', subject: 'Science', title: 'Weather Journal', days: 6, teacherEmail: 'dev.teacher2@sc.dev' },
  { id: 'dev-hw-06', classId: 'dev-class-g2a', subject: 'English', title: 'Story Retelling', days: -2, teacherEmail: 'dev.teacher2@sc.dev' },
  { id: 'dev-hw-07', classId: 'dev-class-g5a', subject: 'Mathematics', title: 'Fractions Chapter 5', days: 4, teacherEmail: 'dev.teacher@sc.dev' },
  { id: 'dev-hw-08', classId: 'dev-class-g5a', subject: 'English', title: 'Essay — My School', days: 8, teacherEmail: 'dev.teacher3@sc.dev' },
  { id: 'dev-hw-09', classId: 'dev-class-g5a', subject: 'Hindi', title: 'Poem Memorisation', days: 5, teacherEmail: 'dev.teacher3@sc.dev' },
  { id: 'dev-hw-10', classId: 'dev-class-g5b', subject: 'Science', title: 'Solar System Diagram', days: 6, teacherEmail: 'dev.teacher@sc.dev' },
  { id: 'dev-hw-11', classId: 'dev-class-g5b', subject: 'Social Studies', title: 'Map of India', days: 7, teacherEmail: 'dev.teacher4@sc.dev' },
  { id: 'dev-hw-12', classId: 'dev-class-g5b', subject: 'Hindi', title: 'Grammar Exercise', days: 3, teacherEmail: 'dev.teacher4@sc.dev' },
] as const;

const HW_DESCRIPTIONS: Record<string, string> = {
  'dev-hw-01': `${SEED_TAG} Complete exercises 1–20 on counting objects up to 50. Show your work in the notebook. Bring the notebook to class for review.`,
  'dev-hw-02': `${SEED_TAG} Write letters A through Z in cursive twice. Practice neat handwriting. Read aloud to a parent for pronunciation.`,
  'dev-hw-03': `${SEED_TAG} Draw and label three plants you see at home or nearby. Write one sentence about what each plant needs to grow.`,
  'dev-hw-04': `${SEED_TAG} Solve all addition problems on page 12. Use number lines where needed. Check answers with a parent.`,
  'dev-hw-05': `${SEED_TAG} Record the weather each morning for five days. Note temperature, rain, and cloud cover in the journal template.`,
  'dev-hw-06': `${SEED_TAG} Read the short story provided in class. Retell the story in your own words in 8–10 sentences.`,
  'dev-hw-07': `${SEED_TAG} Complete textbook exercises on equivalent fractions. Simplify all answers. Submit neat work by the due date.`,
  'dev-hw-08': `${SEED_TAG} Write a 200-word essay describing your school. Include introduction, two body paragraphs, and a conclusion.`,
  'dev-hw-09': `${SEED_TAG} Memorise the assigned Hindi poem and be ready to recite it in class. Write it once from memory.`,
  'dev-hw-10': `${SEED_TAG} Draw a labelled diagram of the solar system. Include all eight planets in order. Use colour pencils.`,
  'dev-hw-11': `${SEED_TAG} Mark all state capitals on the outline map of India. Submit a clean coloured map.`,
  'dev-hw-12': `${SEED_TAG} Complete grammar worksheet on verb forms. Rewrite incorrect sentences. Proofread before submitting.`,
};

async function seedHomework(students: StudentRow[], teacherEmailToId: Map<string, string>) {
  console.log('📝 Seeding homework (12 assignments)…');
  const homeworkByClass = new Map<string, string[]>();

  for (const hw of HOMEWORK_SPECS) {
    const teacherId = teacherEmailToId.get(hw.teacherEmail)!;
    await prisma.homework.upsert({
      where: { id: hw.id },
      update: {
        classId: hw.classId,
        teacherId,
        subject: hw.subject,
        title: hw.title,
        description: HW_DESCRIPTIONS[hw.id],
        dueDate: new Date(Date.now() + hw.days * 86400000),
        status: 'active',
      },
      create: {
        id: hw.id,
        classId: hw.classId,
        teacherId,
        subject: hw.subject,
        title: hw.title,
        description: HW_DESCRIPTIONS[hw.id],
        dueDate: new Date(Date.now() + hw.days * 86400000),
        status: 'active',
      },
    });
    const list = homeworkByClass.get(hw.classId) ?? [];
    list.push(hw.id);
    homeworkByClass.set(hw.classId, list);
  }

  let submissions = 0;
  for (const s of students) {
    const hwIds = homeworkByClass.get(s.classId) ?? [];
    for (const hwId of hwIds) {
      const submit = (s.num + hwId.charCodeAt(hwId.length - 1)) % 10 < 7;
      if (submit) {
        await prisma.homeworkSubmission.upsert({
          where: { homeworkId_studentId: { homeworkId: hwId, studentId: s.id } },
          create: {
            homeworkId: hwId,
            studentId: s.id,
            status: 'SUBMITTED',
            submittedAt: new Date(),
          },
          update: { status: 'SUBMITTED', submittedAt: new Date() },
        });
        submissions++;
      }
    }
  }

  console.log(`   ✅ 12 homework assignments, ${submissions} submissions (~70%)\n`);
}

async function seedMarks(students: StudentRow[], primaryTeacherId: string) {
  console.log('📊 Seeding marks (3 exam types × 5 subjects per class)…');
  let examCount = 0;
  let markCount = 0;

  const studentsByClass = new Map<string, StudentRow[]>();
  for (const s of students) {
    const g = studentsByClass.get(s.classId) ?? [];
    g.push(s);
    studentsByClass.set(s.classId, g);
  }

  for (const spec of CLASS_SPECS) {
    const classStudents = studentsByClass.get(spec.id) ?? [];
    for (const subject of DEFAULT_SUBJECTS) {
      for (const examType of EXAM_TYPES) {
        const examId = `dev-exam-${spec.id}-${subject.toLowerCase().replace(/\s/g, '')}-${examType.toLowerCase()}`;
        const exam = await prisma.exam.upsert({
          where: { id: examId },
          update: {
            classId: spec.id,
            name: `[DevSchool] ${subject} ${examType}`,
            subject,
            examType,
            date: dateOnly(new Date(Date.now() - 30 * 86400000)),
            maxMarks: 100,
            passingMarks: 35,
          },
          create: {
            id: examId,
            classId: spec.id,
            name: `[DevSchool] ${subject} ${examType}`,
            subject,
            examType,
            date: dateOnly(new Date(Date.now() - 30 * 86400000)),
            maxMarks: 100,
            passingMarks: 35,
          },
        });
        examCount++;

        for (const st of classStudents) {
          const marksObtained = 55 + ((st.num * 7 + subject.length) % 45);
          await prisma.marks.upsert({
            where: { examId_studentId: { examId: exam.id, studentId: st.id } },
            create: {
              examId: exam.id,
              studentId: st.id,
              teacherId: primaryTeacherId,
              marksObtained,
            },
            update: { marksObtained, teacherId: primaryTeacherId },
          });
          markCount++;
        }
      }
    }
  }

  console.log(`   ✅ ${examCount} exams, ${markCount} mark records\n`);
}

async function seedFees(students: StudentRow[]) {
  console.log('💰 Seeding fee structures + payments…');
  const feeDefs = [
    { id: 'dev-fee-01', name: '[DevSchool] Term 1 Tuition', amount: 20000, dueDays: -30, paid: true },
    { id: 'dev-fee-02', name: '[DevSchool] Term 2 Tuition', amount: 20000, dueDays: 30, paid: false },
    { id: 'dev-fee-03', name: '[DevSchool] Transport Fee', amount: 6000, dueDays: -15, paid: true },
    { id: 'dev-fee-04', name: '[DevSchool] Library Fee', amount: 1500, dueDays: 45, paid: false },
    { id: 'dev-fee-05', name: '[DevSchool] Sports Fee', amount: 2500, dueDays: 60, paid: false },
  ];

  const structures: { id: string; amount: number; paid: boolean }[] = [];
  for (const f of feeDefs) {
    const structure = await prisma.feeStructure.upsert({
      where: { id: f.id },
      update: {
        schoolId: DEV_SCHOOL_ID,
        name: f.name,
        amount: f.amount,
        dueDate: new Date(Date.now() + f.dueDays * 86400000),
        isActive: true,
      },
      create: {
        id: f.id,
        schoolId: DEV_SCHOOL_ID,
        name: f.name,
        type: 'tuition',
        amount: f.amount,
        dueDate: new Date(Date.now() + f.dueDays * 86400000),
        isActive: true,
      },
    });
    structures.push({ id: structure.id, amount: f.amount, paid: f.paid });
  }

  let payments = 0;
  for (const s of students) {
    for (const fs of structures) {
      const shouldPay = fs.paid || s.num % 10 < 7;
      const ref = `DEV-SCHOOL-${fs.id}-${s.id}`;
      if (shouldPay) {
        const existing = await prisma.feePayment.findFirst({ where: { reference: ref } });
        if (!existing) {
          await prisma.feePayment.create({
            data: {
              feeStructureId: fs.id,
              studentId: s.id,
              amountPaid: fs.amount,
              paidAt: new Date(Date.now() - 20 * 86400000),
              paymentMethod: 'UPI',
              reference: ref,
            },
          });
          payments++;
        }
      }
    }
  }

  console.log(`   ✅ ${structures.length} fee structures, ${payments} new payments\n`);
}

async function seedEvents(adminId: string) {
  console.log('📆 Seeding school events (5)…');
  const events = [
    { id: 'dev-event-01', title: 'Dev School Orientation', type: EventType.MEETING, days: 14 },
    { id: 'dev-event-02', title: 'Mid-Term Exams', type: EventType.EXAM, days: 21 },
    { id: 'dev-event-03', title: 'Sports Day', type: EventType.EVENT, days: 28 },
    { id: 'dev-event-04', title: 'Republic Day Holiday', type: EventType.HOLIDAY, days: -10 },
    { id: 'dev-event-05', title: 'Science Fair', type: EventType.EVENT, days: 35 },
  ];

  for (const e of events) {
    await prisma.schoolEvent.upsert({
      where: { id: e.id },
      update: {
        schoolId: DEV_SCHOOL_ID,
        title: e.title,
        description: `${SEED_TAG} ${e.title} for Dev Test School.`,
        date: dateOnly(new Date(Date.now() + e.days * 86400000)),
        type: e.type,
        createdBy: adminId,
      },
      create: {
        id: e.id,
        schoolId: DEV_SCHOOL_ID,
        title: e.title,
        description: `${SEED_TAG} ${e.title} for Dev Test School.`,
        date: dateOnly(new Date(Date.now() + e.days * 86400000)),
        type: e.type,
        createdBy: adminId,
      },
    });
  }
  console.log('   ✅ 5 school events\n');
}

async function seedAnnouncements(adminId: string) {
  console.log('📢 Seeding announcements (5)…');
  const items = [
    { id: 'dev-ann-01', title: 'Welcome to Dev School', priority: 'normal' },
    { id: 'dev-ann-02', title: 'PTM Next Week', priority: 'high' },
    { id: 'dev-ann-03', title: 'Fee Payment Reminder', priority: 'high' },
    { id: 'dev-ann-04', title: 'Bus Route Update', priority: 'normal' },
    { id: 'dev-ann-05', title: 'Library Week', priority: 'normal' },
  ];

  for (const a of items) {
    await prisma.announcement.upsert({
      where: { id: a.id },
      update: {
        schoolId: DEV_SCHOOL_ID,
        title: a.title,
        message: `${SEED_TAG} ${a.title} — announcement for Dev Test School parents and staff.`,
        priority: a.priority,
        targetAudience: { scope: 'ALL' } as object,
        channels: { in_app: true } as object,
        status: 'sent',
        sentAt: new Date(),
        createdBy: adminId,
      },
      create: {
        id: a.id,
        schoolId: DEV_SCHOOL_ID,
        title: a.title,
        message: `${SEED_TAG} ${a.title} — announcement for Dev Test School parents and staff.`,
        priority: a.priority,
        targetAudience: { scope: 'ALL' } as object,
        channels: { in_app: true } as object,
        status: 'sent',
        sentAt: new Date(),
        createdBy: adminId,
      },
    });
  }
  console.log('   ✅ 5 announcements\n');
}

async function seedRemarks(students: StudentRow[], teacherIds: string[]) {
  console.log('💬 Seeding remarks (20)…');
  const templates = [
    { category: 'academic', remarkType: 'POSITIVE', content: 'Excellent progress in class activities.' },
    { category: 'behavior', remarkType: 'POSITIVE', content: 'Shows respect and helps classmates.' },
    { category: 'homework', remarkType: 'CONCERN', content: 'Please ensure homework is submitted on time.' },
    { category: 'attendance', remarkType: 'NEUTRAL', content: 'Attendance is satisfactory this month.' },
  ];

  for (let i = 0; i < 20; i++) {
    const st = students[i];
    const tpl = templates[i % templates.length];
    const remarkId = `dev-remark-${String(i + 1).padStart(2, '0')}`;
    await prisma.remark.upsert({
      where: { id: remarkId },
      update: {
        studentId: st.id,
        teacherId: teacherIds[i % teacherIds.length],
        category: tpl.category,
        remarkType: tpl.remarkType,
        content: `${SEED_TAG} ${tpl.content}`,
      },
      create: {
        id: remarkId,
        studentId: st.id,
        teacherId: teacherIds[i % teacherIds.length],
        category: tpl.category,
        remarkType: tpl.remarkType,
        content: `${SEED_TAG} ${tpl.content}`,
      },
    });
  }
  console.log('   ✅ 20 remarks\n');
}

async function seedBusRoute(students: StudentRow[], busHelperId: string, busHelperName: string, busHelperPhone: string | null) {
  console.log('🚌 Seeding bus route…');
  const routeStudents = students.slice(0, 8).map((s) => ({ id: s.id, name: s.name }));

  const stops = [
    { id: 'dev-stop-1', name: 'Dev Colony Gate', address: 'Dev Colony', latitude: 12.9716, longitude: 77.5946, sequence: 1, estimatedTime: '07:30', students: routeStudents.slice(0, 2) },
    { id: 'dev-stop-2', name: 'Tech Park Circle', address: 'Tech Park', latitude: 12.975, longitude: 77.6, sequence: 2, estimatedTime: '07:40', students: routeStudents.slice(2, 4) },
    { id: 'dev-stop-3', name: 'Metro Station', address: 'Central Metro', latitude: 12.978, longitude: 77.605, sequence: 3, estimatedTime: '07:50', students: routeStudents.slice(4, 6) },
    { id: 'dev-stop-4', name: 'Market Square', address: 'Market', latitude: 12.98, longitude: 77.61, sequence: 4, estimatedTime: '08:00', students: routeStudents.slice(6, 8) },
    { id: 'dev-stop-5', name: 'School Gate', address: 'Dev Test School', latitude: 12.982, longitude: 77.615, sequence: 5, estimatedTime: '08:20', students: [] as { id: string; name: string }[] },
  ];

  await prisma.route.upsert({
    where: { id: 'dev-route-001' },
    update: {
      schoolId: DEV_SCHOOL_ID,
      name: 'Dev Route — North',
      busNumber: 'KA 01 DEV 001',
      helperId: busHelperId,
      helperName: busHelperName,
      helperPhone: busHelperPhone ?? '+919900000099',
      startTime: '07:30',
      endTime: '08:30',
      status: 'active',
      stops: stops as object,
    },
    create: {
      id: 'dev-route-001',
      schoolId: DEV_SCHOOL_ID,
      name: 'Dev Route — North',
      busNumber: 'KA 01 DEV 001',
      helperId: busHelperId,
      helperName: busHelperName,
      helperPhone: busHelperPhone ?? '+919900000099',
      startTime: '07:30',
      endTime: '08:30',
      status: 'active',
      stops: stops as object,
    },
  });
  console.log('   ✅ 1 route, 5 stops, 8 students assigned\n');
}

async function linkPrimaryDevParentAndTeacher(students: StudentRow[]) {
  console.log('🔗 Linking primary dev.parent and dev.teacher…');

  const devParent = await prisma.user.findUniqueOrThrow({ where: { email: 'dev.parent@sc.dev' } });

  const scored = await Promise.all(
    students.map(async (s) => {
      const [attendance, marks, fees, homework] = await Promise.all([
        prisma.attendance.count({ where: { studentId: s.id } }),
        prisma.marks.count({ where: { studentId: s.id } }),
        prisma.feePayment.count({ where: { studentId: s.id } }),
        prisma.homeworkSubmission.count({ where: { studentId: s.id } }),
      ]);
      return { student: s, total: attendance + marks + fees + homework, attendance, marks, fees, homework };
    }),
  );
  scored.sort((a, b) => b.total - a.total);
  const best = scored[0];

  await prisma.parentStudent.upsert({
    where: { parentId_studentId: { parentId: devParent.id, studentId: best.student.id } },
    update: { relationship: 'parent', isPrimary: true },
    create: {
      parentId: devParent.id,
      studentId: best.student.id,
      relationship: 'parent',
      isPrimary: true,
    },
  });
  console.log(
    `   ✅ dev.parent@sc.dev → ${best.student.name} (${best.student.email}) ` +
      `[att=${best.attendance}, marks=${best.marks}, fees=${best.fees}, hw=${best.homework}]`,
  );

  const devTeacher = await prisma.user.findUniqueOrThrow({ where: { email: 'dev.teacher@sc.dev' } });
  for (const [classId, subject, isClassTeacher] of [
    ['dev-class-g5a', 'Mathematics', true],
    ['dev-class-g5b', 'Science', false],
  ] as const) {
    await prisma.teacherClass.upsert({
      where: {
        teacherId_classId_subject: { teacherId: devTeacher.id, classId, subject },
      },
      update: { isClassTeacher },
      create: { teacherId: devTeacher.id, classId, subject, isClassTeacher },
    });
  }
  console.log('   ✅ dev.teacher@sc.dev → Grade 5 A (Mathematics), Grade 5 B (Science)\n');

  return best.student;
}

async function main() {
  console.log('🚀 Seeding isolated dev school (SCH-DEV-01)…\n');
  console.log('ℹ️  demo-school-001 will NOT be modified.\n');

  try {
    const passwordHash = await bcrypt.hash(DEV_PASSWORD, 12);
    console.log('✅ Password hashed (bcrypt rounds: 12)\n');

    await upsertSchool();
    await migratePrimaryDevAccounts(passwordHash);

    const admin = await upsertUser({
      email: 'dev.admin@sc.dev',
      name: 'Dev Admin',
      role: UserRole.ADMIN,
      schoolId: DEV_SCHOOL_ID,
      passwordHash,
    });

    const classIds = CLASS_SPECS.map((c) => c.id);
    const allDevTeacherEmails = ['dev.teacher@sc.dev', ...[1, 2, 3, 4].map((i) => `dev.teacher${i}@sc.dev`)];
    const existingTeachers = await prisma.user.findMany({
      where: { email: { in: allDevTeacherEmails } },
      select: { id: true },
    });

    await clearDevSchoolSeedData(classIds, existingTeachers.map((t) => t.id));

    await upsertClasses();
    const students = await upsertStudentsAndParents(passwordHash);
    const { teachers, primaryTeacherId } = await upsertTeachers(passwordHash, admin.id);

    const teacherEmailToId = new Map(teachers.map((t) => [t.email, t.id]));

    await seedAttendance(students, primaryTeacherId);
    await seedHomework(students, teacherEmailToId);
    await seedMarks(students, primaryTeacherId);
    await seedFees(students);
    await seedEvents(admin.id);
    await seedAnnouncements(admin.id);
    await seedRemarks(students, teachers.map((t) => t.id));

    const busHelper = await prisma.user.findUniqueOrThrow({ where: { email: 'dev.bus@sc.dev' } });
    await seedBusRoute(students, busHelper.id, busHelper.name, busHelper.phone);

    const linkedStudent = await linkPrimaryDevParentAndTeacher(students);

    console.log('═══════════════════════════════════════════════════════════════════════════');
    console.log('  DEV SCHOOL SUMMARY');
    console.log('  School:     Dev Test School');
    console.log('  schoolId:   dev-school-001');
    console.log('  schoolCode: SCH-DEV-01');
    console.log('  Password:   DevTest@2026 (all dev accounts)');
    console.log('───────────────────────────────────────────────────────────────────────────');
    console.log('  Created / updated:');
    console.log('    Classes:        4');
    console.log('    Students:       20 (dev.student1@sc.dev … dev.student20@sc.dev)');
    console.log('    Parents:        20 (dev.parent1@sc.dev … dev.parent20@sc.dev)');
    console.log('    Teachers:       5 (dev.teacher + dev.teacher1–4)');
    console.log('    Attendance:     600 records (30 days × 20 students)');
    console.log('    Homework:       12 assignments (~70% submitted)');
    console.log('    Marks:          60 exams, 300 mark rows (3 types × 5 subjects × 4 classes × 5 students)');
    console.log('    Fees:           5 structures + payments');
    console.log('    Events:         5');
    console.log('    Announcements:  5');
    console.log('    Remarks:        20');
    console.log('    Bus routes:     1 (5 stops)');
    console.log('───────────────────────────────────────────────────────────────────────────');
    console.log('  Primary dev account links:');
    console.log(`    dev.parent@sc.dev   → ${linkedStudent.name} (${linkedStudent.email})`);
    console.log('    dev.teacher@sc.dev  → Grade 5 A + Grade 5 B');
    console.log('    dev.admin@sc.dev    → school only');
    console.log('    dev.principal@sc.dev→ school only');
    console.log('    dev.bus@sc.dev      → dev-route-001');
    console.log('═══════════════════════════════════════════════════════════════════════════');
    console.log('\n🎉 Dev school seeded successfully. demo-school-001 untouched.\n');
  } catch (err: unknown) {
    const e = err as Error;
    console.error('❌ seed-dev-school failed:', e.message);
    if (e.stack) console.error(e.stack);
    process.exit(1);
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
