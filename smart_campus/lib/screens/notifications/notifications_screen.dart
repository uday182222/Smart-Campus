import 'dart:async';
import 'package:flutter/material.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../core/constants/app_constants.dart';
import '../../services/fcm_notification_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = true;
  StreamSubscription<RemoteMessage>? _foregroundSubscription;
  StreamSubscription<RemoteMessage>? _backgroundSubscription;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
    _setupNotificationListeners();
  }

  @override
  void dispose() {
    _foregroundSubscription?.cancel();
    _backgroundSubscription?.cancel();
    super.dispose();
  }

  Future<void> _loadNotifications() async {
    try {
      setState(() {
        _isLoading = true;
      });

      // Load notification history
      final notifications = await FCMNotificationService.getNotificationHistory();
      
      setState(() {
        _notifications = notifications;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      _showErrorSnackBar('Failed to load notifications: $e');
    }
  }

  void _setupNotificationListeners() {
    // Listen to foreground notifications
    _foregroundSubscription = FCMNotificationService.foregroundNotifications.listen((message) {
      _showInAppNotification(message);
    });

    // Listen to background notifications
    _backgroundSubscription = FCMNotificationService.backgroundNotifications.listen((message) {
      _handleBackgroundNotification(message);
    });
  }

  void _showInAppNotification(RemoteMessage message) {
    // Show in-app notification banner
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              message.notification?.title ?? 'Notification',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            Text(message.notification?.body ?? ''),
          ],
        ),
        duration: const Duration(seconds: 4),
        action: SnackBarAction(
          label: 'View',
          onPressed: () {
            _handleNotificationTap(message);
          },
        ),
      ),
    );
  }

  void _handleBackgroundNotification(RemoteMessage message) {
    // Handle background notification
    _handleNotificationTap(message);
  }

  void _handleNotificationTap(RemoteMessage message) {
    final data = message.data;
    final type = data['type'] as String?;
    final id = data['id'] as String?;

    if (type != null && id != null) {
      _navigateToScreen(type, id, data);
    }
  }

  void _navigateToScreen(String type, String id, Map<String, dynamic> data) {
    // Navigate to appropriate screen based on notification type
    switch (type) {
      case 'announcement':
        Navigator.pushNamed(context, '/announcements', arguments: {'id': id});
        break;
      case 'homework':
        Navigator.pushNamed(context, '/homework', arguments: {'id': id});
        break;
      case 'route_update':
      case 'stop_reached':
        Navigator.pushNamed(context, '/transport', arguments: {'id': id});
        break;
      case 'attendance':
        Navigator.pushNamed(context, '/attendance', arguments: {'id': id});
        break;
      default:
        _showErrorSnackBar('Unknown notification type: $type');
    }
  }

  Future<void> _markAsRead(String notificationId) async {
    try {
      await FCMNotificationService.markNotificationAsRead(notificationId);
      await _loadNotifications(); // Refresh the list
    } catch (e) {
      _showErrorSnackBar('Failed to mark notification as read: $e');
    }
  }

  Future<void> _clearAllNotifications() async {
    try {
      await FCMNotificationService.clearAllNotifications();
      await _loadNotifications(); // Refresh the list
      _showSuccessSnackBar('All notifications cleared');
    } catch (e) {
      _showErrorSnackBar('Failed to clear notifications: $e');
    }
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppConstants.errorColor,
      ),
    );
  }

  void _showSuccessSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppConstants.successColor,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        backgroundColor: AppConstants.primaryColor,
        foregroundColor: Colors.white,
        actions: [
          if (_notifications.isNotEmpty)
            IconButton(
              onPressed: _clearAllNotifications,
              icon: const Icon(Icons.clear_all),
              tooltip: 'Clear All',
            ),
          IconButton(
            onPressed: _loadNotifications,
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _notifications.isEmpty
              ? _buildEmptyState()
              : _buildNotificationsList(),
    );
  }

  Widget _buildEmptyState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.notifications_none,
            size: 64,
            color: Colors.grey,
          ),
          SizedBox(height: 16),
          Text(
            'No notifications yet',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey,
            ),
          ),
          SizedBox(height: 8),
          Text(
            'You\'ll receive notifications for announcements, homework, and more.',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationsList() {
    return ListView.builder(
      padding: const EdgeInsets.all(AppConstants.paddingMedium),
      itemCount: _notifications.length,
      itemBuilder: (context, index) {
        final notification = _notifications[index];
        return _buildNotificationCard(notification);
      },
    );
  }

  Widget _buildNotificationCard(Map<String, dynamic> notification) {
    final type = notification['type'] as String?;
    final title = notification['title'] as String? ?? 'Notification';
    final body = notification['body'] as String? ?? '';
    final isRead = notification['isRead'] as bool? ?? false;
    final createdAt = notification['createdAt'];

    return Card(
      margin: const EdgeInsets.only(bottom: AppConstants.paddingMedium),
      elevation: isRead ? 1 : 3,
      child: InkWell(
        onTap: () {
          _handleNotificationCardTap(notification);
        },
        borderRadius: BorderRadius.circular(AppConstants.borderRadiusMedium),
        child: Padding(
          padding: const EdgeInsets.all(AppConstants.paddingMedium),
          child: Row(
            children: [
              // Icon
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: _getColorForType(type).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Icon(
                  _getIconForType(type),
                  color: _getColorForType(type),
                  size: 24,
                ),
              ),
              const SizedBox(width: AppConstants.paddingMedium),
              
              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            style: TextStyle(
                              fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
                              fontSize: 16,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (!isRead)
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: AppConstants.primaryColor,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      body,
                      style: const TextStyle(
                        color: AppConstants.textSecondary,
                        fontSize: 14,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Text(
                          _formatDate(createdAt),
                          style: const TextStyle(
                            color: AppConstants.textLight,
                            fontSize: 12,
                          ),
                        ),
                        const Spacer(),
                        if (type != null)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: _getColorForType(type).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              _getTypeLabel(type),
                              style: TextStyle(
                                color: _getColorForType(type),
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _handleNotificationCardTap(Map<String, dynamic> notification) {
    final type = notification['type'] as String?;
    final id = notification['data']?['id'] as String?;
    final notificationId = notification['id'] as String?;

    if (type != null && id != null) {
      _navigateToScreen(type, id, notification['data'] ?? {});
      
      // Mark as read if not already read
      if (notificationId != null && !(notification['isRead'] as bool? ?? false)) {
        _markAsRead(notificationId);
      }
    }
  }

  Color _getColorForType(String? type) {
    switch (type) {
      case 'announcement':
        return AppConstants.infoColor;
      case 'homework':
        return AppConstants.warningColor;
      case 'attendance':
        return AppConstants.successColor;
      case 'route_update':
      case 'stop_reached':
        return AppConstants.primaryColor;
      default:
        return AppConstants.textSecondary;
    }
  }

  IconData _getIconForType(String? type) {
    switch (type) {
      case 'announcement':
        return Icons.announcement;
      case 'homework':
        return Icons.assignment;
      case 'attendance':
        return Icons.check_circle;
      case 'route_update':
      case 'stop_reached':
        return Icons.directions_bus;
      default:
        return Icons.notifications;
    }
  }

  String _getTypeLabel(String type) {
    switch (type) {
      case 'announcement':
        return 'Announcement';
      case 'homework':
        return 'Homework';
      case 'attendance':
        return 'Attendance';
      case 'route_update':
        return 'Transport';
      case 'stop_reached':
        return 'Bus Stop';
      default:
        return 'Notification';
    }
  }

  String _formatDate(dynamic timestamp) {
    if (timestamp == null) return 'Just now';
    
    try {
      DateTime date;
      if (timestamp is Timestamp) {
        date = timestamp.toDate();
      } else if (timestamp is String) {
        date = DateTime.parse(timestamp);
      } else {
        return 'Just now';
      }
      
      final now = DateTime.now();
      final difference = now.difference(date);
      
      if (difference.inMinutes < 1) {
        return 'Just now';
      } else if (difference.inHours < 1) {
        return '${difference.inMinutes}m ago';
      } else if (difference.inDays < 1) {
        return '${difference.inHours}h ago';
      } else if (difference.inDays < 7) {
        return '${difference.inDays}d ago';
      } else {
        return '${date.day}/${date.month}/${date.year}';
      }
    } catch (e) {
      return 'Just now';
    }
  }
}
