/**
 * Assign teachers to demo-school classes that have zero teacher_classes rows.
 * Rotates teachers round-robin across subjects/classes for even load.
 * Sets isClassTeacher on the first subject per newly seeded class.
 *
 * Run from server/:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-teacher-assignments.ts
 *
 * Then optionally:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-class-teachers.ts
 */
import 'dotenv/config';
import prisma from '../src/config/database';

const SCHOOL_ID = 'demo-school-001';

const DEFAULT_SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'Hindi',
  'Social Studies',
] as const;

function parseSubjects(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    const list = raw
      .map((s) => (typeof s === 'string' ? s.trim() : String(s ?? '').trim()))
      .filter(Boolean);
    if (list.length > 0) return list;
  }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const list = Object.values(raw as Record<string, unknown>)
      .map((s) => (typeof s === 'string' ? s.trim() : String(s ?? '').trim()))
      .filter(Boolean);
    if (list.length > 0) return list;
  }
  return [...DEFAULT_SUBJECTS];
}

async function printVerification() {
  const classes = await prisma.class.findMany({
    where: { schoolId: SCHOOL_ID },
    include: {
      teachers: {
        include: { teacher: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: [{ name: 'asc' }, { section: 'asc' }],
  });

  const withAssignments = classes.filter((c) => c.teachers.length > 0);
  const withClassTeacher = classes.filter((c) => c.teachers.some((t) => t.isClassTeacher));

  const perTeacher = new Map<string, { name: string; email: string; classes: Set<string> }>();
  for (const cls of classes) {
    for (const tc of cls.teachers) {
      const key = tc.teacherId;
      if (!perTeacher.has(key)) {
        perTeacher.set(key, {
          name: tc.teacher.name,
          email: tc.teacher.email,
          classes: new Set(),
        });
      }
      perTeacher.get(key)!.classes.add(cls.id);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════════════════');
  console.log('  VERIFICATION — demo-school-001');
  console.log('───────────────────────────────────────────────────────────────────────────');
  console.log(`  Total classes:                    ${classes.length}`);
  console.log(`  With >= 1 teacher_classes row:      ${withAssignments.length}`);
  console.log(`  With class teacher assigned:        ${withClassTeacher.length}`);
  console.log('───────────────────────────────────────────────────────────────────────────');
  console.log('  Per-teacher class count (distinct classes):');
  const teacherRows = [...perTeacher.values()].sort((a, b) => a.name.localeCompare(b.name));
  if (teacherRows.length === 0) {
    console.log('    (no teacher assignments)');
  } else {
    for (const row of teacherRows) {
      console.log(`    ${row.name} (${row.email}): ${row.classes.size} class(es)`);
    }
  }
  console.log('═══════════════════════════════════════════════════════════════════════════\n');
}

async function main() {
  console.log('👨‍🏫 Seeding teacher-class assignments for demo-school-001…\n');

  const school = await prisma.school.findUnique({
    where: { id: SCHOOL_ID },
    select: { id: true, name: true, schoolCode: true },
  });
  if (!school) {
    throw new Error(`School not found: ${SCHOOL_ID}`);
  }
  console.log(`   School: ${school.name} (${school.schoolCode})\n`);

  const teachers = await prisma.user.findMany({
    where: { schoolId: SCHOOL_ID, role: 'TEACHER' },
    orderBy: [{ name: 'asc' }, { email: 'asc' }],
    select: { id: true, name: true, email: true },
  });

  if (teachers.length === 0) {
    console.log('   ⚠️  No TEACHER users in demo-school-001 — nothing to assign.\n');
    await printVerification();
    return;
  }

  console.log(`   Found ${teachers.length} teacher(s) in school\n`);

  const allClasses = await prisma.class.findMany({
    where: { schoolId: SCHOOL_ID },
    include: { _count: { select: { teachers: true } } },
    orderBy: [{ name: 'asc' }, { section: 'asc' }],
  });

  const emptyClasses = allClasses.filter((c) => c._count.teachers === 0);
  const skippedExisting = allClasses.length - emptyClasses.length;

  if (emptyClasses.length === 0) {
    console.log(`   ✓ All ${allClasses.length} classes already have teacher assignments.\n`);
    await printVerification();
    return;
  }

  let teacherCursor = 0;
  let rowsCreated = 0;
  let classesSeeded = 0;

  for (const cls of emptyClasses) {
    const label = `${cls.name} ${cls.section}`;
    const subjects = parseSubjects(cls.subjects);

    console.log(`   📚 ${label} — ${subjects.length} subject(s)`);

    for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i];
      const teacher = teachers[teacherCursor % teachers.length];
      teacherCursor += 1;

      const isClassTeacher = i === 0;

      await prisma.teacherClass.upsert({
        where: {
          teacherId_classId_subject: {
            teacherId: teacher.id,
            classId: cls.id,
            subject,
          },
        },
        update: { isClassTeacher },
        create: {
          teacherId: teacher.id,
          classId: cls.id,
          subject,
          isClassTeacher,
        },
      });

      rowsCreated += 1;
      const ctTag = isClassTeacher ? ' [class teacher]' : '';
      console.log(`      → ${teacher.name} — ${subject}${ctTag}`);
    }

    classesSeeded += 1;
  }

  console.log('\n═══════════════════════════════════════════════════════════════════════════');
  console.log('  TEACHER ASSIGNMENT SEED SUMMARY');
  console.log('───────────────────────────────────────────────────────────────────────────');
  console.log(`  Classes seeded (were empty):     ${classesSeeded}`);
  console.log(`  Skipped (already had rows):      ${skippedExisting}`);
  console.log(`  teacher_classes rows upserted: ${rowsCreated}`);
  console.log('═══════════════════════════════════════════════════════════════════════════');

  await printVerification();
  console.log('🎉 Teacher assignment seed complete.\n');
}

main()
  .catch((err: unknown) => {
    const e = err as Error;
    console.error('❌ seed-teacher-assignments failed:', e.message);
    if (e.stack) console.error(e.stack);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
