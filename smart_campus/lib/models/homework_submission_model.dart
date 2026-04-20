import 'package:cloud_firestore/cloud_firestore.dart';

class HomeworkSubmission {
  final String id;
  final String homeworkId;
  final String studentId;
  final String studentName;
  final String submissionText;
  final List<String> fileUrls;
  final DateTime submittedAt;
  final String status; // 'submitted', 'graded', 'late'
  final String? grade;
  final String? teacherComment;

  HomeworkSubmission({
    required this.id,
    required this.homeworkId,
    required this.studentId,
    required this.studentName,
    required this.submissionText,
    required this.fileUrls,
    required this.submittedAt,
    required this.status,
    this.grade,
    this.teacherComment,
  });

  factory HomeworkSubmission.fromMap(Map<String, dynamic> map, String id) {
    return HomeworkSubmission(
      id: id,
      homeworkId: map['homeworkId'] as String? ?? '',
      studentId: map['studentId'] as String? ?? '',
      studentName: map['studentName'] as String? ?? '',
      submissionText: map['submissionText'] as String? ?? '',
      fileUrls: map['fileUrls'] != null
          ? List<String>.from(map['fileUrls'] as List)
          : [],
      submittedAt: _parseTimestamp(map['submittedAt']),
      status: map['status'] as String? ?? 'submitted',
      grade: map['grade'] as String?,
      teacherComment: map['teacherComment'] as String?,
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
      'homeworkId': homeworkId,
      'studentId': studentId,
      'studentName': studentName,
      'submissionText': submissionText,
      'fileUrls': fileUrls,
      'submittedAt': Timestamp.fromDate(submittedAt),
      'status': status,
      'grade': grade,
      'teacherComment': teacherComment,
    };
  }
}
