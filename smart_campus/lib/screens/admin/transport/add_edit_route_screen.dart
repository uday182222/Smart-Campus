import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../../../models/transport_route_model.dart';
import '../../../services/transport_service.dart';
import '../../../services/auth_service.dart';

class AddEditRouteScreen extends StatefulWidget {
  final TransportRoute? route;

  const AddEditRouteScreen({super.key, this.route});

  @override
  State<AddEditRouteScreen> createState() => _AddEditRouteScreenState();
}

class _AddEditRouteScreenState extends State<AddEditRouteScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _busNumberController = TextEditingController();
  final _driverNameController = TextEditingController();
  final _driverPhoneController = TextEditingController();
  final _helperNameController = TextEditingController();
  final _helperPhoneController = TextEditingController();

  TimeOfDay? _startTime;
  TimeOfDay? _endTime;
  RouteStatus _selectedStatus = RouteStatus.active;
  List<RouteStop> _stops = [];
  bool _isLoading = false;
  bool _isEditMode = false;

  @override
  void initState() {
    super.initState();
    _isEditMode = widget.route != null;
    if (_isEditMode) {
      _initializeWithRoute();
    } else {
      _startTime = const TimeOfDay(hour: 7, minute: 0);
      _endTime = const TimeOfDay(hour: 9, minute: 0);
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _busNumberController.dispose();
    _driverNameController.dispose();
    _driverPhoneController.dispose();
    _helperNameController.dispose();
    _helperPhoneController.dispose();
    super.dispose();
  }

  void _initializeWithRoute() {
    final route = widget.route!;
    _nameController.text = route.name;
    _descriptionController.text = route.description;
    _busNumberController.text = route.busNumber;
    _driverNameController.text = route.driverName;
    _driverPhoneController.text = route.driverPhone;
    _helperNameController.text = route.helperName;
    _helperPhoneController.text = route.helperPhone;
    _startTime = TimeOfDay.fromDateTime(route.startTime);
    _endTime = TimeOfDay.fromDateTime(route.endTime);
    _selectedStatus = route.status;
    _stops = List.from(route.stops);
  }

  Future<void> _selectStartTime() async {
    final time = await showTimePicker(
      context: context,
      initialTime: _startTime ?? const TimeOfDay(hour: 7, minute: 0),
    );
    if (time != null) {
      setState(() {
        _startTime = time;
      });
    }
  }

  Future<void> _selectEndTime() async {
    final time = await showTimePicker(
      context: context,
      initialTime: _endTime ?? const TimeOfDay(hour: 9, minute: 0),
    );
    if (time != null) {
      setState(() {
        _endTime = time;
      });
    }
  }

  void _addStop() {
    showDialog(
      context: context,
      builder: (context) => _AddStopDialog(
        onStopAdded: (stop) {
          setState(() {
            _stops.add(stop);
          });
        },
      ),
    );
  }

  void _editStop(int index) {
    showDialog(
      context: context,
      builder: (context) => _AddStopDialog(
        stop: _stops[index],
        onStopAdded: (stop) {
          setState(() {
            _stops[index] = stop;
          });
        },
      ),
    );
  }

  void _removeStop(int index) {
    setState(() {
      _stops.removeAt(index);
    });
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    if (_stops.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add at least one stop')),
      );
      return;
    }
    if (_startTime == null || _endTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select start and end times')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final now = DateTime.now();
      final startDateTime = DateTime(
        now.year,
        now.month,
        now.day,
        _startTime!.hour,
        _startTime!.minute,
      );
      final endDateTime = DateTime(
        now.year,
        now.month,
        now.day,
        _endTime!.hour,
        _endTime!.minute,
      );

      final route = TransportRoute(
        id: _isEditMode ? widget.route!.id : '',
        name: _nameController.text.trim(),
        description: _descriptionController.text.trim(),
        schoolId: 'school_1',
        busNumber: _busNumberController.text.trim(),
        driverName: _driverNameController.text.trim(),
        driverPhone: _driverPhoneController.text.trim(),
        helperName: _helperNameController.text.trim(),
        helperPhone: _helperPhoneController.text.trim(),
        stops: _stops,
        startTime: startDateTime,
        endTime: endDateTime,
        status: _selectedStatus,
        createdAt: _isEditMode ? widget.route!.createdAt : DateTime.now(),
        updatedAt: DateTime.now(),
      );

      if (_isEditMode) {
        await TransportService.updateRoute(route);
      } else {
        await TransportService.createRoute(route);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_isEditMode ? 'Route updated successfully' : 'Route created successfully'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      print('Error saving route: $e');
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
        title: Text(_isEditMode ? 'Edit Route' : 'Create Route'),
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
              
              // Driver & Helper Information
              _buildDriverInfoSection(),
              const SizedBox(height: AppConstants.paddingLarge),
              
              // Schedule Information
              _buildScheduleSection(),
              const SizedBox(height: AppConstants.paddingLarge),
              
              // Stops Management
              _buildStopsSection(),
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
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: 'Route Name',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.route),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter route name';
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
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            TextFormField(
              controller: _busNumberController,
              decoration: const InputDecoration(
                labelText: 'Bus Number',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.directions_bus),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter bus number';
                }
                return null;
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDriverInfoSection() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Driver & Helper Information',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            TextFormField(
              controller: _driverNameController,
              decoration: const InputDecoration(
                labelText: 'Driver Name',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.person),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter driver name';
                }
                return null;
              },
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            TextFormField(
              controller: _driverPhoneController,
              decoration: const InputDecoration(
                labelText: 'Driver Phone',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.phone),
              ),
              keyboardType: TextInputType.phone,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter driver phone';
                }
                return null;
              },
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            TextFormField(
              controller: _helperNameController,
              decoration: const InputDecoration(
                labelText: 'Helper Name',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.person_outline),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter helper name';
                }
                return null;
              },
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            TextFormField(
              controller: _helperPhoneController,
              decoration: const InputDecoration(
                labelText: 'Helper Phone',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.phone),
              ),
              keyboardType: TextInputType.phone,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter helper phone';
                }
                return null;
              },
            ),
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
              'Schedule Information',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: _selectStartTime,
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
                          Text(
                            _startTime != null
                                ? _startTime!.format(context)
                                : 'Select Start Time',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: AppConstants.paddingMedium),
                Expanded(
                  child: InkWell(
                    onTap: _selectEndTime,
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
                          Text(
                            _endTime != null
                                ? _endTime!.format(context)
                                : 'Select End Time',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            DropdownButtonFormField<RouteStatus>(
              value: _selectedStatus,
              decoration: const InputDecoration(
                labelText: 'Route Status',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.flag),
              ),
              items: RouteStatus.values.map((status) {
                return DropdownMenuItem(
                  value: status,
                  child: Text(status.name.toUpperCase()),
                );
              }).toList(),
              onChanged: (RouteStatus? status) {
                setState(() {
                  _selectedStatus = status!;
                });
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStopsSection() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Route Stops',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: _addStop,
                  icon: const Icon(Icons.add),
                  label: const Text('Add Stop'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppConstants.primaryColor,
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            if (_stops.isEmpty)
              Container(
                padding: const EdgeInsets.all(AppConstants.paddingLarge),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey[300]!),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  children: [
                    Icon(
                      Icons.location_off,
                      size: 48,
                      color: Colors.grey[400],
                    ),
                    const SizedBox(height: AppConstants.paddingSmall),
                    Text(
                      'No stops added yet',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: AppConstants.paddingSmall),
                    Text(
                      'Add stops to create the route path',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey[500],
                      ),
                    ),
                  ],
                ),
              )
            else
              ...List.generate(_stops.length, (index) {
                final stop = _stops[index];
                return Container(
                  margin: const EdgeInsets.only(bottom: AppConstants.paddingSmall),
                  padding: const EdgeInsets.all(AppConstants.paddingMedium),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey[300]!),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: AppConstants.primaryColor,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            '${index + 1}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: AppConstants.paddingMedium),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              stop.name,
                              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              stop.address,
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Colors.grey[600],
                              ),
                            ),
                            Text(
                              'ETA: ${stop.estimatedTime.hour.toString().padLeft(2, '0')}:${stop.estimatedTime.minute.toString().padLeft(2, '0')}',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Colors.grey[500],
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.edit, size: 20),
                        onPressed: () => _editStop(index),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete, size: 20),
                        onPressed: () => _removeStop(index),
                      ),
                    ],
                  ),
                );
              }),
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
                  Text('Saving...'),
                ],
              )
            : Text(_isEditMode ? 'Update Route' : 'Create Route'),
      ),
    );
  }
}

class _AddStopDialog extends StatefulWidget {
  final RouteStop? stop;
  final Function(RouteStop) onStopAdded;

  const _AddStopDialog({this.stop, required this.onStopAdded});

  @override
  State<_AddStopDialog> createState() => _AddStopDialogState();
}

class _AddStopDialogState extends State<_AddStopDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _addressController = TextEditingController();
  final _latitudeController = TextEditingController();
  final _longitudeController = TextEditingController();
  final _notesController = TextEditingController();

  TimeOfDay? _estimatedTime;
  bool _isEditMode = false;

  @override
  void initState() {
    super.initState();
    _isEditMode = widget.stop != null;
    if (_isEditMode) {
      final stop = widget.stop!;
      _nameController.text = stop.name;
      _addressController.text = stop.address;
      _latitudeController.text = stop.latitude.toString();
      _longitudeController.text = stop.longitude.toString();
      _notesController.text = stop.notes ?? '';
      _estimatedTime = TimeOfDay.fromDateTime(stop.estimatedTime);
    } else {
      _estimatedTime = const TimeOfDay(hour: 8, minute: 0);
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _addressController.dispose();
    _latitudeController.dispose();
    _longitudeController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _selectTime() async {
    final time = await showTimePicker(
      context: context,
      initialTime: _estimatedTime ?? const TimeOfDay(hour: 8, minute: 0),
    );
    if (time != null) {
      setState(() {
        _estimatedTime = time;
      });
    }
  }

  void _saveStop() {
    if (!_formKey.currentState!.validate()) return;
    if (_estimatedTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select estimated time')),
      );
      return;
    }

    final now = DateTime.now();
    final estimatedDateTime = DateTime(
      now.year,
      now.month,
      now.day,
      _estimatedTime!.hour,
      _estimatedTime!.minute,
    );

    final stop = RouteStop(
      id: _isEditMode ? widget.stop!.id : 'stop_${DateTime.now().millisecondsSinceEpoch}',
      name: _nameController.text.trim(),
      address: _addressController.text.trim(),
      latitude: double.tryParse(_latitudeController.text) ?? 0.0,
      longitude: double.tryParse(_longitudeController.text) ?? 0.0,
      estimatedTime: estimatedDateTime,
      status: StopStatus.pending,
      notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
    );

    widget.onStopAdded(stop);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(_isEditMode ? 'Edit Stop' : 'Add Stop'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Stop Name',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.location_on),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter stop name';
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppConstants.paddingMedium),
              
              TextFormField(
                controller: _addressController,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'Address',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.location_city),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter address';
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppConstants.paddingMedium),
              
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _latitudeController,
                      decoration: const InputDecoration(
                        labelText: 'Latitude',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.map),
                      ),
                      keyboardType: TextInputType.number,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Required';
                        }
                        if (double.tryParse(value) == null) {
                          return 'Invalid';
                        }
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: AppConstants.paddingSmall),
                  Expanded(
                    child: TextFormField(
                      controller: _longitudeController,
                      decoration: const InputDecoration(
                        labelText: 'Longitude',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.map),
                      ),
                      keyboardType: TextInputType.number,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Required';
                        }
                        if (double.tryParse(value) == null) {
                          return 'Invalid';
                        }
                        return null;
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppConstants.paddingMedium),
              
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
                      Text(
                        _estimatedTime != null
                            ? 'ETA: ${_estimatedTime!.format(context)}'
                            : 'Select Estimated Time',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: AppConstants.paddingMedium),
              
              TextFormField(
                controller: _notesController,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'Notes (Optional)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.note),
                ),
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _saveStop,
          child: Text(_isEditMode ? 'Update' : 'Add'),
        ),
      ],
    );
  }
}
