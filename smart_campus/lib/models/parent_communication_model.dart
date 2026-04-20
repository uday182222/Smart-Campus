import 'package:cloud_firestore/cloud_firestore.dart';

enum CommunicationType {
  absenceNotification,
  holidayRequest,
}

enum CommunicationStatus {
  pending,
  approved,
  rejected,
  cancelled,
}

enum CommunicationPriority {
  low,
  medium,
  high,
  urgent,
}

class ParentCommunication {
  final String id;
  final String parentId;
  final String parentName;
  final String studentId;
  final String studentName;
  final String classId;
  final String className;
  final String schoolId;
  final CommunicationType type;
  final CommunicationStatus status;
  final CommunicationPriority priority;
  final String subject;
  final String message;
  final DateTime? startDate;
  final DateTime? endDate;
  final String? reason;
  final String? additionalNotes;
  final List<String> attachments;
  final String? teacherId;
  final String? teacherName;
  final String? adminId;
  final String? adminName;
  final DateTime? teacherApprovalDate;
  final DateTime? adminApprovalDate;
  final String? teacherResponse;
  final String? adminResponse;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool isReadByTeacher;
  final bool isReadByAdmin;
  final bool isReadByParent;

  ParentCommunication({
    required this.id,
    required this.parentId,
    required this.parentName,
    required this.studentId,
    required this.studentName,
    required this.classId,
    required this.className,
    required this.schoolId,
    required this.type,
    required this.status,
    required this.priority,
    required this.subject,
    required this.message,
    this.startDate,
    this.endDate,
    this.reason,
    this.additionalNotes,
    this.attachments = const [],
    this.teacherId,
    this.teacherName,
    this.adminId,
    this.adminName,
    this.teacherApprovalDate,
    this.adminApprovalDate,
    this.teacherResponse,
    this.adminResponse,
    required this.createdAt,
    required this.updatedAt,
    this.isReadByTeacher = false,
    this.isReadByAdmin = false,
    this.isReadByParent = false,
  });

  factory ParentCommunication.fromMap(Map<String, dynamic> map) {
    return ParentCommunication(
      id: map['id'] ?? '',
      parentId: map['parentId'] ?? '',
      parentName: map['parentName'] ?? '',
      studentId: map['studentId'] ?? '',
      studentName: map['studentName'] ?? '',
      classId: map['classId'] ?? '',
      className: map['className'] ?? '',
      schoolId: map['schoolId'] ?? '',
      type: CommunicationType.values.firstWhere(
        (e) => e.name == map['type'],
        orElse: () => CommunicationType.absenceNotification,
      ),
      status: CommunicationStatus.values.firstWhere(
        (e) => e.name == map['status'],
        orElse: () => CommunicationStatus.pending,
      ),
      priority: CommunicationPriority.values.firstWhere(
        (e) => e.name == map['priority'],
        orElse: () => CommunicationPriority.medium,
      ),
      subject: map['subject'] ?? '',
      message: map['message'] ?? '',
      startDate: map['startDate'] != null 
          ? (map['startDate'] as Timestamp).toDate()
          : null,
      endDate: map['endDate'] != null 
          ? (map['endDate'] as Timestamp).toDate()
          : null,
      reason: map['reason'],
      additionalNotes: map['additionalNotes'],
      attachments: List<String>.from(map['attachments'] ?? []),
      teacherId: map['teacherId'],
      teacherName: map['teacherName'],
      adminId: map['adminId'],
      adminName: map['adminName'],
      teacherApprovalDate: map['teacherApprovalDate'] != null 
          ? (map['teacherApprovalDate'] as Timestamp).toDate()
          : null,
      adminApprovalDate: map['adminApprovalDate'] != null 
          ? (map['adminApprovalDate'] as Timestamp).toDate()
          : null,
      teacherResponse: map['teacherResponse'],
      adminResponse: map['adminResponse'],
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as Timestamp).toDate(),
      isReadByTeacher: map['isReadByTeacher'] ?? false,
      isReadByAdmin: map['isReadByAdmin'] ?? false,
      isReadByParent: map['isReadByParent'] ?? false,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'parentId': parentId,
      'parentName': parentName,
      'studentId': studentId,
      'studentName': studentName,
      'classId': classId,
      'className': className,
      'schoolId': schoolId,
      'type': type.name,
      'status': status.name,
      'priority': priority.name,
      'subject': subject,
      'message': message,
      'startDate': startDate != null ? Timestamp.fromDate(startDate!) : null,
      'endDate': endDate != null ? Timestamp.fromDate(endDate!) : null,
      'reason': reason,
      'additionalNotes': additionalNotes,
      'attachments': attachments,
      'teacherId': teacherId,
      'teacherName': teacherName,
      'adminId': adminId,
      'adminName': adminName,
      'teacherApprovalDate': teacherApprovalDate != null 
          ? Timestamp.fromDate(teacherApprovalDate!)
          : null,
      'adminApprovalDate': adminApprovalDate != null 
          ? Timestamp.fromDate(adminApprovalDate!)
          : null,
      'teacherResponse': teacherResponse,
      'adminResponse': adminResponse,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
      'isReadByTeacher': isReadByTeacher,
      'isReadByAdmin': isReadByAdmin,
      'isReadByParent': isReadByParent,
    };
  }

  ParentCommunication copyWith({
    String? id,
    String? parentId,
    String? parentName,
    String? studentId,
    String? studentName,
    String? classId,
    String? className,
    String? schoolId,
    CommunicationType? type,
    CommunicationStatus? status,
    CommunicationPriority? priority,
    String? subject,
    String? message,
    DateTime? startDate,
    DateTime? endDate,
    String? reason,
    String? additionalNotes,
    List<String>? attachments,
    String? teacherId,
    String? teacherName,
    String? adminId,
    String? adminName,
    DateTime? teacherApprovalDate,
    DateTime? adminApprovalDate,
    String? teacherResponse,
    String? adminResponse,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isReadByTeacher,
    bool? isReadByAdmin,
    bool? isReadByParent,
  }) {
    return ParentCommunication(
      id: id ?? this.id,
      parentId: parentId ?? this.parentId,
      parentName: parentName ?? this.parentName,
      studentId: studentId ?? this.studentId,
      studentName: studentName ?? this.studentName,
      classId: classId ?? this.classId,
      className: className ?? this.className,
      schoolId: schoolId ?? this.schoolId,
      type: type ?? this.type,
      status: status ?? this.status,
      priority: priority ?? this.priority,
      subject: subject ?? this.subject,
      message: message ?? this.message,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      reason: reason ?? this.reason,
      additionalNotes: additionalNotes ?? this.additionalNotes,
      attachments: attachments ?? this.attachments,
      teacherId: teacherId ?? this.teacherId,
      teacherName: teacherName ?? this.teacherName,
      adminId: adminId ?? this.adminId,
      adminName: adminName ?? this.adminName,
      teacherApprovalDate: teacherApprovalDate ?? this.teacherApprovalDate,
      adminApprovalDate: adminApprovalDate ?? this.adminApprovalDate,
      teacherResponse: teacherResponse ?? this.teacherResponse,
      adminResponse: adminResponse ?? this.adminResponse,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isReadByTeacher: isReadByTeacher ?? this.isReadByTeacher,
      isReadByAdmin: isReadByAdmin ?? this.isReadByAdmin,
      isReadByParent: isReadByParent ?? this.isReadByParent,
    );
  }

  String get statusDisplayName {
    switch (status) {
      case CommunicationStatus.pending:
        return 'Pending Approval';
      case CommunicationStatus.approved:
        return 'Approved';
      case CommunicationStatus.rejected:
        return 'Rejected';
      case CommunicationStatus.cancelled:
        return 'Cancelled';
    }
  }

  String get typeDisplayName {
    switch (type) {
      case CommunicationType.absenceNotification:
        return 'Absence Notification';
      case CommunicationType.holidayRequest:
        return 'Holiday Request';
    }
  }

  String get priorityDisplayName {
    switch (priority) {
      case CommunicationPriority.low:
        return 'Low';
      case CommunicationPriority.medium:
        return 'Medium';
      case CommunicationPriority.high:
        return 'High';
      case CommunicationPriority.urgent:
        return 'Urgent';
    }
  }

  bool get isPending => status == CommunicationStatus.pending;
  bool get isApproved => status == CommunicationStatus.approved;
  bool get isRejected => status == CommunicationStatus.rejected;
  bool get isCancelled => status == CommunicationStatus.cancelled;

  bool get requiresTeacherApproval => type == CommunicationType.holidayRequest;
  bool get requiresAdminApproval => type == CommunicationType.holidayRequest;
}
