import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/afterschool_model.dart';
import 'auth_service.dart';

class AfterSchoolService {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  static const String _activitiesCollection = 'after_school_activities';
  static const String _registrationsCollection = 'activity_registrations';

  // Mock data for development
  static List<AfterSchoolActivity> _mockActivities = [];
  static List<ActivityRegistration> _mockRegistrations = [];

  static void initializeMockData() {
    _mockActivities = [
      AfterSchoolActivity(
        id: 'activity_1',
        schoolId: 'school_1',
        name: 'Basketball Club',
        description: 'Learn basketball skills and team play',
        type: ActivityType.sports,
        instructorName: 'Coach Johnson',
        instructorId: 'instructor_1',
        maxParticipants: 20,
        currentParticipants: 15,
        participantIds: ['student_1', 'student_2', 'student_3'],
        participantNames: ['Emma Smith', 'James Wilson', 'Sophie Brown'],
        fee: 500.0,
        schedule: 'Monday, Wednesday 4:00 PM - 5:30 PM',
        location: 'Sports Hall',
        status: ActivityStatus.active,
        startDate: DateTime.now().add(const Duration(days: 7)),
        endDate: DateTime.now().add(const Duration(days: 90)),
        requirements: 'Sports attire, water bottle',
        materials: 'Basketball provided',
        createdBy: 'admin_1',
        createdByName: 'School Admin',
        createdAt: DateTime.now().subtract(const Duration(days: 30)),
        updatedAt: DateTime.now().subtract(const Duration(days: 5)),
      ),
      AfterSchoolActivity(
        id: 'activity_2',
        schoolId: 'school_1',
        name: 'Art & Craft Workshop',
        description: 'Creative arts and crafts activities',
        type: ActivityType.arts,
        instructorName: 'Ms. Davis',
        instructorId: 'instructor_2',
        maxParticipants: 15,
        currentParticipants: 12,
        participantIds: ['student_4', 'student_5'],
        participantNames: ['Lily Johnson', 'Noah Taylor'],
        fee: 300.0,
        schedule: 'Tuesday, Thursday 3:30 PM - 5:00 PM',
        location: 'Art Room',
        status: ActivityStatus.active,
        startDate: DateTime.now().add(const Duration(days: 5)),
        endDate: DateTime.now().add(const Duration(days: 75)),
        requirements: 'Apron, creativity',
        materials: 'All materials provided',
        createdBy: 'admin_1',
        createdByName: 'School Admin',
        createdAt: DateTime.now().subtract(const Duration(days: 25)),
        updatedAt: DateTime.now().subtract(const Duration(days: 3)),
      ),
      AfterSchoolActivity(
        id: 'activity_3',
        schoolId: 'school_1',
        name: 'Robotics Club',
        description: 'Learn programming and robotics',
        type: ActivityType.technology,
        instructorName: 'Mr. Wilson',
        instructorId: 'instructor_3',
        maxParticipants: 12,
        currentParticipants: 10,
        participantIds: ['student_6', 'student_7'],
        participantNames: ['Alex Chen', 'Maya Patel'],
        fee: 800.0,
        schedule: 'Friday 4:00 PM - 6:00 PM',
        location: 'Computer Lab',
        status: ActivityStatus.active,
        startDate: DateTime.now().add(const Duration(days: 10)),
        endDate: DateTime.now().add(const Duration(days: 120)),
        requirements: 'Basic computer skills',
        materials: 'Robotics kit provided',
        createdBy: 'admin_1',
        createdByName: 'School Admin',
        createdAt: DateTime.now().subtract(const Duration(days: 20)),
        updatedAt: DateTime.now().subtract(const Duration(days: 1)),
      ),
    ];

    _mockRegistrations = [
      ActivityRegistration(
        id: 'reg_1',
        activityId: 'activity_1',
        studentId: 'student_1',
        studentName: 'Emma Smith',
        parentId: 'parent_1',
        parentName: 'John Smith',
        schoolId: 'school_1',
        registrationDate: DateTime.now().subtract(const Duration(days: 15)),
        isApproved: true,
        approvedBy: 'admin_1',
        approvedByName: 'School Admin',
        approvedAt: DateTime.now().subtract(const Duration(days: 14)),
        isActive: true,
      ),
      ActivityRegistration(
        id: 'reg_2',
        activityId: 'activity_2',
        studentId: 'student_4',
        studentName: 'Lily Johnson',
        parentId: 'parent_2',
        parentName: 'Sarah Johnson',
        schoolId: 'school_1',
        registrationDate: DateTime.now().subtract(const Duration(days: 10)),
        isApproved: true,
        approvedBy: 'admin_1',
        approvedByName: 'School Admin',
        approvedAt: DateTime.now().subtract(const Duration(days: 9)),
        isActive: true,
      ),
    ];
  }

  // Get all activities for a school
  static Future<List<AfterSchoolActivity>> getActivitiesBySchool(String schoolId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final querySnapshot = await _firestore
          .collection(_activitiesCollection)
          .where('schoolId', isEqualTo: schoolId)
          .where('status', isEqualTo: ActivityStatus.active.name)
          .orderBy('name')
          .get();

      return querySnapshot.docs
          .map((doc) => AfterSchoolActivity.fromMap(doc.data()))
          .toList();
    } catch (e) {
      print('Error getting activities by school: $e');
      // Return mock data for development
      return _mockActivities
          .where((activity) => activity.schoolId == schoolId && activity.isActive)
          .toList();
    }
  }

  // Create new activity (Admin only)
  static Future<String> createActivity(AfterSchoolActivity activity) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final docRef = _firestore.collection(_activitiesCollection).doc();
      final activityWithId = activity.copyWith(
        id: docRef.id,
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName ?? 'Unknown',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await docRef.set(activityWithId.toMap());
      return docRef.id;
    } catch (e) {
      print('Error creating activity: $e');
      // For development, add to mock data
      final id = 'activity_${DateTime.now().millisecondsSinceEpoch}';
      _mockActivities.add(activity.copyWith(id: id));
      return id;
    }
  }

  // Register student for activity
  static Future<String> registerStudent(String activityId, String studentId, String studentName, String parentId, String parentName) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final docRef = _firestore.collection(_registrationsCollection).doc();
      final registration = ActivityRegistration(
        id: docRef.id,
        activityId: activityId,
        studentId: studentId,
        studentName: studentName,
        parentId: parentId,
        parentName: parentName,
        schoolId: 'school_1', // Mock school ID
        registrationDate: DateTime.now(),
        isApproved: false,
        isActive: true,
      );

      await docRef.set(registration.toMap());
      return docRef.id;
    } catch (e) {
      print('Error registering student: $e');
      // For development, add to mock data
      final id = 'reg_${DateTime.now().millisecondsSinceEpoch}';
      _mockRegistrations.add(ActivityRegistration(
        id: id,
        activityId: activityId,
        studentId: studentId,
        studentName: studentName,
        parentId: parentId,
        parentName: parentName,
        schoolId: 'school_1',
        registrationDate: DateTime.now(),
        isApproved: false,
        isActive: true,
      ));
      return id;
    }
  }

  // Get registrations for a parent
  static Future<List<ActivityRegistration>> getRegistrationsByParent(String parentId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final querySnapshot = await _firestore
          .collection(_registrationsCollection)
          .where('parentId', isEqualTo: parentId)
          .where('isActive', isEqualTo: true)
          .orderBy('registrationDate', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => ActivityRegistration.fromMap(doc.data()))
          .toList();
    } catch (e) {
      print('Error getting registrations by parent: $e');
      // Return mock data for development
      return _mockRegistrations
          .where((reg) => reg.parentId == parentId && reg.isActive)
          .toList();
    }
  }

  // Get all registrations for admin approval
  static Future<List<ActivityRegistration>> getPendingRegistrations(String schoolId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final querySnapshot = await _firestore
          .collection(_registrationsCollection)
          .where('schoolId', isEqualTo: schoolId)
          .where('isApproved', isEqualTo: false)
          .where('isActive', isEqualTo: true)
          .orderBy('registrationDate', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => ActivityRegistration.fromMap(doc.data()))
          .toList();
    } catch (e) {
      print('Error getting pending registrations: $e');
      // Return mock data for development
      return _mockRegistrations
          .where((reg) => reg.schoolId == schoolId && !reg.isApproved && reg.isActive)
          .toList();
    }
  }

  // Approve registration
  static Future<void> approveRegistration(String registrationId, String approvedBy, String approvedByName, {String? notes}) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      await _firestore.collection(_registrationsCollection).doc(registrationId).update({
        'isApproved': true,
        'approvedBy': approvedBy,
        'approvedByName': approvedByName,
        'approvedAt': Timestamp.fromDate(DateTime.now()),
        'notes': notes,
      });

      // Update activity participant count
      final registration = _mockRegistrations.firstWhere((reg) => reg.id == registrationId);
      final activityIndex = _mockActivities.indexWhere((activity) => activity.id == registration.activityId);
      if (activityIndex != -1) {
        _mockActivities[activityIndex] = _mockActivities[activityIndex].copyWith(
          currentParticipants: _mockActivities[activityIndex].currentParticipants + 1,
          participantIds: [..._mockActivities[activityIndex].participantIds, registration.studentId],
          participantNames: [..._mockActivities[activityIndex].participantNames, registration.studentName],
        );
      }
    } catch (e) {
      print('Error approving registration: $e');
      // Update mock data for development
      final index = _mockRegistrations.indexWhere((reg) => reg.id == registrationId);
      if (index != -1) {
        _mockRegistrations[index] = _mockRegistrations[index].copyWith(
          isApproved: true,
          approvedBy: approvedBy,
          approvedByName: approvedByName,
          approvedAt: DateTime.now(),
          notes: notes,
        );
      }
    }
  }

  // Get activity statistics
  static Future<Map<String, dynamic>> getActivityStatistics(String schoolId) async {
    try {
      final activities = await getActivitiesBySchool(schoolId);
      final registrations = _mockRegistrations.where((reg) => reg.schoolId == schoolId).toList();
      
      int totalActivities = activities.length;
      int totalRegistrations = registrations.length;
      int pendingRegistrations = registrations.where((reg) => !reg.isApproved).length;
      int approvedRegistrations = registrations.where((reg) => reg.isApproved).length;
      
      double totalRevenue = activities.fold(0.0, (sum, activity) => 
          sum + (activity.fee * activity.currentParticipants));
      
      Map<ActivityType, int> typeCount = {};
      for (final type in ActivityType.values) {
        typeCount[type] = activities.where((activity) => activity.type == type).length;
      }
      
      return {
        'totalActivities': totalActivities,
        'totalRegistrations': totalRegistrations,
        'pendingRegistrations': pendingRegistrations,
        'approvedRegistrations': approvedRegistrations,
        'totalRevenue': totalRevenue,
        'typeCount': typeCount,
      };
    } catch (e) {
      print('Error getting activity statistics: $e');
      return {
        'totalActivities': 0,
        'totalRegistrations': 0,
        'pendingRegistrations': 0,
        'approvedRegistrations': 0,
        'totalRevenue': 0.0,
        'typeCount': <ActivityType, int>{},
      };
    }
  }
}
