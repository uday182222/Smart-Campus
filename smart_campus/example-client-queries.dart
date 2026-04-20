import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class FirestoreSecurityExamples {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  /// Example: Teacher querying only their students
  /// This query will only return students assigned to the current teacher
  /// due to Firestore security rules
  Future<List<DocumentSnapshot>> getTeacherStudents() async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Get user's custom claims to verify role
      final idTokenResult = await user.getIdTokenResult();
      final role = idTokenResult.claims?['role'] as String?;
      
      if (role != 'teacher') {
        throw Exception('Access denied: Teacher role required');
      }

      // Query students - Firestore rules will automatically filter
      // to only show students assigned to this teacher
      final querySnapshot = await _firestore
          .collection('students')
          .where('teacherId', isEqualTo: user.uid)
          .get();

      print('Found ${querySnapshot.docs.length} students for teacher');
      return querySnapshot.docs;
    } catch (e) {
      print('Error fetching teacher students: $e');
      rethrow;
    }
  }

  /// Example: Parent querying their child's data
  /// This query will only return data for the parent's own child
  Future<Map<String, dynamic>?> getChildData(String childId) async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Verify parent role
      final idTokenResult = await user.getIdTokenResult();
      final role = idTokenResult.claims?['role'] as String?;
      
      if (role != 'parent') {
        throw Exception('Access denied: Parent role required');
      }

      // Get child data - Firestore rules will verify parent relationship
      final doc = await _firestore.collection('students').doc(childId).get();
      
      if (!doc.exists) {
        throw Exception('Child not found or access denied');
      }

      return doc.data();
    } catch (e) {
      print('Error fetching child data: $e');
      rethrow;
    }
  }

  /// Example: Helper updating transport route status
  /// This query will only work if the helper is assigned to the route
  Future<void> updateRouteStatus(String routeId, Map<String, dynamic> updates) async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Verify helper role
      final idTokenResult = await user.getIdTokenResult();
      final role = idTokenResult.claims?['role'] as String?;
      
      if (role != 'helper') {
        throw Exception('Access denied: Helper role required');
      }

      // Update route - Firestore rules will verify assignment
      await _firestore.collection('routes').doc(routeId).update({
        ...updates,
        'lastUpdated': FieldValue.serverTimestamp(),
      });

      print('Route status updated successfully');
    } catch (e) {
      print('Error updating route status: $e');
      rethrow;
    }
  }

  /// Example: Principal managing their school's data
  /// This query will only return data for the principal's school
  Future<List<DocumentSnapshot>> getSchoolTeachers() async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Verify principal role
      final idTokenResult = await user.getIdTokenResult();
      final role = idTokenResult.claims?['role'] as String?;
      final schoolId = idTokenResult.claims?['schoolId'] as String?;
      
      if (role != 'principal') {
        throw Exception('Access denied: Principal role required');
      }

      if (schoolId == null) {
        throw Exception('School ID not found in user claims');
      }

      // Query teachers - Firestore rules will filter by school
      final querySnapshot = await _firestore
          .collection('teachers')
          .where('schoolId', isEqualTo: schoolId)
          .get();

      print('Found ${querySnapshot.docs.length} teachers in school');
      return querySnapshot.docs;
    } catch (e) {
      print('Error fetching school teachers: $e');
      rethrow;
    }
  }

  /// Example: Admin accessing all data
  /// This query will work for admin users only
  Future<List<DocumentSnapshot>> getAllSchools() async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Verify admin role
      final idTokenResult = await user.getIdTokenResult();
      final role = idTokenResult.claims?['role'] as String?;
      
      if (role != 'admin') {
        throw Exception('Access denied: Admin role required');
      }

      // Query all schools - only admin can access all schools
      final querySnapshot = await _firestore.collection('schools').get();

      print('Found ${querySnapshot.docs.length} schools');
      return querySnapshot.docs;
    } catch (e) {
      print('Error fetching all schools: $e');
      rethrow;
    }
  }

  /// Example: Teacher creating homework
  /// This query will only work if the teacher belongs to the school
  Future<void> createHomework(Map<String, dynamic> homeworkData) async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Verify teacher role
      final idTokenResult = await user.getIdTokenResult();
      final role = idTokenResult.claims?['role'] as String?;
      final schoolId = idTokenResult.claims?['schoolId'] as String?;
      
      if (role != 'teacher') {
        throw Exception('Access denied: Teacher role required');
      }

      if (schoolId == null) {
        throw Exception('School ID not found in user claims');
      }

      // Create homework - Firestore rules will verify school membership
      await _firestore.collection('homework').add({
        ...homeworkData,
        'schoolId': schoolId,
        'teacherId': user.uid,
        'createdAt': FieldValue.serverTimestamp(),
      });

      print('Homework created successfully');
    } catch (e) {
      print('Error creating homework: $e');
      rethrow;
    }
  }

  /// Example: Parent viewing announcements
  /// This query will only return announcements for the parent's school
  Future<List<DocumentSnapshot>> getSchoolAnnouncements() async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Verify parent role
      final idTokenResult = await user.getIdTokenResult();
      final role = idTokenResult.claims?['role'] as String?;
      final schoolId = idTokenResult.claims?['schoolId'] as String?;
      
      if (role != 'parent') {
        throw Exception('Access denied: Parent role required');
      }

      if (schoolId == null) {
        throw Exception('School ID not found in user claims');
      }

      // Query announcements - Firestore rules will filter by school
      final querySnapshot = await _firestore
          .collection('announcements')
          .where('schoolId', isEqualTo: schoolId)
          .orderBy('createdAt', descending: true)
          .get();

      print('Found ${querySnapshot.docs.length} announcements');
      return querySnapshot.docs;
    } catch (e) {
      print('Error fetching announcements: $e');
      rethrow;
    }
  }

  /// Example: Helper marking a stop as reached
  /// This query will only work if the helper is assigned to the route
  Future<void> markStopReached(String routeId, String stopId) async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Verify helper role
      final idTokenResult = await user.getIdTokenResult();
      final role = idTokenResult.claims?['role'] as String?;
      
      if (role != 'helper') {
        throw Exception('Access denied: Helper role required');
      }

      // Update stop status - Firestore rules will verify assignment
      await _firestore.collection('transportStops').doc(stopId).update({
        'status': 'reached',
        'arrivalTime': FieldValue.serverTimestamp(),
        'lastUpdated': FieldValue.serverTimestamp(),
      });

      print('Stop marked as reached successfully');
    } catch (e) {
      print('Error marking stop as reached: $e');
      rethrow;
    }
  }

  /// Example: Real-time listener for transport updates
  /// This will only receive updates for routes the helper is assigned to
  Stream<QuerySnapshot> listenToTransportUpdates() {
    final user = _auth.currentUser;
    if (user == null) {
      throw Exception('User not authenticated');
    }

    // Verify helper role
    return _auth.authStateChanges().asyncExpand((user) {
      if (user == null) return Stream.empty();
      
      return user.getIdTokenResult().then((idTokenResult) {
        final role = idTokenResult.claims?['role'] as String?;
        
        if (role != 'helper') {
          throw Exception('Access denied: Helper role required');
        }

        // Listen to transport stops - Firestore rules will filter by assignment
        return _firestore
            .collection('transportStops')
            .where('helperId', isEqualTo: user.uid)
            .snapshots();
      });
    });
  }

  /// Example: Batch operations with security
  /// This will only work if the user has permission for all operations
  Future<void> batchUpdateAttendance(List<String> studentIds, String status) async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Verify teacher role
      final idTokenResult = await user.getIdTokenResult();
      final role = idTokenResult.claims?['role'] as String?;
      
      if (role != 'teacher') {
        throw Exception('Access denied: Teacher role required');
      }

      // Start batch
      final batch = _firestore.batch();

      for (final studentId in studentIds) {
        final docRef = _firestore.collection('attendance').doc();
        batch.set(docRef, {
          'studentId': studentId,
          'status': status,
          'teacherId': user.uid,
          'date': FieldValue.serverTimestamp(),
          'createdAt': FieldValue.serverTimestamp(),
        });
      }

      // Commit batch - Firestore rules will verify each operation
      await batch.commit();

      print('Attendance updated for ${studentIds.length} students');
    } catch (e) {
      print('Error updating attendance: $e');
      rethrow;
    }
  }
}

/// Example usage in your Flutter app
class ExampleUsage {
  final FirestoreSecurityExamples _examples = FirestoreSecurityExamples();

  Future<void> demonstrateTeacherAccess() async {
    try {
      // This will only work if the current user is a teacher
      // and will only return students assigned to them
      final students = await _examples.getTeacherStudents();
      
      for (final student in students) {
        print('Student: ${student.data()?['name']}');
      }
    } catch (e) {
      print('Access denied or error: $e');
    }
  }

  Future<void> demonstrateParentAccess() async {
    try {
      // This will only work if the current user is a parent
      // and will only return their child's data
      final childData = await _examples.getChildData('child-uid-here');
      print('Child data: $childData');
    } catch (e) {
      print('Access denied or error: $e');
    }
  }

  Future<void> demonstrateHelperAccess() async {
    try {
      // This will only work if the current user is a helper
      // and is assigned to the route
      await _examples.markStopReached('route-uid-here', 'stop-uid-here');
    } catch (e) {
      print('Access denied or error: $e');
    }
  }
}
