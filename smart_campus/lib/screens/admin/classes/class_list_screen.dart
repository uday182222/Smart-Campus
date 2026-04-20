import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../core/constants/app_constants.dart';
import '../../../models/class_model.dart';
import 'class_form_screen.dart';
import 'class_detail_screen.dart';

class ClassListScreen extends StatefulWidget {
  const ClassListScreen({super.key});

  @override
  State<ClassListScreen> createState() => _ClassListScreenState();
}

class _ClassListScreenState extends State<ClassListScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedClass = 'All Classes';
  String _selectedSection = 'All Sections';
  String _selectedTeacher = 'All Teachers';
  List<ClassModel> _classes = [];
  bool _isLoading = true;
  StreamSubscription<QuerySnapshot<Map<String, dynamic>>>? _subscription;

  @override
  void initState() {
    super.initState();
    _subscription = FirebaseFirestore.instance
        .collection(AppConfig.colClasses)
        .snapshots()
        .listen((snapshot) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _classes = snapshot.docs
            .map((d) => ClassModel.fromMap({...d.data(), 'id': d.id}))
            .toList();
      });
    });
  }

  @override
  void dispose() {
    _subscription?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  List<ClassModel> get _filteredClasses {
    return _classes.where((classItem) {
      final matchesSearch = classItem.name.toLowerCase().contains(
            _searchController.text.toLowerCase(),
          ) ||
          classItem.subject.toLowerCase().contains(_searchController.text.toLowerCase());
      
      final matchesClass = _selectedClass == 'All Classes' ||
          classItem.name == _selectedClass;
      
      final matchesSection = _selectedSection == 'All Sections' ||
          classItem.section == _selectedSection;
      
      final matchesTeacher = _selectedTeacher == 'All Teachers' ||
          classItem.teacherId == _selectedTeacher;
      
      return matchesSearch && matchesClass && matchesSection && matchesTeacher;
    }).toList();
  }

  List<String> get _availableClasses {
    final classes = _classes.map((c) => c.name).toSet().toList();
    classes.sort();
    return ['All Classes', ...classes];
  }

  List<String> get _availableSections {
    final sections = _classes.map((c) => c.section).toSet().toList();
    sections.sort();
    return ['All Sections', ...sections];
  }

  List<String> get _availableTeachers {
    final teachers = _classes.map((c) => c.teacherId).toSet().toList();
    teachers.sort();
    return ['All Teachers', ...teachers];
  }

  void _addClass() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const ClassFormScreen(),
      ),
    );

    if (result == null || !mounted) return;
    if (result is ClassModel) {
      try {
        final data = result.toMap();
        data.remove('id');
        await FirebaseFirestore.instance.collection(AppConfig.colClasses).add(data);
        if (mounted) _showSnackBar('Class added successfully!', AppConstants.successColor);
      } catch (e) {
        if (mounted) _showSnackBar('Failed to add class: $e', AppConstants.errorColor);
      }
    }
  }

  void _editClass(ClassModel classItem) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ClassFormScreen(classItem: classItem),
      ),
    );
    
    if (result != null && result is ClassModel) {
      setState(() {
        final index = _classes.indexWhere((c) => c.id == classItem.id);
        if (index != -1) {
          _classes[index] = result;
        }
      });
      _showSnackBar('Class updated successfully!', AppConstants.successColor);
    }
  }

  void _deleteClass(ClassModel classItem) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Class'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Are you sure you want to delete ${classItem.displayName}?'),
            const SizedBox(height: 8),
            Text(
              'This will affect ${classItem.studentCount} students in this class.',
              style: const TextStyle(
                color: AppConstants.errorColor,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                await FirebaseFirestore.instance.collection(AppConfig.colClasses).doc(classItem.id).delete();
                if (!mounted) return;
                setState(() => _classes.removeWhere((c) => c.id == classItem.id));
                _showSnackBar('Class deleted successfully!', AppConstants.successColor);
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
        title: const Text('Classes'),
        backgroundColor: AppConstants.warningColor,
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
                hintText: 'Search by class name or section...',
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
          if (_selectedClass != 'All Classes' || 
              _selectedSection != 'All Sections' || 
              _selectedTeacher != 'All Teachers')
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Wrap(
                spacing: 8,
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
                  if (_selectedSection != 'All Sections')
                    Chip(
                      label: Text(_selectedSection),
                      onDeleted: () {
                        setState(() {
                          _selectedSection = 'All Sections';
                        });
                      },
                    ),
                  if (_selectedTeacher != 'All Teachers')
                    Chip(
                      label: Text(_selectedTeacher),
                      onDeleted: () {
                        setState(() {
                          _selectedTeacher = 'All Teachers';
                        });
                      },
                    ),
                ],
              ),
            ),
          
          // Class Count
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${_filteredClasses.length} classes found',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'Total: ${_classes.length}',
                  style: const TextStyle(
                    color: AppConstants.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          
          // Class List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredClasses.isEmpty
                    ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.class_outlined,
                          size: 64,
                          color: AppConstants.textSecondary,
                        ),
                        SizedBox(height: 16),
                        Text(
                          'No classes found',
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
                    itemCount: _filteredClasses.length,
                    itemBuilder: (context, index) {
                      final classItem = _filteredClasses[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: AppConstants.primaryColor,
                            child: Text(
                              classItem.grade.split(' ').last,
                              style: const TextStyle(
                                color: AppConstants.textWhite,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          title: Text(
                            classItem.displayName,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Teacher ID: ${classItem.teacherId}'),
                              Text('Section: ${classItem.section}'),
                              Text('Students: ${classItem.studentCount}'),
                              Text('Schedule: ${classItem.schedule}'),
                              Container(
                                margin: const EdgeInsets.only(top: 4),
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppConstants.primaryColor.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  'Room: ${classItem.roomNumber}',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: AppConstants.primaryColor,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
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
                                      builder: (context) => ClassDetailScreen(classItem: classItem),
                                    ),
                                  );
                                  break;
                                case 'edit':
                                  _editClass(classItem);
                                  break;
                                case 'delete':
                                  _deleteClass(classItem);
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
                                builder: (context) => ClassDetailScreen(classItem: classItem),
                              ),
                            );
                          },
                          onLongPress: () {
                            _deleteClass(classItem);
                          },
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _addClass,
        backgroundColor: AppConstants.warningColor,
        foregroundColor: AppConstants.textWhite,
        child: const Icon(Icons.add),
      ),
    );
  }

  void _showFilterDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Filter Classes'),
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
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _selectedTeacher,
              decoration: const InputDecoration(
                labelText: 'Teacher',
                border: OutlineInputBorder(),
              ),
              items: _availableTeachers.map((teacher) {
                return DropdownMenuItem(
                  value: teacher,
                  child: Text(teacher),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _selectedTeacher = value!;
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