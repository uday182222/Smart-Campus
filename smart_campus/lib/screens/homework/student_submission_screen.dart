import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/constants/app_constants.dart';
import '../../models/homework_submission_model.dart';
import '../../services/auth_service.dart';
import '../../services/homework_submission_service.dart';

class StudentSubmissionScreen extends StatefulWidget {
  final Map<String, dynamic> homework;

  const StudentSubmissionScreen({super.key, required this.homework});

  @override
  State<StudentSubmissionScreen> createState() => _StudentSubmissionScreenState();
}

class _StudentSubmissionScreenState extends State<StudentSubmissionScreen> {
  HomeworkSubmission? _existingSubmission;
  bool _loading = true;
  bool _submitting = false;

  final _answerController = TextEditingController();
  final List<File> _pickedFiles = [];

  @override
  void initState() {
    super.initState();
    _checkExistingSubmission();
  }

  Future<void> _checkExistingSubmission() async {
    final user = AuthService.getCurrentUserModel();
    if (user == null) {
      if (mounted) setState(() => _loading = false);
      return;
    }
    final homeworkId = widget.homework['id'] as String? ?? '';
    final submission = await HomeworkSubmissionService.getStudentSubmission(
      homeworkId,
      user.id,
    );
    if (mounted) {
      setState(() {
        _existingSubmission = submission;
        _loading = false;
      });
    }
  }

  Future<void> _pickFiles() async {
    final result = await FilePicker.platform.pickFiles(allowMultiple: true);
    if (result == null || result.files.isEmpty) return;
    if (!mounted) return;
    setState(() {
      for (final f in result.files) {
        if (f.path != null) _pickedFiles.add(File(f.path!));
      }
    });
  }

  void _removeFile(int index) {
    setState(() => _pickedFiles.removeAt(index));
  }

  Future<void> _submit() async {
    final text = _answerController.text.trim();
    if (text.isEmpty && _pickedFiles.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please provide your answer or attach at least one file.'),
          backgroundColor: AppConstants.warningColor,
        ),
      );
      return;
    }

    final user = AuthService.getCurrentUserModel();
    if (user == null) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('You must be logged in to submit.'),
            backgroundColor: AppConstants.errorColor,
          ),
        );
      }
      return;
    }

    setState(() => _submitting = true);

    try {
      final homeworkId = widget.homework['id'] as String? ?? '';
      final homeworkTitle = widget.homework['title'] as String? ?? 'Homework';
      final submissionId = HomeworkSubmissionService.newSubmissionId();
      final isLate = _isLate();
      final submission = HomeworkSubmission(
        id: submissionId,
        homeworkId: homeworkId,
        studentId: user.id,
        studentName: user.name,
        submissionText: text,
        fileUrls: [],
        submittedAt: DateTime.now(),
        status: isLate ? 'late' : 'submitted',
      );

      final result = await HomeworkSubmissionService.submitHomework(
        submission,
        _pickedFiles,
        homeworkTitle: homeworkTitle,
      );

      if (!context.mounted) return;
      if (result == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to submit homework. Please try again.'),
            backgroundColor: AppConstants.errorColor,
          ),
        );
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Homework submitted successfully!'),
          backgroundColor: AppConstants.successColor,
        ),
      );
      await _checkExistingSubmission();
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to submit: $e'),
          backgroundColor: AppConstants.errorColor,
        ),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  bool _isLate() {
    final dueStr = widget.homework['dueDate'] as String?;
    if (dueStr == null || dueStr.isEmpty) return false;
    final due = DateTime.tryParse(dueStr);
    return due != null && DateTime.now().isAfter(due);
  }

  @override
  void dispose() {
    _answerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final homework = widget.homework;
    final title = homework['title'] as String? ?? 'Homework';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Submit Homework'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _existingSubmission != null
              ? _buildSubmittedView()
              : _buildSubmissionForm(),
    );
  }

  Widget _buildSubmittedView() {
    final s = _existingSubmission!;
    return SingleChildScrollView(
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
                  Row(
                    children: [
                      const Icon(Icons.check_circle, color: AppConstants.successColor, size: 28),
                      const SizedBox(width: AppConstants.paddingSmall),
                      Text(
                        'Submitted',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppConstants.successColor,
                        ),
                      ),
                      const SizedBox(width: AppConstants.paddingSmall),
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
                  const SizedBox(height: AppConstants.paddingSmall),
                  Text(
                    'Submitted at: ${_formatDate(s.submittedAt)}',
                    style: const TextStyle(
                      color: AppConstants.textSecondary,
                      fontSize: 14,
                    ),
                  ),
                  if (s.grade != null && s.grade!.isNotEmpty) ...[
                    const SizedBox(height: AppConstants.paddingMedium),
                    const Text('Grade', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(s.grade!),
                  ],
                  if (s.teacherComment != null && s.teacherComment!.isNotEmpty) ...[
                    const SizedBox(height: AppConstants.paddingMedium),
                    const Text('Teacher comment', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(s.teacherComment!),
                  ],
                ],
              ),
            ),
          ),
          if (s.submissionText.isNotEmpty) ...[
            const SizedBox(height: AppConstants.paddingMedium),
            const Text('Your answer', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(s.submissionText),
          ],
          if (s.fileUrls.isNotEmpty) ...[
            const SizedBox(height: AppConstants.paddingMedium),
            const Text('Submitted files', style: TextStyle(fontWeight: FontWeight.bold)),
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
        ],
      ),
    );
  }

  Widget _buildSubmissionForm() {
    final homework = widget.homework;
    return SingleChildScrollView(
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
                    homework['title'] as String? ?? '—',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  _readOnlyRow('Subject', homework['subject'] as String? ?? '—'),
                  _readOnlyRow('Due Date', homework['dueDate'] as String? ?? '—'),
                  const SizedBox(height: 8),
                  const Text('Description', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(
                    homework['description'] as String? ?? 'No description',
                    style: const TextStyle(color: AppConstants.textSecondary),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppConstants.paddingLarge),
          const Text('Your Answer', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: AppConstants.paddingSmall),
          TextField(
            controller: _answerController,
            maxLines: 10,
            decoration: const InputDecoration(
              hintText: 'Type your answer here...',
              border: OutlineInputBorder(),
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: AppConstants.paddingMedium),
          const Text('Attachments', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: AppConstants.paddingSmall),
          OutlinedButton.icon(
            onPressed: _submitting ? null : _pickFiles,
            icon: const Icon(Icons.attach_file),
            label: const Text('Pick files'),
          ),
          if (_pickedFiles.isNotEmpty) ...[
            const SizedBox(height: 8),
            ...List.generate(_pickedFiles.length, (i) {
              final name = _pickedFiles[i].path.split(Platform.pathSeparator).last;
              return ListTile(
                dense: true,
                leading: const Icon(Icons.insert_drive_file),
                title: Text(name, overflow: TextOverflow.ellipsis),
                trailing: IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => _removeFile(i),
                ),
              );
            }),
          ],
          const SizedBox(height: AppConstants.paddingLarge),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _submitting ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppConstants.primaryColor,
                foregroundColor: AppConstants.textWhite,
                padding: const EdgeInsets.symmetric(vertical: AppConstants.paddingMedium),
              ),
              child: _submitting
                  ? const SizedBox(
                      height: 24,
                      width: 24,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Submit'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _readOnlyRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
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

  Future<void> _openUrl(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {}
  }
}
