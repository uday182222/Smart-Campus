import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/transport_route_model.dart';
import '../models/student_model.dart';
import 'auth_service.dart';

class TransportService {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  static const String _routesCollection = 'transport_routes';
  static const String _updatesCollection = 'transport_updates';
  static const String _studentsCollection = 'students';

  // Mock data for development
  static List<TransportRoute> _mockRoutes = [];
  static List<TransportUpdate> _mockUpdates = [];

  static void initializeMockData() {
    _mockRoutes = [
      TransportRoute(
        id: 'route_1',
        name: 'Route A - Downtown',
        description: 'Main downtown route covering central areas',
        schoolId: 'school_1',
        busNumber: 'BUS-001',
        driverName: 'John Smith',
        driverPhone: '+1234567890',
        helperName: 'Maria Garcia',
        helperPhone: '+1234567891',
        stops: [
          RouteStop(
            id: 'stop_1',
            name: 'Central Station',
            address: '123 Main St, Downtown',
            latitude: 40.7128,
            longitude: -74.0060,
            estimatedTime: DateTime.now().add(const Duration(hours: 1)),
            status: StopStatus.pending,
            studentIds: ['student_1', 'student_2'],
          ),
          RouteStop(
            id: 'stop_2',
            name: 'Park Avenue',
            address: '456 Park Ave, Downtown',
            latitude: 40.7589,
            longitude: -73.9851,
            estimatedTime: DateTime.now().add(const Duration(hours: 1, minutes: 15)),
            status: StopStatus.reached,
            actualTime: DateTime.now().add(const Duration(minutes: 30)),
            studentIds: ['student_3'],
          ),
          RouteStop(
            id: 'stop_3',
            name: 'Waterfront',
            address: '789 Water St, Harbor',
            latitude: 40.6892,
            longitude: -74.0445,
            estimatedTime: DateTime.now().add(const Duration(hours: 1, minutes: 30)),
            status: StopStatus.pending,
            studentIds: ['student_4', 'student_5'],
          ),
        ],
        startTime: DateTime.now(),
        endTime: DateTime.now().add(const Duration(hours: 2)),
        status: RouteStatus.active,
        createdAt: DateTime.now().subtract(const Duration(days: 30)),
        updatedAt: DateTime.now().subtract(const Duration(hours: 1)),
      ),
      TransportRoute(
        id: 'route_2',
        name: 'Route B - Suburbs',
        description: 'Suburban route covering residential areas',
        schoolId: 'school_1',
        busNumber: 'BUS-002',
        driverName: 'Robert Johnson',
        driverPhone: '+1234567892',
        helperName: 'Lisa Brown',
        helperPhone: '+1234567893',
        stops: [
          RouteStop(
            id: 'stop_4',
            name: 'Oak Gardens',
            address: '321 Oak St, Suburbs',
            latitude: 40.7831,
            longitude: -73.9712,
            estimatedTime: DateTime.now().add(const Duration(hours: 1, minutes: 45)),
            status: StopStatus.pending,
            studentIds: ['student_6'],
          ),
          RouteStop(
            id: 'stop_5',
            name: 'Pine Valley',
            address: '654 Pine Ave, Suburbs',
            latitude: 40.7505,
            longitude: -73.9934,
            estimatedTime: DateTime.now().add(const Duration(hours: 2)),
            status: StopStatus.pending,
            studentIds: ['student_7', 'student_8'],
          ),
        ],
        startTime: DateTime.now().add(const Duration(minutes: 30)),
        endTime: DateTime.now().add(const Duration(hours: 2, minutes: 30)),
        status: RouteStatus.active,
        createdAt: DateTime.now().subtract(const Duration(days: 25)),
        updatedAt: DateTime.now().subtract(const Duration(minutes: 30)),
      ),
    ];

    _mockUpdates = [
      TransportUpdate(
        id: 'update_1',
        routeId: 'route_1',
        stopId: 'stop_2',
        status: StopStatus.reached,
        timestamp: DateTime.now().add(const Duration(minutes: 30)),
        updatedBy: 'helper_1',
        updatedByName: 'Maria Garcia',
        notes: 'All students picked up successfully',
      ),
    ];
  }

  // Create a new transport route
  static Future<String> createRoute(TransportRoute route) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final docRef = _firestore.collection(_routesCollection).doc();
      final routeWithId = route.copyWith(
        id: docRef.id,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await docRef.set(routeWithId.toMap());
      return docRef.id;
    } catch (e) {
      print('Error creating route: $e');
      // For development, add to mock data
      final id = 'route_${DateTime.now().millisecondsSinceEpoch}';
      _mockRoutes.add(route.copyWith(id: id));
      return id;
    }
  }

  // Get routes by school ID
  static Future<List<TransportRoute>> getRoutesBySchool(String schoolId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final querySnapshot = await _firestore
          .collection(_routesCollection)
          .where('schoolId', isEqualTo: schoolId)
          .orderBy('createdAt', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => TransportRoute.fromMap(doc.data()))
          .toList();
    } catch (e) {
      print('Error getting routes by school: $e');
      // Return mock data for development
      return _mockRoutes
          .where((route) => route.schoolId == schoolId)
          .toList();
    }
  }

  // Get route by ID
  static Future<TransportRoute?> getRouteById(String routeId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final doc = await _firestore.collection(_routesCollection).doc(routeId).get();
      if (!doc.exists) return null;
      
      return TransportRoute.fromMap(doc.data()!);
    } catch (e) {
      print('Error getting route by ID: $e');
      // Return mock data for development
      return _mockRoutes.firstWhere((route) => route.id == routeId, orElse: () => _mockRoutes.first);
    }
  }

  // Update route
  static Future<void> updateRoute(TransportRoute route) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      await _firestore.collection(_routesCollection).doc(route.id).update({
        ...route.toMap(),
        'updatedAt': Timestamp.fromDate(DateTime.now()),
      });
    } catch (e) {
      print('Error updating route: $e');
      // Update mock data for development
      final index = _mockRoutes.indexWhere((r) => r.id == route.id);
      if (index != -1) {
        _mockRoutes[index] = route.copyWith(updatedAt: DateTime.now());
      }
    }
  }

  // Delete route
  static Future<void> deleteRoute(String routeId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      await _firestore.collection(_routesCollection).doc(routeId).delete();
    } catch (e) {
      print('Error deleting route: $e');
      // Remove from mock data for development
      _mockRoutes.removeWhere((route) => route.id == routeId);
    }
  }

  // Update stop status (for helper app)
  static Future<void> updateStopStatus(
    String routeId,
    String stopId,
    StopStatus status, {
    String? notes,
  }) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      // Create transport update record
      final update = TransportUpdate(
        id: 'update_${DateTime.now().millisecondsSinceEpoch}',
        routeId: routeId,
        stopId: stopId,
        status: status,
        timestamp: DateTime.now(),
        notes: notes,
        updatedBy: currentUser.uid,
        updatedByName: 'Admin User',
      );

      await _firestore.collection(_updatesCollection).add(update.toMap());

      // Update the route's stop status
      final route = await getRouteById(routeId);
      if (route != null) {
        final updatedStops = route.stops.map((stop) {
          if (stop.id == stopId) {
            return stop.copyWith(
              status: status,
              actualTime: status == StopStatus.reached ? DateTime.now() : stop.actualTime,
              notes: notes,
            );
          }
          return stop;
        }).toList();

        final updatedRoute = route.copyWith(
          stops: updatedStops,
          updatedAt: DateTime.now(),
        );

        await updateRoute(updatedRoute);
      }
    } catch (e) {
      print('Error updating stop status: $e');
      // Update mock data for development
      _mockUpdates.add(TransportUpdate(
        id: 'update_${DateTime.now().millisecondsSinceEpoch}',
        routeId: routeId,
        stopId: stopId,
        status: status,
        timestamp: DateTime.now(),
        notes: notes,
        updatedBy: 'helper_1',
        updatedByName: 'Helper',
      ));

      final index = _mockRoutes.indexWhere((route) => route.id == routeId);
      if (index != -1) {
        final route = _mockRoutes[index];
        final updatedStops = route.stops.map((stop) {
          if (stop.id == stopId) {
            return stop.copyWith(
              status: status,
              actualTime: status == StopStatus.reached ? DateTime.now() : stop.actualTime,
              notes: notes,
            );
          }
          return stop;
        }).toList();

        _mockRoutes[index] = route.copyWith(
          stops: updatedStops,
          updatedAt: DateTime.now(),
        );
      }
    }
  }

  // Get transport updates for a route
  static Future<List<TransportUpdate>> getRouteUpdates(String routeId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final querySnapshot = await _firestore
          .collection(_updatesCollection)
          .where('routeId', isEqualTo: routeId)
          .orderBy('timestamp', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => TransportUpdate.fromMap(doc.data()))
          .toList();
    } catch (e) {
      print('Error getting route updates: $e');
      // Return mock data for development
      return _mockUpdates
          .where((update) => update.routeId == routeId)
          .toList();
    }
  }

  // Get students for a specific route
  static Future<List<Student>> getStudentsForRoute(String routeId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final route = await getRouteById(routeId);
      if (route == null) return [];

      final allStudentIds = route.stops.expand((stop) => stop.studentIds).toSet().toList();
      
      if (allStudentIds.isEmpty) return [];

      final querySnapshot = await _firestore
          .collection(_studentsCollection)
          .where('id', whereIn: allStudentIds)
          .get();

      return querySnapshot.docs
          .map((doc) => Student.fromMap(doc.data()))
          .toList();
    } catch (e) {
      print('Error getting students for route: $e');
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
      ];
    }
  }

  // Get routes for a specific student
  static Future<List<TransportRoute>> getRoutesForStudent(String studentId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final querySnapshot = await _firestore
          .collection(_routesCollection)
          .where('schoolId', isEqualTo: 'school_1')
          .get();

      final routes = querySnapshot.docs
          .map((doc) => TransportRoute.fromMap(doc.data()))
          .toList();

      // Filter routes that include this student
      return routes.where((route) {
        return route.stops.any((stop) => stop.studentIds.contains(studentId));
      }).toList();
    } catch (e) {
      print('Error getting routes for student: $e');
      // Return mock data for development
      return _mockRoutes.where((route) {
        return route.stops.any((stop) => stop.studentIds.contains(studentId));
      }).toList();
    }
  }

  // Get active routes (for helper app)
  static Future<List<TransportRoute>> getActiveRoutes() async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final querySnapshot = await _firestore
          .collection(_routesCollection)
          .where('schoolId', isEqualTo: 'school_1')
          .where('status', isEqualTo: RouteStatus.active.name)
          .get();

      return querySnapshot.docs
          .map((doc) => TransportRoute.fromMap(doc.data()))
          .toList();
    } catch (e) {
      print('Error getting active routes: $e');
      // Return mock data for development
      return _mockRoutes
          .where((route) => route.status == RouteStatus.active)
          .toList();
    }
  }

  // Get today's updates for a route
  static Future<List<TransportUpdate>> getTodayUpdates(String routeId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      final today = DateTime.now();
      final startOfDay = DateTime(today.year, today.month, today.day);
      final endOfDay = startOfDay.add(const Duration(days: 1));

      final querySnapshot = await _firestore
          .collection(_updatesCollection)
          .where('routeId', isEqualTo: routeId)
          .where('timestamp', isGreaterThanOrEqualTo: Timestamp.fromDate(startOfDay))
          .where('timestamp', isLessThan: Timestamp.fromDate(endOfDay))
          .orderBy('timestamp', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => TransportUpdate.fromMap(doc.data()))
          .toList();
    } catch (e) {
      print('Error getting today updates: $e');
      // Return mock data for development
      return _mockUpdates
          .where((update) => update.routeId == routeId)
          .toList();
    }
  }

  // Get students for a parent
  static Future<List<Student>> getStudentsForParent(String parentId) async {
    try {
      final currentUser = AuthService.getCurrentUser();
      if (currentUser == null) throw Exception('User not authenticated');

      // For now, return mock data since we don't have parent-student relationships in the database
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
        ),
        Student(
          id: 'student_2',
          name: 'Alex Johnson',
          email: 'alex.johnson@school.com',
          className: 'Grade 6B',
          rollNo: 'ST002',
          phone: '+1234567891',
          address: '456 Oak Ave, Suburbs',
          parentName: 'John Smith',
          parentPhone: '+0987654321',
          dateOfBirth: DateTime(2014, 3, 22),
          gender: 'Male',
          bloodGroup: 'A+',
          admissionDate: '2019-09-01',
        ),
      ];
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
        ),
      ];
    }
  }
}
