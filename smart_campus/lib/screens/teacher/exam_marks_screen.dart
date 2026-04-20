import 'package:flutter/material.dart';
import '../../models/student_model.dart';

class ExamMarksScreen extends StatefulWidget {
  const ExamMarksScreen({super.key});

  @override
  State<ExamMarksScreen> createState() => _ExamMarksScreenState();
}

class _ExamMarksScreenState extends State<ExamMarksScreen> {
  String _selectedClass = '';
  String _selectedSubject = '';
  String _selectedExamType = '';
  int _totalMarks = 100;
  bool _isSubmitting = false;

  final List<String> _classes = ['8A', '9B', '10A', '11C', '12D'];
  final List<String> _subjects = ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology'];
  final List<String> _examTypes = ['Mid Term', 'Final Term', 'Unit Test', 'Quiz', 'Assignment'];
  
  List<Student> _students = [];
  Map<String, TextEditingController> _marksControllers = {};

  @override
  void initState() {
    super.initState();
    _loadStudents();
  }

  void _loadStudents() {
    // Load students for the selected class
    setState(() {
      _students = mockStudents.take(8).toList(); // Show first 8 students
      _initializeMarksControllers();
    });
  }

  void _initializeMarksControllers() {
    _marksControllers.clear();
    for (var student in _students) {
      _marksControllers[student.id] = TextEditingController();
    }
  }

  @override
  void dispose() {
    _marksControllers.values.forEach((controller) => controller.dispose());
    super.dispose();
  }

  void _onClassChanged(String? newClass) {
    setState(() {
      _selectedClass = newClass ?? '';
      _loadStudents(); // Reload students for new class
    });
  }

  void _onSubjectChanged(String? newSubject) {
    setState(() {
      _selectedSubject = newSubject ?? '';
    });
  }

  void _onExamTypeChanged(String? newExamType) {
    setState(() {
      _selectedExamType = newExamType ?? '';
    });
  }

  Future<void> _submitMarks() async {
    // Validate required fields
    if (_selectedClass.isEmpty || _selectedSubject.isEmpty || _selectedExamType.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select class, subject, and exam type'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Validate marks
    bool hasValidMarks = false;
    for (var student in _students) {
      final marksText = _marksControllers[student.id]?.text ?? '';
      if (marksText.isNotEmpty) {
        final marks = int.tryParse(marksText);
        if (marks != null && marks >= 0 && marks <= _totalMarks) {
          hasValidMarks = true;
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Invalid marks for ${student.name}. Marks should be between 0 and $_totalMarks'),
              backgroundColor: Colors.red,
            ),
          );
          return;
        }
      }
    }

    if (!hasValidMarks) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter marks for at least one student'),
          backgroundColor: Colors.red,
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
          content: Text('Marks submitted successfully for $_selectedClass - $_selectedSubject'),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 3),
        ),
      );
      
      // Clear form
      _marksControllers.values.forEach((controller) => controller.clear());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Enter Exam Marks'),
        backgroundColor: Colors.purple,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Selection Controls
            _buildSelectionControls(),
            const SizedBox(height: 24),

            // Students List
            if (_selectedClass.isNotEmpty && _selectedSubject.isNotEmpty && _selectedExamType.isNotEmpty)
              _buildStudentsList(),
          ],
        ),
      ),
    );
  }

  Widget _buildSelectionControls() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Exam Details',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),

            // Class Selection
            const Text(
              'Select Class *',
              style: TextStyle(fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _selectedClass.isEmpty ? null : _selectedClass,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: 'Choose a class',
              ),
              items: _classes.map((String class_) {
                return DropdownMenuItem<String>(
                  value: class_,
                  child: Text(class_),
                );
              }).toList(),
              onChanged: _onClassChanged,
            ),
            const SizedBox(height: 16),

            // Subject Selection
            const Text(
              'Select Subject *',
              style: TextStyle(fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _selectedSubject.isEmpty ? null : _selectedSubject,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: 'Choose a subject',
              ),
              items: _subjects.map((String subject) {
                return DropdownMenuItem<String>(
                  value: subject,
                  child: Text(subject),
                );
              }).toList(),
              onChanged: _onSubjectChanged,
            ),
            const SizedBox(height: 16),

            // Exam Type Selection
            const Text(
              'Select Exam Type *',
              style: TextStyle(fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _selectedExamType.isEmpty ? null : _selectedExamType,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: 'Choose exam type',
              ),
              items: _examTypes.map((String examType) {
                return DropdownMenuItem<String>(
                  value: examType,
                  child: Text(examType),
                );
              }).toList(),
              onChanged: _onExamTypeChanged,
            ),
            const SizedBox(height: 16),

            // Total Marks
            const Text(
              'Total Marks',
              style: TextStyle(fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 8),
            TextFormField(
              initialValue: _totalMarks.toString(),
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: 'Total marks',
              ),
              keyboardType: TextInputType.number,
              onChanged: (value) {
                setState(() {
                  _totalMarks = int.tryParse(value) ?? 100;
                });
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStudentsList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Enter Marks (out of $_totalMarks)',
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        
        // Header
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.purple.shade50,
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Row(
            children: [
              Expanded(
                flex: 2,
                child: Text(
                  'Student',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              Expanded(
                child: Text(
                  'Roll No',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              Expanded(
                child: Text(
                  'Marks',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),

        // Students List
        ..._students.map((student) => _buildStudentRow(student)),
        
        const SizedBox(height: 24),

        // Submit Button
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            onPressed: _isSubmitting ? null : _submitMarks,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.purple,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
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
                      Text('Submitting Marks...'),
                    ],
                  )
                : const Text(
                    'Submit Marks',
                    style: TextStyle(fontSize: 16),
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildStudentRow(Student student) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          // Student Name
          Expanded(
            flex: 2,
            child: Text(
              student.name,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
          // Roll Number
          Expanded(
            child: Text(
              student.rollNo,
              style: TextStyle(
                color: Colors.grey.shade600,
                fontSize: 12,
              ),
            ),
          ),
          // Marks Input
          Expanded(
            child: TextFormField(
              controller: _marksControllers[student.id],
              decoration: InputDecoration(
                border: const OutlineInputBorder(),
                hintText: '0-$_totalMarks',
                contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              ),
              keyboardType: TextInputType.number,
              style: const TextStyle(fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
} 