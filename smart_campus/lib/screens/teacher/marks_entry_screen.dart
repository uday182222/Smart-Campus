import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../../core/constants/app_constants.dart';
import '../../models/class_model.dart';
import '../../models/mark_model.dart';
import '../../models/student_model.dart';
import '../../services/auth_service.dart';
import '../../services/marks_service.dart';

class MarksEntryScreen extends StatefulWidget {
  const MarksEntryScreen({super.key});

  @override
  State<MarksEntryScreen> createState() => _MarksEntryScreenState();
}

class _MarksEntryScreenState extends State<MarksEntryScreen> {
  List<ClassModel> _classes = [];
  List<Student> _students = [];
  String? _selectedClassId;
  String? _selectedClassName;
  final _subjectController = TextEditingController();
  final _totalMarksController = TextEditingController(text: '100');
  String _examType = 'midterm';
  double _totalMarks = 100;
  final Map<String, TextEditingController> _marksControllers = {};
  final Map<String, TextEditingController> _remarksControllers = {};
  bool _loadingClasses = true;
  bool _saving = false;
  String _progressMessage = '';

  static const List<String> _examTypes = [
    'midterm',
    'final',
    'quiz',
    'assignment',
  ];

  @override
  void initState() {
    super.initState();
    _loadClasses();
  }

  @override
  void dispose() {
    _subjectController.dispose();
    _totalMarksController.dispose();
    for (final c in _marksControllers.values) c.dispose();
    for (final c in _remarksControllers.values) c.dispose();
    super.dispose();
  }

  Future<void> _loadClasses() async {
    try {
      final snapshot =
          await FirebaseFirestore.instance.collection(AppConfig.colClasses).get();
      if (!mounted) return;
      setState(() {
        _classes = snapshot.docs
            .map((d) => ClassModel.fromMap({...d.data(), 'id': d.id}))
            .toList();
        _loadingClasses = false;
        if (_classes.isNotEmpty && _selectedClassId == null) {
          _selectedClassId = _classes.first.id;
          _selectedClassName = _classes.first.name;
          _loadStudents();
        }
      });
    } catch (e) {
      if (mounted) setState(() => _loadingClasses = false);
    }
  }

  Future<void> _loadStudents() async {
    if (_selectedClassName == null) return;
    try {
      final snapshot = await FirebaseFirestore.instance
          .collection(AppConfig.colStudents)
          .where('className', isEqualTo: _selectedClassName)
          .get();
      if (!mounted) return;
      final list = <Student>[];
      for (final doc in snapshot.docs) {
        final data = Map<String, dynamic>.from(doc.data());
        data['id'] = doc.id;
        final dob = data['dateOfBirth'];
        if (dob is Timestamp) {
          data['dateOfBirth'] = (dob as Timestamp).toDate().toIso8601String();
        }
        list.add(Student.fromMap(data));
      }
      setState(() {
        _students = list;
        _marksControllers.clear();
        _remarksControllers.clear();
        for (final s in _students) {
          _marksControllers[s.id] = TextEditingController();
          _remarksControllers[s.id] = TextEditingController();
        }
      });
    } catch (e) {
      if (mounted) setState(() => _students = []);
    }
  }

  Future<void> _saveAll() async {
    final subject = _subjectController.text.trim();
    if (subject.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter subject'),
          backgroundColor: AppConstants.warningColor,
        ),
      );
      return;
    }
    if (_selectedClassId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a class'),
          backgroundColor: AppConstants.warningColor,
        ),
      );
      return;
    }

    final toSave = <Student>[];
    for (final s in _students) {
      final marksText = _marksControllers[s.id]?.text.trim() ?? '';
      if (marksText.isEmpty) continue;
      final obtained = double.tryParse(marksText);
      if (obtained == null ||
          obtained < 0 ||
          obtained > _totalMarks) continue;
      toSave.add(s);
    }

    if (toSave.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter marks for at least one student'),
          backgroundColor: AppConstants.warningColor,
        ),
      );
      return;
    }

    final user = AuthService.getCurrentUserModel();
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('You must be logged in'),
          backgroundColor: AppConstants.errorColor,
        ),
      );
      return;
    }

    setState(() => _saving = true);

    try {
      for (var i = 0; i < toSave.length; i++) {
        if (!mounted) return;
        setState(() =>
            _progressMessage = 'Saving ${i + 1}/${toSave.length}...');

        final s = toSave[i];
        final obtained =
            double.tryParse(_marksControllers[s.id]?.text.trim() ?? '0') ?? 0;
        final remarks = _remarksControllers[s.id]?.text.trim() ?? '';

        final grade = Mark.calculateGrade(obtained, _totalMarks);
        final mark = Mark(
          id: MarksService.newMarkId(),
          studentId: s.id,
          studentName: s.name,
          subject: subject,
          examType: _examType,
          marksObtained: obtained,
          totalMarks: _totalMarks,
          grade: grade,
          teacherId: user.id,
          classId: _selectedClassId!,
          createdAt: DateTime.now(),
          remarks: remarks.isEmpty ? null : remarks,
        );
        final ok = await MarksService.saveMark(mark);
        if (!ok) throw Exception('Failed to save mark for ${s.name}');
      }

      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Marks saved for ${toSave.length} students'),
          backgroundColor: AppConstants.successColor,
        ),
      );
      Navigator.pop(context);
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to save: $e'),
          backgroundColor: AppConstants.errorColor,
        ),
      );
    } finally {
      if (mounted) setState(() {
        _saving = false;
        _progressMessage = '';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Enter Marks'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
        actions: [
          IconButton(
            icon: const Icon(Icons.check_circle),
            onPressed: _saving ? null : _saveAll,
            tooltip: 'Save All',
          ),
        ],
      ),
      body: _loadingClasses
          ? const Center(child: CircularProgressIndicator())
          : _classes.isEmpty
              ? const Center(child: Text('No classes found'))
              : SingleChildScrollView(
              padding: const EdgeInsets.all(AppConstants.paddingMedium),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  DropdownButtonFormField<String>(
                    value: _selectedClassId,
                    decoration: const InputDecoration(
                      labelText: 'Class',
                      border: OutlineInputBorder(),
                    ),
                    items: _classes
                        .map((c) => DropdownMenuItem(
                              value: c.id,
                              child: Text(c.name),
                            ))
                        .toList(),
                    onChanged: (v) {
                      setState(() {
                        _selectedClassId = v;
                        _selectedClassName =
                            _classes.firstWhere((c) => c.id == v).name;
                        _loadStudents();
                      });
                    },
                  ),
                  const SizedBox(height: AppConstants.paddingMedium),
                  TextField(
                    controller: _subjectController,
                    decoration: const InputDecoration(
                      labelText: 'Subject',
                      hintText: 'e.g. Mathematics',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: AppConstants.paddingMedium),
                  DropdownButtonFormField<String>(
                    value: _examType,
                    decoration: const InputDecoration(
                      labelText: 'Exam Type',
                      border: OutlineInputBorder(),
                    ),
                    items: _examTypes
                        .map((e) => DropdownMenuItem(
                              value: e,
                              child: Text(e[0].toUpperCase() + e.substring(1)),
                            ))
                        .toList(),
                    onChanged: (v) => setState(() => _examType = v ?? 'midterm'),
                  ),
                  const SizedBox(height: AppConstants.paddingMedium),
                  TextField(
                    controller: _totalMarksController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Total Marks',
                      border: OutlineInputBorder(),
                    ),
                    onChanged: (v) {
                      setState(() =>
                          _totalMarks = double.tryParse(v) ?? 100);
                    },
                  ),
                  const SizedBox(height: AppConstants.paddingLarge),
                  if (_progressMessage.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text(
                        _progressMessage,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          color: AppConstants.primaryColor,
                        ),
                      ),
                    ),
                  const Text(
                    'Students',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: AppConstants.paddingSmall),
                  if (_students.isEmpty)
                    Padding(
                      padding: const EdgeInsets.all(24),
                      child: Center(
                        child: Text(
                          _selectedClassName == null
                              ? 'Select a class to load students'
                              : 'No students found',
                          style: const TextStyle(color: AppConstants.textSecondary),
                        ),
                      ),
                    )
                  else
                    ..._students.map((s) => _buildStudentRow(s)),
                  const SizedBox(height: AppConstants.paddingLarge),
                  if (_students.isNotEmpty)
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _saving ? null : _saveAll,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppConstants.primaryColor,
                          foregroundColor: AppConstants.textWhite,
                          padding: const EdgeInsets.symmetric(
                            vertical: AppConstants.paddingMedium,
                          ),
                        ),
                        child: _saving
                            ? const SizedBox(
                                height: 24,
                                width: 24,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text('Save All'),
                      ),
                    ),
                ],
              ),
            ),
    );
  }

  Widget _buildStudentRow(Student s) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppConstants.paddingSmall),
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    s.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                SizedBox(
                  width: 80,
                  child: TextField(
                    controller: _marksControllers[s.id],
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      hintText: '0-${_totalMarks.toInt()}',
                      border: const OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _remarksControllers[s.id],
              maxLines: 1,
              decoration: const InputDecoration(
                hintText: 'Remarks (optional)',
                border: OutlineInputBorder(),
                isDense: true,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
