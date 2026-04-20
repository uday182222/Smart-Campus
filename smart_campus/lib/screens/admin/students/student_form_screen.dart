import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../core/constants/app_constants.dart';
import '../../../models/student_model.dart';

class StudentFormScreen extends StatefulWidget {
  final Student? student; // null for add, not null for edit

  const StudentFormScreen({super.key, this.student});

  @override
  State<StudentFormScreen> createState() => _StudentFormScreenState();
}

class _StudentFormScreenState extends State<StudentFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _admissionController = TextEditingController();
  final _parentContactController = TextEditingController();
  final _addressController = TextEditingController();
  final _transportRouteController = TextEditingController();

  String _selectedClass = 'Class 1';
  String _selectedSection = 'A';
  String _selectedGender = 'Male';
  DateTime _selectedDate = DateTime.now().subtract(const Duration(days: 365 * 5)); // 5 years ago

  final List<String> _classes = [
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
    'Class 11', 'Class 12'
  ];

  final List<String> _sections = ['A', 'B', 'C', 'D', 'E'];
  final List<String> _genders = ['Male', 'Female', 'Other'];
  final List<String> _transportRoutes = [
    'Route 1', 'Route 2', 'Route 3', 'Route 4', 'Route 5', 'No Transport'
  ];

  bool _isLoading = false;
  File? _profileImage;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    if (widget.student != null) {
      // Edit mode - populate fields
      final student = widget.student!;
      _nameController.text = student.name;
      _admissionController.text = student.rollNo;
      _parentContactController.text = student.parentPhone;
      _addressController.text = student.address;
      _transportRouteController.text = ''; // transportRoute not in current model
      _selectedClass = student.className;
      _selectedSection = student.className.split(' ').last; // Extract section from className
      _selectedGender = student.gender;
      _selectedDate = student.dateOfBirth;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _admissionController.dispose();
    _parentContactController.dispose();
    _addressController.dispose();
    _transportRouteController.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  Future<void> _pickImage() async {
    final XFile? picked = await _picker.pickImage(source: ImageSource.gallery);
    if (picked != null && mounted) {
      setState(() => _profileImage = File(picked.path));
    }
  }

  void _saveStudent() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isLoading = true);

    String? profileUrl;
    final isEdit = widget.student != null;
    final studentId = widget.student?.id ?? DateTime.now().millisecondsSinceEpoch.toString();

    if (_profileImage != null && isEdit) {
      try {
        final ref = FirebaseStorage.instance.ref().child('students/$studentId/profile.jpg');
        await ref.putFile(_profileImage!);
        profileUrl = await ref.getDownloadURL();
      } catch (e) {
        if (mounted) {
          setState(() => _isLoading = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Photo upload failed: $e'), backgroundColor: AppConstants.errorColor),
          );
        }
        return;
      }
    }

    final student = Student(
      id: studentId,
      name: _nameController.text.trim(),
      className: _selectedClass,
      rollNo: _admissionController.text.trim(),
      profileUrl: profileUrl ?? widget.student?.profileUrl,
      email: '${_nameController.text.trim().toLowerCase().replaceAll(' ', '.')}@school.com',
      phone: _parentContactController.text.trim(),
      address: _addressController.text.trim(),
      parentName: 'Parent of ${_nameController.text.trim()}',
      parentPhone: _parentContactController.text.trim(),
      dateOfBirth: _selectedDate,
      gender: _selectedGender,
      bloodGroup: 'O+',
      admissionDate: DateTime.now().toIso8601String().split('T')[0],
    );

    if (isEdit) {
      try {
        final map = student.toMap();
        map['dateOfBirth'] = student.dateOfBirth.toIso8601String();
        await FirebaseFirestore.instance.collection(AppConfig.colStudents).doc(studentId).update(map);
      } catch (e) {
        if (mounted) {
          setState(() => _isLoading = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Update failed: $e'), backgroundColor: AppConstants.errorColor),
          );
        }
        return;
      }
    }

    setState(() => _isLoading = false);
    if (!mounted) return;
    if (!isEdit && _profileImage != null) {
      Navigator.pop(context, [student, _profileImage]);
    } else {
      Navigator.pop(context, student);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.student == null ? 'Add Student' : 'Edit Student'),
        backgroundColor: AppConstants.primaryColor,
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
              // Profile Picture Section
              Center(
                child: Column(
                  children: [
                    GestureDetector(
                      onTap: _pickImage,
                      child: CircleAvatar(
                        radius: 50,
                        backgroundColor: AppConstants.primaryColor,
                        backgroundImage: _profileImage != null ? FileImage(_profileImage!) : null,
                        child: _profileImage == null
                            ? const Icon(Icons.person, size: 50, color: Colors.white)
                            : null,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextButton.icon(
                      onPressed: _pickImage,
                      icon: const Icon(Icons.camera_alt),
                      label: const Text('Upload Photo'),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Full Name
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Full Name *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.person),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter full name';
                  }
                  return null;
                },
              ),
              
              const SizedBox(height: 16),
              
              // Admission Number
              TextFormField(
                controller: _admissionController,
                decoration: const InputDecoration(
                  labelText: 'Admission Number *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.badge),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter admission number';
                  }
                  return null;
                },
              ),
              
              const SizedBox(height: 16),
              
              // Class and Section Row
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _selectedClass,
                      decoration: const InputDecoration(
                        labelText: 'Class *',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.class_),
                      ),
                      items: _classes.map((className) {
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
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: DropdownButtonFormField<String>(
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
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Gender
              DropdownButtonFormField<String>(
                value: _selectedGender,
                decoration: const InputDecoration(
                  labelText: 'Gender *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.person_outline),
                ),
                items: _genders.map((gender) {
                  return DropdownMenuItem(
                    value: gender,
                    child: Text(gender),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedGender = value!;
                  });
                },
              ),
              
              const SizedBox(height: 16),
              
              // Date of Birth
              InkWell(
                onTap: _selectDate,
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Date of Birth *',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.calendar_today),
                  ),
                  child: Text(
                    '${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
                    style: const TextStyle(fontSize: 16),
                  ),
                ),
              ),
              
              const SizedBox(height: 16),
              
              // Parent Contact
              TextFormField(
                controller: _parentContactController,
                decoration: const InputDecoration(
                  labelText: 'Parent Contact *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.phone),
                ),
                keyboardType: TextInputType.phone,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter parent contact';
                  }
                  return null;
                },
              ),
              
              const SizedBox(height: 16),
              
              // Address
              TextFormField(
                controller: _addressController,
                decoration: const InputDecoration(
                  labelText: 'Address *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.location_on),
                ),
                maxLines: 3,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter address';
                  }
                  return null;
                },
              ),
              
              const SizedBox(height: 16),
              
              // Transport Route
              DropdownButtonFormField<String>(
                value: _transportRouteController.text.isEmpty 
                    ? 'No Transport' 
                    : _transportRouteController.text,
                decoration: const InputDecoration(
                  labelText: 'Transport Route (Optional)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.directions_bus),
                ),
                items: _transportRoutes.map((route) {
                  return DropdownMenuItem(
                    value: route,
                    child: Text(route),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _transportRouteController.text = value == 'No Transport' ? '' : value!;
                  });
                },
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
                      onPressed: _isLoading ? null : _saveStudent,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppConstants.primaryColor,
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
                          : Text(widget.student == null ? 'Save' : 'Update'),
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