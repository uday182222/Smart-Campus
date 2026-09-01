/**
 * Weekly timetables for all classes in demo-school-001 and dev-school-001.
 * Idempotent: upserts on (classId, dayOfWeek, periodNumber).
 *
 * Run from server/:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-timetables.ts
 */
import 'dotenv/config';
import prisma from '../src/config/database';

const SCHOOL_IDS = ['demo-school-001', 'dev-school-001'] as const;

const DEFAULT_SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'Hindi',
  'Social Studies',
  'Computer Science',
];

const PERIOD_SLOTS = [
  { periodNumber: 1, startTime: '08:00', endTime: '08:45' },
  { periodNumber: 2, startTime: '08:45', endTime: '09:30' },
  { periodNumber: 3, startTime: '09:45', endTime: '10:30' },
  { periodNumber: 4, startTime: '10:30', endTime: '11:15' },
  { periodNumber: 5, startTime: '11:30', endTime: '12:15' },
  { periodNumber: 6, startTime: '12:15', endTime: '13:00' },
] as const;

const DAYS = [1, 2, 3, 4, 5] as const;

function parseSubjects(subjects: unknown): string[] {
  if (Array.isArray(subjects)) {
    const list = subjects
      .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      .map((s) => s.trim());
    if (list.length > 0) return list;
  }
  return [...DEFAULT_SUBJECTS];
}

function normalizeSubject(s: string): string {
  return s.toLowerCase().trim();
}

function pickTeacher(
  subject: string,
  teacherLinks: { teacherId: string; subject: string }[],
  slotIndex: number,
): string | null {
  if (teacherLinks.length === 0) return null;
  const norm = normalizeSubject(subject);
  const match = teacherLinks.find((tc) => normalizeSubject(tc.subject) === norm);
  if (match) return match.teacherId;
  return teacherLinks[slotIndex % teacherLinks.length].teacherId;
}

async function seedClassTimetable(cls: {
  id: string;
  schoolId: string;
  name: string;
  section: string;
  roomNumber: string | null;
  subjects: unknown;
}): Promise<number> {
  const subjects = parseSubjects(cls.subjects);
  const teacherLinks = await prisma.teacherClass.findMany({
    where: { classId: cls.id },
    select: { teacherId: true, subject: true },
    orderBy: { createdAt: 'asc' },
  });

  let count = 0;
  let slotIndex = 0;

  for (const dayOfWeek of DAYS) {
    for (const slot of PERIOD_SLOTS) {
      const subject = subjects[slotIndex % subjects.length];
      const teacherId = pickTeacher(subject, teacherLinks, slotIndex);

      await prisma.timetablePeriod.upsert({
        where: {
          classId_dayOfWeek_periodNumber: {
            classId: cls.id,
            dayOfWeek,
            periodNumber: slot.periodNumber,
          },
        },
        create: {
          classId: cls.id,
          schoolId: cls.schoolId,
          dayOfWeek,
          periodNumber: slot.periodNumber,
          subject,
          teacherId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          roomNumber: cls.roomNumber,
        },
        update: {
          schoolId: cls.schoolId,
          subject,
          teacherId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          roomNumber: cls.roomNumber,
        },
      });

      count += 1;
      slotIndex += 1;
    }
  }

  return count;
}

async function main() {
  console.log('📅 Seeding weekly timetables for demo + dev schools…\n');

  const schools = await prisma.school.findMany({
    where: { id: { in: [...SCHOOL_IDS] } },
    select: { id: true, name: true, schoolCode: true },
    orderBy: { id: 'asc' },
  });

  const foundIds = new Set(schools.map((s) => s.id));
  for (const id of SCHOOL_IDS) {
    if (!foundIds.has(id)) {
      console.warn(`⚠️  School not found: ${id} — skipping`);
    }
  }

  const classes = await prisma.class.findMany({
    where: { schoolId: { in: [...SCHOOL_IDS] } },
    select: {
      id: true,
      schoolId: true,
      name: true,
      section: true,
      roomNumber: true,
      subjects: true,
    },
    orderBy: [{ schoolId: 'asc' }, { name: 'asc' }, { section: 'asc' }],
  });

  if (classes.length === 0) {
    console.log('No classes found in target schools. Nothing to seed.');
    return;
  }

  const perSchool = new Map<string, number>();
  for (const id of SCHOOL_IDS) perSchool.set(id, 0);

  let classesOk = 0;
  let classesFailed = 0;

  for (const cls of classes) {
    const label = `${cls.name} ${cls.section} (${cls.schoolId})`;
    try {
      const periods = await seedClassTimetable(cls);
      perSchool.set(cls.schoolId, (perSchool.get(cls.schoolId) ?? 0) + periods);
      classesOk += 1;
      console.log(`   ✅ ${label} — ${periods} periods`);
    } catch (err: unknown) {
      classesFailed += 1;
      const e = err as Error;
      console.error(`   ❌ ${label} — ${e.message}`);
      if (e.stack) console.error(e.stack);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════════════════');
  console.log('  TIMETABLE SEED SUMMARY');
  console.log('───────────────────────────────────────────────────────────────────────────');
  for (const school of schools) {
    const total = perSchool.get(school.id) ?? 0;
    console.log(`  ${school.name} (${school.schoolCode}): ${total} periods`);
  }
  console.log('───────────────────────────────────────────────────────────────────────────');
  console.log(`  Classes processed: ${classesOk} ok, ${classesFailed} failed (${classes.length} total)`);
  console.log(`  Expected per class: ${DAYS.length * PERIOD_SLOTS.length} periods (Mon–Fri × 6 slots)`);
  console.log('═══════════════════════════════════════════════════════════════════════════\n');
  console.log('🎉 Timetable seed complete.\n');

  if (classesFailed > 0) process.exit(1);
}

main().catch((err: unknown) => {
  const e = err as Error;
  console.error('❌ seed-timetables failed:', e.message);
  if (e.stack) console.error(e.stack);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
