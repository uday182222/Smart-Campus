import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';
import '../../models/transport_route_model.dart';
import '../../services/transport_service.dart';
import 'helper_route_detail_screen.dart';

class HelperAppScreen extends StatefulWidget {
  const HelperAppScreen({super.key});

  @override
  State<HelperAppScreen> createState() => _HelperAppScreenState();
}

class _HelperAppScreenState extends State<HelperAppScreen> {
  List<TransportRoute> _activeRoutes = [];
  bool _isLoading = true;
  String? _selectedRouteId;

  @override
  void initState() {
    super.initState();
    _loadActiveRoutes();
  }

  Future<void> _loadActiveRoutes() async {
    setState(() => _isLoading = true);
    
    try {
      final routes = await TransportService.getActiveRoutes();
      setState(() {
        _activeRoutes = routes;
        if (routes.isNotEmpty && _selectedRouteId == null) {
          _selectedRouteId = routes.first.id;
        }
      });
    } catch (e) {
      print('Error loading active routes: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading routes: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  TransportRoute? get _selectedRoute {
    if (_selectedRouteId == null) return null;
    try {
      return _activeRoutes.firstWhere((route) => route.id == _selectedRouteId);
    } catch (e) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bus Helper App'),
        backgroundColor: Colors.orange,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadActiveRoutes,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _activeRoutes.isEmpty
              ? _buildEmptyState()
              : Column(
                  children: [
                    // Route Selection
                    _buildRouteSelection(),
                    
                    // Selected Route Details
                    if (_selectedRoute != null)
                      Expanded(
                        child: _buildRouteDetails(),
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
            Icons.directions_bus,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: AppConstants.paddingMedium),
          Text(
            'No active routes',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: AppConstants.paddingSmall),
          Text(
            'There are no active transport routes assigned to you today',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.grey[500],
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppConstants.paddingLarge),
          ElevatedButton.icon(
            onPressed: _loadActiveRoutes,
            icon: const Icon(Icons.refresh),
            label: const Text('Refresh'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.orange,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRouteSelection() {
    return Container(
      padding: const EdgeInsets.all(AppConstants.paddingMedium),
      decoration: BoxDecoration(
        color: Colors.orange.withOpacity(0.1),
        border: Border(
          bottom: BorderSide(color: Colors.orange.withOpacity(0.3)),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Select Route',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: Colors.orange[800],
            ),
          ),
          const SizedBox(height: AppConstants.paddingSmall),
          
          if (_activeRoutes.length == 1)
            Container(
              padding: const EdgeInsets.all(AppConstants.paddingMedium),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.orange.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.directions_bus, color: Colors.orange),
                  const SizedBox(width: AppConstants.paddingSmall),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _activeRoutes.first.name,
                          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          'Bus: ${_activeRoutes.first.busNumber}',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            )
          else
            DropdownButtonFormField<String>(
              value: _selectedRouteId,
              decoration: InputDecoration(
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                prefixIcon: const Icon(Icons.directions_bus, color: Colors.orange),
                filled: true,
                fillColor: Colors.white,
              ),
              items: _activeRoutes.map((route) {
                return DropdownMenuItem(
                  value: route.id,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        route.name,
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      Text(
                        'Bus: ${route.busNumber}',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
              onChanged: (String? routeId) {
                setState(() {
                  _selectedRouteId = routeId;
                });
              },
            ),
        ],
      ),
    );
  }

  Widget _buildRouteDetails() {
    final route = _selectedRoute!;
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppConstants.paddingMedium),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Route Overview Card
          _buildRouteOverviewCard(route),
          const SizedBox(height: AppConstants.paddingLarge),
          
          // Progress Card
          _buildProgressCard(route),
          const SizedBox(height: AppConstants.paddingLarge),
          
          // Stops List
          _buildStopsList(route),
          const SizedBox(height: AppConstants.paddingLarge),
          
          // Quick Actions
          _buildQuickActions(route),
        ],
      ),
    );
  }

  Widget _buildRouteOverviewCard(TransportRoute route) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.directions_bus, color: Colors.orange),
                const SizedBox(width: AppConstants.paddingSmall),
                Expanded(
                  child: Text(
                    route.name,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppConstants.paddingSmall),
            
            Text(
              route.description,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Driver',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                      Text(
                        route.driverName,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Bus Number',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                      Text(
                        route.busNumber,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
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
                  'Schedule: ${_formatTime(route.startTime)} - ${_formatTime(route.endTime)}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressCard(TransportRoute route) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Route Progress',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${route.completedStops} of ${route.totalStops} stops',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: AppConstants.paddingSmall),
                      LinearProgressIndicator(
                        value: route.completionPercentage / 100,
                        backgroundColor: Colors.grey[300],
                        valueColor: const AlwaysStoppedAnimation<Color>(Colors.orange),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: AppConstants.paddingLarge),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '${route.completionPercentage.toStringAsFixed(0)}%',
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
          ],
        ),
      ),
    );
  }

  Widget _buildStopsList(TransportRoute route) {
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
                TextButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => HelperRouteDetailScreen(route: route),
                      ),
                    );
                  },
                  icon: const Icon(Icons.fullscreen),
                  label: const Text('Full View'),
                ),
              ],
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            ...List.generate(route.stops.length, (index) {
              final stop = route.stops[index];
              return _buildStopItem(stop, index + 1);
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildStopItem(RouteStop stop, int stopNumber) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppConstants.paddingSmall),
      child: Row(
        children: [
          // Stop Number
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: _getStopStatusColor(stop.status),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                '$stopNumber',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          ),
          const SizedBox(width: AppConstants.paddingMedium),
          
          // Stop Details
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(AppConstants.paddingMedium),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey[300]!),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          stop.name,
                          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: _getStopStatusColor(stop.status).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          stop.statusDisplayName,
                          style: TextStyle(
                            color: _getStopStatusColor(stop.status),
                            fontSize: 10,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppConstants.paddingSmall),
                  
                  Text(
                    stop.address,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: AppConstants.paddingSmall),
                  
                  Row(
                    children: [
                      Icon(
                        Icons.access_time,
                        size: 14,
                        color: Colors.grey[500],
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'ETA: ${_formatTime(stop.estimatedTime)}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey[500],
                        ),
                      ),
                      const Spacer(),
                      if (stop.status == StopStatus.pending)
                        ElevatedButton(
                          onPressed: () => _showUpdateStopDialog(stop),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.orange,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            minimumSize: Size.zero,
                          ),
                          child: const Text('Update'),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions(TransportRoute route) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Quick Actions',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => HelperRouteDetailScreen(route: route),
                        ),
                      );
                    },
                    icon: const Icon(Icons.list),
                    label: const Text('View All Stops'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: AppConstants.paddingMedium),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _loadActiveRoutes,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Refresh'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.grey,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showUpdateStopDialog(RouteStop stop) {
    showDialog(
      context: context,
      builder: (context) => _UpdateStopDialog(
        stop: stop,
        onStatusUpdated: (status, notes) async {
          try {
            await TransportService.updateStopStatus(
              _selectedRoute!.id,
              stop.id,
              status,
              notes: notes,
            );
            
            // Refresh the route data
            _loadActiveRoutes();
            
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Stop status updated to ${status.name}'),
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
        },
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
