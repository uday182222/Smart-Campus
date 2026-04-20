import 'dart:io';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/foundation.dart';

import '../core/constants/app_constants.dart';
import '../models/homework_submission_model.dart';

class HomeworkSubmissionService {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  static final FirebaseStorage _storage = FirebaseStorage.instance;
  static const String _storagePath = 'homework_submissions';

  /// Upload files to Storage, then save submission to Firestore.
  /// Optionally pass [homeworkTitle] to send a notification to the teacher.
  /// Returns the saved submission with file URLs, or null on failure.
  static Future<HomeworkSubmission?> submitHomework(
    HomeworkSubmission submission,
    List<File> files, {
    String? homeworkTitle,
  }) async {
    try {
      final List<String> fileUrls = [];
      final String homeworkId = submission.homeworkId;
      final String studentId = submission.studentId;

      for (final file in files) {
        final filename = file.path.split(Platform.pathSeparator).last;
        final ref = _storage
            .ref()
            .child('$_storagePath/$homeworkId/$studentId/$filename');
        await ref.putFile(file);
        final url = await ref.getDownloadURL();
        fileUrls.add(url);
      }

      final submissionWithUrls = HomeworkSubmission(
        id: submission.id,
        homeworkId: submission.homeworkId,
        studentId: submission.studentId,
        studentName: submission.studentName,
        submissionText: submission.submissionText,
        fileUrls: [...submission.fileUrls, ...fileUrls],
        submittedAt: submission.submittedAt,
        status: submission.status,
        grade: submission.grade,
        teacherComment: submission.teacherComment,
      );

      await _firestore
          .collection(AppConfig.colHomeworkSubmissions)
          .doc(submission.id)
          .set(submissionWithUrls.toMap());

      if (homeworkTitle != null && homeworkTitle.isNotEmpty) {
        await notifyTeacherOnSubmission(
          homeworkId: submission.homeworkId,
          homeworkTitle: homeworkTitle,
          studentId: submission.studentId,
          studentName: submission.studentName,
        );
      }

      return submissionWithUrls;
    } catch (e) {
      debugPrint('Error submitting homework: $e');
      return null;
    }
  }

  /// Stream of all submissions for a homework.
  static Stream<List<HomeworkSubmission>> getSubmissionsForHomework(
    String homeworkId,
  ) {
    return _firestore
        .collection(AppConfig.colHomeworkSubmissions)
        .where('homeworkId', isEqualTo: homeworkId)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => HomeworkSubmission.fromMap(
                doc.data(),
                doc.id,
              ))
          .toList();
    });
  }

  /// Check if student already submitted for this homework.
  static Future<HomeworkSubmission?> getStudentSubmission(
    String homeworkId,
    String studentId,
  ) async {
    final snapshot = await _firestore
        .collection(AppConfig.colHomeworkSubmissions)
        .where('homeworkId', isEqualTo: homeworkId)
        .where('studentId', isEqualTo: studentId)
        .limit(1)
        .get();

    if (snapshot.docs.isEmpty) return null;
    final doc = snapshot.docs.first;
    return HomeworkSubmission.fromMap(doc.data(), doc.id);
  }

  /// Update submission with grade and comment; set status to 'graded'.
  /// Returns true on success, false on failure.
  static Future<bool> gradeSubmission(
    String submissionId,
    String grade,
    String comment,
  ) async {
    try {
      await _firestore.collection(AppConfig.colHomeworkSubmissions).doc(submissionId).update({
        'grade': grade,
        'teacherComment': comment,
        'status': 'graded',
      });
      return true;
    } catch (e) {
      debugPrint('Error grading submission: $e');
      return false;
    }
  }

  /// Create a new submission doc ID (caller can use this before submitHomework).
  static String newSubmissionId() {
    return _firestore.collection(AppConfig.colHomeworkSubmissions).doc().id;
  }

  /// Notify teacher of new submission. Call after saving submission.
  static Future<void> notifyTeacherOnSubmission({
    required String homeworkId,
    required String homeworkTitle,
    required String studentId,
    required String studentName,
  }) async {
    await _firestore.collection(AppConfig.colNotifications).add({
      'title': 'New Homework Submission',
      'body': '$studentName submitted $homeworkTitle',
      'type': 'homework_submission',
      'homeworkId': homeworkId,
      'studentId': studentId,
      'createdAt': FieldValue.serverTimestamp(),
      'read': false,
    });
  }
}
