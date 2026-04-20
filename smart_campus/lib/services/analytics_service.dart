import 'package:cloud_firestore/cloud_firestore.dart';
import 'auth_service.dart';
import 'fee_service.dart';
import 'gallery_service.dart';
import 'appointment_service.dart';

class AnalyticsService {
  // ignore: unused_field
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Get comprehensive analytics for school admin
  static Future<Map<String, dynamic>> getSchoolAnalytics(String schoolId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      // Get data from all services
      final transportStats = await _getMockTransportStatistics();
      final feeStats = await FeeService.getFeeStatistics(schoolId);
      final galleryStats = await GalleryService.getGalleryStatistics(schoolId);
      final appointmentStats = await AppointmentService.getAppointmentStatistics(schoolId);

      // Calculate overall metrics
      final totalRoutes = transportStats['totalRoutes'] ?? 0;
      final activeRoutes = transportStats['activeRoutes'] ?? 0;
      final totalFeeStructures = feeStats['totalFeeStructures'] ?? 0;
      final totalFeeDues = feeStats['totalFeeDues'] ?? 0;
      final totalGalleryItems = galleryStats['totalItems'] ?? 0;
      final totalAppointments = appointmentStats['totalAppointments'] ?? 0;

      return {
        'transport': transportStats,
        'fees': feeStats,
        'gallery': galleryStats,
        'appointments': appointmentStats,
        'summary': {
          'totalRoutes': totalRoutes,
          'activeRoutes': activeRoutes,
          'totalFeeStructures': totalFeeStructures,
          'totalFeeDues': totalFeeDues,
          'totalGalleryItems': totalGalleryItems,
          'totalAppointments': totalAppointments,
          'lastUpdated': DateTime.now().toIso8601String(),
        },
      };
    } catch (e) {
      print('Error getting school analytics: $e');
      return _getMockAnalytics();
    }
  }

  // Get parent analytics
  static Future<Map<String, dynamic>> getParentAnalytics(String parentId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      // Get parent-specific data
      final upcomingAppointments = await AppointmentService.getUpcomingAppointments(parentId);
      final todaysAppointments = await AppointmentService.getTodaysAppointments(parentId);
      
      // Get fee information for parent's children
      final feeDues = await _getMockFeeDuesByParent();
      final overdueFees = feeDues.where((due) => due.isOverdue).length;
      final totalDueAmount = feeDues.fold(0.0, (sum, due) => sum + due.amount);

      return {
        'appointments': {
          'upcoming': upcomingAppointments.length,
          'today': todaysAppointments.length,
        },
        'fees': {
          'totalDues': feeDues.length,
          'overdue': overdueFees,
          'totalAmount': totalDueAmount,
        },
        'summary': {
          'lastUpdated': DateTime.now().toIso8601String(),
        },
      };
    } catch (e) {
      print('Error getting parent analytics: $e');
      return _getMockParentAnalytics();
    }
  }

  // Get teacher analytics
  static Future<Map<String, dynamic>> getTeacherAnalytics(String teacherId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      // Get teacher-specific data
      final upcomingAppointments = await AppointmentService.getUpcomingAppointments(teacherId);
      final todaysAppointments = await AppointmentService.getTodaysAppointments(teacherId);
      final pendingAppointments = upcomingAppointments.where((a) => a.isPending).length;

      return {
        'appointments': {
          'upcoming': upcomingAppointments.length,
          'today': todaysAppointments.length,
          'pending': pendingAppointments,
        },
        'summary': {
          'lastUpdated': DateTime.now().toIso8601String(),
        },
      };
    } catch (e) {
      print('Error getting teacher analytics: $e');
      return _getMockTeacherAnalytics();
    }
  }

  // Get dashboard widgets for different roles
  static Future<List<Map<String, dynamic>>> getDashboardWidgets(String role, String userId) async {
    try {
      List<Map<String, dynamic>> widgets = [];

      switch (role) {
        case 'admin':
          widgets = await _getAdminWidgets();
          break;
        case 'parent':
          widgets = await _getParentWidgets(userId);
          break;
        case 'teacher':
          widgets = await _getTeacherWidgets(userId);
          break;
        default:
          widgets = [];
      }

      return widgets;
    } catch (e) {
      print('Error getting dashboard widgets: $e');
      return _getMockDashboardWidgets(role);
    }
  }

  static Future<List<Map<String, dynamic>>> _getAdminWidgets() async {
    return [
      {
        'type': 'stats_card',
        'title': 'Transport Routes',
        'value': '8',
        'subtitle': 'Active Routes',
        'icon': 'directions_bus',
        'color': 'orange',
        'trend': '+2 this month',
      },
      {
        'type': 'stats_card',
        'title': 'Fee Collections',
        'value': '₹2,45,000',
        'subtitle': 'This Month',
        'icon': 'payment',
        'color': 'green',
        'trend': '+15% vs last month',
      },
      {
        'type': 'stats_card',
        'title': 'Gallery Items',
        'value': '156',
        'subtitle': 'Total Uploads',
        'icon': 'photo_library',
        'color': 'blue',
        'trend': '+23 this week',
      },
      {
        'type': 'stats_card',
        'title': 'Appointments',
        'value': '42',
        'subtitle': 'Scheduled This Week',
        'icon': 'event',
        'color': 'purple',
        'trend': '+8 pending',
      },
    ];
  }

  static Future<List<Map<String, dynamic>>> _getParentWidgets(String parentId) async {
    return [
      {
        'type': 'stats_card',
        'title': 'Upcoming Appointments',
        'value': '3',
        'subtitle': 'This Week',
        'icon': 'event',
        'color': 'blue',
        'trend': '2 confirmed',
      },
      {
        'type': 'stats_card',
        'title': 'Fee Dues',
        'value': '₹12,500',
        'subtitle': 'Total Outstanding',
        'icon': 'payment',
        'color': 'orange',
        'trend': 'Due in 5 days',
      },
      {
        'type': 'stats_card',
        'title': 'Bus Tracking',
        'value': 'Route A',
        'subtitle': 'Child\'s Route',
        'icon': 'directions_bus',
        'color': 'green',
        'trend': 'On time',
      },
      {
        'type': 'stats_card',
        'title': 'Gallery Views',
        'value': '45',
        'subtitle': 'This Month',
        'icon': 'photo_library',
        'color': 'purple',
        'trend': '+12 this week',
      },
    ];
  }

  static Future<List<Map<String, dynamic>>> _getTeacherWidgets(String teacherId) async {
    return [
      {
        'type': 'stats_card',
        'title': 'Appointments Today',
        'value': '4',
        'subtitle': 'Scheduled',
        'icon': 'event',
        'color': 'blue',
        'trend': '2 pending approval',
      },
      {
        'type': 'stats_card',
        'title': 'Parent Communications',
        'value': '12',
        'subtitle': 'This Week',
        'icon': 'chat',
        'color': 'green',
        'trend': '8 approved',
      },
      {
        'type': 'stats_card',
        'title': 'Class Attendance',
        'value': '94%',
        'subtitle': 'This Week',
        'icon': 'how_to_reg',
        'color': 'orange',
        'trend': '+2% vs last week',
      },
      {
        'type': 'stats_card',
        'title': 'Homework Submitted',
        'value': '28/30',
        'subtitle': 'This Week',
        'icon': 'assignment',
        'color': 'purple',
        'trend': '93% completion rate',
      },
    ];
  }

  // Mock data for development
  static Map<String, dynamic> _getMockAnalytics() {
    return {
      'transport': {
        'totalRoutes': 8,
        'activeRoutes': 6,
        'totalStops': 45,
        'totalUpdates': 234,
      },
      'fees': {
        'totalFeeStructures': 12,
        'totalFeeDues': 156,
        'overdueFees': 23,
        'totalCollected': 245000.0,
      },
      'gallery': {
        'totalItems': 156,
        'totalAlbums': 8,
        'totalViews': 1245,
        'totalLikes': 456,
      },
      'appointments': {
        'totalAppointments': 42,
        'pendingCount': 8,
        'confirmedCount': 28,
        'completedCount': 6,
      },
      'summary': {
        'lastUpdated': DateTime.now().toIso8601String(),
      },
    };
  }

  static Map<String, dynamic> _getMockParentAnalytics() {
    return {
      'appointments': {
        'upcoming': 3,
        'today': 1,
      },
      'fees': {
        'totalDues': 2,
        'overdue': 0,
        'totalAmount': 12500.0,
      },
      'summary': {
        'lastUpdated': DateTime.now().toIso8601String(),
      },
    };
  }

  static Map<String, dynamic> _getMockTeacherAnalytics() {
    return {
      'appointments': {
        'upcoming': 8,
        'today': 4,
        'pending': 2,
      },
      'summary': {
        'lastUpdated': DateTime.now().toIso8601String(),
      },
    };
  }

  static Future<List<Map<String, dynamic>>> _getMockDashboardWidgets(String role) async {
    switch (role) {
      case 'admin':
        return await _getAdminWidgets();
      case 'parent':
        return await _getParentWidgets('parent_1');
      case 'teacher':
        return await _getTeacherWidgets('teacher_1');
      default:
        return [];
    }
  }

  static void initializeMockData() {
    print('Analytics service initialized with mock data');
  }

  // Mock transport statistics
  static Future<Map<String, dynamic>> _getMockTransportStatistics() async {
    return {
      'totalRoutes': 5,
      'activeRoutes': 4,
      'totalStops': 25,
      'averageDelay': 5.2,
    };
  }

  // Mock fee dues by parent
  static Future<List<dynamic>> _getMockFeeDuesByParent() async {
    return [
      {
        'id': 'fee_1',
        'amount': 5000.0,
        'dueDate': DateTime.now().add(Duration(days: 10)),
        'status': 'pending',
      }
    ];
  }
}
