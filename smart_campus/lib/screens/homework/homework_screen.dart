import 'package:flutter/material.dart';

import '../../core/constants/app_constants.dart';
import '../../models/homework_submission_model.dart';
import '../../services/auth_service.dart';
import '../../services/homework_submission_service.dart';
import 'add_homework_screen.dart';
import 'homework_detail_screen.dart';

class HomeworkScreen extends StatefulWidget {
  const HomeworkScreen({super.key});

  @override
  State<HomeworkScreen> createState() => _HomeworkScreenState();
}

class _HomeworkScreenState extends State<HomeworkScreen> {
  final List<Map<String, dynamic>> _homeworkData = [
    {
      'id': '1',
      'subject': 'Mathematics',
      'title': 'Algebra Problems',
      'description': 'Complete exercises 1-20 from Chapter 5',
      'dueDate': '2024-01-20',
      'status': 'pending',
      'priority': 'high',
      'teacher': 'Mr. Johnson',
    },
    {
      'id': '2',
      'subject': 'English',
      'title': 'Essay Writing',
      'description': 'Write a 500-word essay on Shakespeare\'s Macbeth',
      'dueDate': '2024-01-18',
      'status': 'completed',
      'priority': 'medium',
      'teacher': 'Ms. Smith',
    },
    {
      'id': '3',
      'subject': 'Science',
      'title': 'Lab Report',
      'description': 'Complete the chemistry lab report for experiment 3',
      'dueDate': '2024-01-22',
      'status': 'pending',
      'priority': 'high',
      'teacher': 'Dr. Brown',
    },
    {
      'id': '4',
      'subject': 'History',
      'title': 'Research Paper',
      'description': 'Research and write about the Industrial Revolution',
      'dueDate': '2024-01-25',
      'status': 'pending',
      'priority': 'low',
      'teacher': 'Prof. Wilson',
    },
  ];

  String _selectedFilter = 'all';

  @override
  Widget build(BuildContext context) {
    final filteredHomework = _getFilteredHomework();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Homework'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
        actions: [
          PopupMenuButton<String>(
            onSelected: (value) {
              setState(() {
                _selectedFilter = value;
              });
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'all',
                child: Text('All'),
              ),
              const PopupMenuItem(
                value: 'pending',
                child: Text('Pending'),
              ),
              const PopupMenuItem(
                value: 'completed',
                child: Text('Completed'),
              ),
            ],
            child: const Padding(
              padding: EdgeInsets.all(16.0),
              child: Icon(Icons.filter_list),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Homework Summary
          _buildHomeworkSummary(),
          
          // Homework List
          Expanded(
            child: filteredHomework.isEmpty
                ? _buildEmptyState()
                : _buildHomeworkList(filteredHomework),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final result = await Navigator.push<Map<String, dynamic>>(
            context,
            MaterialPageRoute(
              builder: (context) => const AddHomeworkScreen(),
            ),
          );
          if (result != null && mounted) {
            setState(() => _homeworkData.insert(0, result));
          }
        },
        backgroundColor: AppConstants.primaryColor,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildHomeworkSummary() {
    int total = _homeworkData.length;
    int completed = _homeworkData.where((item) => item['status'] == 'completed').length;
    int pending = total - completed;
    double completionRate = total > 0 ? (completed / total) * 100 : 0;

    return Container(
      margin: const EdgeInsets.all(AppConstants.paddingMedium),
      padding: const EdgeInsets.all(AppConstants.paddingLarge),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppConstants.borderRadiusLarge),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Homework Overview',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                '${completionRate.toStringAsFixed(0)}%',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: completionRate >= 80 
                      ? AppConstants.successColor 
                      : AppConstants.warningColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppConstants.paddingMedium),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildSummaryItem('Total', total, AppConstants.primaryColor),
              _buildSummaryItem('Completed', completed, AppConstants.successColor),
              _buildSummaryItem('Pending', pending, AppConstants.warningColor),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(String label, int count, Color color) {
    return Column(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: color.withOpacity(0.2),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Center(
            child: Text(
              count.toString(),
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: AppConstants.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.assignment_outlined,
            size: 80,
            color: AppConstants.textSecondary,
          ),
          const SizedBox(height: AppConstants.paddingMedium),
          Text(
            'No homework found',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppConstants.textSecondary,
            ),
          ),
          const SizedBox(height: AppConstants.paddingSmall),
          Text(
            'You\'re all caught up!',
            style: TextStyle(
              color: AppConstants.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHomeworkList(List<Map<String, dynamic>> homeworkList) {
    final user = AuthService.getCurrentUserModel();
    final isTeacher = user?.role == AppConstants.roleTeacher ||
        user?.role == AppConstants.roleSchoolAdmin ||
        user?.role == AppConstants.roleSuperAdmin;

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: AppConstants.paddingMedium),
      itemCount: homeworkList.length,
      itemBuilder: (context, index) {
        final item = homeworkList[index];
        final homeworkId = item['id'] as String? ?? '';
        return Card(
          margin: const EdgeInsets.only(bottom: AppConstants.paddingSmall),
          child: ListTile(
            leading: Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: _getPriorityColor(item['priority']).withOpacity(0.2),
                borderRadius: BorderRadius.circular(25),
              ),
              child: Icon(
                Icons.assignment,
                color: _getPriorityColor(item['priority']),
                size: 24,
              ),
            ),
            title: Text(
              item['title'],
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item['subject'],
                  style: TextStyle(
                    color: AppConstants.primaryColor,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  item['description'],
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppConstants.textSecondary,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(
                      Icons.person,
                      size: 12,
                      color: AppConstants.textSecondary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      item['teacher'],
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppConstants.textSecondary,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Icon(
                      Icons.calendar_today,
                      size: 12,
                      color: AppConstants.textSecondary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Due: ${item['dueDate']}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppConstants.textSecondary,
                      ),
                    ),
                  ],
                ),
                if (isTeacher) ...[
                  const SizedBox(height: 6),
                  StreamBuilder<List<HomeworkSubmission>>(
                    stream: HomeworkSubmissionService.getSubmissionsForHomework(homeworkId),
                    builder: (context, snapshot) {
                      final count = snapshot.data?.length ?? 0;
                      return Text(
                        '$count submission${count == 1 ? '' : 's'}',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: AppConstants.primaryColor,
                        ),
                      );
                    },
                  ),
                ],
              ],
            ),
            trailing: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppConstants.paddingSmall,
                vertical: 4,
              ),
              decoration: BoxDecoration(
                color: _getStatusColor(item['status']).withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                item['status'].toUpperCase(),
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: _getStatusColor(item['status']),
                ),
              ),
            ),
            onTap: () async {
              final markedDone = await Navigator.push<bool>(
                context,
                MaterialPageRoute(
                  builder: (context) => HomeworkDetailScreen(homework: item),
                ),
              );
              if (markedDone == true && mounted) {
                setState(() {
                  final idx = _homeworkData.indexWhere((e) => e['id'] == item['id']);
                  if (idx >= 0) _homeworkData[idx]['status'] = 'completed';
                });
              }
            },
          ),
        );
      },
    );
  }

  List<Map<String, dynamic>> _getFilteredHomework() {
    if (_selectedFilter == 'all') {
      return _homeworkData;
    }
    return _homeworkData.where((item) => item['status'] == _selectedFilter).toList();
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'completed':
        return AppConstants.successColor;
      case 'pending':
        return AppConstants.warningColor;
      default:
        return AppConstants.textSecondary;
    }
  }

  Color _getPriorityColor(String priority) {
    switch (priority) {
      case 'high':
        return AppConstants.errorColor;
      case 'medium':
        return AppConstants.warningColor;
      case 'low':
        return AppConstants.successColor;
      default:
        return AppConstants.primaryColor;
    }
  }
} 