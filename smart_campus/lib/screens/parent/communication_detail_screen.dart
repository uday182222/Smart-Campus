import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';
import '../../models/parent_communication_model.dart';
import '../../services/parent_communication_service.dart';

class CommunicationDetailScreen extends StatefulWidget {
  final ParentCommunication communication;

  const CommunicationDetailScreen({
    super.key,
    required this.communication,
  });

  @override
  State<CommunicationDetailScreen> createState() => _CommunicationDetailScreenState();
}

class _CommunicationDetailScreenState extends State<CommunicationDetailScreen> {
  late ParentCommunication _communication;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _communication = widget.communication;
    _markAsRead();
  }

  Future<void> _markAsRead() async {
    try {
      await ParentCommunicationService.markAsRead(_communication.id, 'parent');
    } catch (e) {
      print('Error marking communication as read: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_communication.typeDisplayName),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
        actions: [
          if (_communication.isPending)
            PopupMenuButton<String>(
              onSelected: _handleMenuAction,
              itemBuilder: (context) => [
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
                  value: 'cancel',
                  child: Row(
                    children: [
                      Icon(Icons.cancel),
                      SizedBox(width: 8),
                      Text('Cancel'),
                    ],
                  ),
                ),
              ],
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status and Priority Cards
            _buildStatusCards(),
            const SizedBox(height: AppConstants.paddingLarge),
            
            // Basic Information
            _buildBasicInfoCard(),
            const SizedBox(height: AppConstants.paddingLarge),
            
            // Message Card
            _buildMessageCard(),
            const SizedBox(height: AppConstants.paddingLarge),
            
            // Date Information
            _buildDateInfoCard(),
            const SizedBox(height: AppConstants.paddingLarge),
            
            // Responses (if any)
            if (_communication.teacherResponse != null || _communication.adminResponse != null)
              _buildResponsesCard(),
          ],
        ),
      ),
    );
  }

  void _handleMenuAction(String action) {
    switch (action) {
      case 'edit':
        // TODO: Implement edit functionality
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Edit functionality coming soon')),
        );
        break;
      case 'cancel':
        _showCancelDialog();
        break;
    }
  }

  void _showCancelDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Communication'),
        content: const Text('Are you sure you want to cancel this communication? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('No'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _cancelCommunication();
            },
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );
  }

  Future<void> _cancelCommunication() async {
    setState(() => _isLoading = true);
    
    try {
      await ParentCommunicationService.updateTeacherApproval(
        _communication.id,
        CommunicationStatus.cancelled,
        'Cancelled by parent',
      );
      
      setState(() {
        _communication = _communication.copyWith(
          status: CommunicationStatus.cancelled,
          teacherResponse: 'Cancelled by parent',
          updatedAt: DateTime.now(),
        );
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Communication cancelled successfully'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      print('Error cancelling communication: $e');
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

  Widget _buildStatusCards() {
    return Row(
      children: [
        Expanded(
          child: Card(
            color: _getStatusColor(_communication.status).withOpacity(0.1),
            child: Padding(
              padding: const EdgeInsets.all(AppConstants.paddingMedium),
              child: Column(
                children: [
                  Icon(
                    _getStatusIcon(_communication.status),
                    color: _getStatusColor(_communication.status),
                    size: 32,
                  ),
                  const SizedBox(height: AppConstants.paddingSmall),
                  Text(
                    'Status',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey[600],
                    ),
                  ),
                  Text(
                    _communication.statusDisplayName,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: _getStatusColor(_communication.status),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(width: AppConstants.paddingMedium),
        Expanded(
          child: Card(
            color: _getPriorityColor(_communication.priority).withOpacity(0.1),
            child: Padding(
              padding: const EdgeInsets.all(AppConstants.paddingMedium),
              child: Column(
                children: [
                  Icon(
                    _getPriorityIcon(_communication.priority),
                    color: _getPriorityColor(_communication.priority),
                    size: 32,
                  ),
                  const SizedBox(height: AppConstants.paddingSmall),
                  Text(
                    'Priority',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey[600],
                    ),
                  ),
                  Text(
                    _communication.priorityDisplayName,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: _getPriorityColor(_communication.priority),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBasicInfoCard() {
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
            
            _buildInfoRow('Subject', _communication.subject),
            _buildInfoRow('Student', _communication.studentName),
            _buildInfoRow('Class', _communication.className),
            _buildInfoRow('Type', _communication.typeDisplayName),
            if (_communication.reason != null && _communication.reason!.isNotEmpty)
              _buildInfoRow('Reason', _communication.reason!),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageCard() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Message',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            Text(
              _communication.message,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            if (_communication.additionalNotes != null && _communication.additionalNotes!.isNotEmpty) ...[
              const SizedBox(height: AppConstants.paddingMedium),
              Text(
                'Additional Notes',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppConstants.paddingSmall),
              Text(
                _communication.additionalNotes!,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[700],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDateInfoCard() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Date Information',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            _buildInfoRow('Created', _formatDateTime(_communication.createdAt)),
            _buildInfoRow('Last Updated', _formatDateTime(_communication.updatedAt)),
            
            if (_communication.startDate != null)
              _buildInfoRow('Start Date', _formatDate(_communication.startDate!)),
            
            if (_communication.endDate != null)
              _buildInfoRow('End Date', _formatDate(_communication.endDate!)),
            
            if (_communication.startDate != null && _communication.endDate != null) ...[
              const SizedBox(height: AppConstants.paddingSmall),
              Container(
                padding: const EdgeInsets.all(AppConstants.paddingSmall),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info, size: 16, color: Colors.blue),
                    const SizedBox(width: AppConstants.paddingSmall),
                    Text(
                      'Duration: ${_communication.endDate!.difference(_communication.startDate!).inDays + 1} days',
                      style: const TextStyle(color: Colors.blue, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildResponsesCard() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Responses',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            if (_communication.teacherResponse != null) ...[
              _buildResponseItem(
                'Teacher Response',
                _communication.teacherResponse!,
                _communication.teacherName ?? 'Class Teacher',
                _communication.teacherApprovalDate,
                Colors.blue,
              ),
              const SizedBox(height: AppConstants.paddingMedium),
            ],
            
            if (_communication.adminResponse != null)
              _buildResponseItem(
                'Admin Response',
                _communication.adminResponse!,
                _communication.adminName ?? 'School Administrator',
                _communication.adminApprovalDate,
                Colors.green,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildResponseItem(
    String title,
    String response,
    String responderName,
    DateTime? responseDate,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(AppConstants.paddingMedium),
      decoration: BoxDecoration(
        border: Border.all(color: color.withOpacity(0.3)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Icon(
                  Icons.person,
                  color: color,
                  size: 16,
                ),
              ),
              const SizedBox(width: AppConstants.paddingSmall),
              Text(
                title,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppConstants.paddingSmall),
          Text(
            responderName,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.grey[600],
            ),
          ),
          if (responseDate != null) ...[
            const SizedBox(height: 4),
            Text(
              _formatDateTime(responseDate),
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey[500],
              ),
            ),
          ],
          const SizedBox(height: AppConstants.paddingSmall),
          Text(
            response,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppConstants.paddingSmall),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              '$label:',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w500,
                color: Colors.grey[700],
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(CommunicationStatus status) {
    switch (status) {
      case CommunicationStatus.pending:
        return Colors.orange;
      case CommunicationStatus.approved:
        return Colors.green;
      case CommunicationStatus.rejected:
        return Colors.red;
      case CommunicationStatus.cancelled:
        return Colors.grey;
    }
  }

  Color _getPriorityColor(CommunicationPriority priority) {
    switch (priority) {
      case CommunicationPriority.low:
        return Colors.green;
      case CommunicationPriority.medium:
        return Colors.orange;
      case CommunicationPriority.high:
        return Colors.red;
      case CommunicationPriority.urgent:
        return Colors.purple;
    }
  }

  IconData _getStatusIcon(CommunicationStatus status) {
    switch (status) {
      case CommunicationStatus.pending:
        return Icons.pending;
      case CommunicationStatus.approved:
        return Icons.check_circle;
      case CommunicationStatus.rejected:
        return Icons.cancel;
      case CommunicationStatus.cancelled:
        return Icons.block;
    }
  }

  IconData _getPriorityIcon(CommunicationPriority priority) {
    switch (priority) {
      case CommunicationPriority.low:
        return Icons.flag;
      case CommunicationPriority.medium:
        return Icons.flag;
      case CommunicationPriority.high:
        return Icons.flag;
      case CommunicationPriority.urgent:
        return Icons.priority_high;
    }
  }

  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.day}/${dateTime.month}/${dateTime.year} ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
