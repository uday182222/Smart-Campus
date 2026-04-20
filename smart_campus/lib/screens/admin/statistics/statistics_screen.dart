import 'dart:io';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:excel/excel.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/utils/responsive_utils.dart';
import 'activity_log_screen.dart';
import 'activity_details_screen.dart';

class StatisticsScreen extends StatefulWidget {
  const StatisticsScreen({super.key});

  @override
  State<StatisticsScreen> createState() => _StatisticsScreenState();
}

class _StatisticsScreenState extends State<StatisticsScreen> {
  int _selectedPeriod = 0;
  final List<String> _periods = ['Last 7 Days', 'Last 30 Days', 'Last 3 Months', 'Last Year'];

  @override
  Widget build(BuildContext context) {
    final isMobile = ResponsiveUtils.isMobile(context);
    final isTablet = ResponsiveUtils.isTablet(context);
    
    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      body: Padding(
        padding: EdgeInsets.all(isMobile ? 12 : ResponsiveUtils.getResponsiveSpacing(context)),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              _buildHeader(context, isMobile, isTablet),
              
              SizedBox(height: isMobile ? 16 : ResponsiveUtils.getResponsiveSpacing(context)),
              
              // Period Selector
              _buildPeriodSelector(context, isMobile, isTablet),
              
              SizedBox(height: isMobile ? 16 : ResponsiveUtils.getResponsiveSpacing(context)),
              
              // Statistics Overview
              _buildStatisticsOverview(context, isMobile, isTablet),
              
              SizedBox(height: isMobile ? 16 : ResponsiveUtils.getResponsiveSpacing(context)),
              
              // Charts Section
              _buildChartsSection(context, isMobile, isTablet),
              
              SizedBox(height: isMobile ? 16 : ResponsiveUtils.getResponsiveSpacing(context)),
              
              // Recent Activity
              _buildRecentActivity(context, isMobile, isTablet),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, bool isMobile, bool isTablet) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Platform Statistics',
              style: TextStyle(
                fontSize: isMobile ? 20 : 24,
                fontWeight: FontWeight.bold,
                color: AppConstants.textPrimary,
              ),
            ),
            Text(
              'Comprehensive analytics and insights',
              style: TextStyle(
                fontSize: isMobile ? 14 : 16,
                color: AppConstants.textSecondary,
              ),
            ),
          ],
        ),
        ElevatedButton.icon(
          onPressed: () => _exportReport(context),
          icon: const Icon(Icons.download),
          label: Text(isMobile ? 'Export' : 'Export Report'),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppConstants.primaryColor,
            foregroundColor: Colors.white,
          ),
        ),
      ],
    );
  }

  Widget _buildPeriodSelector(BuildContext context, bool isMobile, bool isTablet) {
    return Container(
      padding: EdgeInsets.all(isMobile ? 12 : 16),
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
            'Time Period',
            style: TextStyle(
              fontSize: isMobile ? 16 : 18,
              fontWeight: FontWeight.bold,
              color: AppConstants.textPrimary,
            ),
          ),
          SizedBox(height: isMobile ? 12 : 16),
          Wrap(
            spacing: isMobile ? 8 : 12,
            children: List.generate(_periods.length, (index) {
              return ChoiceChip(
                label: Text(_periods[index]),
                selected: _selectedPeriod == index,
                onSelected: (selected) {
                  setState(() {
                    _selectedPeriod = index;
                  });
                },
                selectedColor: AppConstants.primaryColor.withValues(alpha: 0.2),
                labelStyle: TextStyle(
                  color: _selectedPeriod == index 
                      ? AppConstants.primaryColor 
                      : AppConstants.textSecondary,
                  fontWeight: _selectedPeriod == index ? FontWeight.bold : FontWeight.normal,
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildStatisticsOverview(BuildContext context, bool isMobile, bool isTablet) {
    final crossAxisCount = isMobile ? 2 : (isTablet ? 3 : 4);
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Platform Overview',
          style: TextStyle(
            fontSize: isMobile ? 18 : 20,
            fontWeight: FontWeight.bold,
            color: AppConstants.textPrimary,
          ),
        ),
        SizedBox(height: isMobile ? 12 : 16),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: crossAxisCount,
          crossAxisSpacing: isMobile ? 12 : 16,
          mainAxisSpacing: isMobile ? 12 : 16,
          childAspectRatio: isMobile ? 1.2 : 1.4,
          children: [
            _buildStatCard(
              context,
              'Total Users',
              '1,234',
              '+12%',
              Icons.people,
              AppConstants.primaryColor,
              isMobile,
              isTablet,
            ),
            _buildStatCard(
              context,
              'Active Schools',
              '45',
              '+5%',
              Icons.school,
              AppConstants.secondaryColor,
              isMobile,
              isTablet,
            ),
            _buildStatCard(
              context,
              'Total Classes',
              '156',
              '+8%',
              Icons.class_,
              AppConstants.successColor,
              isMobile,
              isTablet,
            ),
            _buildStatCard(
              context,
              'Platform Usage',
              '89%',
              '+3%',
              Icons.trending_up,
              AppConstants.warningColor,
              isMobile,
              isTablet,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard(BuildContext context, String title, String value, String change, IconData icon, Color color, bool isMobile, bool isTablet) {
    return Container(
      padding: EdgeInsets.all(isMobile ? 12 : 16),
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, color: color, size: isMobile ? 24 : 28),
              Container(
                padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: change.startsWith('+') 
                      ? AppConstants.successColor.withValues(alpha: 0.1)
                      : AppConstants.errorColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  change,
                  style: TextStyle(
                    fontSize: isMobile ? 10 : 12,
                    fontWeight: FontWeight.bold,
                    color: change.startsWith('+') 
                        ? AppConstants.successColor
                        : AppConstants.errorColor,
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: isMobile ? 8 : 12),
          Text(
            value,
            style: TextStyle(
              fontSize: isMobile ? 20 : 24,
              fontWeight: FontWeight.bold,
              color: AppConstants.textPrimary,
            ),
          ),
          SizedBox(height: isMobile ? 4 : 6),
          Text(
            title,
            style: TextStyle(
              fontSize: isMobile ? 12 : 14,
              color: AppConstants.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChartsSection(BuildContext context, bool isMobile, bool isTablet) {
    return Container(
      padding: EdgeInsets.all(isMobile ? 12 : 16),
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
            'Growth Trends',
            style: TextStyle(
              fontSize: isMobile ? 18 : 20,
              fontWeight: FontWeight.bold,
              color: AppConstants.textPrimary,
            ),
          ),
          SizedBox(height: isMobile ? 12 : 16),
          Container(
            height: isMobile ? 200 : 250,
            decoration: BoxDecoration(
              color: AppConstants.surfaceColor,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.analytics,
                    size: isMobile ? 48 : 64,
                    color: AppConstants.textSecondary,
                  ),
                  SizedBox(height: isMobile ? 8 : 12),
                  Text(
                    'Interactive Charts Coming Soon',
                    style: TextStyle(
                      fontSize: isMobile ? 14 : 16,
                      color: AppConstants.textSecondary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  SizedBox(height: isMobile ? 4 : 6),
                  Text(
                    'Advanced analytics with real-time data visualization',
                    style: TextStyle(
                      fontSize: isMobile ? 12 : 14,
                      color: AppConstants.textLight,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentActivity(BuildContext context, bool isMobile, bool isTablet) {
    return Container(
      padding: EdgeInsets.all(isMobile ? 12 : 16),
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
          Row(
            children: [
              Expanded(
                child: Text(
                  'Recent Activity',
                  style: TextStyle(
                    fontSize: isMobile ? 18 : 20,
                    fontWeight: FontWeight.bold,
                    color: AppConstants.textPrimary,
                  ),
                ),
              ),
              TextButton(
                onPressed: () => _viewAllActivity(context),
                child: Text(
                  'View All',
                  style: TextStyle(
                    fontSize: isMobile ? 14 : 16,
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: isMobile ? 12 : 16),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _recentActivity.length,
            itemBuilder: (context, index) {
              final activity = _recentActivity[index];
              return _buildActivityItem(context, activity, isMobile, isTablet);
            },
          ),
        ],
      ),
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
            Text(
              activity['time'],
              style: ResponsiveUtils.getResponsiveCaptionStyle(context),
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

  void _viewAllActivity(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const ActivityLogScreen(),
      ),
    );
  }

  void _viewActivityDetails(BuildContext context, Map<String, dynamic> activity) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ActivityDetailsScreen(activity: activity),
      ),
    );
  }

  void _exportReport(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Export Report'),
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
                      _exportToPDF(context);
                    },
                    icon: const Icon(Icons.picture_as_pdf),
                    label: const Text('PDF'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      _exportToExcel(context);
                    },
                    icon: const Icon(Icons.table_chart),
                    label: const Text('Excel'),
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

  Future<void> _exportToPDF(BuildContext context) async {
    try {
      final period = _periods[_selectedPeriod];
      final pdf = pw.Document();
      pdf.addPage(
        pw.MultiPage(
          build: (pw.Context context) => [
            pw.Text('Platform Statistics Report', style: pw.TextStyle(fontSize: 22, fontWeight: pw.FontWeight.bold)),
            pw.SizedBox(height: 8),
            pw.Text('Period: $period'),
            pw.Table(
              border: pw.TableBorder.all(),
              children: [
                pw.TableRow(children: [pw.Padding(padding: const pw.EdgeInsets.all(8), child: pw.Text('Metric', style: pw.TextStyle(fontWeight: pw.FontWeight.bold))), pw.Padding(padding: const pw.EdgeInsets.all(8), child: pw.Text('Value', style: pw.TextStyle(fontWeight: pw.FontWeight.bold))), pw.Padding(padding: const pw.EdgeInsets.all(8), child: pw.Text('Change', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)))]),
                pw.TableRow(children: [pw.Padding(padding: const pw.EdgeInsets.all(8), child: pw.Text('Total Users')), pw.Padding(padding: const pw.EdgeInsets.all(8), child: pw.Text('1,234')), pw.Padding(padding: const pw.EdgeInsets.all(8), child: pw.Text('+12%'))]),
                pw.TableRow(children: [pw.Padding(padding: const pw.EdgeInsets.all(8), child: pw.Text('Active Schools')), pw.Padding(padding: const pw.EdgeInsets.all(8), child: pw.Text('45')), pw.Padding(padding: const pw.EdgeInsets.all(8), child: pw.Text('+5%'))]),
                pw.TableRow(children: [pw.Padding(padding: const pw.EdgeInsets.all(8), child: pw.Text('Total Classes')), pw.Padding(padding: const pw.EdgeInsets.all(8), child: pw.Text('156')), pw.Padding(padding: const pw.EdgeInsets.all(8), child: pw.Text('+8%'))]),
                pw.TableRow(children: [pw.Padding(padding: const pw.EdgeInsets.all(8), child: pw.Text('Platform Usage')), pw.Padding(padding: const pw.EdgeInsets.all(8), child: pw.Text('89%')), pw.Padding(padding: const pw.EdgeInsets.all(8), child: pw.Text('+3%'))]),
              ],
            ),
            pw.SizedBox(height: 12),
            pw.Text('Recent Activity', style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold)),
            ..._recentActivity.map((a) => pw.Padding(
              padding: const pw.EdgeInsets.only(bottom: 6),
              child: pw.Text('${a['type']}: ${a['description']} (${a['time']})'),
            )),
          ],
        ),
      );
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/statistics_report.pdf');
      await file.writeAsBytes(await pdf.save());
      if (context.mounted) {
        await Share.shareXFiles([XFile(file.path)], text: 'Platform Statistics Report');
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('PDF export failed: $e'), backgroundColor: AppConstants.errorColor),
        );
      }
    }
  }

  Future<void> _exportToExcel(BuildContext context) async {
    try {
      final period = _periods[_selectedPeriod];
      final excel = Excel.createExcel();
      excel.rename('Sheet1', 'Statistics');
      final sheet = excel['Statistics'];
      sheet.appendRow([TextCellValue('Platform Statistics Report')]);
      sheet.appendRow([TextCellValue('Period: $period')]);
      sheet.appendRow([TextCellValue('Metric'), TextCellValue('Value'), TextCellValue('Change')]);
      sheet.appendRow([TextCellValue('Total Users'), TextCellValue('1,234'), TextCellValue('+12%')]);
      sheet.appendRow([TextCellValue('Active Schools'), TextCellValue('45'), TextCellValue('+5%')]);
      sheet.appendRow([TextCellValue('Total Classes'), TextCellValue('156'), TextCellValue('+8%')]);
      sheet.appendRow([TextCellValue('Platform Usage'), TextCellValue('89%'), TextCellValue('+3%')]);
      sheet.appendRow([TextCellValue('Recent Activity')]);
      for (final a in _recentActivity) {
        sheet.appendRow([TextCellValue(a['type']), TextCellValue(a['description']), TextCellValue(a['time'])]);
      }
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/statistics_report.xlsx');
      final data = excel.encode();
      if (data != null) {
        await file.writeAsBytes(data);
        if (context.mounted) {
          await Share.shareXFiles([XFile(file.path)], text: 'Platform Statistics Report');
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Excel export failed: $e'), backgroundColor: AppConstants.errorColor),
        );
      }
    }
  }

  // Sample data for recent activity
  final List<Map<String, dynamic>> _recentActivity = [
    {
      'type': 'New User Registration',
      'description': 'John Doe registered as a teacher',
      'time': '2 minutes ago',
      'icon': Icons.person_add,
      'color': AppConstants.successColor,
    },
    {
      'type': 'School Update',
      'description': 'School A contact information updated',
      'time': '15 minutes ago',
      'icon': Icons.edit,
      'color': AppConstants.infoColor,
    },
    {
      'type': 'Announcement Posted',
      'description': 'New platform features available',
      'time': '1 hour ago',
      'icon': Icons.announcement,
      'color': AppConstants.warningColor,
    },
    {
      'type': 'User Deactivated',
      'description': 'Jane Smith account suspended',
      'time': '2 hours ago',
      'icon': Icons.block,
      'color': AppConstants.errorColor,
    },
    {
      'type': 'New Class Created',
      'description': 'Mathematics 101 added to School B',
      'time': '3 hours ago',
      'icon': Icons.class_,
      'color': AppConstants.primaryColor,
    },
  ];
} 