import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import '../../../core/constants/app_constants.dart';
import '../../../models/teacher_model.dart';
import 'teacher_form_screen.dart';
import 'teacher_profile_screen.dart';

class TeacherListScreen extends StatefulWidget {
  const TeacherListScreen({super.key});

  @override
  State<TeacherListScreen> createState() => _TeacherListScreenState();
}

class _TeacherListScreenState extends State<TeacherListScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedSubject = 'All Subjects';
  String _selectedClass = 'All Classes';
  String _selectedStatus = 'All';
  List<Teacher> _teachers = [];
  bool _isLoading = true;
  StreamSubscription<QuerySnapshot<Map<String, dynamic>>>? _subscription;

  static Map<String, dynamic> _docToJson(QueryDocumentSnapshot<Map<String, dynamic>> d) {
    final data = Map<String, dynamic>.from(d.data());
    data['id'] = d.id;
    for (final k in ['dateOfBirth', 'joiningDate', 'createdAt', 'updatedAt']) {
      final v = data[k];
      if (v is Timestamp) data[k] = v.toDate().toIso8601String();
    }
    return data;
  }

  @override
  void initState() {
    super.initState();
    _subscription = FirebaseFirestore.instance
        .collection(AppConfig.colTeachers)
        .snapshots()
        .listen((snapshot) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _teachers = snapshot.docs.map((d) => Teacher.fromJson(_docToJson(d))).toList();
      });
    });
  }

  @override
  void dispose() {
    _subscription?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  List<Teacher> get _filteredTeachers {
    return _teachers.where((teacher) {
      final matchesSearch = teacher.fullName.toLowerCase().contains(
            _searchController.text.toLowerCase(),
          ) ||
          teacher.email.toLowerCase().contains(
            _searchController.text.toLowerCase(),
          ) ||
          teacher.phoneNumber.contains(_searchController.text);
      
      final matchesSubject = _selectedSubject == 'All Subjects' ||
          teacher.subjects.contains(_selectedSubject);
      
      final matchesClass = _selectedClass == 'All Classes' ||
          teacher.assignedClasses.contains(_selectedClass);
      
      final matchesStatus = _selectedStatus == 'All' ||
          (_selectedStatus == 'Active' && teacher.isActive) ||
          (_selectedStatus == 'Inactive' && !teacher.isActive);
      
      return matchesSearch && matchesSubject && matchesClass && matchesStatus;
    }).toList();
  }

  List<String> get _availableSubjects {
    final subjects = <String>{};
    for (final teacher in _teachers) {
      subjects.addAll(teacher.subjects);
    }
    final sortedSubjects = subjects.toList()..sort();
    return ['All Subjects', ...sortedSubjects];
  }

  List<String> get _availableClasses {
    final classes = <String>{};
    for (final teacher in _teachers) {
      classes.addAll(teacher.assignedClasses);
    }
    final sortedClasses = classes.toList()..sort();
    return ['All Classes', ...sortedClasses];
  }

  void _addTeacher() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const TeacherFormScreen(),
      ),
    );

    if (result == null || !mounted) return;

    if (result is List && result.length == 2) {
      final teacher = result[0] as Teacher;
      final imageFile = result[1] as File?;
      try {
        final data = Map<String, dynamic>.from(teacher.toJson());
        data.remove('id');
        final docRef = await FirebaseFirestore.instance.collection(AppConfig.colTeachers).add(data);
        final id = docRef.id;
        if (imageFile != null) {
          final ref = FirebaseStorage.instance.ref().child('teachers/$id/profile.jpg');
          await ref.putFile(imageFile);
          final profileUrl = await ref.getDownloadURL();
          await docRef.update({'photoUrl': profileUrl});
        }
        if (mounted) _showSnackBar('Teacher added successfully!', AppConstants.successColor);
      } catch (e) {
        if (mounted) _showSnackBar('Failed to add teacher: $e', AppConstants.errorColor);
      }
      return;
    }

    if (result is Teacher) {
      try {
        final data = Map<String, dynamic>.from(result.toJson());
        data.remove('id');
        await FirebaseFirestore.instance.collection(AppConfig.colTeachers).add(data);
        if (mounted) _showSnackBar('Teacher added successfully!', AppConstants.successColor);
      } catch (e) {
        if (mounted) _showSnackBar('Failed to add teacher: $e', AppConstants.errorColor);
      }
    }
  }

  void _editTeacher(Teacher teacher) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => TeacherFormScreen(teacher: teacher),
      ),
    );
    
    if (result != null && result is Teacher) {
      setState(() {
        final index = _teachers.indexWhere((t) => t.id == teacher.id);
        if (index != -1) {
          _teachers[index] = result;
        }
      });
      _showSnackBar('Teacher updated successfully!', AppConstants.successColor);
    }
  }

  void _deleteTeacher(Teacher teacher) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Teacher'),
        content: Text('Are you sure you want to delete ${teacher.fullName}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                await FirebaseFirestore.instance.collection(AppConfig.colTeachers).doc(teacher.id).delete();
                if (!mounted) return;
                setState(() => _teachers.removeWhere((t) => t.id == teacher.id));
                _showSnackBar('Teacher deleted successfully!', AppConstants.successColor);
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
        title: const Text('Teachers'),
        backgroundColor: AppConstants.successColor,
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
                hintText: 'Search by name, email, or phone...',
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
          if (_selectedSubject != 'All Subjects' || 
              _selectedClass != 'All Classes' || 
              _selectedStatus != 'All')
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Wrap(
                spacing: 8,
                children: [
                  if (_selectedSubject != 'All Subjects')
                    Chip(
                      label: Text(_selectedSubject),
                      onDeleted: () {
                        setState(() {
                          _selectedSubject = 'All Subjects';
                        });
                      },
                    ),
                  if (_selectedClass != 'All Classes')
                    Chip(
                      label: Text(_selectedClass),
                      onDeleted: () {
                        setState(() {
                          _selectedClass = 'All Classes';
                        });
                      },
                    ),
                  if (_selectedStatus != 'All')
                    Chip(
                      label: Text(_selectedStatus),
                      onDeleted: () {
                        setState(() {
                          _selectedStatus = 'All';
                        });
                      },
                    ),
                ],
              ),
            ),
          
          // Teacher Count
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${_filteredTeachers.length} teachers found',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'Total: ${_teachers.length}',
                  style: const TextStyle(
                    color: AppConstants.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          
          // Teacher List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredTeachers.isEmpty
                    ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.school_outlined,
                          size: 64,
                          color: AppConstants.textSecondary,
                        ),
                        SizedBox(height: 16),
                        Text(
                          'No teachers found',
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
                    itemCount: _filteredTeachers.length,
                    itemBuilder: (context, index) {
                      final teacher = _filteredTeachers[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: AppConstants.successColor,
                            child: Text(
                              teacher.fullName[0].toUpperCase(),
                              style: const TextStyle(
                                color: AppConstants.textWhite,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          title: Text(
                            teacher.fullName,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Email: ${teacher.email}'),
                              Text('Subjects: ${teacher.subjectsDisplay}'),
                              Text('Classes: ${teacher.assignedClassesDisplay}'),
                              Text('Experience: ${teacher.experience} years'),
                              Row(
                                children: [
                                  Icon(
                                    teacher.isActive ? Icons.check_circle : Icons.cancel,
                                    size: 16,
                                    color: teacher.isActive 
                                        ? AppConstants.successColor 
                                        : AppConstants.errorColor,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    teacher.isActive ? 'Active' : 'Inactive',
                                    style: TextStyle(
                                      color: teacher.isActive 
                                          ? AppConstants.successColor 
                                          : AppConstants.errorColor,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          trailing: PopupMenuButton<String>(
                            onSelected: (value) {
                              switch (value) {
                                case 'view':
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => TeacherProfileScreen(teacher: teacher),
                                    ),
                                  );
                                  break;
                                case 'edit':
                                  _editTeacher(teacher);
                                  break;
                                case 'delete':
                                  _deleteTeacher(teacher);
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
                                builder: (context) => TeacherProfileScreen(teacher: teacher),
                              ),
                            );
                          },
                          onLongPress: () {
                            _deleteTeacher(teacher);
                          },
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _addTeacher,
        backgroundColor: AppConstants.successColor,
        foregroundColor: AppConstants.textWhite,
        child: const Icon(Icons.add),
      ),
    );
  }

  void _showFilterDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Filter Teachers'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              value: _selectedSubject,
              decoration: const InputDecoration(
                labelText: 'Subject',
                border: OutlineInputBorder(),
              ),
              items: _availableSubjects.map((subject) {
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
            ),
            const SizedBox(height: 16),
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
              value: _selectedStatus,
              decoration: const InputDecoration(
                labelText: 'Status',
                border: OutlineInputBorder(),
              ),
              items: ['All', 'Active', 'Inactive'].map((status) {
                return DropdownMenuItem(
                  value: status,
                  child: Text(status),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _selectedStatus = value!;
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