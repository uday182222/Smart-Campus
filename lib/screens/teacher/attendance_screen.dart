import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';
import '../../models/student_model.dart';
import '../../services/auth_service.dart';
import 'widgets/attendance_card.dart';

class TeacherAttendanceScreen extends StatefulWidget {
  const TeacherAttendanceScreen({super.key});

  @override
  State<TeacherAttendanceScreen> createState() => _TeacherAttendanceScreenState();
}

class _TeacherAttendanceScreenState extends State<TeacherAttendanceScreen> {
  List<Student> _students = [];
  Map<String, bool> _attendanceMap = {};
  DateTime _selectedDate = DateTime.now();
  bool _isLoading = false;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _loadStudents();
    _initializeAttendance();
  }

  void _loadStudents() {
    // Load students for the teacher's class
    // For now, using mock data - in real app, filter by teacher's assigned class
    setState(() {
      _students = mockStudents.take(8).toList(); // Show first 8 students
    });
  }

  void _initializeAttendance() {
    _attendanceMap.clear();
    for (var student in _students) {
      _attendanceMap[student.id] = false; // Default to absent
    }
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
        _initializeAttendance(); // Reset attendance for new date
      });
    }
  }

  void _toggleAttendance(String studentId) {
    setState(() {
      _attendanceMap[studentId] = !(_attendanceMap[studentId] ?? false);
    });
  }

  Future<void> _submitAttendance() async {
    if (!_isSubmitting) {
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
            content: Text('Attendance submitted for ${_selectedDate.toString().split(' ')[0]}'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  int get _presentCount => _attendanceMap.values.where((present) => present).length;
  int get _absentCount => _students.length - _presentCount;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Attendance Management'),
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
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
          : Column(
              children: [
                // Date and Summary Card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.deepPurple.shade50,
                    borderRadius: const BorderRadius.only(
                      bottomLeft: Radius.circular(20),
                      bottomRight: Radius.circular(20),
                    ),
                  ),
                  child: Column(
                    children: [
                      // Date Display
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Date: ${_selectedDate.toString().split(' ')[0]}',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          TextButton.icon(
                            onPressed: _selectDate,
                            icon: const Icon(Icons.edit_calendar),
                            label: const Text('Change'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      // Attendance Summary
                      Row(
                        children: [
                          Expanded(
                            child: _buildSummaryCard(
                              'Present',
                              _presentCount,
                              Colors.green,
                              Icons.check_circle,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildSummaryCard(
                              'Absent',
                              _absentCount,
                              Colors.red,
                              Icons.cancel,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildSummaryCard(
                              'Total',
                              _students.length,
                              Colors.blue,
                              Icons.people,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                // Students List
                Expanded(
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
                              SizedBox(height: 16),
                              Text(
                                'No students assigned',
                                style: TextStyle(
                                  fontSize: 18,
                                  color: Colors.grey,
                                ),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _students.length,
                          itemBuilder: (context, index) {
                            final student = _students[index];
                            final isPresent = _attendanceMap[student.id] ?? false;
                            
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: AttendanceCard(
                                student: student,
                                isPresent: isPresent,
                                onToggle: () => _toggleAttendance(student.id),
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _isSubmitting ? null : _submitAttendance,
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
        icon: _isSubmitting
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : const Icon(Icons.save),
        label: Text(_isSubmitting ? 'Saving...' : 'Submit Attendance'),
      ),
    );
  }

  Widget _buildSummaryCard(String title, int count, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
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