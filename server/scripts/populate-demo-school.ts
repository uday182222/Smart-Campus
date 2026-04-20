import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Populating Demo School...');

  const school = await prisma.school.findFirst({
    where: { schoolCode: 'SCH-DEMO-01' },
  });
  if (!school) throw new Error('Demo school not found. Ensure demo school and users exist.');

  const schoolId = school.id;
  const hash = await bcrypt.hash('password123', 10);

  // CLASSES
  console.log('📚 Creating classes...');
  const classData = [
    { name: 'Nursery', section: 'A', roomNumber: '101' },
    { name: 'KG', section: 'A', roomNumber: '102' },
    { name: 'KG', section: 'B', roomNumber: '103' },
    { name: 'Grade 1', section: 'A', roomNumber: '201' },
    { name: 'Grade 1', section: 'B', roomNumber: '202' },
    { name: 'Grade 2', section: 'A', roomNumber: '203' },
    { name: 'Grade 3', section: 'A', roomNumber: '204' },
    { name: 'Grade 4', section: 'A', roomNumber: '205' },
    { name: 'Grade 5', section: 'A', roomNumber: '301' },
    { name: 'Grade 5', section: 'B', roomNumber: '302' },
    { name: 'Grade 6', section: 'A', roomNumber: '303' },
    { name: 'Grade 7', section: 'A', roomNumber: '304' },
    { name: 'Grade 8', section: 'A', roomNumber: '401' },
    { name: 'Grade 9', section: 'A', roomNumber: '402' },
    { name: 'Grade 10', section: 'A', roomNumber: '403' },
  ];

  const classes: any[] = [];
  for (const c of classData) {
    const id = `${schoolId}-${c.name}-${c.section}`.replace(/\s/g, '-').toLowerCase();
    const cls = await prisma.class.upsert({
      where: { id },
      update: {},
      create: {
        id,
        name: c.name,
        section: c.section,
        roomNumber: c.roomNumber,
        schoolId,
        subjects: ['Mathematics', 'Science', 'English'] as any,
      },
    });
    classes.push(cls);
  }
  console.log(`✅ Created ${classes.length} classes`);

  // TEACHERS
  console.log('👩‍🏫 Creating teachers...');
  const teacherData = [
    { name: 'Priya Sharma', email: 'priya@demo.com', subject: 'Mathematics' },
    { name: 'Rahul Verma', email: 'rahul@demo.com', subject: 'Science' },
    { name: 'Anita Patel', email: 'anita@demo.com', subject: 'English' },
    { name: 'Suresh Kumar', email: 'suresh@demo.com', subject: 'Hindi' },
    { name: 'Meena Joshi', email: 'meena@demo.com', subject: 'Social Studies' },
  ];

  const teachers: any[] = [];
  for (const t of teacherData) {
    const teacher = await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: {
        name: t.name,
        email: t.email,
        password: hash,
        role: UserRole.TEACHER,
        status: UserStatus.ACTIVE,
        schoolId,
        phone: `+91${Math.floor(9000000000 + Math.random() * 999999999)}`,
      },
    });
    teachers.push({ ...teacher, subject: t.subject });
  }
  console.log(`✅ Created ${teachers.length} teachers`);

  // PARENTS + STUDENTS
  console.log('👨‍👩‍👧 Creating parents and students...');
  const studentData = [
    { studentName: 'Aarav Singh', parentName: 'Rajesh Singh', parentEmail: 'rajesh@demo.com', className: 'Grade 5', section: 'A' },
    { studentName: 'Diya Patel', parentName: 'Amit Patel', parentEmail: 'amit@demo.com', className: 'Grade 5', section: 'A' },
    { studentName: 'Arjun Sharma', parentName: 'Vikram Sharma', parentEmail: 'vikram@demo.com', className: 'Grade 5', section: 'B' },
    { studentName: 'Ananya Kumar', parentName: 'Deepak Kumar', parentEmail: 'deepak@demo.com', className: 'Grade 6', section: 'A' },
    { studentName: 'Rohan Gupta', parentName: 'Sanjay Gupta', parentEmail: 'sanjay@demo.com', className: 'Grade 4', section: 'A' },
    { studentName: 'Ishaan Mehta', parentName: 'Nitin Mehta', parentEmail: 'nitin@demo.com', className: 'Grade 3', section: 'A' },
    { studentName: 'Kavya Nair', parentName: 'Sunil Nair', parentEmail: 'sunil@demo.com', className: 'Grade 7', section: 'A' },
    { studentName: 'Vivaan Joshi', parentName: 'Prakash Joshi', parentEmail: 'prakash@demo.com', className: 'Grade 2', section: 'A' },
    { studentName: 'Aisha Khan', parentName: 'Imran Khan', parentEmail: 'imran@demo.com', className: 'Grade 8', section: 'A' },
    { studentName: 'Riya Kapoor', parentName: 'Rohit Kapoor', parentEmail: 'rohit@demo.com', className: 'Grade 9', section: 'A' },
  ];

  const students: any[] = [];
  for (const s of studentData) {
    const cls = classes.find((c) => c.name === s.className && c.section === s.section);
    if (!cls) continue;

    const parent = await prisma.user.upsert({
      where: { email: s.parentEmail },
      update: {},
      create: {
        name: s.parentName,
        email: s.parentEmail,
        password: hash,
        role: UserRole.PARENT,
        status: UserStatus.ACTIVE,
        schoolId,
        phone: `+91${Math.floor(9000000000 + Math.random() * 999999999)}`,
      },
    });

    const studentEmail = `${s.studentName.toLowerCase().replace(/\s/g, '.')}@student.demo.com`;
    const student = await prisma.user.upsert({
      where: { email: studentEmail },
      update: {},
      create: {
        name: s.studentName,
        email: studentEmail,
        password: hash,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        schoolId,
        metadata: { classId: cls.id, rollNumber: String(Math.floor(1 + Math.random() * 40)) },
      },
    });

    await prisma.parentStudent.upsert({
      where: { parentId_studentId: { parentId: parent.id, studentId: student.id } },
      update: {},
      create: { parentId: parent.id, studentId: student.id, relationship: 'parent', isPrimary: true },
    }).catch(() => {});

    students.push({ ...student, classId: cls.id, parentId: parent.id });
  }
  console.log(`✅ Created ${students.length} students with parents`);

  // HOMEWORK (simplified)
  console.log('📝 Creating homework...');
  const grade5A = classes.find((c) => c.name === 'Grade 5' && c.section === 'A');
  const grade5B = classes.find((c) => c.name === 'Grade 5' && c.section === 'B');
  const grade6A = classes.find((c) => c.name === 'Grade 6' && c.section === 'A');

  const homeworkData = [
    {
      title: 'Chapter 3 Exercise',
      subject: 'Mathematics',
      description: 'Complete all problems from Chapter 3 - Fractions and Decimals.',
      classId: grade5A?.id,
      dueDate: new Date(Date.now() + 2 * 86400000),
      teacherId: teachers[0]?.id,
    },
    {
      title: 'Solar System Essay',
      subject: 'Science',
      description: 'Write a 500-word essay on the Solar System.',
      classId: grade5A?.id,
      dueDate: new Date(Date.now() + 4 * 86400000),
      teacherId: teachers[1]?.id,
    },
    {
      title: 'Grammar Worksheet',
      subject: 'English',
      description: 'Complete the grammar worksheet on tenses.',
      classId: grade5B?.id,
      dueDate: new Date(Date.now() - 1 * 86400000),
      teacherId: teachers[2]?.id,
    },
    {
      title: 'Map Work',
      subject: 'Social Studies',
      description: 'Label all states of India on the outline map.',
      classId: grade6A?.id,
      dueDate: new Date(Date.now() + 7 * 86400000),
      teacherId: teachers[4]?.id,
    },
  ];

  for (const h of homeworkData) {
    if (!h.classId || !h.teacherId) continue;
    await prisma.homework.create({
      data: {
        title: h.title,
        subject: h.subject,
        description: h.description,
        classId: h.classId,
        dueDate: h.dueDate,
        teacherId: h.teacherId,
        schoolId,
      } as any,
    }).catch(() => {});
  }
  console.log('✅ Created homework');

  console.log('\n🎉 Demo school fully populated!');
  console.log('📍 School Code: SCH-DEMO-01');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

