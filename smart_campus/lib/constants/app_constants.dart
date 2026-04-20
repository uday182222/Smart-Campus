import 'package:flutter/material.dart';

class AppConstants {
  // App Colors
  static const Color primaryColor = Color(0xFF2196F3);
  static const Color primaryDarkColor = Color(0xFF1976D2);
  static const Color accentColor = Color(0xFF03A9F4);
  static const Color backgroundColor = Color(0xFFF5F5F5);
  
  // Text Colors
  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF757575);
  static const Color textLight = Color(0xFFBDBDBD);
  
  // Status Colors
  static const Color successColor = Color(0xFF4CAF50);
  static const Color warningColor = Color(0xFFFF9800);
  static const Color errorColor = Color(0xFFF44336);
  static const Color infoColor = Color(0xFF2196F3);
  
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
  
  // App Dimensions
  static const double paddingSmall = 8.0;
  static const double paddingMedium = 16.0;
  static const double paddingLarge = 24.0;
  
  static const double borderRadiusSmall = 8.0;
  static const double borderRadiusMedium = 12.0;
  static const double borderRadiusLarge = 16.0;
  
  // App Strings
  static const String appName = 'Smart Campus';
  static const String appDescription = 'Your digital campus companion';
  
  // Navigation Labels
  static const String homeLabel = 'Home';
  static const String mapLabel = 'Campus Map';
  static const String eventsLabel = 'Events';
  static const String profileLabel = 'Profile';
  
  // Feature Labels
  static const String libraryLabel = 'Library';
  static const String cafeteriaLabel = 'Cafeteria';
  static const String parkingLabel = 'Parking';
  static const String eventsLabel2 = 'Events';
  
  // Placeholder Text
  static const String placeholderText = 'Coming soon...';
  static const String noDataText = 'No data available';
  static const String loadingText = 'Loading...';
  static const String errorText = 'Something went wrong';
  
  // API Endpoints (for future use)
  static const String baseUrl = 'https://api.smartcampus.com';
  static const String eventsEndpoint = '/events';
  static const String profileEndpoint = '/profile';
  static const String mapEndpoint = '/map';
  
  // Local Storage Keys
  static const String userPrefsKey = 'user_preferences';
  static const String authTokenKey = 'auth_token';
  static const String userIdKey = 'user_id';
  
  // Animation Durations
  static const Duration shortAnimation = Duration(milliseconds: 200);
  static const Duration mediumAnimation = Duration(milliseconds: 300);
  static const Duration longAnimation = Duration(milliseconds: 500);
} 