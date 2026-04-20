import '../models/student_model.dart';
import '../models/teacher_model.dart';
import '../models/class_model.dart';

class DataService {
  static final DataService _instance = DataService._internal();
  factory DataService() => _instance;
  DataService._internal();

  // Mock data for students
  static List<Student> getMockStudents() {
    return [
      Student(
        id: '1',
        name: 'John Smith',
        className: 'Class 10A',
        rollNo: '2024001',
        email: 'john.smith@student.com',
        phone: '+1234567890',
        address: '123 Main St, City',
        parentName: 'Michael Smith',
        parentPhone: '+1234567891',
        dateOfBirth: DateTime(2008, 3, 15),
        gender: 'Male',
        bloodGroup: 'O+',
        admissionDate: '2020-09-01',
      ),
      Student(
        id: '2',
        name: 'Emma Johnson',
        className: 'Class 10A',
        rollNo: '2024002',
        email: 'emma.johnson@student.com',
        phone: '+1234567892',
        address: '456 Oak Ave, City',
        parentName: 'Sarah Johnson',
        parentPhone: '+1234567893',
        dateOfBirth: DateTime(2008, 7, 22),
        gender: 'Female',
        bloodGroup: 'A+',
        admissionDate: '2020-09-01',
      ),
      Student(
        id: '3',
        name: 'David Wilson',
        className: 'Class 10B',
        rollNo: '2024003',
        email: 'david.wilson@student.com',
        phone: '+1234567894',
        address: '789 Pine Rd, City',
        parentName: 'Robert Wilson',
        parentPhone: '+1234567895',
        dateOfBirth: DateTime(2008, 11, 8),
        gender: 'Male',
        bloodGroup: 'B+',
        admissionDate: '2020-09-01',
      ),
    ];
  }

  // Mock data for teachers
  static List<Teacher> getMockTeachers() {
    return [
      Teacher(
        id: '1',
        fullName: 'Dr. Sarah Williams',
        email: 'sarah.williams@school.com',
        phoneNumber: '+1234567896',
        gender: 'Female',
        subjects: ['Mathematics'],
        assignedClasses: ['Class 10A'],
        address: '321 Teacher St, City',
        qualification: 'Ph.D. in Mathematics',
        dateOfBirth: DateTime(1985, 4, 12),
        joiningDate: DateTime(2020, 8, 1),
        isActive: true,
        createdAt: DateTime(2020, 8, 1),
        updatedAt: DateTime.now(),
      ),
      Teacher(
        id: '2',
        fullName: 'Mr. James Brown',
        email: 'james.brown@school.com',
        phoneNumber: '+1234567898',
        gender: 'Male',
        subjects: ['Science'],
        assignedClasses: ['Class 10B'],
        address: '654 Faculty Ave, City',
        qualification: 'M.Sc. in Physics',
        dateOfBirth: DateTime(1988, 9, 25),
        joiningDate: DateTime(2021, 6, 15),
        isActive: true,
        createdAt: DateTime(2021, 6, 15),
        updatedAt: DateTime.now(),
      ),
      Teacher(
        id: '3',
        fullName: 'Ms. Lisa Davis',
        email: 'lisa.davis@school.com',
        phoneNumber: '+1234567900',
        gender: 'Female',
        subjects: ['English'],
        assignedClasses: ['Class 10A', 'Class 10B'],
        address: '987 Educator Rd, City',
        qualification: 'M.A. in English Literature',
        dateOfBirth: DateTime(1986, 12, 3),
        joiningDate: DateTime(2019, 9, 1),
        isActive: true,
        createdAt: DateTime(2019, 9, 1),
        updatedAt: DateTime.now(),
      ),
    ];
  }

  // Mock data for classes
  static List<ClassModel> getMockClasses() {
    return [
      ClassModel(
        id: '1',
        name: 'Class 10A',
        grade: 'Grade 10',
        section: 'A',
        subject: 'Mathematics',
        studentCount: 28,
        schedule: 'Mon, Wed, Fri - 9:00 AM',
        teacherId: '1',
        roomNumber: '101',
      ),
      ClassModel(
        id: '2',
        name: 'Class 10B',
        grade: 'Grade 10',
        section: 'B',
        subject: 'Science',
        studentCount: 25,
        schedule: 'Tue, Thu - 10:30 AM',
        teacherId: '2',
        roomNumber: '102',
      ),
    ];
  }

  // Mock attendance data
  static Map<String, Map<String, String>> getMockAttendanceData() {
    return {
      '2024-01-15': {
        '1': 'present',
        '2': 'present',
        '3': 'absent',
      },
      '2024-01-16': {
        '1': 'present',
        '2': 'late',
        '3': 'present',
      },
      '2024-01-17': {
        '1': 'present',
        '2': 'present',
        '3': 'present',
      },
    };
  }

  // Mock homework data
  static List<Map<String, dynamic>> getMockHomeworkData() {
    return [
      {
        'id': '1',
        'title': 'Algebra Practice',
        'description': 'Complete exercises 1-10 from Chapter 5',
        'subject': 'Mathematics',
        'classId': '1',
        'className': 'Class 10A',
        'dueDate': DateTime(2024, 1, 20),
        'assignedDate': DateTime(2024, 1, 15),
        'teacherId': '1',
        'teacherName': 'Dr. Sarah Williams',
        'status': 'active',
      },
      {
        'id': '2',
        'title': 'Physics Lab Report',
        'description': 'Write a report on the pendulum experiment',
        'subject': 'Science',
        'classId': '2',
        'className': 'Class 10B',
        'dueDate': DateTime(2024, 1, 22),
        'assignedDate': DateTime(2024, 1, 16),
        'teacherId': '2',
        'teacherName': 'Mr. James Brown',
        'status': 'active',
      },
    ];
  }

  // Mock announcements data
  static List<Map<String, dynamic>> getMockAnnouncementsData() {
    return [
      {
        'id': '1',
        'title': 'Parent-Teacher Meeting',
        'content': 'Annual parent-teacher meeting scheduled for next Friday at 3 PM.',
        'author': 'Principal',
        'date': DateTime(2024, 1, 15),
        'priority': 'high',
        'targetAudience': 'all',
      },
      {
        'id': '2',
        'title': 'Sports Day',
        'content': 'Annual sports day will be held on January 25th. All students must participate.',
        'author': 'Sports Department',
        'date': DateTime(2024, 1, 14),
        'priority': 'medium',
        'targetAudience': 'students',
      },
      {
        'id': '3',
        'title': 'Library Week',
        'content': 'Library week celebration from January 20-26. Special activities planned.',
        'author': 'Library Staff',
        'date': DateTime(2024, 1, 13),
        'priority': 'low',
        'targetAudience': 'all',
      },
    ];
  }

  // Mock events data
  static List<Map<String, dynamic>> getMockEventsData() {
    return [
      {
        'id': '1',
        'title': 'Annual Sports Day',
        'description': 'Annual sports day with various competitions and activities',
        'date': DateTime(2024, 1, 25),
        'time': '09:00',
        'location': 'School Ground',
        'organizer': 'Sports Department',
        'type': 'sports',
        'status': 'upcoming',
      },
      {
        'id': '2',
        'title': 'Science Fair',
        'description': 'Students showcase their science projects and experiments',
        'date': DateTime(2024, 2, 10),
        'time': '10:00',
        'location': 'School Auditorium',
        'organizer': 'Science Department',
        'type': 'academic',
        'status': 'upcoming',
      },
      {
        'id': '3',
        'title': 'Cultural Festival',
        'description': 'Annual cultural festival with music, dance, and drama performances',
        'date': DateTime(2024, 3, 15),
        'time': '06:00',
        'location': 'School Auditorium',
        'organizer': 'Cultural Committee',
        'type': 'cultural',
        'status': 'upcoming',
      },
    ];
  }

  // Get students by class
  static List<Student> getStudentsByClass(String className) {
    return getMockStudents().where((student) => student.className == className).toList();
  }

  // Get teacher by ID
  static Teacher? getTeacherById(String teacherId) {
    try {
      return getMockTeachers().firstWhere((teacher) => teacher.id == teacherId);
    } catch (e) {
      return null;
    }
  }

  // Get class by ID
  static ClassModel? getClassById(String classId) {
    try {
      return getMockClasses().firstWhere((classItem) => classItem.id == classId);
    } catch (e) {
      return null;
    }
  }

  // Get attendance for a specific date and class
  static Map<String, String> getAttendanceForDate(String date, String classId) {
    final allAttendance = getMockAttendanceData();
    return allAttendance[date] ?? {};
  }

  // Get homework for a specific class
  static List<Map<String, dynamic>> getHomeworkForClass(String classId) {
    return getMockHomeworkData().where((homework) => homework['classId'] == classId).toList();
  }

  // Get announcements for a specific audience
  static List<Map<String, dynamic>> getAnnouncementsForAudience(String audience) {
    return getMockAnnouncementsData()
        .where((announcement) => 
            announcement['targetAudience'] == audience || 
            announcement['targetAudience'] == 'all')
        .toList();
  }

  // Get upcoming events
  static List<Map<String, dynamic>> getUpcomingEvents() {
    final now = DateTime.now();
    return getMockEventsData()
        .where((event) => event['date'].isAfter(now))
        .toList();
  }
} 