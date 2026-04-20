import 'package:flutter/material.dart';

import '../../core/constants/app_constants.dart';
import '../../services/auth_service.dart';
import 'student_submission_screen.dart';
import 'teacher_submission_review_screen.dart';

class HomeworkDetailScreen extends StatelessWidget {
  final Map<String, dynamic> homework;

  const HomeworkDetailScreen({super.key, required this.homework});

  @override
  Widget build(BuildContext context) {
    final status = homework['status'] as String? ?? 'pending';
    final isCompleted = status == 'completed';
    final user = AuthService.getCurrentUserModel();
    final isStudent = user?.role == AppConstants.roleStudent;
    final isTeacher = user?.role == AppConstants.roleTeacher ||
        user?.role == AppConstants.roleSchoolAdmin ||
        user?.role == AppConstants.roleSuperAdmin;

    return Scaffold(
      appBar: AppBar(
        title: Text(homework['title'] as String? ?? 'Homework'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildDetailRow('Subject', homework['subject'] as String? ?? '—'),
            const SizedBox(height: AppConstants.paddingMedium),
            _buildDetailRow('Due Date', homework['dueDate'] as String? ?? '—'),
            const SizedBox(height: AppConstants.paddingMedium),
            _buildDetailRow('Status', (homework['status'] as String? ?? 'pending').toUpperCase()),
            const SizedBox(height: AppConstants.paddingMedium),
            const Text(
              'Description',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: AppConstants.paddingSmall),
            Text(
              homework['description'] as String? ?? 'No description',
              style: const TextStyle(
                color: AppConstants.textSecondary,
                height: 1.4,
              ),
            ),
            const SizedBox(height: AppConstants.paddingLarge),
            if (isStudent)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => StudentSubmissionScreen(homework: homework),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppConstants.primaryColor,
                    foregroundColor: AppConstants.textWhite,
                    padding: const EdgeInsets.symmetric(vertical: AppConstants.paddingMedium),
                  ),
                  child: const Text('Submit Homework'),
                ),
              ),
            if (isTeacher)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => TeacherSubmissionReviewScreen(homework: homework),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppConstants.secondaryColor,
                    foregroundColor: AppConstants.textWhite,
                    padding: const EdgeInsets.symmetric(vertical: AppConstants.paddingMedium),
                  ),
                  child: const Text('View Submissions'),
                ),
              ),
            if (!isCompleted && !isStudent && !isTeacher)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context, true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppConstants.successColor,
                    foregroundColor: AppConstants.textWhite,
                    padding: const EdgeInsets.symmetric(vertical: AppConstants.paddingMedium),
                  ),
                  child: const Text('Mark as Done'),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 100,
          child: Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              color: AppConstants.textSecondary,
            ),
          ),
        ),
        Expanded(child: Text(value)),
      ],
    );
  }
}
