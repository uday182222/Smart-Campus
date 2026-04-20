import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/utils/responsive_utils.dart';

class ActivityDetailsScreen extends StatelessWidget {
  final Map<String, dynamic> activity;

  const ActivityDetailsScreen({super.key, required this.activity});

  @override
  Widget build(BuildContext context) {
    final isMobile = ResponsiveUtils.isMobile(context);
    final isTablet = ResponsiveUtils.isTablet(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Activity Details'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
        actions: [
          IconButton(
            onPressed: () => _shareActivity(context),
            icon: const Icon(Icons.share),
            tooltip: 'Share Activity',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(isMobile ? 12 : ResponsiveUtils.getResponsiveSpacing(context)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Activity Header
            _buildActivityHeader(context, isMobile, isTablet),
            
            SizedBox(height: isMobile ? 16 : ResponsiveUtils.getResponsiveSpacing(context)),
            
            // Activity Details
            _buildActivityDetails(context, isMobile, isTablet),
            
            SizedBox(height: isMobile ? 16 : ResponsiveUtils.getResponsiveSpacing(context)),
            
            // Related Actions
            _buildRelatedActions(context, isMobile, isTablet),
            
            SizedBox(height: isMobile ? 16 : ResponsiveUtils.getResponsiveSpacing(context)),
            
            // Activity Timeline
            _buildActivityTimeline(context, isMobile, isTablet),
          ],
        ),
      ),
    );
  }

  Widget _buildActivityHeader(BuildContext context, bool isMobile, bool isTablet) {
    return Container(
      padding: EdgeInsets.all(isMobile ? 16 : 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        children: [
          // Icon and Title
          Row(
            children: [
              Container(
                padding: EdgeInsets.all(isMobile ? 12 : 16),
                decoration: BoxDecoration(
                  color: activity['color'].withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  activity['icon'],
                  color: activity['color'],
                  size: isMobile ? 32 : 40,
                ),
              ),
              SizedBox(width: isMobile ? 16 : 20),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      activity['type'],
                      style: TextStyle(
                        fontSize: isMobile ? 20 : 24,
                        fontWeight: FontWeight.bold,
                        color: AppConstants.textPrimary,
                      ),
                    ),
                    SizedBox(height: isMobile ? 4 : 6),
                    Text(
                      activity['description'],
                      style: TextStyle(
                        fontSize: isMobile ? 14 : 16,
                        color: AppConstants.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          SizedBox(height: isMobile ? 16 : 20),
          
          // Status and Category
          Row(
            children: [
              Expanded(
                child: _buildInfoChip(
                  'Category',
                  activity['category'],
                  _getCategoryColor(activity['category']),
                  isMobile,
                ),
              ),
              SizedBox(width: isMobile ? 12 : 16),
              Expanded(
                child: _buildInfoChip(
                  'Status',
                  'Completed',
                  AppConstants.successColor,
                  isMobile,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoChip(String label, String value, Color color, bool isMobile) {
    return Container(
      padding: EdgeInsets.all(isMobile ? 12 : 16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: isMobile ? 12 : 14,
              color: AppConstants.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
          SizedBox(height: isMobile ? 4 : 6),
          Text(
            value,
            style: TextStyle(
              fontSize: isMobile ? 14 : 16,
              color: color,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildActivityDetails(BuildContext context, bool isMobile, bool isTablet) {
    return Container(
      padding: EdgeInsets.all(isMobile ? 16 : 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Activity Information',
            style: TextStyle(
              fontSize: isMobile ? 18 : 20,
              fontWeight: FontWeight.bold,
              color: AppConstants.textPrimary,
            ),
          ),
          SizedBox(height: isMobile ? 16 : 20),
          
          _buildDetailRow('Time', activity['time'], Icons.access_time),
          _buildDetailRow('User', 'System Administrator', Icons.person),
          _buildDetailRow('IP Address', '192.168.1.100', Icons.computer),
          _buildDetailRow('User Agent', 'Chrome 120.0.0.0', Icons.web),
          _buildDetailRow('Session ID', 'sess_abc123def456', Icons.fingerprint),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(
            icon,
            size: 20,
            color: AppConstants.textSecondary,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppConstants.textLight,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppConstants.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRelatedActions(BuildContext context, bool isMobile, bool isTablet) {
    return Container(
      padding: EdgeInsets.all(isMobile ? 16 : 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Related Actions',
            style: TextStyle(
              fontSize: isMobile ? 18 : 20,
              fontWeight: FontWeight.bold,
              color: AppConstants.textPrimary,
            ),
          ),
          SizedBox(height: isMobile ? 16 : 20),
          
          Wrap(
            spacing: isMobile ? 8 : 12,
            runSpacing: isMobile ? 8 : 12,
            children: [
              _buildActionButton(
                context,
                'View User Profile',
                Icons.person,
                AppConstants.primaryColor,
                () => _viewUserProfile(context),
                isMobile,
              ),
              _buildActionButton(
                context,
                'View School Details',
                Icons.school,
                AppConstants.secondaryColor,
                () => _viewSchoolDetails(context),
                isMobile,
              ),
              _buildActionButton(
                context,
                'Generate Report',
                Icons.assessment,
                AppConstants.infoColor,
                () => _generateReport(context),
                isMobile,
              ),
              _buildActionButton(
                context,
                'Export Data',
                Icons.download,
                AppConstants.successColor,
                () => _exportData(context),
                isMobile,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(BuildContext context, String label, IconData icon, Color color, VoidCallback onPressed, bool isMobile) {
    return ElevatedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: isMobile ? 16 : 18),
      label: Text(
        label,
        style: TextStyle(fontSize: isMobile ? 12 : 14),
      ),
      style: ElevatedButton.styleFrom(
        backgroundColor: color.withValues(alpha: 0.1),
        foregroundColor: color,
        side: BorderSide(color: color.withValues(alpha: 0.3)),
        padding: EdgeInsets.symmetric(
          horizontal: isMobile ? 12 : 16,
          vertical: isMobile ? 8 : 12,
        ),
      ),
    );
  }

  Widget _buildActivityTimeline(BuildContext context, bool isMobile, bool isTablet) {
    return Container(
      padding: EdgeInsets.all(isMobile ? 16 : 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Activity Timeline',
            style: TextStyle(
              fontSize: isMobile ? 18 : 20,
              fontWeight: FontWeight.bold,
              color: AppConstants.textPrimary,
            ),
          ),
          SizedBox(height: isMobile ? 16 : 20),
          
          _buildTimelineItem(
            'Activity Initiated',
            'User action triggered the activity',
            '2 minutes ago',
            Icons.play_circle,
            AppConstants.primaryColor,
            isMobile,
          ),
          _buildTimelineItem(
            'Processing',
            'System processing the request',
            '1 minute ago',
            Icons.sync,
            AppConstants.infoColor,
            isMobile,
          ),
          _buildTimelineItem(
            'Completed',
            'Activity successfully completed',
            'Just now',
            Icons.check_circle,
            AppConstants.successColor,
            isMobile,
            isLast: true,
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineItem(String title, String description, String time, IconData icon, Color color, bool isMobile, {bool isLast = false}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              padding: EdgeInsets.all(isMobile ? 8 : 10),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: color, width: 2),
              ),
              child: Icon(
                icon,
                color: color,
                size: isMobile ? 16 : 18,
              ),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 40,
                color: AppConstants.textLight.withValues(alpha: 0.3),
              ),
          ],
        ),
        SizedBox(width: isMobile ? 12 : 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: isMobile ? 14 : 16,
                  fontWeight: FontWeight.w600,
                  color: AppConstants.textPrimary,
                ),
              ),
              SizedBox(height: isMobile ? 4 : 6),
              Text(
                description,
                style: TextStyle(
                  fontSize: isMobile ? 12 : 14,
                  color: AppConstants.textSecondary,
                ),
              ),
              SizedBox(height: isMobile ? 4 : 6),
              Text(
                time,
                style: TextStyle(
                  fontSize: isMobile ? 11 : 12,
                  color: AppConstants.textLight,
                ),
              ),
            ],
          ),
        ),
      ],
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

  void _shareActivity(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Share Activity'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Choose sharing method:'),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      _shareViaEmail(context);
                    },
                    icon: const Icon(Icons.email),
                    label: const Text('Email'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      _shareViaSMS(context);
                    },
                    icon: const Icon(Icons.sms),
                    label: const Text('SMS'),
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

  void _shareViaEmail(BuildContext context) {
    final subject = Uri.encodeComponent('Activity: ${activity['type']}');
    final body = Uri.encodeComponent(
      '${activity['type']}\n\n${activity['description']}\n\nTime: ${activity['time']}\nCategory: ${activity['category'] ?? 'N/A'}',
    );
    final uri = Uri.parse('mailto:?subject=$subject&body=$body');
    launchUrl(uri).catchError((_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open email app'), backgroundColor: AppConstants.errorColor),
        );
      }
      return false;
    });
  }

  void _shareViaSMS(BuildContext context) {
    final body = Uri.encodeComponent(
      '${activity['type']}: ${activity['description']} (${activity['time']})',
    );
    final uri = Uri.parse('sms:?body=$body');
    launchUrl(uri).catchError((_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open SMS app'), backgroundColor: AppConstants.errorColor),
        );
      }
      return false;
    });
  }

  void _viewUserProfile(BuildContext context) {
    // TODO: Navigate to user profile
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('User profile view coming soon!'),
        backgroundColor: AppConstants.infoColor,
      ),
    );
  }

  void _viewSchoolDetails(BuildContext context) {
    // TODO: Navigate to school details
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('School details view coming soon!'),
        backgroundColor: AppConstants.infoColor,
      ),
    );
  }

  void _generateReport(BuildContext context) {
    // TODO: Generate activity report
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Report generation coming soon!'),
        backgroundColor: AppConstants.infoColor,
      ),
    );
  }

  void _exportData(BuildContext context) {
    final buffer = StringBuffer();
    buffer.writeln('Activity Details');
    buffer.writeln('===============');
    buffer.writeln('Type: ${activity['type']}');
    buffer.writeln('Description: ${activity['description']}');
    buffer.writeln('Time: ${activity['time']}');
    buffer.writeln('Category: ${activity['category'] ?? 'N/A'}');
    buffer.writeln('Status: Completed');
    Share.share(buffer.toString(), subject: 'Activity: ${activity['type']}');
  }
}
