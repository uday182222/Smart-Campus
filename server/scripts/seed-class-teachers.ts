/**
 * Assign a class teacher to every class missing one in demo + dev schools.
 * Idempotent: skips classes that already have isClassTeacher = true.
 *
 * Run from server/:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-class-teachers.ts
 */
import 'dotenv/config';
import prisma from '../src/config/database';

const SCHOOL_IDS = ['demo-school-001', 'dev-school-001'] as const;

async function main() {
  console.log('👩‍🏫 Seeding class teachers for demo + dev schools…\n');

  let assigned = 0;
  let alreadyHad = 0;
  let skippedNoTeachers = 0;
  const skippedNames: string[] = [];

  const classes = await prisma.class.findMany({
    where: { schoolId: { in: [...SCHOOL_IDS] } },
    include: {
      school: { select: { name: true, schoolCode: true } },
      teachers: {
        orderBy: { createdAt: 'asc' },
        include: { teacher: { select: { name: true } } },
      },
    },
    orderBy: [{ schoolId: 'asc' }, { name: 'asc' }, { section: 'asc' }],
  });

  for (const cls of classes) {
    const label = `${cls.name} ${cls.section} (${cls.school.schoolCode})`;

    const existing = cls.teachers.find((t) => t.isClassTeacher);
    if (existing) {
      alreadyHad += 1;
      console.log(`   ✓ Already set — ${label} → ${existing.teacher.name}`);
      continue;
    }

    if (cls.teachers.length === 0) {
      skippedNoTeachers += 1;
      skippedNames.push(label);
      console.log(`   ⚠️  Skipped (no teachers) — ${label}`);
      continue;
    }

    const pick = cls.teachers[0];
    await prisma.$transaction(async (tx) => {
      await tx.teacherClass.updateMany({
        where: { classId: cls.id },
        data: { isClassTeacher: false },
      });
      await tx.teacherClass.update({
        where: { id: pick.id },
        data: { isClassTeacher: true },
      });
    });

    assigned += 1;
    console.log(`   ✅ Assigned — ${label} → ${pick.teacher.name} (${pick.subject})`);
  }

  console.log('\n═══════════════════════════════════════════════════════════════════════════');
  console.log('  CLASS TEACHER SEED SUMMARY');
  console.log('───────────────────────────────────────────────────────────────────────────');
  console.log(`  Assigned:              ${assigned}`);
  console.log(`  Already had one:       ${alreadyHad}`);
  console.log(`  Skipped (no teachers): ${skippedNoTeachers}`);
  if (skippedNames.length > 0) {
    console.log('  Skipped classes:');
    for (const n of skippedNames) console.log(`    - ${n}`);
  }
  console.log('═══════════════════════════════════════════════════════════════════════════\n');
  console.log('🎉 Class teacher seed complete.\n');
}

main().catch((err: unknown) => {
  const e = err as Error;
  console.error('❌ seed-class-teachers failed:', e.message);
  if (e.stack) console.error(e.stack);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
