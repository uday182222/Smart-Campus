class RouteConstants {
  // Splash Screen
  static const String splash = '/splash';
  
  // Authentication Routes
  static const String login = '/login';
  static const String firstLogin = '/first-login';
  static const String forgotPassword = '/forgot-password';
  static const String parentSetup = '/parent-setup';
  
  // Dashboard Routes
  static const String dashboard = '/dashboard';
  
  // Super Admin Routes
  static const String superAdminDashboard = '/super-admin/dashboard';
  static const String schoolsManagement = '/super-admin/schools';
  static const String createSchool = '/super-admin/schools/create';
  static const String platformAnalytics = '/super-admin/analytics';
  
  // Staff Routes
  static const String staffDashboard = '/staff/dashboard';
  static const String userManagement = '/staff/users';
  static const String academicSetup = '/staff/academic-setup';
  static const String contentManagement = '/staff/content';
  static const String staffReports = '/staff/reports';
  
  // Teacher Routes
  static const String teacherDashboard = '/teacher/dashboard';
  static const String myClasses = '/teacher/classes';
  static const String classDetails = '/teacher/classes/{classId}';
  static const String teacherReports = '/teacher/reports';
  
  // Parent Routes
  static const String parentDashboard = '/parent/dashboard';
  static const String childOverview = '/parent/child/{childId}';
  static const String parentFeedback = '/parent/feedback';
  
  // Attendance Routes
  static const String markAttendance = '/attendance/mark';
  static const String attendanceHistory = '/attendance/history';
  static const String classAttendance = '/attendance/class/{classId}';
  static const String studentAttendance = '/attendance/student/{studentId}';
  
  // Homework Routes
  static const String createHomework = '/homework/create';
  static const String homeworkList = '/homework/list';
  static const String homeworkDetails = '/homework/{homeworkId}';
  static const String homeworkCalendar = '/homework/calendar';
  
  // Announcements Routes
  static const String announcements = '/announcements';
  static const String createAnnouncement = '/announcements/create';
  static const String announcementDetails = '/announcements/{announcementId}';
  
  // Events Routes
  static const String eventsCalendar = '/events/calendar';
  static const String createEvent = '/events/create';
  static const String eventDetails = '/events/{eventId}';
  static const String eventsList = '/events/list';
  
  // Timetable Routes
  static const String timetable = '/timetable';
  static const String uploadTimetable = '/timetable/upload';
  static const String viewTimetable = '/timetable/view';
  
  // Transport Routes
  static const String transport = '/transport';
  static const String routeManagement = '/transport/routes';
  static const String transportTracking = '/transport/tracking';
  static const String updateTransport = '/transport/update';
  
  // Fees Routes
  static const String feeStructure = '/fees/structure';
  static const String feeHistory = '/fees/history';
  static const String feeDues = '/fees/dues';
  
  // Gallery Routes
  static const String gallery = '/gallery';
  static const String uploadMedia = '/gallery/upload';
  static const String mediaViewer = '/gallery/media/{mediaId}';
  
  // Appointments Routes
  static const String bookAppointment = '/appointments/book';
  static const String appointmentRequests = '/appointments/requests';
  static const String appointmentHistory = '/appointments/history';
  
  // Profile Routes
  static const String profile = '/profile';
  static const String editProfile = '/profile/edit';
  static const String settings = '/settings';
  static const String about = '/about';
  
  // Utility Routes
  static const String notFound = '/not-found';
  static const String error = '/error';
  static const String maintenance = '/maintenance';
  
  // Helper method to replace route parameters
  static String replaceParams(String route, Map<String, String> params) {
    String result = route;
    params.forEach((key, value) {
      result = result.replaceAll('{$key}', value);
    });
    return result;
  }
  
  // Helper method to build route with query parameters
  static String buildRouteWithQuery(String route, Map<String, dynamic> queryParams) {
    if (queryParams.isEmpty) return route;
    
    final queryString = queryParams.entries
        .map((entry) => '${entry.key}=${Uri.encodeComponent(entry.value.toString())}')
        .join('&');
    
    return '$route?$queryString';
  }
  
  // Common route parameters
  static const String classIdParam = 'classId';
  static const String studentIdParam = 'studentId';
  static const String teacherIdParam = 'teacherId';
  static const String schoolIdParam = 'schoolId';
  static const String homeworkIdParam = 'homeworkId';
  static const String announcementIdParam = 'announcementId';
  static const String eventIdParam = 'eventId';
  static const String mediaIdParam = 'mediaId';
  static const String childIdParam = 'childId';
  
  // Route groups for navigation
  static const List<String> superAdminRoutes = [
    superAdminDashboard,
    schoolsManagement,
    createSchool,
    platformAnalytics,
  ];
  
  static const List<String> staffRoutes = [
    staffDashboard,
    userManagement,
    academicSetup,
    contentManagement,
    staffReports,
  ];
  
  static const List<String> teacherRoutes = [
    teacherDashboard,
    myClasses,
    teacherReports,
  ];
  
  static const List<String> parentRoutes = [
    parentDashboard,
    parentFeedback,
  ];
  
  static const List<String> commonRoutes = [
    attendanceHistory,
    announcements,
    eventsList,
    timetable,
    transport,
    feeStructure,
    gallery,
    profile,
    settings,
  ];
  
  // Route permissions mapping
  static const Map<String, List<String>> routePermissions = {
    superAdminDashboard: ['super_admin'],
    schoolsManagement: ['super_admin'],
    createSchool: ['super_admin'],
    platformAnalytics: ['super_admin'],
    
    staffDashboard: ['staff'],
    userManagement: ['staff'],
    academicSetup: ['staff'],
    contentManagement: ['staff'],
    staffReports: ['staff'],
    
    teacherDashboard: ['teacher'],
    myClasses: ['teacher'],
    teacherReports: ['teacher'],
    markAttendance: ['teacher'],
    createHomework: ['teacher'],
    createAnnouncement: ['teacher'],
    
    parentDashboard: ['parent'],
    parentFeedback: ['parent'],
    
    // Common routes accessible by all authenticated users
    attendanceHistory: ['teacher', 'parent', 'staff', 'super_admin'],
    announcements: ['teacher', 'parent', 'staff', 'super_admin'],
    eventsList: ['teacher', 'parent', 'staff', 'super_admin'],
    timetable: ['teacher', 'parent', 'staff', 'super_admin'],
    transport: ['teacher', 'parent', 'staff', 'super_admin'],
    feeStructure: ['parent', 'staff', 'super_admin'],
    gallery: ['teacher', 'parent', 'staff', 'super_admin'],
    profile: ['teacher', 'parent', 'staff', 'super_admin'],
    settings: ['teacher', 'parent', 'staff', 'super_admin'],
  };
  
  // Check if user has permission to access a route
  static bool hasPermission(String route, String userRole) {
    final allowedRoles = routePermissions[route];
    if (allowedRoles == null) return false;
    return allowedRoles.contains(userRole);
  }
  
  // Get all routes for a specific role
  static List<String> getRoutesForRole(String role) {
    final routes = <String>[];
    routePermissions.forEach((route, roles) {
      if (roles.contains(role)) {
        routes.add(route);
      }
    });
    return routes;
  }
} 