import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';
import '../../services/auth_service.dart';
import '../main_navigation_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _schoolIdController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;
  String? _selectedRole;
  bool _isSuperAdmin = false;
  String? _currentError;

  @override
  void initState() {
    super.initState();
    // Set default role
    _selectedRole = AppConstants.roleSchoolAdmin;
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _schoolIdController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    // Clear previous errors
    setState(() {
      _currentError = null;
    });

    // Validate form
    if (!_formKey.currentState!.validate()) {
      return;
    }

    // Additional validation using AuthService
    final validation = AuthService.validateLoginInputs(
      email: _emailController.text.trim(),
      password: _passwordController.text,
      schoolId: _isSuperAdmin ? null : _schoolIdController.text.trim(),
      isSuperAdmin: _isSuperAdmin,
    );

    if (!validation['isValid']) {
      setState(() {
        _currentError = validation['errors'].join('\n');
      });
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      Map<String, dynamic> result;
      
      if (_isSuperAdmin) {
        // Super admin login (no school ID required)
        result = await AuthService.signInAsSuperAdmin(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );
      } else {
        // Regular user login (requires school ID)
        result = await AuthService.signInWithSchoolId(
          email: _emailController.text.trim(),
          password: _passwordController.text,
          schoolId: _schoolIdController.text.trim(),
        );
      }

      if (result['success']) {
        // Navigate to main navigation screen with user role
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => MainNavigationScreen(
              userRole: result['userRole'],
            ),
          ),
        );

        // Show welcome message
        final schoolName = result['school']?.name ?? 'System';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Welcome ${_getRoleDisplayName(result['userRole'])}! ${_isSuperAdmin ? '' : '($schoolName)'}'),
            backgroundColor: AppConstants.successColor,
            duration: const Duration(seconds: 2),
          ),
        );
      } else {
        // Show error message
        setState(() {
          _currentError = result['error'] ?? 'Login failed';
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['error'] ?? 'Login failed'),
            backgroundColor: AppConstants.errorColor,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _currentError = 'An error occurred: $e';
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('An error occurred: $e'),
          backgroundColor: AppConstants.errorColor,
          duration: const Duration(seconds: 3),
        ),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  String _getRoleDisplayName(String role) {
    switch (role) {
      case AppConstants.roleSuperAdmin:
        return 'Super Administrator';
      case AppConstants.roleSchoolAdmin:
        return 'School Administrator';
      case AppConstants.roleTeacher:
        return 'Teacher';
      case AppConstants.roleParent:
        return 'Parent';
      default:
        return 'User';
    }
  }

  void _toggleSuperAdmin() {
    setState(() {
      _isSuperAdmin = !_isSuperAdmin;
      if (_isSuperAdmin) {
        _selectedRole = AppConstants.roleSuperAdmin;
      } else {
        _selectedRole = AppConstants.roleParent;
      }
      // Clear any current errors when switching modes
      _currentError = null;
    });
  }

  void _showDemoCredentials() {
    final credentials = AuthService.getDemoCredentials();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Demo Credentials'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Super Admin: ${credentials['super_admin']}'),
            const SizedBox(height: 8),
            Text('School Admin: ${credentials['school_admin']}'),
            const SizedBox(height: 8),
            Text('Teacher: ${credentials['teacher']}'),
            const SizedBox(height: 8),
            Text('Parent: ${credentials['parent']}'),
            const SizedBox(height: 8),
            Text('School IDs: ${credentials['school_ids']}'),
          ],
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppConstants.primaryColor,
              AppConstants.primaryDarkColor,
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(AppConstants.paddingLarge),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo and Title
                  const SizedBox(height: AppConstants.paddingLarge),
                  Icon(
                    Icons.school,
                    size: 80,
                    color: AppConstants.textWhite,
                  ),
                  const SizedBox(height: AppConstants.paddingMedium),
                  Text(
                    'Smart Campus',
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: AppConstants.textWhite,
                    ),
                  ),
                  const SizedBox(height: AppConstants.paddingSmall),
                  Text(
                    'Login to your account',
                    style: TextStyle(
                      fontSize: 16,
                      color: AppConstants.textWhite.withOpacity(0.8),
                    ),
                  ),
                  const SizedBox(height: AppConstants.paddingLarge),

                  // Super Admin Toggle
                  Card(
                    color: AppConstants.textWhite.withOpacity(0.1),
                    child: Padding(
                      padding: const EdgeInsets.all(AppConstants.paddingMedium),
                      child: Row(
                        children: [
                          Icon(
                            Icons.admin_panel_settings,
                            color: AppConstants.textWhite,
                            size: 20,
                          ),
                          const SizedBox(width: AppConstants.paddingSmall),
                          Text(
                            'Super Administrator',
                            style: TextStyle(
                              color: AppConstants.textWhite,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const Spacer(),
                          Switch(
                            value: _isSuperAdmin,
                            onChanged: (value) => _toggleSuperAdmin(),
                            activeColor: AppConstants.textWhite,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: AppConstants.paddingMedium),

                  // Error Display
                  if (_currentError != null) ...[
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(AppConstants.paddingMedium),
                      decoration: BoxDecoration(
                        color: AppConstants.errorColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(AppConstants.borderRadiusMedium),
                        border: Border.all(color: AppConstants.errorColor),
                      ),
                      child: Text(
                        _currentError!,
                        style: TextStyle(
                          color: AppConstants.errorColor,
                          fontSize: 14,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                    const SizedBox(height: AppConstants.paddingMedium),
                  ],

                  // Login Form
                  Card(
                    elevation: 8,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppConstants.borderRadiusLarge),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(AppConstants.paddingLarge),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            if (!_isSuperAdmin) ...[
                              // Role Selection (only for non-super admin)
                              DropdownButtonFormField<String>(
                                value: _selectedRole,
                                decoration: const InputDecoration(
                                  labelText: 'Login as',
                                  prefixIcon: Icon(Icons.person),
                                  border: OutlineInputBorder(),
                                ),
                                items: [
                                  DropdownMenuItem(
                                    value: AppConstants.roleParent,
                                    child: const Text('Parent'),
                                  ),
                                  DropdownMenuItem(
                                    value: AppConstants.roleTeacher,
                                    child: const Text('Teacher'),
                                  ),
                                  DropdownMenuItem(
                                    value: AppConstants.roleSchoolAdmin,
                                    child: const Text('School Administrator'),
                                  ),
                                ],
                                onChanged: (value) {
                                  setState(() {
                                    _selectedRole = value;
                                  });
                                },
                                validator: (value) {
                                  if (value == null || value.isEmpty) {
                                    return 'Please select a role';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: AppConstants.paddingMedium),
                            ],

                            // Email Field
                            TextFormField(
                              controller: _emailController,
                              keyboardType: TextInputType.emailAddress,
                              decoration: const InputDecoration(
                                labelText: 'Email',
                                prefixIcon: Icon(Icons.email),
                                border: OutlineInputBorder(),
                              ),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Please enter your email';
                                }
                                if (!AuthService.isValidEmail(value)) {
                                  return 'Please enter a valid email';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: AppConstants.paddingMedium),

                            // Password Field
                            TextFormField(
                              controller: _passwordController,
                              obscureText: _obscurePassword,
                              decoration: InputDecoration(
                                labelText: 'Password',
                                prefixIcon: const Icon(Icons.lock),
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _obscurePassword
                                        ? Icons.visibility
                                        : Icons.visibility_off,
                                  ),
                                  onPressed: () {
                                    setState(() {
                                      _obscurePassword = !_obscurePassword;
                                    });
                                  },
                                ),
                                border: const OutlineInputBorder(),
                              ),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Please enter your password';
                                }
                                if (!AuthService.isValidPassword(value)) {
                                  return 'Password must be at least 6 characters';
                                }
                                return null;
                              },
                            ),
                            
                            if (!_isSuperAdmin) ...[
                              const SizedBox(height: AppConstants.paddingMedium),
                              
                              // School ID Field (only for non-super admin)
                              TextFormField(
                                controller: _schoolIdController,
                                decoration: const InputDecoration(
                                  labelText: 'School ID',
                                  prefixIcon: Icon(Icons.school),
                                  border: OutlineInputBorder(),
                                  hintText: 'e.g., SCH-2025-A12',
                                ),
                                validator: (value) {
                                  if (value == null || value.isEmpty) {
                                    return 'Please enter your School ID';
                                  }
                                  if (!AuthService.isValidSchoolId(value)) {
                                    return 'Please enter a valid School ID format (SCH-YYYY-XXX)';
                                  }
                                  return null;
                                },
                              ),
                            ],
                            
                            const SizedBox(height: AppConstants.paddingLarge),

                            // Login Button
                            ElevatedButton(
                              onPressed: _isLoading ? null : _handleLogin,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppConstants.primaryColor,
                                foregroundColor: AppConstants.textWhite,
                                padding: const EdgeInsets.symmetric(
                                  vertical: AppConstants.paddingMedium,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(
                                    AppConstants.borderRadiusMedium,
                                  ),
                                ),
                              ),
                              child: _isLoading
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        valueColor: AlwaysStoppedAnimation<Color>(
                                          Colors.white,
                                        ),
                                      ),
                                    )
                                  : Text(
                                      _isSuperAdmin ? 'Login as Super Admin' : 'Login',
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  // Demo Credentials
                  const SizedBox(height: AppConstants.paddingLarge),
                  Card(
                    color: AppConstants.textWhite.withOpacity(0.1),
                    child: Padding(
                      padding: const EdgeInsets.all(AppConstants.paddingMedium),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Demo Credentials',
                                style: TextStyle(
                                  color: AppConstants.textWhite,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              IconButton(
                                onPressed: _showDemoCredentials,
                                icon: Icon(
                                  Icons.info_outline,
                                  color: AppConstants.textWhite,
                                  size: 20,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: AppConstants.paddingSmall),
                          Text(
                            _isSuperAdmin 
                                ? 'Super Admin: admin@school.com / admin123'
                                : 'School Admin: schooladmin@school.com / schooladmin123\n'
                                  'Teacher: teacher@school.com / teacher123\n'
                                  'Parent: any@email.com / parent123\n'
                                  'School ID: SCH-2025-A12 or SCH-2025-B45',
                            style: TextStyle(
                              color: AppConstants.textWhite.withOpacity(0.8),
                              fontSize: 12,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
} 