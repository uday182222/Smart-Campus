import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../core/constants/app_constants.dart';
import '../../../models/teacher_model.dart';

class TeacherFormScreen extends StatefulWidget {
  final Teacher? teacher; // null for add, not null for edit

  const TeacherFormScreen({super.key, this.teacher});

  @override
  State<TeacherFormScreen> createState() => _TeacherFormScreenState();
}

class _TeacherFormScreenState extends State<TeacherFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _qualificationController = TextEditingController();

  String _selectedGender = 'Male';
  List<String> _selectedSubjects = [];
  List<String> _selectedClasses = [];
  DateTime _selectedDateOfBirth = DateTime.now().subtract(const Duration(days: 365 * 30)); // 30 years ago
  DateTime _selectedJoiningDate = DateTime.now().subtract(const Duration(days: 365 * 2)); // 2 years ago
  bool _isActive = true;

  final List<String> _genders = ['Male', 'Female', 'Other'];
  final List<String> _availableSubjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Literature',
    'History', 'Geography', 'Economics', 'Computer Science', 'Art', 'Music',
    'Physical Education', 'Social Studies', 'Environmental Science'
  ];
  final List<String> _availableClasses = [
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
    'Class 11', 'Class 12'
  ];

  bool _isLoading = false;
  File? _profileImage;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    if (widget.teacher != null) {
      // Edit mode - populate fields
      final teacher = widget.teacher!;
      _nameController.text = teacher.fullName;
      _emailController.text = teacher.email;
      _phoneController.text = teacher.phoneNumber;
      _addressController.text = teacher.address;
      _qualificationController.text = teacher.qualification;
      _selectedGender = teacher.gender;
      _selectedSubjects = List.from(teacher.subjects);
      _selectedClasses = List.from(teacher.assignedClasses);
      _selectedDateOfBirth = teacher.dateOfBirth;
      _selectedJoiningDate = teacher.joiningDate;
      _isActive = teacher.isActive;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _qualificationController.dispose();
    super.dispose();
  }

  Future<void> _selectDateOfBirth() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDateOfBirth,
      firstDate: DateTime(1950),
      lastDate: DateTime.now(),
    );
    if (picked != null && picked != _selectedDateOfBirth) {
      setState(() {
        _selectedDateOfBirth = picked;
      });
    }
  }

  Future<void> _selectJoiningDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedJoiningDate,
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );
    if (picked != null && picked != _selectedJoiningDate) {
      setState(() {
        _selectedJoiningDate = picked;
      });
    }
  }

  Future<void> _pickImage() async {
    final XFile? picked = await _picker.pickImage(source: ImageSource.gallery);
    if (picked != null && mounted) {
      setState(() => _profileImage = File(picked.path));
    }
  }

  void _saveTeacher() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_selectedSubjects.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select at least one subject'),
          backgroundColor: AppConstants.errorColor,
        ),
      );
      return;
    }

    if (_selectedClasses.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select at least one class'),
          backgroundColor: AppConstants.errorColor,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    String? profileUrl;
    final isEdit = widget.teacher != null;
    final teacherId = widget.teacher?.id ?? DateTime.now().millisecondsSinceEpoch.toString();

    if (_profileImage != null && isEdit) {
      try {
        final ref = FirebaseStorage.instance.ref().child('teachers/$teacherId/profile.jpg');
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

    final teacher = Teacher(
      id: teacherId,
      fullName: _nameController.text.trim(),
      email: _emailController.text.trim(),
      phoneNumber: _phoneController.text.trim(),
      gender: _selectedGender,
      subjects: _selectedSubjects,
      assignedClasses: _selectedClasses,
      photoUrl: profileUrl ?? widget.teacher?.photoUrl,
      address: _addressController.text.trim(),
      qualification: _qualificationController.text.trim(),
      dateOfBirth: _selectedDateOfBirth,
      joiningDate: _selectedJoiningDate,
      isActive: _isActive,
      createdAt: widget.teacher?.createdAt ?? DateTime.now(),
      updatedAt: DateTime.now(),
    );

    if (isEdit) {
      try {
        await FirebaseFirestore.instance.collection(AppConfig.colTeachers).doc(teacherId).update(teacher.toJson());
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
      Navigator.pop(context, [teacher, _profileImage]);
    } else {
      Navigator.pop(context, teacher);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.teacher == null ? 'Add Teacher' : 'Edit Teacher'),
        backgroundColor: AppConstants.successColor,
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
                        backgroundColor: AppConstants.successColor,
                        backgroundImage: _profileImage != null ? FileImage(_profileImage!) : null,
                        child: _profileImage == null
                            ? const Icon(Icons.school, size: 50, color: Colors.white)
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
              
              // Email
              TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(
                  labelText: 'Email *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.email),
                ),
                keyboardType: TextInputType.emailAddress,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter email';
                  }
                  if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                    return 'Please enter a valid email';
                  }
                  return null;
                },
              ),
              
              const SizedBox(height: 16),
              
              // Phone Number
              TextFormField(
                controller: _phoneController,
                decoration: const InputDecoration(
                  labelText: 'Phone Number *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.phone),
                ),
                keyboardType: TextInputType.phone,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter phone number';
                  }
                  return null;
                },
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
                onTap: _selectDateOfBirth,
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Date of Birth *',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.calendar_today),
                  ),
                  child: Text(
                    '${_selectedDateOfBirth.day}/${_selectedDateOfBirth.month}/${_selectedDateOfBirth.year}',
                    style: const TextStyle(fontSize: 16),
                  ),
                ),
              ),
              
              const SizedBox(height: 16),
              
              // Joining Date
              InkWell(
                onTap: _selectJoiningDate,
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Joining Date *',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.work),
                  ),
                  child: Text(
                    '${_selectedJoiningDate.day}/${_selectedJoiningDate.month}/${_selectedJoiningDate.year}',
                    style: const TextStyle(fontSize: 16),
                  ),
                ),
              ),
              
              const SizedBox(height: 16),
              
              // Qualification
              TextFormField(
                controller: _qualificationController,
                decoration: const InputDecoration(
                  labelText: 'Qualification *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.school),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter qualification';
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
              
              // Subjects
              DropdownButtonFormField<String>(
                value: null,
                decoration: const InputDecoration(
                  labelText: 'Subjects *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.book),
                ),
                hint: Text(_selectedSubjects.isEmpty ? 'Select subjects' : '${_selectedSubjects.length} selected'),
                items: _availableSubjects.map((subject) {
                  return DropdownMenuItem(
                    value: subject,
                    child: Text(subject),
                  );
                }).toList(),
                onChanged: (value) {
                  if (value != null) {
                    setState(() {
                      if (_selectedSubjects.contains(value)) {
                        _selectedSubjects.remove(value);
                      } else {
                        _selectedSubjects.add(value);
                      }
                    });
                  }
                },
              ),
              
              if (_selectedSubjects.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 8.0),
                  child: Wrap(
                    spacing: 8,
                    children: _selectedSubjects.map((subject) {
                      return Chip(
                        label: Text(subject),
                        onDeleted: () {
                          setState(() {
                            _selectedSubjects.remove(subject);
                          });
                        },
                      );
                    }).toList(),
                  ),
                ),
              
              const SizedBox(height: 16),
              
              // Assigned Classes
              DropdownButtonFormField<String>(
                value: null,
                decoration: const InputDecoration(
                  labelText: 'Assigned Classes *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.class_),
                ),
                hint: Text(_selectedClasses.isEmpty ? 'Select classes' : '${_selectedClasses.length} selected'),
                items: _availableClasses.map((className) {
                  return DropdownMenuItem(
                    value: className,
                    child: Text(className),
                  );
                }).toList(),
                onChanged: (value) {
                  if (value != null) {
                    setState(() {
                      if (_selectedClasses.contains(value)) {
                        _selectedClasses.remove(value);
                      } else {
                        _selectedClasses.add(value);
                      }
                    });
                  }
                },
              ),
              
              if (_selectedClasses.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 8.0),
                  child: Wrap(
                    spacing: 8,
                    children: _selectedClasses.map((className) {
                      return Chip(
                        label: Text(className),
                        onDeleted: () {
                          setState(() {
                            _selectedClasses.remove(className);
                          });
                        },
                      );
                    }).toList(),
                  ),
                ),
              
              const SizedBox(height: 16),
              
              // Active Status
              SwitchListTile(
                title: const Text('Active Status'),
                subtitle: const Text('Is this teacher currently active?'),
                value: _isActive,
                onChanged: (value) {
                  setState(() {
                    _isActive = value;
                  });
                },
                secondary: Icon(
                  _isActive ? Icons.check_circle : Icons.cancel,
                  color: _isActive ? AppConstants.successColor : AppConstants.errorColor,
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
                      onPressed: _isLoading ? null : _saveTeacher,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppConstants.successColor,
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
                          : Text(widget.teacher == null ? 'Save' : 'Update'),
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