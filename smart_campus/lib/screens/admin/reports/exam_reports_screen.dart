import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/utils/responsive_utils.dart';

class ExamReportsScreen extends StatefulWidget {
  const ExamReportsScreen({super.key});

  @override
  State<ExamReportsScreen> createState() => _ExamReportsScreenState();
}

class _ExamReportsScreenState extends State<ExamReportsScreen> {
  String _selectedClass = 'All Classes';
  String _selectedSubject = 'All Subjects';
  String _selectedExamType = 'All Exams';
  String _selectedDateRange = 'This Month';

  // Mock exam data
  final List<Map<String, dynamic>> _examData = [
    {
      'id': '1',
      'examName': 'Mid-Term Examination',
      'class': 'Class 10A',
      'subject': 'Mathematics',
      'examType': 'Mid-Term',
      'examDate': '2025-01-15',
      'totalStudents': 35,
      'averageScore': 78.5,
      'highestScore': 95,
      'lowestScore': 45,
      'passPercentage': 88.6,
      'status': 'Completed',
    },
    {
      'id': '2',
      'examName': 'Unit Test 1',
      'class': 'Class 9B',
      'subject': 'Science',
      'examType': 'Unit Test',
      'examDate': '2025-01-18',
      'totalStudents': 38,
      'averageScore': 82.3,
      'highestScore': 98,
      'lowestScore': 52,
      'passPercentage': 92.1,
      'status': 'Completed',
    },
    {
      'id': '3',
      'examName': 'Final Examination',
      'class': 'Class 8A',
      'subject': 'English',
      'examType': 'Final',
      'examDate': '2025-01-20',
      'totalStudents': 42,
      'averageScore': 75.8,
      'highestScore': 92,
      'lowestScore': 48,
      'passPercentage': 85.7,
      'status': 'Completed',
    },
    {
      'id': '4',
      'examName': 'Quarterly Test',
      'class': 'Class 7B',
      'subject': 'Social Studies',
      'examType': 'Quarterly',
      'examDate': '2025-01-22',
      'totalStudents': 39,
      'averageScore': 79.2,
      'highestScore': 96,
      'lowestScore': 55,
      'passPercentage': 89.7,
      'status': 'Completed',
    },
    {
      'id': '5',
      'examName': 'Subject Test',
      'class': 'Class 6A',
      'subject': 'Computer Science',
      'examType': 'Subject Test',
      'examDate': '2025-01-25',
      'totalStudents': 41,
      'averageScore': 81.7,
      'highestScore': 97,
      'lowestScore': 58,
      'passPercentage': 90.2,
      'status': 'Scheduled',
    },
  ];

  final List<String> _classes = [
    'All Classes',
    'Class 10A',
    'Class 9B',
    'Class 8A',
    'Class 7B',
    'Class 6A',
  ];

  final List<String> _subjects = [
    'All Subjects',
    'Mathematics',
    'Science',
    'English',
    'Social Studies',
    'Computer Science',
    'History',
    'Geography',
  ];

  final List<String> _examTypes = [
    'All Exams',
    'Mid-Term',
    'Final',
    'Unit Test',
    'Quarterly',
    'Subject Test',
    'Practice Test',
  ];

  final List<String> _dateRanges = [
    'This Month',
    'Last Month',
    'This Quarter',
    'Last Quarter',
    'This Year',
    'Last Year',
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
                  Icons.assessment,
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
                        'Exam Reports',
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
                        'View and export comprehensive exam performance reports',
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
            
            // Filters
            _buildFilters(context),
            
            const SizedBox(height: AppConstants.paddingLarge),
            
            // Summary Cards
            _buildSummaryCards(context),
            
            const SizedBox(height: AppConstants.paddingLarge),
            
            // Exam Reports Table
            _buildExamReportsTable(context),
            
            const SizedBox(height: AppConstants.paddingLarge),
            
            // Performance Analysis
            _buildPerformanceAnalysis(context),
          ],
        ),
      ),
    );
  }

  Widget _buildFilters(BuildContext context) {
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
            'Filters',
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
              _buildFilterDropdown(
                context,
                'Class',
                _selectedClass,
                _classes,
                (value) => setState(() => _selectedClass = value!),
              ),
              _buildFilterDropdown(
                context,
                'Subject',
                _selectedSubject,
                _subjects,
                (value) => setState(() => _selectedSubject = value!),
              ),
              _buildFilterDropdown(
                context,
                'Exam Type',
                _selectedExamType,
                _examTypes,
                (value) => setState(() => _selectedExamType = value!),
              ),
              _buildFilterDropdown(
                context,
                'Date Range',
                _selectedDateRange,
                _dateRanges,
                (value) => setState(() => _selectedDateRange = value!),
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
    final totalExams = filteredData.length;
    final completedExams = filteredData.where((exam) => exam['status'] == 'Completed').length;
    final scheduledExams = filteredData.where((exam) => exam['status'] == 'Scheduled').length;
    final averageScore = filteredData.isNotEmpty
        ? filteredData.map((exam) => exam['averageScore'] as double).reduce((a, b) => a + b) / filteredData.length
        : 0.0;

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
          'Total Exams',
          totalExams.toString(),
          Icons.assessment,
          AppConstants.primaryColor,
        ),
        _buildSummaryCard(
          context,
          'Completed',
          completedExams.toString(),
          Icons.check_circle,
          AppConstants.successColor,
        ),
        _buildSummaryCard(
          context,
          'Scheduled',
          scheduledExams.toString(),
          Icons.schedule,
          AppConstants.warningColor,
        ),
        _buildSummaryCard(
          context,
          'Avg Score',
          averageScore.toStringAsFixed(1),
          Icons.trending_up,
          AppConstants.infoColor,
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

  Widget _buildExamReportsTable(BuildContext context) {
    final filteredData = _getFilteredData();
    
    return Container(
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
          Container(
            padding: const EdgeInsets.all(AppConstants.paddingMedium),
            decoration: BoxDecoration(
              color: AppConstants.schoolAdminColor.withValues(alpha: 0.1),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(AppConstants.borderRadiusMedium),
                topRight: Radius.circular(AppConstants.borderRadiusMedium),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.table_chart,
                  color: AppConstants.schoolAdminColor,
                ),
                const SizedBox(width: AppConstants.paddingMedium),
                Text(
                  'Exam Reports',
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
                ElevatedButton.icon(
                  onPressed: () => _exportAllReports(),
                  icon: const Icon(Icons.download),
                  label: const Text('Export All'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppConstants.schoolAdminColor,
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: DataTable(
              columns: [
                DataColumn(label: Text('Exam Name')),
                DataColumn(label: Text('Class')),
                DataColumn(label: Text('Subject')),
                DataColumn(label: Text('Type')),
                DataColumn(label: Text('Date')),
                DataColumn(label: Text('Students')),
                DataColumn(label: Text('Avg Score')),
                DataColumn(label: Text('Pass %')),
                DataColumn(label: Text('Status')),
                DataColumn(label: Text('Actions')),
              ],
              rows: filteredData.map((exam) {
                return DataRow(
                  cells: [
                    DataCell(Text(exam['examName'])),
                    DataCell(Text(exam['class'])),
                    DataCell(Text(exam['subject'])),
                    DataCell(Text(exam['examType'])),
                    DataCell(Text(exam['examDate'])),
                    DataCell(Text(exam['totalStudents'].toString())),
                    DataCell(Text(exam['averageScore'].toString())),
                    DataCell(
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: _getPassPercentageColor(exam['passPercentage']),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '${exam['passPercentage']}%',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                    DataCell(
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: _getStatusColor(exam['status']),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          exam['status'],
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                    DataCell(
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            onPressed: () => _viewExamDetails(exam),
                            icon: const Icon(Icons.visibility, size: 20),
                            tooltip: 'View Details',
                          ),
                          IconButton(
                            onPressed: () => _exportExamReport(exam),
                            icon: const Icon(Icons.download, size: 20),
                            tooltip: 'Export Report',
                          ),
                        ],
                      ),
                    ),
                  ],
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPerformanceAnalysis(BuildContext context) {
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
            'Performance Analysis',
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
                child: Container(
                  height: 200,
                  padding: const EdgeInsets.all(AppConstants.paddingMedium),
                  decoration: BoxDecoration(
                    color: AppConstants.backgroundColor,
                    borderRadius: BorderRadius.circular(AppConstants.borderRadiusSmall),
                  ),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.bar_chart,
                          size: 48,
                          color: AppConstants.textSecondary,
                        ),
                        const SizedBox(height: AppConstants.paddingMedium),
                        Text(
                          'Score Distribution Chart',
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
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: AppConstants.paddingMedium),
              Expanded(
                child: Container(
                  height: 200,
                  padding: const EdgeInsets.all(AppConstants.paddingMedium),
                  decoration: BoxDecoration(
                    color: AppConstants.backgroundColor,
                    borderRadius: BorderRadius.circular(AppConstants.borderRadiusSmall),
                  ),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.pie_chart,
                          size: 48,
                          color: AppConstants.textSecondary,
                        ),
                        const SizedBox(height: AppConstants.paddingMedium),
                        Text(
                          'Subject Performance Chart',
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
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  List<Map<String, dynamic>> _getFilteredData() {
    List<Map<String, dynamic>> filtered = List.from(_examData);
    
    // Filter by class
    if (_selectedClass != 'All Classes') {
      filtered = filtered.where((exam) => exam['class'] == _selectedClass).toList();
    }
    
    // Filter by subject
    if (_selectedSubject != 'All Subjects') {
      filtered = filtered.where((exam) => exam['subject'] == _selectedSubject).toList();
    }
    
    // Filter by exam type
    if (_selectedExamType != 'All Exams') {
      filtered = filtered.where((exam) => exam['examType'] == _selectedExamType).toList();
    }
    
    return filtered;
  }

  Color _getPassPercentageColor(double percentage) {
    if (percentage >= 90) return AppConstants.successColor;
    if (percentage >= 70) return AppConstants.warningColor;
    return AppConstants.errorColor;
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Completed':
        return AppConstants.successColor;
      case 'Scheduled':
        return AppConstants.warningColor;
      case 'In Progress':
        return AppConstants.infoColor;
      default:
        return AppConstants.secondaryColor;
    }
  }

  void _viewExamDetails(Map<String, dynamic> exam) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('${exam['examName']} Details'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Class: ${exam['class']}'),
            Text('Subject: ${exam['subject']}'),
            Text('Exam Type: ${exam['examType']}'),
            Text('Exam Date: ${exam['examDate']}'),
            Text('Total Students: ${exam['totalStudents']}'),
            Text('Average Score: ${exam['averageScore']}'),
            Text('Highest Score: ${exam['highestScore']}'),
            Text('Lowest Score: ${exam['lowestScore']}'),
            Text('Pass Percentage: ${exam['passPercentage']}%'),
            Text('Status: ${exam['status']}'),
          ],
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

  void _exportExamReport(Map<String, dynamic> exam) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Exporting ${exam['examName']} report...'),
        backgroundColor: AppConstants.infoColor,
      ),
    );
  }

  void _exportAllReports() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Exporting all exam reports...'),
        backgroundColor: AppConstants.infoColor,
      ),
    );
  }
}
