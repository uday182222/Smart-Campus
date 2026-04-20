import 'package:flutter/material.dart';
import '../../../models/student_model.dart';
import '../../../core/constants/app_constants.dart';

class AttendanceCard extends StatelessWidget {
  final Student student;
  final bool isPresent;
  final VoidCallback onToggle;

  const AttendanceCard({
    super.key,
    required this.student,
    required this.isPresent,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isPresent ? AppConstants.successColor.withValues(alpha: 0.3) : Colors.grey.withValues(alpha: 0.2),
          width: 1,
        ),
      ),
      child: InkWell(
        onTap: onToggle,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Student Avatar
              CircleAvatar(
                radius: 24,
                backgroundColor: isPresent ? AppConstants.successColor.withValues(alpha: 0.1) : Colors.grey.shade100,
                backgroundImage: student.profileUrl != null
                    ? NetworkImage(student.profileUrl!)
                    : null,
                child: student.profileUrl == null
                    ? Text(
                        student.name.substring(0, 1).toUpperCase(),
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: isPresent ? AppConstants.successColor : Colors.grey.shade700,
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 16),
              // Student Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      student.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Class: ${student.className} | Roll No: ${student.rollNo}',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    if (student.email.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        student.email,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade500,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              // Attendance Status
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: isPresent ? AppConstants.successColor.withValues(alpha: 0.1) : Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isPresent ? AppConstants.successColor : Colors.grey.shade300,
                    width: 1,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      isPresent ? Icons.check_circle : Icons.cancel,
                      size: 16,
                      color: isPresent ? AppConstants.successColor : Colors.grey.shade600,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      isPresent ? 'Present' : 'Absent',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: isPresent ? AppConstants.successColor : Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
} 