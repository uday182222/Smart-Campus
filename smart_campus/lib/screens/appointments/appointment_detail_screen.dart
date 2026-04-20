import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';
import '../../models/appointment_model.dart';
import '../../services/appointment_service.dart';
class AppointmentDetailScreen extends StatefulWidget {
  final Appointment appointment;

  const AppointmentDetailScreen({super.key, required this.appointment});

  @override
  State<AppointmentDetailScreen> createState() => _AppointmentDetailScreenState();
}

class _AppointmentDetailScreenState extends State<AppointmentDetailScreen> {
  late Appointment _appointment;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _appointment = widget.appointment;
  }

  Future<void> _updateStatus(AppointmentStatus status, {String? reason}) async {
    setState(() => _isLoading = true);

    try {
      await AppointmentService.updateAppointmentStatus(
        _appointment.id,
        status,
        cancellationReason: reason,
      );

      setState(() {
        _appointment = _appointment.copyWith(
          status: status,
          cancellationReason: reason,
          updatedAt: DateTime.now(),
          completedAt: status == AppointmentStatus.completed ? DateTime.now() : _appointment.completedAt,
        );
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Appointment status updated successfully'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      print('Error updating appointment status: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error updating status: $e'),
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

  Future<void> _showCancelDialog() async {
    final reasonController = TextEditingController();
    
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Appointment'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Are you sure you want to cancel this appointment?'),
            const SizedBox(height: AppConstants.paddingMedium),
            TextFormField(
              controller: reasonController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Reason for cancellation (Optional)',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Keep Appointment'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Cancel Appointment'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await _updateStatus(AppointmentStatus.cancelled, reason: reasonController.text.trim());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Appointment Details'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
        actions: [
          if (!_appointment.isCompleted && !_appointment.isCancelled)
            PopupMenuButton<String>(
              onSelected: (value) async {
                switch (value) {
                  case 'confirm':
                    await _updateStatus(AppointmentStatus.confirmed);
                    break;
                  case 'complete':
                    await _updateStatus(AppointmentStatus.completed);
                    break;
                  case 'cancel':
                    await _showCancelDialog();
                    break;
                }
              },
              itemBuilder: (context) => [
                if (_appointment.isPending)
                  const PopupMenuItem(
                    value: 'confirm',
                    child: Row(
                      children: [
                        Icon(Icons.check, color: Colors.green),
                        SizedBox(width: 8),
                        Text('Confirm'),
                      ],
                    ),
                  ),
                if (_appointment.isConfirmed)
                  const PopupMenuItem(
                    value: 'complete',
                    child: Row(
                      children: [
                        Icon(Icons.done_all, color: Colors.blue),
                        SizedBox(width: 8),
                        Text('Mark Complete'),
                      ],
                    ),
                  ),
                const PopupMenuItem(
                  value: 'cancel',
                  child: Row(
                    children: [
                      Icon(Icons.cancel, color: Colors.red),
                      SizedBox(width: 8),
                      Text('Cancel'),
                    ],
                  ),
                ),
              ],
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Icon(Icons.more_vert),
            ),
        ],
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
            
            // Participants Card
            _buildParticipantsCard(),
            
            if (_appointment.notes != null || _appointment.cancellationReason != null) ...[
              const SizedBox(height: AppConstants.paddingMedium),
              _buildNotesCard(),
            ],
          ],
        ),
      ),
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
                    color: _getTypeColor(_appointment.type).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    _getTypeIcon(_appointment.type),
                    color: _getTypeColor(_appointment.type),
                    size: 32,
                  ),
                ),
                const SizedBox(width: AppConstants.paddingMedium),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _appointment.title,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        _appointment.typeDisplayName,
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
                    color: _getStatusColor(_appointment.status).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    _appointment.statusDisplayName,
                    style: TextStyle(
                      color: _getStatusColor(_appointment.status),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            Text(
              _appointment.description,
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
              'Schedule Details',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            _buildDetailRow(
              Icons.calendar_today,
              'Date',
              '${_appointment.scheduledDate.day}/${_appointment.scheduledDate.month}/${_appointment.scheduledDate.year}',
            ),
            _buildDetailRow(
              Icons.access_time,
              'Time',
              '${_appointment.scheduledTime.toTimeString()} - ${_appointment.endDateTime.hour.toString().padLeft(2, '0')}:${_appointment.endDateTime.minute.toString().padLeft(2, '0')}',
            ),
            _buildDetailRow(
              Icons.timer,
              'Duration',
              '${_appointment.durationMinutes} minutes',
            ),
            if (_appointment.location != null)
              _buildDetailRow(
                Icons.location_on,
                'Location',
                _appointment.location!,
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
            
            _buildParticipantRow(
              'Requested by',
              _appointment.requesterName,
              _appointment.requesterRole,
              Icons.person,
            ),
            _buildParticipantRow(
              'Meeting with',
              _appointment.requestedWithName,
              _appointment.requestedWithRole,
              Icons.people,
            ),
            if (_appointment.studentName != null)
              _buildParticipantRow(
                'Student',
                _appointment.studentName!,
                'student',
                Icons.school,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotesCard() {
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
            
            if (_appointment.notes != null) ...[
              _buildDetailRow(
                Icons.note,
                'Notes',
                _appointment.notes!,
                isMultiline: true,
              ),
              if (_appointment.cancellationReason != null)
                const SizedBox(height: AppConstants.paddingMedium),
            ],
            
            if (_appointment.cancellationReason != null)
              _buildDetailRow(
                Icons.cancel,
                'Cancellation Reason',
                _appointment.cancellationReason!,
                isMultiline: true,
                textColor: Colors.red,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value, {bool isMultiline = false, Color? textColor}) {
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
                    color: textColor,
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

  Widget _buildParticipantRow(String label, String name, String role, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppConstants.paddingMedium),
      child: Row(
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
                  name,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  role.toUpperCase(),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[500],
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _getTypeColor(AppointmentType type) {
    switch (type) {
      case AppointmentType.parentTeacher:
        return Colors.blue;
      case AppointmentType.teacherAdmin:
        return Colors.green;
      case AppointmentType.studentCounselor:
        return Colors.purple;
      case AppointmentType.general:
        return Colors.grey;
    }
  }

  IconData _getTypeIcon(AppointmentType type) {
    switch (type) {
      case AppointmentType.parentTeacher:
        return Icons.people;
      case AppointmentType.teacherAdmin:
        return Icons.admin_panel_settings;
      case AppointmentType.studentCounselor:
        return Icons.psychology;
      case AppointmentType.general:
        return Icons.event;
    }
  }

  Color _getStatusColor(AppointmentStatus status) {
    switch (status) {
      case AppointmentStatus.pending:
        return Colors.orange;
      case AppointmentStatus.confirmed:
        return Colors.green;
      case AppointmentStatus.cancelled:
        return Colors.red;
      case AppointmentStatus.completed:
        return Colors.blue;
      case AppointmentStatus.rescheduled:
        return Colors.purple;
    }
  }
}
