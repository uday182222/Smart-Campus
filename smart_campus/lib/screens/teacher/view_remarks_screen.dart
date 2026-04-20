import 'package:flutter/material.dart';
import '../../models/student_model.dart';
import '../../core/constants/app_constants.dart';
import '../../services/remarks_service.dart';

class ViewRemarksScreen extends StatefulWidget {
  const ViewRemarksScreen({super.key});

  @override
  State<ViewRemarksScreen> createState() => _ViewRemarksScreenState();
}

class _ViewRemarksScreenState extends State<ViewRemarksScreen> {
  String _selectedClass = '';
  String _selectedStudent = '';
  List<Map<String, dynamic>> _remarks = [];
  List<Student> _filteredStudents = [];

  final List<String> _classes = ['Class 8A', 'Class 9B', 'Class 10A', 'Class 11C', 'Class 12D'];

  @override
  void initState() {
    super.initState();
    _loadRemarks();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Refresh remarks when screen comes into focus
    _loadRemarks();
  }

  void _loadRemarks() {
    // Initialize the remarks service with mock data
    RemarksService.initializeMockData();
    
    // Get all remarks from the service
    setState(() {
      _remarks = RemarksService.getAllRemarks();
    });
  }

  void _onClassChanged(String? newClass) {
    setState(() {
      _selectedClass = newClass ?? '';
      _selectedStudent = ''; // Reset student selection when class changes
      _filteredStudents = _selectedClass.isNotEmpty
          ? mockStudents.where((student) => student.className == _selectedClass).toList()
          : [];
    });
  }

  void _onStudentChanged(String? newStudent) {
    setState(() {
      _selectedStudent = newStudent ?? '';
    });
  }

  List<Map<String, dynamic>> get _filteredRemarks {
    if (_selectedClass.isEmpty) return [];
    if (_selectedStudent.isEmpty) {
      // Show all remarks for the selected class
      return _remarks.where((remark) => remark['className'] == _selectedClass).toList();
    } else {
      // Show remarks for the selected student in the selected class
      return _remarks.where((remark) => 
        remark['className'] == _selectedClass && 
        remark['studentId'] == _selectedStudent
      ).toList();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('View Student Remarks'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadRemarks,
            tooltip: 'Refresh remarks',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppConstants.paddingLarge),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            const Text(
              'View Student Remarks',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Select a class and optionally a student to view remarks',
              style: TextStyle(
                fontSize: 16,
                color: AppConstants.textSecondary,
              ),
            ),
            const SizedBox(height: AppConstants.paddingLarge),

            // Step 1: Class Selection Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(AppConstants.paddingMedium),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 12,
                          backgroundColor: AppConstants.primaryColor,
                          child: const Text(
                            '1',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Text(
                          'Select Class',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppConstants.paddingMedium),
                    DropdownButtonFormField<String>(
                      value: _selectedClass.isEmpty ? null : _selectedClass,
                      decoration: InputDecoration(
                        border: const OutlineInputBorder(),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        hintText: 'Choose a class',
                        prefixIcon: const Icon(Icons.class_),
                      ),
                      items: _classes.map((String className) {
                        return DropdownMenuItem<String>(
                          value: className,
                          child: Text(className),
                        );
                      }).toList(),
                      onChanged: _onClassChanged,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: AppConstants.paddingLarge),

            // Step 2: Student Selection Card (conditional)
            if (_selectedClass.isNotEmpty) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(AppConstants.paddingMedium),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 12,
                            backgroundColor: AppConstants.primaryColor,
                            child: const Text(
                              '2',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Text(
                            'Select Student (Optional)',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppConstants.paddingMedium),
                      Text(
                        'Leave empty to view all students\' remarks in $_selectedClass',
                        style: TextStyle(
                          fontSize: 14,
                          color: AppConstants.textSecondary,
                        ),
                      ),
                      const SizedBox(height: AppConstants.paddingMedium),
                      if (_filteredStudents.isEmpty) ...[
                        Container(
                          padding: const EdgeInsets.all(AppConstants.paddingMedium),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.info_outline, color: Colors.grey),
                              SizedBox(width: 8),
                              Text(
                                'No students found in this class',
                                style: TextStyle(color: Colors.grey),
                              ),
                            ],
                          ),
                        ),
                      ] else ...[
                        DropdownButtonFormField<String>(
                          value: _selectedStudent.isEmpty ? null : _selectedStudent,
                          decoration: InputDecoration(
                            border: const OutlineInputBorder(),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            hintText: 'Choose a student (optional)',
                            prefixIcon: const Icon(Icons.person),
                          ),
                          items: _filteredStudents.map((Student student) {
                            return DropdownMenuItem<String>(
                              value: student.id,
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  CircleAvatar(
                                    radius: 16,
                                    backgroundColor: AppConstants.primaryColor.withValues(alpha: 0.1),
                                    child: Text(
                                      student.name.substring(0, 1),
                                      style: TextStyle(
                                        color: AppConstants.primaryColor,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Flexible(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          student.name,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                          ),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        Text(
                                          'Roll No: ${student.rollNo}',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: AppConstants.textSecondary,
                                          ),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }).toList(),
                          onChanged: _onStudentChanged,
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: AppConstants.paddingLarge),
            ],

            // Remarks Display
            if (_selectedClass.isNotEmpty) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(AppConstants.paddingMedium),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 12,
                            backgroundColor: AppConstants.primaryColor,
                            child: const Text(
                              '3',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            _selectedStudent.isEmpty 
                                ? 'All Remarks for $_selectedClass'
                                : 'Student Remarks',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppConstants.paddingMedium),
                      
                      if (_filteredRemarks.isEmpty) ...[
                        Container(
                          padding: const EdgeInsets.all(AppConstants.paddingLarge),
                          child: const Column(
                            children: [
                              Icon(
                                Icons.comment_outlined,
                                size: 64,
                                color: Colors.grey,
                              ),
                              SizedBox(height: 16),
                              Text(
                                'No remarks found',
                                style: TextStyle(
                                  fontSize: 18,
                                  color: Colors.grey,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ] else ...[
                        ..._filteredRemarks.map((remark) => _buildRemarkCard(remark)).toList(),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildRemarkCard(Map<String, dynamic> remark) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: AppConstants.primaryColor.withValues(alpha: 0.1),
                  child: Icon(
                    Icons.person,
                    color: AppConstants.primaryColor,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        remark['teacherName'],
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      Text(
                        remark['subject'],
                        style: TextStyle(
                          color: AppConstants.textSecondary,
                          fontSize: 14,
                        ),
                      ),
                      if (_selectedStudent.isEmpty) ...[
                        Text(
                          'Student: ${remark['studentName']}',
                          style: TextStyle(
                            color: AppConstants.textSecondary,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                Text(
                  _formatDate(remark['date']),
                  style: TextStyle(
                    color: AppConstants.textSecondary,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Tags
            if (remark['tags'].isNotEmpty) ...[
              Wrap(
                spacing: 4,
                runSpacing: 4,
                children: (remark['tags'] as List<String>).map((tag) => Chip(
                  label: Text(
                    tag,
                    style: const TextStyle(fontSize: 10),
                  ),
                  backgroundColor: _getTagColor(tag),
                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                )).toList(),
              ),
              const SizedBox(height: 12),
            ],

            // Remarks Content
            Text(
              remark['remarks'],
              style: const TextStyle(fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date).inDays;
    
    if (difference == 0) {
      return 'Today';
    } else if (difference == 1) {
      return 'Yesterday';
    } else if (difference < 7) {
      return '$difference days ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }

  Color _getTagColor(String tag) {
    switch (tag.toLowerCase()) {
      case 'positive':
        return Colors.green.shade100;
      case 'excellent':
        return Colors.blue.shade100;
      case 'good':
        return Colors.teal.shade100;
      case 'average':
        return Colors.orange.shade100;
      case 'poor':
        return Colors.red.shade100;
      case 'needs improvement':
        return Colors.amber.shade100;
      case 'behavior issue':
        return Colors.red.shade100;
      case 'academic concern':
        return Colors.orange.shade100;
      default:
        return Colors.grey.shade100;
    }
  }
} 