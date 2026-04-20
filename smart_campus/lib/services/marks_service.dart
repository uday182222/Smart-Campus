import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';

import '../core/constants/app_constants.dart';
import '../models/mark_model.dart';

class MarksService {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  static Future<bool> saveMark(Mark mark) async {
    try {
      await _firestore.collection(AppConfig.colMarks).doc(mark.id).set(mark.toMap());
      await _firestore.collection(AppConfig.colNotifications).add({
        'title': 'Marks Updated',
        'body': 'Your ${mark.subject} ${mark.examType} marks have been entered',
        'type': 'marks_entry',
        'studentId': mark.studentId,
        'subject': mark.subject,
        'createdAt': FieldValue.serverTimestamp(),
        'read': false,
      });
      return true;
    } catch (e) {
      debugPrint('Error saving mark: $e');
      return false;
    }
  }

  static Future<bool> updateMark(
    String markId,
    double obtained,
    String remarks,
  ) async {
    try {
      final doc = await _firestore.collection(AppConfig.colMarks).doc(markId).get();
      if (doc.exists && doc.data() != null) {
        final data = doc.data()!;
        final total = (data['totalMarks'] as num?)?.toDouble() ?? 100;
        final grade = Mark.calculateGrade(obtained, total);
        await _firestore.collection(AppConfig.colMarks).doc(markId).update({
          'marksObtained': obtained,
          'remarks': remarks,
          'grade': grade,
        });
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Error updating mark: $e');
      return false;
    }
  }

  static Future<bool> deleteMark(String markId) async {
    try {
      await _firestore.collection(AppConfig.colMarks).doc(markId).delete();
      return true;
    } catch (e) {
      debugPrint('Error deleting mark: $e');
      return false;
    }
  }

  static Stream<List<Mark>> getMarksForClass(String classId, String examType) {
    return _firestore
        .collection(AppConfig.colMarks)
        .where('classId', isEqualTo: classId)
        .where('examType', isEqualTo: examType)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => Mark.fromMap(doc.data(), doc.id))
            .toList());
  }

  static Stream<List<Mark>> getMarksForStudent(String studentId) {
    return _firestore
        .collection(AppConfig.colMarks)
        .where('studentId', isEqualTo: studentId)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => Mark.fromMap(doc.data(), doc.id))
            .toList());
  }

  static Stream<List<Mark>> getMarksForSubject(
    String classId,
    String subject,
  ) {
    return _firestore
        .collection(AppConfig.colMarks)
        .where('classId', isEqualTo: classId)
        .where('subject', isEqualTo: subject)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => Mark.fromMap(doc.data(), doc.id))
            .toList());
  }

  static Future<Map<String, dynamic>> getClassAnalytics(
    String classId,
    String examType,
  ) async {
    final snapshot = await _firestore
        .collection(AppConfig.colMarks)
        .where('classId', isEqualTo: classId)
        .where('examType', isEqualTo: examType)
        .get();

    final marks = snapshot.docs
        .map((doc) => Mark.fromMap(doc.data(), doc.id))
        .toList();

    if (marks.isEmpty) {
      return {
        'average': 0.0,
        'highest': 0.0,
        'lowest': 0.0,
        'passCount': 0,
        'failCount': 0,
        'gradeDistribution': <String, int>{},
      };
    }

    final percentages = marks
        .map((m) => m.totalMarks > 0 ? (m.marksObtained / m.totalMarks) * 100 : 0.0)
        .toList();
    final average = percentages.reduce((a, b) => a + b) / percentages.length;
    final highest = percentages.reduce((a, b) => a > b ? a : b);
    final lowest = percentages.reduce((a, b) => a < b ? a : b);

    int passCount = 0;
    int failCount = 0;
    final gradeDistribution = <String, int>{};
    for (final m in marks) {
      if (m.grade == 'F') {
        failCount++;
      } else {
        passCount++;
      }
      gradeDistribution[m.grade] = (gradeDistribution[m.grade] ?? 0) + 1;
    }

    return {
      'average': average,
      'highest': highest,
      'lowest': lowest,
      'passCount': passCount,
      'failCount': failCount,
      'gradeDistribution': gradeDistribution,
    };
  }

  static String newMarkId() {
    return _firestore.collection(AppConfig.colMarks).doc().id;
  }
}
