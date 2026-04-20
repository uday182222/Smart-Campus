class ClassModel {
  final String id;
  final String name;
  final String grade;
  final String section;
  final String subject;
  final int studentCount;
  final String schedule;
  final String teacherId;
  final String roomNumber;

  ClassModel({
    required this.id,
    required this.name,
    required this.grade,
    required this.section,
    required this.subject,
    required this.studentCount,
    required this.schedule,
    required this.teacherId,
    required this.roomNumber,
  });

  // Create a copy of class with updated fields
  ClassModel copyWith({
    String? id,
    String? name,
    String? grade,
    String? section,
    String? subject,
    int? studentCount,
    String? schedule,
    String? teacherId,
    String? roomNumber,
  }) {
    return ClassModel(
      id: id ?? this.id,
      name: name ?? this.name,
      grade: grade ?? this.grade,
      section: section ?? this.section,
      subject: subject ?? this.subject,
      studentCount: studentCount ?? this.studentCount,
      schedule: schedule ?? this.schedule,
      teacherId: teacherId ?? this.teacherId,
      roomNumber: roomNumber ?? this.roomNumber,
    );
  }

  // Convert to Map for JSON serialization
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'grade': grade,
      'section': section,
      'subject': subject,
      'studentCount': studentCount,
      'schedule': schedule,
      'teacherId': teacherId,
      'roomNumber': roomNumber,
    };
  }

  // Create from Map for JSON deserialization
  factory ClassModel.fromMap(Map<String, dynamic> map) {
    return ClassModel(
      id: map['id'],
      name: map['name'],
      grade: map['grade'],
      section: map['section'],
      subject: map['subject'],
      studentCount: map['studentCount'],
      schedule: map['schedule'],
      teacherId: map['teacherId'],
      roomNumber: map['roomNumber'],
    );
  }

  // Get display name for dropdown
  String get displayName => '$grade - Section $section ($subject)';
}

// Mock data for classes
List<ClassModel> mockClasses = [
  ClassModel(
    id: '1',
    name: 'Class 10A',
    grade: 'Grade 10',
    section: 'A',
    subject: 'Mathematics',
    studentCount: 32,
    schedule: 'Mon, Wed, Fri - 9:00 AM',
    teacherId: 'teacher_001',
    roomNumber: '101',
  ),
  ClassModel(
    id: '2',
    name: 'Class 9B',
    grade: 'Grade 9',
    section: 'B',
    subject: 'Mathematics',
    studentCount: 28,
    schedule: 'Tue, Thu - 10:30 AM',
    teacherId: 'teacher_001',
    roomNumber: '102',
  ),
  ClassModel(
    id: '3',
    name: 'Class 8C',
    grade: 'Grade 8',
    section: 'C',
    subject: 'Mathematics',
    studentCount: 35,
    schedule: 'Mon, Wed - 2:00 PM',
    teacherId: 'teacher_001',
    roomNumber: '103',
  ),
  ClassModel(
    id: '4',
    name: 'Class 7A',
    grade: 'Grade 7',
    section: 'A',
    subject: 'Mathematics',
    studentCount: 30,
    schedule: 'Tue, Thu - 1:00 PM',
    teacherId: 'teacher_001',
    roomNumber: '104',
  ),
]; 