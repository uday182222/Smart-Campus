import 'package:flutter/material.dart';
import '../../core/utils/responsive_utils.dart';
import '../../services/announcement_service.dart';

class AnnouncementsScreen extends StatefulWidget {
  final String? userRole;
  
  const AnnouncementsScreen({
    super.key,
    this.userRole,
  });

  @override
  State<AnnouncementsScreen> createState() => _AnnouncementsScreenState();
}

class _AnnouncementsScreenState extends State<AnnouncementsScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedCategory = 'All';
  String _selectedPriority = 'All';
  String _selectedDate = 'All';
  Set<String> _selectedRoles = {'All Staff'};
  bool _showUnreadOnly = false;
  
  List<Map<String, dynamic>> _announcements = [];
  
  @override
  void initState() {
    super.initState();
    _loadAnnouncements();
    // Add listener for real-time updates
    AnnouncementService.addListener(_loadAnnouncements);
  }
  
  @override
  void dispose() {
    AnnouncementService.removeListener(_loadAnnouncements);
    super.dispose();
  }
  
  void _loadAnnouncements() {
    setState(() {
      if (widget.userRole != null) {
        _announcements = AnnouncementService.getAnnouncementsForRole(widget.userRole!);
      } else {
        _announcements = AnnouncementService.getAllAnnouncements();
      }
    });
  }

  List<Map<String, dynamic>> get _filteredAnnouncements {
    return _announcements.where((announcement) {
      final matchesSearch = announcement['title'].toLowerCase().contains(_searchController.text.toLowerCase()) ||
                           announcement['content'].toLowerCase().contains(_searchController.text.toLowerCase());
      final matchesCategory = _selectedCategory == 'All' || announcement['category'] == _selectedCategory;
      final matchesPriority = _selectedPriority == 'All' || announcement['priority'] == _selectedPriority;
      
      // Filter based on user role and announcement visibility
      bool isVisible = true;
      
      if (widget.userRole != null) {
        final userRole = widget.userRole!;
        final authorRole = announcement['authorRole'] as String?;
        final visibleTo = announcement['visibleTo'] as List<String>?;
        
        // Admin announcements with specific visibility rules
        if (authorRole == 'super_admin' && visibleTo != null) {
          // Check if user's role matches the visibleTo criteria
          if (visibleTo.contains('All Staff')) {
            isVisible = userRole == 'super_admin' || userRole == 'teacher' || userRole == 'staff';
          } else if (visibleTo.contains('School Admins')) {
            isVisible = userRole == 'super_admin';
          } else if (visibleTo.contains('Teachers')) {
            isVisible = userRole == 'teacher';
          } else if (visibleTo.contains('Helpers')) {
            isVisible = userRole == 'staff';
          }
        } else if (authorRole == 'super_admin') {
          // Legacy admin announcements - show to all staff
          isVisible = userRole == 'super_admin' || userRole == 'teacher' || userRole == 'staff';
        } else {
          // Regular announcements are visible to everyone
          isVisible = true;
        }
      }
      
      // Filter by unread status if enabled
      bool matchesUnread = true;
      if (_showUnreadOnly) {
        matchesUnread = announcement['isUnread'] == true;
      }
      
      return matchesSearch && matchesCategory && matchesPriority && isVisible && matchesUnread;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final isMobile = ResponsiveUtils.isMobile(context);

    return Scaffold(
      body: Padding(
        padding: ResponsiveUtils.getResponsivePadding(context),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            'Announcements',
                            style: ResponsiveUtils.getResponsiveHeadingStyle(context),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.red,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '${_announcements.where((a) => a['isUnread'] == true).length}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Manage and share announcements',
                        style: ResponsiveUtils.getResponsiveBodyStyle(context),
                      ),
                    ],
                  ),
                ),
                if (!isMobile)
                  ElevatedButton.icon(
                    onPressed: () => _showAddAnnouncementDialog(context),
                    icon: const Icon(Icons.add),
                    label: const Text('Add Announcement'),
                    style: ResponsiveUtils.getResponsiveButtonStyle(context),
                  ),
              ],
            ),
            
            const SizedBox(height: 24),
            
            // Search and Filters
            _buildSearchAndFilters(),
            
            const SizedBox(height: 16),
            
            // Announcements List
            Expanded(
              child: _buildAnnouncementsList(),
            ),
          ],
        ),
      ),
      floatingActionButton: isMobile
          ? FloatingActionButton(
              onPressed: () => _showAddAnnouncementDialog(context),
              child: const Icon(Icons.add),
            )
          : null,
    );
  }

  Widget _buildSearchAndFilters() {
    return Column(
      children: [
        // Search Bar
        TextField(
          controller: _searchController,
          decoration: InputDecoration(
            hintText: 'Search announcements...',
            prefixIcon: const Icon(Icons.search),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            filled: true,
            fillColor: Colors.white,
          ),
          onChanged: (value) => setState(() {}),
        ),
        
        const SizedBox(height: 16),
        
        // Filters
        Row(
          children: [
            Expanded(
              child: DropdownButtonFormField<String>(
                value: _selectedCategory,
                decoration: const InputDecoration(
                  labelText: 'Category',
                  border: OutlineInputBorder(),
                ),
                items: ['All', 'General', 'Academic', 'Events', 'Sports', 'Administrative', 'System']
                    .map((category) => DropdownMenuItem(value: category, child: Text(category)))
                    .toList(),
                onChanged: (value) => setState(() => _selectedCategory = value!),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: DropdownButtonFormField<String>(
                value: _selectedPriority,
                decoration: const InputDecoration(
                  labelText: 'Priority',
                  border: OutlineInputBorder(),
                ),
                items: ['All', 'Low', 'Medium', 'High', 'Important']
                    .map((priority) => DropdownMenuItem(value: priority, child: Text(priority)))
                    .toList(),
                onChanged: (value) => setState(() => _selectedPriority = value!),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: CheckboxListTile(
                title: const Text('Unread Only'),
                value: _showUnreadOnly,
                onChanged: (value) => setState(() => _showUnreadOnly = value!),
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildAnnouncementsList() {
    if (_filteredAnnouncements.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.announcement_outlined,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No announcements found',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Try adjusting your search or filters',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[500],
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: _filteredAnnouncements.length,
      itemBuilder: (context, index) {
        final announcement = _filteredAnnouncements[index];
        return _buildAnnouncementCard(announcement);
      },
    );
  }

  Widget _buildAnnouncementCard(Map<String, dynamic> announcement) {
    final isAdmin = announcement['authorRole'] == 'super_admin' || 
                    announcement['authorRole'] == 'school_admin';
    final isUnread = announcement['isUnread'] == true;
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _getPriorityColor(announcement['priority']).withOpacity(0.1),
          child: Icon(
            _getCategoryIcon(announcement['category']),
            color: _getPriorityColor(announcement['priority']),
          ),
        ),
        title: Row(
          children: [
            Expanded(
              child: Text(
                announcement['title'],
                style: TextStyle(
                  fontWeight: isUnread ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ),
            if (isUnread)
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                ),
              ),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(announcement['content']),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.person, size: 16, color: Colors.grey[600]),
                const SizedBox(width: 4),
                Text(
                  announcement['author'],
                  style: TextStyle(color: Colors.grey[600], fontSize: 12),
                ),
                const SizedBox(width: 16),
                Icon(Icons.schedule, size: 16, color: Colors.grey[600]),
                const SizedBox(width: 4),
                Text(
                  '${announcement['date']} ${announcement['time']}',
                  style: TextStyle(color: Colors.grey[600], fontSize: 12),
                ),
                const SizedBox(width: 16),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: _getPriorityColor(announcement['priority']).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    announcement['priority'],
                    style: TextStyle(
                      color: _getPriorityColor(announcement['priority']),
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
        trailing: PopupMenuButton<String>(
          onSelected: (value) {
            switch (value) {
              case 'view':
                _viewAnnouncement(context, announcement);
                break;
              case 'edit':
                if (isAdmin) _editAnnouncement(context, announcement);
                break;
              case 'delete':
                if (isAdmin) _deleteAnnouncement(context, announcement);
                break;
              case 'mark_read':
                _markAsRead(announcement);
                break;
            }
          },
          itemBuilder: (context) => [
            const PopupMenuItem(
              value: 'view',
              child: Row(
                children: [
                  Icon(Icons.visibility),
                  SizedBox(width: 8),
                  Text('View'),
                ],
              ),
            ),
            if (isUnread)
              const PopupMenuItem(
                value: 'mark_read',
                child: Row(
                  children: [
                    Icon(Icons.mark_email_read),
                    SizedBox(width: 8),
                    Text('Mark as Read'),
                  ],
                ),
              ),
            if (isAdmin) ...[
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
                value: 'delete',
                child: Row(
                  children: [
                    Icon(Icons.delete),
                    SizedBox(width: 8),
                    Text('Delete'),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Color _getPriorityColor(String priority) {
    switch (priority.toLowerCase()) {
      case 'high':
      case 'important':
        return Colors.red;
      case 'medium':
        return Colors.orange;
      case 'low':
        return Colors.green;
      default:
        return Colors.blue;
    }
  }

  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'academic':
        return Icons.school;
      case 'events':
        return Icons.event;
      case 'sports':
        return Icons.sports_soccer;
      case 'administrative':
        return Icons.admin_panel_settings;
      case 'system':
        return Icons.computer;
      default:
        return Icons.announcement;
    }
  }

  void _showAddAnnouncementDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AddAnnouncementDialog(userRole: widget.userRole),
    ).then((result) async {
      if (result != null) {
        try {
          await AnnouncementService.addAnnouncement(result);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Announcement "${result['title']}" added successfully')),
          );
        } catch (e) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to add announcement: $e')),
          );
        }
      }
    });
  }

  void _viewAnnouncement(BuildContext context, Map<String, dynamic> announcement) {
    showDialog(
      context: context,
      builder: (context) => ViewAnnouncementDialog(announcement: announcement),
    );
  }

  void _editAnnouncement(BuildContext context, Map<String, dynamic> announcement) {
    showDialog(
      context: context,
      builder: (context) => EditAnnouncementDialog(announcement: announcement),
    ).then((result) async {
      if (result != null) {
        try {
          await AnnouncementService.updateAnnouncement(announcement['id'], result);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Announcement "${result['title']}" updated successfully')),
          );
        } catch (e) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to update announcement: $e')),
          );
        }
      }
    });
  }

  void _deleteAnnouncement(BuildContext context, Map<String, dynamic> announcement) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Announcement'),
        content: Text('Are you sure you want to delete "${announcement['title']}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              try {
                await AnnouncementService.deleteAnnouncement(announcement['id']);
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('"${announcement['title']}" deleted successfully')),
                );
              } catch (e) {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Failed to delete announcement: $e')),
                );
              }
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  void _markAsRead(Map<String, dynamic> announcement) async {
    try {
      // Get current user ID (you might need to implement this based on your auth system)
      final userId = 'current_user_${DateTime.now().millisecondsSinceEpoch}';
      await AnnouncementService.markAsRead(announcement['id'], userId);
    } catch (e) {
      debugPrint('Failed to mark announcement as read: $e');
    }
  }
}

// Add Announcement Dialog
class AddAnnouncementDialog extends StatefulWidget {
  final String? userRole;
  
  const AddAnnouncementDialog({super.key, this.userRole});

  @override
  State<AddAnnouncementDialog> createState() => _AddAnnouncementDialogState();
}

class _AddAnnouncementDialogState extends State<AddAnnouncementDialog> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  String _selectedCategory = 'General';
  String _selectedPriority = 'Normal';
  bool _isPublished = false;
  Set<String> _selectedRoles = {'All Staff'};
  bool _hasAttachment = false;
  String _attachmentName = '';

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Add New Announcement'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(labelText: 'Title'),
                validator: (value) => value?.isEmpty == true ? 'Title is required' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _contentController,
                decoration: const InputDecoration(labelText: 'Content'),
                maxLines: 4,
                validator: (value) => value?.isEmpty == true ? 'Content is required' : null,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectedCategory,
                decoration: const InputDecoration(labelText: 'Category'),
                items: ['General', 'Academic', 'Events', 'Sports', 'Administrative', 'System']
                    .map((category) => DropdownMenuItem(value: category, child: Text(category)))
                    .toList(),
                onChanged: (value) => setState(() => _selectedCategory = value!),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectedPriority,
                decoration: const InputDecoration(labelText: 'Priority'),
                items: ['Low', 'Normal', 'Medium', 'High', 'Important']
                    .map((priority) => DropdownMenuItem(value: priority, child: Text(priority)))
                    .toList(),
                onChanged: (value) => setState(() => _selectedPriority = value!),
              ),
              const SizedBox(height: 16),
              CheckboxListTile(
                title: const Text('Publish immediately'),
                value: _isPublished,
                onChanged: (value) => setState(() => _isPublished = value!),
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
          onPressed: () {
            if (_formKey.currentState!.validate()) {
              final newAnnouncement = {
                'id': DateTime.now().millisecondsSinceEpoch.toString(),
                'title': _titleController.text,
                'content': _contentController.text,
                'category': _selectedCategory,
                'author': 'Current User', // This should be replaced with actual user name
                'authorRole': widget.userRole ?? 'staff', // Use the current user's role
                'date': DateTime.now().toString().split(' ')[0],
                'time': '${DateTime.now().hour}:${DateTime.now().minute.toString().padLeft(2, '0')}',
                'priority': _selectedPriority,
                'isPublished': _isPublished,
                'visibleTo': _selectedRoles.toList(),
                'hasAttachment': _hasAttachment,
                'attachmentName': _hasAttachment ? _attachmentName : null,
                'isRead': false,
                'isUnread': true,
              };
              Navigator.pop(context, newAnnouncement);
            }
          },
          child: const Text('Add Announcement'),
        ),
      ],
    );
  }
}

// View Announcement Dialog
class ViewAnnouncementDialog extends StatelessWidget {
  final Map<String, dynamic> announcement;

  const ViewAnnouncementDialog({super.key, required this.announcement});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('View Announcement: ${announcement['title']}'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildInfoRow('Title', announcement['title']),
            _buildInfoRow('Content', announcement['content']),
            _buildInfoRow('Category', announcement['category']),
            _buildInfoRow('Author', announcement['author']),
            _buildInfoRow('Date', announcement['date']),
            _buildInfoRow('Time', announcement['time']),
            _buildInfoRow('Priority', announcement['priority']),
            _buildInfoRow('Status', announcement['isPublished'] ? 'Published' : 'Draft'),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Close'),
        ),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Text('$label: ', style: const TextStyle(fontWeight: FontWeight.w600)),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}

// Edit Announcement Dialog
class EditAnnouncementDialog extends StatefulWidget {
  final Map<String, dynamic> announcement;

  const EditAnnouncementDialog({super.key, required this.announcement});

  @override
  State<EditAnnouncementDialog> createState() => _EditAnnouncementDialogState();
}

class _EditAnnouncementDialogState extends State<EditAnnouncementDialog> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleController;
  late TextEditingController _contentController;
  late String _selectedCategory;
  late String _selectedPriority;
  late bool _isPublished;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.announcement['title']);
    _contentController = TextEditingController(text: widget.announcement['content']);
    _selectedCategory = widget.announcement['category'];
    _selectedPriority = widget.announcement['priority'];
    _isPublished = widget.announcement['isPublished'];
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Edit Announcement: ${widget.announcement['title']}'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(labelText: 'Title'),
                validator: (value) => value?.isEmpty == true ? 'Title is required' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _contentController,
                decoration: const InputDecoration(labelText: 'Content'),
                maxLines: 4,
                validator: (value) => value?.isEmpty == true ? 'Content is required' : null,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectedCategory,
                decoration: const InputDecoration(labelText: 'Category'),
                items: ['General', 'Academic', 'Events', 'Sports', 'Administrative', 'System']
                    .map((category) => DropdownMenuItem(value: category, child: Text(category)))
                    .toList(),
                onChanged: (value) => setState(() => _selectedCategory = value!),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectedPriority,
                decoration: const InputDecoration(labelText: 'Priority'),
                items: ['Low', 'Normal', 'Medium', 'High', 'Important']
                    .map((priority) => DropdownMenuItem(value: priority, child: Text(priority)))
                    .toList(),
                onChanged: (value) => setState(() => _selectedPriority = value!),
              ),
              const SizedBox(height: 16),
              CheckboxListTile(
                title: const Text('Publish immediately'),
                value: _isPublished,
                onChanged: (value) => setState(() => _isPublished = value!),
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
          onPressed: () {
            if (_formKey.currentState!.validate()) {
              final updatedAnnouncement = {
                ...widget.announcement,
                'title': _titleController.text,
                'content': _contentController.text,
                'category': _selectedCategory,
                'priority': _selectedPriority,
                'isPublished': _isPublished,
              };
              Navigator.pop(context, updatedAnnouncement);
            }
          },
          child: const Text('Update Announcement'),
        ),
      ],
    );
  }
} 