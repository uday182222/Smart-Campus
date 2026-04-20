import 'package:flutter/material.dart';
import '../../core/utils/responsive_utils.dart';
import '../../core/constants/app_constants.dart';
import '../../models/class_model.dart';
import '../../services/announcement_service.dart';

class TeacherAnnouncementScreen extends StatefulWidget {
  const TeacherAnnouncementScreen({super.key});

  @override
  State<TeacherAnnouncementScreen> createState() => _TeacherAnnouncementScreenState();
}

class _TeacherAnnouncementScreenState extends State<TeacherAnnouncementScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedCategory = 'All';
  String _selectedClass = 'All';
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
      // Get announcements for teachers and class-specific announcements
      _announcements = AnnouncementService.getAnnouncementsForRole(AppConstants.roleTeacher);
    });
  }

  List<Map<String, dynamic>> get _filteredAnnouncements {
    return _announcements.where((announcement) {
      final matchesSearch = announcement['title'].toLowerCase().contains(_searchController.text.toLowerCase()) ||
                           announcement['content'].toLowerCase().contains(_searchController.text.toLowerCase());
      final matchesCategory = _selectedCategory == 'All' || announcement['category'] == _selectedCategory;
      final matchesClass = _selectedClass == 'All' || announcement['classId'] == _selectedClass;
      final matchesUnread = !_showUnreadOnly || announcement['isUnread'] == true;

      return matchesSearch && matchesCategory && matchesClass && matchesUnread;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final isMobile = ResponsiveUtils.isMobile(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Class Announcements'),
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
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
                            'Class Announcements',
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
                        'Send announcements to parents of specific classes',
                        style: ResponsiveUtils.getResponsiveBodyStyle(context),
                      ),
                    ],
                  ),
                ),
                if (!isMobile)
                  ElevatedButton.icon(
                    onPressed: () => _showAddAnnouncementDialog(context),
                    icon: const Icon(Icons.add),
                    label: const Text('New Announcement'),
                    style: ResponsiveUtils.getResponsiveButtonStyle(context),
                  ),
              ],
            ),
            
            SizedBox(height: ResponsiveUtils.getResponsiveSpacing(context)),
            
            // Search and Filters
            _buildSearchAndFilters(context),
            
            // Filter Options
            SizedBox(height: ResponsiveUtils.getResponsiveSpacing(context)),
            Row(
              children: [
                Checkbox(
                  value: _showUnreadOnly,
                  onChanged: (value) {
                    setState(() => _showUnreadOnly = value ?? false);
                  },
                ),
                const Text('Show unread only'),
                const Spacer(),
                TextButton.icon(
                  onPressed: () {
                    setState(() {
                      for (var announcement in _announcements) {
                        announcement['isRead'] = true;
                        announcement['isUnread'] = false;
                      }
                    });
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('All announcements marked as read')),
                    );
                  },
                  icon: const Icon(Icons.done_all),
                  label: const Text('Mark all as read'),
                ),
              ],
            ),
            
            SizedBox(height: ResponsiveUtils.getResponsiveSpacing(context)),
          
            // Announcements List
            Expanded(
              child: _buildAnnouncementsList(context),
            ),
            
            // Mobile Add Button
            if (isMobile) ...[
              SizedBox(height: ResponsiveUtils.getResponsiveSpacing(context)),
              ElevatedButton.icon(
                onPressed: () => _showAddAnnouncementDialog(context),
                icon: const Icon(Icons.add),
                label: const Text('New Announcement'),
                style: ResponsiveUtils.getResponsiveButtonStyle(context),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSearchAndFilters(BuildContext context) {
    final isMobile = ResponsiveUtils.isMobile(context);
    
    return Container(
      padding: ResponsiveUtils.getResponsivePadding(context),
      decoration: ResponsiveUtils.getResponsiveCardDecoration(context),
      child: isMobile
          ? Column(
              children: [
                _buildSearchBar(context),
                SizedBox(height: ResponsiveUtils.getResponsiveSpacing(context)),
                _buildFilterDropdowns(context),
              ],
            )
          : Row(
              children: [
                Expanded(child: _buildSearchBar(context)),
                SizedBox(width: ResponsiveUtils.getResponsiveSpacing(context)),
                Expanded(child: _buildFilterDropdowns(context)),
              ],
            ),
    );
  }

  Widget _buildSearchBar(BuildContext context) {
    return TextField(
      controller: _searchController,
      onChanged: (value) => setState(() {}),
      decoration: ResponsiveUtils.getResponsiveInputDecoration(context, 'Search announcements...')
          .copyWith(
            prefixIcon: const Icon(Icons.search),
            suffixIcon: _searchController.text.isNotEmpty
                ? IconButton(
                    onPressed: () {
                      _searchController.clear();
                      setState(() {});
                    },
                    icon: const Icon(Icons.clear),
                  )
                : null,
      ),
    );
  }

  Widget _buildFilterDropdowns(BuildContext context) {
    final isMobile = ResponsiveUtils.isMobile(context);
    
    if (isMobile) {
      return Column(
        children: [
          DropdownButtonFormField<String>(
            value: _selectedCategory,
            decoration: ResponsiveUtils.getResponsiveInputDecoration(context, 'Category'),
            items: ['All', 'Homework', 'Exam', 'Project', 'General', 'Reminder']
                .map((category) => DropdownMenuItem(value: category, child: Text(category)))
                .toList(),
            onChanged: (value) => setState(() => _selectedCategory = value!),
          ),
          SizedBox(height: ResponsiveUtils.getResponsiveSpacing(context)),
          DropdownButtonFormField<String>(
            value: _selectedClass,
            decoration: ResponsiveUtils.getResponsiveInputDecoration(context, 'Class'),
            items: [
              const DropdownMenuItem(value: 'All', child: Text('All Classes')),
              ...mockClasses.map((cls) => DropdownMenuItem(
                value: cls.id,
                child: Text(cls.displayName),
              )),
            ],
            onChanged: (value) => setState(() => _selectedClass = value!),
          ),
        ],
      );
    } else {
      return Row(
        children: [
          Expanded(
            child: DropdownButtonFormField<String>(
              value: _selectedCategory,
              decoration: ResponsiveUtils.getResponsiveInputDecoration(context, 'Category'),
              items: ['All', 'Homework', 'Exam', 'Project', 'General', 'Reminder']
                  .map((category) => DropdownMenuItem(value: category, child: Text(category)))
                  .toList(),
              onChanged: (value) => setState(() => _selectedCategory = value!),
            ),
          ),
          SizedBox(width: ResponsiveUtils.getResponsiveSpacing(context)),
          Expanded(
            child: DropdownButtonFormField<String>(
              value: _selectedClass,
              decoration: ResponsiveUtils.getResponsiveInputDecoration(context, 'Class'),
              items: [
                const DropdownMenuItem(value: 'All', child: Text('All Classes')),
                ...mockClasses.map((cls) => DropdownMenuItem(
                  value: cls.id,
                  child: Text(cls.displayName),
                )),
              ],
              onChanged: (value) => setState(() => _selectedClass = value!),
            ),
          ),
        ],
      );
    }
  }

  Widget _buildAnnouncementsList(BuildContext context) {
    return ListView.builder(
      itemCount: _filteredAnnouncements.length,
      itemBuilder: (context, index) {
        final announcement = _filteredAnnouncements[index];
        return _buildResponsiveAnnouncementCard(context, announcement);
      },
    );
  }

  Widget _buildResponsiveAnnouncementCard(BuildContext context, Map<String, dynamic> announcement) {
    final isMobile = ResponsiveUtils.isMobile(context);
    final isUnread = announcement['isUnread'] == true;
    final className = announcement['className'];
    final category = announcement['category'];
    
    return Card(
      margin: EdgeInsets.only(bottom: ResponsiveUtils.getResponsiveSpacing(context)),
      color: isUnread ? Colors.blue.shade50 : null,
      child: Padding(
        padding: ResponsiveUtils.getResponsivePadding(context),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Stack(
                  children: [
                    CircleAvatar(
                      radius: ResponsiveUtils.getResponsiveIconSize(context) / 2,
                      backgroundColor: AppConstants.primaryColor,
                      child: Icon(
                        Icons.announcement,
                        color: Colors.white,
                        size: ResponsiveUtils.getResponsiveIconSize(context) / 2,
                      ),
                    ),
                    if (isUnread)
                      Positioned(
                        right: 0,
                        top: 0,
                        child: Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                        ),
                      ),
                  ],
                ),
                SizedBox(width: ResponsiveUtils.getResponsiveSpacing(context)),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              announcement['title'],
                              style: ResponsiveUtils.getResponsiveHeadingStyle(
                                context,
                                fontSize: ResponsiveUtils.getResponsiveFontSize(context, mobile: 16, tablet: 18),
                              ).copyWith(
                                fontWeight: isUnread ? FontWeight.bold : FontWeight.normal,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppConstants.primaryColor,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              className,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              '${announcement['date']} • ${announcement['time']}',
                              style: ResponsiveUtils.getResponsiveCaptionStyle(context),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                _buildResponsiveCategoryChip(context, category),
              ],
            ),
            
            SizedBox(height: ResponsiveUtils.getResponsiveSpacing(context)),
            
            Text(
              announcement['content'],
              style: ResponsiveUtils.getResponsiveBodyStyle(context),
            ),
            
            SizedBox(height: ResponsiveUtils.getResponsiveSpacing(context)),
            
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildInfoRow('Category', category),
                      _buildInfoRow('Class', className),
                      _buildInfoRow('Status', announcement['isPublished'] ? 'Published' : 'Draft'),
                    ],
                  ),
                ),
                if (!isMobile) ...[
                  SizedBox(width: ResponsiveUtils.getResponsiveSpacing(context)),
                  _buildActionButtons(context, announcement),
                ],
              ],
            ),
            
            if (isMobile) ...[
              SizedBox(height: ResponsiveUtils.getResponsiveSpacing(context)),
              _buildActionButtons(context, announcement),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Text(
            '$label: ',
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }

  Widget _buildResponsiveCategoryChip(BuildContext context, String category) {
    Color color;
    switch (category) {
      case 'Homework':
        color = Colors.blue;
        break;
      case 'Exam':
        color = Colors.red;
        break;
      case 'Project':
        color = Colors.purple;
        break;
      case 'General':
        color = Colors.green;
        break;
      case 'Reminder':
        color = Colors.orange;
        break;
      default:
        color = AppConstants.textSecondary;
    }
    
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: ResponsiveUtils.getResponsiveSpacing(context),
        vertical: 4,
      ),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        category,
        style: TextStyle(
          color: color,
          fontSize: ResponsiveUtils.getResponsiveFontSize(context, mobile: 11, tablet: 12),
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildActionButtons(BuildContext context, Map<String, dynamic> announcement) {
    final isUnread = announcement['isUnread'] == true;
    
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        OutlinedButton.icon(
          onPressed: () {
            _viewAnnouncement(context, announcement);
            if (isUnread) {
              _markAsRead(announcement);
            }
          },
          icon: const Icon(Icons.visibility, size: 16),
          label: const Text('View'),
          style: ResponsiveUtils.getResponsiveButtonStyle(context),
        ),
        SizedBox(width: ResponsiveUtils.getResponsiveSpacing(context)),
        OutlinedButton.icon(
          onPressed: () => _editAnnouncement(context, announcement),
          icon: const Icon(Icons.edit, size: 16),
          label: const Text('Edit'),
          style: ResponsiveUtils.getResponsiveButtonStyle(context),
        ),
        SizedBox(width: ResponsiveUtils.getResponsiveSpacing(context)),
        OutlinedButton.icon(
          onPressed: () => _resendAnnouncement(context, announcement),
          icon: const Icon(Icons.send, size: 16),
          label: const Text('Resend'),
          style: ResponsiveUtils.getResponsiveButtonStyle(context),
        ),
        SizedBox(width: ResponsiveUtils.getResponsiveSpacing(context)),
        OutlinedButton.icon(
          onPressed: () => _deleteAnnouncement(context, announcement),
          icon: const Icon(Icons.delete, size: 16),
          label: const Text('Delete'),
          style: ResponsiveUtils.getResponsiveButtonStyle(context).copyWith(
            foregroundColor: MaterialStateProperty.all(AppConstants.errorColor),
          ),
        ),
      ],
    );
  }

  void _showAddAnnouncementDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => const AddTeacherAnnouncementDialog(),
    ).then((result) {
      if (result != null) {
        setState(() {
          _announcements.add(result);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Announcement "${result['title']}" sent to parents successfully')),
        );
      }
    });
  }

  void _viewAnnouncement(BuildContext context, Map<String, dynamic> announcement) {
    showDialog(
      context: context,
      builder: (context) => ViewTeacherAnnouncementDialog(announcement: announcement),
    );
  }

  void _editAnnouncement(BuildContext context, Map<String, dynamic> announcement) {
    showDialog(
      context: context,
      builder: (context) => EditTeacherAnnouncementDialog(announcement: announcement),
    ).then((result) {
      if (result != null) {
        setState(() {
          final index = _announcements.indexWhere((a) => a['id'] == announcement['id']);
          if (index != -1) {
            _announcements[index] = result;
          }
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Announcement "${result['title']}" updated successfully')),
        );
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
            onPressed: () {
              setState(() {
                _announcements.removeWhere((a) => a['id'] == announcement['id']);
              });
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('"${announcement['title']}" deleted successfully')),
              );
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  void _markAsRead(Map<String, dynamic> announcement) {
    setState(() {
      announcement['isRead'] = true;
      announcement['isUnread'] = false;
    });
  }

  void _resendAnnouncement(BuildContext context, Map<String, dynamic> announcement) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Resending announcement to parents of ${announcement['className']}')),
    );
  }
}

// Add Teacher Announcement Dialog
class AddTeacherAnnouncementDialog extends StatefulWidget {
  const AddTeacherAnnouncementDialog({super.key});

  @override
  State<AddTeacherAnnouncementDialog> createState() => _AddTeacherAnnouncementDialogState();
}

class _AddTeacherAnnouncementDialogState extends State<AddTeacherAnnouncementDialog> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  String _selectedCategory = 'Homework';
  String _selectedClass = '';
  bool _isPublished = true;
  bool _isUrgent = false;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Send Class Announcement'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Title',
                  hintText: 'e.g., Math Assignment Due',
                ),
                validator: (value) => value?.isEmpty == true ? 'Title is required' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _contentController,
                decoration: const InputDecoration(
                  labelText: 'Message for Parents',
                  hintText: 'Enter the announcement details...',
                ),
                maxLines: 4,
                validator: (value) => value?.isEmpty == true ? 'Message is required' : null,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectedCategory,
                decoration: const InputDecoration(labelText: 'Category'),
                items: ['Homework', 'Exam', 'Project', 'General', 'Reminder']
                    .map((category) => DropdownMenuItem(value: category, child: Text(category)))
                    .toList(),
                onChanged: (value) => setState(() => _selectedCategory = value!),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectedClass.isEmpty ? null : _selectedClass,
                decoration: const InputDecoration(
                  labelText: 'Select Class *',
                  hintText: 'Choose a class to send announcement to',
                ),
                items: mockClasses.map((cls) => DropdownMenuItem(
                  value: cls.id,
                  child: Text(cls.displayName),
                )).toList(),
                validator: (value) => value == null ? 'Please select a class' : null,
                onChanged: (value) => setState(() => _selectedClass = value!),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Checkbox(
                    value: _isUrgent,
                    onChanged: (value) => setState(() => _isUrgent = value!),
                  ),
                  const Text('Mark as urgent'),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Checkbox(
                    value: _isPublished,
                    onChanged: (value) => setState(() => _isPublished = value!),
                  ),
                  const Text('Send immediately'),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'This announcement will be sent to all parents of students in the selected class.',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade600,
                  fontStyle: FontStyle.italic,
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
          onPressed: () {
            if (_formKey.currentState!.validate()) {
              final selectedClass = mockClasses.firstWhere((cls) => cls.id == _selectedClass);
              final newAnnouncement = {
                'id': DateTime.now().millisecondsSinceEpoch.toString(),
                'title': _titleController.text,
                'content': _contentController.text,
                'category': _selectedCategory,
                'classId': _selectedClass,
                'className': selectedClass.displayName,
                'date': DateTime.now().toString().split(' ')[0],
                'time': '${DateTime.now().hour}:${DateTime.now().minute.toString().padLeft(2, '0')}',
                'isPublished': _isPublished,
                'isUrgent': _isUrgent,
                'isRead': false,
                'isUnread': true,
              };
              Navigator.pop(context, newAnnouncement);
            }
          },
          child: const Text('Send to Parents'),
        ),
      ],
    );
  }
}

// View Teacher Announcement Dialog
class ViewTeacherAnnouncementDialog extends StatelessWidget {
  final Map<String, dynamic> announcement;

  const ViewTeacherAnnouncementDialog({super.key, required this.announcement});

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
            _buildInfoRow('Message', announcement['content']),
            _buildInfoRow('Category', announcement['category']),
            _buildInfoRow('Class', announcement['className']),
            _buildInfoRow('Date', announcement['date']),
            _buildInfoRow('Time', announcement['time']),
            _buildInfoRow('Status', announcement['isPublished'] ? 'Published' : 'Draft'),
            if (announcement['isUrgent'] == true)
              _buildInfoRow('Priority', 'Urgent'),
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

// Edit Teacher Announcement Dialog
class EditTeacherAnnouncementDialog extends StatefulWidget {
  final Map<String, dynamic> announcement;

  const EditTeacherAnnouncementDialog({super.key, required this.announcement});

  @override
  State<EditTeacherAnnouncementDialog> createState() => _EditTeacherAnnouncementDialogState();
}

class _EditTeacherAnnouncementDialogState extends State<EditTeacherAnnouncementDialog> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleController;
  late TextEditingController _contentController;
  late String _selectedCategory;
  late bool _isPublished;
  late bool _isUrgent;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.announcement['title']);
    _contentController = TextEditingController(text: widget.announcement['content']);
    _selectedCategory = widget.announcement['category'];
    _isPublished = widget.announcement['isPublished'];
    _isUrgent = widget.announcement['isUrgent'] ?? false;
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
                decoration: const InputDecoration(labelText: 'Message for Parents'),
                maxLines: 4,
                validator: (value) => value?.isEmpty == true ? 'Message is required' : null,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectedCategory,
                decoration: const InputDecoration(labelText: 'Category'),
                items: ['Homework', 'Exam', 'Project', 'General', 'Reminder']
                    .map((category) => DropdownMenuItem(value: category, child: Text(category)))
                    .toList(),
                onChanged: (value) => setState(() => _selectedCategory = value!),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Checkbox(
                    value: _isUrgent,
                    onChanged: (value) => setState(() => _isUrgent = value!),
                  ),
                  const Text('Mark as urgent'),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Checkbox(
                    value: _isPublished,
                    onChanged: (value) => setState(() => _isPublished = value!),
                  ),
                  const Text('Publish immediately'),
                ],
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
                'isPublished': _isPublished,
                'isUrgent': _isUrgent,
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
