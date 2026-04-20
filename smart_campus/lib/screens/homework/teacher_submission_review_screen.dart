import 'package:flutter/material.dart';

import '../../core/constants/app_constants.dart';
import '../../models/homework_submission_model.dart';
import '../../services/homework_submission_service.dart';
import 'submission_detail_screen.dart';

class TeacherSubmissionReviewScreen extends StatelessWidget {
  final Map<String, dynamic> homework;

  const TeacherSubmissionReviewScreen({super.key, required this.homework});

  @override
  Widget build(BuildContext context) {
    final homeworkId = homework['id'] as String? ?? '';
    final homeworkTitle = homework['title'] as String? ?? 'Homework';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Submissions'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: StreamBuilder<List<HomeworkSubmission>>(
        stream: HomeworkSubmissionService.getSubmissionsForHomework(homeworkId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(
              child: Text(
                'Error: ${snapshot.error}',
                style: const TextStyle(color: AppConstants.errorColor),
              ),
            );
          }
          final submissions = snapshot.data ?? [];
          if (submissions.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.inbox_outlined,
                    size: 80,
                    color: AppConstants.textSecondary,
                  ),
                  const SizedBox(height: AppConstants.paddingMedium),
                  Text(
                    'No submissions yet',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: AppConstants.textSecondary,
                    ),
                  ),
                ],
              ),
            );
          }
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.all(AppConstants.paddingMedium),
                child: Text(
                  '${submissions.length} submission(s)',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: AppConstants.paddingMedium),
                  itemCount: submissions.length,
                  itemBuilder: (context, index) {
                    final s = submissions[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: AppConstants.paddingSmall),
                      child: ListTile(
                        title: Text(
                          s.studentName,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 4),
                            Text(
                              _formatDate(s.submittedAt),
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppConstants.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: _statusColor(s.status).withOpacity(0.2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                s.status.toUpperCase(),
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: _statusColor(s.status),
                                ),
                              ),
                            ),
                            if (s.submissionText.isNotEmpty) ...[
                              const SizedBox(height: 6),
                              Text(
                                s.submissionText.length > 100
                                    ? '${s.submissionText.substring(0, 100)}...'
                                    : s.submissionText,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: AppConstants.textSecondary,
                                ),
                              ),
                            ],
                          ],
                        ),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => SubmissionDetailScreen(submission: s),
                            ),
                          );
                        },
                      ),
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'graded':
        return AppConstants.successColor;
      case 'late':
        return AppConstants.warningColor;
      default:
        return AppConstants.primaryColor;
    }
  }

  String _formatDate(DateTime d) {
    return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')} '
        '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
  }
}
