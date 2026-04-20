import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';
import '../../models/parent_communication_model.dart';
import '../../models/student_model.dart';
import '../../services/parent_communication_service.dart';
import '../../services/auth_service.dart';

class HolidayRequestScreen extends StatefulWidget {
  const HolidayRequestScreen({super.key});

  @override
  State<HolidayRequestScreen> createState() => _HolidayRequestScreenState();
}

class _HolidayRequestScreenState extends State<HolidayRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _subjectController = TextEditingController();
  final _messageController = TextEditingController();
  final _reasonController = TextEditingController();
  final _additionalNotesController = TextEditingController();

  Student? _selectedStudent;
  List<Student> _students = [];
  DateTime? _startDate;
  DateTime? _endDate;
  CommunicationPriority _selectedPriority = CommunicationPriority.medium;
  bool _isLoading = false;
  bool _isLoadingStudents = true;

  final List<String> _commonReasons = [
    'Family Wedding',
    'Medical Treatment',
    'Family Emergency',
    'Religious Observance',
    'Educational Trip',
    'Sports Competition',
    'Cultural Event',
    'Personal Reasons',
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
    if (_selectedStudent != null && _startDate != null && _endDate != null) {
      final startStr = '${_startDate!.day}/${_startDate!.month}/${_startDate!.year}';
      final endStr = '${_endDate!.day}/${_endDate!.month}/${_endDate!.year}';
      _subjectController.text = 'Holiday Request - ${_selectedStudent!.name} ($startStr to $endStr)';
    }
  }

  Future<void> _selectStartDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    
    if (date != null) {
      setState(() {
        _startDate = date;
        // Reset end date if it's before start date
        if (_endDate != null && _endDate!.isBefore(_startDate!)) {
          _endDate = null;
        }
        _updateDefaultSubject();
      });
    }
  }

  Future<void> _selectEndDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _startDate ?? DateTime.now().add(const Duration(days: 1)),
      firstDate: _startDate ?? DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    
    if (date != null) {
      setState(() {
        _endDate = date;
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
    if (_startDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select start date')),
      );
      return;
    }
    if (_endDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select end date')),
      );
      return;
    }
    if (_endDate!.isBefore(_startDate!)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('End date must be after start date')),
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
        type: CommunicationType.holidayRequest,
        status: CommunicationStatus.pending,
        priority: _selectedPriority,
        subject: _subjectController.text.trim(),
        message: _messageController.text.trim(),
        startDate: _startDate,
        endDate: _endDate,
        reason: _reasonController.text.trim(),
        additionalNotes: _additionalNotesController.text.trim(),
        teacherId: classInfo?['teacherId'],
        teacherName: classInfo?['teacherName'],
        adminId: 'admin_1', // This would come from school info
        adminName: 'School Administrator',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await ParentCommunicationService.createCommunication(communication);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Holiday request submitted successfully'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      print('Error submitting holiday request: $e');
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
        title: const Text('Request Holiday'),
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
                        
                        // Date Range Selection
                        _buildDateRangeSelection(),
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

  Widget _buildDateRangeSelection() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Holiday Period',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.paddingSmall),
            
            // Start Date
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: _selectStartDate,
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
                            _startDate != null
                                ? '${_startDate!.day}/${_startDate!.month}/${_startDate!.year}'
                                : 'Start Date',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: AppConstants.paddingSmall),
                const Text('to'),
                const SizedBox(width: AppConstants.paddingSmall),
                Expanded(
                  child: InkWell(
                    onTap: _selectEndDate,
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
                            _endDate != null
                                ? '${_endDate!.day}/${_endDate!.month}/${_endDate!.year}'
                                : 'End Date',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            
            // Duration Info
            if (_startDate != null && _endDate != null) ...[
              const SizedBox(height: AppConstants.paddingSmall),
              Container(
                padding: const EdgeInsets.all(AppConstants.paddingSmall),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info, size: 16, color: Colors.blue),
                    const SizedBox(width: AppConstants.paddingSmall),
                    Text(
                      'Duration: ${_endDate!.difference(_startDate!).inDays + 1} days',
                      style: const TextStyle(color: Colors.blue, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
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
                hintText: 'Enter subject for holiday request',
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
              'Reason for Holiday',
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
                hintText: 'Provide details about the holiday request...',
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
                hintText: 'Any additional information or commitments...',
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
                  Text('Submitting...'),
                ],
              )
            : const Text('Submit Holiday Request'),
      ),
    );
  }
}
