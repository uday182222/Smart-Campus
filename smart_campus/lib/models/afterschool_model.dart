import 'package:cloud_firestore/cloud_firestore.dart';

enum ActivityType {
  sports,
  arts,
  academics,
  music,
  dance,
  drama,
  science,
  technology,
  other,
}

enum ActivityStatus {
  active,
  inactive,
  completed,
  cancelled,
}

class AfterSchoolActivity {
  final String id;
  final String schoolId;
  final String name;
  final String description;
  final ActivityType type;
  final String instructorName;
  final String instructorId;
  final int maxParticipants;
  final int currentParticipants;
  final List<String> participantIds;
  final List<String> participantNames;
  final double fee;
  final String schedule; // e.g., "Monday, Wednesday 4:00 PM - 5:30 PM"
  final String location;
  final ActivityStatus status;
  final DateTime startDate;
  final DateTime endDate;
  final String? requirements;
  final String? materials;
  final String createdBy;
  final String createdByName;
  final DateTime createdAt;
  final DateTime updatedAt;

  AfterSchoolActivity({
    required this.id,
    required this.schoolId,
    required this.name,
    required this.description,
    required this.type,
    required this.instructorName,
    required this.instructorId,
    required this.maxParticipants,
    this.currentParticipants = 0,
    this.participantIds = const [],
    this.participantNames = const [],
    required this.fee,
    required this.schedule,
    required this.location,
    required this.status,
    required this.startDate,
    required this.endDate,
    this.requirements,
    this.materials,
    required this.createdBy,
    required this.createdByName,
    required this.createdAt,
    required this.updatedAt,
  });

  factory AfterSchoolActivity.fromMap(Map<String, dynamic> map) {
    return AfterSchoolActivity(
      id: map['id'] ?? '',
      schoolId: map['schoolId'] ?? '',
      name: map['name'] ?? '',
      description: map['description'] ?? '',
      type: ActivityType.values.firstWhere(
        (e) => e.name == map['type'],
        orElse: () => ActivityType.other,
      ),
      instructorName: map['instructorName'] ?? '',
      instructorId: map['instructorId'] ?? '',
      maxParticipants: map['maxParticipants'] ?? 0,
      currentParticipants: map['currentParticipants'] ?? 0,
      participantIds: List<String>.from(map['participantIds'] ?? []),
      participantNames: List<String>.from(map['participantNames'] ?? []),
      fee: (map['fee'] ?? 0.0).toDouble(),
      schedule: map['schedule'] ?? '',
      location: map['location'] ?? '',
      status: ActivityStatus.values.firstWhere(
        (e) => e.name == map['status'],
        orElse: () => ActivityStatus.active,
      ),
      startDate: (map['startDate'] as Timestamp).toDate(),
      endDate: (map['endDate'] as Timestamp).toDate(),
      requirements: map['requirements'],
      materials: map['materials'],
      createdBy: map['createdBy'] ?? '',
      createdByName: map['createdByName'] ?? '',
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as Timestamp).toDate(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'schoolId': schoolId,
      'name': name,
      'description': description,
      'type': type.name,
      'instructorName': instructorName,
      'instructorId': instructorId,
      'maxParticipants': maxParticipants,
      'currentParticipants': currentParticipants,
      'participantIds': participantIds,
      'participantNames': participantNames,
      'fee': fee,
      'schedule': schedule,
      'location': location,
      'status': status.name,
      'startDate': Timestamp.fromDate(startDate),
      'endDate': Timestamp.fromDate(endDate),
      'requirements': requirements,
      'materials': materials,
      'createdBy': createdBy,
      'createdByName': createdByName,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }

  AfterSchoolActivity copyWith({
    String? id,
    String? schoolId,
    String? name,
    String? description,
    ActivityType? type,
    String? instructorName,
    String? instructorId,
    int? maxParticipants,
    int? currentParticipants,
    List<String>? participantIds,
    List<String>? participantNames,
    double? fee,
    String? schedule,
    String? location,
    ActivityStatus? status,
    DateTime? startDate,
    DateTime? endDate,
    String? requirements,
    String? materials,
    String? createdBy,
    String? createdByName,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return AfterSchoolActivity(
      id: id ?? this.id,
      schoolId: schoolId ?? this.schoolId,
      name: name ?? this.name,
      description: description ?? this.description,
      type: type ?? this.type,
      instructorName: instructorName ?? this.instructorName,
      instructorId: instructorId ?? this.instructorId,
      maxParticipants: maxParticipants ?? this.maxParticipants,
      currentParticipants: currentParticipants ?? this.currentParticipants,
      participantIds: participantIds ?? this.participantIds,
      participantNames: participantNames ?? this.participantNames,
      fee: fee ?? this.fee,
      schedule: schedule ?? this.schedule,
      location: location ?? this.location,
      status: status ?? this.status,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      requirements: requirements ?? this.requirements,
      materials: materials ?? this.materials,
      createdBy: createdBy ?? this.createdBy,
      createdByName: createdByName ?? this.createdByName,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  String get typeDisplayName {
    switch (type) {
      case ActivityType.sports:
        return 'Sports';
      case ActivityType.arts:
        return 'Arts';
      case ActivityType.academics:
        return 'Academics';
      case ActivityType.music:
        return 'Music';
      case ActivityType.dance:
        return 'Dance';
      case ActivityType.drama:
        return 'Drama';
      case ActivityType.science:
        return 'Science';
      case ActivityType.technology:
        return 'Technology';
      case ActivityType.other:
        return 'Other';
    }
  }

  String get statusDisplayName {
    switch (status) {
      case ActivityStatus.active:
        return 'Active';
      case ActivityStatus.inactive:
        return 'Inactive';
      case ActivityStatus.completed:
        return 'Completed';
      case ActivityStatus.cancelled:
        return 'Cancelled';
    }
  }

  bool get isActive => status == ActivityStatus.active;
  bool get isFull => currentParticipants >= maxParticipants;
  bool get hasSpace => currentParticipants < maxParticipants;
  bool get isEnrolled => participantIds.isNotEmpty; // This would be checked per user
  int get availableSpots => maxParticipants - currentParticipants;
}

class ActivityRegistration {
  final String id;
  final String activityId;
  final String studentId;
  final String studentName;
  final String parentId;
  final String parentName;
  final String schoolId;
  final DateTime registrationDate;
  final bool isApproved;
  final String? approvedBy;
  final String? approvedByName;
  final DateTime? approvedAt;
  final String? notes;
  final bool isActive;

  ActivityRegistration({
    required this.id,
    required this.activityId,
    required this.studentId,
    required this.studentName,
    required this.parentId,
    required this.parentName,
    required this.schoolId,
    required this.registrationDate,
    required this.isApproved,
    this.approvedBy,
    this.approvedByName,
    this.approvedAt,
    this.notes,
    required this.isActive,
  });

  factory ActivityRegistration.fromMap(Map<String, dynamic> map) {
    return ActivityRegistration(
      id: map['id'] ?? '',
      activityId: map['activityId'] ?? '',
      studentId: map['studentId'] ?? '',
      studentName: map['studentName'] ?? '',
      parentId: map['parentId'] ?? '',
      parentName: map['parentName'] ?? '',
      schoolId: map['schoolId'] ?? '',
      registrationDate: (map['registrationDate'] as Timestamp).toDate(),
      isApproved: map['isApproved'] ?? false,
      approvedBy: map['approvedBy'],
      approvedByName: map['approvedByName'],
      approvedAt: map['approvedAt'] != null 
          ? (map['approvedAt'] as Timestamp).toDate()
          : null,
      notes: map['notes'],
      isActive: map['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'activityId': activityId,
      'studentId': studentId,
      'studentName': studentName,
      'parentId': parentId,
      'parentName': parentName,
      'schoolId': schoolId,
      'registrationDate': Timestamp.fromDate(registrationDate),
      'isApproved': isApproved,
      'approvedBy': approvedBy,
      'approvedByName': approvedByName,
      'approvedAt': approvedAt != null ? Timestamp.fromDate(approvedAt!) : null,
      'notes': notes,
      'isActive': isActive,
    };
  }

  ActivityRegistration copyWith({
    String? id,
    String? activityId,
    String? studentId,
    String? studentName,
    String? parentId,
    String? parentName,
    String? schoolId,
    DateTime? registrationDate,
    bool? isApproved,
    String? approvedBy,
    String? approvedByName,
    DateTime? approvedAt,
    String? notes,
    bool? isActive,
  }) {
    return ActivityRegistration(
      id: id ?? this.id,
      activityId: activityId ?? this.activityId,
      studentId: studentId ?? this.studentId,
      studentName: studentName ?? this.studentName,
      parentId: parentId ?? this.parentId,
      parentName: parentName ?? this.parentName,
      schoolId: schoolId ?? this.schoolId,
      registrationDate: registrationDate ?? this.registrationDate,
      isApproved: isApproved ?? this.isApproved,
      approvedBy: approvedBy ?? this.approvedBy,
      approvedByName: approvedByName ?? this.approvedByName,
      approvedAt: approvedAt ?? this.approvedAt,
      notes: notes ?? this.notes,
      isActive: isActive ?? this.isActive,
    );
  }
}
