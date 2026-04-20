import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../core/constants/app_constants.dart';
import '../../../models/teacher_model.dart';
import 'teacher_form_screen.dart';

class TeacherProfileScreen extends StatelessWidget {
  final Teacher teacher;

  const TeacherProfileScreen({super.key, required this.teacher});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('${teacher.fullName}\'s Profile'),
        backgroundColor: AppConstants.successColor,
        foregroundColor: AppConstants.textWhite,
        actions: [
          PopupMenuButton<String>(
            onSelected: (value) {
              switch (value) {
                case 'edit':
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => TeacherFormScreen(teacher: teacher),
                    ),
                  );
                  break;
                case 'delete':
                  _showDeleteDialog(context);
                  break;
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'edit',
                child: Row(
                  children: [
                    Icon(Icons.edit),
                    SizedBox(width: 8),
                    Text('Edit'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'delete',
                child: Row(
                  children: [
                    Icon(Icons.delete, color: AppConstants.errorColor),
                    SizedBox(width: 8),
                    Text('Delete', style: TextStyle(color: AppConstants.errorColor)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Profile Header
            Center(
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 60,
                    backgroundColor: AppConstants.successColor,
                    child: Text(
                      teacher.fullName[0].toUpperCase(),
                      style: const TextStyle(
                        fontSize: 48,
                        fontWeight: FontWeight.bold,
                        color: AppConstants.textWhite,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    teacher.fullName,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppConstants.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    teacher.qualification,
                    style: const TextStyle(
                      fontSize: 16,
                      color: AppConstants.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: teacher.isActive ? AppConstants.successColor : AppConstants.errorColor,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      teacher.isActive ? 'Active' : 'Inactive',
                      style: const TextStyle(
                        color: AppConstants.textWhite,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 32),
            
            // Personal Information
            _buildSection(
              'Personal Information',
              Icons.person,
              [
                _buildInfoTile('Full Name', teacher.fullName),
                _buildInfoTile('Gender', teacher.gender),
                _buildInfoTile('Date of Birth', 
                  '${teacher.dateOfBirth.day}/${teacher.dateOfBirth.month}/${teacher.dateOfBirth.year}'),
                _buildInfoTile('Age', '${teacher.age} years'),
                _buildInfoTile('Email', teacher.email),
                _buildInfoTile('Phone Number', teacher.phoneNumber),
                _buildInfoTile('Address', teacher.address),
              ],
            ),
            
            const SizedBox(height: 24),
            
            // Professional Information
            _buildSection(
              'Professional Information',
              Icons.work,
              [
                _buildInfoTile('Qualification', teacher.qualification),
                _buildInfoTile('Joining Date', 
                  '${teacher.joiningDate.day}/${teacher.joiningDate.month}/${teacher.joiningDate.year}'),
                _buildInfoTile('Experience', '${teacher.experience} years'),
                _buildInfoTile('Status', teacher.isActive ? 'Active' : 'Inactive'),
              ],
            ),
            
            const SizedBox(height: 24),
            
            // Teaching Information
            _buildSection(
              'Teaching Information',
              Icons.school,
              [
                _buildInfoTile('Subjects', teacher.subjectsDisplay),
                _buildInfoTile('Assigned Classes', teacher.assignedClassesDisplay),
              ],
            ),
            
            const SizedBox(height: 24),
            
            // System Information
            _buildSection(
              'System Information',
              Icons.info,
              [
                _buildInfoTile('Teacher ID', teacher.id),
                _buildInfoTile('Created', 
                  '${teacher.createdAt.day}/${teacher.createdAt.month}/${teacher.createdAt.year}'),
                _buildInfoTile('Last Updated', 
                  '${teacher.updatedAt.day}/${teacher.updatedAt.month}/${teacher.updatedAt.year}'),
              ],
            ),
            
            const SizedBox(height: 32),
            
            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => TeacherFormScreen(teacher: teacher),
                        ),
                      );
                    },
                    icon: const Icon(Icons.edit),
                    label: const Text('Edit Profile'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _showDeleteDialog(context),
                    icon: const Icon(Icons.delete),
                    label: const Text('Delete'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppConstants.errorColor,
                      foregroundColor: AppConstants.textWhite,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, IconData icon, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: AppConstants.successColor),
            const SizedBox(width: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppConstants.textPrimary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: children,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInfoTile(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              '$label:',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: AppConstants.textSecondary,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: AppConstants.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showDeleteDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Teacher'),
        content: Text(
          'Are you sure you want to delete ${teacher.fullName}? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                await FirebaseFirestore.instance.collection(AppConfig.colTeachers).doc(teacher.id).delete();
                if (!context.mounted) return;
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Teacher deleted'),
                    backgroundColor: AppConstants.successColor,
                  ),
                );
              } catch (e) {
                if (!context.mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Delete failed: $e'),
                    backgroundColor: AppConstants.errorColor,
                  ),
                );
              }
            },
            child: const Text(
              'Delete',
              style: TextStyle(color: AppConstants.errorColor),
            ),
          ),
        ],
      ),
    );
  }
} 