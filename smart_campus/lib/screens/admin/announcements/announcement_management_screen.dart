import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/utils/responsive_utils.dart';
import '../../../services/announcement_service.dart';

class AnnouncementManagementScreen extends StatefulWidget {
  const AnnouncementManagementScreen({super.key});

  @override
  State<AnnouncementManagementScreen> createState() => _AnnouncementManagementScreenState();
}

class _AnnouncementManagementScreenState extends State<AnnouncementManagementScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedCategory = 'All Categories';
  String _selectedStatus = 'All Status';
  String _selectedTarget = 'All Targets';

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
      // Get all announcements for super admin
      _announcements = AnnouncementService.getAllAnnouncements();
    });
  }

  final List<String> _categories = [
    'All Categories',
    'General',
    'Academic',
    'Events',
    'Financial',
    'Sports',
    'Safety',
    'Technology',
  ];

  final List<String> _statuses = [
    'All Status',
    'Active',
    'Draft',
    'Expired',
    'Archived',
  ];

  final List<String> _targets = [
    'All Targets',
    'All',
    'Students',
    'Parents',
    'Teachers',
    'Staff',
    'Students & Parents',
    'Students & Teachers',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppConstants.paddingLarge),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Icon(
                  Icons.announcement,
                  size: ResponsiveUtils.getResponsiveIconSize(
                    context,
                    mobile: 28,
                    tablet: 32,
                    desktop: 36,
                  ),
                  color: AppConstants.schoolAdminColor,
                ),
                const SizedBox(width: AppConstants.paddingMedium),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Announcement Management',
                        style: ResponsiveUtils.getResponsiveHeadingStyle(
                          context,
                          fontSize: ResponsiveUtils.getResponsiveFontSize(
                            context,
                            mobile: 20,
                            tablet: 24,
                            desktop: 28,
                          ),
                        ),
                      ),
                      Text(
                        'Create and manage school-wide announcements',
                        style: ResponsiveUtils.getResponsiveCaptionStyle(
                          context,
                          fontSize: ResponsiveUtils.getResponsiveFontSize(
                            context,
                            mobile: 12,
                            tablet: 14,
                            desktop: 16,
                          ),
                          color: AppConstants.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: () => _showAddAnnouncementDialog(),
                  icon: const Icon(Icons.add),
                  label: const Text('New Announcement'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppConstants.schoolAdminColor,
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: AppConstants.paddingLarge),
            
            // Filters and Search
            _buildFiltersAndSearch(context),
            
            const SizedBox(height: AppConstants.paddingLarge),
            
            // Summary Cards
            _buildSummaryCards(context),
            
            const SizedBox(height: AppConstants.paddingLarge),
            
            // Announcements List
            _buildAnnouncementsList(context),
          ],
        ),
      ),
    );
  }

  Widget _buildFiltersAndSearch(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppConstants.paddingMedium),
      decoration: BoxDecoration(
        color: AppConstants.surfaceColor,
        borderRadius: BorderRadius.circular(AppConstants.borderRadiusMedium),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Filters & Search',
            style: ResponsiveUtils.getResponsiveSubheadingStyle(
              context,
              fontSize: ResponsiveUtils.getResponsiveFontSize(
                context,
                mobile: 16,
                tablet: 18,
                desktop: 20,
              ),
            ),
          ),
          const SizedBox(height: AppConstants.paddingMedium),
          
          // Search Bar
          TextField(
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
          ),
          
          const SizedBox(height: AppConstants.paddingMedium),
          
          // Filter Dropdowns
          Wrap(
            spacing: AppConstants.paddingMedium,
            runSpacing: AppConstants.paddingMedium,
            children: [
              _buildFilterDropdown(
                context,
                'Category',
                _selectedCategory,
                _categories,
                (value) => setState(() => _selectedCategory = value!),
              ),
              _buildFilterDropdown(
                context,
                'Status',
                _selectedStatus,
                _statuses,
                (value) => setState(() => _selectedStatus = value!),
              ),
              _buildFilterDropdown(
                context,
                'Target',
                _selectedTarget,
                _targets,
                (value) => setState(() => _selectedTarget = value!),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFilterDropdown(
    BuildContext context,
    String label,
    String value,
    List<String> items,
    ValueChanged<String?> onChanged,
  ) {
    return SizedBox(
      width: ResponsiveUtils.isMobile(context) ? double.infinity : 200,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: ResponsiveUtils.getResponsiveCaptionStyle(
              context,
              fontSize: ResponsiveUtils.getResponsiveFontSize(
                context,
                mobile: 12,
                tablet: 14,
                desktop: 16,
              ),
              color: AppConstants.textSecondary,
            ),
          ),
          const SizedBox(height: AppConstants.paddingSmall),
          DropdownButtonFormField<String>(
            value: value,
            decoration: ResponsiveUtils.getResponsiveInputDecoration(context, ''),
            items: items.map((item) => DropdownMenuItem(
              value: item,
              child: Text(item),
            )).toList(),
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryCards(BuildContext context) {
    final filteredData = _getFilteredData();
    final totalAnnouncements = filteredData.length;
    final activeAnnouncements = filteredData.where((announcement) => announcement['status'] == 'Active').length;
    final expiredAnnouncements = filteredData.where((announcement) => announcement['status'] == 'Expired').length;
    final highPriorityAnnouncements = filteredData.where((announcement) => announcement['priority'] == 'High').length;

    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: ResponsiveUtils.isMobile(context) ? 2 : 4,
      crossAxisSpacing: AppConstants.paddingMedium,
      mainAxisSpacing: AppConstants.paddingMedium,
      childAspectRatio: ResponsiveUtils.isMobile(context) ? 1.2 : 1.5,
      children: [
        _buildSummaryCard(
          context,
          'Total',
          totalAnnouncements.toString(),
          Icons.announcement,
          AppConstants.primaryColor,
        ),
        _buildSummaryCard(
          context,
          'Active',
          activeAnnouncements.toString(),
          Icons.check_circle,
          AppConstants.successColor,
        ),
        _buildSummaryCard(
          context,
          'Expired',
          expiredAnnouncements.toString(),
          Icons.schedule,
          AppConstants.warningColor,
        ),
        _buildSummaryCard(
          context,
          'High Priority',
          highPriorityAnnouncements.toString(),
          Icons.priority_high,
          AppConstants.errorColor,
        ),
      ],
    );
  }

  Widget _buildSummaryCard(
    BuildContext context,
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(AppConstants.paddingMedium),
      decoration: BoxDecoration(
        color: AppConstants.surfaceColor,
        borderRadius: BorderRadius.circular(AppConstants.borderRadiusMedium),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: ResponsiveUtils.getResponsiveIconSize(
              context,
              mobile: 24,
              tablet: 28,
              desktop: 32,
            ),
            color: color,
          ),
          const SizedBox(height: AppConstants.paddingMedium),
          Text(
            value,
            style: ResponsiveUtils.getResponsiveHeadingStyle(
              context,
              fontSize: ResponsiveUtils.getResponsiveFontSize(
                context,
                mobile: 16,
                tablet: 18,
                desktop: 20,
              ),
              color: color,
            ),
          ),
          Text(
            title,
            style: ResponsiveUtils.getResponsiveCaptionStyle(
              context,
              fontSize: ResponsiveUtils.getResponsiveFontSize(
                context,
                mobile: 10,
                tablet: 12,
                desktop: 14,
              ),
              color: AppConstants.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildAnnouncementsList(BuildContext context) {
    final filteredData = _getFilteredData();
    
    if (filteredData.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(AppConstants.paddingLarge),
        decoration: BoxDecoration(
          color: AppConstants.surfaceColor,
          borderRadius: BorderRadius.circular(AppConstants.borderRadiusMedium),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Center(
          child: Column(
            children: [
              Icon(
                Icons.announcement_outlined,
                size: 64,
                color: AppConstants.textSecondary,
              ),
              const SizedBox(height: AppConstants.paddingMedium),
              Text(
                'No announcements found',
                style: ResponsiveUtils.getResponsiveSubheadingStyle(
                  context,
                  fontSize: ResponsiveUtils.getResponsiveFontSize(
                    context,
                    mobile: 16,
                    tablet: 18,
                    desktop: 20,
                  ),
                  color: AppConstants.textSecondary,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: filteredData.length,
      itemBuilder: (context, index) {
        final announcement = filteredData[index];
        return Container(
          margin: const EdgeInsets.only(bottom: AppConstants.paddingMedium),
          decoration: BoxDecoration(
            color: AppConstants.surfaceColor,
            borderRadius: BorderRadius.circular(AppConstants.borderRadiusMedium),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.1),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.all(AppConstants.paddingMedium),
            leading: CircleAvatar(
              backgroundColor: _getPriorityColor(announcement['priority']),
              child: Icon(
                Icons.announcement,
                color: Colors.white,
              ),
            ),
            title: Row(
              children: [
                Expanded(
                  child: Text(
                    announcement['title'],
                    style: ResponsiveUtils.getResponsiveSubheadingStyle(
                      context,
                      fontSize: ResponsiveUtils.getResponsiveFontSize(
                        context,
                        mobile: 14,
                        tablet: 16,
                        desktop: 18,
                      ),
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: _getStatusColor(announcement['status']),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    announcement['status'],
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: AppConstants.paddingSmall),
                Text(
                  announcement['content'],
                  style: ResponsiveUtils.getResponsiveBodyStyle(
                    context,
                    fontSize: ResponsiveUtils.getResponsiveFontSize(
                      context,
                      mobile: 12,
                      tablet: 14,
                      desktop: 16,
                    ),
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: AppConstants.paddingSmall),
                Row(
                  children: [
                    Icon(
                      Icons.category,
                      size: 16,
                      color: AppConstants.textSecondary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      announcement['category'],
                      style: ResponsiveUtils.getResponsiveCaptionStyle(
                        context,
                        fontSize: ResponsiveUtils.getResponsiveFontSize(
                          context,
                          mobile: 10,
                          tablet: 12,
                          desktop: 14,
                        ),
                        color: AppConstants.textSecondary,
                      ),
                    ),
                    const SizedBox(width: AppConstants.paddingMedium),
                    Icon(
                      Icons.people,
                      size: 16,
                      color: AppConstants.textSecondary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      announcement['target'],
                      style: ResponsiveUtils.getResponsiveCaptionStyle(
                        context,
                        fontSize: ResponsiveUtils.getResponsiveFontSize(
                          context,
                          mobile: 10,
                          tablet: 12,
                          desktop: 14,
                        ),
                        color: AppConstants.textSecondary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppConstants.paddingSmall),
                Row(
                  children: [
                    Icon(
                      Icons.access_time,
                      size: 16,
                      color: AppConstants.textSecondary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Created: ${announcement['createdAt']}',
                      style: ResponsiveUtils.getResponsiveCaptionStyle(
                        context,
                        fontSize: ResponsiveUtils.getResponsiveFontSize(
                          context,
                          mobile: 10,
                          tablet: 12,
                          desktop: 14,
                        ),
                        color: AppConstants.textSecondary,
                      ),
                    ),
                    const SizedBox(width: AppConstants.paddingMedium),
                    Icon(
                      Icons.schedule,
                      size: 16,
                      color: AppConstants.textSecondary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Expires: ${announcement['expiresAt']}',
                      style: ResponsiveUtils.getResponsiveCaptionStyle(
                        context,
                        fontSize: ResponsiveUtils.getResponsiveFontSize(
                          context,
                          mobile: 10,
                          tablet: 12,
                          desktop: 14,
                        ),
                        color: AppConstants.textSecondary,
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
                    _viewAnnouncement(announcement);
                    break;
                  case 'edit':
                    _editAnnouncement(announcement);
                    break;
                  case 'duplicate':
                    _duplicateAnnouncement(announcement);
                    break;
                  case 'delete':
                    _deleteAnnouncement(announcement);
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
                  value: 'duplicate',
                  child: Row(
                    children: [
                      Icon(Icons.copy),
                      SizedBox(width: 8),
                      Text('Duplicate'),
                    ],
                  ),
                ),
                const PopupMenuItem(
                  value: 'delete',
                  child: Row(
                    children: [
                      Icon(Icons.delete, color: Colors.red),
                      SizedBox(width: 8),
                      Text('Delete', style: TextStyle(color: Colors.red)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  List<Map<String, dynamic>> _getFilteredData() {
    List<Map<String, dynamic>> filtered = List.from(_announcements);
    
    // Filter by search
    if (_searchController.text.isNotEmpty) {
      filtered = filtered.where((announcement) =>
        announcement['title'].toLowerCase().contains(_searchController.text.toLowerCase()) ||
        announcement['content'].toLowerCase().contains(_searchController.text.toLowerCase())
      ).toList();
    }
    
    // Filter by category
    if (_selectedCategory != 'All Categories') {
      filtered = filtered.where((announcement) => announcement['category'] == _selectedCategory).toList();
    }
    
    // Filter by status
    if (_selectedStatus != 'All Status') {
      filtered = filtered.where((announcement) => announcement['status'] == _selectedStatus).toList();
    }
    
    // Filter by target
    if (_selectedTarget != 'All Targets') {
      filtered = filtered.where((announcement) => announcement['target'] == _selectedTarget).toList();
    }
    
    return filtered;
  }

  Color _getPriorityColor(String priority) {
    switch (priority) {
      case 'High':
        return AppConstants.errorColor;
      case 'Medium':
        return AppConstants.warningColor;
      case 'Low':
        return AppConstants.successColor;
      default:
        return AppConstants.secondaryColor;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Active':
        return AppConstants.successColor;
      case 'Draft':
        return AppConstants.warningColor;
      case 'Expired':
        return AppConstants.errorColor;
      case 'Archived':
        return AppConstants.secondaryColor;
      default:
        return AppConstants.textSecondary;
    }
  }

  void _showAddAnnouncementDialog() {
    showDialog(
      context: context,
      builder: (context) => const AddAnnouncementDialog(),
    );
  }

  void _viewAnnouncement(Map<String, dynamic> announcement) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(announcement['title']),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Content: ${announcement['content']}'),
              const SizedBox(height: AppConstants.paddingMedium),
              Text('Category: ${announcement['category']}'),
              Text('Target: ${announcement['target']}'),
              Text('Status: ${announcement['status']}'),
              Text('Priority: ${announcement['priority']}'),
              Text('Created By: ${announcement['createdBy']}'),
              Text('Created At: ${announcement['createdAt']}'),
              Text('Expires At: ${announcement['expiresAt']}'),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _editAnnouncement(Map<String, dynamic> announcement) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Editing ${announcement['title']}...'),
        backgroundColor: AppConstants.infoColor,
      ),
    );
  }

  void _duplicateAnnouncement(Map<String, dynamic> announcement) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Duplicating ${announcement['title']}...'),
        backgroundColor: AppConstants.infoColor,
      ),
    );
  }

  void _deleteAnnouncement(Map<String, dynamic> announcement) {
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
          ElevatedButton(
            onPressed: () {
              setState(() {
                _announcements.removeWhere((item) => item['id'] == announcement['id']);
              });
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Announcement deleted successfully'),
                  backgroundColor: AppConstants.successColor,
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppConstants.errorColor,
              foregroundColor: Colors.white,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}

// Add Announcement Dialog
class AddAnnouncementDialog extends StatefulWidget {
  const AddAnnouncementDialog({super.key});

  @override
  State<AddAnnouncementDialog> createState() => _AddAnnouncementDialogState();
}

class _AddAnnouncementDialogState extends State<AddAnnouncementDialog> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  String _selectedCategory = 'General';
  String _selectedTarget = 'All';
  String _selectedPriority = 'Medium';
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 7));

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('New Announcement'),
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
                maxLines: 3,
                validator: (value) => value?.isEmpty == true ? 'Content is required' : null,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectedCategory,
                decoration: const InputDecoration(labelText: 'Category'),
                items: ['General', 'Academic', 'Events', 'Financial', 'Sports', 'Safety', 'Technology']
                    .map((category) => DropdownMenuItem(value: category, child: Text(category)))
                    .toList(),
                onChanged: (value) => setState(() => _selectedCategory = value!),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectedTarget,
                decoration: const InputDecoration(labelText: 'Target Audience'),
                items: ['All', 'Students', 'Parents', 'Teachers', 'Staff', 'Students & Parents', 'Students & Teachers']
                    .map((target) => DropdownMenuItem(value: target, child: Text(target)))
                    .toList(),
                onChanged: (value) => setState(() => _selectedTarget = value!),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectedPriority,
                decoration: const InputDecoration(labelText: 'Priority'),
                items: ['Low', 'Medium', 'High']
                    .map((priority) => DropdownMenuItem(value: priority, child: Text(priority)))
                    .toList(),
                onChanged: (value) => setState(() => _selectedPriority = value!),
              ),
              const SizedBox(height: 16),
              ListTile(
                title: const Text('Expiry Date'),
                subtitle: Text('${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}'),
                trailing: const Icon(Icons.calendar_today),
                onTap: () async {
                  final date = await showDatePicker(
                    context: context,
                    initialDate: _selectedDate,
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                  );
                  if (date != null) {
                    setState(() => _selectedDate = date);
                  }
                },
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
              // Here you would typically save the announcement
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Announcement created successfully'),
                  backgroundColor: AppConstants.successColor,
                ),
              );
            }
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: AppConstants.schoolAdminColor,
            foregroundColor: Colors.white,
          ),
          child: const Text('Create'),
        ),
      ],
    );
  }
}
