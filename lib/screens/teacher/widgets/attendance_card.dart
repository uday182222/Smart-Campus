import 'package:flutter/material.dart';
import '../../../models/student_model.dart';

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
          color: isPresent ? Colors.green.withOpacity(0.3) : Colors.grey.withOpacity(0.2),
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
                backgroundColor: isPresent ? Colors.green.shade100 : Colors.grey.shade100,
                backgroundImage: student.profileUrl != null
                    ? NetworkImage(student.profileUrl!)
                    : null,
                child: student.profileUrl == null
                    ? Text(
                        student.name.substring(0, 1).toUpperCase(),
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: isPresent ? Colors.green.shade700 : Colors.grey.shade700,
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
              // Attendance Checkbox
              Container(
                decoration: BoxDecoration(
                  color: isPresent ? Colors.green.shade50 : Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isPresent ? Colors.green : Colors.grey.shade300,
                    width: 2,
                  ),
                ),
                child: Checkbox(
                  value: isPresent,
                  onChanged: (_) => onToggle(),
                  activeColor: Colors.green,
                  checkColor: Colors.white,
                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  visualDensity: VisualDensity.compact,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
} 