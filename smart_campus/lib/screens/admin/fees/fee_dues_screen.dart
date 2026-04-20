import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../../../models/fee_model.dart';
import '../../../services/fee_service.dart';
import '../../../services/auth_service.dart';
import 'fee_due_detail_screen.dart';
import 'record_payment_screen.dart';

class FeeDuesScreen extends StatefulWidget {
  const FeeDuesScreen({super.key});

  @override
  State<FeeDuesScreen> createState() => _FeeDuesScreenState();
}

class _FeeDuesScreenState extends State<FeeDuesScreen> {
  List<FeeDue> _feeDues = [];
  bool _isLoading = true;
  String _selectedFilter = 'all';

  final List<Map<String, String>> _filters = [
    {'value': 'all', 'label': 'All Dues'},
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
        final feeDues = await FeeService.getFeeDuesBySchool('school_1');
        setState(() {
          _feeDues = feeDues;
        });
      }
    } catch (e) {
      print('Error loading fee dues: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading fee dues: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  List<FeeDue> get _filteredFeeDues {
    if (_selectedFilter == 'all') return _feeDues;
    
    return _feeDues.where((due) {
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

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Filter Section
        _buildFilterSection(),
        
        // Fee Dues List
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _filteredFeeDues.isEmpty
                  ? _buildEmptyState()
                  : _buildFeeDuesList(),
        ),
      ],
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
            'Filter Fee Dues',
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

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.pending_actions,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: AppConstants.paddingMedium),
          Text(
            'No fee dues found',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: AppConstants.paddingSmall),
          Text(
            'Fee dues will appear here when fee structures are assigned to students',
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
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => FeeDueDetailScreen(feeDue: feeDue),
            ),
          );
        },
        borderRadius: BorderRadius.circular(12),
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
                          feeDue.studentName,
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
              
              // Amount and Progress
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
                          '${feeDue.currency} ${feeDue.amount.toStringAsFixed(2)}',
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
                          '${feeDue.currency} ${feeDue.paidAmount.toStringAsFixed(2)}',
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
                          '${feeDue.currency} ${feeDue.balanceAmount.toStringAsFixed(2)}',
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
              
              // Due Date and Actions
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
                  const Spacer(),
                  // Action Buttons
                  Row(
                    children: [
                      if (feeDue.balanceAmount > 0)
                        ElevatedButton(
                          onPressed: () async {
                            final result = await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => RecordPaymentScreen(feeDue: feeDue),
                              ),
                            );
                            if (result == true) {
                              _loadFeeDues();
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppConstants.primaryColor,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            minimumSize: Size.zero,
                          ),
                          child: const Text('Record Payment'),
                        ),
                      IconButton(
                        icon: const Icon(Icons.visibility, size: 20),
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => FeeDueDetailScreen(feeDue: feeDue),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
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
