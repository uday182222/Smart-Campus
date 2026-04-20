import UIKit
import Flutter
import Firebase
import FirebaseMessaging
import UserNotifications

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    // Configure Firebase
    FirebaseApp.configure()
    
    // Set up FCM
    Messaging.messaging().delegate = self
    
    // Request notification permissions
    if #available(iOS 10.0, *) {
      UNUserNotificationCenter.current().delegate = self
      
      let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
      UNUserNotificationCenter.current().requestAuthorization(
        options: authOptions,
        completionHandler: { _, _ in }
      )
    } else {
      let settings: UIUserNotificationSettings =
        UIUserNotificationSettings(types: [.alert, .badge, .sound], categories: nil)
      application.registerUserNotificationSettings(settings)
    }
    
    application.registerForRemoteNotifications()
    
    GeneratedPluginRegistrant.register(with: self)
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
  
  // Handle notification when app is in foreground
  override func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    // Show notification even when app is in foreground
    completionHandler([.alert, .badge, .sound])
  }
  
  // Handle notification tap
  override func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    let userInfo = response.notification.request.content.userInfo
    
    // Handle notification data
    if let type = userInfo["type"] as? String,
       let id = userInfo["id"] as? String {
      // Navigate to appropriate screen based on notification type
      handleNotificationNavigation(type: type, id: id, userInfo: userInfo)
    }
    
    completionHandler()
  }
  
  // Handle notification navigation
  private func handleNotificationNavigation(type: String, id: String, userInfo: [AnyHashable: Any]) {
    // This would typically use a navigation service
    // For now, we'll just log the navigation intent
    print("🧭 Navigate to \(type) with ID: \(id)")
    
    // You can implement navigation logic here
    // For example, using a navigation service or posting a notification
    NotificationCenter.default.post(
      name: NSNotification.Name("NotificationTapped"),
      object: nil,
      userInfo: ["type": type, "id": id, "data": userInfo]
    )
  }
}

// MARK: - MessagingDelegate
extension AppDelegate: MessagingDelegate {
  func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
    print("📱 Firebase registration token: \(String(describing: fcmToken))")
    
    // Send token to your server
    if let token = fcmToken {
      // This will be handled by the Flutter app
      NotificationCenter.default.post(
        name: NSNotification.Name("FCMTokenReceived"),
        object: nil,
        userInfo: ["token": token]
      )
    }
  }
}

// MARK: - UNUserNotificationCenterDelegate
@available(iOS 10.0, *)
extension AppDelegate: UNUserNotificationCenterDelegate {
  // Handle notification when app is in foreground
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    // Show notification even when app is in foreground
    completionHandler([.alert, .badge, .sound])
  }
  
  // Handle notification tap
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    let userInfo = response.notification.request.content.userInfo
    
    // Handle notification data
    if let type = userInfo["type"] as? String,
       let id = userInfo["id"] as? String {
      // Navigate to appropriate screen based on notification type
      handleNotificationNavigation(type: type, id: id, userInfo: userInfo)
    }
    
    completionHandler()
  }
}