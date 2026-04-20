import 'dart:async';
import 'package:flutter/material.dart';
import '../models/user_model.dart';

/// Mock AWS Service for Local Development
/// This simulates AWS services locally and can be easily migrated to real AWS later
class MockAWSService {
  static final Map<String, dynamic> _mockData = {
    'users': <Map<String, dynamic>>[],
    'transport_routes': <Map<String, dynamic>>[],
    'fee_structures': <Map<String, dynamic>>[],
    'gallery_items': <Map<String, dynamic>>[],
    'appointments': <Map<String, dynamic>>[],
    'notifications': <Map<String, dynamic>>[],
  };

  static final StreamController<Map<String, dynamic>> _updatesController = 
      StreamController<Map<String, dynamic>>.broadcast();

  /// Initialize mock AWS service
  static Future<void> initialize() async {
    await _initializeMockData();
    debugPrint('✅ Mock AWS Service initialized successfully');
  }

  /// Initialize mock data
  static Future<void> _initializeMockData() async {
    // Mock users
    _mockData['users'] = [
      {
        'userId': 'admin_1',
        'email': 'admin@school.com',
        'firstName': 'School',
        'lastName': 'Admin',
        'role': 'admin',
        'schoolId': 'school_1',
        'isActive': true,
        'createdAt': DateTime.now().toIso8601String(),
      },
      {
        'userId': 'parent_1',
        'email': 'parent@example.com',
        'firstName': 'John',
        'lastName': 'Doe',
        'role': 'parent',
        'schoolId': 'school_1',
        'isActive': true,
        'createdAt': DateTime.now().toIso8601String(),
      },
      {
        'userId': 'teacher_1',
        'email': 'teacher@school.com',
        'firstName': 'Jane',
        'lastName': 'Smith',
        'role': 'teacher',
        'schoolId': 'school_1',
        'isActive': true,
        'createdAt': DateTime.now().toIso8601String(),
      },
    ];

    // Mock transport routes
    _mockData['transport_routes'] = [
      {
        'routeId': 'route_1',
        'name': 'Route A - North Campus',
        'schoolId': 'school_1',
        'busNumber': 'BUS-001',
        'driverName': 'Rajesh Kumar',
        'helperName': 'Priya Singh',
        'stops': [
          {
            'stopId': 'stop_1',
            'name': 'Central Park',
            'time': '08:00',
            'status': 'pending',
          },
          {
            'stopId': 'stop_2',
            'name': 'Mall Road',
            'time': '08:15',
            'status': 'reached',
          },
        ],
        'isActive': true,
        'createdAt': DateTime.now().toIso8601String(),
      },
    ];

    // Mock fee structures
    _mockData['fee_structures'] = [
      {
        'feeStructureId': 'fee_1',
        'schoolId': 'school_1',
        'name': 'Monthly Tuition Fee',
        'type': 'tuition',
        'amount': 5000.0,
        'currency': 'INR',
        'dueDate': DateTime.now().add(Duration(days: 30)).toIso8601String(),
        'isActive': true,
        'createdAt': DateTime.now().toIso8601String(),
      },
    ];

    // Mock gallery items
    _mockData['gallery_items'] = [
      {
        'itemId': 'gallery_1',
        'schoolId': 'school_1',
        'title': 'Annual Sports Day',
        'description': 'Photos from the annual sports day event',
        'category': 'events',
        'imageUrls': ['https://example.com/sports1.jpg'],
        'likes': 45,
        'views': 120,
        'createdAt': DateTime.now().toIso8601String(),
      },
    ];

    // Mock appointments
    _mockData['appointments'] = [
      {
        'appointmentId': 'appt_1',
        'schoolId': 'school_1',
        'parentId': 'parent_1',
        'teacherId': 'teacher_1',
        'title': 'Parent-Teacher Meeting',
        'description': 'Discussion about student progress',
        'scheduledDate': DateTime.now().add(Duration(days: 7)).toIso8601String(),
        'status': 'pending',
        'createdAt': DateTime.now().toIso8601String(),
      },
    ];

    debugPrint('📊 Mock data initialized with ${_mockData.length} collections');
  }

  /// Authenticate user (simulates AWS Cognito)
  static Future<UserModel?> authenticateUser(String email, String password) async {
    await Future.delayed(Duration(seconds: 1)); // Simulate network delay
    
    final users = List<Map<String, dynamic>>.from(_mockData['users']);
    final user = users.firstWhere(
      (u) => u['email'] == email,
      orElse: () => {},
    );

    if (user.isNotEmpty) {
      return UserModel(
        id: user['userId'],
        email: user['email'],
        name: '${user['firstName']} ${user['lastName']}',
        role: user['role'],
        phone: '',
        address: '',
        profileUrl: '',
        createdAt: DateTime.parse(user['createdAt']),
        lastLoginAt: DateTime.now(),
      );
    }
    
    return null;
  }

  /// Get data from mock database (simulates DynamoDB)
  static Future<List<Map<String, dynamic>>> getData(String collection) async {
    await Future.delayed(Duration(milliseconds: 500)); // Simulate network delay
    return List<Map<String, dynamic>>.from(_mockData[collection] ?? []);
  }

  /// Save data to mock database (simulates DynamoDB)
  static Future<bool> saveData(String collection, Map<String, dynamic> data) async {
    await Future.delayed(Duration(milliseconds: 500)); // Simulate network delay
    
    if (!_mockData.containsKey(collection)) {
      _mockData[collection] = <Map<String, dynamic>>[];
    }
    
    final items = List<Map<String, dynamic>>.from(_mockData[collection]);
    items.add(data);
    _mockData[collection] = items;
    
    // Emit real-time update
    _updatesController.add({
      'collection': collection,
      'action': 'create',
      'data': data,
    });
    
    return true;
  }

  /// Update data in mock database (simulates DynamoDB)
  static Future<bool> updateData(String collection, String id, Map<String, dynamic> updates) async {
    await Future.delayed(Duration(milliseconds: 500)); // Simulate network delay
    
    if (!_mockData.containsKey(collection)) return false;
    
    final items = List<Map<String, dynamic>>.from(_mockData[collection]);
    final index = items.indexWhere((item) => item['${collection.split('_').first}Id'] == id);
    
    if (index != -1) {
      items[index].addAll(updates);
      items[index]['updatedAt'] = DateTime.now().toIso8601String();
      _mockData[collection] = items;
      
      // Emit real-time update
      _updatesController.add({
        'collection': collection,
        'action': 'update',
        'id': id,
        'data': items[index],
      });
      
      return true;
    }
    
    return false;
  }

  /// Delete data from mock database (simulates DynamoDB)
  static Future<bool> deleteData(String collection, String id) async {
    await Future.delayed(Duration(milliseconds: 500)); // Simulate network delay
    
    if (!_mockData.containsKey(collection)) return false;
    
    final items = List<Map<String, dynamic>>.from(_mockData[collection]);
    final index = items.indexWhere((item) => item['${collection.split('_').first}Id'] == id);
    
    if (index != -1) {
      final deletedItem = items.removeAt(index);
      _mockData[collection] = items;
      
      // Emit real-time update
      _updatesController.add({
        'collection': collection,
        'action': 'delete',
        'id': id,
        'data': deletedItem,
      });
      
      return true;
    }
    
    return false;
  }

  /// Send notification (simulates SNS)
  static Future<bool> sendNotification(String userId, String title, String body) async {
    await Future.delayed(Duration(milliseconds: 300)); // Simulate network delay
    
    final notification = {
      'notificationId': 'notif_${DateTime.now().millisecondsSinceEpoch}',
      'userId': userId,
      'title': title,
      'body': body,
      'isRead': false,
      'createdAt': DateTime.now().toIso8601String(),
    };
    
    // Add to notifications collection
    if (!_mockData.containsKey('notifications')) {
      _mockData['notifications'] = <Map<String, dynamic>>[];
    }
    
    final notifications = List<Map<String, dynamic>>.from(_mockData['notifications']);
    notifications.add(notification);
    _mockData['notifications'] = notifications;
    
    debugPrint('📱 Mock notification sent: $title');
    return true;
  }

  /// Upload file (simulates S3)
  static Future<String> uploadFile(String fileName, List<int> fileData) async {
    await Future.delayed(Duration(seconds: 2)); // Simulate upload delay
    
    final fileUrl = 'https://mock-s3-bucket.s3.amazonaws.com/files/$fileName';
    debugPrint('📁 Mock file uploaded: $fileUrl');
    return fileUrl;
  }

  /// Get real-time updates stream (simulates DynamoDB Streams)
  static Stream<Map<String, dynamic>> getUpdatesStream() {
    return _updatesController.stream;
  }

  /// Get analytics data (simulates CloudWatch)
  static Future<Map<String, dynamic>> getAnalytics(String schoolId) async {
    await Future.delayed(Duration(milliseconds: 800)); // Simulate processing delay
    
    final routes = List<Map<String, dynamic>>.from(_mockData['transport_routes']);
    final fees = List<Map<String, dynamic>>.from(_mockData['fee_structures']);
    final gallery = List<Map<String, dynamic>>.from(_mockData['gallery_items']);
    final appointments = List<Map<String, dynamic>>.from(_mockData['appointments']);
    
    return {
      'transport': {
        'totalRoutes': routes.length,
        'activeRoutes': routes.where((r) => r['isActive'] == true).length,
        'totalStops': routes.fold<int>(0, (sum, route) => sum + ((route['stops']?.length ?? 0) as int)),
      },
      'fees': {
        'totalFeeStructures': fees.length,
        'totalAmount': fees.fold(0.0, (sum, fee) => sum + (fee['amount'] ?? 0.0)),
        'overdueCount': 5, // Mock data
      },
      'gallery': {
        'totalItems': gallery.length,
        'totalViews': gallery.fold<int>(0, (sum, item) => sum + ((item['views'] ?? 0) as int)),
        'totalLikes': gallery.fold<int>(0, (sum, item) => sum + ((item['likes'] ?? 0) as int)),
      },
      'appointments': {
        'totalAppointments': appointments.length,
        'pendingAppointments': appointments.where((a) => a['status'] == 'pending').length,
        'completedAppointments': appointments.where((a) => a['status'] == 'completed').length,
      },
    };
  }

  /// Dispose resources
  static void dispose() {
    _updatesController.close();
  }
}
