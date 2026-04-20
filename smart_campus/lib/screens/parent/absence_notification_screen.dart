import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';
import '../../models/parent_communication_model.dart';
import '../../models/student_model.dart';
import '../../services/parent_communication_service.dart';
import '../../services/auth_service.dart';

class AbsenceNotificationScreen extends StatefulWidget {
  const AbsenceNotificationScreen({super.key});

  @override
  State<AbsenceNotificationScreen> createState() => _AbsenceNotificationScreenState();
}

class _AbsenceNotificationScreenState extends State<AbsenceNotificationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _subjectController = TextEditingController();
  final _messageController = TextEditingController();
  final _reasonController = TextEditingController();
  final _additionalNotesController = TextEditingController();

  Student? _selectedStudent;
  List<Student> _students = [];
  DateTime? _selectedDate;
  CommunicationPriority _selectedPriority = CommunicationPriority.medium;
  bool _isLoading = false;
  bool _isLoadingStudents = true;

  final List<String> _commonReasons = [
    'Medical Appointment',
    'Illness',
    'Family Emergency',
    'Personal Reasons',
    'Weather Conditions',
    'Transport Issues',
    'Religious Observance',
    'Other',
  ];

  @override
  void initState() {
    super.initState();
    _loadStudents();
  }

  @override
  void dispose() {
    _subjectController.dispose();
    _messageController.dispose();
    _reasonController.dispose();
    _additionalNotesController.dispose();
    super.dispose();
  }

  Future<void> _loadStudents() async {
    setState(() => _isLoadingStudents = true);
    
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser != null) {
        final students = await ParentCommunicationService.getStudentsForParent(currentUser?.uid ?? '');
        setState(() {
          _students = students;
          if (students.isNotEmpty) {
            _selectedStudent = students.first;
            _updateDefaultSubject();
          }
        });
      }
    } catch (e) {
      print('Error loading students: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading students: $e')),
      );
    } finally {
      setState(() => _isLoadingStudents = false);
    }
  }

  void _updateDefaultSubject() {
    if (_selectedStudent != null && _selectedDate != null) {
      final dateStr = _selectedDate!.day == DateTime.now().day 
          ? 'Today' 
          : '${_selectedDate!.day}/${_selectedDate!.month}/${_selectedDate!.year}';
      _subjectController.text = 'Absence - ${_selectedStudent!.name} ($dateStr)';
    }
  }

  Future<void> _selectDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now().subtract(const Duration(days: 30)),
      lastDate: DateTime.now().add(const Duration(days: 30)),
    );
    
    if (date != null) {
      setState(() {
        _selectedDate = date;
        _updateDefaultSubject();
      });
    }
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedStudent == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a student')),
      );
      return;
    }
    if (_selectedDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a date')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      // Get class info for the selected student
      final classInfo = await ParentCommunicationService.getClassInfo(_selectedStudent!.className);

      final communication = ParentCommunication(
        id: '', // Will be set by the service
        parentId: currentUser?.uid ?? '',
        parentName: currentUser?.displayName ?? 'Parent',
        studentId: _selectedStudent!.id,
        studentName: _selectedStudent!.name,
        classId: _selectedStudent!.className,
        className: _selectedStudent!.className ?? '',
        schoolId: 'SCH-2025-A12', // Default school ID
        type: CommunicationType.absenceNotification,
        status: CommunicationStatus.pending,
        priority: _selectedPriority,
        subject: _subjectController.text.trim(),
        message: _messageController.text.trim(),
        startDate: _selectedDate,
        reason: _reasonController.text.trim(),
        additionalNotes: _additionalNotesController.text.trim(),
        teacherId: classInfo?['teacherId'],
        teacherName: classInfo?['teacherName'],
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await ParentCommunicationService.createCommunication(communication);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Absence notification sent successfully'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      print('Error submitting absence notification: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Report Absence'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
      ),
      body: _isLoadingStudents
          ? const Center(child: CircularProgressIndicator())
          : _students.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.school,
                        size: 64,
                        color: Colors.grey[400],
                      ),
                      const SizedBox(height: AppConstants.paddingMedium),
                      Text(
                        'No students found',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                      const SizedBox(height: AppConstants.paddingSmall),
                      Text(
                        'Please contact the school administrator',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey[500],
                        ),
                      ),
                    ],
                  ),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(AppConstants.paddingMedium),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Student Selection
                        _buildStudentSelection(),
                        const SizedBox(height: AppConstants.paddingLarge),
                        
                        // Date Selection
                        _buildDateSelection(),
                        const SizedBox(height: AppConstants.paddingLarge),
                        
                        // Priority Selection
                        _buildPrioritySelection(),
                        const SizedBox(height: AppConstants.paddingLarge),
                        
                        // Subject
                        _buildSubjectField(),
                        const SizedBox(height: AppConstants.paddingLarge),
                        
                        // Reason Selection
                        _buildReasonSelection(),
                        const SizedBox(height: AppConstants.paddingLarge),
                        
                        // Message
                        _buildMessageField(),
                        const SizedBox(height: AppConstants.paddingLarge),
                        
                        // Additional Notes
                        _buildAdditionalNotesField(),
                        const SizedBox(height: AppConstants.paddingLarge),
                        
                        // Submit Button
                        _buildSubmitButton(),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildStudentSelection() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Select Student',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.paddingSmall),
            DropdownButtonFormField<Student>(
              value: _selectedStudent,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.person),
              ),
              items: _students.map((student) {
                return DropdownMenuItem(
                  value: student,
                  child: Text('${student.name} (${student.className})'),
                );
              }).toList(),
              onChanged: (Student? student) {
                setState(() {
                  _selectedStudent = student;
                  _updateDefaultSubject();
                });
              },
              validator: (value) {
                if (value == null) return 'Please select a student';
                return null;
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDateSelection() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Absence Date',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.paddingSmall),
            InkWell(
              onTap: _selectDate,
              child: Container(
                padding: const EdgeInsets.all(AppConstants.paddingMedium),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey[400]!),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.calendar_today),
                    const SizedBox(width: AppConstants.paddingSmall),
                    Text(
                      _selectedDate != null
                          ? '${_selectedDate!.day}/${_selectedDate!.month}/${_selectedDate!.year}'
                          : 'Select date',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const Spacer(),
                    const Icon(Icons.arrow_drop_down),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPrioritySelection() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Priority',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.paddingSmall),
            DropdownButtonFormField<CommunicationPriority>(
              value: _selectedPriority,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.flag),
              ),
              items: CommunicationPriority.values.map((priority) {
                return DropdownMenuItem(
                  value: priority,
                  child: Text(priority.name.toUpperCase()),
                );
              }).toList(),
              onChanged: (CommunicationPriority? priority) {
                setState(() {
                  _selectedPriority = priority!;
                });
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubjectField() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Subject',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.paddingSmall),
            TextFormField(
              controller: _subjectController,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: 'Enter subject for absence notification',
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter a subject';
                }
                return null;
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReasonSelection() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Reason for Absence',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.paddingSmall),
            DropdownButtonFormField<String>(
              value: _reasonController.text.isEmpty ? null : _reasonController.text,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.info),
              ),
              items: _commonReasons.map((reason) {
                return DropdownMenuItem(
                  value: reason,
                  child: Text(reason),
                );
              }).toList(),
              onChanged: (String? reason) {
                _reasonController.text = reason ?? '';
              },
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please select a reason';
                }
                return null;
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageField() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Message',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.paddingSmall),
            TextFormField(
              controller: _messageController,
              maxLines: 4,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: 'Provide details about the absence...',
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter a message';
                }
                return null;
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAdditionalNotesField() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Additional Notes (Optional)',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.paddingSmall),
            TextFormField(
              controller: _additionalNotesController,
              maxLines: 3,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: 'Any additional information...',
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _submitForm,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppConstants.primaryColor,
          foregroundColor: AppConstants.textWhite,
          padding: const EdgeInsets.symmetric(vertical: AppConstants.paddingMedium),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        child: _isLoading
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
                  SizedBox(width: AppConstants.paddingSmall),
                  Text('Sending...'),
                ],
              )
            : const Text('Send Absence Notification'),
      ),
    );
  }
}
