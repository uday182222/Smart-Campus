import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';
import '../../models/fee_model.dart';
import '../../services/fee_service.dart';
import '../../services/auth_service.dart';

class ParentFeesScreen extends StatefulWidget {
  const ParentFeesScreen({super.key});

  @override
  State<ParentFeesScreen> createState() => _ParentFeesScreenState();
}

class _ParentFeesScreenState extends State<ParentFeesScreen> {
  List<FeeDue> _allFeeDues = [];
  bool _isLoading = true;
  String _selectedFilter = 'all';
  String? _selectedStudentId;

  final List<Map<String, String>> _filters = [
    {'value': 'all', 'label': 'All Fees'},
    {'value': 'pending', 'label': 'Pending'},
    {'value': 'overdue', 'label': 'Overdue'},
    {'value': 'partial', 'label': 'Partial'},
    {'value': 'paid', 'label': 'Paid'},
  ];

  @override
  void initState() {
    super.initState();
    _loadFeeDues();
  }

  Future<void> _loadFeeDues() async {
    setState(() => _isLoading = true);
    
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser != null) {
        // For parents, we'll get fee dues for their students
        // In a real app, you'd get students associated with the parent
        final feeDues = await FeeService.getFeeDuesByStudent('student_1'); // Mock student ID
        setState(() {
          _allFeeDues = feeDues;
          _selectedStudentId = 'student_1'; // Mock - in real app, get from parent's students
        });
      }
    } catch (e) {
      print('Error loading fee dues: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading fee information: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  List<FeeDue> get _filteredFeeDues {
    List<FeeDue> dues = _allFeeDues;
    
    // Filter by student if multiple students
    if (_selectedStudentId != null) {
      dues = dues.where((due) => due.studentId == _selectedStudentId).toList();
    }
    
    // Filter by status
    if (_selectedFilter == 'all') return dues;
    
    return dues.where((due) {
      switch (_selectedFilter) {
        case 'pending':
          return due.status == FeeStatus.pending;
        case 'overdue':
          return due.status == FeeStatus.overdue || due.isOverdue;
        case 'partial':
          return due.status == FeeStatus.partial;
        case 'paid':
          return due.status == FeeStatus.paid;
        default:
          return true;
      }
    }).toList();
  }

  Map<String, dynamic> get _feeSummary {
    double totalAmount = 0;
    double totalPaid = 0;
    double totalPending = 0;
    int overdueCount = 0;
    
    for (final due in _filteredFeeDues) {
      totalAmount += due.amount;
      totalPaid += due.paidAmount;
      totalPending += due.balanceAmount;
      if (due.isOverdue) overdueCount++;
    }
    
    return {
      'totalAmount': totalAmount,
      'totalPaid': totalPaid,
      'totalPending': totalPending,
      'overdueCount': overdueCount,
      'totalCount': _filteredFeeDues.length,
    };
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Fee Information'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadFeeDues,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _allFeeDues.isEmpty
              ? _buildEmptyState()
              : Column(
                  children: [
                    // Fee Summary Card
                    _buildFeeSummaryCard(),
                    
                    // Filter Section
                    _buildFilterSection(),
                    
                    // Fee Dues List
                    Expanded(
                      child: _filteredFeeDues.isEmpty
                          ? _buildEmptyFilterState()
                          : _buildFeeDuesList(),
                    ),
                  ],
                ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.account_balance_wallet,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: AppConstants.paddingMedium),
          Text(
            'No fee information found',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: AppConstants.paddingSmall),
          Text(
            'Fee information will appear here when assigned by the school',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.grey[500],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildFeeSummaryCard() {
    final summary = _feeSummary;
    
    return Container(
      margin: const EdgeInsets.all(AppConstants.paddingMedium),
      padding: const EdgeInsets.all(AppConstants.paddingMedium),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppConstants.primaryColor, AppConstants.primaryColor.withOpacity(0.8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: AppConstants.primaryColor.withOpacity(0.3),
            spreadRadius: 1,
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.account_balance_wallet, color: Colors.white),
              const SizedBox(width: AppConstants.paddingSmall),
              Text(
                'Fee Summary',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppConstants.paddingMedium),
          
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Total Amount',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white70,
                      ),
                    ),
                    Text(
                      '\$${summary['totalAmount'].toStringAsFixed(2)}',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Paid Amount',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white70,
                      ),
                    ),
                    Text(
                      '\$${summary['totalPaid'].toStringAsFixed(2)}',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Pending Amount',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white70,
                      ),
                    ),
                    Text(
                      '\$${summary['totalPending'].toStringAsFixed(2)}',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          if (summary['overdueCount'] > 0) ...[
            const SizedBox(height: AppConstants.paddingMedium),
            Container(
              padding: const EdgeInsets.all(AppConstants.paddingSmall),
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning, color: Colors.red, size: 16),
                  const SizedBox(width: AppConstants.paddingSmall),
                  Text(
                    '${summary['overdueCount']} overdue fees',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.red,
                      fontWeight: FontWeight.w500,
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

  Widget _buildFilterSection() {
    return Container(
      padding: const EdgeInsets.all(AppConstants.paddingMedium),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        border: Border(
          bottom: BorderSide(color: Colors.grey[300]!),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Filter Fees',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: AppConstants.paddingSmall),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _filters.map((filter) {
                final isSelected = _selectedFilter == filter['value'];
                return Padding(
                  padding: const EdgeInsets.only(right: AppConstants.paddingSmall),
                  child: FilterChip(
                    label: Text(filter['label']!),
                    selected: isSelected,
                    onSelected: (selected) {
                      setState(() {
                        _selectedFilter = filter['value']!;
                      });
                    },
                    selectedColor: AppConstants.primaryColor.withOpacity(0.2),
                    checkmarkColor: AppConstants.primaryColor,
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyFilterState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.filter_list_off,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: AppConstants.paddingMedium),
          Text(
            'No fees found',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: AppConstants.paddingSmall),
          Text(
            'No fees match the selected filter',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.grey[500],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildFeeDuesList() {
    return RefreshIndicator(
      onRefresh: _loadFeeDues,
      child: ListView.builder(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        itemCount: _filteredFeeDues.length,
        itemBuilder: (context, index) {
          final feeDue = _filteredFeeDues[index];
          return _buildFeeDueCard(feeDue);
        },
      ),
    );
  }

  Widget _buildFeeDueCard(FeeDue feeDue) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppConstants.paddingMedium),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Row
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: _getFeeTypeColor(feeDue.feeType).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    _getFeeTypeIcon(feeDue.feeType),
                    color: _getFeeTypeColor(feeDue.feeType),
                  ),
                ),
                const SizedBox(width: AppConstants.paddingMedium),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        feeDue.feeName,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        feeDue.className,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getStatusColor(feeDue.status).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    feeDue.statusDisplayName,
                    style: TextStyle(
                      color: _getStatusColor(feeDue.status),
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            // Amount Information
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Total Amount',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                      Text(
                        '\$${feeDue.amount.toStringAsFixed(2)}',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Paid Amount',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                      Text(
                        '\$${feeDue.paidAmount.toStringAsFixed(2)}',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: Colors.green,
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Balance',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                      Text(
                        '\$${feeDue.balanceAmount.toStringAsFixed(2)}',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: feeDue.balanceAmount > 0 ? Colors.red : Colors.green,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            // Progress Bar
            LinearProgressIndicator(
              value: feeDue.paymentPercentage / 100,
              backgroundColor: Colors.grey[300],
              valueColor: AlwaysStoppedAnimation<Color>(
                feeDue.isFullyPaid ? Colors.green : AppConstants.primaryColor,
              ),
            ),
            const SizedBox(height: AppConstants.paddingSmall),
            
            // Due Date and Payment Info
            Row(
              children: [
                Icon(
                  Icons.access_time,
                  size: 16,
                  color: feeDue.isOverdue ? Colors.red : Colors.grey[500],
                ),
                const SizedBox(width: 4),
                Text(
                  'Due: ${_formatDate(feeDue.dueDate)}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: feeDue.isOverdue ? Colors.red : Colors.grey[600],
                  ),
                ),
                if (feeDue.paidDate != null) ...[
                  const SizedBox(width: AppConstants.paddingMedium),
                  Icon(
                    Icons.check_circle,
                    size: 16,
                    color: Colors.green,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Paid: ${_formatDate(feeDue.paidDate!)}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.green,
                    ),
                  ),
                ],
              ],
            ),
            
            // Contact Information
            if (feeDue.balanceAmount > 0) ...[
              const SizedBox(height: AppConstants.paddingMedium),
              Container(
                padding: const EdgeInsets.all(AppConstants.paddingMedium),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info, color: Colors.blue, size: 16),
                    const SizedBox(width: AppConstants.paddingSmall),
                    Expanded(
                      child: Text(
                        'Please contact the school office to make payments',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.blue[700],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Color _getFeeTypeColor(FeeType type) {
    switch (type) {
      case FeeType.tuition:
        return Colors.blue;
      case FeeType.transport:
        return Colors.orange;
      case FeeType.library:
        return Colors.green;
      case FeeType.laboratory:
        return Colors.purple;
      case FeeType.sports:
        return Colors.red;
      case FeeType.examination:
        return Colors.teal;
      case FeeType.miscellaneous:
        return Colors.grey;
    }
  }

  IconData _getFeeTypeIcon(FeeType type) {
    switch (type) {
      case FeeType.tuition:
        return Icons.school;
      case FeeType.transport:
        return Icons.directions_bus;
      case FeeType.library:
        return Icons.library_books;
      case FeeType.laboratory:
        return Icons.science;
      case FeeType.sports:
        return Icons.sports;
      case FeeType.examination:
        return Icons.quiz;
      case FeeType.miscellaneous:
        return Icons.more_horiz;
    }
  }

  Color _getStatusColor(FeeStatus status) {
    switch (status) {
      case FeeStatus.pending:
        return Colors.orange;
      case FeeStatus.paid:
        return Colors.green;
      case FeeStatus.overdue:
        return Colors.red;
      case FeeStatus.waived:
        return Colors.grey;
      case FeeStatus.partial:
        return Colors.blue;
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
