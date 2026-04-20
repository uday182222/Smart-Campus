import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/constants/app_constants.dart';
import '../../models/homework_submission_model.dart';
import '../../services/homework_submission_service.dart';

class SubmissionDetailScreen extends StatefulWidget {
  final HomeworkSubmission submission;

  const SubmissionDetailScreen({super.key, required this.submission});

  @override
  State<SubmissionDetailScreen> createState() => _SubmissionDetailScreenState();
}

class _SubmissionDetailScreenState extends State<SubmissionDetailScreen> {
  final _gradeController = TextEditingController();
  final _commentController = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _gradeController.text = widget.submission.grade ?? '';
    _commentController.text = widget.submission.teacherComment ?? '';
  }

  @override
  void dispose() {
    _gradeController.dispose();
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _saveGrade() async {
    final grade = _gradeController.text.trim();
    final comment = _commentController.text.trim();

    setState(() => _saving = true);
    try {
      final ok = await HomeworkSubmissionService.gradeSubmission(
        widget.submission.id,
        grade,
        comment,
      );
      if (!context.mounted) return;
      if (!ok) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to save grade. Please try again.'),
            backgroundColor: AppConstants.errorColor,
          ),
        );
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Grade saved.'),
          backgroundColor: AppConstants.successColor,
        ),
      );
      Navigator.pop(context, true);
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to save: $e'),
          backgroundColor: AppConstants.errorColor,
        ),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _openUrl(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.submission;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Submission'),
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
            Card(
              child: Padding(
                padding: const EdgeInsets.all(AppConstants.paddingMedium),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      s.studentName,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Submitted: ${_formatDate(s.submittedAt)}',
                      style: const TextStyle(
                        color: AppConstants.textSecondary,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _statusColor(s.status).withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        s.status.toUpperCase(),
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: _statusColor(s.status),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            const Text('Submission', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(
              s.submissionText.isEmpty ? '(No text)' : s.submissionText,
              style: const TextStyle(height: 1.4),
            ),
            if (s.fileUrls.isNotEmpty) ...[
              const SizedBox(height: AppConstants.paddingMedium),
              const Text('Files', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              ...s.fileUrls.map((url) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: InkWell(
                      onTap: () => _openUrl(url),
                      child: Row(
                        children: [
                          const Icon(Icons.attach_file, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              url,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: AppConstants.primaryColor,
                                decoration: TextDecoration.underline,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  )),
            ],
            const SizedBox(height: AppConstants.paddingLarge),
            const Divider(),
            const SizedBox(height: AppConstants.paddingMedium),
            const Text('Grading', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: AppConstants.paddingSmall),
            TextField(
              controller: _gradeController,
              decoration: const InputDecoration(
                labelText: 'Grade',
                hintText: 'e.g. A or 85/100',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            TextField(
              controller: _commentController,
              maxLines: 4,
              decoration: const InputDecoration(
                labelText: 'Comment',
                hintText: 'Teacher feedback',
                border: OutlineInputBorder(),
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _saving ? null : _saveGrade,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppConstants.primaryColor,
                  foregroundColor: AppConstants.textWhite,
                  padding: const EdgeInsets.symmetric(vertical: AppConstants.paddingMedium),
                ),
                child: _saving
                    ? const SizedBox(
                        height: 24,
                        width: 24,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Save Grade'),
              ),
            ),
          ],
        ),
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
