import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'firebase_options.dart';
import 'theme/modern_theme.dart';
import 'screens/splash/splash_screen.dart';
import 'screens/announcements/announcements_screen.dart';
import 'screens/homework/homework_screen.dart';
import 'screens/transport/parent_bus_tracking_screen.dart';
import 'screens/attendance/attendance_screen.dart';
import 'services/notification_service.dart';
import 'services/fcm_notification_service.dart';

// Background message handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  print('📨 Background message handler: ${message.messageId}');
  await FCMNotificationService.handleBackgroundNotification(message);
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase with options
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    print('Firebase initialized successfully');
  } catch (e) {
    print('Firebase initialization failed: $e');
    // Continue without Firebase for now
  }

  // Set up background message handler
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

  // Initialize notification service
  try {
    await NotificationService.initialize();
    print('Notification service initialized successfully');
  } catch (e) {
    print('Notification service initialization failed: $e');
    // Continue without notifications for now
  }

  // Initialize FCM notification service
  try {
    await FCMNotificationService.initialize();
    print('FCM notification service initialized successfully');
  } catch (e) {
    print('FCM notification service initialization failed: $e');
    // Continue without FCM for now
  }

  runApp(const SmartCampusApp());
}

class SmartCampusApp extends StatelessWidget {
  const SmartCampusApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Smart Campus',
      debugShowCheckedModeBanner: false,
      theme: ModernTheme.lightTheme,
      darkTheme: ModernTheme.darkTheme,
      themeMode: ThemeMode.light,
      home: const SplashScreen(),
      routes: {
        '/announcements': (context) => const AnnouncementsScreen(),
        '/homework': (context) => const HomeworkScreen(),
        '/transport': (context) => const ParentBusTrackingScreen(),
        '/attendance': (context) => const AttendanceScreen(),
      },
    );
  }
}
