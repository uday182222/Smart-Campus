import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/constants/app_constants.dart';
import '../../models/class_model.dart';
import '../../models/mark_model.dart';
import '../../services/marks_service.dart';

class MarksViewScreen extends StatefulWidget {
  const MarksViewScreen({super.key});

  @override
  State<MarksViewScreen> createState() => _MarksViewScreenState();
}

class _MarksViewScreenState extends State<MarksViewScreen> {
  List<ClassModel> _classes = [];
  String? _selectedClassId;
  String _examType = 'midterm';
  bool _loadingClasses = true;
  bool _analyticsExpanded = true;
  Map<String, dynamic>? _analytics;

  static const List<String> _examTypes = [
    'midterm',
    'final',
    'quiz',
    'assignment',
  ];

  @override
  void initState() {
    super.initState();
    _loadClasses();
  }

  Future<void> _loadClasses() async {
    try {
      final snapshot =
          await FirebaseFirestore.instance.collection(AppConfig.colClasses).get();
      if (!mounted) return;
      setState(() {
        _classes = snapshot.docs
            .map((d) => ClassModel.fromMap({...d.data(), 'id': d.id}))
            .toList();
        _loadingClasses = false;
        if (_classes.isNotEmpty && _selectedClassId == null) {
          _selectedClassId = _classes.first.id;
          _loadAnalytics();
        }
      });
    } catch (e) {
      if (mounted) setState(() => _loadingClasses = false);
    }
  }

  Future<void> _loadAnalytics() async {
    if (_selectedClassId == null) return;
    final a = await MarksService.getClassAnalytics(
      _selectedClassId!,
      _examType,
    );
    if (mounted) setState(() => _analytics = a);
  }

  Future<void> _exportCsv(List<Mark> marks) async {
    if (marks.isEmpty) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No marks to export'),
          backgroundColor: AppConstants.warningColor,
        ),
      );
      return;
    }
    final buffer = StringBuffer();
    buffer.writeln('Student Name,Subject,Exam Type,Marks,Total,Grade');
    for (final m in marks) {
      buffer.writeln(
        '"${m.studentName}",${m.subject},${m.examType},${m.marksObtained},${m.totalMarks},${m.grade}',
      );
    }
    await Share.share(buffer.toString(), subject: 'Marks Export');
  }

  void _showEditDialog(Mark mark) {
    final obtainedController =
        TextEditingController(text: mark.marksObtained.toString());
    final remarksController =
        TextEditingController(text: mark.remarks ?? '');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Edit Marks'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: obtainedController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'Marks (max ${mark.totalMarks})',
                  border: const OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: remarksController,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'Remarks',
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final obtained =
                  double.tryParse(obtainedController.text.trim());
              if (obtained == null ||
                  obtained < 0 ||
                  obtained > mark.totalMarks) {
                if (ctx.mounted) {
                  ScaffoldMessenger.of(ctx).showSnackBar(
                    const SnackBar(
                      content: Text('Invalid marks'),
                      backgroundColor: AppConstants.errorColor,
                    ),
                  );
                }
                return;
              }
              Navigator.pop(ctx);
              final ok = await MarksService.updateMark(
                mark.id,
                obtained,
                remarksController.text.trim(),
              );
              if (!ctx.mounted) return;
              if (!ok) {
                ScaffoldMessenger.of(ctx).showSnackBar(
                  const SnackBar(
                    content: Text('Failed to update marks. Please try again.'),
                    backgroundColor: AppConstants.errorColor,
                  ),
                );
                return;
              }
              ScaffoldMessenger.of(ctx).showSnackBar(
                const SnackBar(
                  content: Text('Marks updated'),
                  backgroundColor: AppConstants.successColor,
                ),
              );
              _loadAnalytics();
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showDeleteConfirm(Mark mark) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete mark?'),
        content: Text(
          'Remove ${mark.studentName}\'s ${mark.subject} ${mark.examType} mark?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppConstants.errorColor,
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              final ok = await MarksService.deleteMark(mark.id);
              if (!context.mounted) return;
              if (!ok) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Failed to delete mark. Please try again.'),
                    backgroundColor: AppConstants.errorColor,
                  ),
                );
                return;
              }
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Mark deleted'),
                  backgroundColor: AppConstants.successColor,
                ),
              );
              _loadAnalytics();
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  Color _gradeColor(String grade) {
    switch (grade) {
      case 'A+':
      case 'A':
        return AppConstants.successColor;
      case 'B':
        return AppConstants.infoColor;
      case 'C':
        return AppConstants.warningColor;
      case 'D':
      case 'F':
        return AppConstants.errorColor;
      default:
        return AppConstants.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loadingClasses) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Marks'),
          backgroundColor: AppConstants.primaryColor,
          foregroundColor: AppConstants.textWhite,
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Marks'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () {},
            tooltip: 'Filter',
          ),
          StreamBuilder<List<Mark>>(
            stream: _selectedClassId != null
                ? MarksService.getMarksForClass(_selectedClassId!, _examType)
                : Stream.value([]),
            builder: (context, snapshot) {
              final marks = snapshot.data ?? [];
              return IconButton(
                icon: const Icon(Icons.upload),
                onPressed: () => _exportCsv(marks),
                tooltip: 'Export CSV',
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(AppConstants.paddingMedium),
            child: Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _selectedClassId,
                    decoration: const InputDecoration(
                      labelText: 'Class',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    items: _classes
                        .map((c) => DropdownMenuItem(
                              value: c.id,
                              child: Text(c.name),
                            ))
                        .toList(),
                    onChanged: (v) {
                      setState(() {
                        _selectedClassId = v;
                        _loadAnalytics();
                      });
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _examType,
                    decoration: const InputDecoration(
                      labelText: 'Exam Type',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    items: _examTypes
                        .map((e) => DropdownMenuItem(
                              value: e,
                              child: Text(
                                e[0].toUpperCase() + e.substring(1),
                              ),
                            ))
                        .toList(),
                    onChanged: (v) {
                      setState(() {
                        _examType = v ?? 'midterm';
                        _loadAnalytics();
                      });
                    },
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: _loadingClasses
                ? const Center(child: CircularProgressIndicator())
                : _classes.isEmpty
                    ? const Center(child: Text('No classes found'))
                    : _selectedClassId == null
                        ? const Center(child: Text('Select a class'))
                        : StreamBuilder<List<Mark>>(
                    stream: MarksService.getMarksForClass(
                      _selectedClassId!,
                      _examType,
                    ),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState ==
                          ConnectionState.waiting) {
                        return const Center(
                            child: CircularProgressIndicator());
                      }
                      final marks = snapshot.data ?? [];

                      return ListView(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppConstants.paddingMedium,
                        ),
                        children: [
                          if (_analytics != null)
                            _buildAnalyticsSection(marks),
                          const SizedBox(height: 16),
                          ...marks.map((m) => _buildMarkRow(m)),
                        ],
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnalyticsSection(List<Mark> marks) {
    final a = _analytics!;
    final avg = (a['average'] as num?)?.toDouble() ?? 0.0;
    final high = (a['highest'] as num?)?.toDouble() ?? 0.0;
    final low = (a['lowest'] as num?)?.toDouble() ?? 0.0;
    final pass = a['passCount'] as int? ?? 0;
    final fail = a['failCount'] as int? ?? 0;
    final dist = a['gradeDistribution'] as Map<String, dynamic>? ?? {};
    final order = ['A+', 'A', 'B', 'C', 'D', 'F'];

    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          InkWell(
            onTap: () =>
                setState(() => _analyticsExpanded = !_analyticsExpanded),
            child: Padding(
              padding: const EdgeInsets.all(AppConstants.paddingMedium),
              child: Row(
                children: [
                  const Text(
                    'Analytics',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  Icon(_analyticsExpanded
                      ? Icons.expand_less
                      : Icons.expand_more),
                ],
              ),
            ),
          ),
          if (_analyticsExpanded) ...[
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(AppConstants.paddingMedium),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      _analyticsChip('Average', '${avg.toStringAsFixed(1)}%'),
                      const SizedBox(width: 12),
                      _analyticsChip('Highest', '${high.toStringAsFixed(1)}%'),
                      const SizedBox(width: 12),
                      _analyticsChip('Lowest', '${low.toStringAsFixed(1)}%'),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _analyticsChip('Pass', '$pass',
                          color: AppConstants.successColor),
                      const SizedBox(width: 12),
                      _analyticsChip('Fail', '$fail',
                          color: AppConstants.errorColor),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Grade distribution',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    height: 160,
                    child: BarChart(
                      BarChartData(
                        alignment: BarChartAlignment.spaceAround,
                        maxY: (order
                                    .map((g) =>
                                        (dist[g] as num?)?.toDouble() ?? 0)
                                    .reduce((a, b) => a > b ? a : b))
                                .clamp(1.0, double.infinity) +
                            2,
                        barTouchData: BarTouchData(enabled: false),
                        titlesData: FlTitlesData(
                          show: true,
                          bottomTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              getTitlesWidget: (value, meta) {
                                final i = value.toInt();
                                if (i >= 0 && i < order.length) {
                                  return Padding(
                                    padding: const EdgeInsets.only(top: 8),
                                    child: Text(
                                      order[i],
                                      style: const TextStyle(
                                        fontSize: 12,
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
                              reservedSize: 28,
                              getTitlesWidget: (value, meta) => Text(
                                value.toInt().toString(),
                                style: const TextStyle(
                                  fontSize: 10,
                                  color: AppConstants.textSecondary,
                                ),
                              ),
                            ),
                          ),
                          rightTitles: const AxisTitles(
                              sideTitles: SideTitles(showTitles: false)),
                          topTitles: const AxisTitles(
                              sideTitles: SideTitles(showTitles: false)),
                        ),
                        borderData: FlBorderData(show: false),
                        barGroups: order.asMap().entries.map((e) {
                          final count =
                              (dist[e.value] as num?)?.toDouble() ?? 0;
                          return BarChartGroupData(
                            x: e.key,
                            barRods: [
                              BarChartRodData(
                                toY: count,
                                color: _gradeColor(e.value),
                                width: 20,
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ],
                          );
                        }).toList(),
                        gridData: FlGridData(
                          show: true,
                          drawVerticalLine: false,
                          getDrawingHorizontalLine: (v) => FlLine(
                            color: Colors.grey.withOpacity(0.2),
                            strokeWidth: 1,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _analyticsChip(String label, String value, {Color? color}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: (color ?? AppConstants.primaryColor).withOpacity(0.15),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        '$label: $value',
        style: TextStyle(
          fontWeight: FontWeight.w600,
          color: color ?? AppConstants.primaryColor,
          fontSize: 13,
        ),
      ),
    );
  }

  Widget _buildMarkRow(Mark m) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppConstants.paddingSmall),
      child: ListTile(
        title: Text(m.studentName),
        subtitle: Text(
          '${m.marksObtained.toStringAsFixed(0)}/${m.totalMarks.toStringAsFixed(0)}  ${m.subject}',
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: _gradeColor(m.grade).withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                m.grade,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: _gradeColor(m.grade),
                  fontSize: 12,
                ),
              ),
            ),
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: () => _showEditDialog(m),
            ),
          ],
        ),
        onLongPress: () => _showDeleteConfirm(m),
      ),
    );
  }
}
