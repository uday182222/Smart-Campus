import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';
import '../../models/afterschool_model.dart';
import '../../services/afterschool_service.dart';
import '../../services/auth_service.dart';
import 'activity_detail_screen.dart';

class AfterSchoolScreen extends StatefulWidget {
  const AfterSchoolScreen({super.key});

  @override
  State<AfterSchoolScreen> createState() => _AfterSchoolScreenState();
}

class _AfterSchoolScreenState extends State<AfterSchoolScreen> {
  List<AfterSchoolActivity> _activities = [];
  bool _isLoading = true;
  String _selectedFilter = 'all';

  final List<Map<String, String>> _filters = [
    {'value': 'all', 'label': 'All Activities'},
    {'value': 'sports', 'label': 'Sports'},
    {'value': 'arts', 'label': 'Arts'},
    {'value': 'academics', 'label': 'Academics'},
    {'value': 'technology', 'label': 'Technology'},
    {'value': 'available', 'label': 'Available'},
  ];

  @override
  void initState() {
    super.initState();
    _loadActivities();
  }

  Future<void> _loadActivities() async {
    setState(() => _isLoading = true);
    
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser != null) {
        final activities = await AfterSchoolService.getActivitiesBySchool('SCH-2025-A12'); // Default school ID
        setState(() {
          _activities = activities;
        });
      }
    } catch (e) {
      print('Error loading activities: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading activities: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  List<AfterSchoolActivity> get _filteredActivities {
    if (_selectedFilter == 'all') return _activities;
    
    return _activities.where((activity) {
      switch (_selectedFilter) {
        case 'sports':
          return activity.type == ActivityType.sports;
        case 'arts':
          return activity.type == ActivityType.arts;
        case 'academics':
          return activity.type == ActivityType.academics;
        case 'technology':
          return activity.type == ActivityType.technology;
        case 'available':
          return activity.hasSpace;
        default:
          return true;
      }
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('After-School Activities'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadActivities,
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Section
          _buildFilterSection(),
          
          // Activities List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredActivities.isEmpty
                    ? _buildEmptyState()
                    : _buildActivitiesList(),
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
            'Filter Activities',
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
            Icons.sports_soccer,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: AppConstants.paddingMedium),
          Text(
            'No activities found',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: AppConstants.paddingSmall),
          Text(
            'After-school activities will appear here when available',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.grey[500],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildActivitiesList() {
    return RefreshIndicator(
      onRefresh: _loadActivities,
      child: ListView.builder(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        itemCount: _filteredActivities.length,
        itemBuilder: (context, index) {
          final activity = _filteredActivities[index];
          return _buildActivityCard(activity);
        },
      ),
    );
  }

  Widget _buildActivityCard(AfterSchoolActivity activity) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppConstants.paddingMedium),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => ActivityDetailScreen(activity: activity),
            ),
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(AppConstants.paddingMedium),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Row
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: _getTypeColor(activity.type).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      _getTypeIcon(activity.type),
                      color: _getTypeColor(activity.type),
                    ),
                  ),
                  const SizedBox(width: AppConstants.paddingMedium),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          activity.name,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          activity.typeDisplayName,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: activity.hasSpace ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      activity.hasSpace ? '${activity.availableSpots} spots' : 'Full',
                      style: TextStyle(
                        color: activity.hasSpace ? Colors.green : Colors.red,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppConstants.paddingMedium),
              
              // Description
              Text(
                activity.description,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: AppConstants.paddingMedium),
              
              // Details
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildDetailItem(Icons.person, 'Instructor', activity.instructorName),
                        const SizedBox(height: 4),
                        _buildDetailItem(Icons.access_time, 'Schedule', activity.schedule),
                      ],
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildDetailItem(Icons.location_on, 'Location', activity.location),
                        const SizedBox(height: 4),
                        _buildDetailItem(Icons.payment, 'Fee', '₹${activity.fee.toStringAsFixed(0)}'),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppConstants.paddingMedium),
              
              // Participants and Action
              Row(
                children: [
                  Icon(Icons.people, size: 16, color: Colors.grey[500]),
                  const SizedBox(width: 4),
                  Text(
                    '${activity.currentParticipants}/${activity.maxParticipants} participants',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey[600],
                    ),
                  ),
                  const Spacer(),
                  Text(
                    'Tap for details',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppConstants.primaryColor,
                      fontStyle: FontStyle.italic,
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

  Widget _buildDetailItem(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.grey[500]),
        const SizedBox(width: 4),
        Expanded(
          child: Text(
            '$label: $value',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Colors.grey[600],
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
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
