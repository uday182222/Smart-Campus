import 'dart:io';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:pdf/widgets.dart' as pw;
import '../../../core/constants/app_constants.dart';
import '../../../core/utils/responsive_utils.dart';
import 'activity_details_screen.dart';

class ActivityLogScreen extends StatefulWidget {
  const ActivityLogScreen({super.key});

  @override
  State<ActivityLogScreen> createState() => _ActivityLogScreenState();
}

class _ActivityLogScreenState extends State<ActivityLogScreen> {
  String _selectedFilter = 'All';
  String _selectedCategory = 'All';
  DateTimeRange? _dateRange;
  final List<String> _filters = ['All', 'Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days'];
  final List<String> _categories = ['All', 'User Management', 'School Management', 'Announcements', 'System', 'Security'];

  @override
  Widget build(BuildContext context) {
    final isMobile = ResponsiveUtils.isMobile(context);
    final isTablet = ResponsiveUtils.isTablet(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Activity Log'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
        actions: [
          IconButton(
            onPressed: () => _showFilterSheet(context),
            icon: const Icon(Icons.filter_list),
            tooltip: 'Filter',
          ),
          IconButton(
            onPressed: () => _exportActivityLog(context),
            icon: const Icon(Icons.download),
            tooltip: 'Export Activity Log',
          ),
        ],
      ),
      body: Column(
        children: [
          // Filters
          _buildFilters(context, isMobile, isTablet),
          
          // Activity List
          Expanded(
            child: _buildActivityList(context, isMobile, isTablet),
          ),
        ],
      ),
    );
  }

  Widget _buildFilters(BuildContext context, bool isMobile, bool isTablet) {
    return Container(
      padding: EdgeInsets.all(isMobile ? 12 : 16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 5,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Time Filter
          Row(
            children: [
              Text(
                'Time Period:',
                style: TextStyle(
                  fontSize: isMobile ? 14 : 16,
                  fontWeight: FontWeight.bold,
                  color: AppConstants.textPrimary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _selectedFilter,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  items: _filters.map((filter) {
                    return DropdownMenuItem(
                      value: filter,
                      child: Text(filter),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedFilter = value!;
                    });
                  },
                ),
              ),
            ],
          ),
          
          SizedBox(height: isMobile ? 12 : 16),
          
          // Category Filter
          Row(
            children: [
              Text(
                'Category:',
                style: TextStyle(
                  fontSize: isMobile ? 14 : 16,
                  fontWeight: FontWeight.bold,
                  color: AppConstants.textPrimary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _selectedCategory,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  items: _categories.map((category) {
                    return DropdownMenuItem(
                      value: category,
                      child: Text(category),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedCategory = value!;
                    });
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActivityList(BuildContext context, bool isMobile, bool isTablet) {
    final filteredActivities = _getFilteredActivities();
    
    if (filteredActivities.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.history,
              size: isMobile ? 64 : 80,
              color: AppConstants.textSecondary,
            ),
            SizedBox(height: isMobile ? 16 : 24),
            Text(
              'No activities found',
              style: TextStyle(
                fontSize: isMobile ? 18 : 20,
                fontWeight: FontWeight.bold,
                color: AppConstants.textSecondary,
              ),
            ),
            SizedBox(height: isMobile ? 8 : 12),
            Text(
              'Try adjusting your filters or check back later',
              style: TextStyle(
                fontSize: isMobile ? 14 : 16,
                color: AppConstants.textLight,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: EdgeInsets.all(isMobile ? 12 : 16),
      itemCount: filteredActivities.length,
      itemBuilder: (context, index) {
        final activity = filteredActivities[index];
        return _buildActivityItem(context, activity, isMobile, isTablet);
      },
    );
  }

  Widget _buildActivityItem(BuildContext context, Map<String, dynamic> activity, bool isMobile, bool isTablet) {
    return Card(
      margin: EdgeInsets.only(bottom: isMobile ? 8 : 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: activity['color'].withValues(alpha: 0.1),
          child: Icon(
            activity['icon'],
            color: activity['color'],
            size: ResponsiveUtils.getResponsiveIconSize(context, mobile: 16, tablet: 18),
          ),
        ),
        title: Text(
          activity['type'],
          style: ResponsiveUtils.getResponsiveBodyStyle(
            context,
            fontWeight: FontWeight.w600,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              activity['description'],
              style: ResponsiveUtils.getResponsiveBodyStyle(context),
            ),
            Row(
              children: [
                Icon(
                  Icons.access_time,
                  size: isMobile ? 12 : 14,
                  color: AppConstants.textLight,
                ),
                const SizedBox(width: 4),
                Text(
                  activity['time'],
                  style: ResponsiveUtils.getResponsiveCaptionStyle(context),
                ),
                const SizedBox(width: 16),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: _getCategoryColor(activity['category']).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    activity['category'],
                    style: TextStyle(
                      fontSize: isMobile ? 10 : 12,
                      color: _getCategoryColor(activity['category']),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
        trailing: IconButton(
          onPressed: () => _viewActivityDetails(context, activity),
          icon: const Icon(Icons.arrow_forward_ios, size: 16),
        ),
      ),
    );
  }

  Color _getCategoryColor(String category) {
    switch (category) {
      case 'User Management':
        return AppConstants.primaryColor;
      case 'School Management':
        return AppConstants.secondaryColor;
      case 'Announcements':
        return AppConstants.warningColor;
      case 'System':
        return AppConstants.infoColor;
      case 'Security':
        return AppConstants.errorColor;
      default:
        return AppConstants.textSecondary;
    }
  }

  void _viewActivityDetails(BuildContext context, Map<String, dynamic> activity) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ActivityDetailsScreen(activity: activity),
      ),
    );
  }

  void _exportActivityLog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Export Activity Log'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Choose export format:'),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      _exportToCSV(context);
                    },
                    icon: const Icon(Icons.table_chart),
                    label: const Text('CSV'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      _exportToPDF(context);
                    },
                    icon: const Icon(Icons.picture_as_pdf),
                    label: const Text('PDF'),
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  Future<void> _exportToCSV(BuildContext context) async {
    try {
      final list = _getFilteredActivities();
      const header = 'Type,Description,Time,Category\n';
      final rows = list.map((a) {
        final type = '"${(a['type'] as String).replaceAll('"', '""')}"';
        final desc = '"${(a['description'] as String).replaceAll('"', '""')}"';
        final time = '"${(a['time'] as String).replaceAll('"', '""')}"';
        final cat = '"${((a['category'] as String?) ?? '').replaceAll('"', '""')}"';
        return '$type,$desc,$time,$cat';
      }).join('\n');
      final csv = header + rows;
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/activity_log.csv');
      await file.writeAsString(csv);
      if (context.mounted) await Share.shareXFiles([XFile(file.path)], text: 'Activity Log Export');
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('CSV export failed: $e'), backgroundColor: AppConstants.errorColor),
        );
      }
    }
  }

  Future<void> _exportToPDF(BuildContext context) async {
    try {
      final list = _getFilteredActivities();
      final pdf = pw.Document();
      pdf.addPage(
        pw.MultiPage(
          build: (pw.Context context) => [
            pw.Text('Activity Log', style: pw.TextStyle(fontSize: 22, fontWeight: pw.FontWeight.bold)),
            pw.SizedBox(height: 12),
            pw.Table(
              border: pw.TableBorder.all(),
              children: [
                pw.TableRow(children: [
                  pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text('Type', style: pw.TextStyle(fontWeight: pw.FontWeight.bold))),
                  pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text('Description', style: pw.TextStyle(fontWeight: pw.FontWeight.bold))),
                  pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text('Time', style: pw.TextStyle(fontWeight: pw.FontWeight.bold))),
                  pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text('Category', style: pw.TextStyle(fontWeight: pw.FontWeight.bold))),
                ]),
                ...list.map((a) => pw.TableRow(children: [
                  pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text(a['type']?.toString() ?? '')),
                  pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text(a['description']?.toString() ?? '')),
                  pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text(a['time']?.toString() ?? '')),
                  pw.Padding(padding: const pw.EdgeInsets.all(6), child: pw.Text(a['category']?.toString() ?? '')),
                ])),
              ],
            ),
          ],
        ),
      );
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/activity_log.pdf');
      await file.writeAsBytes(await pdf.save());
      if (context.mounted) await Share.shareXFiles([XFile(file.path)], text: 'Activity Log Export');
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('PDF export failed: $e'), backgroundColor: AppConstants.errorColor),
        );
      }
    }
  }

  void _showFilterSheet(BuildContext context) {
    DateTimeRange? range = _dateRange;
    String category = _selectedCategory;
    showModalBottomSheet(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Filter by date and type', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                ListTile(
                  title: Text(range == null ? 'Select date range' : '${range!.start.toString().split(' ')[0]} – ${range!.end.toString().split(' ')[0]}'),
                  trailing: const Icon(Icons.calendar_today),
                  onTap: () async {
                    final picked = await showDateRangePicker(
                      context: context,
                      firstDate: DateTime(2020),
                      lastDate: DateTime.now().add(const Duration(days: 365)),
                    );
                    if (picked != null && ctx.mounted) {
                      setModalState(() => range = picked);
                    }
                  },
                ),
                const SizedBox(height: 8),
                const Text('Activity type', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: _categories.map((c) => ChoiceChip(
                    label: Text(c),
                    selected: category == c,
                    onSelected: (selected) => setModalState(() => category = selected ? c : 'All'),
                  )).toList(),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                    ElevatedButton(
                      onPressed: () {
                        setState(() {
                          _dateRange = range;
                          _selectedCategory = category;
                        });
                        Navigator.pop(ctx);
                      },
                      child: const Text('Apply'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  List<Map<String, dynamic>> _getFilteredActivities() {
    return _allActivities.where((a) {
      final matchesCategory = _selectedCategory == 'All' || a['category'] == _selectedCategory;
      if (!matchesCategory) return false;
      if (_dateRange != null) {
        final d = a['date'] as DateTime?;
        if (d == null) return true;
        return !d.isBefore(_dateRange!.start) && !d.isAfter(_dateRange!.end);
      }
      return true;
    }).toList();
  }

  // Sample data for all activities (with date for range filtering)
  List<Map<String, dynamic>> get _allActivities {
    final now = DateTime.now();
    return [
      {'type': 'New User Registration', 'description': 'John Doe registered as a teacher', 'time': '2 minutes ago', 'category': 'User Management', 'icon': Icons.person_add, 'color': AppConstants.successColor, 'date': now.subtract(const Duration(minutes: 2))},
      {'type': 'School Update', 'description': 'School A contact information updated', 'time': '15 minutes ago', 'category': 'School Management', 'icon': Icons.edit, 'color': AppConstants.infoColor, 'date': now.subtract(const Duration(minutes: 15))},
      {'type': 'Announcement Posted', 'description': 'New platform features available', 'time': '1 hour ago', 'category': 'Announcements', 'icon': Icons.announcement, 'color': AppConstants.warningColor, 'date': now.subtract(const Duration(hours: 1))},
      {'type': 'User Deactivated', 'description': 'Jane Smith account suspended', 'time': '2 hours ago', 'category': 'User Management', 'icon': Icons.block, 'color': AppConstants.errorColor, 'date': now.subtract(const Duration(hours: 2))},
      {'type': 'New Class Created', 'description': 'Mathematics 101 added to School B', 'time': '3 hours ago', 'category': 'School Management', 'icon': Icons.class_, 'color': AppConstants.primaryColor, 'date': now.subtract(const Duration(hours: 3))},
      {'type': 'System Maintenance', 'description': 'Scheduled maintenance completed', 'time': '1 day ago', 'category': 'System', 'icon': Icons.build, 'color': AppConstants.infoColor, 'date': now.subtract(const Duration(days: 1))},
      {'type': 'Security Alert', 'description': 'Multiple failed login attempts detected', 'time': '1 day ago', 'category': 'Security', 'icon': Icons.security, 'color': AppConstants.errorColor, 'date': now.subtract(const Duration(days: 1))},
      {'type': 'Bulk User Import', 'description': '50 new students imported from CSV', 'time': '2 days ago', 'category': 'User Management', 'icon': Icons.upload_file, 'color': AppConstants.successColor, 'date': now.subtract(const Duration(days: 2))},
      {'type': 'School Deactivated', 'description': 'School C temporarily deactivated', 'time': '3 days ago', 'category': 'School Management', 'icon': Icons.pause_circle, 'color': AppConstants.warningColor, 'date': now.subtract(const Duration(days: 3))},
      {'type': 'Platform Update', 'description': 'New version 2.1.0 deployed', 'time': '1 week ago', 'category': 'System', 'icon': Icons.system_update, 'color': AppConstants.primaryColor, 'date': now.subtract(const Duration(days: 7))},
    ];
  }
}
