import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:timezone/timezone.dart' as tz;
import '../core/constants/app_constants.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  static final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();

  static bool _isInitialized = false;

  // Initialize notification service
  static Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      // Request notification permissions
      final status = await Permission.notification.request();
      debugPrint('Notification permission status: $status');

      // Initialize Android settings
      const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
      
      // Initialize iOS settings
      const iosSettings = DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      );

      // Initialize settings
      const initializationSettings = InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      );

      // Initialize the plugin
      await _notifications.initialize(
        initializationSettings,
        onDidReceiveNotificationResponse: _onNotificationTapped,
      );

      _isInitialized = true;
      debugPrint('Notification service initialized successfully');
    } catch (e) {
      debugPrint('Error initializing notification service: $e');
    }
  }

  // Handle notification tap
  static void _onNotificationTapped(NotificationResponse response) {
    debugPrint('Notification tapped: ${response.payload}');
    // Handle notification tap - navigate to specific screen based on payload
  }

  // Show a simple notification
  static Future<void> showNotification({
    required int id,
    required String title,
    required String body,
    String? payload,
  }) async {
    if (!_isInitialized) {
      await initialize();
    }

    try {
      const androidDetails = AndroidNotificationDetails(
        'smart_campus_channel',
        'Smart Campus Notifications',
        channelDescription: 'Notifications from Smart Campus app',
        importance: Importance.high,
        priority: Priority.high,
        color: AppConstants.primaryColor,
        icon: '@mipmap/ic_launcher',
      );

      const iosDetails = DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
      );

      const notificationDetails = NotificationDetails(
        android: androidDetails,
        iOS: iosDetails,
      );

      await _notifications.show(id, title, body, notificationDetails, payload: payload);
      debugPrint('Notification shown: $title');
    } catch (e) {
      debugPrint('Error showing notification: $e');
    }
  }

  // Show scheduled notification
  static Future<void> scheduleNotification({
    required int id,
    required String title,
    required String body,
    required DateTime scheduledDate,
    String? payload,
  }) async {
    if (!_isInitialized) {
      await initialize();
    }

    try {
      const androidDetails = AndroidNotificationDetails(
        'smart_campus_scheduled_channel',
        'Scheduled Notifications',
        channelDescription: 'Scheduled notifications from Smart Campus app',
        importance: Importance.high,
        priority: Priority.high,
        color: AppConstants.primaryColor,
        icon: '@mipmap/ic_launcher',
      );

      const iosDetails = DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
      );

      const notificationDetails = NotificationDetails(
        android: androidDetails,
        iOS: iosDetails,
      );

      // Convert DateTime to TZDateTime
      final tzDateTime = tz.TZDateTime.from(scheduledDate, tz.local);

      await _notifications.zonedSchedule(
        id,
        title,
        body,
        tzDateTime,
        notificationDetails,
        payload: payload,
        androidAllowWhileIdle: true,
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
      );
      debugPrint('Scheduled notification: $title for ${scheduledDate.toString()}');
    } catch (e) {
      debugPrint('Error scheduling notification: $e');
    }
  }

  // Cancel a specific notification
  static Future<void> cancelNotification(int id) async {
    try {
      await _notifications.cancel(id);
      debugPrint('Cancelled notification with id: $id');
    } catch (e) {
      debugPrint('Error cancelling notification: $e');
    }
  }

  // Cancel all notifications
  static Future<void> cancelAllNotifications() async {
    try {
      await _notifications.cancelAll();
      debugPrint('Cancelled all notifications');
    } catch (e) {
      debugPrint('Error cancelling all notifications: $e');
    }
  }

  // Show homework reminder
  static Future<void> showHomeworkReminder({
    required String studentName,
    required String subject,
    required String homeworkTitle,
  }) async {
    await showNotification(
      id: DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title: 'Homework Reminder',
      body: '$studentName has homework due: $homeworkTitle ($subject)',
      payload: 'homework_reminder',
    );
  }

  // Show attendance reminder
  static Future<void> showAttendanceReminder({
    required String className,
    required DateTime date,
  }) async {
    await showNotification(
      id: DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title: 'Attendance Reminder',
      body: 'Time to mark attendance for $className on ${date.toString().split(' ')[0]}',
      payload: 'attendance_reminder',
    );
  }

  // Show event reminder
  static Future<void> showEventReminder({
    required String eventTitle,
    required DateTime eventTime,
    required String location,
  }) async {
    await showNotification(
      id: DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title: 'Event Reminder',
      body: '$eventTitle starts in 30 minutes at $location',
      payload: 'event_reminder',
    );
  }

  // Show announcement notification
  static Future<void> showAnnouncementNotification({
    required String title,
    required String content,
  }) async {
    await showNotification(
      id: DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title: 'New Announcement: $title',
      body: content.length > 100 ? '${content.substring(0, 100)}...' : content,
      payload: 'announcement',
    );
  }

  // Schedule daily attendance reminder
  static Future<void> scheduleDailyAttendanceReminder({
    required String className,
    required DateTime time,
  }) async {
    final now = DateTime.now();
    final scheduledDate = DateTime(now.year, now.month, now.day, time.hour, time.minute);
    
    await scheduleNotification(
      id: 1001, // Fixed ID for daily attendance reminder
      title: 'Daily Attendance Reminder',
      body: 'Time to mark attendance for $className',
      scheduledDate: scheduledDate,
      payload: 'daily_attendance_reminder',
    );
  }

  // Schedule weekly homework reminder
  static Future<void> scheduleWeeklyHomeworkReminder({
    required String className,
    required DateTime time,
  }) async {
    final now = DateTime.now();
    final scheduledDate = DateTime(now.year, now.month, now.day, time.hour, time.minute);
    
    await scheduleNotification(
      id: 1002, // Fixed ID for weekly homework reminder
      title: 'Weekly Homework Check',
      body: 'Review homework assignments for $className',
      scheduledDate: scheduledDate,
      payload: 'weekly_homework_reminder',
    );
  }

  // Get pending notifications
  static Future<List<PendingNotificationRequest>> getPendingNotifications() async {
    try {
      return await _notifications.pendingNotificationRequests();
    } catch (e) {
      debugPrint('Error getting pending notifications: $e');
      return [];
    }
  }

  // Check if notifications are enabled
  static Future<bool> areNotificationsEnabled() async {
    try {
      final status = await Permission.notification.status;
      return status.isGranted;
    } catch (e) {
      debugPrint('Error checking notification permission: $e');
      return false;
    }
  }

  // Request notification permissions
  static Future<bool> requestNotificationPermissions() async {
    try {
      final status = await Permission.notification.request();
      return status.isGranted;
    } catch (e) {
      debugPrint('Error requesting notification permission: $e');
      return false;
    }
  }
} 