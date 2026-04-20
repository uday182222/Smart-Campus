# Smart Campus - Push Notifications System

This document explains the comprehensive push notification system implemented for the Smart Campus app using Firebase Cloud Messaging (FCM) and Cloud Functions.

## 🔔 System Overview

The notification system provides real-time push notifications for:
- **Announcements** - School-wide announcements and news
- **Homework** - New homework assignments and updates
- **Attendance** - Student attendance notifications for parents
- **Transport** - Bus route updates and stop notifications
- **Custom** - Admin-sent custom notifications

## 🏗️ Architecture

### 1. Flutter App (Client)
- **FCM Integration** - Firebase Cloud Messaging setup
- **Notification Service** - Handles all notification logic
- **In-App Banners** - Foreground notification display
- **Navigation** - Deep linking to appropriate screens
- **History** - Notification history and management

### 2. Cloud Functions (Server)
- **Firestore Triggers** - Automatic notification sending
- **Token Management** - Device token cleanup and validation
- **Notification History** - Store notification records
- **Custom Notifications** - Manual notification sending

### 3. Firestore Database
- **Device Tokens** - User device registration
- **Notification History** - User notification records
- **Security Rules** - Access control for tokens and notifications

## 📱 Flutter Integration

### Dependencies Added
```yaml
dependencies:
  firebase_messaging: ^15.0.0
  permission_handler: ^11.1.0
```

### Key Files
- `lib/services/fcm_notification_service.dart` - Main notification service
- `lib/widgets/notification_banner.dart` - In-app notification UI
- `lib/screens/notifications/notifications_screen.dart` - Notification history
- `android/app/src/main/res/values/strings.xml` - Android configuration
- `ios/Runner/AppDelegate.swift` - iOS configuration

### Initialization
```dart
// In main.dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp();
  
  // Set up background message handler
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  
  // Initialize FCM service
  await FCMNotificationService.initialize();
  
  runApp(MyApp());
}
```

## ☁️ Cloud Functions

### Functions Deployed
1. **`onAnnouncementCreated`** - Sends notifications when new announcements are posted
2. **`onHomeworkCreated`** - Notifies students and parents about new homework
3. **`onRouteStatusUpdated`** - Alerts parents about bus delays or status changes
4. **`onStopReached`** - Notifies parents when their child's bus stop is reached
5. **`onAttendanceMarked`** - Sends attendance updates to parents
6. **`sendCustomNotification`** - Manual notification sending function
7. **`cleanupOldNotifications`** - Scheduled cleanup of old notifications

### Notification Triggers
```javascript
// Example: Announcement notification
exports.onAnnouncementCreated = functions.firestore
  .document('announcements/{announcementId}')
  .onCreate(async (snap, context) => {
    const announcement = snap.data();
    const schoolId = announcement.schoolId;
    
    // Get device tokens for school users
    const tokens = await getDeviceTokensForSchool(schoolId, ['parent', 'teacher']);
    
    // Send notification
    await sendPushNotification(tokens, {
      title: 'New Announcement',
      body: announcement.title
    }, {
      type: 'announcement',
      id: context.params.announcementId
    });
  });
```

## 🔐 Security Implementation

### Firestore Security Rules
```javascript
// Device tokens - users can only manage their own
match /users/{userId}/deviceTokens/{tokenId} {
  allow read, write: if userId == request.auth.uid;
  allow create: if request.auth != null && userId == request.auth.uid;
}

// Notifications - users can only read their own
match /users/{userId}/notifications/{notificationId} {
  allow read: if userId == request.auth.uid;
  allow write: if true; // Cloud Functions can write
}
```

### Server-Side Security
- Only Cloud Functions can send notifications
- No client-side ability to send arbitrary notifications
- Token validation and cleanup
- Role-based notification targeting

## 📊 Notification Types

### 1. Announcements
- **Trigger**: New announcement created
- **Recipients**: All parents and teachers in the school
- **Navigation**: Opens announcement details screen

### 2. Homework
- **Trigger**: New homework assignment created
- **Recipients**: Assigned students and their parents
- **Navigation**: Opens homework details screen

### 3. Attendance
- **Trigger**: Student attendance marked
- **Recipients**: Student's parent
- **Navigation**: Opens attendance screen

### 4. Transport Updates
- **Trigger**: Bus route status changes
- **Recipients**: Parents of students on the route
- **Navigation**: Opens transport screen

### 5. Stop Reached
- **Trigger**: Bus reaches a stop
- **Recipients**: Parents of students at that stop
- **Navigation**: Opens transport screen

## 🎨 Notification UI

### In-App Banners
- **Foreground notifications** displayed as banners
- **Auto-dismiss** after 5 seconds
- **Tap to navigate** to relevant screen
- **Dismiss button** for manual closure

### Notification History
- **Complete history** of all notifications
- **Read/unread status** tracking
- **Type-based filtering** and organization
- **Clear all** functionality

### Visual Design
- **Type-specific icons** and colors
- **Material Design** consistent styling
- **Responsive layout** for all screen sizes
- **Accessibility** support

## 🚀 Setup Instructions

### 1. Prerequisites
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Install Flutter dependencies
cd smart_campus
flutter pub get
```

### 2. Firebase Configuration
1. **Download configuration files**:
   - `google-services.json` for Android
   - `GoogleService-Info.plist` for iOS

2. **Place files**:
   - Android: `android/app/google-services.json`
   - iOS: `ios/Runner/GoogleService-Info.plist`

### 3. Deploy Backend
```bash
# Deploy Cloud Functions
firebase deploy --only functions

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

### 4. Run Setup Script
```bash
# Run automated setup
./setup-notifications.sh
```

## 🧪 Testing

### 1. Test Notifications
```bash
# Send test notification from Firebase Console
# Go to Firebase Console > Cloud Messaging > Send test message
```

### 2. Test Different States
- **Foreground** - App is open and visible
- **Background** - App is open but not visible
- **Terminated** - App is completely closed

### 3. Test Navigation
- Verify notifications navigate to correct screens
- Test with different notification types
- Check deep linking functionality

## 📱 Platform-Specific Setup

### Android Configuration
```xml
<!-- strings.xml -->
<string name="default_notification_channel_id">smart_campus_notifications</string>
<string name="default_notification_channel_name">Smart Campus Notifications</string>

<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.VIBRATE" />
```

### iOS Configuration
```swift
// AppDelegate.swift
import Firebase
import FirebaseMessaging
import UserNotifications

// Request notification permissions
let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
UNUserNotificationCenter.current().requestAuthorization(options: authOptions)
```

## 🔧 Customization

### Notification Appearance
```dart
// Customize notification banner
NotificationBanner(
  title: 'Custom Title',
  body: 'Custom message',
  backgroundColor: Colors.blue,
  textColor: Colors.white,
  icon: Icons.custom_icon,
  duration: Duration(seconds: 10),
)
```

### Notification Channels (Android)
```dart
// Create custom notification channels
await _messaging.requestPermission(
  alert: true,
  badge: true,
  sound: true,
);
```

### Custom Data Handling
```dart
// Handle custom notification data
void _handleNotificationTap(RemoteMessage message) {
  final data = message.data;
  final type = data['type'];
  final id = data['id'];
  
  // Custom navigation logic
  _navigateToScreen(type, id, data);
}
```

## 📈 Monitoring and Analytics

### Notification Metrics
- **Delivery rates** - Track successful deliveries
- **Open rates** - Monitor user engagement
- **Token validity** - Clean up invalid tokens
- **Error handling** - Log and handle failures

### Performance Optimization
- **Batch operations** - Send multiple notifications efficiently
- **Token cleanup** - Remove invalid tokens automatically
- **Rate limiting** - Prevent notification spam
- **Caching** - Optimize notification history loading

## 🐛 Troubleshooting

### Common Issues

1. **Notifications not received**
   - Check device token registration
   - Verify Firebase configuration
   - Check notification permissions

2. **Navigation not working**
   - Verify notification data structure
   - Check route definitions
   - Test deep linking

3. **Background notifications not working**
   - Check background message handler
   - Verify iOS background modes
   - Test with different app states

### Debug Mode
```dart
// Enable debug logging
FirebaseMessaging.onMessage.listen((message) {
  print('📨 Foreground message: ${message.messageId}');
  print('📨 Data: ${message.data}');
});
```

## 📚 Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Flutter FCM Plugin](https://pub.dev/packages/firebase_messaging)
- [Cloud Functions Documentation](https://firebase.google.com/docs/functions)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

## 🤝 Contributing

When adding new notification types:

1. **Add trigger function** in Cloud Functions
2. **Update notification service** in Flutter
3. **Add UI components** for the new type
4. **Update security rules** if needed
5. **Test thoroughly** on both platforms
6. **Update documentation** with examples

---

**Remember**: Push notifications are a powerful feature that can significantly improve user engagement. Always test thoroughly and respect user preferences for notification settings.
