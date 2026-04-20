import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';
import '../../models/student_model.dart';
import '../../models/class_model.dart';
import '../../services/data_service.dart';
import 'widgets/attendance_card.dart';

class TeacherAttendanceScreen extends StatefulWidget {
  const TeacherAttendanceScreen({super.key});

  @override
  State<TeacherAttendanceScreen> createState() => _TeacherAttendanceScreenState();
}

class _TeacherAttendanceScreenState extends State<TeacherAttendanceScreen> {
  List<ClassModel> _assignedClasses = [];
  List<Student> _students = [];
  Map<String, String> _attendanceMap = {}; // 'present', 'absent', 'late'
  DateTime _selectedDate = DateTime.now();
  ClassModel? _selectedClass;
  bool _isLoading = false;
  bool _isSubmitting = false;
  bool _classSelected = false;

  @override
  void initState() {
    super.initState();
    _loadAssignedClasses();
  }

  void _loadAssignedClasses() {
    // Load classes assigned to the current teacher
    setState(() {
      _assignedClasses = DataService.getMockClasses();
    });
  }

  void _loadStudentsForClass(String classId) {
    // Load students for the selected class
    setState(() {
      // Find the selected class to get its name
      final selectedClass = _assignedClasses.firstWhere(
        (cls) => cls.id == classId,
        orElse: () => ClassModel(
          id: '',
          name: '',
          grade: '',
          section: '',
          subject: '',
          studentCount: 0,
          schedule: '',
          teacherId: '',
          roomNumber: '',
        ),
      );
      
      _students = DataService.getStudentsByClass(selectedClass.name);
      
      // If no students found, add some fallback students for testing
      if (_students.isEmpty) {
        _students = [
          Student(
            id: 'temp_1',
            name: 'Test Student 1',
            className: selectedClass.name,
            rollNo: '001',
            email: 'test1@school.com',
            phone: '+1 (555) 111-1111',
            address: 'Test Address 1',
            parentName: 'Test Parent 1',
            parentPhone: '+1 (555) 111-1112',
            dateOfBirth: DateTime(2010, 1, 1),
            gender: 'Male',
            bloodGroup: 'O+',
            admissionDate: '2020-09-01',
          ),
          Student(
            id: 'temp_2',
            name: 'Test Student 2',
            className: selectedClass.name,
            rollNo: '002',
            email: 'test2@school.com',
            phone: '+1 (555) 222-2222',
            address: 'Test Address 2',
            parentName: 'Test Parent 2',
            parentPhone: '+1 (555) 222-2223',
            dateOfBirth: DateTime(2010, 2, 2),
            gender: 'Female',
            bloodGroup: 'A+',
            admissionDate: '2020-09-01',
          ),
        ];
      }
      
      _initializeAttendance();
    });
  }

  void _initializeAttendance() {
    _attendanceMap.clear();
    for (var student in _students) {
      _attendanceMap[student.id] = 'present'; // Default to present
    }
  }

  void _onClassSelected(ClassModel? selectedClass) {
    if (selectedClass != null) {
      setState(() {
        _selectedClass = selectedClass;
        _classSelected = true;
      });
      _loadStudentsForClass(selectedClass.id);
    }
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(), // Restrict to today and past dates only
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
        if (_classSelected) {
          _initializeAttendance(); // Reset attendance for new date
        }
      });
    }
  }

  void _toggleAttendance(String studentId) {
    setState(() {
      final currentStatus = _attendanceMap[studentId] ?? 'present';
      switch (currentStatus) {
        case 'present':
          _attendanceMap[studentId] = 'absent';
          break;
        case 'absent':
          _attendanceMap[studentId] = 'late';
          break;
        case 'late':
          _attendanceMap[studentId] = 'present';
          break;
        default:
          _attendanceMap[studentId] = 'present';
      }
    });
  }

  Future<void> _submitAttendance() async {
    if (!_isSubmitting && _selectedClass != null) {
      // Check if selected date is in the future
      final today = DateTime.now();
      final selectedDateOnly = DateTime(_selectedDate.year, _selectedDate.month, _selectedDate.day);
      final todayOnly = DateTime(today.year, today.month, today.day);
      
      if (selectedDateOnly.isAfter(todayOnly)) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Cannot mark attendance for future dates'),
            backgroundColor: AppConstants.errorColor,
            duration: const Duration(seconds: 3),
          ),
        );
        return;
      }

      setState(() {
        _isSubmitting = true;
      });

      // Simulate API call
      await Future.delayed(const Duration(seconds: 2));

      setState(() {
        _isSubmitting = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Attendance submitted successfully for ${_selectedClass!.name}'),
            backgroundColor: AppConstants.successColor,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  int get _presentCount => _attendanceMap.values.where((status) => status == 'present').length;
  int get _absentCount => _attendanceMap.values.where((status) => status == 'absent').length;
  int get _lateCount => _attendanceMap.values.where((status) => status == 'late').length;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mark Attendance'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_today),
            onPressed: _selectDate,
            tooltip: 'Select Date',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _classSelected 
              ? _buildAttendanceSection()
              : _buildClassSelection(),
      floatingActionButton: _classSelected && _students.isNotEmpty
          ? FloatingActionButton.extended(
              onPressed: _isSubmitting ? null : _submitAttendance,
              backgroundColor: AppConstants.primaryColor,
              foregroundColor: AppConstants.textWhite,
              icon: _isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          Colors.white,
                        ),
                      ),
                    )
                  : const Icon(Icons.save),
              label: Text(_isSubmitting ? 'Saving...' : 'Submit Attendance'),
            )
          : null,
    );
  }

  Widget _buildClassSelection() {
    return Padding(
      padding: const EdgeInsets.all(AppConstants.paddingLarge),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppConstants.primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.class_,
                  color: AppConstants.primaryColor,
                  size: 24,
                ),
              ),
              const SizedBox(width: AppConstants.paddingMedium),
              const Text(
                'Select Class',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppConstants.paddingMedium),
          Text(
            'Choose the class for which you want to mark attendance',
            style: TextStyle(
              fontSize: 14,
              color: AppConstants.textSecondary,
            ),
          ),
          const SizedBox(height: AppConstants.paddingLarge),
          
          // Class Dropdown
          DropdownButtonFormField<ClassModel>(
            value: _selectedClass,
            decoration: const InputDecoration(
              labelText: 'Select Class',
              prefixIcon: Icon(Icons.school),
              border: OutlineInputBorder(),
            ),
            items: _assignedClasses.map((classModel) {
              return DropdownMenuItem<ClassModel>(
                value: classModel,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      classModel.name,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    Text(
                      '${classModel.studentCount} students • ${classModel.schedule}',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppConstants.textSecondary,
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
            onChanged: _onClassSelected,
            validator: (value) {
              if (value == null) {
                return 'Please select a class';
              }
              return null;
            },
          ),
        ],
      ),
    );
  }

  Widget _buildAttendanceSection() {
    return Column(
      children: [
        // Header with Date and Summary
        Container(
          padding: const EdgeInsets.all(AppConstants.paddingLarge),
          decoration: BoxDecoration(
            color: AppConstants.primaryColor.withOpacity(0.05),
            borderRadius: const BorderRadius.only(
              bottomLeft: Radius.circular(20),
              bottomRight: Radius.circular(20),
            ),
          ),
          child: Column(
            children: [
              // Class and Date Info
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _selectedClass?.name ?? '',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Text(
                              'Date: ${_selectedDate.toString().split(' ')[0]}',
                              style: TextStyle(
                                fontSize: 14,
                                color: AppConstants.textSecondary,
                              ),
                            ),
                            if (_selectedDate.isAfter(DateTime.now())) ...[
                              const SizedBox(width: 8),
                              Icon(
                                Icons.warning,
                                size: 16,
                                color: AppConstants.errorColor,
                              ),
                              Text(
                                'Future date',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppConstants.errorColor,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                  TextButton.icon(
                    onPressed: _selectDate,
                    icon: const Icon(Icons.edit_calendar),
                    label: const Text('Change Date'),
                  ),
                ],
              ),
              const SizedBox(height: AppConstants.paddingMedium),
              
              // Attendance Summary
              Row(
                children: [
                  Expanded(
                    child: _buildSummaryCard(
                      'Present',
                      _presentCount,
                      AppConstants.successColor,
                      Icons.check_circle,
                    ),
                  ),
                  const SizedBox(width: AppConstants.paddingSmall),
                  Expanded(
                    child: _buildSummaryCard(
                      'Absent',
                      _absentCount,
                      AppConstants.errorColor,
                      Icons.cancel,
                    ),
                  ),
                  const SizedBox(width: AppConstants.paddingSmall),
                  Expanded(
                    child: _buildSummaryCard(
                      'Late',
                      _lateCount,
                      AppConstants.warningColor,
                      Icons.schedule,
                    ),
                  ),
                  const SizedBox(width: AppConstants.paddingSmall),
                  Expanded(
                    child: _buildSummaryCard(
                      'Total',
                      _students.length,
                      AppConstants.primaryColor,
                      Icons.people,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        
        // Students List
        Flexible(
          child: _students.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.people_outline,
                        size: 64,
                        color: Colors.grey,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No students in this class',
                        style: TextStyle(
                          fontSize: 18,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(AppConstants.paddingMedium),
                  itemCount: _students.length,
                  itemBuilder: (context, index) {
                    final student = _students[index];
                    final attendanceStatus = _attendanceMap[student.id] ?? 'present';
                    
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: AttendanceCard(
                        student: student,
                        isPresent: attendanceStatus == 'present',
                        onToggle: () => _toggleAttendance(student.id),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildSummaryCard(String title, int count, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(AppConstants.paddingSmall),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppConstants.borderRadiusSmall),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 4),
          Text(
            count.toString(),
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              color: color.withOpacity(0.8),
            ),
          ),
        ],
      ),
    );
  }
} 