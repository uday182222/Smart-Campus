import 'package:flutter/material.dart';

import '../../services/auth_service.dart';
import '../student/student_marks_screen.dart';
import 'parent_communication_screen.dart';
import 'parent_fees_screen.dart';
import '../transport/parent_bus_tracking_screen.dart';
import '../gallery/gallery_screen.dart';
import '../appointments/appointments_screen.dart';
import '../afterschool/afterschool_screen.dart';

class ModernParentDashboard extends StatefulWidget {
  const ModernParentDashboard({super.key});

  @override
  State<ModernParentDashboard> createState() => _ModernParentDashboardState();
}

class _ModernParentDashboardState extends State<ModernParentDashboard>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  late List<Animation<double>> _fadeAnimations;
  late List<Animation<Offset>> _slideAnimations;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );

    _fadeAnimations = List.generate(10, (index) {
      return Tween<double>(
        begin: 0.0,
        end: 1.0,
      ).animate(CurvedAnimation(
        parent: _animationController,
        curve: Interval(
          index * 0.1,
          (index * 0.1) + 0.6,
          curve: Curves.easeOutCubic,
        ),
      ));
    });

    _slideAnimations = List.generate(10, (index) {
      return Tween<Offset>(
        begin: const Offset(0, 0.3),
        end: Offset.zero,
      ).animate(CurvedAnimation(
        parent: _animationController,
        curve: Interval(
          index * 0.1,
          (index * 0.1) + 0.6,
          curve: Curves.easeOutCubic,
        ),
      ));
    });

    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Reference Design Gradient Background
        Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Color(0xFFD4E7FE),
                Color(0xFFF0F0F0),
              ],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              stops: [0.6, 0.3],
            ),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 50),
          child: Column(
            children: [
              FadeTransition(
                opacity: _fadeAnimations[0],
                child: Container(
                  alignment: Alignment.centerRight,
                  child: RichText(
                    text: TextSpan(
                      text: "Wed",
                      style: const TextStyle(
                        color: Color(0XFF263064),
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                      ),
                      children: const [
                        TextSpan(
                          text: " 10 Oct",
                          style: TextStyle(
                            color: Color(0XFF263064),
                            fontSize: 12,
                            fontWeight: FontWeight.normal,
                          ),
                        )
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 15),
              FadeTransition(
                opacity: _fadeAnimations[1],
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(15),
                        border: Border.all(width: 1, color: Colors.white),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.blueGrey.withOpacity(0.2),
                            blurRadius: 12,
                            spreadRadius: 8,
                          )
                        ],
                        image: const DecorationImage(
                          fit: BoxFit.cover,
                          image: NetworkImage(
                            "https://images.unsplash.com/photo-1541647376583-8934aaf3448a?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1234&q=80",
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 20),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          "Hi Parent",
                          style: TextStyle(
                            fontSize: 25,
                            fontWeight: FontWeight.w900,
                            color: Color(0XFF343E87),
                          ),
                        ),
                        SizedBox(height: 10),
                        Text(
                          "Here is a list of schedule",
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.blueGrey,
                          ),
                        ),
                        SizedBox(height: 8),
                        Text(
                          "You need to check...",
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.blueGrey,
                          ),
                        ),
                      ],
                    )
                  ],
                ),
              )
            ],
          ),
        ),
        // Reference Design Content Area
        Positioned(
          top: 185,
          child: FadeTransition(
            opacity: _fadeAnimations[2],
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 15),
              height: MediaQuery.of(context).size.height - 245,
              width: MediaQuery.of(context).size.width,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(30),
                  topRight: Radius.circular(30),
                ),
              ),
              child: ListView(
                children: [
                  // Today's Overview Section (Reference Design Style)
                  buildTitleRow("TODAY'S OVERVIEW", 4),
                  const SizedBox(height: 20),
                  buildStatsGrid(),
                  const SizedBox(height: 25),
                  // Quick Actions Section (Reference Design Style)
                  buildTitleRow("QUICK ACTIONS", 6),
                  const SizedBox(height: 20),
                  buildQuickActionsGrid(),
                  const SizedBox(height: 25),
                  // Recent Activity Section
                  buildTitleRow("RECENT ACTIVITY", 3),
                  const SizedBox(height: 20),
                  buildActivityList(),
                ],
              ),
            ),
          ),
        )
      ],
    );
  }

  Row buildTitleRow(String title, int number) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        RichText(
          text: TextSpan(
            text: title,
            style: const TextStyle(
              fontSize: 12,
              color: Colors.black,
              fontWeight: FontWeight.bold,
            ),
            children: [
              TextSpan(
                text: "($number)",
                style: const TextStyle(
                  fontSize: 12,
                  color: Colors.grey,
                  fontWeight: FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
        const Text(
          "See all",
          style: TextStyle(
            fontSize: 12,
            color: Color(0XFF3E3993),
            fontWeight: FontWeight.bold,
          ),
        )
      ],
    );
  }

  Widget buildStatsGrid() {
    return FadeTransition(
      opacity: _fadeAnimations[3],
      child: SlideTransition(
        position: _slideAnimations[3],
        child: GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          crossAxisSpacing: 15,
          mainAxisSpacing: 15,
          childAspectRatio: 2.5,
          children: [
            _buildStatCard(
              "Messages",
              "3",
              "New notifications",
              Icons.message,
              const Color(0xFF3B82F6),
            ),
            _buildStatCard(
              "Assignments",
              "2",
              "Due this week",
              Icons.assignment,
              const Color(0xFFF59E0B),
            ),
            _buildStatCard(
              "Attendance",
              "95%",
              "This month",
              Icons.check_circle,
              const Color(0xFF10B981),
            ),
            _buildStatCard(
              "Events",
              "1",
              "Upcoming",
              Icons.event,
              const Color(0xFFF59E0B),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, String value, String subtitle, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 10,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1F2937),
                  ),
                ),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF6B7280),
                  ),
                ),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 10,
                    color: Color(0xFF9CA3AF),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget buildQuickActionsGrid() {
    return FadeTransition(
      opacity: _fadeAnimations[4],
      child: SlideTransition(
        position: _slideAnimations[4],
        child: GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          crossAxisSpacing: 15,
          mainAxisSpacing: 15,
          childAspectRatio: 1.2,
          children: [
            _buildQuickActionCard(
              "Messages",
              "Communication",
              Icons.message,
              const Color(0xFF3B82F6),
              0,
              () => Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const ParentCommunicationScreen()),
              ),
            ),
            _buildQuickActionCard(
              "Transport",
              "Bus Tracking",
              Icons.directions_bus,
              const Color(0xFF10B981),
              1,
              () => Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const ParentBusTrackingScreen()),
              ),
            ),
            _buildQuickActionCard(
              "Fees",
              "Payment",
              Icons.payment,
              const Color(0xFFF59E0B),
              2,
              () => Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const ParentFeesScreen()),
              ),
            ),
            _buildQuickActionCard(
              "Gallery",
              "Photos",
              Icons.photo_library,
              const Color(0xFF8B5CF6),
              3,
              () => Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const GalleryScreen()),
              ),
            ),
            _buildQuickActionCard(
              "Appointments",
              "Schedule",
              Icons.calendar_today,
              const Color(0xFFEF4444),
              4,
              () => Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const AppointmentsScreen()),
              ),
            ),
            _buildQuickActionCard(
              "Activities",
              "After School",
              Icons.sports_soccer,
              const Color(0xFF06B6D4),
              5,
              () => Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const AfterSchoolScreen()),
              ),
            ),
            _buildQuickActionCard(
              "View Marks",
              "Marks & grades",
              Icons.grade,
              const Color(0xFF8B5CF6),
              6,
              () {
                final studentId = AuthService.getCurrentUserModel()?.id;
                if (studentId == null) return;
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => StudentMarksScreen(studentId: studentId),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActionCard(
    String title,
    String subtitle,
    IconData icon,
    Color color,
    int index,
    VoidCallback onTap,
  ) {
    return FadeTransition(
      opacity: _fadeAnimations[2 + index],
      child: SlideTransition(
        position: _slideAnimations[2 + index],
        child: GestureDetector(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.1),
                  blurRadius: 10,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: color, size: 24),
                ),
                const SizedBox(height: 8),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1F2937),
                  ),
                  textAlign: TextAlign.center,
                ),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 10,
                    color: Color(0xFF6B7280),
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget buildActivityList() {
    return FadeTransition(
      opacity: _fadeAnimations[8],
      child: SlideTransition(
        position: _slideAnimations[8],
        child: Column(
          children: [
            _buildActivityItem("Communication Update", "New message from teacher", "2 hours ago", const Color(0xFF3E3993)),
            _buildActivityItem("Assignment Submitted", "Math homework completed", "4 hours ago", const Color(0xFF10B981)),
            _buildActivityItem("Attendance Marked", "Present for today's classes", "6 hours ago", const Color(0xFFF59E0B)),
          ],
        ),
      ),
    );
  }

  Widget _buildActivityItem(String title, String subtitle, String time, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 8,
            spreadRadius: 1,
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 40,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1F2937),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF6B7280),
                  ),
                ),
              ],
            ),
          ),
          Text(
            time,
            style: const TextStyle(
              fontSize: 10,
              color: Color(0xFF9CA3AF),
            ),
          ),
        ],
      ),
    );
  }
}