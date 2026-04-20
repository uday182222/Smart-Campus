import 'dart:async';
import 'dart:io';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

import '../core/constants/app_constants.dart';

/// Firebase Cloud Messaging notification service
class FCMNotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  static final FirebaseAuth _auth = FirebaseAuth.instance;

  // Stream controllers for notification handling
  static final StreamController<RemoteMessage> _foregroundNotificationController = 
      StreamController<RemoteMessage>.broadcast();
  static final StreamController<RemoteMessage> _backgroundNotificationController = 
      StreamController<RemoteMessage>.broadcast();

  // Getters for notification streams
  static Stream<RemoteMessage> get foregroundNotifications => _foregroundNotificationController.stream;
  static Stream<RemoteMessage> get backgroundNotifications => _backgroundNotificationController.stream;

  // Current device token
  static String? _deviceToken;
  static String? get deviceToken => _deviceToken;

  // Notification permission status
  static NotificationSettings? _notificationSettings;
  static NotificationSettings? get notificationSettings => _notificationSettings;

  /// Initialize FCM service
  static Future<void> initialize() async {
    try {
      debugPrint('🔔 Initializing FCM Notification Service...');

      // Request notification permissions
      await _requestNotificationPermissions();

      // Get device token
      await _getDeviceToken();

      // Set up message handlers
      _setupMessageHandlers();

      // Set up token refresh listener
      _setupTokenRefreshListener();

      debugPrint('✅ FCM Notification Service initialized successfully');
    } catch (e) {
      debugPrint('❌ Error initializing FCM: $e');
      rethrow;
    }
  }

  /// Request notification permissions
  static Future<bool> _requestNotificationPermissions() async {
    try {
      // Request permission for Android
      if (Platform.isAndroid) {
        final status = await Permission.notification.request();
        if (status != PermissionStatus.granted) {
          debugPrint('❌ Notification permission denied on Android');
          return false;
        }
      }

      // Request permission for iOS
      _notificationSettings = await _messaging.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      if (_notificationSettings?.authorizationStatus == AuthorizationStatus.authorized) {
        debugPrint('✅ Notification permissions granted');
        return true;
      } else if (_notificationSettings?.authorizationStatus == AuthorizationStatus.provisional) {
        debugPrint('⚠️ Provisional notification permissions granted');
        return true;
      } else {
        debugPrint('❌ Notification permissions denied');
        return false;
      }
    } catch (e) {
      debugPrint('❌ Error requesting notification permissions: $e');
      return false;
    }
  }

  /// Get device token
  static Future<void> _getDeviceToken() async {
    try {
      _deviceToken = await _messaging.getToken();
      debugPrint('📱 Device token: $_deviceToken');

      if (_deviceToken != null) {
        // Save token to Firestore
        await _saveTokenToFirestore(_deviceToken!);
      }
    } catch (e) {
      debugPrint('❌ Error getting device token: $e');
    }
  }

  /// Save device token to Firestore
  static Future<void> _saveTokenToFirestore(String token) async {
    try {
      final user = _auth.currentUser;
      if (user == null) {
        debugPrint('❌ No authenticated user to save token');
        return;
      }

      // Get user's school ID from custom claims
      final idTokenResult = await user.getIdTokenResult();
      final schoolId = idTokenResult.claims?['schoolId'] as String?;

      // Create token document
      final tokenData = {
        'token': token,
        'userId': user.uid,
        'schoolId': schoolId,
        'platform': Platform.isIOS ? 'ios' : 'android',
        'createdAt': FieldValue.serverTimestamp(),
        'lastUsed': FieldValue.serverTimestamp(),
        'isActive': true,
      };

      // Save to Firestore
      await _firestore
          .collection(AppConfig.colUsers)
          .doc(user.uid)
          .collection('deviceTokens')
          .doc(token)
          .set(tokenData);

      debugPrint('✅ Device token saved to Firestore');
    } catch (e) {
      debugPrint('❌ Error saving token to Firestore: $e');
    }
  }

  /// Set up message handlers
  static void _setupMessageHandlers() {
    // Foreground message handler
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('📨 Foreground message received: ${message.messageId}');
      _foregroundNotificationController.add(message);
    });

    // Background message handler
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      debugPrint('📨 Background message opened: ${message.messageId}');
      _backgroundNotificationController.add(message);
    });

    // Terminated app message handler
    _messaging.getInitialMessage().then((RemoteMessage? message) {
      if (message != null) {
        debugPrint('📨 Terminated app message: ${message.messageId}');
        _backgroundNotificationController.add(message);
      }
    });
  }

  /// Set up token refresh listener
  static void _setupTokenRefreshListener() {
    _messaging.onTokenRefresh.listen((String newToken) {
      debugPrint('🔄 Token refreshed: $newToken');
      _deviceToken = newToken;
      _saveTokenToFirestore(newToken);
    });
  }

  /// Handle foreground notification display
  static void showForegroundNotification(RemoteMessage message) {
    // This will be handled by the UI layer
    // The message is already added to the foreground stream
    debugPrint('📱 Showing foreground notification: ${message.notification?.title}');
  }

  /// Handle background notification navigation
  static Future<void> handleBackgroundNotification(RemoteMessage message) async {
    try {
      debugPrint('📱 Handling background notification: ${message.messageId}');
      
      // Extract navigation data from message
      final data = message.data;
      final type = data['type'] as String?;
      final id = data['id'] as String?;

      if (type == null || id == null) {
        debugPrint('❌ Invalid notification data');
        return;
      }

      // Navigate based on notification type
      await _navigateToScreen(type, id, data);
    } catch (e) {
      debugPrint('❌ Error handling background notification: $e');
    }
  }

  /// Navigate to appropriate screen based on notification type
  static Future<void> _navigateToScreen(String type, String id, Map<String, dynamic> data) async {
    try {
      // This would typically use a navigation service
      // For now, we'll just log the navigation intent
      switch (type) {
        case 'announcement':
          debugPrint('🧭 Navigate to AnnouncementScreen with ID: $id');
          // Navigator.pushNamed(context, '/announcements', arguments: {'id': id});
          break;
        case 'homework':
          debugPrint('🧭 Navigate to HomeworkScreen with ID: $id');
          // Navigator.pushNamed(context, '/homework', arguments: {'id': id});
          break;
        case 'route_update':
          debugPrint('🧭 Navigate to TransportScreen with ID: $id');
          // Navigator.pushNamed(context, '/transport', arguments: {'id': id});
          break;
        case 'attendance':
          debugPrint('🧭 Navigate to AttendanceScreen with ID: $id');
          // Navigator.pushNamed(context, '/attendance', arguments: {'id': id});
          break;
        default:
          debugPrint('❌ Unknown notification type: $type');
      }
    } catch (e) {
      debugPrint('❌ Error navigating to screen: $e');
    }
  }

  /// Subscribe to topic
  static Future<void> subscribeToTopic(String topic) async {
    try {
      await _messaging.subscribeToTopic(topic);
      debugPrint('✅ Subscribed to topic: $topic');
    } catch (e) {
      debugPrint('❌ Error subscribing to topic $topic: $e');
    }
  }

  /// Unsubscribe from topic
  static Future<void> unsubscribeFromTopic(String topic) async {
    try {
      await _messaging.unsubscribeFromTopic(topic);
      debugPrint('✅ Unsubscribed from topic: $topic');
    } catch (e) {
      debugPrint('❌ Error unsubscribing from topic $topic: $e');
    }
  }

  /// Subscribe to school-specific topics
  static Future<void> subscribeToSchoolTopics(String schoolId) async {
    try {
      await subscribeToTopic('school_$schoolId');
      await subscribeToTopic('announcements_$schoolId');
      await subscribeToTopic('homework_$schoolId');
      await subscribeToTopic('attendance_$schoolId');
      debugPrint('✅ Subscribed to school topics for: $schoolId');
    } catch (e) {
      debugPrint('❌ Error subscribing to school topics: $e');
    }
  }

  /// Unsubscribe from school topics
  static Future<void> unsubscribeFromSchoolTopics(String schoolId) async {
    try {
      await unsubscribeFromTopic('school_$schoolId');
      await unsubscribeFromTopic('announcements_$schoolId');
      await unsubscribeFromTopic('homework_$schoolId');
      await unsubscribeFromTopic('attendance_$schoolId');
      debugPrint('✅ Unsubscribed from school topics for: $schoolId');
    } catch (e) {
      debugPrint('❌ Error unsubscribing from school topics: $e');
    }
  }

  /// Clean up old tokens
  static Future<void> cleanupOldTokens() async {
    try {
      final user = _auth.currentUser;
      if (user == null) return;

      // Get all tokens for this user
      final tokensSnapshot = await _firestore
          .collection(AppConfig.colUsers)
          .doc(user.uid)
          .collection('deviceTokens')
          .where('isActive', isEqualTo: true)
          .get();

      // Mark old tokens as inactive (keep only the current one)
      final batch = _firestore.batch();
      for (final doc in tokensSnapshot.docs) {
        if (doc.id != _deviceToken) {
          batch.update(doc.reference, {'isActive': false});
        }
      }
      await batch.commit();

      debugPrint('✅ Cleaned up old tokens');
    } catch (e) {
      debugPrint('❌ Error cleaning up old tokens: $e');
    }
  }

  /// Get notification history for user
  static Future<List<Map<String, dynamic>>> getNotificationHistory() async {
    try {
      final user = _auth.currentUser;
      if (user == null) return [];

      final snapshot = await _firestore
          .collection(AppConfig.colUsers)
          .doc(user.uid)
          .collection(AppConfig.colNotifications)
          .orderBy('createdAt', descending: true)
          .limit(50)
          .get();

      return snapshot.docs.map((doc) => {
        'id': doc.id,
        ...doc.data(),
      }).toList();
    } catch (e) {
      debugPrint('❌ Error getting notification history: $e');
      return [];
    }
  }

  /// Mark notification as read
  static Future<void> markNotificationAsRead(String notificationId) async {
    try {
      final user = _auth.currentUser;
      if (user == null) return;

      await _firestore
          .collection(AppConfig.colUsers)
          .doc(user.uid)
          .collection(AppConfig.colNotifications)
          .doc(notificationId)
          .update({'isRead': true, 'readAt': FieldValue.serverTimestamp()});

      debugPrint('✅ Notification marked as read: $notificationId');
    } catch (e) {
      debugPrint('❌ Error marking notification as read: $e');
    }
  }

  /// Clear all notifications
  static Future<void> clearAllNotifications() async {
    try {
      final user = _auth.currentUser;
      if (user == null) return;

      final batch = _firestore.batch();
      final snapshot = await _firestore
          .collection(AppConfig.colUsers)
          .doc(user.uid)
          .collection(AppConfig.colNotifications)
          .get();

      for (final doc in snapshot.docs) {
        batch.delete(doc.reference);
      }

      await batch.commit();
      debugPrint('✅ All notifications cleared');
    } catch (e) {
      debugPrint('❌ Error clearing notifications: $e');
    }
  }

  /// Dispose resources
  static void dispose() {
    _foregroundNotificationController.close();
    _backgroundNotificationController.close();
  }
}

/// Background message handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('📨 Background message handler: ${message.messageId}');
  
  // Handle the message here
  // This function runs in the background
  await FCMNotificationService.handleBackgroundNotification(message);
}

/// Notification data models
class NotificationData {
  final String id;
  final String type;
  final String title;
  final String body;
  final Map<String, dynamic> data;
  final DateTime createdAt;
  final bool isRead;

  NotificationData({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.data,
    required this.createdAt,
    this.isRead = false,
  });

  factory NotificationData.fromMap(Map<String, dynamic> map) {
    return NotificationData(
      id: map['id'] ?? '',
      type: map['type'] ?? '',
      title: map['title'] ?? '',
      body: map['body'] ?? '',
      data: Map<String, dynamic>.from(map['data'] ?? {}),
      createdAt: map['createdAt'] != null 
          ? (map['createdAt'] as Timestamp).toDate()
          : DateTime.now(),
      isRead: map['isRead'] ?? false,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'type': type,
      'title': title,
      'body': body,
      'data': data,
      'createdAt': Timestamp.fromDate(createdAt),
      'isRead': isRead,
    };
  }
}
