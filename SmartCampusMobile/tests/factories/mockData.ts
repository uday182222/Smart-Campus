/**
 * Mock Data Factories
 * Generate test data for various entities
 */

export const mockUser = {
  teacher: {
    id: 'teacher-1',
    email: 'teacher@school.com',
    name: 'Ms. Sarah Wilson',
    role: 'TEACHER',
    schoolId: 'school-1',
    phone: '+1234567890',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-01'),
  },
  parent: {
    id: 'parent-1',
    email: 'parent@school.com',
    name: 'John Smith',
    role: 'PARENT',
    schoolId: 'school-1',
    phone: '+1234567891',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-01'),
  },
  admin: {
    id: 'admin-1',
    email: 'admin@school.com',
    name: 'Principal Johnson',
    role: 'ADMIN',
    schoolId: 'school-1',
    phone: '+1234567892',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-01'),
  },
  student: {
    id: 'student-1',
    email: 'student@school.com',
    name: 'Alice Johnson',
    role: 'STUDENT',
    schoolId: 'school-1',
    phone: '+1234567893',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-01'),
  },
};

export const mockAuthResponse = {
  success: true,
  message: 'Login successful',
  data: {
    user: mockUser.teacher,
    token: 'mock-jwt-token-12345',
  },
};

export const mockClass = {
  id: 'class-1',
  name: 'Grade 5A',
  section: 'A',
  grade: '5',
  schoolId: 'school-1',
  academicYear: '2024-2025',
  capacity: 30,
  currentStrength: 28,
  teacherId: 'teacher-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-12-01'),
};

export const mockStudents = [
  {
    id: 'student-1',
    name: 'Alice Johnson',
    rollNumber: '001',
    classId: 'class-1',
    parentId: 'parent-1',
    status: 'ACTIVE',
  },
  {
    id: 'student-2',
    name: 'Bob Williams',
    rollNumber: '002',
    classId: 'class-1',
    parentId: 'parent-2',
    status: 'ACTIVE',
  },
  {
    id: 'student-3',
    name: 'Charlie Brown',
    rollNumber: '003',
    classId: 'class-1',
    parentId: 'parent-3',
    status: 'ACTIVE',
  },
];

export const mockAttendance = {
  id: 'attendance-1',
  classId: 'class-1',
  studentId: 'student-1',
  date: new Date('2024-12-02'),
  status: 'present',
  markedBy: 'teacher-1',
  markedAt: new Date('2024-12-02T09:00:00'),
  notes: '',
};

export const mockAttendanceResponse = {
  success: true,
  message: 'Attendance marked successfully',
  data: {
    recorded: 28,
    present: 26,
    absent: 2,
    late: 0,
    halfDay: 0,
  },
};

export const mockHomework = {
  id: 'homework-1',
  classId: 'class-1',
  teacherId: 'teacher-1',
  subject: 'Mathematics',
  title: 'Algebra Practice',
  description: 'Complete exercises 1-10 from Chapter 5',
  dueDate: new Date('2024-12-10'),
  attachments: [],
  status: 'active',
  createdAt: new Date('2024-12-01'),
  updatedAt: new Date('2024-12-01'),
};

export const mockHomeworkResponse = {
  success: true,
  message: 'Homework created successfully',
  data: {
    homeworkId: 'homework-1',
    homework: mockHomework,
  },
};

export const mockMarks = {
  id: 'marks-1',
  studentId: 'student-1',
  examId: 'exam-1',
  subject: 'Mathematics',
  marksObtained: 85,
  totalMarks: 100,
  percentage: 85,
  grade: 'A',
  remarks: 'Excellent performance',
  enteredBy: 'teacher-1',
  enteredAt: new Date('2024-12-01'),
};

export const mockMarksResponse = {
  success: true,
  message: 'Marks entered successfully',
  data: {
    marksId: 'marks-1',
    marks: mockMarks,
  },
};

export const mockParentDashboard = {
  success: true,
  data: {
    student: mockStudents[0],
    attendance: {
      thisMonth: {
        present: 20,
        absent: 2,
        late: 1,
        total: 23,
        percentage: 87,
      },
      today: {
        status: 'present',
        markedAt: new Date('2024-12-02T09:00:00'),
      },
    },
    homework: {
      pending: 3,
      completed: 12,
      overdue: 0,
      recentAssignments: [mockHomework],
    },
    marks: {
      recentExams: [
        {
          subject: 'Mathematics',
          marks: 85,
          total: 100,
          percentage: 85,
          grade: 'A',
        },
        {
          subject: 'Science',
          marks: 78,
          total: 100,
          percentage: 78,
          grade: 'B',
        },
      ],
      averagePercentage: 81.5,
    },
    notifications: [
      {
        id: 'notif-1',
        title: 'Homework Assigned',
        body: 'New homework assigned for Mathematics',
        category: 'homework',
        createdAt: new Date('2024-12-01'),
        read: false,
      },
    ],
  },
};

export const mockAdminAnalytics = {
  success: true,
  data: {
    analytics: {
      users: {
        byRole: {
          TEACHER: 25,
          STUDENT: 500,
          PARENT: 450,
          OFFICE_STAFF: 5,
        },
        byStatus: {
          ACTIVE: 975,
          INACTIVE: 5,
        },
        total: 980,
        active: 975,
        inactive: 5,
      },
      attendance: {
        todayPercentage: 92.5,
        todayRecords: 500,
        todayPresent: 463,
      },
      homework: {
        pending: 15,
      },
      events: {
        upcoming: 3,
        nextEvents: [
          {
            id: 'event-1',
            title: 'Sports Day',
            startDate: '2024-12-10',
            type: 'sports',
          },
        ],
      },
      activities: {
        recent: [
          {
            id: 'activity-1',
            action: 'USER_CREATED',
            resource: 'User',
            user: {
              id: 'admin-1',
              name: 'Principal Johnson',
              role: 'ADMIN',
            },
            timestamp: new Date('2024-12-01T10:00:00'),
          },
        ],
      },
    },
  },
};

export const mockTransportRoute = {
  id: 'route-1',
  name: 'Route A - North',
  routeNumber: 'A1',
  status: 'active',
  stops: [
    {
      id: 'stop-1',
      name: 'Main Gate',
      address: '123 Main St',
      latitude: 40.7128,
      longitude: -74.006,
      sequence: 1,
      estimatedTime: '07:30',
    },
    {
      id: 'stop-2',
      name: 'Central Park',
      address: '456 Park Ave',
      latitude: 40.7829,
      longitude: -73.9654,
      sequence: 2,
      estimatedTime: '07:45',
    },
  ],
  helper: {
    id: 'helper-1',
    name: 'Mike Helper',
    phone: '+1234567894',
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-12-01'),
};

export const mockNotification = {
  id: 'notif-1',
  userId: 'parent-1',
  category: 'attendance' as const,
  title: 'Attendance Alert',
  body: 'Your child was marked present today',
  data: {
    studentId: 'student-1',
    date: '2024-12-02',
  },
  channels: ['push', 'in_app'],
  priority: 'normal' as const,
  status: 'sent' as const,
  createdAt: new Date('2024-12-02T09:00:00'),
};

export const mockEvent = {
  id: 'event-1',
  title: 'Annual Sports Day',
  description: 'School-wide sports event',
  eventType: 'sports' as const,
  startDate: new Date('2024-12-10T09:00:00'),
  endDate: new Date('2024-12-10T17:00:00'),
  startTime: '09:00',
  endTime: '17:00',
  location: 'School Ground',
  targetAudience: ['all'],
  isAllDay: false,
  attendanceRequired: false,
  currentAttendees: 0,
  status: 'scheduled' as const,
  createdAt: new Date('2024-12-01'),
  updatedAt: new Date('2024-12-01'),
  createdBy: 'admin-1',
};

export const mockGalleryItem = {
  id: 'gallery-1',
  schoolId: 'school-1',
  title: 'Sports Day 2024',
  description: 'Annual sports day photos',
  fileUrl: 'https://example.com/image.jpg',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  type: 'image' as const,
  visibility: 'public' as const,
  views: 50,
  uploadedBy: 'admin-1',
  createdAt: new Date('2024-12-01'),
  updatedAt: new Date('2024-12-01'),
};

// API Response Builders
export const createSuccessResponse = <T>(data: T, message = 'Success') => ({
  success: true,
  message,
  data,
});

export const createErrorResponse = (message = 'An error occurred', statusCode = 500) => ({
  success: false,
  message,
  error: message,
  statusCode,
});

// Factory Functions
export const createMockStudent = (overrides?: Partial<typeof mockStudents[0]>) => ({
  ...mockStudents[0],
  ...overrides,
});

export const createMockAttendance = (overrides?: Partial<typeof mockAttendance>) => ({
  ...mockAttendance,
  ...overrides,
});

export const createMockHomework = (overrides?: Partial<typeof mockHomework>) => ({
  ...mockHomework,
  ...overrides,
});

export const createMockMarks = (overrides?: Partial<typeof mockMarks>) => ({
  ...mockMarks,
  ...overrides,
});

