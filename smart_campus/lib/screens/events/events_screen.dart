import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';
import 'event_detail_screen.dart';

class EventsScreen extends StatefulWidget {
  const EventsScreen({super.key});

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  String _filter = 'All';

  final List<Map<String, dynamic>> _events = [
    {
      'id': '1',
      'title': 'Annual Sports Day',
      'description': 'Annual sports day celebration with various athletic events',
      'date': '2024-02-15',
      'time': '09:00 AM',
      'location': 'School Ground',
      'category': 'Sports',
      'status': 'upcoming',
    },
    {
      'id': '2',
      'title': 'Science Fair',
      'description': 'Students showcase their science projects and experiments',
      'date': '2024-01-25',
      'time': '02:00 PM',
      'location': 'School Auditorium',
      'category': 'Academic',
      'status': 'upcoming',
    },
    {
      'id': '3',
      'title': 'Parent-Teacher Meeting',
      'description': 'Annual parent-teacher meeting for all classes',
      'date': '2024-01-20',
      'time': '10:00 AM',
      'location': 'School Hall',
      'category': 'General',
      'status': 'completed',
    },
  ];

  List<Map<String, dynamic>> _getFilteredEvents() {
    if (_filter == 'All') return _events;
    final now = DateTime.now();
    return _events.where((event) {
      final dateStr = event['date'] as String?;
      if (dateStr == null || dateStr.isEmpty) return false;
      DateTime eventDate;
      try {
        eventDate = DateTime.parse(dateStr);
      } catch (_) {
        return false;
      }
      switch (_filter) {
        case 'Today':
          return eventDate.year == now.year &&
              eventDate.month == now.month &&
              eventDate.day == now.day;
        case 'This Week':
          final startOfWeek = now.subtract(Duration(days: now.weekday - 1));
          final start = DateTime(startOfWeek.year, startOfWeek.month, startOfWeek.day);
          final end = start.add(const Duration(days: 6));
          return !eventDate.isBefore(start) && !eventDate.isAfter(end);
        case 'This Month':
          return eventDate.year == now.year && eventDate.month == now.month;
        default:
          return true;
      }
    }).toList();
  }

  void _showAddEventSheet() {
    final titleController = TextEditingController();
    final descController = TextEditingController();
    DateTime selectedDate = DateTime.now().add(const Duration(days: 1));

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          return Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom,
            ),
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(AppConstants.paddingMedium),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'Add Event',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: AppConstants.paddingMedium),
                    TextField(
                      controller: titleController,
                      decoration: const InputDecoration(
                        labelText: 'Title',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: AppConstants.paddingMedium),
                    InkWell(
                      onTap: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: selectedDate,
                          firstDate: DateTime.now(),
                          lastDate: DateTime.now().add(const Duration(days: 365)),
                        );
                        if (picked != null) {
                          setModalState(() => selectedDate = picked);
                        }
                      },
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'Date',
                          border: OutlineInputBorder(),
                        ),
                        child: Text(
                          '${selectedDate.year}-${selectedDate.month.toString().padLeft(2, '0')}-${selectedDate.day.toString().padLeft(2, '0')}',
                        ),
                      ),
                    ),
                    const SizedBox(height: AppConstants.paddingMedium),
                    TextField(
                      controller: descController,
                      decoration: const InputDecoration(
                        labelText: 'Description',
                        alignLabelWithHint: true,
                        border: OutlineInputBorder(),
                      ),
                      maxLines: 3,
                    ),
                    const SizedBox(height: AppConstants.paddingMedium),
                    ElevatedButton(
                      onPressed: () {
                        final title = titleController.text.trim();
                        final description = descController.text.trim();
                        if (title.isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Enter a title')),
                          );
                          return;
                        }
                        setState(() {
                          _events.insert(
                            0,
                            {
                              'id': DateTime.now().millisecondsSinceEpoch.toString(),
                              'title': title,
                              'description': description.isNotEmpty ? description : 'No description',
                              'date': '${selectedDate.year}-${selectedDate.month.toString().padLeft(2, '0')}-${selectedDate.day.toString().padLeft(2, '0')}',
                              'time': '',
                              'location': '',
                              'category': 'General',
                              'status': 'upcoming',
                            },
                          );
                        });
                        Navigator.pop(context);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppConstants.primaryColor,
                        foregroundColor: AppConstants.textWhite,
                        padding: const EdgeInsets.symmetric(vertical: AppConstants.paddingMedium),
                      ),
                      child: const Text('Save'),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filteredEvents = _getFilteredEvents();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Events'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: _showAddEventSheet,
          ),
        ],
      ),
      body: Column(
        children: [
          // Events Summary
          _buildEventsSummary(),
          // Filter chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(
              horizontal: AppConstants.paddingMedium,
              vertical: AppConstants.paddingSmall,
            ),
            child: Row(
              children: ['All', 'Today', 'This Week', 'This Month']
                  .map((option) => Padding(
                        padding: const EdgeInsets.only(right: 8.0),
                        child: FilterChip(
                          label: Text(option),
                          selected: _filter == option,
                          onSelected: (selected) {
                            if (selected) setState(() => _filter = option);
                          },
                        ),
                      ))
                  .toList(),
            ),
          ),
          // Events List
          Expanded(
            child: filteredEvents.isEmpty
                ? _buildEmptyState()
                : _buildEventsList(filteredEvents),
          ),
        ],
      ),
    );
  }

  Widget _buildEventsSummary() {
    int total = _events.length;
    int upcoming = _events.where((event) => event['status'] == 'upcoming').length;
    int completed = _events.where((event) => event['status'] == 'completed').length;

    return Container(
      margin: const EdgeInsets.all(AppConstants.paddingMedium),
      padding: const EdgeInsets.all(AppConstants.paddingLarge),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppConstants.borderRadiusLarge),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildSummaryItem('Total', total.toString(), Icons.event),
          _buildSummaryItem('Upcoming', upcoming.toString(), Icons.schedule),
          _buildSummaryItem('Completed', completed.toString(), Icons.check_circle),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: AppConstants.primaryColor.withOpacity(0.2),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Icon(
            icon,
            color: AppConstants.primaryColor,
            size: 20,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: AppConstants.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.event_outlined,
            size: 80,
            color: AppConstants.textSecondary,
          ),
          const SizedBox(height: AppConstants.paddingMedium),
          Text(
            'No events found',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppConstants.textSecondary,
            ),
          ),
          const SizedBox(height: AppConstants.paddingSmall),
          Text(
            'Add your first event using the + button',
            style: TextStyle(
              color: AppConstants.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEventsList(List<Map<String, dynamic>> eventsList) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: AppConstants.paddingMedium),
      itemCount: eventsList.length,
      itemBuilder: (context, index) {
        final event = eventsList[index];
        return Card(
          margin: const EdgeInsets.only(bottom: AppConstants.paddingSmall),
          child: ListTile(
            leading: Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: _getCategoryColor(event['category']).withOpacity(0.2),
                borderRadius: BorderRadius.circular(25),
              ),
              child: Icon(
                Icons.event,
                color: _getCategoryColor(event['category']),
                size: 24,
              ),
            ),
            title: Text(
              event['title'],
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  event['description'],
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppConstants.textSecondary,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(
                      Icons.calendar_today,
                      size: 12,
                      color: AppConstants.textSecondary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${event['date']} • ${event['time']}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppConstants.textSecondary,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Icon(
                      Icons.location_on,
                      size: 12,
                      color: AppConstants.textSecondary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      event['location'],
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppConstants.textSecondary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            trailing: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppConstants.paddingSmall,
                vertical: 4,
              ),
              decoration: BoxDecoration(
                color: _getStatusColor(event['status']).withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                event['status'].toUpperCase(),
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: _getStatusColor(event['status']),
                ),
              ),
            ),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => EventDetailScreen(event: event),
                ),
              );
            },
          ),
        );
      },
    );
  }

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'sports':
        return AppConstants.successColor;
      case 'academic':
        return AppConstants.primaryColor;
      case 'general':
        return AppConstants.warningColor;
      default:
        return AppConstants.textSecondary;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'upcoming':
        return AppConstants.warningColor;
      case 'completed':
        return AppConstants.successColor;
      default:
        return AppConstants.textSecondary;
    }
  }
} 