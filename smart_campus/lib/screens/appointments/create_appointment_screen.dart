import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';
import '../../models/appointment_model.dart';
import '../../services/appointment_service.dart';
import '../../services/auth_service.dart';

class CreateAppointmentScreen extends StatefulWidget {
  const CreateAppointmentScreen({super.key});

  @override
  State<CreateAppointmentScreen> createState() => _CreateAppointmentScreenState();
}

class _CreateAppointmentScreenState extends State<CreateAppointmentScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _locationController = TextEditingController();
  final _notesController = TextEditingController();

  AppointmentType _selectedType = AppointmentType.parentTeacher;
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 1));
  TimeOfDay _selectedTime = const TimeOfDay(hour: 14, minute: 30);
  int _selectedDuration = 30;
  bool _isLoading = false;

  final List<int> _durationOptions = [15, 30, 45, 60, 90, 120];

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _locationController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date != null) {
      setState(() {
        _selectedDate = date;
      });
    }
  }

  Future<void> _selectTime() async {
    final time = await showTimePicker(
      context: context,
      initialTime: _selectedTime,
    );
    if (time != null) {
      setState(() {
        _selectedTime = time;
      });
    }
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      // In a real app, you would select who to meet with
      // For demo purposes, we'll use mock data
      final appointment = Appointment(
        id: '',
        schoolId: 'SCH-2025-A12', // Default school ID
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim(),
        type: _selectedType,
        requesterId: currentUser.uid,
        requesterName: currentUser.displayName ?? 'User',
        requesterRole: 'parent', // Default role
        requestedWithId: 'teacher_1', // Mock - in real app, user would select
        requestedWithName: 'Mrs. Johnson', // Mock - in real app, user would select
        requestedWithRole: 'teacher', // Mock - in real app, user would select
        studentId: 'student_1', // Mock - in real app, user would select their child
        studentName: 'Emma Smith', // Mock - in real app, user would select their child
        scheduledDate: _selectedDate,
        scheduledTime: _selectedTime,
        durationMinutes: _selectedDuration,
        status: AppointmentStatus.pending,
        location: _locationController.text.trim().isEmpty ? null : _locationController.text.trim(),
        notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await AppointmentService.createAppointment(appointment);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Appointment scheduled successfully'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      print('Error creating appointment: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Schedule Appointment'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Basic Information
              _buildBasicInfoSection(),
              const SizedBox(height: AppConstants.paddingLarge),
              
              // Appointment Type
              _buildTypeSection(),
              const SizedBox(height: AppConstants.paddingLarge),
              
              // Schedule
              _buildScheduleSection(),
              const SizedBox(height: AppConstants.paddingLarge),
              
              // Additional Information
              _buildAdditionalInfoSection(),
              const SizedBox(height: AppConstants.paddingLarge),
              
              // Submit Button
              _buildSubmitButton(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBasicInfoSection() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Basic Information',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Appointment Title',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.title),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter appointment title';
                }
                return null;
              },
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            TextFormField(
              controller: _descriptionController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Description',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.description),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter appointment description';
                }
                return null;
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTypeSection() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Appointment Type',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            ...AppointmentType.values.map((type) {
              return RadioListTile<AppointmentType>(
                title: Text(_getTypeDisplayName(type)),
                subtitle: Text(_getTypeDescription(type)),
                value: type,
                groupValue: _selectedType,
                onChanged: (AppointmentType? value) {
                  setState(() {
                    _selectedType = value!;
                  });
                },
              );
            }).toList(),
          ],
        ),
      ),
    );
  }

  Widget _buildScheduleSection() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Schedule',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            // Date Selection
            InkWell(
              onTap: _selectDate,
              child: Container(
                padding: const EdgeInsets.all(AppConstants.paddingMedium),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey[400]!),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.calendar_today),
                    const SizedBox(width: AppConstants.paddingSmall),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Date',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.grey[600],
                            ),
                          ),
                          Text(
                            '${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.arrow_drop_down),
                  ],
                ),
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            // Time Selection
            InkWell(
              onTap: _selectTime,
              child: Container(
                padding: const EdgeInsets.all(AppConstants.paddingMedium),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey[400]!),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.access_time),
                    const SizedBox(width: AppConstants.paddingSmall),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Time',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.grey[600],
                            ),
                          ),
                          Text(
                            _selectedTime.format(context),
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.arrow_drop_down),
                  ],
                ),
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            // Duration Selection
            DropdownButtonFormField<int>(
              value: _selectedDuration,
              decoration: const InputDecoration(
                labelText: 'Duration',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.timer),
              ),
              items: _durationOptions.map((duration) {
                return DropdownMenuItem(
                  value: duration,
                  child: Text('$duration minutes'),
                );
              }).toList(),
              onChanged: (int? value) {
                setState(() {
                  _selectedDuration = value!;
                });
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAdditionalInfoSection() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Additional Information',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            TextFormField(
              controller: _locationController,
              decoration: const InputDecoration(
                labelText: 'Location (Optional)',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.location_on),
                hintText: 'e.g., Room 101, Office',
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            TextFormField(
              controller: _notesController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Notes (Optional)',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.note),
                hintText: 'Any additional information...',
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _submitForm,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppConstants.primaryColor,
          foregroundColor: AppConstants.textWhite,
          padding: const EdgeInsets.symmetric(vertical: AppConstants.paddingMedium),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        child: _isLoading
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
                  SizedBox(width: AppConstants.paddingSmall),
                  Text('Scheduling...'),
                ],
              )
            : const Text('Schedule Appointment'),
      ),
    );
  }

  String _getTypeDisplayName(AppointmentType type) {
    switch (type) {
      case AppointmentType.parentTeacher:
        return 'Parent-Teacher Meeting';
      case AppointmentType.teacherAdmin:
        return 'Teacher-Admin Meeting';
      case AppointmentType.studentCounselor:
        return 'Student-Counselor Meeting';
      case AppointmentType.general:
        return 'General Appointment';
    }
  }

  String _getTypeDescription(AppointmentType type) {
    switch (type) {
      case AppointmentType.parentTeacher:
        return 'Discuss student progress and academic performance';
      case AppointmentType.teacherAdmin:
        return 'Administrative discussions and school policies';
      case AppointmentType.studentCounselor:
        return 'Academic guidance and career counseling';
      case AppointmentType.general:
        return 'General meeting or discussion';
    }
  }
}
