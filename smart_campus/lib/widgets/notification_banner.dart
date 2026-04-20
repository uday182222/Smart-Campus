import 'dart:async';
import 'package:flutter/material.dart';
import '../core/constants/app_constants.dart';

/// In-app notification banner widget
class NotificationBanner extends StatefulWidget {
  final String title;
  final String body;
  final String? imageUrl;
  final Map<String, dynamic>? data;
  final VoidCallback? onTap;
  final VoidCallback? onDismiss;
  final Duration duration;
  final Color? backgroundColor;
  final Color? textColor;
  final IconData? icon;

  const NotificationBanner({
    super.key,
    required this.title,
    required this.body,
    this.imageUrl,
    this.data,
    this.onTap,
    this.onDismiss,
    this.duration = const Duration(seconds: 5),
    this.backgroundColor,
    this.textColor,
    this.icon,
  });

  @override
  State<NotificationBanner> createState() => _NotificationBannerState();
}

class _NotificationBannerState extends State<NotificationBanner>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _fadeAnimation;
  Timer? _dismissTimer;

  @override
  void initState() {
    super.initState();
    
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, -1),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOut,
    ));

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOut,
    ));

    // Start animation
    _animationController.forward();

    // Auto dismiss after duration
    _dismissTimer = Timer(widget.duration, () {
      dismiss();
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    _dismissTimer?.cancel();
    super.dispose();
  }

  void dismiss() {
    if (mounted) {
      _animationController.reverse().then((_) {
        widget.onDismiss?.call();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SlideTransition(
      position: _slideAnimation,
      child: FadeTransition(
        opacity: _fadeAnimation,
        child: Container(
          margin: const EdgeInsets.all(AppConstants.paddingMedium),
          decoration: BoxDecoration(
            color: widget.backgroundColor ?? AppConstants.primaryColor,
            borderRadius: BorderRadius.circular(AppConstants.borderRadiusMedium),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () {
                widget.onTap?.call();
                dismiss();
              },
              borderRadius: BorderRadius.circular(AppConstants.borderRadiusMedium),
              child: Padding(
                padding: const EdgeInsets.all(AppConstants.paddingMedium),
                child: Row(
                  children: [
                    // Icon
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: (widget.textColor ?? Colors.white).withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Icon(
                        widget.icon ?? _getIconForType(),
                        color: widget.textColor ?? Colors.white,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: AppConstants.paddingMedium),
                    
                    // Content
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            widget.title,
                            style: TextStyle(
                              color: widget.textColor ?? Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            widget.body,
                            style: TextStyle(
                              color: (widget.textColor ?? Colors.white).withOpacity(0.9),
                              fontSize: 14,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    
                    // Dismiss button
                    IconButton(
                      onPressed: dismiss,
                      icon: Icon(
                        Icons.close,
                        color: widget.textColor ?? Colors.white,
                        size: 20,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  IconData _getIconForType() {
    final type = widget.data?['type'] as String?;
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
}

/// Notification banner overlay
class NotificationBannerOverlay extends StatefulWidget {
  final Widget child;
  final Stream<Map<String, dynamic>> notificationStream;

  const NotificationBannerOverlay({
    super.key,
    required this.child,
    required this.notificationStream,
  });

  @override
  State<NotificationBannerOverlay> createState() => _NotificationBannerOverlayState();
}

class _NotificationBannerOverlayState extends State<NotificationBannerOverlay> {
  final List<Map<String, dynamic>> _notifications = [];
  final GlobalKey<OverlayState> _overlayKey = GlobalKey<OverlayState>();
  OverlayEntry? _overlayEntry;

  @override
  void initState() {
    super.initState();
    widget.notificationStream.listen(_handleNotification);
  }

  void _handleNotification(Map<String, dynamic> notification) {
    setState(() {
      _notifications.add(notification);
    });

    _showBanner(notification);
  }

  void _showBanner(Map<String, dynamic> notification) {
    if (_overlayEntry != null) {
      _overlayEntry!.remove();
    }

    _overlayEntry = OverlayEntry(
      builder: (context) => Positioned(
        top: MediaQuery.of(context).padding.top + 10,
        left: 0,
        right: 0,
        child: NotificationBanner(
          title: notification['title'] ?? 'Notification',
          body: notification['body'] ?? '',
          data: notification['data'],
          onTap: () {
            _handleNotificationTap(notification);
          },
          onDismiss: () {
            _overlayEntry?.remove();
            _overlayEntry = null;
          },
        ),
      ),
    );

    _overlayKey.currentState?.insert(_overlayEntry!);
  }

  void _handleNotificationTap(Map<String, dynamic> notification) {
    // Handle notification tap
    final type = notification['data']?['type'] as String?;
    final id = notification['data']?['id'] as String?;

    if (type != null && id != null) {
      // Navigate to appropriate screen
      _navigateToScreen(type, id, notification['data']);
    }
  }

  void _navigateToScreen(String type, String id, Map<String, dynamic>? data) {
    // This would typically use a navigation service
    // For now, we'll just log the navigation intent
    debugPrint('🧭 Navigate to $type with ID: $id');
    
    // You can implement navigation logic here
    // For example, using a navigation service or calling a callback
  }

  @override
  Widget build(BuildContext context) {
    return Overlay(
      key: _overlayKey,
    );
  }

  @override
  void dispose() {
    _overlayEntry?.remove();
    super.dispose();
  }
}

/// Notification history widget
class NotificationHistoryWidget extends StatefulWidget {
  const NotificationHistoryWidget({super.key});

  @override
  State<NotificationHistoryWidget> createState() => _NotificationHistoryWidgetState();
}

class _NotificationHistoryWidgetState extends State<NotificationHistoryWidget> {
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    try {
      // This would typically load from a service
      // For now, we'll use mock data
      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_notifications.isEmpty) {
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
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: _notifications.length,
      itemBuilder: (context, index) {
        final notification = _notifications[index];
        return _buildNotificationItem(notification);
      },
    );
  }

  Widget _buildNotificationItem(Map<String, dynamic> notification) {
    final type = notification['type'] as String?;
    final title = notification['title'] as String? ?? 'Notification';
    final body = notification['body'] as String? ?? '';
    final isRead = notification['isRead'] as bool? ?? false;
    return Card(
      margin: const EdgeInsets.symmetric(
        horizontal: AppConstants.paddingMedium,
        vertical: AppConstants.paddingSmall,
      ),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _getColorForType(type),
          child: Icon(
            _getIconForType(type),
            color: Colors.white,
          ),
        ),
        title: Text(
          title,
          style: TextStyle(
            fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
          ),
        ),
        subtitle: Text(body),
        trailing: isRead
            ? null
            : Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: AppConstants.primaryColor,
                  shape: BoxShape.circle,
                ),
              ),
        onTap: () {
          // Handle notification tap
          _handleNotificationTap(notification);
        },
      ),
    );
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

  void _handleNotificationTap(Map<String, dynamic> notification) {
    // Handle notification tap
    final type = notification['type'] as String?;
    final id = notification['data']?['id'] as String?;

    if (type != null && id != null) {
      // Navigate to appropriate screen
      _navigateToScreen(type, id, notification['data']);
    }
  }

  void _navigateToScreen(String type, String id, Map<String, dynamic>? data) {
    // This would typically use a navigation service
    // For now, we'll just log the navigation intent
    debugPrint('🧭 Navigate to $type with ID: $id');
  }
}
