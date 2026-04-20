import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';
import '../../models/transport_route_model.dart';
import '../../services/transport_service.dart';

class HelperRouteDetailScreen extends StatefulWidget {
  final TransportRoute route;

  const HelperRouteDetailScreen({super.key, required this.route});

  @override
  State<HelperRouteDetailScreen> createState() => _HelperRouteDetailScreenState();
}

class _HelperRouteDetailScreenState extends State<HelperRouteDetailScreen> {
  late TransportRoute _route;
  // ignore: unused_field
  List<TransportUpdate> _updates = [];
  // ignore: unused_field
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _route = widget.route;
    _loadUpdates();
  }

  Future<void> _loadUpdates() async {
    setState(() => _isLoading = true);
    
    try {
      final updates = await TransportService.getTodayUpdates(_route.id);
      setState(() {
        _updates = updates;
      });
    } catch (e) {
      print('Error loading updates: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _updateStopStatus(RouteStop stop, StopStatus status, {String? notes}) async {
    try {
      await TransportService.updateStopStatus(
        _route.id,
        stop.id,
        status,
        notes: notes,
      );
      
      // Update local route data
      final updatedStops = _route.stops.map((s) {
        if (s.id == stop.id) {
          return s.copyWith(
            status: status,
            actualTime: status == StopStatus.reached ? DateTime.now() : s.actualTime,
            notes: notes,
          );
        }
        return s;
      }).toList();
      
      setState(() {
        _route = _route.copyWith(stops: updatedStops);
      });
      
      // Reload updates
      _loadUpdates();
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${stop.name} marked as ${status.name}'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error updating stop: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _showUpdateStopDialog(RouteStop stop) {
    showDialog(
      context: context,
      builder: (context) => _UpdateStopDialog(
        stop: stop,
        onStatusUpdated: (status, notes) {
          _updateStopStatus(stop, status, notes: notes);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_route.name),
        backgroundColor: Colors.orange,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadUpdates,
          ),
        ],
      ),
      body: Column(
        children: [
          // Progress Header
          _buildProgressHeader(),
          
          // Stops List
          Expanded(
            child: _buildStopsList(),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressHeader() {
    return Container(
      padding: const EdgeInsets.all(AppConstants.paddingMedium),
      decoration: BoxDecoration(
        color: Colors.orange.withOpacity(0.1),
        border: Border(
          bottom: BorderSide(color: Colors.orange.withOpacity(0.3)),
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Route Progress',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: Colors.orange[800],
                      ),
                    ),
                    const SizedBox(height: AppConstants.paddingSmall),
                    Text(
                      '${_route.completedStops} of ${_route.totalStops} stops completed',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '${_route.completionPercentage.toStringAsFixed(0)}%',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Colors.orange,
                    ),
                  ),
                  Text(
                    'Complete',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: AppConstants.paddingMedium),
          
          LinearProgressIndicator(
            value: _route.completionPercentage / 100,
            backgroundColor: Colors.grey[300],
            valueColor: const AlwaysStoppedAnimation<Color>(Colors.orange),
          ),
        ],
      ),
    );
  }

  Widget _buildStopsList() {
    return ListView.builder(
      padding: const EdgeInsets.all(AppConstants.paddingMedium),
      itemCount: _route.stops.length,
      itemBuilder: (context, index) {
        final stop = _route.stops[index];
        final isLast = index == _route.stops.length - 1;
        
        return _buildStopItem(stop, index + 1, isLast);
      },
    );
  }

  Widget _buildStopItem(RouteStop stop, int stopNumber, bool isLast) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppConstants.paddingMedium),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Stop Number & Connection Line
          Column(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: _getStopStatusColor(stop.status),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 3),
                ),
                child: Center(
                  child: Text(
                    '$stopNumber',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
              if (!isLast)
                Container(
                  width: 3,
                  height: 60,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
            ],
          ),
          const SizedBox(width: AppConstants.paddingMedium),
          
          // Stop Details
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(AppConstants.paddingMedium),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: _getStopStatusColor(stop.status).withOpacity(0.3),
                  width: 2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.1),
                    spreadRadius: 1,
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          stop.name,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: _getStopStatusColor(stop.status).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(
                          stop.statusDisplayName,
                          style: TextStyle(
                            color: _getStopStatusColor(stop.status),
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppConstants.paddingSmall),
                  
                  Row(
                    children: [
                      const Icon(Icons.location_on, size: 16, color: Colors.grey),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          stop.address,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.grey[600],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppConstants.paddingSmall),
                  
                  Row(
                    children: [
                      const Icon(Icons.access_time, size: 16, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(
                        'ETA: ${_formatTime(stop.estimatedTime)}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                      if (stop.actualTime != null) ...[
                        const SizedBox(width: AppConstants.paddingMedium),
                        const Icon(Icons.check_circle, size: 16, color: Colors.green),
                        const SizedBox(width: 4),
                        Text(
                          'Arrived: ${_formatTime(stop.actualTime!)}',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.green,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ],
                  ),
                  
                  if (stop.notes != null && stop.notes!.isNotEmpty) ...[
                    const SizedBox(height: AppConstants.paddingSmall),
                    Container(
                      padding: const EdgeInsets.all(AppConstants.paddingSmall),
                      decoration: BoxDecoration(
                        color: Colors.blue.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.note, size: 14, color: Colors.blue),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              stop.notes!,
                              style: const TextStyle(
                                color: Colors.blue,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  
                  const SizedBox(height: AppConstants.paddingMedium),
                  
                  // Action Buttons
                  if (stop.status == StopStatus.pending) ...[
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _updateStopStatus(stop, StopStatus.reached),
                            icon: const Icon(Icons.check_circle, size: 16),
                            label: const Text('Reached'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 8),
                            ),
                          ),
                        ),
                        const SizedBox(width: AppConstants.paddingSmall),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => _showUpdateStopDialog(stop),
                            icon: const Icon(Icons.edit, size: 16),
                            label: const Text('Update'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.orange,
                              side: const BorderSide(color: Colors.orange),
                              padding: const EdgeInsets.symmetric(vertical: 8),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ] else ...[
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => _showUpdateStopDialog(stop),
                            icon: const Icon(Icons.edit, size: 16),
                            label: const Text('Edit Status'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.orange,
                              side: const BorderSide(color: Colors.orange),
                              padding: const EdgeInsets.symmetric(vertical: 8),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getStopStatusColor(StopStatus status) {
    switch (status) {
      case StopStatus.pending:
        return Colors.grey;
      case StopStatus.reached:
        return Colors.green;
      case StopStatus.skipped:
        return Colors.red;
      case StopStatus.delayed:
        return Colors.orange;
    }
  }

  String _formatTime(DateTime dateTime) {
    return '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }
}

class _UpdateStopDialog extends StatefulWidget {
  final RouteStop stop;
  final Function(StopStatus status, String? notes) onStatusUpdated;

  const _UpdateStopDialog({
    required this.stop,
    required this.onStatusUpdated,
  });

  @override
  State<_UpdateStopDialog> createState() => _UpdateStopDialogState();
}

class _UpdateStopDialogState extends State<_UpdateStopDialog> {
  StopStatus _selectedStatus = StopStatus.reached;
  final _notesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _selectedStatus = widget.stop.status;
    _notesController.text = widget.stop.notes ?? '';
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  void _updateStatus() {
    widget.onStatusUpdated(
      _selectedStatus,
      _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
    );
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Update ${widget.stop.name}'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          DropdownButtonFormField<StopStatus>(
            value: _selectedStatus,
            decoration: const InputDecoration(
              labelText: 'Status',
              border: OutlineInputBorder(),
            ),
            items: [
              const DropdownMenuItem(
                value: StopStatus.pending,
                child: Row(
                  children: [
                    Icon(Icons.pending, color: Colors.grey),
                    SizedBox(width: 8),
                    Text('Pending'),
                  ],
                ),
              ),
              const DropdownMenuItem(
                value: StopStatus.reached,
                child: Row(
                  children: [
                    Icon(Icons.check_circle, color: Colors.green),
                    SizedBox(width: 8),
                    Text('Reached'),
                  ],
                ),
              ),
              const DropdownMenuItem(
                value: StopStatus.skipped,
                child: Row(
                  children: [
                    Icon(Icons.skip_next, color: Colors.red),
                    SizedBox(width: 8),
                    Text('Skipped'),
                  ],
                ),
              ),
              const DropdownMenuItem(
                value: StopStatus.delayed,
                child: Row(
                  children: [
                    Icon(Icons.schedule, color: Colors.orange),
                    SizedBox(width: 8),
                    Text('Delayed'),
                  ],
                ),
              ),
            ],
            onChanged: (StopStatus? status) {
              setState(() {
                _selectedStatus = status!;
              });
            },
          ),
          const SizedBox(height: AppConstants.paddingMedium),
          
          TextField(
            controller: _notesController,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Notes (Optional)',
              border: OutlineInputBorder(),
              hintText: 'Add any additional notes...',
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _updateStatus,
          style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
          child: const Text('Update'),
        ),
      ],
    );
  }
}
