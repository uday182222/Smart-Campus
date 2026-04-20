enum SchoolStatus {
  active,
  inactive,
  suspended,
}

class SchoolModel {
  final String id;
  final String name;
  final String schoolId; // Unique school identifier (e.g., SCH-2025-A12)
  final String address;
  final String phone;
  final String email;
  final String adminEmail;
  final String adminName;
  final SchoolStatus status; // active, inactive, suspended
  final DateTime createdAt;
  final DateTime? updatedAt;
  final String? logo;
  final String? website;
  final String? description;
  final int? studentCount;
  final int? staffCount;
  final int? classCount;

  SchoolModel({
    required this.id,
    required this.name,
    required this.schoolId,
    required this.address,
    required this.phone,
    required this.email,
    required this.adminEmail,
    required this.adminName,
    required this.status,
    required this.createdAt,
    this.updatedAt,
    this.logo,
    this.website,
    this.description,
    this.studentCount,
    this.staffCount,
    this.classCount,
  });

  // Create from Map (for JSON serialization)
  factory SchoolModel.fromMap(Map<String, dynamic> map) {
    return SchoolModel(
      id: map['id'] ?? '',
      name: map['name'] ?? '',
      schoolId: map['schoolId'] ?? '',
      address: map['address'] ?? '',
      phone: map['phone'] ?? '',
      email: map['email'] ?? '',
      adminEmail: map['adminEmail'] ?? '',
      adminName: map['adminName'] ?? '',
      status: map['status'] != null 
          ? SchoolStatus.values.firstWhere((e) => e.name == map['status']) 
          : SchoolStatus.active,
      createdAt: map['createdAt'] != null 
          ? DateTime.parse(map['createdAt']) 
          : DateTime.now(),
      updatedAt: map['updatedAt'] != null 
          ? DateTime.parse(map['updatedAt']) 
          : null,
      logo: map['logo'],
      website: map['website'],
      description: map['description'],
      studentCount: map['studentCount'],
      staffCount: map['staffCount'],
      classCount: map['classCount'],
    );
  }

  // Convert to Map (for JSON serialization)
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'schoolId': schoolId,
      'address': address,
      'phone': phone,
      'email': email,
      'adminEmail': adminEmail,
      'adminName': adminName,
      'status': status.name,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'logo': logo,
      'website': website,
      'description': description,
      'studentCount': studentCount,
      'staffCount': staffCount,
      'classCount': classCount,
    };
  }

  // Create a copy with updated fields
  SchoolModel copyWith({
    String? id,
    String? name,
    String? schoolId,
    String? address,
    String? phone,
    String? email,
    String? adminEmail,
    String? adminName,
    SchoolStatus? status,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? logo,
    String? website,
    String? description,
    int? studentCount,
    int? staffCount,
    int? classCount,
  }) {
    return SchoolModel(
      id: id ?? this.id,
      name: name ?? this.name,
      schoolId: schoolId ?? this.schoolId,
      address: address ?? this.address,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      adminEmail: adminEmail ?? this.adminEmail,
      adminName: adminName ?? this.adminName,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      logo: logo ?? this.logo,
      website: website ?? this.website,
      description: description ?? this.description,
      studentCount: studentCount ?? this.studentCount,
      staffCount: staffCount ?? this.staffCount,
      classCount: classCount ?? this.classCount,
    );
  }

  // Check if school is active
  bool get isActive => status == SchoolStatus.active;

  // Get display name with school ID
  String get displayName => '$name ($schoolId)';

  // Get short display name
  String get shortDisplayName => name;

  @override
  String toString() {
    return 'SchoolModel(id: $id, name: $name, schoolId: $schoolId, status: $status)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is SchoolModel &&
        other.id == id &&
        other.schoolId == schoolId &&
        other.name == name;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        schoolId.hashCode ^
        name.hashCode;
  }
} 