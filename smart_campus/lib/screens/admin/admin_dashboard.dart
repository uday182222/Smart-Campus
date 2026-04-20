import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';
import '../../core/utils/responsive_utils.dart';
import '../../services/auth_service.dart';
import '../auth/login_screen.dart';
import 'users/user_management_screen.dart';
import 'students/student_list_screen.dart';
import 'teachers/teacher_list_screen.dart';
import 'classes/class_list_screen.dart';
import 'schools/school_management_screen.dart';
import 'statistics/statistics_screen.dart';
import '../announcements/announcements_screen.dart';
import '../profile/profile_screen.dart';

class AdminDashboard extends StatefulWidget {
  const AdminDashboard({super.key});

  @override
  State<AdminDashboard> createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard> {
  int _selectedIndex = 0;
  bool _isSidebarCollapsed = false;
  late List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      _HomeScreen(onNavigateToSection: _navigateToSection),
      const UserManagementScreen(),
      const StudentListScreen(),
      const TeacherListScreen(),
      const ClassListScreen(),
      const SchoolManagementScreen(),
      const StatisticsScreen(),
      const AnnouncementsScreen(),
      const ProfileScreen(),
    ];
  }

  final List<_NavigationItem> _navigationItems = [
    _NavigationItem(
      icon: Icons.home,
      label: 'Home',
      isSelected: true,
    ),
    _NavigationItem(
      icon: Icons.people,
      label: 'Manage Users',
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
      icon: Icons.school,
      label: 'Manage Schools',
      isSelected: false,
    ),
    _NavigationItem(
      icon: Icons.analytics,
      label: 'Statistics',
      isSelected: false,
    ),
    _NavigationItem(
      icon: Icons.announcement,
      label: 'Announcements',
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
    // Auto-collapse sidebar on mobile
    if (isMobile && !_isSidebarCollapsed) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        setState(() {
          _isSidebarCollapsed = true;
        });
      });
    }

    return Scaffold(
      body: Row(
        children: [
          // Responsive Sidebar
          if (!isMobile || !_isSidebarCollapsed)
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
                  // Responsive Header
                  Container(
                    padding: EdgeInsets.all(_isSidebarCollapsed ? 12 : ResponsiveUtils.getResponsiveSpacing(context)),
                    decoration: BoxDecoration(
                      color: AppConstants.primaryColor,
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.admin_panel_settings,
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
                                  'Admin Panel',
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
                  
                  // Responsive Navigation Items
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
                  
                  // Responsive Logout Button
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
                                (route) => false, // Remove all previous routes
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
                        icon: Icon(
                          Icons.logout,
                          size: ResponsiveUtils.getResponsiveIconSize(
                            context,
                            mobile: 16,
                            tablet: 18,
                            desktop: 20,
                          ),
                        ),
                        label: _isSidebarCollapsed ? const SizedBox.shrink() : Text(
                          'Logout',
                          style: ResponsiveUtils.getResponsiveBodyStyle(context),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppConstants.errorColor,
                          foregroundColor: Colors.white,
                          padding: EdgeInsets.symmetric(
                            vertical: _isSidebarCollapsed ? 8 : ResponsiveUtils.getResponsiveSpacing(context),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          
          // Main Content Area with Responsive Layout
          Expanded(
            child: Stack(
              children: [
                _screens[_selectedIndex],
                // Mobile menu button
                if (isMobile)
                  Positioned(
                    top: ResponsiveUtils.getResponsiveSpacing(context),
                    left: ResponsiveUtils.getResponsiveSpacing(context),
                    child: FloatingActionButton(
                      mini: true,
                      onPressed: () {
                        setState(() {
                          _isSidebarCollapsed = !_isSidebarCollapsed;
                        });
                      },
                      backgroundColor: AppConstants.primaryColor,
                      foregroundColor: Colors.white,
                      child: Icon(_isSidebarCollapsed ? Icons.menu : Icons.close),
                    ),
                  ),
                // Mobile overlay when sidebar is open
                if (isMobile && !_isSidebarCollapsed)
                  Positioned.fill(
                    child: GestureDetector(
                      onTap: () {
                        setState(() {
                          _isSidebarCollapsed = true;
                        });
                      },
                      child: Container(
                        color: Colors.black54,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavigationItem(_NavigationItem item, int index) {
    final isSelected = _selectedIndex == index;
    final isMobile = ResponsiveUtils.isMobile(context);
    
    return Container(
      margin: EdgeInsets.symmetric(
        horizontal: _isSidebarCollapsed ? 4 : ResponsiveUtils.getResponsiveSpacing(context),
        vertical: 2,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            setState(() {
              _selectedIndex = index;
              // Auto-collapse sidebar on mobile after selection
              if (isMobile) {
                _isSidebarCollapsed = true;
              }
            });
          },
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: EdgeInsets.symmetric(
              horizontal: _isSidebarCollapsed ? 8 : ResponsiveUtils.getResponsiveSpacing(context),
              vertical: _isSidebarCollapsed ? 12 : ResponsiveUtils.getResponsiveSpacing(context),
            ),
            decoration: BoxDecoration(
              color: isSelected 
                  ? AppConstants.primaryColor.withValues(alpha: 0.1)
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(8),
              border: isSelected
                  ? Border.all(
                      color: AppConstants.primaryColor,
                      width: 1,
                    )
                  : null,
            ),
            child: _isSidebarCollapsed
                ? Icon(
                    item.icon,
                    color: isSelected 
                        ? AppConstants.primaryColor
                        : AppConstants.textSecondary,
                    size: ResponsiveUtils.getResponsiveIconSize(context, mobile: 20),
                  )
                : Row(
                    children: [
                      Icon(
                        item.icon,
                        color: isSelected 
                            ? AppConstants.primaryColor
                            : AppConstants.textSecondary,
                        size: ResponsiveUtils.getResponsiveIconSize(
                          context,
                          mobile: 18,
                          tablet: 20,
                          desktop: 22,
                        ),
                      ),
                      ResponsiveUtils.getResponsiveHorizontalSpacingWidget(context),
                      Expanded(
                        child: Text(
                          item.label,
                          style: ResponsiveUtils.getResponsiveBodyStyle(
                            context,
                            fontSize: ResponsiveUtils.getResponsiveFontSize(
                              context,
                              mobile: 13,
                              tablet: 14,
                              desktop: 16,
                            ),
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                            color: isSelected 
                                ? AppConstants.primaryColor
                                : AppConstants.textSecondary,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }

  void _navigateToSection(int index) {
    setState(() {
      _selectedIndex = index;
      // Auto-collapse sidebar on mobile after selection
      if (ResponsiveUtils.isMobile(context)) {
        _isSidebarCollapsed = true;
      }
    });
  }

  // ignore: unused_element
  Widget _buildActionCard(
    BuildContext context,
    String title,
    IconData icon,
    String description,
    Color color,
    VoidCallback onTap,
    bool isMobile,
    bool isTablet,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: AppConstants.surfaceColor,
        borderRadius: BorderRadius.circular(isMobile ? 8 : 12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.1),
            blurRadius: isMobile ? 4 : 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(isMobile ? 8 : 12),
          child: Padding(
            padding: EdgeInsets.all(isMobile ? 16 : ResponsiveUtils.getResponsiveSpacing(context)),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
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
                SizedBox(height: isMobile ? 8 : ResponsiveUtils.getResponsiveSpacing(context)),
                Flexible(
                  child: Text(
                    title,
                    style: ResponsiveUtils.getResponsiveBodyStyle(
                      context,
                      fontSize: ResponsiveUtils.getResponsiveFontSize(
                        context,
                        mobile: 13,
                        tablet: 14,
                        desktop: 15,
                      ),
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                SizedBox(height: isMobile ? 4 : 6),
                Flexible(
                  child: Text(
                    description,
                    style: ResponsiveUtils.getResponsiveBodyStyle(
                      context,
                      fontSize: ResponsiveUtils.getResponsiveFontSize(
                        context,
                        mobile: 9,
                        tablet: 10,
                        desktop: 11,
                      ),
                      color: AppConstants.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                    overflow: TextOverflow.ellipsis,
                    maxLines: 2,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NavigationItem {
  final IconData icon;
  final String label;
  final bool isSelected;

  _NavigationItem({
    required this.icon,
    required this.label,
    required this.isSelected,
  });
}

class _HomeScreen extends StatelessWidget {
  final Function(int) onNavigateToSection;
  
  const _HomeScreen({required this.onNavigateToSection});

  @override
  Widget build(BuildContext context) {
    final isMobile = ResponsiveUtils.isMobile(context);
    final isTablet = ResponsiveUtils.isTablet(context);
    
    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      body: SingleChildScrollView(
        padding: EdgeInsets.all(isMobile ? 12 : ResponsiveUtils.getResponsiveSpacing(context)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Responsive Header
            _buildResponsiveHeader(context),
            
            SizedBox(height: isMobile ? 16 : ResponsiveUtils.getResponsiveSpacing(context)),
            
            // Responsive Quick Stats
            _buildResponsiveQuickStats(context, isMobile, isTablet),
            
            SizedBox(height: isMobile ? 16 : ResponsiveUtils.getResponsiveSpacing(context)),
            
            // Responsive Recent Activity
            _buildResponsiveRecentActivity(context, isMobile, isTablet),
            
            SizedBox(height: isMobile ? 16 : ResponsiveUtils.getResponsiveSpacing(context)),
            
            // Responsive Quick Actions
            _buildResponsiveQuickActions(context, isMobile, isTablet),
          ],
        ),
      ),
    );
  }

  Widget _buildResponsiveHeader(BuildContext context) {
    final isMobile = ResponsiveUtils.isMobile(context);
    return Container(
      padding: ResponsiveUtils.getResponsivePadding(context),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: ResponsiveUtils.getResponsiveSpacing(context),
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Admin Dashboard',
                  style: ResponsiveUtils.getResponsiveHeadingStyle(context),
                ),
                const SizedBox(height: 4),
                Text(
                  'Welcome back, Administrator',
                  style: ResponsiveUtils.getResponsiveBodyStyle(context),
                ),
              ],
            ),
          ),
          // Add a test button to verify responsive design
          ElevatedButton(
            onPressed: () {
              final width = MediaQuery.of(context).size.width;
              final height = MediaQuery.of(context).size.height;
              final isMobile = ResponsiveUtils.isMobile(context);
              final isTablet = ResponsiveUtils.isTablet(context);
              final isDesktop = ResponsiveUtils.isDesktop(context);
              final isLargeDesktop = ResponsiveUtils.isLargeDesktop(context);
              
              String deviceType = 'Unknown';
              if (isMobile) deviceType = 'Mobile';
              else if (isTablet) deviceType = 'Tablet';
              else if (isDesktop) deviceType = 'Desktop';
              else if (isLargeDesktop) deviceType = 'Large Desktop';
              
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Responsive Design Working!',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Text('Screen: ${width.toInt()}x${height.toInt()}px'),
                      Text('Device: $deviceType'),
                      Text('Breakpoint: ${ResponsiveUtils.mobileBreakpoint.toInt()}px'),
                    ],
                  ),
                  duration: const Duration(seconds: 4),
                  backgroundColor: AppConstants.primaryColor,
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppConstants.primaryColor,
              foregroundColor: Colors.white,
              padding: EdgeInsets.symmetric(
                horizontal: isMobile ? 12 : 16,
                vertical: isMobile ? 8 : 12,
              ),
            ),
            child: Text(
              'Test Responsive',
              style: TextStyle(
                fontSize: ResponsiveUtils.getResponsiveFontSize(
                  context,
                  mobile: 12,
                  tablet: 14,
                  desktop: 16,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResponsiveQuickStats(BuildContext context, bool isMobile, bool isTablet) {
    final crossAxisCount = isMobile ? 2 : (isTablet ? 3 : 4);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Platform Overview',
          style: ResponsiveUtils.getResponsiveHeadingStyle(
            context,
            fontSize: ResponsiveUtils.getResponsiveFontSize(
              context,
              mobile: 18,
              tablet: 19,
              desktop: 20,
            ),
            fontWeight: FontWeight.bold,
            color: AppConstants.textPrimary,
          ),
        ),
        SizedBox(height: ResponsiveUtils.getResponsiveSpacing(context)),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: crossAxisCount,
          crossAxisSpacing: ResponsiveUtils.getResponsiveSpacing(context),
          mainAxisSpacing: ResponsiveUtils.getResponsiveSpacing(context),
          childAspectRatio: isMobile ? 1.2 : (isTablet ? 1.4 : 1.6),
          children: [
            _buildStatCard(
              context,
              'Total Schools',
              '3',
              Icons.school,
              AppConstants.primaryColor,
              isMobile,
              isTablet,
            ),
            _buildStatCard(
              context,
              'Total Users',
              '156',
              Icons.people,
              AppConstants.secondaryColor,
              isMobile,
              isTablet,
            ),
            _buildStatCard(
              context,
              'Total Students',
              '1,234',
              Icons.person,
              AppConstants.successColor,
              isMobile,
              isTablet,
            ),
            _buildStatCard(
              context,
              'Active Classes',
              '45',
              Icons.class_,
              AppConstants.warningColor,
              isMobile,
              isTablet,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard(BuildContext context, String label, String value, IconData icon, Color color, bool isMobile, bool isTablet) {
    return Container(
      padding: EdgeInsets.all(isMobile ? 8 : ResponsiveUtils.getResponsiveSpacing(context)),
      decoration: BoxDecoration(
        color: AppConstants.surfaceColor,
        borderRadius: BorderRadius.circular(isMobile ? 8 : 12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.1),
            blurRadius: isMobile ? 4 : 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: ResponsiveUtils.getResponsiveIconSize(
              context,
              mobile: 20,
              tablet: 24,
              desktop: 28,
            ),
            color: color,
          ),
          SizedBox(height: isMobile ? 4 : 6),
          Flexible(
            child: Text(
              value,
              style: ResponsiveUtils.getResponsiveBodyStyle(
                context,
                fontSize: ResponsiveUtils.getResponsiveFontSize(
                  context,
                  mobile: 16,
                  tablet: 18,
                  desktop: 20,
                ),
                fontWeight: FontWeight.bold,
                color: color,
              ),
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          SizedBox(height: isMobile ? 2 : 3),
          Flexible(
            child: Text(
              label,
              style: ResponsiveUtils.getResponsiveBodyStyle(
                context,
                fontSize: ResponsiveUtils.getResponsiveFontSize(
                  context,
                  mobile: 9,
                  tablet: 10,
                  desktop: 11,
                ),
                color: AppConstants.textSecondary,
              ),
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
              maxLines: 2,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResponsiveRecentActivity(BuildContext context, bool isMobile, bool isTablet) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                'Recent Activity',
                style: ResponsiveUtils.getResponsiveHeadingStyle(
                  context,
                  fontSize: ResponsiveUtils.getResponsiveFontSize(
                    context,
                    mobile: 18,
                    tablet: 19,
                    desktop: 20,
                  ),
                  fontWeight: FontWeight.bold,
                  color: AppConstants.textPrimary,
                ),
              ),
            ),
            TextButton(
              onPressed: () {
                // TODO: Navigate to full activity log
              },
              child: Text(
                'View All',
                style: ResponsiveUtils.getResponsiveBodyStyle(
                  context,
                  fontSize: ResponsiveUtils.getResponsiveFontSize(
                    context,
                    mobile: 12,
                    tablet: 14,
                    desktop: 14,
                  ),
                ),
              ),
            ),
          ],
        ),
        SizedBox(height: ResponsiveUtils.getResponsiveSpacing(context)),
        Container(
          padding: EdgeInsets.all(ResponsiveUtils.getResponsiveSpacing(context)),
          decoration: BoxDecoration(
            color: AppConstants.surfaceColor,
            borderRadius: BorderRadius.circular(isMobile ? 8 : 12),
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withValues(alpha: 0.1),
                blurRadius: isMobile ? 4 : 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            children: [
              _buildActivityItem(
                context,
                'New teacher added',
                'Sarah Johnson joined School A',
                '2 minutes ago',
                Icons.person_add,
                AppConstants.successColor,
                isMobile,
                isTablet,
              ),
              _buildActivityItem(
                context,
                'School updated',
                'School B contact information updated',
                '15 minutes ago',
                Icons.edit,
                AppConstants.infoColor,
                isMobile,
                isTablet,
              ),
              _buildActivityItem(
                context,
                'Announcement posted',
                'New platform features available',
                '1 hour ago',
                Icons.announcement,
                AppConstants.warningColor,
                isMobile,
                isTablet,
              ),
              _buildActivityItem(
                context,
                'User deactivated',
                'John Doe account suspended',
                '2 hours ago',
                Icons.block,
                AppConstants.errorColor,
                isMobile,
                isTablet,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActivityItem(BuildContext context, String title, String description, String time, IconData icon, Color color, bool isMobile, bool isTablet) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: isMobile ? 6 : 8),
      child: Row(
        children: [
          Container(
            padding: EdgeInsets.all(isMobile ? 6 : 8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(isMobile ? 6 : 8),
            ),
            child: Icon(
              icon,
              size: ResponsiveUtils.getResponsiveIconSize(
                context,
                mobile: 14,
                tablet: 16,
                desktop: 16,
              ),
              color: color,
            ),
          ),
          SizedBox(width: ResponsiveUtils.getResponsiveSpacing(context)),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: ResponsiveUtils.getResponsiveBodyStyle(
                    context,
                    fontSize: ResponsiveUtils.getResponsiveFontSize(
                      context,
                      mobile: 12,
                      tablet: 14,
                      desktop: 14,
                    ),
                    fontWeight: FontWeight.w600,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  description,
                  style: ResponsiveUtils.getResponsiveBodyStyle(
                    context,
                    fontSize: ResponsiveUtils.getResponsiveFontSize(
                      context,
                      mobile: 10,
                      tablet: 12,
                      desktop: 12,
                    ),
                    color: AppConstants.textSecondary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Text(
            time,
            style: ResponsiveUtils.getResponsiveBodyStyle(
              context,
              fontSize: ResponsiveUtils.getResponsiveFontSize(
                context,
                mobile: 9,
                tablet: 11,
                desktop: 11,
              ),
              color: AppConstants.textLight,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResponsiveQuickActions(BuildContext context, bool isMobile, bool isTablet) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: ResponsiveUtils.getResponsiveHeadingStyle(
            context,
            fontSize: ResponsiveUtils.getResponsiveFontSize(
              context,
              mobile: 18,
              tablet: 19,
              desktop: 20,
            ),
            fontWeight: FontWeight.bold,
            color: AppConstants.textPrimary,
          ),
        ),
        SizedBox(height: ResponsiveUtils.getResponsiveSpacing(context)),
        isMobile
            ? Column(
                children: [
                  _buildActionCard(
                    context,
                    'Manage Users',
                    Icons.people,
                    'Add, edit, or deactivate user accounts',
                    AppConstants.primaryColor,
                    () => onNavigateToSection(1), // User Management
                    isMobile,
                    isTablet,
                  ),
                  SizedBox(height: ResponsiveUtils.getResponsiveSpacing(context)),
                  _buildActionCard(
                    context,
                    'Manage Schools',
                    Icons.school,
                    'Configure schools and their settings',
                    AppConstants.secondaryColor,
                    () => onNavigateToSection(2), // School Management
                    isMobile,
                    isTablet,
                  ),
                  SizedBox(height: ResponsiveUtils.getResponsiveSpacing(context)),
                  _buildActionCard(
                    context,
                    'Post Announcement',
                    Icons.announcement,
                    'Send message to all users',
                    AppConstants.warningColor,
                    () => onNavigateToSection(4), // Announcements
                    isMobile,
                    isTablet,
                  ),
                  SizedBox(height: ResponsiveUtils.getResponsiveSpacing(context)),
                  _buildActionCard(
                    context,
                    'View Statistics',
                    Icons.analytics,
                    'Platform analytics and reports',
                    AppConstants.infoColor,
                    () => onNavigateToSection(3), // Statistics
                    isMobile,
                    isTablet,
                  ),
                ],
              )
            : Row(
                children: [
                  Expanded(
                    child: _buildActionCard(
                      context,
                      'Manage Users',
                      Icons.people,
                      'Add, edit, or deactivate user accounts',
                      AppConstants.primaryColor,
                      () => onNavigateToSection(1), // User Management
                      isMobile,
                      isTablet,
                    ),
                  ),
                  SizedBox(width: ResponsiveUtils.getResponsiveSpacing(context)),
                  Expanded(
                    child: _buildActionCard(
                      context,
                      'Manage Schools',
                      Icons.school,
                      'Configure schools and their settings',
                      AppConstants.secondaryColor,
                      () => onNavigateToSection(2), // School Management
                      isMobile,
                      isTablet,
                    ),
                  ),
                  SizedBox(width: ResponsiveUtils.getResponsiveSpacing(context)),
                  Expanded(
                    child: _buildActionCard(
                      context,
                      'Post Announcement',
                      Icons.announcement,
                      'Send message to all users',
                      AppConstants.warningColor,
                      () => onNavigateToSection(4), // Announcements
                      isMobile,
                      isTablet,
                    ),
                  ),
                  SizedBox(width: ResponsiveUtils.getResponsiveSpacing(context)),
                  Expanded(
                    child: _buildActionCard(
                      context,
                      'View Statistics',
                      Icons.analytics,
                      'Platform analytics and reports',
                      AppConstants.infoColor,
                      () => onNavigateToSection(3), // Statistics
                      isMobile,
                      isTablet,
                    ),
                  ),
                ],
              ),
      ],
    );
  }

  Widget _buildActionCard(
    BuildContext context,
    String title,
    IconData icon,
    String description,
    Color color,
    VoidCallback onTap,
    bool isMobile,
    bool isTablet,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: AppConstants.surfaceColor,
        borderRadius: BorderRadius.circular(isMobile ? 8 : 12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.1),
            blurRadius: isMobile ? 4 : 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(isMobile ? 8 : 12),
          child: Padding(
            padding: EdgeInsets.all(isMobile ? 16 : ResponsiveUtils.getResponsiveSpacing(context)),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
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
                SizedBox(height: isMobile ? 8 : ResponsiveUtils.getResponsiveSpacing(context)),
                Flexible(
                  child: Text(
                    title,
                    style: ResponsiveUtils.getResponsiveBodyStyle(
                      context,
                      fontSize: ResponsiveUtils.getResponsiveFontSize(
                        context,
                        mobile: 13,
                        tablet: 14,
                        desktop: 15,
                      ),
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                SizedBox(height: isMobile ? 4 : 6),
                Flexible(
                  child: Text(
                    description,
                    style: ResponsiveUtils.getResponsiveBodyStyle(
                      context,
                      fontSize: ResponsiveUtils.getResponsiveFontSize(
                        context,
                        mobile: 9,
                        tablet: 10,
                        desktop: 11,
                      ),
                      color: AppConstants.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                    overflow: TextOverflow.ellipsis,
                    maxLines: 2,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
} 