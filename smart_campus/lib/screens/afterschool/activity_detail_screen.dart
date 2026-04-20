import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';
import '../../models/afterschool_model.dart';
import '../../services/afterschool_service.dart';
import '../../services/auth_service.dart';

class ActivityDetailScreen extends StatefulWidget {
  final AfterSchoolActivity activity;

  const ActivityDetailScreen({super.key, required this.activity});

  @override
  State<ActivityDetailScreen> createState() => _ActivityDetailScreenState();
}

class _ActivityDetailScreenState extends State<ActivityDetailScreen> {
  late AfterSchoolActivity _activity;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _activity = widget.activity;
  }

  Future<void> _registerForActivity() async {
    final currentUser = AuthService.getCurrentUser();
    if (currentUser == null) return;

    if (currentUser.displayName == null) { // Simplified check
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Only parents can register students for activities'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      // In a real app, you would select which child to register
      // For demo purposes, we'll use mock data
      await AfterSchoolService.registerStudent(
        _activity.id,
        'student_1', // Mock student ID
        'Emma Smith', // Mock student name
        currentUser.uid,
        currentUser.displayName ?? 'User',
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Registration submitted successfully! Awaiting approval.'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      print('Error registering for activity: $e');
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
        title: const Text('Activity Details'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Card
            _buildHeaderCard(),
            const SizedBox(height: AppConstants.paddingMedium),
            
            // Details Card
            _buildDetailsCard(),
            const SizedBox(height: AppConstants.paddingMedium),
            
            // Schedule Card
            _buildScheduleCard(),
            const SizedBox(height: AppConstants.paddingMedium),
            
            // Requirements Card
            if (_activity.requirements != null || _activity.materials != null)
              _buildRequirementsCard(),
            
            if (_activity.requirements != null || _activity.materials != null)
              const SizedBox(height: AppConstants.paddingMedium),
            
            // Participants Card
            _buildParticipantsCard(),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomBar(),
    );
  }

  Widget _buildHeaderCard() {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _getTypeColor(_activity.type).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    _getTypeIcon(_activity.type),
                    color: _getTypeColor(_activity.type),
                    size: 32,
                  ),
                ),
                const SizedBox(width: AppConstants.paddingMedium),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _activity.name,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        _activity.typeDisplayName,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: _activity.hasSpace ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    _activity.hasSpace ? '${_activity.availableSpots} spots' : 'Full',
                    style: TextStyle(
                      color: _activity.hasSpace ? Colors.green : Colors.red,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            Text(
              _activity.description,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailsCard() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Activity Details',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            _buildDetailRow(
              Icons.person,
              'Instructor',
              _activity.instructorName,
            ),
            _buildDetailRow(
              Icons.location_on,
              'Location',
              _activity.location,
            ),
            _buildDetailRow(
              Icons.payment,
              'Fee',
              '₹${_activity.fee.toStringAsFixed(0)}',
            ),
            _buildDetailRow(
              Icons.people,
              'Participants',
              '${_activity.currentParticipants}/${_activity.maxParticipants}',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScheduleCard() {
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
            
            _buildDetailRow(
              Icons.access_time,
              'Weekly Schedule',
              _activity.schedule,
            ),
            _buildDetailRow(
              Icons.calendar_today,
              'Start Date',
              '${_activity.startDate.day}/${_activity.startDate.month}/${_activity.startDate.year}',
            ),
            _buildDetailRow(
              Icons.event,
              'End Date',
              '${_activity.endDate.day}/${_activity.endDate.month}/${_activity.endDate.year}',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRequirementsCard() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Requirements & Materials',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            if (_activity.requirements != null)
              _buildDetailRow(
                Icons.checklist,
                'Requirements',
                _activity.requirements!,
                isMultiline: true,
              ),
            
            if (_activity.requirements != null && _activity.materials != null)
              const SizedBox(height: AppConstants.paddingMedium),
            
            if (_activity.materials != null)
              _buildDetailRow(
                Icons.inventory,
                'Materials',
                _activity.materials!,
                isMultiline: true,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildParticipantsCard() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Participants',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            if (_activity.participantNames.isEmpty)
              Text(
                'No participants yet',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[600],
                  fontStyle: FontStyle.italic,
                ),
              )
            else
              Column(
                children: _activity.participantNames.map((name) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: AppConstants.paddingSmall),
                    child: Row(
                      children: [
                        Icon(Icons.person, size: 16, color: Colors.grey[600]),
                        const SizedBox(width: AppConstants.paddingSmall),
                        Text(
                          name,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomBar() {
    final currentUser = AuthService.getCurrentUser();
    final canRegister = currentUser != null && _activity.hasSpace;

    if (!canRegister) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(AppConstants.paddingMedium),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.3),
            spreadRadius: 1,
            blurRadius: 5,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: SafeArea(
        child: SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _registerForActivity,
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
                      Text('Registering...'),
                    ],
                  )
                : Text('Register for Activity (₹${_activity.fee.toStringAsFixed(0)})'),
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value, {bool isMultiline = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppConstants.paddingMedium),
      child: Row(
        crossAxisAlignment: isMultiline ? CrossAxisAlignment.start : CrossAxisAlignment.center,
        children: [
          Icon(icon, color: Colors.grey[600], size: 20),
          const SizedBox(width: AppConstants.paddingSmall),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _getTypeColor(ActivityType type) {
    switch (type) {
      case ActivityType.sports:
        return Colors.orange;
      case ActivityType.arts:
        return Colors.purple;
      case ActivityType.academics:
        return Colors.blue;
      case ActivityType.music:
        return Colors.pink;
      case ActivityType.dance:
        return Colors.red;
      case ActivityType.drama:
        return Colors.indigo;
      case ActivityType.science:
        return Colors.green;
      case ActivityType.technology:
        return Colors.teal;
      case ActivityType.other:
        return Colors.grey;
    }
  }

  IconData _getTypeIcon(ActivityType type) {
    switch (type) {
      case ActivityType.sports:
        return Icons.sports_soccer;
      case ActivityType.arts:
        return Icons.palette;
      case ActivityType.academics:
        return Icons.school;
      case ActivityType.music:
        return Icons.music_note;
      case ActivityType.dance:
        return Icons.music_note;
      case ActivityType.drama:
        return Icons.theater_comedy;
      case ActivityType.science:
        return Icons.science;
      case ActivityType.technology:
        return Icons.computer;
      case ActivityType.other:
        return Icons.miscellaneous_services;
    }
  }
}
