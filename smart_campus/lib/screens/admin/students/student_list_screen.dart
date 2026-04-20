import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import '../../../core/constants/app_constants.dart';
import '../../../models/student_model.dart';
import 'student_form_screen.dart';
import 'student_profile_screen.dart';

class StudentListScreen extends StatefulWidget {
  final String? initialClassName;

  const StudentListScreen({super.key, this.initialClassName});

  @override
  State<StudentListScreen> createState() => _StudentListScreenState();
}

class _StudentListScreenState extends State<StudentListScreen> {
  final TextEditingController _searchController = TextEditingController();
  late String _selectedClass;
  String _selectedSection = 'All Sections';
  List<Student> _students = [];
  bool _isLoading = true;
  StreamSubscription<QuerySnapshot<Map<String, dynamic>>>? _subscription;

  @override
  void initState() {
    super.initState();
    _selectedClass = widget.initialClassName ?? 'All Classes';
    _subscription = FirebaseFirestore.instance
        .collection(AppConfig.colStudents)
        .snapshots()
        .listen((snapshot) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _students = snapshot.docs.map((d) {
          final data = Map<String, dynamic>.from(d.data());
          data['id'] = d.id;
          final dob = data['dateOfBirth'];
          if (dob is Timestamp) data['dateOfBirth'] = dob.toDate().toIso8601String();
          return Student.fromMap(data);
        }).toList();
      });
    });
  }

  @override
  void dispose() {
    _subscription?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  List<Student> get _filteredStudents {
    return _students.where((student) {
      final matchesSearch = student.name.toLowerCase().contains(
            _searchController.text.toLowerCase(),
          ) ||
          student.rollNo.toLowerCase().contains(
            _searchController.text.toLowerCase(),
          );
      
      final matchesClass = _selectedClass == 'All Classes' ||
          student.className == _selectedClass;
      
      final matchesSection = _selectedSection == 'All Sections' ||
          student.className.split(' ').last == _selectedSection;
      
      return matchesSearch && matchesClass && matchesSection;
    }).toList();
  }

  List<String> get _availableClasses {
    final classes = _students.map((s) => s.className).toSet().toList();
    if (widget.initialClassName != null && !classes.contains(widget.initialClassName)) {
      classes.add(widget.initialClassName!);
    }
    classes.sort();
    return ['All Classes', ...classes];
  }

  List<String> get _availableSections {
    final sections = _students.map((s) => s.className.split(' ').last).toSet().toList();
    sections.sort();
    return ['All Sections', ...sections];
  }

  void _addStudent() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const StudentFormScreen(),
      ),
    );

    if (result == null || !mounted) return;

    if (result is List && result.length == 2) {
      final student = result[0] as Student;
      final imageFile = result[1] as File?;
      try {
        final data = Map<String, dynamic>.from(student.toMap());
        data.remove('id');
        data['dateOfBirth'] = student.dateOfBirth.toIso8601String();
        final docRef = await FirebaseFirestore.instance.collection(AppConfig.colStudents).add(data);
        final id = docRef.id;
        if (imageFile != null) {
          final ref = FirebaseStorage.instance.ref().child('students/$id/profile.jpg');
          await ref.putFile(imageFile);
          final profileUrl = await ref.getDownloadURL();
          await docRef.update({'profileUrl': profileUrl});
        }
        if (mounted) _showSnackBar('Student added successfully!', AppConstants.successColor);
      } catch (e) {
        if (mounted) _showSnackBar('Failed to add student: $e', AppConstants.errorColor);
      }
      return;
    }

    if (result is Student) {
      try {
        final data = Map<String, dynamic>.from(result.toMap());
        data.remove('id');
        data['dateOfBirth'] = result.dateOfBirth.toIso8601String();
        await FirebaseFirestore.instance.collection(AppConfig.colStudents).add(data);
        if (mounted) _showSnackBar('Student added successfully!', AppConstants.successColor);
      } catch (e) {
        if (mounted) _showSnackBar('Failed to add student: $e', AppConstants.errorColor);
      }
    }
  }

  void _editStudent(Student student) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => StudentFormScreen(student: student),
      ),
    );
    
    if (result != null && result is Student) {
      setState(() {
        final index = _students.indexWhere((s) => s.id == student.id);
        if (index != -1) {
          _students[index] = result;
        }
      });
      _showSnackBar('Student updated successfully!', AppConstants.successColor);
    }
  }

  void _deleteStudent(Student student) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Student'),
        content: Text('Are you sure you want to delete ${student.name}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                await FirebaseFirestore.instance.collection(AppConfig.colStudents).doc(student.id).delete();
                if (!mounted) return;
                setState(() => _students.removeWhere((s) => s.id == student.id));
                _showSnackBar('Student deleted successfully!', AppConstants.successColor);
              } catch (e) {
                if (mounted) _showSnackBar('Delete failed: $e', AppConstants.errorColor);
              }
            },
            child: const Text(
              'Delete',
              style: TextStyle(color: AppConstants.errorColor),
            ),
          ),
        ],
      ),
    );
  }

  void _showSnackBar(String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: color,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Students'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              // Search functionality is already in the body
            },
          ),
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () {
              _showFilterDialog();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search by name or admission number...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                filled: true,
                fillColor: Colors.grey[100],
              ),
              onChanged: (value) {
                setState(() {});
              },
            ),
          ),
          
          // Filter Chips
          if (_selectedClass != 'All Classes' || _selectedSection != 'All Sections')
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Row(
                children: [
                  if (_selectedClass != 'All Classes')
                    Chip(
                      label: Text(_selectedClass),
                      onDeleted: () {
                        setState(() {
                          _selectedClass = 'All Classes';
                        });
                      },
                    ),
                  const SizedBox(width: 8),
                  if (_selectedSection != 'All Sections')
                    Chip(
                      label: Text(_selectedSection),
                      onDeleted: () {
                        setState(() {
                          _selectedSection = 'All Sections';
                        });
                      },
                    ),
                ],
              ),
            ),
          
          // Student Count
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${_filteredStudents.length} students found',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'Total: ${_students.length}',
                  style: const TextStyle(
                    color: AppConstants.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          
          // Student List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredStudents.isEmpty
                    ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.people_outline,
                          size: 64,
                          color: AppConstants.textSecondary,
                        ),
                        SizedBox(height: 16),
                        Text(
                          'No students found',
                          style: TextStyle(
                            fontSize: 18,
                            color: AppConstants.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  )
                    : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    itemCount: _filteredStudents.length,
                    itemBuilder: (context, index) {
                      final student = _filteredStudents[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: AppConstants.primaryColor,
                            child: Text(
                              student.name[0].toUpperCase(),
                              style: const TextStyle(
                                color: AppConstants.textWhite,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          title: Text(
                            student.name,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Roll No: ${student.rollNo}'),
                              Text('Class: ${student.className}'),
                              Text('Age: ${DateTime.now().year - student.dateOfBirth.year} years'),
                            ],
                          ),
                          trailing: PopupMenuButton<String>(
                            onSelected: (value) {
                              switch (value) {
                                case 'view':
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => StudentProfileScreen(student: student),
                                    ),
                                  );
                                  break;
                                case 'edit':
                                  _editStudent(student);
                                  break;
                                case 'delete':
                                  _deleteStudent(student);
                                  break;
                              }
                            },
                            itemBuilder: (context) => [
                              const PopupMenuItem(
                                value: 'view',
                                child: Row(
                                  children: [
                                    Icon(Icons.visibility),
                                    SizedBox(width: 8),
                                    Text('View'),
                                  ],
                                ),
                              ),
                              const PopupMenuItem(
                                value: 'edit',
                                child: Row(
                                  children: [
                                    Icon(Icons.edit),
                                    SizedBox(width: 8),
                                    Text('Edit'),
                                  ],
                                ),
                              ),
                              const PopupMenuItem(
                                value: 'delete',
                                child: Row(
                                  children: [
                                    Icon(Icons.delete, color: AppConstants.errorColor),
                                    SizedBox(width: 8),
                                    Text('Delete', style: TextStyle(color: AppConstants.errorColor)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => StudentProfileScreen(student: student),
                              ),
                            );
                          },
                          onLongPress: () {
                            _deleteStudent(student);
                          },
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _addStudent,
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
        child: const Icon(Icons.add),
      ),
    );
  }

  void _showFilterDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Filter Students'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              value: _selectedClass,
              decoration: const InputDecoration(
                labelText: 'Class',
                border: OutlineInputBorder(),
              ),
              items: _availableClasses.map((className) {
                return DropdownMenuItem(
                  value: className,
                  child: Text(className),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _selectedClass = value!;
                });
              },
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _selectedSection,
              decoration: const InputDecoration(
                labelText: 'Section',
                border: OutlineInputBorder(),
              ),
              items: _availableSections.map((section) {
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
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
            },
            child: const Text('Apply'),
          ),
        ],
      ),
    );
  }
} 