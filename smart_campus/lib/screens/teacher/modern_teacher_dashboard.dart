import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/modern/modern_card.dart';
import '../../services/auth_service.dart';
import '../../models/user_model.dart';
import 'attendance_screen.dart';
import 'homework_screen.dart';
import 'timetable_screen.dart';
import 'marks_entry_screen.dart';
import 'marks_view_screen.dart';
import 'remarks_screen.dart';
import 'view_remarks_screen.dart';
import 'teacher_announcement_screen.dart';
import 'communication_approval_screen.dart';
import 'class_notes_screen.dart';

class ModernTeacherDashboard extends StatefulWidget {
  const ModernTeacherDashboard({super.key});

  @override
  State<ModernTeacherDashboard> createState() => _ModernTeacherDashboardState();
}

class _ModernTeacherDashboardState extends State<ModernTeacherDashboard>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  late AnimationController _staggerController;
  late List<Animation<double>> _fadeAnimations;
  late List<Animation<Offset>> _slideAnimations;

  final UserModel? _currentUser = AuthService.getCurrentUserModel();

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    
    _staggerController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _fadeAnimations = List.generate(14, (index) {
      return Tween<double>(
        begin: 0.0,
        end: 1.0,
      ).animate(CurvedAnimation(
        parent: _staggerController,
        curve: Interval(
          index * 0.08,
          (index * 0.08) + 0.3,
          curve: Curves.easeOutCubic,
        ),
      ));
    });

    _slideAnimations = List.generate(14, (index) {
      return Tween<Offset>(
        begin: const Offset(0, 0.3),
        end: Offset.zero,
      ).animate(CurvedAnimation(
        parent: _staggerController,
        curve: Interval(
          index * 0.08,
          (index * 0.08) + 0.3,
          curve: Curves.easeOutCubic,
        ),
      ));
    });
    
    _animationController.forward();
    _staggerController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    _staggerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppTheme.spacingMD),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(),
              const SizedBox(height: AppTheme.spacingXL),
              _buildStatsSection(),
              const SizedBox(height: AppTheme.spacingXL),
              _buildQuickActionsSection(),
              const SizedBox(height: AppTheme.spacingXL),
              _buildTodayScheduleSection(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return FadeTransition(
      opacity: _fadeAnimations[0],
      child: SlideTransition(
        position: _slideAnimations[0],
        child: ModernGradientCard(
          gradient: AppGradients.secondary,
          child: Row(
            children: [
              Container(
                width: 70,
                height: 70,
                decoration: BoxDecoration(
                  color: AppTheme.textLight.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(AppTheme.radiusFull),
                ),
                child: const Icon(
                  Icons.school,
                  color: AppTheme.textLight,
                  size: 36,
                ),
              ),
              const SizedBox(width: AppTheme.spacingLG),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Welcome back,',
                      style: AppTheme.bodyLarge.copyWith(
                        color: AppTheme.textLight.withValues(alpha: 0.9),
                      ),
                    ),
                    const SizedBox(height: AppTheme.spacingXS),
                    Text(
                      _currentUser?.name ?? 'Teacher',
                      style: AppTheme.heading2.copyWith(
                        color: AppTheme.textLight,
                      ),
                    ),
                    const SizedBox(height: AppTheme.spacingSM),
                    Text(
                      'Manage your classes and students efficiently',
                      style: AppTheme.bodyMedium.copyWith(
                        color: AppTheme.textLight.withValues(alpha: 0.8),
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppTheme.spacingMD,
                  vertical: AppTheme.spacingSM,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.textLight.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(AppTheme.radiusFull),
                ),
                child: Text(
                  _getCurrentTime(),
                  style: AppTheme.bodySmall.copyWith(
                    color: AppTheme.textLight,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatsSection() {
    return FadeTransition(
      opacity: _fadeAnimations[1],
      child: SlideTransition(
        position: _slideAnimations[1],
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Today\'s Overview',
              style: AppTheme.heading3,
            ),
            const SizedBox(height: AppTheme.spacingMD),
            Row(
              children: [
                Expanded(
                  child: ModernStatsCard(
                    title: 'Classes',
                    value: '3',
                    subtitle: 'Scheduled today',
                    icon: Icons.class_,
                    color: AppTheme.primaryColor,
                  ),
                ),
                const SizedBox(width: AppTheme.spacingMD),
                Expanded(
                  child: ModernStatsCard(
                    title: 'Students',
                    value: '45',
                    subtitle: 'Total enrolled',
                    icon: Icons.people,
                    color: AppTheme.infoColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spacingMD),
            Row(
              children: [
                Expanded(
                  child: ModernStatsCard(
                    title: 'Pending',
                    value: '2',
                    subtitle: 'Tasks to complete',
                    icon: Icons.pending_actions,
                    color: AppTheme.warningColor,
                  ),
                ),
                const SizedBox(width: AppTheme.spacingMD),
                Expanded(
                  child: ModernStatsCard(
                    title: 'Messages',
                    value: '5',
                    subtitle: 'New notifications',
                    icon: Icons.message,
                    color: AppTheme.successColor,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActionsSection() {
    return FadeTransition(
      opacity: _fadeAnimations[2],
      child: SlideTransition(
        position: _slideAnimations[2],
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Teacher Tools',
                  style: AppTheme.heading3,
                ),
                TextButton(
                  onPressed: () {},
                  child: Text(
                    'View All',
                    style: AppTheme.bodyMedium.copyWith(
                      color: AppTheme.primaryColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spacingMD),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              crossAxisSpacing: AppTheme.spacingMD,
              mainAxisSpacing: AppTheme.spacingMD,
              childAspectRatio: 1.1,
              children: [
                _buildTeacherActionCard(
                  "Communication",
                  "Review & approve requests",
                  Icons.chat_bubble_outline,
                  AppTheme.primaryColor,
                  0,
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const CommunicationApprovalScreen(),
                    ),
                  ),
                ),
                _buildTeacherActionCard(
                  "Attendance",
                  "Mark student attendance",
                  Icons.how_to_reg,
                  AppTheme.successColor,
                  1,
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const TeacherAttendanceScreen(),
                    ),
                  ),
                ),
                _buildTeacherActionCard(
                  "Homework",
                  "Assign & review homework",
                  Icons.assignment,
                  AppTheme.infoColor,
                  2,
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const TeacherHomeworkScreen(),
                    ),
                  ),
                ),
                _buildTeacherActionCard(
                  "Timetable",
                  "View class schedule",
                  Icons.schedule,
                  AppTheme.accentColor,
                  3,
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const TimetableScreen(),
                    ),
                  ),
                ),
                _buildTeacherActionCard(
                  "Marks",
                  "View & filter marks",
                  Icons.grade,
                  AppTheme.warningColor,
                  4,
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const MarksViewScreen(),
                    ),
                  ),
                ),
                _buildTeacherActionCard(
                  "Enter Marks",
                  "Record student scores",
                  Icons.edit_note,
                  AppTheme.secondaryColor,
                  9,
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const MarksEntryScreen(),
                    ),
                  ),
                ),
                _buildTeacherActionCard(
                  "Remarks",
                  "Add student feedback",
                  Icons.comment,
                  AppTheme.errorColor,
                  5,
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const RemarksScreen(),
                    ),
                  ),
                ),
                _buildTeacherActionCard(
                  "View Remarks",
                  "Other teachers' feedback",
                  Icons.visibility,
                  AppTheme.secondaryColor,
                  6,
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const ViewRemarksScreen(),
                    ),
                  ),
                ),
                _buildTeacherActionCard(
                  "Announcements",
                  "Send to parents",
                  Icons.announcement,
                  AppTheme.primaryColor,
                  7,
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const TeacherAnnouncementScreen(),
                    ),
                  ),
                ),
                _buildTeacherActionCard(
                  "Class Notes",
                  "View and manage class notes",
                  Icons.note,
                  AppTheme.accentColor,
                  8,
                  () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const ClassNotesScreen(),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTeacherActionCard(
    String title,
    String subtitle,
    IconData icon,
    Color color,
    int index,
    VoidCallback onTap,
  ) {
    return FadeTransition(
      opacity: _fadeAnimations[4 + index],
      child: SlideTransition(
        position: _slideAnimations[4 + index],
        child: ModernFeatureCard(
          title: title,
          subtitle: subtitle,
          icon: icon,
          color: color,
          onTap: onTap,
        ),
      ),
    );
  }

  Widget _buildTodayScheduleSection() {
    return FadeTransition(
      opacity: _fadeAnimations[9],
      child: SlideTransition(
        position: _slideAnimations[9],
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Today\'s Schedule',
                  style: AppTheme.heading3,
                ),
                TextButton(
                  onPressed: () {},
                  child: Text(
                    'View Full Schedule',
                    style: AppTheme.bodyMedium.copyWith(
                      color: AppTheme.primaryColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spacingMD),
            _buildScheduleItem(
              "Mathematics",
              "Grade 5A",
              "09:00 - 10:00",
              "Room 201",
              AppTheme.primaryColor,
            ),
            const SizedBox(height: AppTheme.spacingSM),
            _buildScheduleItem(
              "Science",
              "Grade 5B",
              "10:30 - 11:30",
              "Lab 1",
              AppTheme.successColor,
            ),
            const SizedBox(height: AppTheme.spacingSM),
            _buildScheduleItem(
              "English",
              "Grade 6A",
              "14:00 - 15:00",
              "Room 205",
              AppTheme.infoColor,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScheduleItem(
    String subject,
    String classInfo,
    String time,
    String location,
    Color color,
  ) {
    return ModernCard(
      padding: const EdgeInsets.all(AppTheme.spacingMD),
      margin: EdgeInsets.zero,
      backgroundColor: AppTheme.surfaceLight,
      borderRadius: BorderRadius.circular(AppTheme.radiusMD),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 60,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(AppTheme.radiusXS),
            ),
          ),
          const SizedBox(width: AppTheme.spacingMD),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  subject,
                  style: AppTheme.bodyLarge.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: AppTheme.spacingXS),
                Text(
                  classInfo,
                  style: AppTheme.bodyMedium.copyWith(
                    color: AppTheme.textSecondary,
                  ),
                ),
                const SizedBox(height: AppTheme.spacingXS),
                Row(
                  children: [
                    Icon(
                      Icons.access_time,
                      size: 16,
                      color: AppTheme.textTertiary,
                    ),
                    const SizedBox(width: AppTheme.spacingXS),
                    Text(
                      time,
                      style: AppTheme.bodySmall.copyWith(
                        color: AppTheme.textTertiary,
                      ),
                    ),
                    const SizedBox(width: AppTheme.spacingMD),
                    Icon(
                      Icons.location_on,
                      size: 16,
                      color: AppTheme.textTertiary,
                    ),
                    const SizedBox(width: AppTheme.spacingXS),
                    Text(
                      location,
                      style: AppTheme.bodySmall.copyWith(
                        color: AppTheme.textTertiary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spacingSM,
              vertical: AppTheme.spacingXS,
            ),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(AppTheme.radiusSM),
            ),
            child: Text(
              'Next',
              style: AppTheme.bodySmall.copyWith(
                color: color,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _getCurrentTime() {
    final now = DateTime.now();
    final hour = now.hour.toString().padLeft(2, '0');
    final minute = now.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }
}
