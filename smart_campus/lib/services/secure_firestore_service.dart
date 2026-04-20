import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

import '../core/constants/app_constants.dart';

/// Secure Firestore service that enforces RBAC through Firestore security rules
class SecureFirestoreService {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  static final FirebaseAuth _auth = FirebaseAuth.instance;

  /// Get current user's role from custom claims
  static Future<String?> getCurrentUserRole() async {
    try {
      final user = _auth.currentUser;
      if (user == null) return null;

      final idTokenResult = await user.getIdTokenResult();
      return idTokenResult.claims?['role'] as String?;
    } catch (e) {
      debugPrint('Error getting user role: $e');
      return null;
    }
  }

  /// Get current user's school ID from custom claims
  static Future<String?> getCurrentUserSchoolId() async {
    try {
      final user = _auth.currentUser;
      if (user == null) return null;

      final idTokenResult = await user.getIdTokenResult();
      return idTokenResult.claims?['schoolId'] as String?;
    } catch (e) {
      debugPrint('Error getting user school ID: $e');
      return null;
    }
  }

  /// Check if current user has specific role
  static Future<bool> hasRole(String role) async {
    final userRole = await getCurrentUserRole();
    return userRole == role;
  }

  /// Check if current user has any of the specified roles
  static Future<bool> hasAnyRole(List<String> roles) async {
    final userRole = await getCurrentUserRole();
    return userRole != null && roles.contains(userRole);
  }

  /// Force refresh user token to get updated custom claims
  static Future<void> refreshUserToken() async {
    try {
      final user = _auth.currentUser;
      if (user != null) {
        await user.getIdToken(true); // Force refresh
      }
    } catch (e) {
      debugPrint('Error refreshing user token: $e');
    }
  }

  // ==================== STUDENT OPERATIONS ====================

  /// Get students for current teacher (automatically filtered by security rules)
  static Future<List<DocumentSnapshot>> getTeacherStudents() async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final role = await getCurrentUserRole();
      if (role != 'teacher') {
        throw Exception('Access denied: Teacher role required');
      }

      // Query students - Firestore rules will automatically filter
      // to only show students assigned to this teacher
      final querySnapshot = await _firestore
          .collection(AppConfig.colStudents)
          .where('teacherId', isEqualTo: user.uid)
          .get();

      return querySnapshot.docs;
    } catch (e) {
      debugPrint('Error fetching teacher students: $e');
      rethrow;
    }
  }

  /// Get student data for parent (automatically filtered by security rules)
  static Future<DocumentSnapshot?> getChildData(String childId) async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final role = await getCurrentUserRole();
      if (role != 'parent') {
        throw Exception('Access denied: Parent role required');
      }

      // Get child data - Firestore rules will verify parent relationship
      final doc = await _firestore.collection(AppConfig.colStudents).doc(childId).get();
      
      if (!doc.exists) {
        throw Exception('Child not found or access denied');
      }

      return doc;
    } catch (e) {
      debugPrint('Error fetching child data: $e');
      rethrow;
    }
  }

  /// Create new student (admin/principal only)
  static Future<DocumentReference> createStudent(Map<String, dynamic> studentData) async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final role = await getCurrentUserRole();
      if (!['admin', 'principal'].contains(role)) {
        throw Exception('Access denied: Admin or Principal role required');
      }

      // Add metadata
      final data = {
        ...studentData,
        'createdAt': FieldValue.serverTimestamp(),
        'createdBy': user.uid,
      };

      return await _firestore.collection(AppConfig.colStudents).add(data);
    } catch (e) {
      debugPrint('Error creating student: $e');
      rethrow;
    }
  }

  // ==================== HOMEWORK OPERATIONS ====================

  /// Get homework for current user (automatically filtered by security rules)
  static Future<List<DocumentSnapshot>> getHomework() async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final _ = await getCurrentUserRole();
      final schoolId = await getCurrentUserSchoolId();

      if (schoolId == null) {
        throw Exception('School ID not found in user claims');
      }

      // Query homework - Firestore rules will filter by school and role
      final querySnapshot = await _firestore
          .collection(AppConfig.colHomework)
          .where('schoolId', isEqualTo: schoolId)
          .orderBy('createdAt', descending: true)
          .get();

      return querySnapshot.docs;
    } catch (e) {
      debugPrint('Error fetching homework: $e');
      rethrow;
    }
  }

  /// Create homework (teacher/admin/principal only)
  static Future<DocumentReference> createHomework(Map<String, dynamic> homeworkData) async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final role = await getCurrentUserRole();
      final schoolId = await getCurrentUserSchoolId();

      if (!['admin', 'principal', 'teacher'].contains(role)) {
        throw Exception('Access denied: Teacher, Principal, or Admin role required');
      }

      if (schoolId == null) {
        throw Exception('School ID not found in user claims');
      }

      // Add metadata
      final data = {
        ...homeworkData,
        'schoolId': schoolId,
        'createdBy': user.uid,
        'createdAt': FieldValue.serverTimestamp(),
      };

      return await _firestore.collection(AppConfig.colHomework).add(data);
    } catch (e) {
      debugPrint('Error creating homework: $e');
      rethrow;
    }
  }

  // ==================== ATTENDANCE OPERATIONS ====================

  /// Get attendance records for current user (automatically filtered by security rules)
  static Future<List<DocumentSnapshot>> getAttendance() async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final _ = await getCurrentUserRole();
      final schoolId = await getCurrentUserSchoolId();

      if (schoolId == null) {
        throw Exception('School ID not found in user claims');
      }

      // Query attendance - Firestore rules will filter by school and role
      final querySnapshot = await _firestore
          .collection(AppConfig.colAttendance)
          .where('schoolId', isEqualTo: schoolId)
          .orderBy('date', descending: true)
          .get();

      return querySnapshot.docs;
    } catch (e) {
      debugPrint('Error fetching attendance: $e');
      rethrow;
    }
  }

  /// Mark attendance (teacher/admin/principal only)
  static Future<void> markAttendance(String studentId, String status, String? notes) async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final role = await getCurrentUserRole();
      if (!['admin', 'principal', 'teacher'].contains(role)) {
        throw Exception('Access denied: Teacher, Principal, or Admin role required');
      }

      // Create attendance record - Firestore rules will verify permissions
      await _firestore.collection(AppConfig.colAttendance).add({
        'studentId': studentId,
        'status': status,
        'notes': notes,
        'markedBy': user.uid,
        'date': FieldValue.serverTimestamp(),
        'createdAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      debugPrint('Error marking attendance: $e');
      rethrow;
    }
  }

  // ==================== TRANSPORT OPERATIONS ====================

  /// Get routes for current helper (automatically filtered by security rules)
  static Future<List<DocumentSnapshot>> getHelperRoutes() async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final role = await getCurrentUserRole();
      if (role != 'helper') {
        throw Exception('Access denied: Helper role required');
      }

      // Query routes - Firestore rules will filter by assignment
      final querySnapshot = await _firestore
          .collection(AppConfig.colRoutes)
          .where('helperId', isEqualTo: user.uid)
          .get();

      return querySnapshot.docs;
    } catch (e) {
      debugPrint('Error fetching helper routes: $e');
      rethrow;
    }
  }

  /// Update route status (helper only)
  static Future<void> updateRouteStatus(String routeId, Map<String, dynamic> updates) async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final role = await getCurrentUserRole();
      if (role != 'helper') {
        throw Exception('Access denied: Helper role required');
      }

      // Update route - Firestore rules will verify assignment
      await _firestore.collection(AppConfig.colRoutes).doc(routeId).update({
        ...updates,
        'lastUpdated': FieldValue.serverTimestamp(),
        'updatedBy': user.uid,
      });
    } catch (e) {
      debugPrint('Error updating route status: $e');
      rethrow;
    }
  }

  /// Mark stop as reached (helper only)
  static Future<void> markStopReached(String stopId) async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final role = await getCurrentUserRole();
      if (role != 'helper') {
        throw Exception('Access denied: Helper role required');
      }

      // Update stop status - Firestore rules will verify assignment
      await _firestore.collection('transportStops').doc(stopId).update({
        'status': 'reached',
        'arrivalTime': FieldValue.serverTimestamp(),
        'lastUpdated': FieldValue.serverTimestamp(),
        'updatedBy': user.uid,
      });
    } catch (e) {
      debugPrint('Error marking stop as reached: $e');
      rethrow;
    }
  }

  // ==================== ANNOUNCEMENTS ====================

  /// Get announcements for current user (automatically filtered by security rules)
  static Future<List<DocumentSnapshot>> getAnnouncements() async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final _ = await getCurrentUserRole();
      final schoolId = await getCurrentUserSchoolId();

      if (schoolId == null) {
        throw Exception('School ID not found in user claims');
      }

      // Query announcements - Firestore rules will filter by school
      final querySnapshot = await _firestore
          .collection(AppConfig.colAnnouncements)
          .where('schoolId', isEqualTo: schoolId)
          .orderBy('createdAt', descending: true)
          .get();

      return querySnapshot.docs;
    } catch (e) {
      debugPrint('Error fetching announcements: $e');
      rethrow;
    }
  }

  /// Create announcement (teacher/admin/principal only)
  static Future<DocumentReference> createAnnouncement(Map<String, dynamic> announcementData) async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final role = await getCurrentUserRole();
      final schoolId = await getCurrentUserSchoolId();

      if (!['admin', 'principal', 'teacher'].contains(role)) {
        throw Exception('Access denied: Teacher, Principal, or Admin role required');
      }

      if (schoolId == null) {
        throw Exception('School ID not found in user claims');
      }

      // Add metadata
      final data = {
        ...announcementData,
        'schoolId': schoolId,
        'createdBy': user.uid,
        'createdAt': FieldValue.serverTimestamp(),
      };

      return await _firestore.collection(AppConfig.colAnnouncements).add(data);
    } catch (e) {
      debugPrint('Error creating announcement: $e');
      rethrow;
    }
  }

  // ==================== REAL-TIME LISTENERS ====================

  /// Listen to real-time updates for transport stops (helper only)
  static Stream<QuerySnapshot<Map<String, dynamic>>> listenToTransportUpdates() {
    final user = _auth.currentUser;
    if (user == null) {
      throw Exception('User not authenticated');
    }

    return _auth.authStateChanges().asyncExpand((user) {
      if (user == null) return Stream<QuerySnapshot<Map<String, dynamic>>>.empty();
      return Stream.fromFuture(
        user.getIdTokenResult().then((idTokenResult) {
          final _role = idTokenResult.claims?['role'] as String?;
          if (_role != 'helper') {
            throw Exception('Access denied: Helper role required');
          }
          return _firestore
              .collection('transportStops')
              .where('helperId', isEqualTo: user.uid)
              .snapshots();
        }),
      ).asyncExpand((s) => s);
    });
  }

  /// Listen to real-time updates for announcements
  static Stream<QuerySnapshot<Map<String, dynamic>>> listenToAnnouncements() {
    return _auth.authStateChanges().asyncExpand((user) {
      if (user == null) return Stream<QuerySnapshot<Map<String, dynamic>>>.empty();
      return Stream.fromFuture(
        user.getIdTokenResult().then((idTokenResult) {
          final schoolId = idTokenResult.claims?['schoolId'] as String?;
          if (schoolId == null) {
            throw Exception('School ID not found in user claims');
          }
          return _firestore
              .collection(AppConfig.colAnnouncements)
              .where('schoolId', isEqualTo: schoolId)
              .orderBy('createdAt', descending: true)
              .snapshots();
        }),
      ).asyncExpand((s) => s);
    });
  }

  // ==================== BATCH OPERATIONS ====================

  /// Batch update attendance for multiple students
  static Future<void> batchUpdateAttendance(List<String> studentIds, String status) async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final role = await getCurrentUserRole();
      if (!['admin', 'principal', 'teacher'].contains(role)) {
        throw Exception('Access denied: Teacher, Principal, or Admin role required');
      }

      // Start batch
      final batch = _firestore.batch();

      for (final studentId in studentIds) {
        final docRef = _firestore.collection(AppConfig.colAttendance).doc();
        batch.set(docRef, {
          'studentId': studentId,
          'status': status,
          'markedBy': user.uid,
          'date': FieldValue.serverTimestamp(),
          'createdAt': FieldValue.serverTimestamp(),
        });
      }

      // Commit batch - Firestore rules will verify each operation
      await batch.commit();
    } catch (e) {
      debugPrint('Error batch updating attendance: $e');
      rethrow;
    }
  }

  // ==================== UTILITY METHODS ====================

  /// Check if current user can access a specific resource
  static Future<bool> canAccessResource(String collection, String? docId) async {
    try {
      final user = _auth.currentUser;
      if (user == null) return false;

      final role = await getCurrentUserRole();
      if (role == null) return false;

      // Basic role-based access check
      switch (collection) {
        case 'schools':
          return ['admin', 'principal'].contains(role);
        case 'students':
          return ['admin', 'principal', 'teacher', 'parent'].contains(role);
        case 'teachers':
          return ['admin', 'principal', 'teacher'].contains(role);
        case 'parents':
          return ['admin', 'principal', 'parent'].contains(role);
        case 'routes':
          return ['admin', 'principal', 'helper'].contains(role);
        case 'announcements':
          return ['admin', 'principal', 'teacher', 'parent'].contains(role);
        case 'homework':
          return ['admin', 'principal', 'teacher', 'parent'].contains(role);
        case 'attendance':
          return ['admin', 'principal', 'teacher', 'parent'].contains(role);
        default:
          return false;
      }
    } catch (e) {
      debugPrint('Error checking resource access: $e');
      return false;
    }
  }

  /// Get user's accessible collections based on role
  static Future<List<String>> getAccessibleCollections() async {
    try {
      final role = await getCurrentUserRole();
      if (role == null) return [];

      switch (role) {
        case 'admin':
          return ['schools', 'students', 'teachers', 'parents', 'routes', 'announcements', 'homework', 'attendance'];
        case 'principal':
          return ['students', 'teachers', 'parents', 'routes', 'announcements', 'homework', 'attendance'];
        case 'teacher':
          return ['students', 'announcements', 'homework', 'attendance'];
        case 'parent':
          return ['students', 'announcements', 'homework', 'attendance'];
        case 'helper':
          return ['routes'];
        default:
          return [];
      }
    } catch (e) {
      debugPrint('Error getting accessible collections: $e');
      return [];
    }
  }
}
