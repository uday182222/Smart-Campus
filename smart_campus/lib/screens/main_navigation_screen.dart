import 'package:flutter/material.dart';
import '../core/constants/app_constants.dart';
import '../services/auth_service.dart';
import 'admin/admin_dashboard.dart';
import 'teacher/modern_teacher_dashboard.dart';
import 'parent/modern_parent_dashboard.dart';
import 'attendance/attendance_screen.dart';
import 'homework/homework_screen.dart' as parent_homework;
import 'announcements/announcements_screen.dart';
import 'events/events_screen.dart';
import 'profile/profile_screen.dart';
import 'auth/login_screen.dart';
import 'admin/school_admin_dashboard.dart';

class MainNavigationScreen extends StatefulWidget {
  final String userRole;
  
  const MainNavigationScreen({
    super.key,
    required this.userRole,
  });

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;
  
  late List<Widget> _screens;
  late List<BottomNavigationBarItem> _navigationItems;

  @override
  void initState() {
    super.initState();
    _initializeScreens();
  }

  void _initializeScreens() {
    if (widget.userRole == AppConstants.roleSuperAdmin) {
      // Admin users get the AdminDashboard directly with its own sidebar navigation
      _screens = [
        const AdminDashboard(),
      ];

      _navigationItems = [
        const BottomNavigationBarItem(
          icon: Icon(Icons.admin_panel_settings),
          label: 'Admin Panel',
        ),
      ];
    } else if (widget.userRole == AppConstants.roleSchoolAdmin) {
      // School Admin users get the SchoolAdminDashboard directly with its own sidebar navigation
      _screens = [
        const SchoolAdminDashboard(),
      ];

      _navigationItems = [
        const BottomNavigationBarItem(
          icon: Icon(Icons.school),
          label: 'School Admin',
        ),
      ];
    } else if (widget.userRole == AppConstants.roleTeacher) {
      // Teacher users get the ModernTeacherDashboard directly with its own navigation
      _screens = [
        const ModernTeacherDashboard(),
      ];

      _navigationItems = [
        const BottomNavigationBarItem(
          icon: Icon(Icons.school),
          label: 'Teacher Panel',
        ),
      ];
    } else {
      // Regular user screens (Parent) - Use Modern Parent Dashboard
      _screens = [
        const ModernParentDashboard(),
        const AttendanceScreen(),
        const parent_homework.HomeworkScreen(),
        AnnouncementsScreen(userRole: widget.userRole),
        const EventsScreen(),
        const ProfileScreen(),
      ];

      _navigationItems = [
        const BottomNavigationBarItem(
          icon: Icon(Icons.home),
          label: AppConstants.homeLabel,
        ),
        const BottomNavigationBarItem(
          icon: Icon(Icons.check_circle),
          label: AppConstants.attendanceLabel,
        ),
        const BottomNavigationBarItem(
          icon: Icon(Icons.assignment),
          label: AppConstants.homeworkLabel,
        ),
        const BottomNavigationBarItem(
          icon: Icon(Icons.announcement),
          label: AppConstants.announcementsLabel,
        ),
        const BottomNavigationBarItem(
          icon: Icon(Icons.event),
          label: AppConstants.eventsLabel,
        ),
        const BottomNavigationBarItem(
          icon: Icon(Icons.person),
          label: AppConstants.profileLabel,
        ),
      ];
    }
  }

  Future<void> _handleLogout() async {
    // Show confirmation dialog
    final shouldLogout = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppConstants.errorColor,
              foregroundColor: Colors.white,
            ),
            child: const Text('Logout'),
          ),
        ],
      ),
    );

    if (shouldLogout == true) {
      try {
        await AuthService.signOut();
        
        if (mounted) {
          // Navigate to login screen
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(
              builder: (context) => const LoginScreen(),
            ),
            (route) => false, // Remove all previous routes
          );

          // Show success message
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Logged out successfully'),
              backgroundColor: AppConstants.successColor,
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error logging out: $e'),
              backgroundColor: AppConstants.errorColor,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: widget.userRole == AppConstants.roleSuperAdmin || 
                           widget.userRole == AppConstants.roleSchoolAdmin ||
                           widget.userRole == AppConstants.roleTeacher
          ? null // Hide bottom navigation for admin and teacher users (they have their own navigation)
          : BottomNavigationBar(
              type: BottomNavigationBarType.fixed,
              currentIndex: _currentIndex,
              onTap: (index) {
                setState(() {
                  _currentIndex = index;
                });
              },
              selectedItemColor: AppConstants.primaryColor,
              unselectedItemColor: AppConstants.textSecondary,
              backgroundColor: Colors.white,
              elevation: 8,
              items: _navigationItems,
            ),
      // Add floating action button for quick actions
      floatingActionButton: widget.userRole != AppConstants.roleSuperAdmin && 
                           widget.userRole != AppConstants.roleSchoolAdmin &&
                           widget.userRole != AppConstants.roleTeacher
          ? FloatingActionButton(
              onPressed: () {
                _showQuickActions(context);
              },
              backgroundColor: AppConstants.primaryColor,
              foregroundColor: Colors.white,
              child: const Icon(Icons.add),
            )
          : null,
    );
  }

  void _showQuickActions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(AppConstants.paddingLarge),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Quick Actions',
              style: AppConstants.headingStyle,
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            if (widget.userRole == AppConstants.roleTeacher) ...[
              _buildQuickActionTile(
                context,
                'Mark Attendance',
                Icons.check_circle,
                () {
                  Navigator.pop(context);
                  setState(() {
                    _currentIndex = 1; // Attendance tab
                  });
                },
              ),
              _buildQuickActionTile(
                context,
                'Add Homework',
                Icons.assignment,
                () {
                  Navigator.pop(context);
                  setState(() {
                    _currentIndex = 2; // Homework tab
                  });
                },
              ),
            ] else ...[
              _buildQuickActionTile(
                context,
                'View Attendance',
                Icons.check_circle,
                () {
                  Navigator.pop(context);
                  setState(() {
                    _currentIndex = 1; // Attendance tab
                  });
                },
              ),
              _buildQuickActionTile(
                context,
                'Check Homework',
                Icons.assignment,
                () {
                  Navigator.pop(context);
                  setState(() {
                    _currentIndex = 2; // Homework tab
                  });
                },
              ),
            ],
            _buildQuickActionTile(
              context,
              'Logout',
              Icons.logout,
              () {
                Navigator.pop(context);
                _handleLogout();
              },
              isDestructive: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActionTile(
    BuildContext context,
    String title,
    IconData icon,
    VoidCallback onTap, {
    bool isDestructive = false,
  }) {
    return ListTile(
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
      onTap: onTap,
    );
  }
} 