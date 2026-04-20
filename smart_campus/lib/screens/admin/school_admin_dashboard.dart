import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';
import '../../core/utils/responsive_utils.dart';
import '../../services/auth_service.dart';
import '../auth/login_screen.dart';
import 'users/user_management_screen.dart';
import 'students/student_list_screen.dart';
import 'teachers/teacher_list_screen.dart';
import 'classes/class_list_screen.dart';
import 'attendance/attendance_monitoring_screen.dart';
import 'reports/exam_reports_screen.dart';
import 'announcements/announcement_management_screen.dart';
import 'fees/fees_tracking_screen.dart';
import 'data_export/data_export_screen.dart';
import '../profile/profile_screen.dart';

class SchoolAdminDashboard extends StatefulWidget {
  const SchoolAdminDashboard({super.key});

  @override
  State<SchoolAdminDashboard> createState() => _SchoolAdminDashboardState();
}

class _SchoolAdminDashboardState extends State<SchoolAdminDashboard> {
  int _selectedIndex = 0;
  bool _isSidebarCollapsed = false;

  final List<Widget> _screens = [
    const _HomeScreen(),
    const UserManagementScreen(),
    const StudentListScreen(),
    const TeacherListScreen(),
    const ClassListScreen(),
    const AttendanceMonitoringScreen(),
    const ExamReportsScreen(),
    const AnnouncementManagementScreen(),
    const FeesTrackingScreen(),
    const DataExportScreen(),
    const ProfileScreen(),
  ];

  final List<_NavigationItem> _navigationItems = [
    _NavigationItem(
      icon: Icons.home,
      label: 'Home',
      isSelected: true,
    ),
    _NavigationItem(
      icon: Icons.people,
      label: 'Users',
      isSelected: false,
    ),
    _NavigationItem(
      icon: Icons.school,
      label: 'Students',
      isSelected: false,
    ),
    _NavigationItem(
      icon: Icons.person,
      label: 'Teachers',
      isSelected: false,
    ),
    _NavigationItem(
      icon: Icons.class_,
      label: 'Classes',
      isSelected: false,
    ),
    _NavigationItem(
      icon: Icons.analytics,
      label: 'Attendance',
      isSelected: false,
    ),
    _NavigationItem(
      icon: Icons.assessment,
      label: 'Reports',
      isSelected: false,
    ),
    _NavigationItem(
      icon: Icons.announcement,
      label: 'Announcements',
      isSelected: false,
    ),
    _NavigationItem(
      icon: Icons.account_balance_wallet,
      label: 'Fees',
      isSelected: false,
    ),
    _NavigationItem(
      icon: Icons.file_download,
      label: 'Export',
      isSelected: false,
    ),
    _NavigationItem(
      icon: Icons.person,
      label: 'Profile',
      isSelected: false,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final isMobile = ResponsiveUtils.isMobile(context);
    
    // For mobile, use bottom navigation instead of sidebar
    if (isMobile) {
      return Scaffold(
        appBar: AppBar(
          title: Text(_navigationItems[_selectedIndex].label),
          backgroundColor: AppConstants.schoolAdminColor,
          foregroundColor: Colors.white,
          elevation: 0,
          actions: [
            IconButton(
              onPressed: () async {
                try {
                  await AuthService.signOut();
                  if (context.mounted) {
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(
                        builder: (context) => const LoginScreen(),
                      ),
                      (route) => false,
                    );
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Logged out successfully'),
                        backgroundColor: AppConstants.successColor,
                      ),
                    );
                  }
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Error logging out: $e'),
                        backgroundColor: AppConstants.errorColor,
                      ),
                    );
                  }
                }
              },
              icon: const Icon(Icons.logout),
            ),
          ],
        ),
        body: _screens[_selectedIndex],
        bottomNavigationBar: BottomNavigationBar(
          type: BottomNavigationBarType.fixed,
          currentIndex: _selectedIndex,
          onTap: (index) {
            setState(() {
              _selectedIndex = index;
              // Update navigation items selection
              for (int i = 0; i < _navigationItems.length; i++) {
                _navigationItems[i] = _navigationItems[i].copyWith(
                  isSelected: i == index,
                );
              }
            });
          },
          backgroundColor: AppConstants.surfaceColor,
          selectedItemColor: AppConstants.schoolAdminColor,
          unselectedItemColor: Colors.grey,
          items: _navigationItems.map((item) {
            return BottomNavigationBarItem(
              icon: Icon(item.icon),
              label: item.label,
            );
          }).toList(),
        ),
      );
    }
    
    // For tablet and desktop, use sidebar navigation
    return Scaffold(
      body: Row(
        children: [
          // Sidebar
          Container(
            width: ResponsiveUtils.getResponsiveSidebarWidth(context, _isSidebarCollapsed),
            decoration: BoxDecoration(
              color: AppConstants.surfaceColor,
              border: Border(
                right: BorderSide(
                  color: Colors.grey.withValues(alpha: 0.2),
                  width: 1,
                ),
              ),
            ),
            child: Column(
              children: [
                // Header
                Container(
                  padding: EdgeInsets.all(_isSidebarCollapsed ? 12 : ResponsiveUtils.getResponsiveSpacing(context)),
                  decoration: BoxDecoration(
                    color: AppConstants.schoolAdminColor,
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.school,
                        color: Colors.white,
                        size: ResponsiveUtils.getResponsiveIconSize(
                          context,
                          mobile: _isSidebarCollapsed ? 24 : 28,
                          tablet: _isSidebarCollapsed ? 26 : 30,
                          desktop: _isSidebarCollapsed ? 28 : 32,
                        ),
                      ),
                      if (!_isSidebarCollapsed) ...[
                        ResponsiveUtils.getResponsiveHorizontalSpacingWidget(context),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'School Admin',
                                style: ResponsiveUtils.getResponsiveHeadingStyle(
                                  context,
                                  fontSize: ResponsiveUtils.getResponsiveFontSize(
                                    context,
                                    mobile: 16,
                                    tablet: 18,
                                    desktop: 20,
                                  ),
                                  color: Colors.white,
                                ),
                              ),
                              Text(
                                'Smart Campus',
                                style: ResponsiveUtils.getResponsiveCaptionStyle(
                                  context,
                                  fontSize: ResponsiveUtils.getResponsiveFontSize(
                                    context,
                                    mobile: 10,
                                    tablet: 12,
                                    desktop: 14,
                                  ),
                                  color: Colors.white70,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                
                // Navigation Items
                Expanded(
                  child: ListView.builder(
                    padding: EdgeInsets.symmetric(
                      vertical: _isSidebarCollapsed ? 8 : ResponsiveUtils.getResponsiveSpacing(context),
                    ),
                    itemCount: _navigationItems.length,
                    itemBuilder: (context, index) {
                      final item = _navigationItems[index];
                      return _buildNavigationItem(item, index);
                    },
                  ),
                ),
                
                // Logout Button
                Container(
                  padding: EdgeInsets.all(_isSidebarCollapsed ? 8 : ResponsiveUtils.getResponsiveSpacing(context)),
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        try {
                          await AuthService.signOut();
                          if (context.mounted) {
                            Navigator.of(context).pushAndRemoveUntil(
                              MaterialPageRoute(
                                builder: (context) => const LoginScreen(),
                              ),
                              (route) => false,
                            );
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Logged out successfully'),
                                backgroundColor: AppConstants.successColor,
                              ),
                            );
                          }
                        } catch (e) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Error logging out: $e'),
                                backgroundColor: AppConstants.errorColor,
                              ),
                            );
                          }
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppConstants.errorColor,
                        foregroundColor: Colors.white,
                        padding: EdgeInsets.symmetric(
                          horizontal: _isSidebarCollapsed ? 8 : ResponsiveUtils.getResponsiveSpacing(context),
                          vertical: ResponsiveUtils.getResponsiveSpacing(context),
                        ),
                      ),
                      icon: Icon(
                        Icons.logout,
                        size: ResponsiveUtils.getResponsiveIconSize(
                          context,
                          mobile: 16,
                          tablet: 18,
                          desktop: 20,
                        ),
                      ),
                      label: _isSidebarCollapsed
                          ? const SizedBox.shrink()
                          : Text(
                              'Logout',
                              style: ResponsiveUtils.getResponsiveBodyStyle(
                                context,
                                fontSize: ResponsiveUtils.getResponsiveFontSize(
                                  context,
                                  mobile: 12,
                                  tablet: 14,
                                  desktop: 16,
                                ),
                                color: Colors.white,
                              ),
                            ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // Main Content Area
          Expanded(
            child: Column(
              children: [
                // Top Bar with Toggle Button
                Container(
                  padding: const EdgeInsets.all(AppConstants.paddingMedium),
                  decoration: BoxDecoration(
                    color: AppConstants.surfaceColor,
                    border: Border(
                      bottom: BorderSide(
                        color: Colors.grey.withValues(alpha: 0.2),
                        width: 1,
                      ),
                    ),
                  ),
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: () {
                          setState(() {
                            _isSidebarCollapsed = !_isSidebarCollapsed;
                          });
                        },
                        icon: Icon(
                          _isSidebarCollapsed ? Icons.menu : Icons.close,
                          color: AppConstants.textPrimary,
                        ),
                      ),
                      const SizedBox(width: AppConstants.paddingMedium),
                      Text(
                        _navigationItems[_selectedIndex].label,
                        style: AppConstants.subheadingStyle,
                      ),
                    ],
                  ),
                ),
                
                // Main Screen Content
                Expanded(
                  child: _screens[_selectedIndex],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavigationItem(_NavigationItem item, int index) {
    final isMobile = ResponsiveUtils.isMobile(context);
    
    if (isMobile) {
      return const SizedBox.shrink(); // Not used in mobile mode
    }
    
    return Container(
      margin: EdgeInsets.symmetric(
        horizontal: ResponsiveUtils.getResponsiveSpacing(context),
        vertical: 4,
      ),
      decoration: BoxDecoration(
        color: item.isSelected 
            ? AppConstants.schoolAdminColor.withValues(alpha: 0.1)
            : Colors.transparent,
        borderRadius: BorderRadius.circular(AppConstants.borderRadiusMedium),
        border: item.isSelected
            ? Border.all(color: AppConstants.schoolAdminColor.withValues(alpha: 0.3))
            : null,
      ),
      child: ListTile(
        leading: Icon(
          item.icon,
          color: item.isSelected 
              ? AppConstants.schoolAdminColor
              : AppConstants.textSecondary,
          size: ResponsiveUtils.getResponsiveIconSize(
            context,
            mobile: 20,
            tablet: 22,
            desktop: 24,
          ),
        ),
        title: _isSidebarCollapsed
            ? null
            : Text(
                item.label,
                style: ResponsiveUtils.getResponsiveBodyStyle(
                  context,
                  fontSize: ResponsiveUtils.getResponsiveFontSize(
                    context,
                    mobile: 12,
                    tablet: 14,
                    desktop: 16,
                  ),
                  color: item.isSelected 
                      ? AppConstants.schoolAdminColor
                      : AppConstants.textPrimary,
                  fontWeight: item.isSelected ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
        onTap: () {
          setState(() {
            _selectedIndex = index;
            // Update navigation items selection
            for (int i = 0; i < _navigationItems.length; i++) {
              _navigationItems[i] = _navigationItems[i].copyWith(
                isSelected: i == index,
              );
            }
          });
        },
      ),
    );
  }
}

// Navigation Item Model
class _NavigationItem {
  final IconData icon;
  final String label;
  final bool isSelected;

  const _NavigationItem({
    required this.icon,
    required this.label,
    required this.isSelected,
  });

  _NavigationItem copyWith({
    IconData? icon,
    String? label,
    bool? isSelected,
  }) {
    return _NavigationItem(
      icon: icon ?? this.icon,
      label: label ?? this.label,
      isSelected: isSelected ?? this.isSelected,
    );
  }
}

// Home Screen for School Admin
class _HomeScreen extends StatelessWidget {
  const _HomeScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppConstants.paddingLarge),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppConstants.paddingLarge),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppConstants.schoolAdminColor,
                    AppConstants.schoolAdminColor.withValues(alpha: 0.8),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(AppConstants.borderRadiusLarge),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Welcome to School Admin Dashboard',
                    style: ResponsiveUtils.getResponsiveHeadingStyle(
                      context,
                      fontSize: ResponsiveUtils.getResponsiveFontSize(
                        context,
                        mobile: 20,
                        tablet: 24,
                        desktop: 28,
                      ),
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: AppConstants.paddingMedium),
                  Text(
                    'Manage your school operations efficiently with comprehensive tools and insights',
                    style: ResponsiveUtils.getResponsiveBodyStyle(
                      context,
                      fontSize: ResponsiveUtils.getResponsiveFontSize(
                        context,
                        mobile: 14,
                        tablet: 16,
                        desktop: 18,
                      ),
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: AppConstants.paddingLarge),
            
            // Quick Stats
            Text(
              'Quick Overview',
              style: ResponsiveUtils.getResponsiveSubheadingStyle(
                context,
                fontSize: ResponsiveUtils.getResponsiveFontSize(
                  context,
                  mobile: 18,
                  tablet: 20,
                  desktop: 22,
                ),
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            // Stats Grid
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: ResponsiveUtils.getResponsiveGridColumns(context),
              crossAxisSpacing: AppConstants.paddingMedium,
              mainAxisSpacing: AppConstants.paddingMedium,
              childAspectRatio: ResponsiveUtils.getResponsiveCardAspectRatio(context),
              children: [
                _buildStatCard(
                  context,
                  'Total Students',
                  '1,247',
                  Icons.people,
                  AppConstants.primaryColor,
                ),
                _buildStatCard(
                  context,
                  'Total Teachers',
                  '89',
                  Icons.school,
                  AppConstants.secondaryColor,
                ),
                _buildStatCard(
                  context,
                  'Active Classes',
                  '32',
                  Icons.class_,
                  AppConstants.successColor,
                ),
                _buildStatCard(
                  context,
                  'Total Revenue',
                  '\$45,230',
                  Icons.account_balance_wallet,
                  AppConstants.warningColor,
                ),
              ],
            ),
            
            const SizedBox(height: AppConstants.paddingLarge),
            
            // Recent Activities
            Text(
              'Recent Activities',
              style: ResponsiveUtils.getResponsiveSubheadingStyle(
                context,
                fontSize: ResponsiveUtils.getResponsiveFontSize(
                  context,
                  mobile: 18,
                  tablet: 20,
                  desktop: 22,
                ),
              ),
            ),
            const SizedBox(height: AppConstants.paddingMedium),
            
            _buildRecentActivities(context),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(BuildContext context, String title, String value, IconData icon, Color color) {
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
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: ResponsiveUtils.getResponsiveIconSize(
                context,
                mobile: 32,
                tablet: 36,
                desktop: 40,
              ),
              color: color,
            ),
            const SizedBox(height: AppConstants.paddingSmall),
            Text(
              value,
              style: ResponsiveUtils.getResponsiveHeadingStyle(
                context,
                fontSize: ResponsiveUtils.getResponsiveFontSize(
                  context,
                  mobile: 18,
                  tablet: 20,
                  desktop: 24,
                ),
                color: AppConstants.textPrimary,
              ),
            ),
            const SizedBox(height: AppConstants.paddingSmall),
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
      ),
    );
  }

  Widget _buildRecentActivities(BuildContext context) {
    final activities = [
      {'action': 'New student enrolled', 'time': '2 hours ago', 'type': 'enrollment'},
      {'action': 'Attendance marked for Class 10A', 'time': '4 hours ago', 'type': 'attendance'},
      {'action': 'Exam results uploaded for Class 9B', 'time': '6 hours ago', 'type': 'exam'},
      {'action': 'Fee payment received from John Doe', 'time': '1 day ago', 'type': 'payment'},
      {'action': 'New announcement posted', 'time': '1 day ago', 'type': 'announcement'},
    ];

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
      child: ListView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: activities.length,
        itemBuilder: (context, index) {
          final activity = activities[index];
          return ListTile(
            leading: CircleAvatar(
              backgroundColor: _getActivityColor(activity['type']!),
              child: Icon(
                _getActivityIcon(activity['type']!),
                color: Colors.white,
                size: 20,
              ),
            ),
            title: Text(
              activity['action']!,
              style: ResponsiveUtils.getResponsiveBodyStyle(
                context,
                fontSize: ResponsiveUtils.getResponsiveFontSize(
                  context,
                  mobile: 14,
                  tablet: 16,
                  desktop: 18,
                ),
              ),
            ),
            subtitle: Text(
              activity['time']!,
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
            ),
          );
        },
      ),
    );
  }

  Color _getActivityColor(String type) {
    switch (type) {
      case 'enrollment':
        return AppConstants.successColor;
      case 'attendance':
        return AppConstants.primaryColor;
      case 'exam':
        return AppConstants.warningColor;
      case 'payment':
        return AppConstants.successColor;
      case 'announcement':
        return AppConstants.infoColor;
      default:
        return AppConstants.secondaryColor;
    }
  }

  IconData _getActivityIcon(String type) {
    switch (type) {
      case 'enrollment':
        return Icons.person_add;
      case 'attendance':
        return Icons.check_circle;
      case 'exam':
        return Icons.assessment;
      case 'payment':
        return Icons.payment;
      case 'announcement':
        return Icons.announcement;
      default:
        return Icons.info;
    }
  }
}
