import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/utils/responsive_utils.dart';

class FeesTrackingScreen extends StatefulWidget {
  const FeesTrackingScreen({super.key});

  @override
  State<FeesTrackingScreen> createState() => _FeesTrackingScreenState();
}

class _FeesTrackingScreenState extends State<FeesTrackingScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedClass = 'All Classes';
  String _selectedStatus = 'All Status';
  String _selectedMonth = 'All Months';

  // Mock fees data
  final List<Map<String, dynamic>> _feesData = [
    {
      'id': '1',
      'studentName': 'John Doe',
      'studentId': 'STU001',
      'class': 'Class 10A',
      'parentName': 'Mr. Robert Doe',
      'parentPhone': '+1-555-123-4567',
      'totalAmount': 1200.00,
      'paidAmount': 1200.00,
      'dueAmount': 0.00,
      'paymentStatus': 'Paid',
      'lastPaymentDate': '2025-01-15',
      'paymentMethod': 'Online',
      'month': 'January 2025',
      'installment': 'Full Payment',
    },
    {
      'id': '2',
      'studentName': 'Jane Smith',
      'studentId': 'STU002',
      'class': 'Class 9B',
      'parentName': 'Mrs. Sarah Smith',
      'parentPhone': '+1-555-234-5678',
      'totalAmount': 1100.00,
      'paidAmount': 800.00,
      'dueAmount': 300.00,
      'paymentStatus': 'Partial',
      'lastPaymentDate': '2025-01-18',
      'paymentMethod': 'Cash',
      'month': 'January 2025',
      'installment': 'First Installment',
    },
    {
      'id': '3',
      'studentName': 'Mike Johnson',
      'studentId': 'STU003',
      'class': 'Class 8A',
      'parentName': 'Mr. David Johnson',
      'parentPhone': '+1-555-345-6789',
      'totalAmount': 1000.00,
      'paidAmount': 0.00,
      'dueAmount': 1000.00,
      'paymentStatus': 'Unpaid',
      'lastPaymentDate': 'N/A',
      'paymentMethod': 'N/A',
      'month': 'January 2025',
      'installment': 'No Payment',
    },
    {
      'id': '4',
      'studentName': 'Emily Davis',
      'studentId': 'STU004',
      'class': 'Class 7B',
      'parentName': 'Mrs. Lisa Davis',
      'parentPhone': '+1-555-456-7890',
      'totalAmount': 950.00,
      'paidAmount': 950.00,
      'dueAmount': 0.00,
      'paymentStatus': 'Paid',
      'lastPaymentDate': '2025-01-20',
      'paymentMethod': 'Check',
      'month': 'January 2025',
      'installment': 'Full Payment',
    },
    {
      'id': '5',
      'studentName': 'Alex Wilson',
      'studentId': 'STU005',
      'class': 'Class 6A',
      'parentName': 'Mr. James Wilson',
      'parentPhone': '+1-555-567-8901',
      'totalAmount': 900.00,
      'paidAmount': 450.00,
      'dueAmount': 450.00,
      'paymentStatus': 'Partial',
      'lastPaymentDate': '2025-01-22',
      'paymentMethod': 'Online',
      'month': 'January 2025',
      'installment': 'First Installment',
    },
    {
      'id': '6',
      'studentName': 'Sophia Brown',
      'studentId': 'STU006',
      'class': 'Class 10A',
      'parentName': 'Mrs. Maria Brown',
      'parentPhone': '+1-555-678-9012',
      'totalAmount': 1200.00,
      'paidAmount': 1200.00,
      'dueAmount': 0.00,
      'paymentStatus': 'Paid',
      'lastPaymentDate': '2025-01-10',
      'paymentMethod': 'Online',
      'month': 'January 2025',
      'installment': 'Full Payment',
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

  final List<String> _statuses = [
    'All Status',
    'Paid',
    'Partial',
    'Unpaid',
    'Overdue',
  ];

  final List<String> _months = [
    'All Months',
    'January 2025',
    'December 2024',
    'November 2024',
    'October 2024',
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
                  Icons.account_balance_wallet,
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
                        'Fees Tracking',
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
                        'Track fees paid and outstanding dues across all classes',
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
                  onPressed: () => _showAddPaymentDialog(),
                  icon: const Icon(Icons.add),
                  label: const Text('Record Payment'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppConstants.schoolAdminColor,
                    foregroundColor: Colors.white,
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
            
            // Fees Table
            _buildFeesTable(context),
            
            const SizedBox(height: AppConstants.paddingLarge),
            
            // Payment Analytics
            _buildPaymentAnalytics(context),
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
          
          // Search Bar
          TextField(
            controller: _searchController,
            onChanged: (value) => setState(() {}),
            decoration: ResponsiveUtils.getResponsiveInputDecoration(context, 'Search students...')
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
                'Class',
                _selectedClass,
                _classes,
                (value) => setState(() => _selectedClass = value!),
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
                'Month',
                _selectedMonth,
                _months,
                (value) => setState(() => _selectedMonth = value!),
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
    final totalStudents = filteredData.length;
    final totalAmount = filteredData.fold<double>(0, (sum, item) => sum + (item['totalAmount'] as num).toDouble());
    final totalPaid = filteredData.fold<double>(0, (sum, item) => sum + (item['paidAmount'] as num).toDouble());
    final collectionRate = totalAmount > 0 ? (totalPaid / totalAmount * 100).toStringAsFixed(1) : '0.0';

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
          'Total Amount',
          '\$${totalAmount.toStringAsFixed(0)}',
          Icons.attach_money,
          AppConstants.infoColor,
        ),
        _buildSummaryCard(
          context,
          'Total Paid',
          '\$${totalPaid.toStringAsFixed(0)}',
          Icons.check_circle,
          AppConstants.successColor,
        ),
        _buildSummaryCard(
          context,
          'Collection Rate',
          '$collectionRate%',
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

  Widget _buildFeesTable(BuildContext context) {
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
                  'Fees Details',
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
                  onPressed: () => _exportFeesReport(),
                  icon: const Icon(Icons.download),
                  label: const Text('Export Report'),
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
                DataColumn(label: Text('Student')),
                DataColumn(label: Text('Class')),
                DataColumn(label: Text('Parent')),
                DataColumn(label: Text('Total')),
                DataColumn(label: Text('Paid')),
                DataColumn(label: Text('Due')),
                DataColumn(label: Text('Status')),
                DataColumn(label: Text('Last Payment')),
                DataColumn(label: Text('Actions')),
              ],
              rows: filteredData.map((fee) {
                return DataRow(
                  cells: [
                    DataCell(
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            fee['studentName'],
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          Text(
                            fee['studentId'],
                            style: TextStyle(
                              fontSize: 12,
                              color: AppConstants.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    DataCell(Text(fee['class'])),
                    DataCell(
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(fee['parentName']),
                          Text(
                            fee['parentPhone'],
                            style: TextStyle(
                              fontSize: 12,
                              color: AppConstants.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    DataCell(Text('\$${fee['totalAmount'].toStringAsFixed(2)}')),
                    DataCell(Text('\$${fee['paidAmount'].toStringAsFixed(2)}')),
                    DataCell(
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: _getDueAmountColor(fee['dueAmount']),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '\$${fee['dueAmount'].toStringAsFixed(2)}',
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
                          color: _getStatusColor(fee['paymentStatus']),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          fee['paymentStatus'],
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                    DataCell(Text(fee['lastPaymentDate'])),
                    DataCell(
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            onPressed: () => _viewFeeDetails(fee),
                            icon: const Icon(Icons.visibility, size: 20),
                            tooltip: 'View Details',
                          ),
                          IconButton(
                            onPressed: () => _recordPayment(fee),
                            icon: const Icon(Icons.payment, size: 20),
                            tooltip: 'Record Payment',
                          ),
                          IconButton(
                            onPressed: () => _sendReminder(fee),
                            icon: const Icon(Icons.notification_important, size: 20),
                            tooltip: 'Send Reminder',
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

  Widget _buildPaymentAnalytics(BuildContext context) {
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
            'Payment Analytics',
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
                          Icons.pie_chart,
                          size: 48,
                          color: AppConstants.textSecondary,
                        ),
                        const SizedBox(height: AppConstants.paddingMedium),
                        Text(
                          'Payment Status Chart',
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
                          Icons.bar_chart,
                          size: 48,
                          color: AppConstants.textSecondary,
                        ),
                        const SizedBox(height: AppConstants.paddingMedium),
                        Text(
                          'Monthly Collection Chart',
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
    List<Map<String, dynamic>> filtered = List.from(_feesData);
    
    // Filter by search
    if (_searchController.text.isNotEmpty) {
      filtered = filtered.where((fee) =>
        fee['studentName'].toLowerCase().contains(_searchController.text.toLowerCase()) ||
        fee['studentId'].toLowerCase().contains(_searchController.text.toLowerCase()) ||
        fee['parentName'].toLowerCase().contains(_searchController.text.toLowerCase())
      ).toList();
    }
    
    // Filter by class
    if (_selectedClass != 'All Classes') {
      filtered = filtered.where((fee) => fee['class'] == _selectedClass).toList();
    }
    
    // Filter by status
    if (_selectedStatus != 'All Status') {
      filtered = filtered.where((fee) => fee['paymentStatus'] == _selectedStatus).toList();
    }
    
    // Filter by month
    if (_selectedMonth != 'All Months') {
      filtered = filtered.where((fee) => fee['month'] == _selectedMonth).toList();
    }
    
    return filtered;
  }

  Color _getDueAmountColor(double dueAmount) {
    if (dueAmount == 0) return AppConstants.successColor;
    if (dueAmount <= 100) return AppConstants.warningColor;
    return AppConstants.errorColor;
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Paid':
        return AppConstants.successColor;
      case 'Partial':
        return AppConstants.warningColor;
      case 'Unpaid':
        return AppConstants.errorColor;
      case 'Overdue':
        return AppConstants.errorColor;
      default:
        return AppConstants.secondaryColor;
    }
  }

  void _showAddPaymentDialog() {
    showDialog(
      context: context,
      builder: (context) => const AddPaymentDialog(),
    );
  }

  void _viewFeeDetails(Map<String, dynamic> fee) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Fee Details - ${fee['studentName']}'),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Student ID: ${fee['studentId']}'),
              Text('Class: ${fee['class']}'),
              Text('Parent: ${fee['parentName']}'),
              Text('Parent Phone: ${fee['parentPhone']}'),
              const SizedBox(height: AppConstants.paddingMedium),
              Text('Total Amount: \$${fee['totalAmount'].toStringAsFixed(2)}'),
              Text('Paid Amount: \$${fee['paidAmount'].toStringAsFixed(2)}'),
              Text('Due Amount: \$${fee['dueAmount'].toStringAsFixed(2)}'),
              Text('Payment Status: ${fee['paymentStatus']}'),
              Text('Last Payment Date: ${fee['lastPaymentDate']}'),
              Text('Payment Method: ${fee['paymentMethod']}'),
              Text('Month: ${fee['month']}'),
              Text('Installment: ${fee['installment']}'),
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

  void _recordPayment(Map<String, dynamic> fee) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Recording payment for ${fee['studentName']}...'),
        backgroundColor: AppConstants.infoColor,
      ),
    );
  }

  void _sendReminder(Map<String, dynamic> fee) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Sending reminder to ${fee['parentName']}...'),
        backgroundColor: AppConstants.infoColor,
      ),
    );
  }

  void _exportFeesReport() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Exporting fees report...'),
        backgroundColor: AppConstants.infoColor,
      ),
    );
  }
}

// Add Payment Dialog
class AddPaymentDialog extends StatefulWidget {
  const AddPaymentDialog({super.key});

  @override
  State<AddPaymentDialog> createState() => _AddPaymentDialogState();
}

class _AddPaymentDialogState extends State<AddPaymentDialog> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  String _selectedStudent = 'Select Student';
  String _selectedPaymentMethod = 'Cash';
  String _selectedMonth = 'January 2025';

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Record Payment'),
      content: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              value: _selectedStudent,
              decoration: const InputDecoration(labelText: 'Student'),
              items: ['Select Student', 'John Doe', 'Jane Smith', 'Mike Johnson']
                  .map((student) => DropdownMenuItem(value: student, child: Text(student)))
                  .toList(),
              onChanged: (value) => setState(() => _selectedStudent = value!),
              validator: (value) => value == 'Select Student' ? 'Please select a student' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _amountController,
              decoration: const InputDecoration(labelText: 'Payment Amount'),
              keyboardType: TextInputType.number,
              validator: (value) => value?.isEmpty == true ? 'Amount is required' : null,
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _selectedPaymentMethod,
              decoration: const InputDecoration(labelText: 'Payment Method'),
              items: ['Cash', 'Check', 'Online', 'Card']
                  .map((method) => DropdownMenuItem(value: method, child: Text(method)))
                  .toList(),
              onChanged: (value) => setState(() => _selectedPaymentMethod = value!),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _selectedMonth,
              decoration: const InputDecoration(labelText: 'Month'),
              items: ['January 2025', 'December 2024', 'November 2024']
                  .map((month) => DropdownMenuItem(value: month, child: Text(month)))
                  .toList(),
              onChanged: (value) => setState(() => _selectedMonth = value!),
            ),
          ],
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
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Payment recorded successfully'),
                  backgroundColor: AppConstants.successColor,
                ),
              );
            }
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: AppConstants.schoolAdminColor,
            foregroundColor: Colors.white,
          ),
          child: const Text('Record'),
        ),
      ],
    );
  }
}
