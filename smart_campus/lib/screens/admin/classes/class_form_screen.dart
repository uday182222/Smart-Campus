import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../../../models/class_model.dart';

class ClassFormScreen extends StatefulWidget {
  final ClassModel? classItem; // null for add, not null for edit

  const ClassFormScreen({super.key, this.classItem});

  @override
  State<ClassFormScreen> createState() => _ClassFormScreenState();
}

class _ClassFormScreenState extends State<ClassFormScreen> {
  final _formKey = GlobalKey<FormState>();
  
  String _selectedGrade = 'Grade 1';
  String _selectedSection = 'A';
  String _selectedSubject = 'Mathematics';
  String _selectedTeacherId = '';
  String _selectedSchedule = 'Mon, Wed, Fri - 9:00 AM';
  String _selectedRoomNumber = '101';
  int _studentCount = 30;

  final List<String> _grades = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
    'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
    'Grade 11', 'Grade 12'
  ];

  final List<String> _sections = ['A', 'B', 'C', 'D', 'E', 'F'];

  final List<String> _subjects = [
    'Mathematics', 'English', 'Science', 'History', 'Geography',
    'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Art'
  ];

  final List<String> _schedules = [
    'Mon, Wed, Fri - 9:00 AM',
    'Tue, Thu - 10:30 AM',
    'Mon, Wed - 2:00 PM',
    'Tue, Thu - 1:00 PM',
    'Fri - 3:00 PM'
  ];

  // Sample teachers - in real app, this would come from teacher database
  final List<Map<String, String>> _availableTeachers = [
    {'id': '1', 'name': 'Dr. Sarah Johnson'},
    {'id': '2', 'name': 'Mr. Rajesh Kumar'},
    {'id': '3', 'name': 'Ms. Priya Sharma'},
    {'id': '4', 'name': 'Mr. Amit Patel'},
    {'id': '5', 'name': 'Ms. Neha Singh'},
  ];

  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.classItem != null) {
      // Edit mode - populate fields
      final classItem = widget.classItem!;
      _selectedGrade = classItem.grade;
      _selectedSection = classItem.section;
      _selectedSubject = classItem.subject;
      _selectedTeacherId = classItem.teacherId;
      _selectedSchedule = classItem.schedule;
      _selectedRoomNumber = classItem.roomNumber;
      _studentCount = classItem.studentCount;
    }
  }

  void _saveClass() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_selectedTeacherId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select an assigned teacher'),
          backgroundColor: AppConstants.errorColor,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    // Simulate API call
    await Future.delayed(const Duration(seconds: 1));

    final classItem = ClassModel(
      id: widget.classItem?.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
      name: '${_selectedGrade.split(' ').last}${_selectedSection}',
      grade: _selectedGrade,
      section: _selectedSection,
      subject: _selectedSubject,
      studentCount: _studentCount,
      schedule: _selectedSchedule,
      teacherId: _selectedTeacherId,
      roomNumber: _selectedRoomNumber,
    );

    setState(() {
      _isLoading = false;
    });

    Navigator.pop(context, classItem);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.classItem == null ? 'Add Class' : 'Edit Class'),
        backgroundColor: AppConstants.warningColor,
        foregroundColor: AppConstants.textWhite,
        actions: [
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              ),
            ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Class Icon Section
              Center(
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 50,
                      backgroundColor: AppConstants.warningColor,
                      child: Icon(
                        Icons.class_,
                        size: 50,
                        color: AppConstants.textWhite,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      widget.classItem == null ? 'Create New Class' : 'Edit Class',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppConstants.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 32),
              
              // Grade
              DropdownButtonFormField<String>(
                value: _selectedGrade,
                decoration: const InputDecoration(
                  labelText: 'Grade *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.school),
                ),
                items: _grades.map((grade) {
                  return DropdownMenuItem(
                    value: grade,
                    child: Text(grade),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedGrade = value!;
                  });
                },
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please select a grade';
                  }
                  return null;
                },
              ),
              
              const SizedBox(height: 16),
              
              // Section
              DropdownButtonFormField<String>(
                value: _selectedSection,
                decoration: const InputDecoration(
                  labelText: 'Section *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.category),
                ),
                items: _sections.map((section) {
                  return DropdownMenuItem(
                    value: section,
                    child: Text(section),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedSection = value!;
                  });
                },
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please select a section';
                  }
                  return null;
                },
              ),
              
              const SizedBox(height: 16),
              
              // Subject
              DropdownButtonFormField<String>(
                value: _selectedSubject,
                decoration: const InputDecoration(
                  labelText: 'Subject *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.book),
                ),
                items: _subjects.map((subject) {
                  return DropdownMenuItem(
                    value: subject,
                    child: Text(subject),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedSubject = value!;
                  });
                },
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please select a subject';
                  }
                  return null;
                },
              ),
              
              const SizedBox(height: 16),
              
              // Student Count
              TextFormField(
                initialValue: _studentCount.toString(),
                decoration: const InputDecoration(
                  labelText: 'Student Count *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.people),
                ),
                keyboardType: TextInputType.number,
                onChanged: (value) {
                  setState(() {
                    _studentCount = int.tryParse(value) ?? 30;
                  });
                },
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter student count';
                  }
                  final count = int.tryParse(value);
                  if (count == null || count <= 0) {
                    return 'Please enter a valid number';
                  }
                  return null;
                },
              ),
              
              const SizedBox(height: 16),
              
              // Schedule
              DropdownButtonFormField<String>(
                value: _selectedSchedule,
                decoration: const InputDecoration(
                  labelText: 'Schedule *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.schedule),
                ),
                items: _schedules.map((schedule) {
                  return DropdownMenuItem(
                    value: schedule,
                    child: Text(schedule),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedSchedule = value!;
                  });
                },
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please select a schedule';
                  }
                  return null;
                },
              ),
              
              const SizedBox(height: 16),
              
              // Room Number
              TextFormField(
                initialValue: _selectedRoomNumber,
                decoration: const InputDecoration(
                  labelText: 'Room Number *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.room),
                ),
                onChanged: (value) {
                  setState(() {
                    _selectedRoomNumber = value;
                  });
                },
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter room number';
                  }
                  return null;
                },
              ),
              
              const SizedBox(height: 16),
              
              // Assigned Teacher
              DropdownButtonFormField<String>(
                value: _selectedTeacherId.isEmpty ? null : _selectedTeacherId,
                decoration: const InputDecoration(
                  labelText: 'Assigned Teacher *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.person),
                ),
                hint: const Text('Select a teacher'),
                items: _availableTeachers.map((teacher) {
                  return DropdownMenuItem(
                    value: teacher['id'],
                    child: Text(teacher['name']!),
                  );
                }).toList(),
                onChanged: (value) {
                  if (value != null) {
                    setState(() {
                      _selectedTeacherId = value;
                    });
                  }
                },
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please select an assigned teacher';
                  }
                  return null;
                },
              ),
              
              const SizedBox(height: 24),
              
              // Class Preview
              if (_selectedGrade.isNotEmpty && _selectedSection.isNotEmpty)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Class Preview:',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppConstants.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text('Class: ${_selectedGrade.split(' ').last}${_selectedSection}'),
                        Text('Grade: $_selectedGrade'),
                        Text('Section: $_selectedSection'),
                        Text('Subject: $_selectedSubject'),
                        Text('Students: $_studentCount'),
                        Text('Schedule: $_selectedSchedule'),
                        Text('Room: $_selectedRoomNumber'),
                        if (_selectedTeacherId.isNotEmpty) ...[
                          Builder(
                            builder: (context) {
                              final teacher = _availableTeachers.firstWhere(
                                (t) => t['id'] == _selectedTeacherId,
                                orElse: () => {'name': 'Unknown'},
                              );
                              return Text('Teacher: ${teacher['name']}');
                            },
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              
              const SizedBox(height: 32),
              
              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _isLoading ? null : () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _saveClass,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppConstants.warningColor,
                        foregroundColor: AppConstants.textWhite,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : Text(widget.classItem == null ? 'Create Class' : 'Update Class'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
} 