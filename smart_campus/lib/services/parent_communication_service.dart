import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/parent_communication_model.dart';
import '../models/student_model.dart';
import 'auth_service.dart';

class ParentCommunicationService {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  static const String _collection = 'parent_communications';
  static const String _studentsCollection = 'students';
  static const String _classesCollection = 'classes';

  // Mock data for development
  static List<ParentCommunication> _mockCommunications = [];

  static void initializeMockData() {
    _mockCommunications = [
      ParentCommunication(
        id: 'comm_1',
        parentId: 'parent_1',
        parentName: 'John Smith',
        studentId: 'student_1',
        studentName: 'Emma Smith',
        classId: 'class_1',
        className: 'Grade 5A',
        schoolId: 'school_1',
        type: CommunicationType.absenceNotification,
        status: CommunicationStatus.pending,
        priority: CommunicationPriority.medium,
        subject: 'Absence - Medical Appointment',
        message: 'Emma has a doctor\'s appointment today and will not be able to attend school.',
        startDate: DateTime.now(),
        reason: 'Medical Appointment',
        additionalNotes: 'Please excuse her absence. She will return tomorrow.',
        createdAt: DateTime.now().subtract(const Duration(hours: 2)),
        updatedAt: DateTime.now().subtract(const Duration(hours: 2)),
      ),
      ParentCommunication(
        id: 'comm_2',
        parentId: 'parent_1',
        parentName: 'John Smith',
        studentId: 'student_1',
        studentName: 'Emma Smith',
        classId: 'class_1',
        className: 'Grade 5A',
        schoolId: 'school_1',
        type: CommunicationType.holidayRequest,
        status: CommunicationStatus.pending,
        priority: CommunicationPriority.high,
        subject: 'Holiday Request - Family Wedding',
        message: 'Requesting approval for Emma to attend a family wedding from March 15-18.',
        startDate: DateTime(2024, 3, 15),
        endDate: DateTime(2024, 3, 18),
        reason: 'Family Wedding',
        additionalNotes: 'This is an important family event. Emma will complete all assignments before leaving.',
        createdAt: DateTime.now().subtract(const Duration(days: 1)),
        updatedAt: DateTime.now().subtract(const Duration(days: 1)),
        teacherId: 'teacher_1',
        teacherName: 'Ms. Johnson',
      ),
      ParentCommunication(
        id: 'comm_3',
        parentId: 'parent_2',
        parentName: 'Sarah Wilson',
        studentId: 'student_2',
        studentName: 'James Wilson',
        classId: 'class_2',
        className: 'Grade 6B',
        schoolId: 'school_1',
        type: CommunicationType.absenceNotification,
        status: CommunicationStatus.approved,
        priority: CommunicationPriority.low,
        subject: 'Absence - Personal Reasons',
        message: 'James will not be attending school today due to personal reasons.',
        startDate: DateTime.now(),
        reason: 'Personal',
        createdAt: DateTime.now().subtract(const Duration(hours: 5)),
        updatedAt: DateTime.now().subtract(const Duration(hours: 3)),
        teacherId: 'teacher_2',
        teacherName: 'Mr. Brown',
        teacherApprovalDate: DateTime.now().subtract(const Duration(hours: 3)),
        teacherResponse: 'Noted. Please ensure James catches up on missed work.',
        isReadByTeacher: true,
        isReadByParent: true,
      ),
    ];
  }

  // Create a new parent communication
  static Future<String> createCommunication(ParentCommunication communication) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final docRef = _firestore.collection(_collection).doc();
      final communicationWithId = communication.copyWith(
        id: docRef.id,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await docRef.set(communicationWithId.toMap());
      return docRef.id;
    } catch (e) {
      print('Error creating communication: $e');
      // For development, add to mock data
      final id = 'comm_${DateTime.now().millisecondsSinceEpoch}';
      _mockCommunications.add(communication.copyWith(id: id));
      return id;
    }
  }

  // Get communications by parent ID
  static Future<List<ParentCommunication>> getCommunicationsByParent(String parentId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final querySnapshot = await _firestore
          .collection(_collection)
          .where('parentId', isEqualTo: parentId)
          .orderBy('createdAt', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => ParentCommunication.fromMap(doc.data()))
          .toList();
    } catch (e) {
      print('Error getting communications by parent: $e');
      // Return mock data for development
      return _mockCommunications
          .where((comm) => comm.parentId == parentId)
          .toList();
    }
  }

  // Get communications by teacher ID
  static Future<List<ParentCommunication>> getCommunicationsByTeacher(String teacherId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final querySnapshot = await _firestore
          .collection(_collection)
          .where('teacherId', isEqualTo: teacherId)
          .orderBy('createdAt', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => ParentCommunication.fromMap(doc.data()))
          .toList();
    } catch (e) {
      print('Error getting communications by teacher: $e');
      // Return mock data for development
      return _mockCommunications
          .where((comm) => comm.teacherId == teacherId)
          .toList();
    }
  }

  // Get communications by admin ID
  static Future<List<ParentCommunication>> getCommunicationsByAdmin(String adminId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final querySnapshot = await _firestore
          .collection(_collection)
          .where('adminId', isEqualTo: adminId)
          .orderBy('createdAt', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => ParentCommunication.fromMap(doc.data()))
          .toList();
    } catch (e) {
      print('Error getting communications by admin: $e');
      // Return mock data for development
      return _mockCommunications
          .where((comm) => comm.adminId == adminId)
          .toList();
    }
  }

  // Get communications by school ID
  static Future<List<ParentCommunication>> getCommunicationsBySchool(String schoolId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final querySnapshot = await _firestore
          .collection(_collection)
          .where('schoolId', isEqualTo: schoolId)
          .orderBy('createdAt', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => ParentCommunication.fromMap(doc.data()))
          .toList();
    } catch (e) {
      print('Error getting communications by school: $e');
      // Return mock data for development
      return _mockCommunications
          .where((comm) => comm.schoolId == schoolId)
          .toList();
    }
  }

  // Get pending communications for teacher
  static Future<List<ParentCommunication>> getPendingCommunicationsForTeacher(String teacherId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final querySnapshot = await _firestore
          .collection(_collection)
          .where('teacherId', isEqualTo: teacherId)
          .where('status', isEqualTo: CommunicationStatus.pending.name)
          .orderBy('createdAt', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => ParentCommunication.fromMap(doc.data()))
          .toList();
    } catch (e) {
      print('Error getting pending communications for teacher: $e');
      // Return mock data for development
      return _mockCommunications
          .where((comm) => comm.teacherId == teacherId && comm.status == CommunicationStatus.pending)
          .toList();
    }
  }

  // Get pending communications for admin
  static Future<List<ParentCommunication>> getPendingCommunicationsForAdmin(String adminId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final querySnapshot = await _firestore
          .collection(_collection)
          .where('adminId', isEqualTo: adminId)
          .where('status', isEqualTo: CommunicationStatus.pending.name)
          .orderBy('createdAt', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => ParentCommunication.fromMap(doc.data()))
          .toList();
    } catch (e) {
      print('Error getting pending communications for admin: $e');
      // Return mock data for development
      return _mockCommunications
          .where((comm) => comm.adminId == adminId && comm.status == CommunicationStatus.pending)
          .toList();
    }
  }

  // Update communication status (teacher approval)
  static Future<void> updateTeacherApproval(
    String communicationId,
    CommunicationStatus status,
    String response,
  ) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      await _firestore.collection(_collection).doc(communicationId).update({
        'status': status.name,
        'teacherResponse': response,
        'teacherApprovalDate': Timestamp.fromDate(DateTime.now()),
        'isReadByTeacher': true,
        'updatedAt': Timestamp.fromDate(DateTime.now()),
      });
    } catch (e) {
      print('Error updating teacher approval: $e');
      // Update mock data for development
      final index = _mockCommunications.indexWhere((comm) => comm.id == communicationId);
      if (index != -1) {
        _mockCommunications[index] = _mockCommunications[index].copyWith(
          status: status,
          teacherResponse: response,
          teacherApprovalDate: DateTime.now(),
          isReadByTeacher: true,
          updatedAt: DateTime.now(),
        );
      }
    }
  }

  // Update communication status (admin approval)
  static Future<void> updateAdminApproval(
    String communicationId,
    CommunicationStatus status,
    String response,
  ) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      await _firestore.collection(_collection).doc(communicationId).update({
        'status': status.name,
        'adminResponse': response,
        'adminApprovalDate': Timestamp.fromDate(DateTime.now()),
        'isReadByAdmin': true,
        'updatedAt': Timestamp.fromDate(DateTime.now()),
      });
    } catch (e) {
      print('Error updating admin approval: $e');
      // Update mock data for development
      final index = _mockCommunications.indexWhere((comm) => comm.id == communicationId);
      if (index != -1) {
        _mockCommunications[index] = _mockCommunications[index].copyWith(
          status: status,
          adminResponse: response,
          adminApprovalDate: DateTime.now(),
          isReadByAdmin: true,
          updatedAt: DateTime.now(),
        );
      }
    }
  }

  // Mark communication as read
  static Future<void> markAsRead(String communicationId, String userType) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      Map<String, dynamic> updateData = {
        'updatedAt': Timestamp.fromDate(DateTime.now()),
      };

      switch (userType) {
        case 'teacher':
          updateData['isReadByTeacher'] = true;
          break;
        case 'admin':
          updateData['isReadByAdmin'] = true;
          break;
        case 'parent':
          updateData['isReadByParent'] = true;
          break;
      }

      await _firestore.collection(_collection).doc(communicationId).update(updateData);
    } catch (e) {
      print('Error marking communication as read: $e');
      // Update mock data for development
      final index = _mockCommunications.indexWhere((comm) => comm.id == communicationId);
      if (index != -1) {
        switch (userType) {
          case 'teacher':
            _mockCommunications[index] = _mockCommunications[index].copyWith(
              isReadByTeacher: true,
              updatedAt: DateTime.now(),
            );
            break;
          case 'admin':
            _mockCommunications[index] = _mockCommunications[index].copyWith(
              isReadByAdmin: true,
              updatedAt: DateTime.now(),
            );
            break;
          case 'parent':
            _mockCommunications[index] = _mockCommunications[index].copyWith(
              isReadByParent: true,
              updatedAt: DateTime.now(),
            );
            break;
        }
      }
    }
  }

  // Get students for a parent
  static Future<List<Student>> getStudentsForParent(String parentId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final querySnapshot = await _firestore
          .collection(_studentsCollection)
          .where('parentId', isEqualTo: parentId)
          .get();

      return querySnapshot.docs
          .map((doc) => Student.fromMap(doc.data()))
          .toList();
    } catch (e) {
      print('Error getting students for parent: $e');
      // Return mock data for development
      return [
        Student(
          id: 'student_1',
          name: 'Emma Smith',
          email: 'emma.smith@school.com',
          className: 'Grade 5A',
          rollNo: 'ST001',
          phone: '+1234567890',
          address: '123 Main St, Downtown',
          parentName: 'John Smith',
          parentPhone: '+0987654321',
          dateOfBirth: DateTime(2015, 6, 15),
          gender: 'Female',
          bloodGroup: 'O+',
          admissionDate: '2020-01-01',
          // emergencyContact: 'John Smith - +1234567890', // Not in Student model
          // medicalInfo: 'No known allergies', // Not in Student model
          // createdAt: DateTime.now(), // Not in Student model
          // updatedAt: DateTime.now(), // Not in Student model
        ),
        Student(
          id: 'student_2',
          name: 'James Wilson',
          email: 'james.wilson@school.com',
          className: 'Grade 6B',
          rollNo: 'ST002',
          phone: '+1234567891',
          address: '456 Oak St, Downtown',
          parentName: 'Sarah Wilson',
          parentPhone: '+0987654322',
          dateOfBirth: DateTime(2014, 3, 20),
          gender: 'Male',
          bloodGroup: 'A+',
          admissionDate: '2020-01-01',
          // emergencyContact: 'Sarah Wilson - +1234567891', // Not in Student model
          // medicalInfo: 'Asthma', // Not in Student model
          // createdAt: DateTime.now(), // Not in Student model
          // updatedAt: DateTime.now(), // Not in Student model
        ),
      ];
    }
  }

  // Get class information
  static Future<Map<String, dynamic>?> getClassInfo(String classId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final doc = await _firestore.collection(_classesCollection).doc(classId).get();
      return doc.data();
    } catch (e) {
      print('Error getting class info: $e');
      // Return mock data for development
      return {
        'id': classId,
        'name': classId == 'class_1' ? 'Grade 5A' : 'Grade 6B',
        'teacherId': classId == 'class_1' ? 'teacher_1' : 'teacher_2',
        'teacherName': classId == 'class_1' ? 'Ms. Johnson' : 'Mr. Brown',
      };
    }
  }

  // Get unread count for user
  static Future<int> getUnreadCount(String userId, String userType) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      Query query;
      
      switch (userType) {
        case 'teacher':
          query = _firestore
              .collection(_collection)
              .where('teacherId', isEqualTo: userId)
              .where('isReadByTeacher', isEqualTo: false);
          break;
        case 'admin':
          query = _firestore
              .collection(_collection)
              .where('adminId', isEqualTo: userId)
              .where('isReadByAdmin', isEqualTo: false);
          break;
        case 'parent':
          query = _firestore
              .collection(_collection)
              .where('parentId', isEqualTo: userId)
              .where('isReadByParent', isEqualTo: false);
          break;
        default:
          return 0;
      }

      final snapshot = await query.get();
      return snapshot.docs.length;
    } catch (e) {
      print('Error getting unread count: $e');
      // Return mock count for development
      switch (userType) {
        case 'teacher':
          return _mockCommunications
              .where((comm) => comm.teacherId == userId && !comm.isReadByTeacher)
              .length;
        case 'admin':
          return _mockCommunications
              .where((comm) => comm.adminId == userId && !comm.isReadByAdmin)
              .length;
        case 'parent':
          return _mockCommunications
              .where((comm) => comm.parentId == userId && !comm.isReadByParent)
              .length;
        default:
          return 0;
      }
    }
  }

  // Delete communication
  static Future<void> deleteCommunication(String communicationId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      await _firestore.collection(_collection).doc(communicationId).delete();
    } catch (e) {
      print('Error deleting communication: $e');
      // Remove from mock data for development
      _mockCommunications.removeWhere((comm) => comm.id == communicationId);
    }
  }
}
