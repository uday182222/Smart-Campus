import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../core/constants/app_constants.dart';

class AnnouncementService {
  static final AnnouncementService _instance = AnnouncementService._internal();
  factory AnnouncementService() => _instance;
  AnnouncementService._internal();

  // Firebase Firestore reference
  static FirebaseFirestore? _firestore;
  
  // Local cache for offline support
  static final List<Map<String, dynamic>> _localAnnouncements = [];
  static final List<Function> _listeners = [];
  
  // Initialize the service
  static Future<void> initialize() async {
    try {
      _firestore = FirebaseFirestore.instance;
      await _loadAnnouncementsFromFirestore();
    } catch (e) {
      debugPrint('Failed to initialize AnnouncementService: $e');
      // Continue with local data
    }
  }

  // Load announcements from Firestore
  static Future<void> _loadAnnouncementsFromFirestore() async {
    if (_firestore == null) return;
    
    try {
      final snapshot = await _firestore!
          .collection(AppConfig.colAnnouncements)
          .orderBy('createdAt', descending: true)
          .get();
      
      _localAnnouncements.clear();
      for (var doc in snapshot.docs) {
        final data = doc.data();
        data['id'] = doc.id;
        _localAnnouncements.add(data);
      }
      
      // Notify listeners
      _notifyListeners();
    } catch (e) {
      debugPrint('Failed to load announcements from Firestore: $e');
    }
  }

  // Add a new announcement
  static Future<Map<String, dynamic>> addAnnouncement(Map<String, dynamic> announcement) async {
    try {
      // Add to local cache
      final newAnnouncement = {
        ...announcement,
        'id': announcement['id'] ?? DateTime.now().millisecondsSinceEpoch.toString(),
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      };
      
      _localAnnouncements.insert(0, newAnnouncement);
      
      // Save to Firestore
      if (_firestore != null) {
        await _firestore!.collection(AppConfig.colAnnouncements).add(newAnnouncement);
      }
      
      // Notify listeners
      _notifyListeners();
      
      return newAnnouncement;
    } catch (e) {
      debugPrint('Failed to add announcement: $e');
      rethrow;
    }
  }

  // Update an existing announcement
  static Future<Map<String, dynamic>> updateAnnouncement(String id, Map<String, dynamic> updates) async {
    try {
      // Update local cache
      final index = _localAnnouncements.indexWhere((a) => a['id'] == id);
      if (index != -1) {
        _localAnnouncements[index] = {
          ..._localAnnouncements[index],
          ...updates,
          'updatedAt': FieldValue.serverTimestamp(),
        };
      }
      
      // Update in Firestore
      if (_firestore != null) {
        await _firestore!.collection(AppConfig.colAnnouncements).doc(id).update(updates);
      }
      
      // Notify listeners
      _notifyListeners();
      
      return _localAnnouncements[index];
    } catch (e) {
      debugPrint('Failed to update announcement: $e');
      rethrow;
    }
  }

  // Delete an announcement
  static Future<void> deleteAnnouncement(String id) async {
    try {
      // Remove from local cache
      _localAnnouncements.removeWhere((a) => a['id'] == id);
      
      // Delete from Firestore
      if (_firestore != null) {
        await _firestore!.collection(AppConfig.colAnnouncements).doc(id).delete();
      }
      
      // Notify listeners
      _notifyListeners();
    } catch (e) {
      debugPrint('Failed to delete announcement: $e');
      rethrow;
    }
  }

  // Get all announcements
  static List<Map<String, dynamic>> getAllAnnouncements() {
    return List.from(_localAnnouncements);
  }

  // Get announcements for a specific role/audience
  static List<Map<String, dynamic>> getAnnouncementsForRole(String userRole) {
    return _localAnnouncements.where((announcement) {
      final authorRole = announcement['authorRole'] as String?;
      final visibleTo = announcement['visibleTo'] as List<String>?;
      final isPublished = announcement['isPublished'] ?? false;
      
      // Only show published announcements
      if (!isPublished) return false;
      
      // Super admin can see all announcements
      if (userRole == AppConstants.roleSuperAdmin) return true;
      
      // Check visibility rules
      if (visibleTo != null && visibleTo.isNotEmpty) {
        if (visibleTo.contains('All Staff')) {
          return userRole == AppConstants.roleSuperAdmin || 
                 userRole == AppConstants.roleSchoolAdmin || 
                 userRole == AppConstants.roleTeacher || 
                 userRole == AppConstants.roleStaff;
        } else if (visibleTo.contains('School Admins')) {
          return userRole == AppConstants.roleSuperAdmin || 
                 userRole == AppConstants.roleSchoolAdmin;
        } else if (visibleTo.contains('Teachers')) {
          return userRole == AppConstants.roleSuperAdmin || 
                 userRole == AppConstants.roleSchoolAdmin || 
                 userRole == AppConstants.roleTeacher;
        } else if (visibleTo.contains('Parents')) {
          return userRole == AppConstants.roleSuperAdmin || 
                 userRole == AppConstants.roleSchoolAdmin || 
                 userRole == AppConstants.roleParent;
        } else if (visibleTo.contains('Students')) {
          return userRole == AppConstants.roleSuperAdmin || 
                 userRole == AppConstants.roleSchoolAdmin || 
                 userRole == AppConstants.roleStudent;
        }
      }
      
      // Default visibility based on author role
      if (authorRole == 'super_admin') {
        return userRole == AppConstants.roleSuperAdmin || 
               userRole == AppConstants.roleSchoolAdmin || 
               userRole == AppConstants.roleTeacher || 
               userRole == AppConstants.roleStaff;
      } else if (authorRole == 'school_admin') {
        return userRole == AppConstants.roleSuperAdmin || 
               userRole == AppConstants.roleSchoolAdmin;
      } else if (authorRole == 'teacher') {
        return userRole == AppConstants.roleSuperAdmin || 
               userRole == AppConstants.roleSchoolAdmin || 
               userRole == AppConstants.roleTeacher;
      }
      
      // Default: visible to everyone
      return true;
    }).toList();
  }

  // Get announcements for a specific class (for teachers)
  static List<Map<String, dynamic>> getAnnouncementsForClass(String classId) {
    return _localAnnouncements.where((announcement) {
      final announcementClassId = announcement['classId'] as String?;
      final isPublished = announcement['isPublished'] ?? false;
      
      return isPublished && (announcementClassId == classId || announcementClassId == null);
    }).toList();
  }

  // Search announcements
  static List<Map<String, dynamic>> searchAnnouncements(String query, String userRole) {
    final roleFiltered = getAnnouncementsForRole(userRole);
    if (query.isEmpty) return roleFiltered;
    
    return roleFiltered.where((announcement) {
      final title = announcement['title']?.toString().toLowerCase() ?? '';
      final content = announcement['content']?.toString().toLowerCase() ?? '';
      final author = announcement['author']?.toString().toLowerCase() ?? '';
      final category = announcement['category']?.toString().toLowerCase() ?? '';
      
      final searchQuery = query.toLowerCase();
      return title.contains(searchQuery) || 
             content.contains(searchQuery) || 
             author.contains(searchQuery) || 
             category.contains(searchQuery);
    }).toList();
  }

  // Filter announcements
  static List<Map<String, dynamic>> filterAnnouncements({
    String? category,
    String? priority,
    String? status,
    String? authorRole,
    String userRole = '',
  }) {
    var filtered = getAnnouncementsForRole(userRole);
    
    if (category != null && category != 'All') {
      filtered = filtered.where((a) => a['category'] == category).toList();
    }
    
    if (priority != null && priority != 'All') {
      filtered = filtered.where((a) => a['priority'] == priority).toList();
    }
    
    if (status != null && status != 'All') {
      if (status == 'Published') {
        filtered = filtered.where((a) => a['isPublished'] == true).toList();
      } else if (status == 'Draft') {
        filtered = filtered.where((a) => a['isPublished'] == false).toList();
      }
    }
    
    if (authorRole != null && authorRole != 'All') {
      filtered = filtered.where((a) => a['authorRole'] == authorRole).toList();
    }
    
    return filtered;
  }

  // Mark announcement as read
  static Future<void> markAsRead(String id, String userId) async {
    try {
      // Update local cache
      final index = _localAnnouncements.indexWhere((a) => a['id'] == id);
      if (index != -1) {
        final readBy = _localAnnouncements[index]['readBy'] as List<String>? ?? [];
        if (!readBy.contains(userId)) {
          readBy.add(userId);
          _localAnnouncements[index]['readBy'] = readBy;
          _localAnnouncements[index]['isRead'] = true;
          _localAnnouncements[index]['isUnread'] = false;
        }
      }
      
      // Update in Firestore
      if (_firestore != null) {
        await _firestore!.collection(AppConfig.colAnnouncements).doc(id).update({
          'readBy': FieldValue.arrayUnion([userId]),
          'isRead': true,
          'isUnread': false,
        });
      }
      
      // Notify listeners
      _notifyListeners();
    } catch (e) {
      debugPrint('Failed to mark announcement as read: $e');
    }
  }

  // Get unread announcements count for a user
  static int getUnreadCount(String userId, String userRole) {
    final announcements = getAnnouncementsForRole(userRole);
    return announcements.where((a) {
      final readBy = a['readBy'] as List<String>? ?? [];
      return !readBy.contains(userId);
    }).length;
  }

  // Add listener for real-time updates
  static void addListener(Function callback) {
    _listeners.add(callback);
  }

  // Remove listener
  static void removeListener(Function callback) {
    _listeners.remove(callback);
  }

  // Notify all listeners
  static void _notifyListeners() {
    for (final listener in _listeners) {
      try {
        listener();
      } catch (e) {
        debugPrint('Error in announcement listener: $e');
      }
    }
  }

  // Initialize with mock data for development
  static void initializeMockData() {
    _localAnnouncements.clear();
    _localAnnouncements.addAll([
      {
        'id': '1',
        'title': 'Parent-Teacher Meeting',
        'content': 'Annual parent-teacher meeting scheduled for next Friday. All parents are requested to attend.',
        'category': 'General',
        'author': 'Principal',
        'authorRole': 'school_admin',
        'date': '2024-01-15',
        'time': '10:00 AM',
        'priority': 'High',
        'isPublished': true,
        'visibleTo': ['All Staff', 'Parents'],
        'createdAt': DateTime.now().subtract(const Duration(days: 2)),
        'updatedAt': DateTime.now().subtract(const Duration(days: 2)),
        'isRead': false,
        'isUnread': true,
        'readBy': [],
      },
      {
        'id': '2',
        'title': 'Sports Day Event',
        'content': 'Annual sports day will be held on Saturday. Students should wear their sports uniforms.',
        'category': 'Events',
        'author': 'Sports Department',
        'authorRole': 'teacher',
        'date': '2024-01-20',
        'time': '9:00 AM',
        'priority': 'Medium',
        'isPublished': true,
        'visibleTo': ['Students', 'Teachers'],
        'createdAt': DateTime.now().subtract(const Duration(days: 1)),
        'updatedAt': DateTime.now().subtract(const Duration(days: 1)),
        'isRead': false,
        'isUnread': true,
        'readBy': [],
      },
      {
        'id': '3',
        'title': 'Exam Schedule Update',
        'content': 'Mid-term examinations will begin from next week. Please check the updated schedule.',
        'category': 'Academic',
        'author': 'Academic Department',
        'authorRole': 'school_admin',
        'date': '2024-01-25',
        'time': '8:00 AM',
        'priority': 'High',
        'isPublished': false,
        'visibleTo': ['Teachers', 'Students'],
        'createdAt': DateTime.now(),
        'updatedAt': DateTime.now(),
        'isRead': false,
        'isUnread': false,
        'readBy': [],
      },
    ]);
    
    _notifyListeners();
  }

  // Refresh data from Firestore
  static Future<void> refresh() async {
    await _loadAnnouncementsFromFirestore();
  }
}
