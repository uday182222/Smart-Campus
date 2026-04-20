import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/utils/responsive_utils.dart';

class AttendanceMonitoringScreen extends StatefulWidget {
  const AttendanceMonitoringScreen({super.key});

  @override
  State<AttendanceMonitoringScreen> createState() => _AttendanceMonitoringScreenState();
}

class _AttendanceMonitoringScreenState extends State<AttendanceMonitoringScreen> {
  String _selectedClass = 'All Classes';
  String _selectedDate = 'Today';
  String _selectedFilter = 'All';

  // Mock attendance data
  final List<Map<String, dynamic>> _attendanceData = [
    {
      'class': 'Class 10A',
      'totalStudents': 35,
      'present': 32,
      'absent': 2,
      'late': 1,
      'attendanceRate': 91.4,
      'date': '2025-01-20',
      'teacher': 'Mrs. Johnson',
    },
    {
      'class': 'Class 9B',
      'totalStudents': 38,
      'present': 36,
      'absent': 1,
      'late': 1,
      'attendanceRate': 94.7,
      'date': '2025-01-20',
      'teacher': 'Mr. Smith',
    },
    {
      'class': 'Class 8A',
      'totalStudents': 42,
      'present': 40,
      'absent': 1,
      'late': 1,
      'attendanceRate': 95.2,
      'date': '2025-01-20',
      'teacher': 'Ms. Davis',
    },
    {
      'class': 'Class 7B',
      'totalStudents': 39,
      'present': 37,
      'absent': 2,
      'late': 0,
      'attendanceRate': 94.9,
      'date': '2025-01-20',
      'teacher': 'Mr. Wilson',
    },
    {
      'class': 'Class 6A',
      'totalStudents': 41,
      'present': 39,
      'absent': 1,
      'late': 1,
      'attendanceRate': 95.1,
      'date': '2025-01-20',
      'teacher': 'Mrs. Brown',
    },
  ];

  // Weekly attendance data for trend analysis
  final List<Map<String, dynamic>> _weeklyAttendanceData = [
    {'day': 'Mon', 'present': 185, 'absent': 12, 'late': 8, 'rate': 92.2},
    {'day': 'Tue', 'present': 188, 'absent': 10, 'late': 7, 'rate': 93.7},
    {'day': 'Wed', 'present': 182, 'absent': 15, 'late': 8, 'rate': 90.7},
    {'day': 'Thu', 'present': 190, 'absent': 8, 'late': 7, 'rate': 94.6},
    {'day': 'Fri', 'present': 187, 'absent': 11, 'late': 7, 'rate': 93.2},
  ];

  // Monthly attendance comparison
  final List<Map<String, dynamic>> _monthlyAttendanceData = [
    {'month': 'Sep', 'rate': 91.2, 'students': 195},
    {'month': 'Oct', 'rate': 92.8, 'students': 195},
    {'month': 'Nov', 'rate': 93.1, 'students': 195},
    {'month': 'Dec', 'rate': 89.5, 'students': 195},
    {'month': 'Jan', 'rate': 94.2, 'students': 195},
  ];

  final List<String> _classes = [
    'All Classes',
    'Class 10A',
    'Class 9B',
    'Class 8A',
    'Class 7B',
    'Class 6A',
  ];

  final List<String> _dates = [
    'Today',
    'Yesterday',
    'This Week',
    'Last Week',
    'This Month',
  ];

  final List<String> _filters = [
    'All',
    'High Attendance (>90%)',
    'Medium Attendance (70-90%)',
    'Low Attendance (<70%)',
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
                  Icons.analytics,
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
                        'Attendance Monitoring',
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
                        'Monitor attendance patterns across all classes',
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
            
            // Attendance Table
            _buildAttendanceTable(context),
            
            const SizedBox(height: AppConstants.paddingLarge),
            
            // Charts Section
            _buildChartsSection(context),
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
                'Date',
                _selectedDate,
                _dates,
                (value) => setState(() => _selectedDate = value!),
              ),
              _buildFilterDropdown(
                context,
                'Filter',
                _selectedFilter,
                _filters,
                (value) => setState(() => _selectedFilter = value!),
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
    final totalStudents = filteredData.fold<int>(0, (sum, item) => sum + item['totalStudents'] as int);
    final totalPresent = filteredData.fold<int>(0, (sum, item) => sum + item['present'] as int);
    final totalAbsent = filteredData.fold<int>(0, (sum, item) => sum + item['absent'] as int);
    final _ = filteredData.fold<int>(0, (sum, item) => sum + (item['late'] as num).toInt());
    final overallRate = totalStudents > 0 ? (totalPresent / totalStudents * 100).toStringAsFixed(1) : '0.0';

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
          'Total Students',
          totalStudents.toString(),
          Icons.people,
          AppConstants.primaryColor,
        ),
        _buildSummaryCard(
          context,
          'Present',
          totalPresent.toString(),
          Icons.check_circle,
          AppConstants.successColor,
        ),
        _buildSummaryCard(
          context,
          'Absent',
          totalAbsent.toString(),
          Icons.cancel,
          AppConstants.errorColor,
        ),
        _buildSummaryCard(
          context,
          'Overall Rate',
          '$overallRate%',
          Icons.trending_up,
          AppConstants.warningColor,
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

  Widget _buildAttendanceTable(BuildContext context) {
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
                  'Class-wise Attendance',
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
              ],
            ),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: DataTable(
              columns: [
                DataColumn(label: Text('Class')),
                DataColumn(label: Text('Total')),
                DataColumn(label: Text('Present')),
                DataColumn(label: Text('Absent')),
                DataColumn(label: Text('Late')),
                DataColumn(label: Text('Rate')),
                DataColumn(label: Text('Teacher')),
                DataColumn(label: Text('Actions')),
              ],
              rows: filteredData.map((data) {
                return DataRow(
                  cells: [
                    DataCell(Text(data['class'])),
                    DataCell(Text(data['totalStudents'].toString())),
                    DataCell(Text(data['present'].toString())),
                    DataCell(Text(data['absent'].toString())),
                    DataCell(Text(data['late'].toString())),
                    DataCell(
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: _getAttendanceRateColor(data['attendanceRate']),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '${data['attendanceRate']}%',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                    DataCell(Text(data['teacher'])),
                    DataCell(
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            onPressed: () => _viewClassDetails(data),
                            icon: const Icon(Icons.visibility, size: 20),
                            tooltip: 'View Details',
                          ),
                          IconButton(
                            onPressed: () => _exportClassData(data),
                            icon: const Icon(Icons.download, size: 20),
                            tooltip: 'Export Data',
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

  Widget _buildChartsSection(BuildContext context) {
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
            'Attendance Analytics & Trends',
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
          const SizedBox(height: AppConstants.paddingLarge),
          
          // Charts Grid
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: ResponsiveUtils.isMobile(context) ? 1 : 2,
            crossAxisSpacing: AppConstants.paddingMedium,
            mainAxisSpacing: AppConstants.paddingMedium,
            childAspectRatio: ResponsiveUtils.isMobile(context) ? 1.5 : 1.8,
            children: [
              // Bar Chart - Class-wise Attendance
              _buildBarChart(context),
              
              // Line Chart - Weekly Trends
              _buildLineChart(context),
              
              // Pie Chart - Overall Distribution
              _buildPieChart(context),
              
              // Monthly Comparison Chart
              _buildMonthlyChart(context),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBarChart(BuildContext context) {
    final filteredData = _getFilteredData();
    
    return Container(
      padding: const EdgeInsets.all(AppConstants.paddingMedium),
      decoration: BoxDecoration(
        color: AppConstants.backgroundColor,
        borderRadius: BorderRadius.circular(AppConstants.borderRadiusSmall),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Class-wise Attendance Rate',
            style: ResponsiveUtils.getResponsiveBodyStyle(
              context,
              fontSize: ResponsiveUtils.getResponsiveFontSize(
                context,
                mobile: 12,
                tablet: 14,
                desktop: 16,
              ),
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppConstants.paddingSmall),
          Expanded(
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: 100,
                barTouchData: BarTouchData(
                  enabled: true,
                  touchTooltipData: BarTouchTooltipData(
                    tooltipBgColor: AppConstants.surfaceColor,
                    getTooltipItem: (group, groupIndex, rod, rodIndex) {
                      return BarTooltipItem(
                        '${rod.toY.toStringAsFixed(1)}%',
                        TextStyle(
                          color: AppConstants.textPrimary,
                          fontWeight: FontWeight.bold,
                        ),
                      );
                    },
                  ),
                ),
                titlesData: FlTitlesData(
                  show: true,
                  rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        if (value.toInt() >= 0 && value.toInt() < filteredData.length) {
                          final className = filteredData[value.toInt()]['class'] as String;
                          return Padding(
                            padding: const EdgeInsets.only(top: 8.0),
                            child: Text(
                              className.replaceAll('Class ', ''),
                              style: ResponsiveUtils.getResponsiveCaptionStyle(
                                context,
                                fontSize: ResponsiveUtils.getResponsiveFontSize(
                                  context,
                                  mobile: 8,
                                  tablet: 10,
                                  desktop: 12,
                                ),
                                color: AppConstants.textSecondary,
                              ),
                            ),
                          );
                        }
                        return const SizedBox.shrink();
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 40,
                      getTitlesWidget: (value, meta) {
                        return Text(
                          '${value.toInt()}%',
                          style: ResponsiveUtils.getResponsiveCaptionStyle(
                            context,
                            fontSize: ResponsiveUtils.getResponsiveFontSize(
                              context,
                              mobile: 8,
                              tablet: 10,
                              desktop: 12,
                            ),
                            color: AppConstants.textSecondary,
                          ),
                        );
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                barGroups: filteredData.asMap().entries.map((entry) {
                  final index = entry.key;
                  final data = entry.value;
                  final attendanceRate = data['attendanceRate'] as double;
                  
                  return BarChartGroupData(
                    x: index,
                    barRods: [
                      BarChartRodData(
                        toY: attendanceRate,
                        color: _getAttendanceRateColor(attendanceRate),
                        width: ResponsiveUtils.isMobile(context) ? 16 : 20,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ],
                  );
                }).toList(),
                gridData: FlGridData(
                  show: true,
                  horizontalInterval: 20,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (value) {
                    return FlLine(
                      color: Colors.grey.withValues(alpha: 0.2),
                      strokeWidth: 1,
                    );
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLineChart(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppConstants.paddingMedium),
      decoration: BoxDecoration(
        color: AppConstants.backgroundColor,
        borderRadius: BorderRadius.circular(AppConstants.borderRadiusSmall),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Weekly Attendance Trends',
            style: ResponsiveUtils.getResponsiveBodyStyle(
              context,
              fontSize: ResponsiveUtils.getResponsiveFontSize(
                context,
                mobile: 12,
                tablet: 14,
                desktop: 16,
              ),
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppConstants.paddingSmall),
          Expanded(
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: true,
                  horizontalInterval: 20,
                  verticalInterval: 1,
                  getDrawingHorizontalLine: (value) {
                    return FlLine(
                      color: Colors.grey.withValues(alpha: 0.2),
                      strokeWidth: 1,
                    );
                  },
                  getDrawingVerticalLine: (value) {
                    return FlLine(
                      color: Colors.grey.withValues(alpha: 0.2),
                      strokeWidth: 1,
                    );
                  },
                ),
                titlesData: FlTitlesData(
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 30,
                      interval: 1,
                      getTitlesWidget: (value, meta) {
                        if (value.toInt() >= 0 && value.toInt() < _weeklyAttendanceData.length) {
                          return Text(
                            _weeklyAttendanceData[value.toInt()]['day'],
                            style: ResponsiveUtils.getResponsiveCaptionStyle(
                              context,
                              fontSize: ResponsiveUtils.getResponsiveFontSize(
                                context,
                                mobile: 8,
                                tablet: 10,
                                desktop: 12,
                              ),
                              color: AppConstants.textSecondary,
                            ),
                          );
                        }
                        return const SizedBox.shrink();
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      interval: 20,
                      reservedSize: 40,
                      getTitlesWidget: (value, meta) {
                        return Text(
                          '${value.toInt()}%',
                          style: ResponsiveUtils.getResponsiveCaptionStyle(
                            context,
                            fontSize: ResponsiveUtils.getResponsiveFontSize(
                              context,
                              mobile: 8,
                              tablet: 10,
                              desktop: 12,
                            ),
                            color: AppConstants.textSecondary,
                          ),
                        );
                      },
                    ),
                  ),
                  topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                borderData: FlBorderData(
                  show: true,
                  border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
                ),
                minX: 0,
                maxX: (_weeklyAttendanceData.length - 1).toDouble(),
                minY: 85,
                maxY: 100,
                lineBarsData: [
                  LineChartBarData(
                    spots: _weeklyAttendanceData.asMap().entries.map((entry) {
                      return FlSpot(entry.key.toDouble(), entry.value['rate'].toDouble());
                    }).toList(),
                    isCurved: true,
                    color: AppConstants.primaryColor,
                    barWidth: 3,
                    isStrokeCapRound: true,
                    dotData: FlDotData(
                      show: true,
                      getDotPainter: (spot, percent, barData, index) {
                        return FlDotCirclePainter(
                          radius: 4,
                          color: AppConstants.primaryColor,
                          strokeWidth: 2,
                          strokeColor: Colors.white,
                        );
                      },
                    ),
                    belowBarData: BarAreaData(
                      show: true,
                      color: AppConstants.primaryColor.withValues(alpha: 0.1),
                    ),
                  ),
                ],
                lineTouchData: LineTouchData(
                  enabled: true,
                  touchTooltipData: LineTouchTooltipData(
                    tooltipBgColor: AppConstants.surfaceColor,
                    getTooltipItems: (touchedSpots) {
                      return touchedSpots.map((touchedSpot) {
                        final index = touchedSpot.x.toInt();
                        if (index >= 0 && index < _weeklyAttendanceData.length) {
                          final data = _weeklyAttendanceData[index];
                          return LineTooltipItem(
                            '${data['day']}: ${data['rate']}%\nPresent: ${data['present']}, Absent: ${data['absent']}',
                            TextStyle(
                              color: AppConstants.textPrimary,
                              fontWeight: FontWeight.bold,
                            ),
                          );
                        }
                        return null;
                      }).toList();
                    },
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPieChart(BuildContext context) {
    final filteredData = _getFilteredData();
    final totalPresent = filteredData.fold<int>(0, (sum, item) => sum + item['present'] as int);
    final totalAbsent = filteredData.fold<int>(0, (sum, item) => sum + item['absent'] as int);
    final totalLate = filteredData.fold<int>(0, (sum, item) => sum + item['late'] as int);
    
    return Container(
      padding: const EdgeInsets.all(AppConstants.paddingMedium),
      decoration: BoxDecoration(
        color: AppConstants.backgroundColor,
        borderRadius: BorderRadius.circular(AppConstants.borderRadiusSmall),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Attendance Distribution',
            style: ResponsiveUtils.getResponsiveBodyStyle(
              context,
              fontSize: ResponsiveUtils.getResponsiveFontSize(
                context,
                mobile: 12,
                tablet: 14,
                desktop: 16,
              ),
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppConstants.paddingSmall),
          Expanded(
            child: Row(
              children: [
                Expanded(
                  flex: 2,
                  child: PieChart(
                    PieChartData(
                      sectionsSpace: 2,
                      centerSpaceRadius: ResponsiveUtils.isMobile(context) ? 30 : 40,
                      sections: [
                        PieChartSectionData(
                          color: AppConstants.successColor,
                          value: totalPresent.toDouble(),
                          title: '${totalPresent}',
                          radius: ResponsiveUtils.isMobile(context) ? 40 : 50,
                          titleStyle: TextStyle(
                            fontSize: ResponsiveUtils.getResponsiveFontSize(
                              context,
                              mobile: 10,
                              tablet: 12,
                              desktop: 14,
                            ),
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        PieChartSectionData(
                          color: AppConstants.errorColor,
                          value: totalAbsent.toDouble(),
                          title: '${totalAbsent}',
                          radius: ResponsiveUtils.isMobile(context) ? 40 : 50,
                          titleStyle: TextStyle(
                            fontSize: ResponsiveUtils.getResponsiveFontSize(
                              context,
                              mobile: 10,
                              tablet: 12,
                              desktop: 14,
                            ),
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        PieChartSectionData(
                          color: AppConstants.warningColor,
                          value: totalLate.toDouble(),
                          title: '${totalLate}',
                          radius: ResponsiveUtils.isMobile(context) ? 40 : ResponsiveUtils.isMobile(context) ? 40 : 50,
                          titleStyle: TextStyle(
                            fontSize: ResponsiveUtils.getResponsiveFontSize(
                              context,
                              mobile: 10,
                              tablet: 12,
                              desktop: 14,
                            ),
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                Expanded(
                  flex: 1,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildLegendItem('Present', AppConstants.successColor, totalPresent),
                      _buildLegendItem('Absent', AppConstants.errorColor, totalAbsent),
                      _buildLegendItem('Late', AppConstants.warningColor, totalLate),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMonthlyChart(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppConstants.paddingMedium),
      decoration: BoxDecoration(
        color: AppConstants.backgroundColor,
        borderRadius: BorderRadius.circular(AppConstants.borderRadiusSmall),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Monthly Attendance Trends',
            style: ResponsiveUtils.getResponsiveBodyStyle(
              context,
              fontSize: ResponsiveUtils.getResponsiveFontSize(
                context,
                mobile: 12,
                tablet: 14,
                desktop: 16,
              ),
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppConstants.paddingSmall),
          Expanded(
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: 100,
                barTouchData: BarTouchData(
                  enabled: true,
                  touchTooltipData: BarTouchTooltipData(
                    tooltipBgColor: AppConstants.surfaceColor,
                    getTooltipItem: (group, groupIndex, rod, rodIndex) {
                      final month = _monthlyAttendanceData[group.x.toInt()];
                      return BarTooltipItem(
                        '${month['month']}: ${rod.toY.toStringAsFixed(1)}%',
                        TextStyle(
                          color: AppConstants.textPrimary,
                          fontWeight: FontWeight.bold,
                        ),
                      );
                    },
                  ),
                ),
                titlesData: FlTitlesData(
                  show: true,
                  rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        if (value.toInt() >= 0 && value.toInt() < _monthlyAttendanceData.length) {
                          return Padding(
                            padding: const EdgeInsets.only(top: 8.0),
                            child: Text(
                              _monthlyAttendanceData[value.toInt()]['month'],
                              style: ResponsiveUtils.getResponsiveCaptionStyle(
                                context,
                                fontSize: ResponsiveUtils.getResponsiveFontSize(
                                  context,
                                  mobile: 8,
                                  tablet: 10,
                                  desktop: 12,
                                ),
                                color: AppConstants.textSecondary,
                          ),
                            ),
                          );
                        }
                        return const SizedBox.shrink();
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 40,
                      getTitlesWidget: (value, meta) {
                        return Text(
                          '${value.toInt()}%',
                          style: ResponsiveUtils.getResponsiveCaptionStyle(
                            context,
                            fontSize: ResponsiveUtils.getResponsiveFontSize(
                              context,
                              mobile: 8,
                              tablet: 10,
                              desktop: 12,
                            ),
                            color: AppConstants.textSecondary,
                          ),
                        );
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                barGroups: _monthlyAttendanceData.asMap().entries.map((entry) {
                  final index = entry.key;
                  final data = entry.value;
                  final rate = data['rate'] as double;
                  
                  return BarChartGroupData(
                    x: index,
                    barRods: [
                      BarChartRodData(
                        toY: rate,
                        color: _getAttendanceRateColor(rate),
                        width: ResponsiveUtils.isMobile(context) ? 16 : 20,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ],
                  );
                }).toList(),
                gridData: FlGridData(
                  show: true,
                  horizontalInterval: 20,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (value) {
                    return FlLine(
                      color: Colors.grey.withValues(alpha: 0.2),
                      strokeWidth: 1,
                    );
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLegendItem(String label, Color color, int value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              '$label: $value',
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
          ),
        ],
      ),
    );
  }

  List<Map<String, dynamic>> _getFilteredData() {
    List<Map<String, dynamic>> filtered = List.from(_attendanceData);
    
    // Filter by class
    if (_selectedClass != 'All Classes') {
      filtered = filtered.where((item) => item['class'] == _selectedClass).toList();
    }
    
    // Filter by attendance rate
    if (_selectedFilter == 'High Attendance (>90%)') {
      filtered = filtered.where((item) => item['attendanceRate'] > 90).toList();
    } else if (_selectedFilter == 'Medium Attendance (70-90%)') {
      filtered = filtered.where((item) => 
        item['attendanceRate'] >= 70 && item['attendanceRate'] <= 90
      ).toList();
    } else if (_selectedFilter == 'Low Attendance (<70%)') {
      filtered = filtered.where((item) => item['attendanceRate'] < 70).toList();
    }
    
    return filtered;
  }

  Color _getAttendanceRateColor(double rate) {
    if (rate >= 90) return AppConstants.successColor;
    if (rate >= 70) return AppConstants.warningColor;
    return AppConstants.errorColor;
  }

  void _viewClassDetails(Map<String, dynamic> classData) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('${classData['class']} Attendance Details'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Date: ${classData['date']}'),
            Text('Teacher: ${classData['teacher']}'),
            Text('Total Students: ${classData['totalStudents']}'),
            Text('Present: ${classData['present']}'),
            Text('Absent: ${classData['absent']}'),
            Text('Late: ${classData['late']}'),
            Text('Attendance Rate: ${classData['attendanceRate']}%'),
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

  void _exportClassData(Map<String, dynamic> classData) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Exporting ${classData['class']} attendance data...'),
        backgroundColor: AppConstants.infoColor,
      ),
    );
  }
}
