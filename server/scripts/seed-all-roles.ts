/**
 * Extends SCH-DEMO-01 with extra “all roles” production-like data.
 * Safe to re-run: uses upserts with stable ids where Prisma lacks natural uniques.
 *
 * Run from server/:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-full-production.ts
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-all-roles.ts
 */
import 'dotenv/config';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import prisma from '../src/config/database';

const DEMO_SCHOOL_CODE = 'SCH-DEMO-01';
const DEFAULT_PASSWORD = 'password123';
const CHANNELS = ['in_app'] as unknown as object;

async function main() {
  console.log('🚀 Seeding all roles…');
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  const school = await prisma.school.findFirst({ where: { schoolCode: DEMO_SCHOOL_CODE } });
  if (!school) throw new Error('Run seed-full-production.ts first (school missing).');
  const schoolId = school.id;

  const admin = await prisma.user.findFirst({ where: { email: 'admin@demo.com', schoolId } });
  const primaryTeacher = await prisma.user.findFirst({ where: { email: 'priya@demo.com', schoolId } });
  const busHelper = await prisma.user.findFirst({ where: { email: 'bushelper@demo.com', schoolId } });
  if (!admin || !primaryTeacher) throw new Error('Run seed-full-production.ts first (admin/teacher missing).');

  const allTeachers = await prisma.user.findMany({ where: { role: UserRole.TEACHER, schoolId } });
  const allClasses = await prisma.class.findMany({ where: { schoolId } });

  // ── TEACHER DATA ────────────────────────────────────────────────
  console.log('\n👩‍🏫 Teacher extensions…');

  // Link each teacher to multiple classes (TeacherClass has @@unique([teacherId, classId, subject]))
  const classAssignments = [
    { teacherEmail: 'priya@demo.com', subject: 'Mathematics', classNames: ['Grade 5', 'Grade 6'] },
    { teacherEmail: 'rahul@demo.com', subject: 'Science', classNames: ['Grade 5', 'Grade 7'] },
    { teacherEmail: 'anita@demo.com', subject: 'English', classNames: ['Grade 6', 'Grade 8'] },
    { teacherEmail: 'suresh@demo.com', subject: 'Hindi', classNames: ['Grade 7', 'Grade 8'] },
    { teacherEmail: 'meena@demo.com', subject: 'Social Studies', classNames: ['Grade 5', 'Grade 6'] },
  ];

  for (const a of classAssignments) {
    const t = await prisma.user.findFirst({ where: { email: a.teacherEmail, schoolId, role: UserRole.TEACHER } });
    if (!t) continue;
    for (const className of a.classNames) {
      const candidates = allClasses.filter((c) => c.name === className);
      for (const cls of candidates) {
        await prisma.teacherClass
          .upsert({
            where: { teacherId_classId_subject: { teacherId: t.id, classId: cls.id, subject: a.subject } },
            update: { isClassTeacher: false },
            create: { teacherId: t.id, classId: cls.id, subject: a.subject, isClassTeacher: false },
          })
          .catch(() => {});
      }
    }
  }
  console.log('✅ Teacher multi-class assignments upserted');

  // Timetable: store in Class.schedule JSON (there is NO ClassPeriod model in this schema)
  const timetable = [
    { email: 'priya@demo.com', day: 'Monday', time: '08:00', endTime: '08:45', subject: 'Mathematics', className: 'Grade 5', section: 'A', room: '202' },
    { email: 'priya@demo.com', day: 'Monday', time: '10:00', endTime: '10:45', subject: 'Mathematics', className: 'Grade 5', section: 'B', room: '203' },
    { email: 'priya@demo.com', day: 'Tuesday', time: '08:00', endTime: '08:45', subject: 'Mathematics', className: 'Grade 6', section: 'A', room: '204' },
    { email: 'rahul@demo.com', day: 'Monday', time: '09:00', endTime: '09:45', subject: 'Science', className: 'Grade 5', section: 'A', room: '202' },
    { email: 'rahul@demo.com', day: 'Wednesday', time: '08:00', endTime: '08:45', subject: 'Science', className: 'Grade 7', section: 'A', room: '301' },
    { email: 'anita@demo.com', day: 'Thursday', time: '10:00', endTime: '10:45', subject: 'English', className: 'Grade 8', section: 'A', room: '302' },
  ] as const;

  // Group per classId
  const slotsByClassId = new Map<string, any[]>();
  for (const t of timetable) {
    const teacherUser = allTeachers.find((x) => x.email === t.email);
    const cls = allClasses.find((c) => c.name === t.className && c.section === t.section);
    if (!teacherUser || !cls) continue;
    const slots = slotsByClassId.get(cls.id) ?? [];
    slots.push({
      day: t.day,
      startTime: t.time,
      endTime: t.endTime,
      subject: t.subject,
      teacherId: teacherUser.id,
      room: t.room,
    });
    slotsByClassId.set(cls.id, slots);
  }
  for (const [classId, newSlots] of slotsByClassId) {
    const cls = await prisma.class.findUnique({ where: { id: classId } });
    const existing = (cls?.schedule as any) || {};
    const existingSlots = Array.isArray(existing?.slots) ? existing.slots : [];
    // Merge by (day,startTime,subject,teacherId)
    const key = (s: any) => `${s.day}::${s.startTime}::${s.subject}::${s.teacherId}`;
    const merged = new Map<string, any>();
    existingSlots.forEach((s: any) => merged.set(key(s), s));
    newSlots.forEach((s: any) => merged.set(key(s), s));
    await prisma.class.update({
      where: { id: classId },
      data: { schedule: { ...existing, slots: Array.from(merged.values()) } as object },
    });
  }
  console.log('✅ Timetable slots merged into Class.schedule JSON');

  // Teacher notifications (Notification uses body + channels; no schoolId column)
  const teacherNotifs = [
    { title: 'New PTM Scheduled', body: 'Parent-Teacher Meeting scheduled for April 10th. Please prepare student progress reports.', category: 'announcement' },
    { title: 'Exam Schedule Released', body: 'Mid-term exam schedule has been finalized. Please review and prepare question papers.', category: 'announcement' },
    { title: 'Homework submissions pending', body: '8 students have not submitted the Mathematics homework due yesterday.', category: 'homework' },
    { title: 'New student enrolled', body: 'A new student has been enrolled in Grade 5A. Please update your records.', category: 'announcement' },
  ];
  for (const t of allTeachers) {
    for (let i = 0; i < teacherNotifs.length; i++) {
      const n = teacherNotifs[i];
      const id = `notif-teacher-${t.id.slice(0, 8)}-${i}`;
      await prisma.notification.upsert({
        where: { id },
        update: { title: n.title, body: n.body, category: n.category, channels: CHANNELS, status: 'delivered' },
        create: { id, userId: t.id, title: n.title, body: n.body, category: n.category, channels: CHANNELS, priority: 'normal', status: 'delivered' },
      });
    }
  }
  console.log('✅ Teacher notifications upserted');

  // ── ADMIN DATA ────────────────────────────────────────────────────
  console.log('\n👤 Admin extensions…');
  const adminNotifs = [
    { title: 'Pending Registrations', body: 'New registration requests are awaiting your approval. Review and approve/reject them.', category: 'announcement' },
    { title: 'Fee collection update', body: 'Term fees collection report is ready. Some payments remain pending/overdue.', category: 'fees' },
    { title: 'Attendance report ready', body: 'Monthly attendance report is ready for review.', category: 'attendance' },
    { title: 'New teacher onboarding', body: 'A new teacher profile needs role assignment and class allocation.', category: 'announcement' },
  ];
  for (let i = 0; i < adminNotifs.length; i++) {
    const n = adminNotifs[i];
    await prisma.notification.upsert({
      where: { id: `notif-admin-${i}` },
      update: { title: n.title, body: n.body, category: n.category, channels: CHANNELS, status: 'delivered' },
      create: { id: `notif-admin-${i}`, userId: admin.id, title: n.title, body: n.body, category: n.category, channels: CHANNELS, priority: 'high', status: 'delivered' },
    });
  }

  await prisma.announcement.upsert({
    where: { id: 'ann-all-roles-ptm' },
    update: { status: 'sent', sentAt: new Date() },
    create: {
      id: 'ann-all-roles-ptm',
      schoolId,
      title: 'PTM Reminder',
      message: 'Parent-Teacher Meeting is scheduled for April 10th at 10:00 AM. Please attend as per your slot.',
      priority: 'normal',
      targetAudience: { roles: ['PARENT', 'TEACHER'], schoolId } as object,
      channels: CHANNELS,
      status: 'sent',
      sentAt: new Date(),
      createdBy: admin.id,
    },
  });
  console.log('✅ Admin notifications + announcement upserted');

  // ── BUS HELPER DATA ───────────────────────────────────────────────
  console.log('\n🚌 Bus helper extensions…');
  if (busHelper) {
    const route = await prisma.route.findFirst({ where: { schoolId, status: 'active' } });
    if (route) {
      const stops = (route.stops as any) || [];
      const stopIds: string[] = (Array.isArray(stops) ? stops : []).map((s: any) => String(s.id)).filter(Boolean);

      // Create 5 completed trips with stop records + a few boardings.
      for (let i = 0; i < 5; i++) {
        const day = new Date();
        day.setDate(day.getDate() - (i + 1));
        const startedAt = new Date(day);
        startedAt.setHours(7, 30, 0, 0);
        const endedAt = new Date(day);
        endedAt.setHours(8, 35, 0, 0);
        const tripId = `trip-all-roles-${day.toISOString().slice(0, 10)}`;

        await prisma.trip.upsert({
          where: { id: tripId },
          update: { status: 'COMPLETED', startedAt, endedAt, routeId: route.id, driverId: busHelper.id },
          create: { id: tripId, routeId: route.id, driverId: busHelper.id, status: 'COMPLETED', startedAt, endedAt },
        });

        for (const stopId of stopIds) {
          await prisma.stopRecord.upsert({
            where: { tripId_stopId: { tripId, stopId } },
            update: { status: 'REACHED', reachedAt: endedAt },
            create: { tripId, stopId, status: 'REACHED', reachedAt: endedAt },
          });
        }

        // Boardings: pick up to 3 students that exist in route stops
        const stopWithStudents = (Array.isArray(stops) ? stops : []).find((s: any) => Array.isArray(s?.students) && s.students.length > 0);
        const boarded = (stopWithStudents?.students ?? []).slice(0, 3);
        for (let b = 0; b < boarded.length; b++) {
          const stId = boarded[b]?.id;
          if (!stId) continue;
          const boardingId = `boarding-${tripId}-${b}`;
          await prisma.boarding.upsert({
            where: { id: boardingId },
            update: { tripId, studentId: stId, stopId: String(stopWithStudents.id), boardedAt: startedAt },
            create: { id: boardingId, tripId, studentId: stId, stopId: String(stopWithStudents.id), boardedAt: startedAt },
          });
        }
      }
      console.log('✅ Bus trip history upserted (5 trips)');

      const busNotifs = [
        { title: 'Route updated', body: 'Route 1 North Zone has been updated. Please review the latest stops order before departure.', category: 'announcement' },
        { title: 'Trip summary ready', body: 'Yesterday’s trip summary has been generated. Check boarded and skipped students.', category: 'transport' },
      ];
      for (let i = 0; i < busNotifs.length; i++) {
        const n = busNotifs[i];
        await prisma.notification.upsert({
          where: { id: `notif-bushelper-${i}` },
          update: { title: n.title, body: n.body, category: n.category, channels: CHANNELS, status: 'delivered' },
          create: { id: `notif-bushelper-${i}`, userId: busHelper.id, title: n.title, body: n.body, category: n.category, channels: CHANNELS, priority: 'normal', status: 'delivered' },
        });
      }
      console.log('✅ Bus helper notifications upserted');
    }
  }

  // ── SUPER ADMIN DATA ──────────────────────────────────────────────
  console.log('\n🔑 Super admin extensions…');
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@smartcampus.com' },
    update: { name: 'Super Admin', role: UserRole.SUPER_ADMIN, password: hash },
    create: {
      name: 'Super Admin',
      email: 'superadmin@smartcampus.com',
      password: hash,
      role: UserRole.SUPER_ADMIN,
      phone: '+911234567890',
      schoolId: null,
    },
  });

  const now = new Date();
  const subStart = now;
  const subEnd = new Date(now);
  subEnd.setFullYear(subEnd.getFullYear() + 1);

  const demoSchools = [
    { name: 'Delhi Public School', code: 'SCH-DPS-01', color: '#DC2626' },
    { name: 'Ryan International', code: 'SCH-RYAN-01', color: '#7C3AED' },
    { name: 'DAV Public School', code: 'SCH-DAV-01', color: '#D97706' },
  ];

  for (const s of demoSchools) {
    const existing = await prisma.school.findFirst({ where: { schoolCode: s.code } });
    if (existing) {
      await prisma.school.update({
        where: { id: existing.id },
        data: { name: s.name, primaryColor: s.color, secondaryColor: '#22C55E', isActive: true },
      });
      continue;
    }
    await prisma.school.create({
      data: {
        name: s.name,
        schoolCode: s.code,
        primaryColor: s.color,
        secondaryColor: '#22C55E',
        address: 'Delhi, India',
        city: 'Delhi',
        state: 'Delhi',
        zipCode: '110001',
        contactEmail: `office@${s.code.toLowerCase()}.demo`,
        contactPhone: '+911234567890',
        isActive: true,
        registrationOpen: false,
        status: 'active',
        subscriptionPlan: 'basic',
        subscriptionStart: subStart,
        subscriptionEnd: subEnd,
      },
    });
  }
  console.log('✅ Super admin + 3 demo schools upserted:', superAdmin.email);

  // ── MORE GALLERY ITEMS (schema-correct) ───────────────────────────
  console.log('\n🖼️ More gallery items…');
  const moreGallery = [
    { id: 'gal-allroles-1', caption: '[AllRoles] Independence Day', url: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800' },
    { id: 'gal-allroles-2', caption: '[AllRoles] Diwali Celebration', url: 'https://images.unsplash.com/photo-1605092676920-8d0c5e8e57b1?w=800' },
    { id: 'gal-allroles-3', caption: '[AllRoles] Students Learning', url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800' },
    { id: 'gal-allroles-4', caption: '[AllRoles] School Garden', url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800' },
  ] as const;

  for (const g of moreGallery) {
    await prisma.galleryItem.upsert({
      where: { id: g.id },
      update: { caption: g.caption, url: g.url, thumbnailUrl: g.url, uploadedBy: admin.id, schoolId },
      create: {
        id: g.id,
        schoolId,
        uploadedBy: admin.id,
        type: 'image',
        url: g.url,
        thumbnailUrl: g.url,
        caption: g.caption,
        event: 'School Life',
        fileSize: BigInt(190000),
        visibility: 'public',
      },
    });
  }
  console.log('✅ Gallery extended (+4)'); // totals vary by prior seeds

  console.log('\n🎉 ALL roles extended seed complete.\n');
  console.log('Admin:       admin@demo.com / password123');
  console.log('Teacher:     priya@demo.com / password123');
  console.log('Bus Helper:  bushelper@demo.com / password123');
  console.log('Super Admin: superadmin@smartcampus.com / password123');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error('❌ Error:', e?.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

