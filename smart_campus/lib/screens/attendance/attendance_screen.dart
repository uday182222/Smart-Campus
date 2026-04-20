import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';
import '../admin/attendance/attendance_monitoring_screen.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  String _statusFilter = 'All';

  final List<Map<String, dynamic>> _attendanceData = [
    {
      'date': '2024-01-15',
      'status': 'present',
      'subject': 'Mathematics',
      'time': '09:00 AM',
    },
    {
      'date': '2024-01-14',
      'status': 'present',
      'subject': 'English',
      'time': '10:30 AM',
    },
    {
      'date': '2024-01-13',
      'status': 'absent',
      'subject': 'Science',
      'time': '11:45 AM',
    },
    {
      'date': '2024-01-12',
      'status': 'present',
      'subject': 'History',
      'time': '02:15 PM',
    },
    {
      'date': '2024-01-11',
      'status': 'late',
      'subject': 'Geography',
      'time': '09:30 AM',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Attendance'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () {
              showModalBottomSheet(
                context: context,
                builder: (context) => SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.all(AppConstants.paddingMedium),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Filter by status',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: AppConstants.paddingMedium),
                        Wrap(
                          spacing: 8,
                          children: ['All', 'Present', 'Absent', 'Late']
                              .map((option) => ChoiceChip(
                                    label: Text(option),
                                    selected: _statusFilter == option,
                                    onSelected: (selected) {
                                      if (selected) {
                                        setState(() => _statusFilter = option);
                                        Navigator.pop(context);
                                      }
                                    },
                                  ))
                              .toList(),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Attendance Summary Card
          _buildAttendanceSummary(),
          // Active filter chip
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppConstants.paddingMedium),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Padding(
                padding: const EdgeInsets.only(bottom: AppConstants.paddingSmall),
                child: Chip(
                  label: Text('Filter: $_statusFilter'),
                  avatar: const Icon(Icons.filter_list, size: 18, color: AppConstants.primaryColor),
                ),
              ),
            ),
          ),
          // Attendance List
          Expanded(
            child: _buildAttendanceList(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const AttendanceMonitoringScreen(),
            ),
          );
        },
        backgroundColor: AppConstants.primaryColor,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildAttendanceSummary() {
    int present = _attendanceData.where((item) => item['status'] == 'present').length;
    int absent = _attendanceData.where((item) => item['status'] == 'absent').length;
    int late = _attendanceData.where((item) => item['status'] == 'late').length;
    int total = _attendanceData.length;
    double attendancePercentage = total > 0 ? (present / total) * 100 : 0;

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
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Attendance Summary',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                '${attendancePercentage.toStringAsFixed(1)}%',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: attendancePercentage >= 80 
                      ? AppConstants.successColor 
                      : AppConstants.warningColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppConstants.paddingMedium),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildSummaryItem('Present', present, AppConstants.attendancePresent),
              _buildSummaryItem('Absent', absent, AppConstants.attendanceAbsent),
              _buildSummaryItem('Late', late, AppConstants.attendanceLate),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(String label, int count, Color color) {
    return Column(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: color.withOpacity(0.2),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Center(
            child: Text(
              count.toString(),
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ),
        ),
        const SizedBox(height: 4),
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

  Widget _buildAttendanceList() {
    final filtered = _statusFilter == 'All'
        ? _attendanceData
        : _attendanceData
            .where((a) => (a['status'] as String).toLowerCase() == _statusFilter.toLowerCase())
            .toList();
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: AppConstants.paddingMedium),
      itemCount: filtered.length,
      itemBuilder: (context, index) {
        final item = filtered[index];
        return Card(
          margin: const EdgeInsets.only(bottom: AppConstants.paddingSmall),
          child: ListTile(
            leading: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: _getStatusColor(item['status']).withOpacity(0.2),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Icon(
                _getStatusIcon(item['status']),
                color: _getStatusColor(item['status']),
                size: 20,
              ),
            ),
            title: Text(
              item['subject'],
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            subtitle: Text(
              '${item['date']} • ${item['time']}',
              style: const TextStyle(color: AppConstants.textSecondary),
            ),
            trailing: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppConstants.paddingSmall,
                vertical: 4,
              ),
              decoration: BoxDecoration(
                color: _getStatusColor(item['status']).withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                item['status'].toUpperCase(),
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: _getStatusColor(item['status']),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'present':
        return AppConstants.attendancePresent;
      case 'absent':
        return AppConstants.attendanceAbsent;
      case 'late':
        return AppConstants.attendanceLate;
      default:
        return AppConstants.textSecondary;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'present':
        return Icons.check_circle;
      case 'absent':
        return Icons.cancel;
      case 'late':
        return Icons.schedule;
      default:
        return Icons.help;
    }
  }
} 