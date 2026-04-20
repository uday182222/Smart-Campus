import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../../../models/school_model.dart';
import 'add_edit_school_screen.dart';

class SchoolManagementScreen extends StatefulWidget {
  const SchoolManagementScreen({super.key});

  @override
  State<SchoolManagementScreen> createState() => _SchoolManagementScreenState();
}

class _SchoolManagementScreenState extends State<SchoolManagementScreen> {
  final List<SchoolModel> _schools = [
    SchoolModel(
      id: '1',
      name: 'School A',
      schoolId: 'SCH001',
      address: '123 Main Street, City A',
      phone: '+1-555-0101',
      email: 'info@schoola.edu',
      adminName: 'John Smith',
      adminEmail: 'admin@schoola.edu',
      status: SchoolStatus.active,
      createdAt: DateTime.now().subtract(const Duration(days: 30)),
      website: 'https://schoola.edu',
      description: 'A leading educational institution focused on academic excellence.',
    ),
    SchoolModel(
      id: '2',
      name: 'School B',
      schoolId: 'SCH002',
      address: '456 Oak Avenue, City B',
      phone: '+1-555-0102',
      email: 'info@schoolb.edu',
      adminName: 'Jane Doe',
      adminEmail: 'admin@schoolb.edu',
      status: SchoolStatus.active,
      createdAt: DateTime.now().subtract(const Duration(days: 45)),
      website: 'https://schoolb.edu',
      description: 'Innovative learning environment with modern facilities.',
    ),
    SchoolModel(
      id: '3',
      name: 'School C',
      schoolId: 'SCH003',
      address: '789 Pine Road, City C',
      phone: '+1-555-0103',
      email: 'info@schoolc.edu',
      adminName: 'Mike Johnson',
      adminEmail: 'admin@schoolc.edu',
      status: SchoolStatus.inactive,
      createdAt: DateTime.now().subtract(const Duration(days: 60)),
      website: null,
      description: 'Community-focused school with strong values.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'School Management',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AppConstants.textPrimary,
                      ),
                    ),
                    Text(
                      'Manage all registered schools',
                      style: TextStyle(
                        fontSize: 16,
                        color: AppConstants.textSecondary,
                      ),
                    ),
                  ],
                ),
                ElevatedButton.icon(
                  onPressed: () => _showAddSchoolDialog(),
                  icon: const Icon(Icons.add),
                  label: const Text('Add School'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppConstants.primaryColor,
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 24),
            
            // Statistics Cards
            _buildStatisticsCards(),
            
            const SizedBox(height: 24),
            
            // Schools List
            Expanded(
              child: _buildSchoolsList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatisticsCards() {
    final totalSchools = _schools.length;
    final activeSchools = _schools.where((s) => s.status == SchoolStatus.active).length;
    final inactiveSchools = _schools.where((s) => s.status == SchoolStatus.inactive).length;
    
    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            'Total Schools',
            totalSchools.toString(),
            Icons.school,
            AppConstants.primaryColor,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _buildStatCard(
            'Active Schools',
            activeSchools.toString(),
            Icons.check_circle,
            AppConstants.successColor,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _buildStatCard(
            'Inactive Schools',
            inactiveSchools.toString(),
            Icons.pause_circle,
            AppConstants.warningColor,
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
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
        children: [
          Icon(icon, size: 32, color: color),
          const SizedBox(height: 12),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              color: AppConstants.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildSchoolsList() {
    return Container(
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
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppConstants.surfaceColor,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            ),
            child: Row(
              children: [
                const Icon(Icons.school, color: AppConstants.primaryColor),
                const SizedBox(width: 12),
                Text(
                  'Registered Schools',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppConstants.textPrimary,
                  ),
                ),
                const Spacer(),
                Text(
                  '${_schools.length} schools',
                  style: TextStyle(
                    color: AppConstants.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          
          // List
          Expanded(
            child: ListView.builder(
              itemCount: _schools.length,
              itemBuilder: (context, index) {
                final school = _schools[index];
                return _buildSchoolCard(school);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSchoolCard(SchoolModel school) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: school.status == SchoolStatus.active
              ? AppConstants.successColor.withValues(alpha: 0.1)
              : AppConstants.warningColor.withValues(alpha: 0.1),
          child: Icon(
            Icons.school,
            color: school.status == SchoolStatus.active
                ? AppConstants.successColor
                : AppConstants.warningColor,
          ),
        ),
        title: Text(
          school.name,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(school.schoolId),
            Text(school.address),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: school.status == SchoolStatus.active
                        ? AppConstants.successColor.withValues(alpha: 0.1)
                        : AppConstants.warningColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    school.status.toString().split('.').last.toUpperCase(),
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: school.status == SchoolStatus.active
                          ? AppConstants.successColor
                          : AppConstants.warningColor,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
        trailing: PopupMenuButton<String>(
          onSelected: (value) {
            switch (value) {
              case 'view':
                _showSchoolDetails(school);
                break;
              case 'edit':
                _showEditSchoolDialog(school);
                break;
              case 'toggle':
                _toggleSchoolStatus(school);
                break;
              case 'delete':
                _showDeleteConfirmation(school);
                break;
            }
          },
          itemBuilder: (context) => [
            const PopupMenuItem(
              value: 'view',
              child: Row(
                children: [
                  Icon(Icons.visibility, size: 18),
                  SizedBox(width: 8),
                  Text('View Details'),
                ],
              ),
            ),
            const PopupMenuItem(
              value: 'edit',
              child: Row(
                children: [
                  Icon(Icons.edit, size: 18),
                  SizedBox(width: 8),
                  Text('Edit'),
                ],
              ),
            ),
            PopupMenuItem(
              value: 'toggle',
              child: Row(
                children: [
                  Icon(
                    school.status == SchoolStatus.active
                        ? Icons.pause_circle
                        : Icons.play_circle,
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    school.status == SchoolStatus.active
                        ? 'Deactivate'
                        : 'Activate',
                  ),
                ],
              ),
            ),
            const PopupMenuItem(
              value: 'delete',
              child: Row(
                children: [
                  Icon(Icons.delete, size: 18, color: Colors.red),
                  SizedBox(width: 8),
                  Text('Delete', style: TextStyle(color: Colors.red)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddSchoolDialog() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const AddEditSchoolScreen(),
      ),
    ).then((result) {
      if (result != null && result is SchoolModel) {
        setState(() {
          _schools.add(result);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('School "${result.name}" added successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    });
  }

  void _showSchoolDetails(SchoolModel school) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(school.name),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildDetailRow('School ID', school.schoolId),
              _buildDetailRow('Address', school.address),
              _buildDetailRow('Phone', school.phone),
              _buildDetailRow('Email', school.email),
              _buildDetailRow('Admin', school.adminName),
              _buildDetailRow('Admin Email', school.adminEmail),
              _buildDetailRow('Status', school.status.toString().split('.').last.toUpperCase()),
              _buildDetailRow('Created', _formatDate(school.createdAt)),
              if (school.website != null)
                _buildDetailRow('Website', school.website!),
              if (school.description != null)
                _buildDetailRow('Description', school.description!),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
          Text(
            value,
            style: const TextStyle(fontSize: 14),
          ),
        ],
      ),
    );
  }

  void _toggleSchoolStatus(SchoolModel school) {
    setState(() {
      final index = _schools.indexWhere((s) => s.id == school.id);
      if (index != -1) {
        _schools[index] = school.copyWith(
          status: school.status == SchoolStatus.active
              ? SchoolStatus.inactive
              : SchoolStatus.active,
        );
      }
    });
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'School "${school.name}" ${school.status == SchoolStatus.active ? "deactivated" : "activated"} successfully!',
        ),
        backgroundColor: AppConstants.successColor,
      ),
    );
  }

  void _showDeleteConfirmation(SchoolModel school) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete School'),
        content: Text('Are you sure you want to delete ${school.name}? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              _deleteSchool(school);
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

  void _deleteSchool(SchoolModel school) {
    setState(() {
      _schools.removeWhere((s) => s.id == school.id);
    });
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('School "${school.name}" deleted successfully!'),
        backgroundColor: AppConstants.successColor,
      ),
    );
  }

  void _showEditSchoolDialog(SchoolModel school) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AddEditSchoolScreen(school: school),
      ),
    ).then((result) {
      if (result != null && result is SchoolModel) {
        setState(() {
          final index = _schools.indexWhere((s) => s.id == result.id);
          if (index != -1) {
            _schools[index] = result;
          }
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('School "${result.name}" updated successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    });
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
} 