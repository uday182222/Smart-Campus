import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';
import '../../models/parent_communication_model.dart';
import '../../services/parent_communication_service.dart';
import '../../services/auth_service.dart';
import 'communication_detail_screen.dart';

class CommunicationHistoryScreen extends StatefulWidget {
  const CommunicationHistoryScreen({super.key});

  @override
  State<CommunicationHistoryScreen> createState() => _CommunicationHistoryScreenState();
}

class _CommunicationHistoryScreenState extends State<CommunicationHistoryScreen> {
  List<ParentCommunication> _communications = [];
  bool _isLoading = true;
  String _selectedFilter = 'all';

  final List<Map<String, String>> _filters = [
    {'value': 'all', 'label': 'All'},
    {'value': 'absenceNotification', 'label': 'Absence Notifications'},
    {'value': 'holidayRequest', 'label': 'Holiday Requests'},
    {'value': 'pending', 'label': 'Pending'},
    {'value': 'approved', 'label': 'Approved'},
    {'value': 'rejected', 'label': 'Rejected'},
  ];

  @override
  void initState() {
    super.initState();
    _loadCommunications();
  }

  Future<void> _loadCommunications() async {
    setState(() => _isLoading = true);
    
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser != null) {
        final communications = await ParentCommunicationService.getCommunicationsByParent(currentUser?.uid ?? '');
        setState(() {
          _communications = communications;
        });
      }
    } catch (e) {
      print('Error loading communications: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading communications: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  List<ParentCommunication> get _filteredCommunications {
    if (_selectedFilter == 'all') return _communications;
    
    return _communications.where((comm) {
      switch (_selectedFilter) {
        case 'absenceNotification':
          return comm.type == CommunicationType.absenceNotification;
        case 'holidayRequest':
          return comm.type == CommunicationType.holidayRequest;
        case 'pending':
          return comm.status == CommunicationStatus.pending;
        case 'approved':
          return comm.status == CommunicationStatus.approved;
        case 'rejected':
          return comm.status == CommunicationStatus.rejected;
        default:
          return true;
      }
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Communication History'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadCommunications,
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Section
          _buildFilterSection(),
          
          // Communications List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredCommunications.isEmpty
                    ? _buildEmptyState()
                    : _buildCommunicationsList(),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterSection() {
    return Container(
      padding: const EdgeInsets.all(AppConstants.paddingMedium),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        border: Border(
          bottom: BorderSide(color: Colors.grey[300]!),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Filter Communications',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppConstants.paddingSmall),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _filters.map((filter) {
                final isSelected = _selectedFilter == filter['value'];
                return Padding(
                  padding: const EdgeInsets.only(right: AppConstants.paddingSmall),
                  child: FilterChip(
                    label: Text(filter['label']!),
                    selected: isSelected,
                    onSelected: (selected) {
                      setState(() {
                        _selectedFilter = filter['value']!;
                      });
                    },
                    selectedColor: AppConstants.primaryColor.withOpacity(0.2),
                    checkmarkColor: AppConstants.primaryColor,
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.chat_bubble_outline,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: AppConstants.paddingMedium),
          Text(
            _selectedFilter == 'all' 
                ? 'No communications yet'
                : 'No ${_filters.firstWhere((f) => f['value'] == _selectedFilter)['label']?.toLowerCase()} found',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: AppConstants.paddingSmall),
          Text(
            _selectedFilter == 'all'
                ? 'Start by reporting an absence or requesting a holiday'
                : 'Try selecting a different filter',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.grey[500],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildCommunicationsList() {
    return RefreshIndicator(
      onRefresh: _loadCommunications,
      child: ListView.builder(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        itemCount: _filteredCommunications.length,
        itemBuilder: (context, index) {
          final communication = _filteredCommunications[index];
          return _buildCommunicationCard(communication);
        },
      ),
    );
  }

  Widget _buildCommunicationCard(ParentCommunication communication) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppConstants.paddingMedium),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => CommunicationDetailScreen(communication: communication),
            ),
          );
        },
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(AppConstants.paddingMedium),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Row
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _getTypeColor(communication.type).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      communication.typeDisplayName,
                      style: TextStyle(
                        color: _getTypeColor(communication.type),
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _getStatusColor(communication.status).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      communication.statusDisplayName,
                      style: TextStyle(
                        color: _getStatusColor(communication.status),
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppConstants.paddingSmall),
              
              // Subject
              Text(
                communication.subject,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 4),
              
              // Message Preview
              Text(
                communication.message,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[600],
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: AppConstants.paddingSmall),
              
              // Student and Date Info
              Row(
                children: [
                  Icon(
                    Icons.person,
                    size: 16,
                    color: Colors.grey[500],
                  ),
                  const SizedBox(width: 4),
                  Text(
                    communication.studentName,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey[600],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(width: AppConstants.paddingMedium),
                  Icon(
                    Icons.access_time,
                    size: 16,
                    color: Colors.grey[500],
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _formatDateTime(communication.createdAt),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey[500],
                    ),
                  ),
                ],
              ),
              
              // Date Range (for holiday requests)
              if (communication.type == CommunicationType.holidayRequest && 
                  communication.startDate != null && 
                  communication.endDate != null) ...[
                const SizedBox(height: AppConstants.paddingSmall),
                Row(
                  children: [
                    Icon(
                      Icons.calendar_today,
                      size: 16,
                      color: Colors.grey[500],
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${_formatDate(communication.startDate!)} - ${_formatDate(communication.endDate!)}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey[500],
                      ),
                    ),
                  ],
                ),
              ],
              
              // Priority
              if (communication.priority != CommunicationPriority.medium) ...[
                const SizedBox(height: AppConstants.paddingSmall),
                Row(
                  children: [
                    Icon(
                      Icons.flag,
                      size: 16,
                      color: _getPriorityColor(communication.priority),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Priority: ${communication.priorityDisplayName}',
                      style: TextStyle(
                        color: _getPriorityColor(communication.priority),
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Color _getTypeColor(CommunicationType type) {
    switch (type) {
      case CommunicationType.absenceNotification:
        return Colors.orange;
      case CommunicationType.holidayRequest:
        return Colors.blue;
    }
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

  String _formatDateTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 7) {
      return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
    } else if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
