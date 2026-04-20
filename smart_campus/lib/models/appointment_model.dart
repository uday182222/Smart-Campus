import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

enum AppointmentStatus {
  pending,
  confirmed,
  cancelled,
  completed,
  rescheduled,
}

enum AppointmentType {
  parentTeacher,
  teacherAdmin,
  studentCounselor,
  general,
}

class Appointment {
  final String id;
  final String schoolId;
  final String title;
  final String description;
  final AppointmentType type;
  final String requesterId;
  final String requesterName;
  final String requesterRole;
  final String requestedWithId;
  final String requestedWithName;
  final String requestedWithRole;
  final String? studentId;
  final String? studentName;
  final DateTime scheduledDate;
  final TimeOfDay scheduledTime;
  final int durationMinutes;
  final AppointmentStatus status;
  final String? location;
  final String? notes;
  final String? cancellationReason;
  final DateTime? completedAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  Appointment({
    required this.id,
    required this.schoolId,
    required this.title,
    required this.description,
    required this.type,
    required this.requesterId,
    required this.requesterName,
    required this.requesterRole,
    required this.requestedWithId,
    required this.requestedWithName,
    required this.requestedWithRole,
    this.studentId,
    this.studentName,
    required this.scheduledDate,
    required this.scheduledTime,
    required this.durationMinutes,
    required this.status,
    this.location,
    this.notes,
    this.cancellationReason,
    this.completedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Appointment.fromMap(Map<String, dynamic> map) {
    return Appointment(
      id: map['id'] ?? '',
      schoolId: map['schoolId'] ?? '',
      title: map['title'] ?? '',
      description: map['description'] ?? '',
      type: AppointmentType.values.firstWhere(
        (e) => e.name == map['type'],
        orElse: () => AppointmentType.general,
      ),
      requesterId: map['requesterId'] ?? '',
      requesterName: map['requesterName'] ?? '',
      requesterRole: map['requesterRole'] ?? '',
      requestedWithId: map['requestedWithId'] ?? '',
      requestedWithName: map['requestedWithName'] ?? '',
      requestedWithRole: map['requestedWithRole'] ?? '',
      studentId: map['studentId'],
      studentName: map['studentName'],
      scheduledDate: (map['scheduledDate'] as Timestamp).toDate(),
      scheduledTime: TimeOfDay.fromDateTime((map['scheduledTime'] as Timestamp).toDate()),
      durationMinutes: map['durationMinutes'] ?? 30,
      status: AppointmentStatus.values.firstWhere(
        (e) => e.name == map['status'],
        orElse: () => AppointmentStatus.pending,
      ),
      location: map['location'],
      notes: map['notes'],
      cancellationReason: map['cancellationReason'],
      completedAt: map['completedAt'] != null 
          ? (map['completedAt'] as Timestamp).toDate()
          : null,
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as Timestamp).toDate(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'schoolId': schoolId,
      'title': title,
      'description': description,
      'type': type.name,
      'requesterId': requesterId,
      'requesterName': requesterName,
      'requesterRole': requesterRole,
      'requestedWithId': requestedWithId,
      'requestedWithName': requestedWithName,
      'requestedWithRole': requestedWithRole,
      'studentId': studentId,
      'studentName': studentName,
      'scheduledDate': Timestamp.fromDate(scheduledDate),
      'scheduledTime': Timestamp.fromDate(scheduledTime.toDateTime(scheduledDate)),
      'durationMinutes': durationMinutes,
      'status': status.name,
      'location': location,
      'notes': notes,
      'cancellationReason': cancellationReason,
      'completedAt': completedAt != null ? Timestamp.fromDate(completedAt!) : null,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }

  Appointment copyWith({
    String? id,
    String? schoolId,
    String? title,
    String? description,
    AppointmentType? type,
    String? requesterId,
    String? requesterName,
    String? requesterRole,
    String? requestedWithId,
    String? requestedWithName,
    String? requestedWithRole,
    String? studentId,
    String? studentName,
    DateTime? scheduledDate,
    TimeOfDay? scheduledTime,
    int? durationMinutes,
    AppointmentStatus? status,
    String? location,
    String? notes,
    String? cancellationReason,
    DateTime? completedAt,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Appointment(
      id: id ?? this.id,
      schoolId: schoolId ?? this.schoolId,
      title: title ?? this.title,
      description: description ?? this.description,
      type: type ?? this.type,
      requesterId: requesterId ?? this.requesterId,
      requesterName: requesterName ?? this.requesterName,
      requesterRole: requesterRole ?? this.requesterRole,
      requestedWithId: requestedWithId ?? this.requestedWithId,
      requestedWithName: requestedWithName ?? this.requestedWithName,
      requestedWithRole: requestedWithRole ?? this.requestedWithRole,
      studentId: studentId ?? this.studentId,
      studentName: studentName ?? this.studentName,
      scheduledDate: scheduledDate ?? this.scheduledDate,
      scheduledTime: scheduledTime ?? this.scheduledTime,
      durationMinutes: durationMinutes ?? this.durationMinutes,
      status: status ?? this.status,
      location: location ?? this.location,
      notes: notes ?? this.notes,
      cancellationReason: cancellationReason ?? this.cancellationReason,
      completedAt: completedAt ?? this.completedAt,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  String get typeDisplayName {
    switch (type) {
      case AppointmentType.parentTeacher:
        return 'Parent-Teacher Meeting';
      case AppointmentType.teacherAdmin:
        return 'Teacher-Admin Meeting';
      case AppointmentType.studentCounselor:
        return 'Student-Counselor Meeting';
      case AppointmentType.general:
        return 'General Appointment';
    }
  }

  String get statusDisplayName {
    switch (status) {
      case AppointmentStatus.pending:
        return 'Pending';
      case AppointmentStatus.confirmed:
        return 'Confirmed';
      case AppointmentStatus.cancelled:
        return 'Cancelled';
      case AppointmentStatus.completed:
        return 'Completed';
      case AppointmentStatus.rescheduled:
        return 'Rescheduled';
    }
  }

  DateTime get scheduledDateTime {
    return scheduledTime.toDateTime(scheduledDate);
  }

  DateTime get endDateTime {
    return scheduledDateTime.add(Duration(minutes: durationMinutes));
  }

  bool get isPending => status == AppointmentStatus.pending;
  bool get isConfirmed => status == AppointmentStatus.confirmed;
  bool get isCancelled => status == AppointmentStatus.cancelled;
  bool get isCompleted => status == AppointmentStatus.completed;
  bool get isRescheduled => status == AppointmentStatus.rescheduled;
  bool get isUpcoming => scheduledDateTime.isAfter(DateTime.now()) && !isCancelled && !isCompleted;
  bool get isPast => scheduledDateTime.isBefore(DateTime.now());
  bool get isToday => scheduledDate.day == DateTime.now().day && 
                     scheduledDate.month == DateTime.now().month && 
                     scheduledDate.year == DateTime.now().year;
}

// Extension for TimeOfDay to add utility methods
extension TimeOfDayExtension on TimeOfDay {
  int get inMinutes => hour * 60 + minute;

  bool isAfter(TimeOfDay other) {
    return inMinutes > other.inMinutes;
  }

  bool isBefore(TimeOfDay other) {
    return inMinutes < other.inMinutes;
  }

  DateTime toDateTime(DateTime date) {
    return DateTime(date.year, date.month, date.day, hour, minute);
  }

  String toTimeString() {
    return '${hour.toString().padLeft(2, '0')}:${minute.toString().padLeft(2, '0')}';
  }
}
