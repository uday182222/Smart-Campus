import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../core/constants/app_constants.dart';
import '../../services/notification_service.dart';
import '../../services/auth_service.dart';
import '../settings/privacy_policy_screen.dart';
import '../settings/terms_of_service_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notificationsEnabled = false;
  bool _attendanceReminders = false;
  bool _homeworkReminders = false;
  bool _eventReminders = false;
  bool _announcementNotifications = false;
  bool _darkModeEnabled = false;
  bool _biometricEnabled = false;
  bool _autoLoginEnabled = false;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    // Check notification permissions
    final notificationsEnabled = await NotificationService.areNotificationsEnabled();
    
    setState(() {
      _notificationsEnabled = notificationsEnabled;
      // Load other settings from SharedPreferences in the future
    });
  }

  Future<void> _toggleNotifications(bool value) async {
    if (value) {
      final granted = await NotificationService.requestNotificationPermissions();
      setState(() {
        _notificationsEnabled = granted;
      });
      
      if (granted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Notifications enabled'),
            backgroundColor: AppConstants.successColor,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please enable notifications in device settings'),
            backgroundColor: AppConstants.warningColor,
          ),
        );
      }
    } else {
      setState(() {
        _notificationsEnabled = false;
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Notifications disabled'),
          backgroundColor: AppConstants.infoColor,
        ),
      );
    }
  }

  void _showNotificationTest() async {
    await NotificationService.showNotification(
      id: DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title: 'Test Notification',
      body: 'This is a test notification from Smart Campus',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: AppConstants.textWhite,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppConstants.paddingLarge),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Notifications Section
            _buildSectionHeader('Notifications', Icons.notifications),
            const SizedBox(height: AppConstants.paddingMedium),
            
            _buildSwitchTile(
              'Enable Notifications',
              'Receive push notifications for important updates',
              _notificationsEnabled,
              _toggleNotifications,
            ),
            
            if (_notificationsEnabled) ...[
              _buildSwitchTile(
                'Attendance Reminders',
                'Get reminded to mark daily attendance',
                _attendanceReminders,
                (value) => setState(() => _attendanceReminders = value),
              ),
              _buildSwitchTile(
                'Homework Reminders',
                'Get notified about homework assignments',
                _homeworkReminders,
                (value) => setState(() => _homeworkReminders = value),
              ),
              _buildSwitchTile(
                'Event Reminders',
                'Get notified about upcoming events',
                _eventReminders,
                (value) => setState(() => _eventReminders = value),
              ),
              _buildSwitchTile(
                'Announcement Notifications',
                'Get notified about new announcements',
                _announcementNotifications,
                (value) => setState(() => _announcementNotifications = value),
              ),
              const SizedBox(height: AppConstants.paddingMedium),
              _buildActionTile(
                'Test Notification',
                'Send a test notification',
                Icons.send,
                _showNotificationTest,
              ),
            ],
            
            const SizedBox(height: AppConstants.paddingLarge),
            
            // App Settings Section
            _buildSectionHeader('App Settings', Icons.settings),
            const SizedBox(height: AppConstants.paddingMedium),
            
            _buildSwitchTile(
              'Dark Mode',
              'Use dark theme for the app',
              _darkModeEnabled,
              (value) => setState(() => _darkModeEnabled = value),
            ),
            
            _buildSwitchTile(
              'Biometric Login',
              'Use fingerprint or face ID to login',
              _biometricEnabled,
              (value) => setState(() => _biometricEnabled = value),
            ),
            
            _buildSwitchTile(
              'Auto Login',
              'Automatically login when app starts',
              _autoLoginEnabled,
              (value) => setState(() => _autoLoginEnabled = value),
            ),
            
            const SizedBox(height: AppConstants.paddingLarge),
            
            // Account Section
            _buildSectionHeader('Account', Icons.account_circle),
            const SizedBox(height: AppConstants.paddingMedium),
            
            _buildActionTile(
              'Change Password',
              'Update your login password',
              Icons.lock,
              () => _showChangePasswordDialog(),
            ),
            
            _buildActionTile(
              'Privacy Policy',
              'View our privacy policy',
              Icons.privacy_tip,
              () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const PrivacyPolicyScreen(),
                  ),
                );
              },
            ),
            
            _buildActionTile(
              'Terms of Service',
              'View our terms of service',
              Icons.description,
              () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const TermsOfServiceScreen(),
                  ),
                );
              },
            ),
            
            const SizedBox(height: AppConstants.paddingLarge),
            
            // About Section
            _buildSectionHeader('About', Icons.info),
            const SizedBox(height: AppConstants.paddingMedium),
            
            _buildInfoTile(
              'App Version',
              AppConstants.appVersion,
              Icons.info_outline,
            ),
            
            _buildInfoTile(
              'Build Number',
              '1',
              Icons.build,
            ),
            
            _buildActionTile(
              'Check for Updates',
              'Check if a new version is available',
              Icons.system_update,
              () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('You are using the latest version')),
                );
              },
            ),
            
            const SizedBox(height: AppConstants.paddingLarge),
            
            // Logout Section
            _buildSectionHeader('Account Actions', Icons.logout),
            const SizedBox(height: AppConstants.paddingMedium),
            
            _buildActionTile(
              'Logout',
              'Sign out of your account',
              Icons.logout,
              () => _showLogoutDialog(),
              isDestructive: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(
          icon,
          color: AppConstants.primaryColor,
          size: 20,
        ),
        const SizedBox(width: AppConstants.paddingSmall),
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildSwitchTile(
    String title,
    String subtitle,
    bool value,
    ValueChanged<bool> onChanged,
  ) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppConstants.paddingSmall),
      child: SwitchListTile(
        title: Text(title),
        subtitle: Text(
          subtitle,
          style: TextStyle(
            color: AppConstants.textSecondary,
            fontSize: 12,
          ),
        ),
        value: value,
        onChanged: onChanged,
        activeColor: AppConstants.primaryColor,
      ),
    );
  }

  Widget _buildActionTile(
    String title,
    String subtitle,
    IconData icon,
    VoidCallback onTap, {
    bool isDestructive = false,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppConstants.paddingSmall),
      child: ListTile(
        leading: Icon(
          icon,
          color: isDestructive ? AppConstants.errorColor : AppConstants.primaryColor,
        ),
        title: Text(
          title,
          style: TextStyle(
            color: isDestructive ? AppConstants.errorColor : AppConstants.textPrimary,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: TextStyle(
            color: AppConstants.textSecondary,
            fontSize: 12,
          ),
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }

  Widget _buildInfoTile(
    String title,
    String value,
    IconData icon,
  ) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppConstants.paddingSmall),
      child: ListTile(
        leading: Icon(
          icon,
          color: AppConstants.primaryColor,
        ),
        title: Text(title),
        subtitle: Text(
          value,
          style: TextStyle(
            color: AppConstants.textSecondary,
            fontSize: 12,
          ),
        ),
      ),
    );
  }

  void _showChangePasswordDialog() {
    final currentController = TextEditingController();
    final newController = TextEditingController();
    final confirmController = TextEditingController();
    String? confirmError;

    showDialog(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            title: const Text('Change Password'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: currentController,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'Current Password',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: newController,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'New Password',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: confirmController,
                    obscureText: true,
                    decoration: InputDecoration(
                      labelText: 'Confirm New Password',
                      border: const OutlineInputBorder(),
                      errorText: confirmError,
                    ),
                    onChanged: (_) => setDialogState(() => confirmError = null),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dialogContext),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: () async {
                  final newPassword = newController.text;
                  final confirm = confirmController.text;
                  if (newPassword != confirm) {
                    setDialogState(() => confirmError = 'Passwords do not match');
                    return;
                  }
                  if (newPassword.length < 6) {
                    setDialogState(() => confirmError = 'Password must be at least 6 characters');
                    return;
                  }
                  final user = FirebaseAuth.instance.currentUser;
                  if (user == null) {
                    if (context.mounted) {
                      Navigator.pop(dialogContext);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('You must be signed in to change password'),
                          backgroundColor: AppConstants.errorColor,
                        ),
                      );
                    }
                    return;
                  }
                  try {
                    final credential = EmailAuthProvider.credential(
                      email: user.email!,
                      password: currentController.text,
                    );
                    await user.reauthenticateWithCredential(credential);
                    await user.updatePassword(newPassword);
                    if (context.mounted) {
                      Navigator.pop(dialogContext);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Password updated successfully'),
                          backgroundColor: AppConstants.successColor,
                        ),
                      );
                    }
                  } on FirebaseAuthException catch (e) {
                    if (context.mounted) {
                      Navigator.pop(dialogContext);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(e.message ?? 'Failed to update password'),
                          backgroundColor: AppConstants.errorColor,
                        ),
                      );
                    }
                  } catch (e) {
                    if (context.mounted) {
                      Navigator.pop(dialogContext);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Failed to update password: $e'),
                          backgroundColor: AppConstants.errorColor,
                        ),
                      );
                    }
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppConstants.primaryColor,
                  foregroundColor: AppConstants.textWhite,
                ),
                child: const Text('Save'),
              ),
            ],
          );
        },
      ),
    );
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(context).pop();
              await AuthService.signOut();
              if (mounted) {
                Navigator.of(context).pushNamedAndRemoveUntil(
                  '/login',
                  (route) => false,
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppConstants.errorColor,
              foregroundColor: Colors.white,
            ),
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }
} 