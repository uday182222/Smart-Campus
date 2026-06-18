/**
 * Mega production-like seed for SCH-DEMO-01: 200 students + parents, 15 teachers,
 * 60 school-days attendance, homework + submissions, exams + marks, routes,
 * fee payments, events, announcements, remarks.
 *
 * Run from server/: npx ts-node scripts/seed-mega-production.ts
 */
import 'dotenv/config';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import prisma from '../src/config/database';

const DEMO_SCHOOL_CODE = 'SCH-DEMO-01';
const DEFAULT_PASSWORD = 'password123';
const SEED_TAG = '<!--mega-prod-->';

const classSpecs = [
  { name: 'Nursery', section: 'A' },
  { name: 'KG', section: 'A' },
  { name: 'Grade 1', section: 'A' },
  { name: 'Grade 1', section: 'B' },
  { name: 'Grade 2', section: 'A' },
  { name: 'Grade 3', section: 'A' },
  { name: 'Grade 4', section: 'A' },
  { name: 'Grade 5', section: 'A' },
  { name: 'Grade 5', section: 'B' },
  { name: 'Grade 6', section: 'A' },
  { name: 'Grade 7', section: 'A' },
  { name: 'Grade 8', section: 'A' },
  { name: 'Grade 9', section: 'A' },
  { name: 'Grade 10', section: 'A' },
] as const;

const coreExamSubjects = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies'] as const;
const teacherSubjects = [
  'Mathematics',
  'Science',
  'English',
  'Hindi',
  'Social Studies',
  'Computer Science',
  'Physics',
  'Chemistry',
  'Biology',
  'History',
  'Geography',
  'Physical Education',
  'Art',
  'Music',
] as const;

const examTypes = ['Unit Test 1', 'Unit Test 2', 'Mid Term', 'Final Term', 'Assignment'] as const;

type Gender = 'MALE' | 'FEMALE';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOne<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function slugFirstName(fullName: string): string {
  return fullName
    .split(/\s+/)[0]
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

function dateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function lastNSchoolDays(n: number): Date[] {
  const days: Date[] = [];
  const d = new Date();
  while (days.length < n) {
    d.setDate(d.getDate() - 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      days.push(dateOnly(d));
    }
  }
  return days.reverse();
}

function weightedAttendanceStatus(presentP: number, absentP: number, lateP: number): string {
  const r = Math.random();
  if (r < presentP) return 'present';
  if (r < presentP + absentP) return 'absent';
  if (r < presentP + absentP + lateP) return 'late';
  // Guard against rounding/normalization issues: default to present.
  return 'present';
}

function sampleMarks(): number {
  // Realistic: most 60-85, few extremes.
  const r = Math.random();
  if (r < 0.08) return randInt(45, 59);
  if (r < 0.78) return randInt(60, 85);
  if (r < 0.96) return randInt(86, 95);
  return randInt(96, 100);
}

async function upsertUser(params: {
  email: string;
  name: string;
  role: UserRole;
  schoolId: string | null;
  passwordHash: string;
  phone?: string;
  metadata?: object;
}) {
  const { email, name, role, schoolId, passwordHash, phone, metadata } = params;
  return prisma.user.upsert({
    where: { email },
    update: {
      name,
      role,
      schoolId,
      phone,
      password: passwordHash,
      status: UserStatus.ACTIVE,
      metadata: metadata as object | undefined,
    },
    create: {
      email,
      name,
      role,
      schoolId,
      phone,
      password: passwordHash,
      status: UserStatus.ACTIVE,
      metadata: metadata as object | undefined,
    },
  });
}

async function main() {
  const summary: Record<string, number> = {
    schoolFound: 0,
    classesFound: 0,
    adminUpserted: 0,
    teachersUpserted: 0,
    teacherClassLinksCreated: 0,
    studentsUpserted: 0,
    parentsUpserted: 0,
    parentStudentLinksUpserted: 0,
    routesUpserted: 0,
    attendanceCreated: 0,
    homeworkCreated: 0,
    submissionsUpserted: 0,
    examsCreated: 0,
    marksCreated: 0,
    feeStructuresEnsured: 0,
    feePaymentsCreated: 0,
    eventsCreated: 0,
    announcementsCreated: 0,
    remarksCreated: 0,
  };

  try {
    console.log('🚀 Mega seeding SCH-DEMO-01...\n');
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    // 1) School (find existing; don't recreate)
    let schoolId = '';
    try {
      const school = await prisma.school.findFirst({ where: { schoolCode: DEMO_SCHOOL_CODE } });
      if (!school) throw new Error(`School not found for code ${DEMO_SCHOOL_CODE}`);
      schoolId = school.id;
      summary.schoolFound = 1;
      console.log('✅ School found:', school.name, '|', school.schoolCode);
    } catch (e) {
      console.log('❌ School section failed:', e);
      throw e;
    }

    // 2) Classes (find existing 14)
    const classesByKey = new Map<string, { id: string; name: string; section: string }>();
    try {
      for (const c of classSpecs) {
        const found = await prisma.class.findFirst({
          where: { schoolId, name: c.name, section: c.section },
        });
        if (!found) throw new Error(`Missing class: ${c.name} ${c.section}`);
        classesByKey.set(`${c.name}__${c.section}`, { id: found.id, name: found.name, section: found.section });
      }
      summary.classesFound = classesByKey.size;
      console.log('✅ Classes found:', summary.classesFound);
    } catch (e) {
      console.log('❌ Classes section failed:', e);
      throw e;
    }

    // Admin (for createdBy fields)
    let adminId = '';
    try {
      const admin = await upsertUser({
        email: 'admin@demo.com',
        name: 'Priya Sharma (Admin)',
        role: UserRole.ADMIN,
        schoolId,
        passwordHash,
        phone: '+911234567890',
      });
      adminId = admin.id;
      summary.adminUpserted = 1;
      console.log('✅ Admin ensured:', admin.email);
    } catch (e) {
      console.log('❌ Admin section failed:', e);
      throw e;
    }

    // 3) Teachers → TeacherClassAssignments (TeacherClass)
    const teacherUsers: { id: string; name: string; email: string; subject: string }[] = [];
    const teacherEmails = new Set<string>();
    try {
      const teacherNames = [
        'Amit Sharma',
        'Neha Gupta',
        'Rahul Verma',
        'Priya Nair',
        'Sanjay Mehta',
        'Kavita Iyer',
        'Anita Singh',
        'Vikram Joshi',
        'Meena Kapoor',
        'Arjun Patel',
        'Deepak Kumar',
        'Ritu Malhotra',
        'Suresh Yadav',
        'Pooja Chawla',
        'Mohit Saxena',
      ];

      for (let i = 0; i < 15; i++) {
        const name = teacherNames[i];
        const first = slugFirstName(name);
        const email = `teacher.${first}@demo.com`;
        const subject = teacherSubjects[i % teacherSubjects.length];
        teacherEmails.add(email);
        const teacher = await upsertUser({
          email,
          name: `${name} (Teacher)`,
          role: UserRole.TEACHER,
          schoolId,
          passwordHash,
          phone: `+9198${String(randInt(10000000, 99999999))}`,
          metadata: { primarySubject: subject, seedTag: SEED_TAG },
        });
        teacherUsers.push({ id: teacher.id, name: teacher.name, email: teacher.email, subject });
      }
      summary.teachersUpserted = teacherUsers.length;
      console.log('✅ Teachers ensured:', summary.teachersUpserted);
    } catch (e) {
      console.log('❌ Teachers section failed:', e);
      throw e;
    }

    // TeacherClass links: each teacher at least 3 classes; subject per teacher
    const classList = [...classesByKey.values()];
    const teacherByClass = new Map<string, { teacherId: string; subject: string }>();
    try {
      // Clear existing teacher-class links for these teachers in this school, so reruns are clean.
      const teacherIds = teacherUsers.map((t) => t.id);
      await prisma.teacherClass.deleteMany({
        where: { teacherId: { in: teacherIds }, class: { schoolId } },
      });

      const perTeacherClasses = 3;
      const classIndices = shuffle(classList.map((_, idx) => idx));
      let cursor = 0;

      for (const t of teacherUsers) {
        const assignedIdxs: number[] = [];
        while (assignedIdxs.length < perTeacherClasses) {
          assignedIdxs.push(classIndices[cursor % classIndices.length]);
          cursor++;
        }
        const uniq = [...new Set(assignedIdxs)];
        while (uniq.length < perTeacherClasses) {
          uniq.push(randInt(0, classList.length - 1));
        }
        for (const idx of uniq.slice(0, perTeacherClasses)) {
          const cls = classList[idx];
          await prisma.teacherClass.create({
            data: {
              teacherId: t.id,
              classId: cls.id,
              subject: t.subject,
              isClassTeacher: false,
            },
          });
          summary.teacherClassLinksCreated += 1;
          if (!teacherByClass.has(cls.id)) teacherByClass.set(cls.id, { teacherId: t.id, subject: t.subject });
        }
      }
      // Ensure every class has a "class teacher" entry (subject arbitrary, but needed for teacherId in attendance).
      for (const cls of classList) {
        if (!teacherByClass.has(cls.id)) {
          const t = pickOne(teacherUsers);
          teacherByClass.set(cls.id, { teacherId: t.id, subject: t.subject });
        }
        const classTeacher = teacherByClass.get(cls.id)!;
        await prisma.teacherClass.upsert({
          where: {
            teacherId_classId_subject: {
              teacherId: classTeacher.teacherId,
              classId: cls.id,
              subject: classTeacher.subject,
            },
          },
          update: { isClassTeacher: true },
          create: {
            teacherId: classTeacher.teacherId,
            classId: cls.id,
            subject: classTeacher.subject,
            isClassTeacher: true,
          },
        });
      }
      console.log('✅ Teacher–class links created:', summary.teacherClassLinksCreated);
    } catch (e) {
      console.log('❌ Teacher-class section failed:', e);
      throw e;
    }

    // 4) Students → Parents → ParentStudent links (acts as enrollment relation in this schema)
    const boys = [
      'Aarav',
      'Vivaan',
      'Aditya',
      'Vihaan',
      'Arjun',
      'Rohan',
      'Ishaan',
      'Kabir',
      'Karan',
      'Aryan',
      'Siddharth',
      'Manav',
      'Pranav',
      'Rudra',
      'Shivansh',
      'Dev',
      'Atharv',
      'Yash',
      'Rahul',
      'Mohit',
    ];
    const girls = [
      'Ananya',
      'Diya',
      'Aadhya',
      'Ira',
      'Sara',
      'Kavya',
      'Aisha',
      'Meera',
      'Riya',
      'Ishita',
      'Saanvi',
      'Nisha',
      'Pooja',
      'Neha',
      'Priya',
      'Tanya',
      'Vidhi',
      'Shreya',
      'Nandini',
      'Avni',
    ];
    const lastNames = [
      'Sharma',
      'Verma',
      'Gupta',
      'Singh',
      'Kumar',
      'Patel',
      'Mehta',
      'Joshi',
      'Kapoor',
      'Nair',
      'Iyer',
      'Yadav',
      'Chawla',
      'Malhotra',
      'Saxena',
      'Bansal',
      'Agarwal',
      'Mishra',
      'Jain',
      'Khan',
    ];

    type SeedStudent = {
      id: string;
      classId: string;
      className: string;
      section: string;
      parentId: string;
      isBus: boolean;
      gradeNumber: number | null;
    };

    const students: SeedStudent[] = [];
    const busCandidateStudentIds: string[] = [];

    try {
      // Distribution: 200 across 14 classes (base 14 each = 196, +1 to first 4)
      const counts = classList.map(() => 14);
      for (let i = 0; i < 4; i++) counts[i] += 1;

      const yearNow = new Date().getFullYear();
      let globalIdx = 1;

      for (let ci = 0; ci < classList.length; ci++) {
        const cls = classList[ci];
        const classCount = counts[ci];
        const gradeMatch = cls.name.match(/Grade\s+(\d+)/i);
        const gradeNumber = gradeMatch ? Number(gradeMatch[1]) : null;

        for (let i = 0; i < classCount; i++) {
          const gender: Gender = Math.random() < 0.5 ? 'MALE' : 'FEMALE';
          const firstName = gender === 'MALE' ? pickOne(boys) : pickOne(girls);
          const lastName = pickOne(lastNames);
          const studentName = `${firstName} ${lastName}`;

          const parentFirst = pickOne([...boys, 'Rajesh', 'Suresh', 'Amit', 'Vikas', 'Sunil', 'Deepak', 'Manish']);
          const parentLast = lastName;
          const parentName = `${parentFirst} ${parentLast}`;

          const parentEmail = `parent.${slugFirstName(parentName)}${randInt(1000, 9999)}@demo.com`;
          const studentEmail = `student.${slugFirstName(studentName)}${randInt(1000, 9999)}@demo.com`;

          const rollNumber = i + 1;
          const dobYear = gradeNumber ? yearNow - (gradeNumber + 5) : yearNow - randInt(3, 5); // approx ages
          const dob = new Date(Date.UTC(dobYear, randInt(0, 11), randInt(1, 28)));

          const parent = await upsertUser({
            email: parentEmail,
            name: `${parentName} (Parent)`,
            role: UserRole.PARENT,
            schoolId,
            passwordHash,
            phone: `+9197${String(randInt(10000000, 99999999))}`,
            metadata: { seedTag: SEED_TAG },
          });
          summary.parentsUpserted += 1;

          const student = await upsertUser({
            email: studentEmail,
            name: `${studentName}`,
            role: UserRole.STUDENT,
            schoolId,
            passwordHash,
            metadata: {
              seedTag: SEED_TAG,
              classId: cls.id,
              className: cls.name,
              section: cls.section,
              rollNumber,
              dateOfBirth: dob.toISOString().slice(0, 10),
              gender,
            },
          });
          summary.studentsUpserted += 1;

          await prisma.parentStudent.upsert({
            where: { parentId_studentId: { parentId: parent.id, studentId: student.id } },
            update: { relationship: 'parent', isPrimary: true },
            create: { parentId: parent.id, studentId: student.id, relationship: 'parent', isPrimary: true },
          });
          summary.parentStudentLinksUpserted += 1;

          students.push({
            id: student.id,
            classId: cls.id,
            className: cls.name,
            section: cls.section,
            parentId: parent.id,
            isBus: false,
            gradeNumber,
          });

          if (globalIdx % 2 === 0) busCandidateStudentIds.push(student.id);
          globalIdx++;
        }
      }

      console.log('✅ Students ensured:', students.length, '| Parents ensured:', summary.parentsUpserted);
    } catch (e) {
      console.log('❌ Students/Parents section failed:', e);
      throw e;
    }

    // 5) Bus Routes (Route.stops JSON holds stop list + student lists)
    const busRoutesSpec = [
      {
        id: 'mega-route-north-001',
        name: 'North Zone Route',
        busNumber: 'DL-01-AB-1234',
        helperEmail: 'bushelper@demo.com',
        helperName: 'Ramesh Kumar',
        stops: ['School', 'Raj Nagar', 'Sector 5', 'Vaishali', 'Indirapuram', 'Vasundhara'],
        assignCount: 40,
      },
      {
        id: 'mega-route-south-001',
        name: 'South Zone Route',
        busNumber: 'DL-02-CD-5678',
        helperEmail: null as string | null,
        helperName: 'Suresh Singh',
        stops: ['School', 'Sector 10', 'Kaushambi', 'Anand Vihar', 'Patparganj', 'Mayur Vihar'],
        assignCount: 35,
      },
      {
        id: 'mega-route-east-001',
        name: 'East Zone Route',
        busNumber: 'UP-16-EF-9012',
        helperEmail: null as string | null,
        helperName: 'Mahesh Yadav',
        stops: ['School', 'Sector 15', 'Noida', 'Greater Noida', 'Sector 62', 'Sector 18'],
        assignCount: 30,
      },
    ];

    const busStudentSet = new Set<string>();
    try {
      const busHelper = await upsertUser({
        email: 'bushelper@demo.com',
        name: 'Bus Helper (Demo)',
        role: UserRole.BUS_HELPER,
        schoolId,
        passwordHash,
        phone: '+919876543210',
        metadata: { seedTag: SEED_TAG },
      });

      const chosen = shuffle([...busCandidateStudentIds]).slice(0, 105); // 40+35+30
      let idx = 0;

      // Clean previous mega routes on rerun
      await prisma.route.deleteMany({ where: { schoolId, id: { in: busRoutesSpec.map((r) => r.id) } } });

      for (const r of busRoutesSpec) {
        const assigned = chosen.slice(idx, idx + r.assignCount);
        idx += r.assignCount;
        assigned.forEach((sid) => busStudentSet.add(sid));

        const stops = r.stops.map((name, sIdx) => {
          const studentsAtStop =
            sIdx === 0 || sIdx === r.stops.length - 1
              ? []
              : assigned
                  .filter((_, j) => j % (r.stops.length - 2) === sIdx - 1)
                  .map((sid) => {
                    const st = students.find((x) => x.id === sid);
                    return { id: sid, name: st ? `Student ${sid.slice(0, 6)}` : `Student ${sid.slice(0, 6)}` };
                  });
          return {
            id: `${r.id}-stop-${sIdx + 1}`,
            name,
            address: name,
            sequence: sIdx + 1,
            estimatedTime: sIdx === 0 ? '07:30' : sIdx === r.stops.length - 1 ? '08:30' : `07:${35 + sIdx * 5}`,
            students: studentsAtStop,
          };
        });

        const helperId = r.helperEmail ? busHelper.id : null;
        await prisma.route.create({
          data: {
            id: r.id,
            schoolId,
            name: r.name,
            busNumber: r.busNumber,
            helperId,
            helperName: r.helperName,
            helperPhone: helperId ? busHelper.phone : null,
            startTime: '07:30',
            endTime: '08:30',
            status: 'active',
            stops: stops as object,
          },
        });
        summary.routesUpserted += 1;
      }

      // Mark isBus flag in local memory (fees use it)
      for (const st of students) st.isBus = busStudentSet.has(st.id);

      console.log('✅ Bus routes created:', summary.routesUpserted, '| Bus students:', busStudentSet.size);
    } catch (e) {
      console.log('❌ Bus routes section failed:', e);
      throw e;
    }

    // 6) Attendance (60 school days) bulk insert in batches of 100
    try {
      const days = lastNSchoolDays(60);

      // Clear mega attendance for these students (idempotent)
      await prisma.attendance.deleteMany({
        where: { studentId: { in: students.map((s) => s.id ) } },
      });

      const rows: {
        classId: string;
        studentId: string;
        teacherId: string;
        date: Date;
        status: string;
        remarks?: string;
      }[] = [];

      for (const st of students) {
        const presentP = randInt(85, 95) / 100;
        const absentP = randInt(3, 8) / 100;
        const lateP = Math.max(0.02, Math.min(0.05, 1 - presentP - absentP));
        const teacherId = teacherByClass.get(st.classId)?.teacherId ?? teacherUsers[0].id;

        for (const day of days) {
          const status = weightedAttendanceStatus(presentP, absentP, lateP);
          rows.push({
            classId: st.classId,
            studentId: st.id,
            teacherId,
            date: day,
            status,
            remarks: status === 'absent' ? (Math.random() < 0.25 ? 'Sick leave' : undefined) : undefined,
          });
        }
      }

      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const res = await prisma.attendance.createMany({ data: batch, skipDuplicates: true });
        summary.attendanceCreated += res.count;
      }
      console.log('✅ Attendance created:', summary.attendanceCreated, `(${students.length} students × 60 days)`);
    } catch (e) {
      console.log('❌ Attendance section failed:', e);
      throw e;
    }

    // 7) Homework → Submissions (50 assignments; 60–80% submission rate)
    const homeworkIdsByClass = new Map<string, string[]>();
    try {
      // Clear mega homework in these classes on rerun
      await prisma.homeworkSubmission.deleteMany({
        where: { homework: { classId: { in: classList.map((c) => c.id) } } },
      });
      await prisma.homework.deleteMany({
        where: {
          classId: { in: classList.map((c) => c.id) },
          description: { contains: SEED_TAG },
        },
      });

      const statuses = ['active', 'overdue', 'completed'] as const;
      for (let i = 0; i < 50; i++) {
        const cls = classList[i % classList.length];
        const subject = i < 30 ? pickOne(coreExamSubjects) : pickOne(teacherSubjects);
        const status = statuses[i % statuses.length];
        const dueOffset = randInt(-30, 30);
        const dueDate = new Date(Date.now() + dueOffset * 86400000);
        const teacherId = teacherByClass.get(cls.id)?.teacherId ?? teacherUsers[0].id;

        const hw = await prisma.homework.create({
          data: {
            classId: cls.id,
            teacherId,
            subject,
            title: `${subject} — Assignment ${i + 1}`,
            description: `${SEED_TAG} Complete the work and submit on time.`,
            dueDate,
            status,
          },
        });
        summary.homeworkCreated += 1;
        const list = homeworkIdsByClass.get(cls.id) ?? [];
        list.push(hw.id);
        homeworkIdsByClass.set(cls.id, list);
      }

      // Submissions per homework (only for students of that class)
      for (const cls of classList) {
        const hwIds = homeworkIdsByClass.get(cls.id) ?? [];
        if (!hwIds.length) continue;
        const clsStudents = students.filter((s) => s.classId === cls.id);
        for (const hwId of hwIds) {
          const submissionRate = randInt(60, 80) / 100;
          for (const st of clsStudents) {
            if (Math.random() <= submissionRate) {
              const submitted = Math.random() < 0.92;
              const status = submitted ? 'SUBMITTED' : 'PENDING';
              const submittedAt = submitted ? new Date(Date.now() - randInt(0, 20) * 86400000) : null;
              await prisma.homeworkSubmission.upsert({
                where: { homeworkId_studentId: { homeworkId: hwId, studentId: st.id } },
                update: { status, submittedAt: submittedAt ?? undefined },
                create: {
                  homeworkId: hwId,
                  studentId: st.id,
                  status,
                  ...(submittedAt ? { submittedAt } : {}),
                },
              });
              summary.submissionsUpserted += 1;
            }
          }
        }
      }

      console.log('✅ Homework created:', summary.homeworkCreated, '| Submissions upserted:', summary.submissionsUpserted);
    } catch (e) {
      console.log('❌ Homework section failed:', e);
      throw e;
    }

    // 8) Marks/Exams (5 exam types × 5 subjects per class; all students get marks)
    try {
      // Clear previous mega exams/marks (match by prefix in Exam.name)
      const existingExams = await prisma.exam.findMany({
        where: { classId: { in: classList.map((c) => c.id) }, name: { startsWith: '[Mega]' } },
        select: { id: true },
      });
      const examIds = existingExams.map((e) => e.id);
      if (examIds.length) {
        await prisma.marks.deleteMany({ where: { examId: { in: examIds } } });
        await prisma.exam.deleteMany({ where: { id: { in: examIds } } });
      }

      for (const cls of classList) {
        const clsStudents = students.filter((s) => s.classId === cls.id);
        const teacherId = teacherByClass.get(cls.id)?.teacherId ?? teacherUsers[0].id;
        for (const subject of coreExamSubjects) {
          for (const et of examTypes) {
            const examDate = dateOnly(new Date(Date.now() - randInt(1, 120) * 86400000));
            const exam = await prisma.exam.create({
              data: {
                classId: cls.id,
                name: `[Mega] ${cls.name} ${cls.section} — ${subject} — ${et}`,
                subject,
                examType: et,
                date: examDate,
                maxMarks: 100,
                passingMarks: 35,
              },
            });
            summary.examsCreated += 1;

            const marksRows = clsStudents.map((st) => ({
              examId: exam.id,
              studentId: st.id,
              teacherId,
              marksObtained: sampleMarks(),
              remarks: Math.random() < 0.15 ? 'Good effort' : undefined,
            }));

            // Batch createMany; no skipDuplicates needed (new exam)
            const batchSize = 200;
            for (let i = 0; i < marksRows.length; i += batchSize) {
              const batch = marksRows.slice(i, i + batchSize);
              const res = await prisma.marks.createMany({ data: batch });
              summary.marksCreated += res.count;
            }
          }
        }
      }
      console.log('✅ Exams created:', summary.examsCreated, '| Marks created:', summary.marksCreated);
    } catch (e) {
      console.log('❌ Exams/Marks section failed:', e);
      throw e;
    }

    // 9) Fees → Payments (FeePayment presence = paid; missing = pending)
    try {
      const feeTypes = [
        { name: 'Tuition Fee', amount: 8000, scope: 'monthly' as const },
        { name: 'Transport Fee', amount: 2500, scope: 'monthly' as const },
        { name: 'Library Fee', amount: 500, scope: 'yearly' as const },
        { name: 'Sports Fee', amount: 1000, scope: 'yearly' as const },
        { name: 'Lab Fee', amount: 1500, scope: 'yearly' as const },
        { name: 'Annual Fee', amount: 5000, scope: 'yearly' as const },
      ];

      // Ensure fee structures exist (don’t assume they already exist)
      const feeStructures: { id: string; name: string; amount: number }[] = [];
      for (const ft of feeTypes) {
        const existing = await prisma.feeStructure.findFirst({ where: { schoolId, name: ft.name } });
        const dueDate = new Date(Date.now() + randInt(5, 25) * 86400000);
        const fs =
          existing ??
          (await prisma.feeStructure.create({
            data: {
              schoolId,
              name: ft.name,
              type: ft.scope,
              amount: ft.amount,
              currency: 'INR',
              dueDate,
              isActive: true,
            },
          }));
        if (!existing) summary.feeStructuresEnsured += 1;
        feeStructures.push({ id: fs.id, name: fs.name, amount: fs.amount });
      }

      // Clear existing mega payments (by reference prefix)
      await prisma.feePayment.deleteMany({ where: { reference: { startsWith: 'MEGASEED-' } } });

      for (const st of students) {
        const grade = st.gradeNumber ?? 0;
        for (const fs of feeStructures) {
          if (fs.name === 'Transport Fee' && !st.isBus) continue;
          if (fs.name === 'Lab Fee' && grade < 6) continue;

          const paid = Math.random() < 0.7;
          if (!paid) continue;

          await prisma.feePayment.create({
            data: {
              feeStructureId: fs.id,
              studentId: st.id,
              amountPaid: fs.amount,
              paidAt: new Date(Date.now() - randInt(0, 40) * 86400000),
              paymentMethod: pickOne(['UPI', 'CASH', 'CARD'] as const),
              reference: `MEGASEED-${st.id.slice(0, 8)}-${fs.id.slice(0, 6)}`,
            },
          });
          summary.feePaymentsCreated += 1;
        }
      }

      console.log(
        '✅ Fees ensured:',
        feeStructures.length,
        'structures (newly created:',
        summary.feeStructuresEnsured,
        ') | Payments created:',
        summary.feePaymentsCreated,
      );
    } catch (e) {
      console.log('❌ Fees section failed:', e);
      throw e;
    }

    // 10) Events → Announcements → Remarks
    try {
      // Events (use Event model)
      await prisma.event.deleteMany({
        where: { schoolId, description: { contains: SEED_TAG } },
      });

      const eventTitles = [
        'Annual Sports Day',
        'Science Fair',
        'Parent Teacher Meeting',
        'Independence Day',
        'Republic Day',
        'Diwali Celebration',
        'Christmas Party',
        'Annual Day',
        'Math Olympiad',
        'English Debate',
        'Art Exhibition',
        'Farewell Party',
        'Welcome Party',
        'Field Trip',
        'Exam Schedule',
      ];

      for (let i = 0; i < eventTitles.length; i++) {
        const title = eventTitles[i];
        const start = new Date(Date.now() + randInt(-20, 45) * 86400000);
        const end = new Date(start.getTime() + randInt(0, 2) * 86400000);
        await prisma.event.create({
          data: {
            schoolId,
            title,
            description: `${SEED_TAG} ${title} for the school community.`,
            startDate: start,
            endDate: end,
            startTime: '10:00',
            endTime: '13:00',
            type: 'EVENT',
            location: 'School Campus',
            targetAudience: 'ALL',
            isAllDay: false,
            reminderSettings: { channels: ['in_app'], minutesBefore: 60 } as object,
            attendanceRequired: false,
            status: 'scheduled',
            createdBy: adminId,
          },
        });
        summary.eventsCreated += 1;
      }
      console.log('✅ Events created:', summary.eventsCreated);

      // Announcements
      await prisma.announcement.deleteMany({
        where: { schoolId, message: { contains: SEED_TAG } },
      });
      const announcementSpecs = [
        { title: 'Holiday Notice', message: 'School will remain closed on upcoming public holiday.', priority: 'normal' },
        { title: 'PTM Reminder', message: 'Parent Teacher Meeting is scheduled this week. Please attend.', priority: 'high' },
        { title: 'Exam Timetable', message: 'Exam timetable has been published. Check your class schedule.', priority: 'high' },
        { title: 'Transport Update', message: 'Bus routes will run 10 minutes early this week.', priority: 'normal' },
        { title: 'Fee Reminder', message: 'Tuition fee payment window is open. Please pay before due date.', priority: 'high' },
        { title: 'Library Drive', message: 'Return overdue library books by Friday.', priority: 'normal' },
        { title: 'Sports Practice', message: 'Sports day practice starts from Monday.', priority: 'normal' },
        { title: 'Uniform Check', message: 'Uniform and ID card check will be done this week.', priority: 'normal' },
        { title: 'Field Trip Consent', message: 'Submit consent forms for upcoming field trip.', priority: 'high' },
        { title: 'Weather Advisory', message: 'Carry water bottles; stay hydrated during heat wave.', priority: 'normal' },
      ];
      for (const a of announcementSpecs) {
        await prisma.announcement.create({
          data: {
            schoolId,
            title: a.title,
            message: `${SEED_TAG} ${a.message}`,
            priority: a.priority,
            targetAudience: { scope: 'ALL' } as object,
            channels: { in_app: true } as object,
            status: 'sent',
            sentAt: new Date(),
            createdBy: adminId,
          },
        });
        summary.announcementsCreated += 1;
      }
      console.log('✅ Announcements created:', summary.announcementsCreated);

      // Remarks (100)
      const teacherIds = teacherUsers.map((t) => t.id);
      const remarkTemplates = [
        { category: 'academic', remarkType: 'POSITIVE', content: 'Excellent performance and consistent effort.' },
        { category: 'academic', remarkType: 'IMPROVEMENT', content: 'Needs more practice to improve accuracy and speed.' },
        { category: 'behavior', remarkType: 'POSITIVE', content: 'Shows leadership and helps classmates.' },
        { category: 'homework', remarkType: 'IMPROVEMENT', content: 'Please ensure homework is submitted on time.' },
        { category: 'attendance', remarkType: 'IMPROVEMENT', content: 'Attendance has been irregular. Kindly ensure regularity.' },
        { category: 'academic', remarkType: 'POSITIVE', content: 'Great participation in class and good conceptual clarity.' },
      ];

      // Clear previous mega remarks for these teachers/students (best-effort)
      await prisma.remark.deleteMany({
        where: {
          teacherId: { in: teacherIds },
          content: { contains: SEED_TAG },
        },
      });

      for (let i = 0; i < 100; i++) {
        const st = students[randInt(0, students.length - 1)];
        const tId = teacherIds[i % teacherIds.length];
        const tpl = remarkTemplates[i % remarkTemplates.length];
        await prisma.remark.create({
          data: {
            studentId: st.id,
            teacherId: tId,
            category: tpl.category,
            remarkType: tpl.remarkType,
            content: `${SEED_TAG} ${tpl.content}`,
            isPrivate: Math.random() < 0.1,
          },
        });
        summary.remarksCreated += 1;
      }
      console.log('✅ Remarks created:', summary.remarksCreated);
    } catch (e) {
      console.log('❌ Events/Announcements/Remarks section failed:', e);
      throw e;
    }

    console.log('\n📌 Summary (this run)');
    Object.entries(summary).forEach(([k, v]) => console.log(`- ${k}: ${v}`));
    console.log('\n🎉 Mega seed complete.');
  } catch (e) {
    const err = e as Error;
    console.error('\n❌ Seed failed:', err.message, err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void main();
}

