import 'package:cloud_firestore/cloud_firestore.dart';

class Mark {
  final String id;
  final String studentId;
  final String studentName;
  final String subject;
  final String examType; // 'midterm', 'final', 'quiz', 'assignment'
  final double marksObtained;
  final double totalMarks;
  final String grade; // auto-calculated: A+/A/B/C/D/F
  final String teacherId;
  final String classId;
  final DateTime createdAt;
  final String? remarks;

  Mark({
    required this.id,
    required this.studentId,
    required this.studentName,
    required this.subject,
    required this.examType,
    required this.marksObtained,
    required this.totalMarks,
    required this.grade,
    required this.teacherId,
    required this.classId,
    required this.createdAt,
    this.remarks,
  });

  factory Mark.fromMap(Map<String, dynamic> map, String id) {
    return Mark(
      id: id,
      studentId: map['studentId'] as String? ?? '',
      studentName: map['studentName'] as String? ?? '',
      subject: map['subject'] as String? ?? '',
      examType: map['examType'] as String? ?? 'midterm',
      marksObtained: (map['marksObtained'] as num?)?.toDouble() ?? 0,
      totalMarks: (map['totalMarks'] as num?)?.toDouble() ?? 100,
      grade: map['grade'] as String? ?? 'F',
      teacherId: map['teacherId'] as String? ?? '',
      classId: map['classId'] as String? ?? '',
      createdAt: _parseTimestamp(map['createdAt']),
      remarks: map['remarks'] as String?,
    );
  }

  static DateTime _parseTimestamp(dynamic value) {
    if (value == null) return DateTime.now();
    if (value is Timestamp) return value.toDate();
    if (value is DateTime) return value;
    if (value is String) return DateTime.tryParse(value) ?? DateTime.now();
    return DateTime.now();
  }

  Map<String, dynamic> toMap() {
    return {
      'studentId': studentId,
      'studentName': studentName,
      'subject': subject,
      'examType': examType,
      'marksObtained': marksObtained,
      'totalMarks': totalMarks,
      'grade': grade,
      'teacherId': teacherId,
      'classId': classId,
      'createdAt': Timestamp.fromDate(createdAt),
      'remarks': remarks,
    };
  }

  static String calculateGrade(double obtained, double total) {
    if (total <= 0) return 'F';
    final pct = (obtained / total) * 100;
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    return 'F';
  }
}
