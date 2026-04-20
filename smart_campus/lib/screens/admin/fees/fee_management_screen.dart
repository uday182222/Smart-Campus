import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../../../models/fee_model.dart';
import '../../../services/fee_service.dart';
import '../../../services/auth_service.dart';
import 'add_edit_fee_structure_screen.dart';
import 'fee_dues_screen.dart';
import 'fee_statistics_screen.dart';

class FeeManagementScreen extends StatefulWidget {
  const FeeManagementScreen({super.key});

  @override
  State<FeeManagementScreen> createState() => _FeeManagementScreenState();
}

class _FeeManagementScreenState extends State<FeeManagementScreen> with TickerProviderStateMixin {
  List<FeeStructure> _feeStructures = [];
  bool _isLoading = true;
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser != null) {
        final feeStructures = await FeeService.getFeeStructuresBySchool('school_1');
        await FeeService.getFeeStatistics('school_1'); // Load for cache if needed
        
        setState(() {
          _feeStructures = feeStructures;
        });
      }
    } catch (e) {
      print('Error loading fee data: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading fee data: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _deleteFeeStructure(FeeStructure feeStructure) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Fee Structure'),
        content: Text('Are you sure you want to delete "${feeStructure.name}"? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await FeeService.deleteFeeStructure(feeStructure.id);
        setState(() {
          _feeStructures.removeWhere((fee) => fee.id == feeStructure.id);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Fee structure "${feeStructure.name}" deleted successfully'),
            backgroundColor: Colors.green,
          ),
        );
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error deleting fee structure: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Fee Management'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
        bottom: TabBar(
          controller: TabController(length: 3, vsync: this, initialIndex: _selectedIndex),
          onTap: (index) => setState(() => _selectedIndex = index),
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: const [
            Tab(text: 'Fee Structures', icon: Icon(Icons.list)),
            Tab(text: 'Fee Dues', icon: Icon(Icons.pending_actions)),
            Tab(text: 'Statistics', icon: Icon(Icons.analytics)),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: TabController(length: 3, vsync: this, initialIndex: _selectedIndex),
              children: [
                _buildFeeStructuresTab(),
                _buildFeeDuesTab(),
                _buildStatisticsTab(),
              ],
            ),
      floatingActionButton: _selectedIndex == 0
          ? FloatingActionButton(
              onPressed: () async {
                final result = await Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const AddEditFeeStructureScreen(),
                  ),
                );
                if (result == true) {
                  _loadData();
                }
              },
              backgroundColor: AppConstants.primaryColor,
              child: const Icon(Icons.add, color: Colors.white),
            )
          : null,
    );
  }

  Widget _buildFeeStructuresTab() {
    return _feeStructures.isEmpty
        ? _buildEmptyState()
        : RefreshIndicator(
            onRefresh: _loadData,
            child: ListView.builder(
              padding: const EdgeInsets.all(AppConstants.paddingMedium),
              itemCount: _feeStructures.length,
              itemBuilder: (context, index) {
                final feeStructure = _feeStructures[index];
                return _buildFeeStructureCard(feeStructure);
              },
            ),
          );
  }

  Widget _buildFeeDuesTab() {
    return const FeeDuesScreen();
  }

  Widget _buildStatisticsTab() {
    return FeeStatisticsScreen();
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
            'No fee structures found',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: AppConstants.paddingSmall),
          Text(
            'Create your first fee structure to get started',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.grey[500],
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppConstants.paddingLarge),
          ElevatedButton.icon(
            onPressed: () async {
              final result = await Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const AddEditFeeStructureScreen(),
                ),
              );
              if (result == true) {
                _loadData();
              }
            },
            icon: const Icon(Icons.add),
            label: const Text('Create Fee Structure'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppConstants.primaryColor,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeeStructureCard(FeeStructure feeStructure) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppConstants.paddingMedium),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => AddEditFeeStructureScreen(feeStructure: feeStructure),
            ),
          );
          if (result == true) {
            _loadData();
          }
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
                      color: _getFeeTypeColor(feeStructure.type).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      _getFeeTypeIcon(feeStructure.type),
                      color: _getFeeTypeColor(feeStructure.type),
                    ),
                  ),
                  const SizedBox(width: AppConstants.paddingMedium),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          feeStructure.name,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          feeStructure.typeDisplayName,
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
                      color: feeStructure.isActive ? Colors.green.withOpacity(0.1) : Colors.grey.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      feeStructure.isActive ? 'Active' : 'Inactive',
                      style: TextStyle(
                        color: feeStructure.isActive ? Colors.green : Colors.grey,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppConstants.paddingMedium),
              
              // Description
              Text(
                feeStructure.description,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: AppConstants.paddingMedium),
              
              // Amount and Details
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Amount',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[600],
                          ),
                        ),
                        Text(
                          '${feeStructure.currency} ${feeStructure.amount.toStringAsFixed(2)}',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppConstants.primaryColor,
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
                          'Due Date',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[600],
                          ),
                        ),
                        Text(
                          _formatDate(feeStructure.dueDate),
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppConstants.paddingMedium),
              
              // Additional Info
              Row(
                children: [
                  if (feeStructure.applicableClassName != null) ...[
                    Icon(Icons.class_, size: 16, color: Colors.grey[500]),
                    const SizedBox(width: 4),
                    Text(
                      feeStructure.applicableClassName!,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(width: AppConstants.paddingMedium),
                  ],
                  Icon(
                    feeStructure.isMandatory ? Icons.check_circle : Icons.radio_button_unchecked,
                    size: 16,
                    color: feeStructure.isMandatory ? Colors.green : Colors.grey,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    feeStructure.isMandatory ? 'Mandatory' : 'Optional',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: feeStructure.isMandatory ? Colors.green : Colors.grey,
                    ),
                  ),
                  const Spacer(),
                  // Action Buttons
                  Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.edit, size: 20),
                        onPressed: () async {
                          final result = await Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => AddEditFeeStructureScreen(feeStructure: feeStructure),
                            ),
                          );
                          if (result == true) {
                            _loadData();
                          }
                        },
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete, size: 20),
                        onPressed: () => _deleteFeeStructure(feeStructure),
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

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
