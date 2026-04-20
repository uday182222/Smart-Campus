import 'package:flutter/material.dart';
import '../../../core/utils/responsive_utils.dart';
import '../../../core/constants/app_constants.dart';

class UserManagementScreen extends StatefulWidget {
  const UserManagementScreen({super.key});

  @override
  State<UserManagementScreen> createState() => _UserManagementScreenState();
}

class _UserManagementScreenState extends State<UserManagementScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedRole = 'All';
  String _selectedStatus = 'All';
  Set<String> _selectedUsers = <String>{};
  bool _isSelectMode = false;
  
  // Mock data for users
  final List<Map<String, dynamic>> _users = [
    {
      'id': '1',
      'name': 'John Doe',
      'email': 'john.doe@school.com',
      'role': 'Teacher',
      'status': 'Active',
      'lastLogin': '2024-01-15 10:30 AM',
      'school': 'Central High School',
    },
    {
      'id': '2',
      'name': 'Jane Smith',
      'email': 'jane.smith@school.com',
      'role': 'Parent',
      'status': 'Active',
      'lastLogin': '2024-01-14 02:15 PM',
      'school': 'Central High School',
    },
    {
      'id': '3',
      'name': 'Mike Johnson',
      'email': 'mike.johnson@school.com',
      'role': 'Student',
      'status': 'Inactive',
      'lastLogin': '2024-01-10 09:45 AM',
      'school': 'Central High School',
    },
  ];

  List<Map<String, dynamic>> get _filteredUsers {
    return _users.where((user) {
      final matchesSearch = user['name'].toLowerCase().contains(_searchController.text.toLowerCase()) ||
                           user['email'].toLowerCase().contains(_searchController.text.toLowerCase());
      final matchesRole = _selectedRole == 'All' || user['role'] == _selectedRole;
      final matchesStatus = _selectedStatus == 'All' || user['status'] == _selectedStatus;
      
      return matchesSearch && matchesRole && matchesStatus;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final isMobile = ResponsiveUtils.isMobile(context);
    
    return Scaffold(
      body: Padding(
        padding: ResponsiveUtils.getResponsivePadding(context),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'User Management',
                        style: ResponsiveUtils.getResponsiveHeadingStyle(context),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Manage all users in the system',
                        style: ResponsiveUtils.getResponsiveBodyStyle(context),
                      ),
                    ],
                  ),
                ),
                if (!isMobile) ...[
                  if (_isSelectMode) ...[
                    TextButton.icon(
                      onPressed: _bulkDeleteUsers,
                      icon: const Icon(Icons.delete),
                      label: Text('Delete (${_selectedUsers.length})'),
                      style: TextButton.styleFrom(foregroundColor: AppConstants.errorColor),
                    ),
                    const SizedBox(width: 8),
                    TextButton.icon(
                      onPressed: _bulkActivateUsers,
                      icon: const Icon(Icons.check_circle),
                      label: Text('Activate (${_selectedUsers.length})'),
                    ),
                    const SizedBox(width: 8),
                    TextButton(
                      onPressed: () {
                        setState(() {
                          _isSelectMode = false;
                          _selectedUsers.clear();
                        });
                      },
                      child: const Text('Cancel'),
                    ),
                  ] else ...[
                    TextButton.icon(
                      onPressed: () {
                        setState(() {
                          _isSelectMode = true;
                        });
                      },
                      icon: const Icon(Icons.select_all),
                      label: const Text('Select'),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton.icon(
                      onPressed: () => _showAddUserDialog(context),
                      icon: const Icon(Icons.add),
                      label: const Text('Add New User'),
                      style: ResponsiveUtils.getResponsiveButtonStyle(context),
                    ),
                  ],
                ],
              ],
            ),
            
            SizedBox(height: ResponsiveUtils.getResponsiveSpacing(context)),
            
            // Search and Filters
            _buildSearchAndFilters(context),
            
            SizedBox(height: ResponsiveUtils.getResponsiveSpacing(context)),
            
            // Users List
            Expanded(
              child: _buildUsersList(context),
            ),
            
            // Mobile Add Button
            if (isMobile) ...[
              SizedBox(height: ResponsiveUtils.getResponsiveSpacing(context)),
              if (_isSelectMode) ...[
                Row(
                  children: [
                    Expanded(
                      child: TextButton.icon(
                        onPressed: _bulkDeleteUsers,
                        icon: const Icon(Icons.delete),
                        label: Text('Delete (${_selectedUsers.length})'),
                        style: TextButton.styleFrom(foregroundColor: AppConstants.errorColor),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextButton.icon(
                        onPressed: _bulkActivateUsers,
                        icon: const Icon(Icons.check_circle),
                        label: Text('Activate (${_selectedUsers.length})'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: TextButton(
                    onPressed: () {
                      setState(() {
                        _isSelectMode = false;
                        _selectedUsers.clear();
                      });
                    },
                    child: const Text('Cancel Selection'),
                  ),
                ),
              ] else ...[
                Row(
                  children: [
                    Expanded(
                      child: TextButton.icon(
                        onPressed: () {
                          setState(() {
                            _isSelectMode = true;
                          });
                        },
                        icon: const Icon(Icons.select_all),
                        label: const Text('Select'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _showAddUserDialog(context),
                        icon: const Icon(Icons.add),
                        label: const Text('Add User'),
                        style: ResponsiveUtils.getResponsiveButtonStyle(context),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSearchAndFilters(BuildContext context) {
    final isMobile = ResponsiveUtils.isMobile(context);
    
    return Container(
      padding: ResponsiveUtils.getResponsivePadding(context),
      decoration: ResponsiveUtils.getResponsiveCardDecoration(context),
      child: isMobile
          ? Column(
              children: [
                _buildSearchBar(context),
                SizedBox(height: ResponsiveUtils.getResponsiveSpacing(context)),
                _buildFilterDropdowns(context),
              ],
            )
          : Row(
              children: [
                Expanded(child: _buildSearchBar(context)),
                SizedBox(width: ResponsiveUtils.getResponsiveSpacing(context)),
                Expanded(child: _buildFilterDropdowns(context)),
              ],
            ),
    );
  }

  Widget _buildSearchBar(BuildContext context) {
    return TextField(
      controller: _searchController,
      onChanged: (value) => setState(() {}),
      decoration: ResponsiveUtils.getResponsiveInputDecoration(context, 'Search users...')
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
    );
  }

  Widget _buildFilterDropdowns(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: DropdownButtonFormField<String>(
            value: _selectedRole,
            decoration: ResponsiveUtils.getResponsiveInputDecoration(context, 'Role'),
            items: ['All', 'Admin', 'Teacher', 'Parent', 'Student']
                .map((role) => DropdownMenuItem(value: role, child: Text(role)))
                .toList(),
            onChanged: (value) => setState(() => _selectedRole = value!),
          ),
        ),
        SizedBox(width: ResponsiveUtils.getResponsiveSpacing(context)),
        Expanded(
          child: DropdownButtonFormField<String>(
            value: _selectedStatus,
            decoration: ResponsiveUtils.getResponsiveInputDecoration(context, 'Status'),
            items: ['All', 'Active', 'Inactive']
                .map((status) => DropdownMenuItem(value: status, child: Text(status)))
                .toList(),
            onChanged: (value) => setState(() => _selectedStatus = value!),
          ),
        ),
      ],
    );
  }

  Widget _buildUsersList(BuildContext context) {
    return ListView.builder(
      itemCount: _filteredUsers.length,
      itemBuilder: (context, index) {
        final user = _filteredUsers[index];
        return _buildResponsiveUserCard(context, user);
      },
    );
  }

  Widget _buildResponsiveUserCard(BuildContext context, Map<String, dynamic> user) {
    final isMobile = ResponsiveUtils.isMobile(context);
    
    return Card(
      margin: EdgeInsets.only(bottom: ResponsiveUtils.getResponsiveSpacing(context)),
      child: Padding(
        padding: ResponsiveUtils.getResponsivePadding(context),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                if (_isSelectMode) ...[
                  Checkbox(
                    value: _selectedUsers.contains(user['id']),
                    onChanged: (value) {
                      setState(() {
                        if (value == true) {
                          _selectedUsers.add(user['id']);
                        } else {
                          _selectedUsers.remove(user['id']);
                        }
                      });
                    },
                  ),
                  SizedBox(width: ResponsiveUtils.getResponsiveSpacing(context)),
                ],
                CircleAvatar(
                  radius: ResponsiveUtils.getResponsiveIconSize(context) / 2,
                  backgroundColor: AppConstants.primaryColor,
                  child: Text(
                    user['name'][0],
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: ResponsiveUtils.getResponsiveFontSize(context, mobile: 16, tablet: 18),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                SizedBox(width: ResponsiveUtils.getResponsiveSpacing(context)),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user['name'],
                        style: ResponsiveUtils.getResponsiveHeadingStyle(
                          context,
                          fontSize: ResponsiveUtils.getResponsiveFontSize(context, mobile: 16, tablet: 18),
                        ),
                      ),
                      Text(
                        user['email'],
                        style: ResponsiveUtils.getResponsiveBodyStyle(context),
                      ),
                    ],
                  ),
                ),
                _buildResponsiveStatusChip(context, user['status']),
              ],
            ),
            
            SizedBox(height: ResponsiveUtils.getResponsiveSpacing(context)),
            
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildInfoRow('Role', user['role']),
                      _buildInfoRow('School', user['school']),
                      _buildInfoRow('Last Login', user['lastLogin']),
                    ],
                  ),
                ),
                if (!isMobile) ...[
                  SizedBox(width: ResponsiveUtils.getResponsiveSpacing(context)),
                  _buildActionButtons(context, user),
                ],
              ],
            ),
            
            if (isMobile) ...[
              SizedBox(height: ResponsiveUtils.getResponsiveSpacing(context)),
              _buildActionButtons(context, user),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Text(
            '$label: ',
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }

  Widget _buildResponsiveStatusChip(BuildContext context, String status) {
    final color = status == 'Active' ? AppConstants.successColor : AppConstants.errorColor;
    
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: ResponsiveUtils.getResponsiveSpacing(context),
        vertical: 4,
      ),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: color,
          fontSize: ResponsiveUtils.getResponsiveFontSize(context, mobile: 11, tablet: 12),
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildActionButtons(BuildContext context, Map<String, dynamic> user) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        OutlinedButton.icon(
          onPressed: () => _viewUser(context, user),
          icon: const Icon(Icons.visibility, size: 16),
          label: const Text('View'),
          style: ResponsiveUtils.getResponsiveButtonStyle(context),
        ),
        SizedBox(width: ResponsiveUtils.getResponsiveSpacing(context)),
        OutlinedButton.icon(
          onPressed: () => _editUser(context, user),
          icon: const Icon(Icons.edit, size: 16),
          label: const Text('Edit'),
          style: ResponsiveUtils.getResponsiveButtonStyle(context),
        ),
        SizedBox(width: ResponsiveUtils.getResponsiveSpacing(context)),
        OutlinedButton.icon(
          onPressed: () => _deleteUser(context, user),
          icon: const Icon(Icons.delete, size: 16),
          label: const Text('Delete'),
          style: ResponsiveUtils.getResponsiveButtonStyle(context).copyWith(
            foregroundColor: MaterialStateProperty.all(AppConstants.errorColor),
          ),
        ),
      ],
    );
  }

  void _showAddUserDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => const AddUserDialog(),
    ).then((result) {
      if (result != null) {
        setState(() {
          _users.add(result);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${result['name']} added successfully')),
        );
      }
    });
  }

  void _viewUser(BuildContext context, Map<String, dynamic> user) {
    showDialog(
      context: context,
      builder: (context) => ViewUserDialog(user: user),
    );
  }

  void _editUser(BuildContext context, Map<String, dynamic> user) {
    showDialog(
      context: context,
      builder: (context) => EditUserDialog(user: user),
    ).then((result) {
      if (result != null) {
        setState(() {
          final index = _users.indexWhere((u) => u['id'] == user['id']);
          if (index != -1) {
            _users[index] = result;
          }
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${result['name']} updated successfully')),
        );
      }
    });
  }

  void _deleteUser(BuildContext context, Map<String, dynamic> user) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete User'),
        content: Text('Are you sure you want to delete ${user['name']}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              setState(() {
                _users.removeWhere((u) => u['id'] == user['id']);
              });
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('${user['name']} deleted successfully')),
              );
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  void _bulkDeleteUsers() {
    if (_selectedUsers.isEmpty) return;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Bulk Delete Users'),
        content: Text('Are you sure you want to delete ${_selectedUsers.length} selected users?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              setState(() {
                _users.removeWhere((user) => _selectedUsers.contains(user['id']));
                _selectedUsers.clear();
                _isSelectMode = false;
              });
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('${_selectedUsers.length} users deleted successfully')),
              );
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  void _bulkActivateUsers() {
    if (_selectedUsers.isEmpty) return;
    
    setState(() {
      for (final userId in _selectedUsers) {
        final userIndex = _users.indexWhere((user) => user['id'] == userId);
        if (userIndex != -1) {
          _users[userIndex]['status'] = 'Active';
        }
      }
      _selectedUsers.clear();
      _isSelectMode = false;
    });
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('${_selectedUsers.length} users activated successfully')),
    );
  }
}

// Add User Dialog
class AddUserDialog extends StatefulWidget {
  const AddUserDialog({super.key});

  @override
  State<AddUserDialog> createState() => _AddUserDialogState();
}

class _AddUserDialogState extends State<AddUserDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  String _selectedRole = 'Teacher';
  String _selectedSchool = 'Central High School';

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Add New User'),
      content: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Full Name'),
              validator: (value) => value?.isEmpty == true ? 'Name is required' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _emailController,
              decoration: const InputDecoration(labelText: 'Email'),
              validator: (value) => value?.isEmpty == true ? 'Email is required' : null,
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _selectedRole,
              decoration: const InputDecoration(labelText: 'Role'),
              items: ['Admin', 'Teacher', 'Parent', 'Student']
                  .map((role) => DropdownMenuItem(value: role, child: Text(role)))
                  .toList(),
              onChanged: (value) => setState(() => _selectedRole = value!),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _selectedSchool,
              decoration: const InputDecoration(labelText: 'School'),
              items: ['Central High School', 'North Elementary', 'South Middle School']
                  .map((school) => DropdownMenuItem(value: school, child: Text(school)))
                  .toList(),
              onChanged: (value) => setState(() => _selectedSchool = value!),
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
              final newUser = {
                'id': DateTime.now().millisecondsSinceEpoch.toString(),
                'name': _nameController.text,
                'email': _emailController.text,
                'role': _selectedRole,
                'status': 'Active',
                'lastLogin': 'Never',
                'school': _selectedSchool,
              };
              Navigator.pop(context, newUser);
            }
          },
          child: const Text('Add User'),
        ),
      ],
    );
  }
}

// View User Dialog
class ViewUserDialog extends StatelessWidget {
  final Map<String, dynamic> user;

  const ViewUserDialog({super.key, required this.user});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('View User: ${user['name']}'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildInfoRow('Name', user['name']),
          _buildInfoRow('Email', user['email']),
          _buildInfoRow('Role', user['role']),
          _buildInfoRow('Status', user['status']),
          _buildInfoRow('School', user['school']),
          _buildInfoRow('Last Login', user['lastLogin']),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Close'),
        ),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Text('$label: ', style: const TextStyle(fontWeight: FontWeight.w600)),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}

// Edit User Dialog
class EditUserDialog extends StatefulWidget {
  final Map<String, dynamic> user;

  const EditUserDialog({super.key, required this.user});

  @override
  State<EditUserDialog> createState() => _EditUserDialogState();
}

class _EditUserDialogState extends State<EditUserDialog> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _emailController;
  late String _selectedRole;
  late String _selectedStatus;
  late String _selectedSchool;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.user['name']);
    _emailController = TextEditingController(text: widget.user['email']);
    _selectedRole = widget.user['role'];
    _selectedStatus = widget.user['status'];
    _selectedSchool = widget.user['school'];
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Edit User: ${widget.user['name']}'),
      content: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Full Name'),
              validator: (value) => value?.isEmpty == true ? 'Name is required' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _emailController,
              decoration: const InputDecoration(labelText: 'Email'),
              validator: (value) => value?.isEmpty == true ? 'Email is required' : null,
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _selectedRole,
              decoration: const InputDecoration(labelText: 'Role'),
              items: ['Admin', 'Teacher', 'Parent', 'Student']
                  .map((role) => DropdownMenuItem(value: role, child: Text(role)))
                  .toList(),
              onChanged: (value) => setState(() => _selectedRole = value!),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _selectedStatus,
              decoration: const InputDecoration(labelText: 'Status'),
              items: ['Active', 'Inactive']
                  .map((status) => DropdownMenuItem(value: status, child: Text(status)))
                  .toList(),
              onChanged: (value) => setState(() => _selectedStatus = value!),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _selectedSchool,
              decoration: const InputDecoration(labelText: 'School'),
              items: ['Central High School', 'North Elementary', 'South Middle School']
                  .map((school) => DropdownMenuItem(value: school, child: Text(school)))
                  .toList(),
              onChanged: (value) => setState(() => _selectedSchool = value!),
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
              final updatedUser = {
                ...widget.user,
                'name': _nameController.text,
                'email': _emailController.text,
                'role': _selectedRole,
                'status': _selectedStatus,
                'school': _selectedSchool,
              };
              Navigator.pop(context, updatedUser);
            }
          },
          child: const Text('Update User'),
        ),
      ],
    );
  }
} 