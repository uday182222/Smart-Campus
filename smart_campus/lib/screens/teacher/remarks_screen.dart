import 'package:flutter/material.dart';
import '../../models/student_model.dart';
import '../../core/constants/app_constants.dart';
import '../../services/remarks_service.dart';
import '../../services/auth_service.dart';

class RemarksScreen extends StatefulWidget {
  const RemarksScreen({super.key});

  @override
  State<RemarksScreen> createState() => _RemarksScreenState();
}

class _RemarksScreenState extends State<RemarksScreen> {
  final TextEditingController _remarksController = TextEditingController();
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  
  String _selectedClass = '';
  String _selectedStudent = '';
  List<String> _selectedTags = [];
  bool _isSubmitting = false;
  List<Student> _filteredStudents = [];

  final List<String> _classes = ['Class 8A', 'Class 9B', 'Class 10A', 'Class 11C', 'Class 12D'];
  final List<String> _tags = ['Positive', 'Needs Improvement', 'Excellent', 'Good', 'Average', 'Poor', 'Behavior Issue', 'Academic Concern'];

  @override
  void dispose() {
    _remarksController.dispose();
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Refresh student list when screen comes into focus
    if (_selectedClass.isNotEmpty) {
      _onClassChanged(_selectedClass);
    }
  }

  void _toggleTag(String tag) {
    setState(() {
      if (_selectedTags.contains(tag)) {
        _selectedTags.remove(tag);
      } else {
        _selectedTags.add(tag);
      }
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

  Future<void> _submitRemarks() async {
    if (_formKey.currentState!.validate() && _selectedStudent.isNotEmpty) {
      setState(() {
        _isSubmitting = true;
      });

      try {
        // Get the selected student details
        final selectedStudent = _filteredStudents.firstWhere(
          (student) => student.id == _selectedStudent,
        );

        // Get current teacher name
        final currentTeacher = AuthService.currentUserModel?.name ?? 'Current Teacher';

        // Add the remark using the service
        await RemarksService.addRemark(
          studentId: selectedStudent.id,
          studentName: selectedStudent.name,
          className: _selectedClass,
          teacherName: currentTeacher,
          subject: 'General', // You can make this configurable later
          remarks: _remarksController.text.trim(),
          tags: _selectedTags,
        );

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Remarks added successfully for ${selectedStudent.name}!'),
              backgroundColor: AppConstants.successColor,
              duration: const Duration(seconds: 3),
            ),
          );
          
          // Clear form
          _remarksController.clear();
          setState(() {
            _selectedStudent = '';
            _selectedTags.clear();
          });
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error adding remarks: $e'),
              backgroundColor: AppConstants.errorColor,
              duration: const Duration(seconds: 3),
            ),
          );
        }
      } finally {
        if (mounted) {
          setState(() {
            _isSubmitting = false;
          });
        }
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Please select a student and enter remarks'),
          backgroundColor: AppConstants.errorColor,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Student Remarks'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppConstants.paddingLarge),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Text(
                'Add Student Remarks',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppConstants.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Select a class, then choose a student to add remarks',
                style: TextStyle(
                  fontSize: 16,
                  color: AppConstants.textSecondary,
                ),
              ),
              const SizedBox(height: AppConstants.paddingLarge),

              // Step 1: Class Selection
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(AppConstants.paddingMedium),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: AppConstants.primaryColor,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: const Center(
                              child: Text(
                                '1',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            'Select Class',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppConstants.textPrimary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppConstants.paddingMedium),
                      DropdownButtonFormField<String>(
                        value: _selectedClass.isEmpty ? null : _selectedClass,
                        decoration: InputDecoration(
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(AppConstants.borderRadiusSmall),
                          ),
                          hintText: 'Choose a class',
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        items: _classes.map((String class_) {
                          return DropdownMenuItem<String>(
                            value: class_,
                            child: Text(class_),
                          );
                        }).toList(),
                        onChanged: _onClassChanged,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please select a class';
                          }
                          return null;
                        },
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: AppConstants.paddingLarge),

              // Step 2: Student Selection (only show if class is selected)
              if (_selectedClass.isNotEmpty) ...[
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(AppConstants.paddingMedium),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                color: AppConstants.primaryColor,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Center(
                                child: Text(
                                  '2',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              'Select Student',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: AppConstants.textPrimary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: AppConstants.paddingMedium),
                        
                        if (_filteredStudents.isEmpty) ...[
                          Container(
                            padding: const EdgeInsets.all(AppConstants.paddingMedium),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(AppConstants.borderRadiusSmall),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.info_outline,
                                  color: AppConstants.textSecondary,
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    'No students found in $_selectedClass',
                                    style: TextStyle(
                                      color: AppConstants.textSecondary,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ] else ...[
                          DropdownButtonFormField<String>(
                            value: _selectedStudent.isEmpty ? null : _selectedStudent,
                            decoration: InputDecoration(
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(AppConstants.borderRadiusSmall),
                              ),
                              hintText: 'Choose a student',
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
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
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Please select a student';
                              }
                              return null;
                            },
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: AppConstants.paddingLarge),
              ],

              // Step 3: Remarks Form (only show if student is selected)
              if (_selectedStudent.isNotEmpty) ...[
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(AppConstants.paddingMedium),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                color: AppConstants.primaryColor,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Center(
                                child: Text(
                                  '3',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              'Add Remarks',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: AppConstants.textPrimary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: AppConstants.paddingMedium),

                        // Tags Selection
                        Text(
                          'Select Tags (Optional)',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppConstants.textPrimary,
                          ),
                        ),
                        const SizedBox(height: AppConstants.paddingSmall),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: _tags.map((tag) => FilterChip(
                            label: Text(tag),
                            selected: _selectedTags.contains(tag),
                            onSelected: (selected) => _toggleTag(tag),
                            selectedColor: AppConstants.primaryColor.withValues(alpha: 0.2),
                            checkmarkColor: AppConstants.primaryColor,
                          )).toList(),
                        ),
                        const SizedBox(height: AppConstants.paddingMedium),

                        // Remarks Input
                        Text(
                          'Enter Remarks *',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppConstants.textPrimary,
                          ),
                        ),
                        const SizedBox(height: AppConstants.paddingSmall),
                        TextFormField(
                          controller: _remarksController,
                          decoration: InputDecoration(
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(AppConstants.borderRadiusSmall),
                            ),
                            hintText: 'Enter your remarks about the student...',
                            alignLabelWithHint: true,
                          ),
                          maxLines: 6,
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please enter remarks';
                            }
                            if (value.length < 10) {
                              return 'Remarks should be at least 10 characters';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: AppConstants.paddingMedium),

                        // Submit Button
                        SizedBox(
                          width: double.infinity,
                          height: 50,
                          child: ElevatedButton(
                            onPressed: _isSubmitting ? null : _submitRemarks,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppConstants.primaryColor,
                              foregroundColor: AppConstants.textWhite,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(AppConstants.borderRadiusSmall),
                              ),
                            ),
                            child: _isSubmitting
                                ? const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      SizedBox(
                                        width: 20,
                                        height: 20,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                        ),
                                      ),
                                      SizedBox(width: 12),
                                      Text('Adding Remarks...'),
                                    ],
                                  )
                                : const Text(
                                    'Add Remarks',
                                    style: TextStyle(fontSize: 16),
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
} 