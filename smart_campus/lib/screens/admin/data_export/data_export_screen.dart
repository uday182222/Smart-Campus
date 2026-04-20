import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/utils/responsive_utils.dart';

class DataExportScreen extends StatefulWidget {
  const DataExportScreen({super.key});

  @override
  State<DataExportScreen> createState() => _DataExportScreenState();
}

class _DataExportScreenState extends State<DataExportScreen> {
  String _selectedDataType = 'Student Records';
  String _selectedFormat = 'Excel (.xlsx)';
  String _selectedDateRange = 'This Month';
  String _selectedClass = 'All Classes';
  Set<String> _selectedFields = <String>{};

  final List<String> _dataTypes = [
    'Student Records',
    'Teacher Records',
    'Attendance Records',
    'Exam Results',
    'Fee Records',
    'Announcements',
    'Class Schedules',
    'Transport Records',
    'Library Records',
    'Sports Records',
  ];

  final List<String> _exportFormats = [
    'Excel (.xlsx)',
    'CSV (.csv)',
    'PDF (.pdf)',
    'JSON (.json)',
  ];

  final List<String> _dateRanges = [
    'This Month',
    'Last Month',
    'This Quarter',
    'Last Quarter',
    'This Year',
    'Last Year',
    'Custom Range',
  ];

  final List<String> _classes = [
    'All Classes',
    'Class 10A',
    'Class 9B',
    'Class 8A',
    'Class 7B',
    'Class 6A',
  ];

  final Map<String, List<String>> _fieldOptions = {
    'Student Records': [
      'Student ID',
      'Name',
      'Class',
      'Section',
      'Roll Number',
      'Date of Birth',
      'Gender',
      'Parent Name',
      'Parent Phone',
      'Address',
      'Email',
      'Admission Date',
      'Status',
    ],
    'Teacher Records': [
      'Teacher ID',
      'Name',
      'Subject',
      'Qualification',
      'Experience',
      'Phone',
      'Email',
      'Address',
      'Joining Date',
      'Status',
    ],
    'Attendance Records': [
      'Student ID',
      'Student Name',
      'Class',
      'Date',
      'Status',
      'Remarks',
      'Marked By',
    ],
    'Exam Results': [
      'Student ID',
      'Student Name',
      'Class',
      'Subject',
      'Exam Name',
      'Exam Date',
      'Marks Obtained',
      'Total Marks',
      'Percentage',
      'Grade',
    ],
    'Fee Records': [
      'Student ID',
      'Student Name',
      'Class',
      'Fee Type',
      'Amount',
      'Due Date',
      'Payment Date',
      'Payment Method',
      'Status',
    ],
  };

  @override
  void initState() {
    super.initState();
    _updateSelectedFields();
  }

  void _updateSelectedFields() {
    final fields = _fieldOptions[_selectedDataType] ?? [];
    _selectedFields = Set.from(fields);
  }

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
                  Icons.file_download,
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
                        'Data Export',
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
                        'Export school data in various formats for analysis and reporting',
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
              ],
            ),
            
            const SizedBox(height: AppConstants.paddingLarge),
            
            // Export Configuration
            _buildExportConfiguration(context),
            
            const SizedBox(height: AppConstants.paddingLarge),
            
            // Field Selection
            _buildFieldSelection(context),
            
            const SizedBox(height: AppConstants.paddingLarge),
            
            // Export Options
            _buildExportOptions(context),
            
            const SizedBox(height: AppConstants.paddingLarge),
            
            // Recent Exports
            _buildRecentExports(context),
          ],
        ),
      ),
    );
  }

  Widget _buildExportConfiguration(BuildContext context) {
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
            'Export Configuration',
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
          
          Wrap(
            spacing: AppConstants.paddingMedium,
            runSpacing: AppConstants.paddingMedium,
            children: [
              _buildConfigurationDropdown(
                context,
                'Data Type',
                _selectedDataType,
                _dataTypes,
                (value) {
                  setState(() {
                    _selectedDataType = value!;
                    _updateSelectedFields();
                  });
                },
              ),
              _buildConfigurationDropdown(
                context,
                'Export Format',
                _selectedFormat,
                _exportFormats,
                (value) => setState(() => _selectedFormat = value!),
              ),
              _buildConfigurationDropdown(
                context,
                'Date Range',
                _selectedDateRange,
                _dateRanges,
                (value) => setState(() => _selectedDateRange = value!),
              ),
              _buildConfigurationDropdown(
                context,
                'Class',
                _selectedClass,
                _classes,
                (value) => setState(() => _selectedClass = value!),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildConfigurationDropdown(
    BuildContext context,
    String label,
    String value,
    List<String> items,
    ValueChanged<String?> onChanged,
  ) {
    return SizedBox(
      width: ResponsiveUtils.isMobile(context) ? double.infinity : 250,
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

  Widget _buildFieldSelection(BuildContext context) {
    final availableFields = _fieldOptions[_selectedDataType] ?? [];
    
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
          Row(
            children: [
              Text(
                'Select Fields to Export',
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
              const Spacer(),
              TextButton(
                onPressed: () {
                  setState(() {
                    _selectedFields = Set.from(availableFields);
                  });
                },
                child: const Text('Select All'),
              ),
              TextButton(
                onPressed: () {
                  setState(() {
                    _selectedFields.clear();
                  });
                },
                child: const Text('Clear All'),
              ),
            ],
          ),
          const SizedBox(height: AppConstants.paddingMedium),
          
          if (availableFields.isNotEmpty)
            Wrap(
              spacing: AppConstants.paddingSmall,
              runSpacing: AppConstants.paddingSmall,
              children: availableFields.map((field) {
                return FilterChip(
                  label: Text(field),
                  selected: _selectedFields.contains(field),
                  onSelected: (selected) {
                    setState(() {
                      if (selected) {
                        _selectedFields.add(field);
                      } else {
                        _selectedFields.remove(field);
                      }
                    });
                  },
                  selectedColor: AppConstants.schoolAdminColor.withValues(alpha: 0.2),
                  checkmarkColor: AppConstants.schoolAdminColor,
                );
              }).toList(),
            )
          else
            Container(
              padding: const EdgeInsets.all(AppConstants.paddingLarge),
              child: Center(
                child: Text(
                  'No fields available for selected data type',
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
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildExportOptions(BuildContext context) {
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
            'Export Options',
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
          
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Export Summary',
                      style: ResponsiveUtils.getResponsiveBodyStyle(
                        context,
                        fontSize: ResponsiveUtils.getResponsiveFontSize(
                          context,
                          mobile: 14,
                          tablet: 16,
                          desktop: 18,
                        ),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: AppConstants.paddingSmall),
                    Text('Data Type: $_selectedDataType'),
                    Text('Format: $_selectedFormat'),
                    Text('Date Range: $_selectedDateRange'),
                    Text('Class: $_selectedClass'),
                    Text('Fields Selected: ${_selectedFields.length}'),
                  ],
                ),
              ),
              const SizedBox(width: AppConstants.paddingLarge),
              ElevatedButton.icon(
                onPressed: _selectedFields.isNotEmpty ? () => _startExport() : null,
                icon: const Icon(Icons.download),
                label: const Text('Start Export'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppConstants.schoolAdminColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppConstants.paddingLarge,
                    vertical: AppConstants.paddingMedium,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRecentExports(BuildContext context) {
    final recentExports = [
      {
        'dataType': 'Student Records',
        'format': 'Excel (.xlsx)',
        'date': '2025-01-20 10:30 AM',
        'status': 'Completed',
        'fileSize': '2.5 MB',
        'records': '1,247',
      },
      {
        'dataType': 'Attendance Records',
        'format': 'CSV (.csv)',
        'date': '2025-01-19 03:45 PM',
        'status': 'Completed',
        'fileSize': '1.8 MB',
        'records': '15,680',
      },
      {
        'dataType': 'Fee Records',
        'format': 'PDF (.pdf)',
        'date': '2025-01-18 11:20 AM',
        'status': 'Completed',
        'fileSize': '3.2 MB',
        'records': '1,247',
      },
      {
        'dataType': 'Exam Results',
        'format': 'Excel (.xlsx)',
        'date': '2025-01-17 02:15 PM',
        'status': 'Failed',
        'fileSize': 'N/A',
        'records': 'N/A',
      },
    ];

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
            'Recent Exports',
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
          
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: recentExports.length,
            itemBuilder: (context, index) {
              final export = recentExports[index];
              return Container(
                margin: const EdgeInsets.only(bottom: AppConstants.paddingMedium),
                padding: const EdgeInsets.all(AppConstants.paddingMedium),
                decoration: BoxDecoration(
                  color: AppConstants.backgroundColor,
                  borderRadius: BorderRadius.circular(AppConstants.borderRadiusSmall),
                  border: Border.all(
                    color: Colors.grey.withValues(alpha: 0.2),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      _getExportIcon(export['format']!),
                      color: _getStatusColor(export['status']!),
                      size: 24,
                    ),
                    const SizedBox(width: AppConstants.paddingMedium),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            export['dataType']!,
                            style: ResponsiveUtils.getResponsiveBodyStyle(
                              context,
                              fontSize: ResponsiveUtils.getResponsiveFontSize(
                                context,
                                mobile: 14,
                                tablet: 16,
                                desktop: 18,
                              ),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            '${export['format']} • ${export['date']} • ${export['records']} records',
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
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: _getStatusColor(export['status']!),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            export['status']!,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          export['fileSize']!,
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
                    const SizedBox(width: AppConstants.paddingMedium),
                    PopupMenuButton<String>(
                      onSelected: (value) {
                        switch (value) {
                          case 'download':
                            _downloadExport(export);
                            break;
                          case 'delete':
                            _deleteExport(export);
                            break;
                        }
                      },
                      itemBuilder: (context) => [
                        if (export['status'] == 'Completed')
                          const PopupMenuItem(
                            value: 'download',
                            child: Row(
                              children: [
                                Icon(Icons.download),
                                SizedBox(width: 8),
                                Text('Download'),
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
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  IconData _getExportIcon(String format) {
    switch (format) {
      case 'Excel (.xlsx)':
        return Icons.table_chart;
      case 'CSV (.csv)':
        return Icons.table_view;
      case 'PDF (.pdf)':
        return Icons.picture_as_pdf;
      case 'JSON (.json)':
        return Icons.code;
      default:
        return Icons.file_download;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Completed':
        return AppConstants.successColor;
      case 'In Progress':
        return AppConstants.warningColor;
      case 'Failed':
        return AppConstants.errorColor;
      default:
        return AppConstants.secondaryColor;
    }
  }

  void _startExport() {
    if (_selectedFields.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select at least one field to export'),
          backgroundColor: AppConstants.errorColor,
        ),
      );
      return;
    }

    // Show export progress dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Exporting Data'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: AppConstants.paddingMedium),
            Text('Exporting $_selectedDataType...'),
            const SizedBox(height: AppConstants.paddingSmall),
            Text('Format: $_selectedFormat'),
            Text('Fields: ${_selectedFields.length} selected'),
          ],
        ),
      ),
    );

    // Simulate export process
    Future.delayed(const Duration(seconds: 3), () {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('$_selectedDataType exported successfully!'),
          backgroundColor: AppConstants.successColor,
        ),
      );
    });
  }

  void _downloadExport(Map<String, dynamic> export) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Downloading ${export['dataType']}...'),
        backgroundColor: AppConstants.infoColor,
      ),
    );
  }

  void _deleteExport(Map<String, dynamic> export) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Export'),
        content: Text('Are you sure you want to delete this export record?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Export record deleted'),
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
