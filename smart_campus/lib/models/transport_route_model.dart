import 'package:cloud_firestore/cloud_firestore.dart';

enum RouteStatus {
  active,
  inactive,
  maintenance,
}

enum StopStatus {
  pending,
  reached,
  skipped,
  delayed,
}

class TransportRoute {
  final String id;
  final String name;
  final String description;
  final String schoolId;
  final String busNumber;
  final String driverName;
  final String driverPhone;
  final String helperName;
  final String helperPhone;
  final List<RouteStop> stops;
  final DateTime startTime;
  final DateTime endTime;
  final RouteStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;

  TransportRoute({
    required this.id,
    required this.name,
    required this.description,
    required this.schoolId,
    required this.busNumber,
    required this.driverName,
    required this.driverPhone,
    required this.helperName,
    required this.helperPhone,
    required this.stops,
    required this.startTime,
    required this.endTime,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory TransportRoute.fromMap(Map<String, dynamic> map) {
    return TransportRoute(
      id: map['id'] ?? '',
      name: map['name'] ?? '',
      description: map['description'] ?? '',
      schoolId: map['schoolId'] ?? '',
      busNumber: map['busNumber'] ?? '',
      driverName: map['driverName'] ?? '',
      driverPhone: map['driverPhone'] ?? '',
      helperName: map['helperName'] ?? '',
      helperPhone: map['helperPhone'] ?? '',
      stops: (map['stops'] as List<dynamic>? ?? [])
          .map((stop) => RouteStop.fromMap(stop))
          .toList(),
      startTime: (map['startTime'] as Timestamp).toDate(),
      endTime: (map['endTime'] as Timestamp).toDate(),
      status: RouteStatus.values.firstWhere(
        (e) => e.name == map['status'],
        orElse: () => RouteStatus.active,
      ),
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as Timestamp).toDate(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'schoolId': schoolId,
      'busNumber': busNumber,
      'driverName': driverName,
      'driverPhone': driverPhone,
      'helperName': helperName,
      'helperPhone': helperPhone,
      'stops': stops.map((stop) => stop.toMap()).toList(),
      'startTime': Timestamp.fromDate(startTime),
      'endTime': Timestamp.fromDate(endTime),
      'status': status.name,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }

  TransportRoute copyWith({
    String? id,
    String? name,
    String? description,
    String? schoolId,
    String? busNumber,
    String? driverName,
    String? driverPhone,
    String? helperName,
    String? helperPhone,
    List<RouteStop>? stops,
    DateTime? startTime,
    DateTime? endTime,
    RouteStatus? status,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return TransportRoute(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      schoolId: schoolId ?? this.schoolId,
      busNumber: busNumber ?? this.busNumber,
      driverName: driverName ?? this.driverName,
      driverPhone: driverPhone ?? this.driverPhone,
      helperName: helperName ?? this.helperName,
      helperPhone: helperPhone ?? this.helperPhone,
      stops: stops ?? this.stops,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  String get statusDisplayName {
    switch (status) {
      case RouteStatus.active:
        return 'Active';
      case RouteStatus.inactive:
        return 'Inactive';
      case RouteStatus.maintenance:
        return 'Maintenance';
    }
  }

  bool get isActive => status == RouteStatus.active;
  int get totalStops => stops.length;
  int get completedStops => stops.where((stop) => stop.status == StopStatus.reached).length;
  double get completionPercentage => totalStops > 0 ? (completedStops / totalStops) * 100 : 0;
}

class RouteStop {
  final String id;
  final String name;
  final String address;
  final double latitude;
  final double longitude;
  final DateTime estimatedTime;
  final StopStatus status;
  final DateTime? actualTime;
  final String? notes;
  final List<String> studentIds;

  RouteStop({
    required this.id,
    required this.name,
    required this.address,
    required this.latitude,
    required this.longitude,
    required this.estimatedTime,
    required this.status,
    this.actualTime,
    this.notes,
    this.studentIds = const [],
  });

  factory RouteStop.fromMap(Map<String, dynamic> map) {
    return RouteStop(
      id: map['id'] ?? '',
      name: map['name'] ?? '',
      address: map['address'] ?? '',
      latitude: (map['latitude'] ?? 0.0).toDouble(),
      longitude: (map['longitude'] ?? 0.0).toDouble(),
      estimatedTime: (map['estimatedTime'] as Timestamp).toDate(),
      status: StopStatus.values.firstWhere(
        (e) => e.name == map['status'],
        orElse: () => StopStatus.pending,
      ),
      actualTime: map['actualTime'] != null 
          ? (map['actualTime'] as Timestamp).toDate()
          : null,
      notes: map['notes'],
      studentIds: List<String>.from(map['studentIds'] ?? []),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'address': address,
      'latitude': latitude,
      'longitude': longitude,
      'estimatedTime': Timestamp.fromDate(estimatedTime),
      'status': status.name,
      'actualTime': actualTime != null ? Timestamp.fromDate(actualTime!) : null,
      'notes': notes,
      'studentIds': studentIds,
    };
  }

  RouteStop copyWith({
    String? id,
    String? name,
    String? address,
    double? latitude,
    double? longitude,
    DateTime? estimatedTime,
    StopStatus? status,
    DateTime? actualTime,
    String? notes,
    List<String>? studentIds,
  }) {
    return RouteStop(
      id: id ?? this.id,
      name: name ?? this.name,
      address: address ?? this.address,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      estimatedTime: estimatedTime ?? this.estimatedTime,
      status: status ?? this.status,
      actualTime: actualTime ?? this.actualTime,
      notes: notes ?? this.notes,
      studentIds: studentIds ?? this.studentIds,
    );
  }

  String get statusDisplayName {
    switch (status) {
      case StopStatus.pending:
        return 'Pending';
      case StopStatus.reached:
        return 'Reached';
      case StopStatus.skipped:
        return 'Skipped';
      case StopStatus.delayed:
        return 'Delayed';
    }
  }

  bool get isCompleted => status == StopStatus.reached;
  bool get isPending => status == StopStatus.pending;
}

class TransportUpdate {
  final String id;
  final String routeId;
  final String stopId;
  final StopStatus status;
  final DateTime timestamp;
  final String? notes;
  final String updatedBy; // helperId or driverId
  final String updatedByName;

  TransportUpdate({
    required this.id,
    required this.routeId,
    required this.stopId,
    required this.status,
    required this.timestamp,
    this.notes,
    required this.updatedBy,
    required this.updatedByName,
  });

  factory TransportUpdate.fromMap(Map<String, dynamic> map) {
    return TransportUpdate(
      id: map['id'] ?? '',
      routeId: map['routeId'] ?? '',
      stopId: map['stopId'] ?? '',
      status: StopStatus.values.firstWhere(
        (e) => e.name == map['status'],
        orElse: () => StopStatus.pending,
      ),
      timestamp: (map['timestamp'] as Timestamp).toDate(),
      notes: map['notes'],
      updatedBy: map['updatedBy'] ?? '',
      updatedByName: map['updatedByName'] ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'routeId': routeId,
      'stopId': stopId,
      'status': status.name,
      'timestamp': Timestamp.fromDate(timestamp),
      'notes': notes,
      'updatedBy': updatedBy,
      'updatedByName': updatedByName,
    };
  }

  String get statusDisplayName {
    switch (status) {
      case StopStatus.pending:
        return 'Pending';
      case StopStatus.reached:
        return 'Reached';
      case StopStatus.skipped:
        return 'Skipped';
      case StopStatus.delayed:
        return 'Delayed';
    }
  }
}
