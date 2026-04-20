import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import '../models/appointment_model.dart';
import 'auth_service.dart';

class AppointmentService {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  static const String _appointmentsCollection = 'appointments';

  // Mock data for development
  static List<Appointment> _mockAppointments = [];

  static void initializeMockData() {
    _mockAppointments = [
      Appointment(
        id: 'appointment_1',
        schoolId: 'school_1',
        title: 'Parent-Teacher Meeting',
        description: 'Discuss student progress and academic performance',
        type: AppointmentType.parentTeacher,
        requesterId: 'parent_1',
        requesterName: 'John Smith',
        requesterRole: 'parent',
        requestedWithId: 'teacher_1',
        requestedWithName: 'Mrs. Johnson',
        requestedWithRole: 'teacher',
        studentId: 'student_1',
        studentName: 'Emma Smith',
        scheduledDate: DateTime.now().add(const Duration(days: 3)),
        scheduledTime: const TimeOfDay(hour: 14, minute: 30),
        durationMinutes: 30,
        status: AppointmentStatus.confirmed,
        location: 'Room 101',
        notes: 'Please bring student\'s recent test results',
        createdAt: DateTime.now().subtract(const Duration(days: 5)),
        updatedAt: DateTime.now().subtract(const Duration(days: 1)),
      ),
      Appointment(
        id: 'appointment_2',
        schoolId: 'school_1',
        title: 'Student Counseling Session',
        description: 'Academic guidance and career counseling',
        type: AppointmentType.studentCounselor,
        requesterId: 'teacher_1',
        requesterName: 'Mrs. Johnson',
        requesterRole: 'teacher',
        requestedWithId: 'counselor_1',
        requestedWithName: 'Mr. Davis',
        requestedWithRole: 'counselor',
        studentId: 'student_2',
        studentName: 'James Wilson',
        scheduledDate: DateTime.now().add(const Duration(days: 7)),
        scheduledTime: const TimeOfDay(hour: 10, minute: 0),
        durationMinutes: 45,
        status: AppointmentStatus.pending,
        location: 'Counseling Office',
        createdAt: DateTime.now().subtract(const Duration(days: 3)),
        updatedAt: DateTime.now().subtract(const Duration(days: 3)),
      ),
      Appointment(
        id: 'appointment_3',
        schoolId: 'school_1',
        title: 'Administrative Meeting',
        description: 'Discuss school policies and upcoming events',
        type: AppointmentType.teacherAdmin,
        requesterId: 'teacher_2',
        requesterName: 'Mr. Brown',
        requesterRole: 'teacher',
        requestedWithId: 'admin_1',
        requestedWithName: 'School Administrator',
        requestedWithRole: 'admin',
        scheduledDate: DateTime.now().subtract(const Duration(days: 1)),
        scheduledTime: const TimeOfDay(hour: 15, minute: 0),
        durationMinutes: 60,
        status: AppointmentStatus.completed,
        location: 'Principal Office',
        completedAt: DateTime.now().subtract(const Duration(hours: 2)),
        createdAt: DateTime.now().subtract(const Duration(days: 10)),
        updatedAt: DateTime.now().subtract(const Duration(hours: 2)),
      ),
    ];
  }

  // Create a new appointment
  static Future<String> createAppointment(Appointment appointment) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final docRef = _firestore.collection(_appointmentsCollection).doc();
      final appointmentWithId = appointment.copyWith(
        id: docRef.id,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await docRef.set(appointmentWithId.toMap());
      return docRef.id;
    } catch (e) {
      print('Error creating appointment: $e');
      // For development, add to mock data
      final id = 'appointment_${DateTime.now().millisecondsSinceEpoch}';
      _mockAppointments.add(appointment.copyWith(id: id));
      return id;
    }
  }

  // Get appointments by user ID
  static Future<List<Appointment>> getAppointmentsByUser(String userId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final querySnapshot = await _firestore
          .collection(_appointmentsCollection)
          .where('schoolId', isEqualTo: 'school_1')
          .where('requesterId', isEqualTo: userId)
          .orderBy('scheduledDate', descending: false)
          .get();

      return querySnapshot.docs
          .map((doc) => Appointment.fromMap(doc.data()))
          .toList();
    } catch (e) {
      print('Error getting appointments by user: $e');
      // Return mock data for development
      return _mockAppointments
          .where((appointment) => appointment.requesterId == userId)
          .toList();
    }
  }

  // Get appointments for a user (both as requester and requested with)
  static Future<List<Appointment>> getAppointmentsForUser(String userId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final querySnapshot = await _firestore
          .collection(_appointmentsCollection)
          .where('schoolId', isEqualTo: 'school_1')
          .where('requesterId', isEqualTo: userId)
          .orderBy('scheduledDate', descending: false)
          .get();

      final requestedAppointments = querySnapshot.docs
          .map((doc) => Appointment.fromMap(doc.data()))
          .toList();

      final requestedWithSnapshot = await _firestore
          .collection(_appointmentsCollection)
          .where('schoolId', isEqualTo: 'school_1')
          .where('requestedWithId', isEqualTo: userId)
          .orderBy('scheduledDate', descending: false)
          .get();

      final requestedWithAppointments = requestedWithSnapshot.docs
          .map((doc) => Appointment.fromMap(doc.data()))
          .toList();

      final allAppointments = [...requestedAppointments, ...requestedWithAppointments];
      allAppointments.sort((a, b) => a.scheduledDateTime.compareTo(b.scheduledDateTime));
      
      return allAppointments;
    } catch (e) {
      print('Error getting appointments for user: $e');
      // Return mock data for development
      return _mockAppointments
          .where((appointment) => 
              appointment.requesterId == userId || appointment.requestedWithId == userId)
          .toList();
    }
  }

  // Update appointment status
  static Future<void> updateAppointmentStatus(
    String appointmentId,
    AppointmentStatus status, {
    String? notes,
    String? cancellationReason,
  }) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final updateData = {
        'status': status.name,
        'updatedAt': Timestamp.fromDate(DateTime.now()),
      };

      if (notes != null) {
        updateData['notes'] = notes;
      }

      if (cancellationReason != null) {
        updateData['cancellationReason'] = cancellationReason;
      }

      if (status == AppointmentStatus.completed) {
        updateData['completedAt'] = Timestamp.fromDate(DateTime.now());
      }

      await _firestore.collection(_appointmentsCollection).doc(appointmentId).update(updateData);
      
      // Update mock data for development
      final index = _mockAppointments.indexWhere((appointment) => appointment.id == appointmentId);
      if (index != -1) {
        _mockAppointments[index] = _mockAppointments[index].copyWith(
          status: status,
          notes: notes ?? _mockAppointments[index].notes,
          cancellationReason: cancellationReason ?? _mockAppointments[index].cancellationReason,
          completedAt: status == AppointmentStatus.completed ? DateTime.now() : _mockAppointments[index].completedAt,
          updatedAt: DateTime.now(),
        );
      }
    } catch (e) {
      print('Error updating appointment status: $e');
      // Update mock data for development
      final index = _mockAppointments.indexWhere((appointment) => appointment.id == appointmentId);
      if (index != -1) {
        _mockAppointments[index] = _mockAppointments[index].copyWith(
          status: status,
          notes: notes ?? _mockAppointments[index].notes,
          cancellationReason: cancellationReason ?? _mockAppointments[index].cancellationReason,
          completedAt: status == AppointmentStatus.completed ? DateTime.now() : _mockAppointments[index].completedAt,
          updatedAt: DateTime.now(),
        );
      }
    }
  }

  // Get appointments by school ID (for admin)
  static Future<List<Appointment>> getAppointmentsBySchool(String schoolId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final querySnapshot = await _firestore
          .collection(_appointmentsCollection)
          .where('schoolId', isEqualTo: schoolId)
          .orderBy('scheduledDate', descending: false)
          .get();

      return querySnapshot.docs
          .map((doc) => Appointment.fromMap(doc.data()))
          .toList();
    } catch (e) {
      print('Error getting appointments by school: $e');
      // Return mock data for development
      return _mockAppointments
          .where((appointment) => appointment.schoolId == schoolId)
          .toList();
    }
  }

  // Get today's appointments
  static Future<List<Appointment>> getTodaysAppointments(String userId) async {
    try {
      final allAppointments = await getAppointmentsForUser(userId);
      return allAppointments.where((appointment) {
        return appointment.isToday && 
               !appointment.isCancelled && 
               !appointment.isCompleted;
      }).toList();
    } catch (e) {
      print('Error getting today\'s appointments: $e');
      // Return mock data for development
      return _mockAppointments.where((appointment) {
        return appointment.requesterId == userId &&
               appointment.isToday && 
               !appointment.isCancelled && 
               !appointment.isCompleted;
      }).toList();
    }
  }

  // Get upcoming appointments
  static Future<List<Appointment>> getUpcomingAppointments(String userId, {int days = 7}) async {
    try {
      final allAppointments = await getAppointmentsForUser(userId);
      final now = DateTime.now();
      final futureDate = now.add(Duration(days: days));
      
      return allAppointments.where((appointment) {
        return appointment.scheduledDateTime.isAfter(now) &&
               appointment.scheduledDateTime.isBefore(futureDate) &&
               !appointment.isCancelled && 
               !appointment.isCompleted;
      }).toList();
    } catch (e) {
      print('Error getting upcoming appointments: $e');
      // Return mock data for development
      final now = DateTime.now();
      final futureDate = now.add(Duration(days: days));
      return _mockAppointments.where((appointment) {
        return (appointment.requesterId == userId || appointment.requestedWithId == userId) &&
               appointment.scheduledDateTime.isAfter(now) &&
               appointment.scheduledDateTime.isBefore(futureDate) &&
               !appointment.isCancelled && 
               !appointment.isCompleted;
      }).toList();
    }
  }

  // Delete appointment
  static Future<void> deleteAppointment(String appointmentId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      await _firestore.collection(_appointmentsCollection).doc(appointmentId).delete();
    } catch (e) {
      print('Error deleting appointment: $e');
      // Remove from mock data for development
      _mockAppointments.removeWhere((appointment) => appointment.id == appointmentId);
    }
  }

  // Get appointment statistics
  static Future<Map<String, dynamic>> getAppointmentStatistics(String schoolId) async {
    try {
      final appointments = await getAppointmentsBySchool(schoolId);
      
      int totalAppointments = appointments.length;
      int pendingCount = appointments.where((a) => a.isPending).length;
      int confirmedCount = appointments.where((a) => a.isConfirmed).length;
      int completedCount = appointments.where((a) => a.isCompleted).length;
      int cancelledCount = appointments.where((a) => a.isCancelled).length;
      
      Map<AppointmentType, int> typeCount = {};
      for (final type in AppointmentType.values) {
        typeCount[type] = appointments.where((a) => a.type == type).length;
      }
      
      return {
        'totalAppointments': totalAppointments,
        'pendingCount': pendingCount,
        'confirmedCount': confirmedCount,
        'completedCount': completedCount,
        'cancelledCount': cancelledCount,
        'typeCount': typeCount,
      };
    } catch (e) {
      print('Error getting appointment statistics: $e');
      return {
        'totalAppointments': 0,
        'pendingCount': 0,
        'confirmedCount': 0,
        'completedCount': 0,
        'cancelledCount': 0,
        'typeCount': <AppointmentType, int>{},
      };
    }
  }
}
