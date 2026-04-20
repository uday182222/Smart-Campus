import 'package:flutter/material.dart';

import '../../core/constants/app_constants.dart';
import '../../models/mark_model.dart';
import '../../services/auth_service.dart';
import '../../services/marks_service.dart';

class StudentMarksScreen extends StatefulWidget {
  final String studentId;

  const StudentMarksScreen({super.key, required this.studentId});

  @override
  State<StudentMarksScreen> createState() => _StudentMarksScreenState();
}

class _StudentMarksScreenState extends State<StudentMarksScreen> {
  String get _title {
    final user = AuthService.getCurrentUserModel();
    if (user?.role == AppConstants.roleParent) return 'Child\'s Marks';
    return 'My Marks';
  }

  Color _gradeColor(String grade) {
    switch (grade) {
      case 'A+':
      case 'A':
        return AppConstants.successColor;
      case 'B':
        return AppConstants.infoColor;
      case 'C':
        return AppConstants.warningColor;
      case 'D':
      case 'F':
        return AppConstants.errorColor;
      default:
        return AppConstants.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_title),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: StreamBuilder<List<Mark>>(
        stream: MarksService.getMarksForStudent(widget.studentId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final marks = snapshot.data ?? [];
          if (marks.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.assignment_outlined,
                    size: 64,
                    color: AppConstants.textSecondary,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No marks yet',
                    style: TextStyle(
                      fontSize: 18,
                      color: AppConstants.textSecondary,
                    ),
                  ),
                ],
              ),
            );
          }

          final bySubject = <String, List<Mark>>{};
          for (final m in marks) {
            bySubject.putIfAbsent(m.subject, () => []).add(m);
          }

          double totalPct = 0;
          int count = 0;
          for (final m in marks) {
            if (m.totalMarks > 0) {
              totalPct += (m.marksObtained / m.totalMarks) * 100;
              count++;
            }
          }
          final overallAverage = count > 0 ? totalPct / count : 0.0;

          return ListView(
            padding: const EdgeInsets.all(AppConstants.paddingMedium),
            children: [
              Card(
                color: AppConstants.primaryColor.withOpacity(0.1),
                child: Padding(
                  padding: const EdgeInsets.all(AppConstants.paddingMedium),
                  child: Column(
                    children: [
                      const Text(
                        'Overall average',
                        style: TextStyle(
                          fontSize: 14,
                          color: AppConstants.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${overallAverage.toStringAsFixed(1)}%',
                        style: const TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: AppConstants.primaryColor,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: AppConstants.paddingLarge),
              ...bySubject.entries.map((e) => _buildSubjectSection(e.key, e.value)),
            ],
          );
        },
      ),
    );
  }

  Widget _buildSubjectSection(String subject, List<Mark> subjectMarks) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppConstants.paddingMedium),
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              subject,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ...subjectMarks.map((m) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          '${m.examType[0].toUpperCase()}${m.examType.substring(1)}: '
                          '${m.marksObtained.toStringAsFixed(0)}/${m.totalMarks.toStringAsFixed(0)}',
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: _gradeColor(m.grade).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          m.grade,
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: _gradeColor(m.grade),
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                )),
          ],
        ),
      ),
    );
  }
}
