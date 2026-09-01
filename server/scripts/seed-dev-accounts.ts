/**
 * Developer-only test accounts (@sc.dev) — separate from client demo accounts.
 * Idempotent: safe to re-run (upsert on email).
 *
 * Run from server/:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-dev-accounts.ts
 */
import 'dotenv/config';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import prisma from '../src/config/database';

const SCHOOL_ID = 'demo-school-001';
const DEV_PASSWORD = 'DevTest@2026';

const DEV_ACCOUNTS = [
  { email: 'dev.parent@sc.dev', role: UserRole.PARENT, name: 'Dev Parent' },
  { email: 'dev.teacher@sc.dev', role: UserRole.TEACHER, name: 'Dev Teacher' },
  { email: 'dev.admin@sc.dev', role: UserRole.ADMIN, name: 'Dev Admin' },
  { email: 'dev.principal@sc.dev', role: UserRole.PRINCIPAL, name: 'Dev Principal' },
  { email: 'dev.bus@sc.dev', role: UserRole.BUS_HELPER, name: 'Dev BusHelper' },
] as const;

async function upsertUser(data: {
  email: string;
  name: string;
  role: UserRole;
  schoolId: string;
  passwordHash: string;
}) {
  return prisma.user.upsert({
    where: { email: data.email },
    update: {
      name: data.name,
      role: data.role,
      schoolId: data.schoolId,
      password: data.passwordHash,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: data.email,
      name: data.name,
      role: data.role,
      schoolId: data.schoolId,
      password: data.passwordHash,
      status: UserStatus.ACTIVE,
    },
  });
}

type StudentScore = {
  student: { id: string; name: string; email: string; metadata: unknown };
  attendance: number;
  marks: number;
  fees: number;
  homework: number;
  total: number;
};

async function findStudentWithMostData(schoolId: string): Promise<StudentScore> {
  console.log('🔍 Finding student with the most attendance, homework, marks, and fee records…');

  const students = await prisma.user.findMany({
    where: { schoolId, role: UserRole.STUDENT, status: UserStatus.ACTIVE },
    select: { id: true, name: true, email: true, metadata: true },
  });

  if (students.length === 0) {
    throw new Error(`No STUDENT users found for school ${schoolId}. Run seed-full-production.ts first.`);
  }

  const scored: StudentScore[] = await Promise.all(
    students.map(async (student) => {
      const [attendance, marks, fees, homework] = await Promise.all([
        prisma.attendance.count({ where: { studentId: student.id } }),
        prisma.marks.count({ where: { studentId: student.id } }),
        prisma.feePayment.count({ where: { studentId: student.id } }),
        prisma.homeworkSubmission.count({ where: { studentId: student.id } }),
      ]);
      return {
        student,
        attendance,
        marks,
        fees,
        homework,
        total: attendance + marks + fees + homework,
      };
    }),
  );

  scored.sort((a, b) => b.total - a.total || b.attendance - a.attendance);
  const best = scored[0];

  console.log(
    `   → Selected: ${best.student.name} (${best.student.email}) — ` +
      `attendance=${best.attendance}, marks=${best.marks}, fees=${best.fees}, homework=${best.homework}`,
  );

  return best;
}

type ClassWithStudents = {
  id: string;
  name: string;
  section: string;
  studentCount: number;
};

async function findTopClassesWithStudents(schoolId: string, limit = 2): Promise<ClassWithStudents[]> {
  console.log(`🔍 Finding top ${limit} classes with enrolled students…`);

  const classes = await prisma.class.findMany({
    where: { schoolId },
    select: { id: true, name: true, section: true },
  });

  const students = await prisma.user.findMany({
    where: { schoolId, role: UserRole.STUDENT },
    select: { metadata: true },
  });

  const countByClass = new Map<string, number>();
  for (const cls of classes) countByClass.set(cls.id, 0);

  for (const s of students) {
    const classId = (s.metadata as { classId?: string } | null)?.classId;
    if (classId && countByClass.has(classId)) {
      countByClass.set(classId, (countByClass.get(classId) ?? 0) + 1);
    }
  }

  const ranked = classes
    .map((cls) => ({
      ...cls,
      studentCount: countByClass.get(cls.id) ?? 0,
    }))
    .filter((c) => c.studentCount > 0)
    .sort((a, b) => b.studentCount - a.studentCount);

  if (ranked.length < limit) {
    throw new Error(
      `Need at least ${limit} classes with enrolled students in ${schoolId}. Found ${ranked.length}. Run seed-full-production.ts first.`,
    );
  }

  const picked = ranked.slice(0, limit);
  for (const c of picked) {
    console.log(`   → Class: ${c.name} ${c.section} (${c.studentCount} students)`);
  }

  return picked;
}

const TEACHER_SUBJECTS = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies'];

async function linkTeacherToClasses(teacherId: string, classes: ClassWithStudents[]) {
  console.log('🔗 Linking dev teacher to classes via TeacherClass…');

  for (let i = 0; i < classes.length; i++) {
    const cls = classes[i];
    const subject = TEACHER_SUBJECTS[i % TEACHER_SUBJECTS.length];

    await prisma.teacherClass.upsert({
      where: {
        teacherId_classId_subject: {
          teacherId,
          classId: cls.id,
          subject,
        },
      },
      update: { isClassTeacher: i === 0 },
      create: {
        teacherId,
        classId: cls.id,
        subject,
        isClassTeacher: i === 0,
      },
    });

    console.log(`   ✅ TeacherClass: ${cls.name} ${cls.section} — ${subject}${i === 0 ? ' (class teacher)' : ''}`);
  }
}

async function linkParentToStudent(parentId: string, studentId: string) {
  console.log('🔗 Linking dev parent to student via ParentStudent…');

  await prisma.parentStudent.upsert({
    where: { parentId_studentId: { parentId, studentId } },
    update: { relationship: 'parent', isPrimary: true },
    create: {
      parentId,
      studentId,
      relationship: 'parent',
      isPrimary: true,
    },
  });

  console.log('   ✅ ParentStudent link upserted');
}

async function main() {
  console.log('🚀 Seeding developer test accounts (@sc.dev)…\n');

  const school = await prisma.school.findUnique({ where: { id: SCHOOL_ID } });
  if (!school) {
    throw new Error(`School ${SCHOOL_ID} not found. Run seed-full-production.ts or create-demo-users.ts first.`);
  }
  console.log(`✅ School: ${school.name} (${school.id})\n`);

  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 12);
  console.log('✅ Password hashed (bcrypt rounds: 12)\n');

  const users: Record<string, { id: string; email: string; role: string; name: string }> = {};

  for (const acct of DEV_ACCOUNTS) {
    console.log(`👤 Upserting ${acct.role}: ${acct.email}`);
    const user = await upsertUser({
      email: acct.email,
      name: acct.name,
      role: acct.role,
      schoolId: SCHOOL_ID,
      passwordHash,
    });
    users[acct.email] = { id: user.id, email: user.email, role: user.role, name: user.name };
    console.log(`   ✅ ${user.name} (${user.id})\n`);
  }

  // No separate Parent / Teacher tables — role lives on User; linkages use ParentStudent + TeacherClass.
  console.log('ℹ️  No separate Parent/Teacher tables in schema — using User role + junction tables.\n');

  const bestStudent = await findStudentWithMostData(SCHOOL_ID);
  await linkParentToStudent(users['dev.parent@sc.dev'].id, bestStudent.student.id);
  console.log('');

  const topClasses = await findTopClassesWithStudents(SCHOOL_ID, 2);
  await linkTeacherToClasses(users['dev.teacher@sc.dev'].id, topClasses);
  console.log('');

  const classLabels = topClasses.map((c) => `${c.name} ${c.section} (${c.studentCount} students)`);

  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('  DEV ACCOUNTS SUMMARY — password for all: ' + DEV_PASSWORD);
  console.log('  School: ' + school.name + ' | schoolId: ' + SCHOOL_ID);
  console.log('  Login: use schoolId "' + SCHOOL_ID + '" (or school code ' + (school.schoolCode ?? '—') + ')');
  console.log('───────────────────────────────────────────────────────────────────────────');
  console.log('  Email                  | Role       | Linked to');
  console.log('───────────────────────────────────────────────────────────────────────────');
  console.log(
    `  dev.parent@sc.dev        | PARENT     | ${bestStudent.student.name} (${bestStudent.student.email})`,
  );
  console.log(`  dev.teacher@sc.dev       | TEACHER    | ${classLabels.join('; ')}`);
  console.log('  dev.admin@sc.dev         | ADMIN      | —');
  console.log('  dev.principal@sc.dev     | PRINCIPAL  | —');
  console.log('  dev.bus@sc.dev           | BUS_HELPER | —');
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('\n🎉 Developer accounts seeded successfully.\n');
}

main()
  .catch((err: unknown) => {
    const e = err as Error;
    console.error('❌ seed-dev-accounts failed:', e.message);
    if (e.stack) console.error(e.stack);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
