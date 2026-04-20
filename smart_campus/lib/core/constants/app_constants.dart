import 'package:flutter/material.dart';

/// Production and app configuration.
class AppConfig {
  /// Set to true for production builds, false for development/testing
  static const bool isProduction = true;

  /// App version
  static const String appVersion = '1.0.0';

  /// Firestore collections
  static const String colStudents = 'students';
  static const String colTeachers = 'teachers';
  static const String colClasses = 'classes';
  static const String colHomework = 'homework';
  static const String colAttendance = 'attendance';
  static const String colMarks = 'marks';
  static const String colFees = 'fees';
  static const String colAnnouncements = 'announcements';
  static const String colNotifications = 'notifications';
  static const String colHomeworkSubmissions = 'homework_submissions';
  static const String colTransportRoutes = 'transport_routes';
  static const String colGallery = 'gallery';
  static const String colAppointments = 'appointments';
  static const String colAfterSchool = 'after_school';
  static const String colRemarks = 'remarks';
  static const String colUsers = 'users';
  static const String colRoutes = 'routes';
}

class AppConstants {
  // App Colors
  static const Color primaryColor = Color(0xFF2196F3);
  static const Color primaryDarkColor = Color(0xFF1976D2);
  static const Color primaryLightColor = Color(0xFFBBDEFB);
  static const Color accentColor = Color(0xFF03A9F4);
  static const Color backgroundColor = Color(0xFFF5F5F5);
  static const Color surfaceColor = Color(0xFFFFFFFF);
  
  // Text Colors
  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF757575);
  static const Color textLight = Color(0xFFBDBDBD);
  static const Color textWhite = Color(0xFFFFFFFF);
  
  // Status Colors
  static const Color successColor = Color(0xFF4CAF50);
  static const Color warningColor = Color(0xFFFF9800);
  static const Color errorColor = Color(0xFFF44336);
  static const Color infoColor = Color(0xFF2196F3);
  static const Color secondaryColor = Color(0xFF607D8B);
  static const Color attendancePresent = Color(0xFF4CAF50);
  static const Color attendanceAbsent = Color(0xFFF44336);
  static const Color attendanceLate = Color(0xFFFF9800);
  
  // Role Colors
  static const Color superAdminColor = Color(0xFF9C27B0);
  static const Color schoolAdminColor = Color(0xFF673AB7);
  static const Color staffColor = Color(0xFF607D8B);
  static const Color teacherColor = Color(0xFF2196F3);
  static const Color parentColor = Color(0xFF4CAF50);
  static const Color studentColor = Color(0xFFFF9800);
  
  // App Text Styles
  static const TextStyle headingStyle = TextStyle(
    fontSize: 24.0,
    fontWeight: FontWeight.bold,
    color: textPrimary,
  );
  
  static const TextStyle subheadingStyle = TextStyle(
    fontSize: 18.0,
    fontWeight: FontWeight.w600,
    color: textPrimary,
  );
  
  static const TextStyle bodyStyle = TextStyle(
    fontSize: 16.0,
    color: textPrimary,
  );
  
  static const TextStyle captionStyle = TextStyle(
    fontSize: 14.0,
    color: textSecondary,
  );
  
  static const TextStyle smallStyle = TextStyle(
    fontSize: 12.0,
    color: textSecondary,
  );
  
  // App Dimensions
  static const double paddingSmall = 8.0;
  static const double paddingMedium = 16.0;
  static const double paddingLarge = 24.0;
  static const double paddingXLarge = 32.0;
  
  static const double borderRadiusSmall = 8.0;
  static const double borderRadiusMedium = 12.0;
  static const double borderRadiusLarge = 16.0;
  static const double borderRadiusXLarge = 24.0;
  
  static const double elevationSmall = 2.0;
  static const double elevationMedium = 4.0;
  static const double elevationLarge = 8.0;
  
  // App Strings
  static const String appName = 'Smart Campus';
  static const String appDescription = 'Comprehensive School Management System';
  static const String appVersion = '1.0.0';
  
  // User Roles
  static const String roleSuperAdmin = 'super_admin';
  static const String roleSchoolAdmin = 'school_admin';
  static const String roleStaff = 'staff';
  static const String roleTeacher = 'teacher';
  static const String roleParent = 'parent';
  static const String roleStudent = 'student';
  
  // Navigation Labels
  static const String homeLabel = 'Home';
  static const String attendanceLabel = 'Attendance';
  static const String homeworkLabel = 'Homework';
  static const String announcementsLabel = 'Announcements';
  static const String eventsLabel = 'Events';
  static const String timetableLabel = 'Timetable';
  static const String transportLabel = 'Transport';
  static const String feesLabel = 'Fees';
  static const String galleryLabel = 'Gallery';
  static const String appointmentsLabel = 'Appointments';
  static const String profileLabel = 'Profile';
  
  // Feature Labels
  static const String libraryLabel = 'Library';
  static const String cafeteriaLabel = 'Cafeteria';
  static const String parkingLabel = 'Parking';
  static const String sportsLabel = 'Sports';
  static const String academicsLabel = 'Academics';
  static const String reportsLabel = 'Reports';
  static const String settingsLabel = 'Settings';
  
  // Placeholder Text
  static const String placeholderText = 'Coming soon...';
  static const String noDataText = 'No data available';
  static const String loadingText = 'Loading...';
  static const String errorText = 'Something went wrong';
  static const String retryText = 'Retry';
  static const String cancelText = 'Cancel';
  static const String saveText = 'Save';
  static const String deleteText = 'Delete';
  static const String editText = 'Edit';
  static const String viewText = 'View';
  static const String addText = 'Add';
  static const String submitText = 'Submit';
  static const String loginText = 'Login';
  static const String logoutText = 'Logout';
  static const String registerText = 'Register';
  static const String forgotPasswordText = 'Forgot Password?';
  
  // Form Labels
  static const String emailLabel = 'Email';
  static const String passwordLabel = 'Password';
  static const String confirmPasswordLabel = 'Confirm Password';
  static const String nameLabel = 'Name';
  static const String phoneLabel = 'Phone';
  static const String addressLabel = 'Address';
  static const String schoolLabel = 'School';
  static const String classLabel = 'Class';
  static const String sectionLabel = 'Section';
  static const String rollNumberLabel = 'Roll Number';
  static const String subjectLabel = 'Subject';
  static const String titleLabel = 'Title';
  static const String descriptionLabel = 'Description';
  static const String dateLabel = 'Date';
  static const String timeLabel = 'Time';
  static const String locationLabel = 'Location';
  
  // Validation Messages
  static const String emailRequired = 'Email is required';
  static const String emailInvalid = 'Please enter a valid email';
  static const String passwordRequired = 'Password is required';
  static const String passwordMinLength = 'Password must be at least 6 characters';
  static const String passwordMismatch = 'Passwords do not match';
  static const String nameRequired = 'Name is required';
  static const String phoneRequired = 'Phone number is required';
  static const String phoneInvalid = 'Please enter a valid phone number';
  
  // Success Messages
  static const String loginSuccess = 'Login successful';
  static const String logoutSuccess = 'Logout successful';
  static const String saveSuccess = 'Saved successfully';
  static const String deleteSuccess = 'Deleted successfully';
  static const String updateSuccess = 'Updated successfully';
  static const String createSuccess = 'Created successfully';
  
  // Error Messages
  static const String networkError = 'Network error. Please check your connection';
  static const String serverError = 'Server error. Please try again later';
  static const String unauthorizedError = 'Unauthorized access';
  static const String forbiddenError = 'Access forbidden';
  static const String notFoundError = 'Resource not found';
  static const String timeoutError = 'Request timeout';
  static const String unknownError = 'An unknown error occurred';
  
  // Animation Durations
  static const Duration shortAnimation = Duration(milliseconds: 200);
  static const Duration mediumAnimation = Duration(milliseconds: 300);
  static const Duration longAnimation = Duration(milliseconds: 500);
  
  // API Timeouts
  static const Duration connectionTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  
  // Cache Durations
  static const Duration cacheDuration = Duration(hours: 1);
  static const Duration tokenRefreshDuration = Duration(minutes: 5);
  
  // File Upload Limits
  static const int maxImageSize = 5 * 1024 * 1024; // 5MB
  static const int maxFileSize = 10 * 1024 * 1024; // 10MB
  static const List<String> allowedImageTypes = ['jpg', 'jpeg', 'png', 'gif'];
  static const List<String> allowedFileTypes = ['pdf', 'doc', 'docx', 'txt'];
  
  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;
  
  // Date Formats
  static const String dateFormat = 'yyyy-MM-dd';
  static const String timeFormat = 'HH:mm';
  static const String dateTimeFormat = 'yyyy-MM-dd HH:mm';
  static const String displayDateFormat = 'MMM dd, yyyy';
  static const String displayTimeFormat = 'hh:mm a';
  static const String displayDateTimeFormat = 'MMM dd, yyyy hh:mm a';
} 