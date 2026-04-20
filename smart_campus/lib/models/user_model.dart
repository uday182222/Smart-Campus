class UserModel {
  final String id;
  final String email;
  final String name;
  final String role;
  final String? phone;
  final String? address;
  final String? profileUrl;
  final DateTime? createdAt;
  final DateTime? lastLoginAt;

  UserModel({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.phone,
    this.address,
    this.profileUrl,
    this.createdAt,
    this.lastLoginAt,
  });

  // Create from Firebase User
  factory UserModel.fromFirebaseUser(dynamic firebaseUser, String role) {
    // Handle both real Firebase User objects and mock user maps
    String uid;
    String email;
    String? displayName;
    
    if (firebaseUser is Map<String, dynamic>) {
      // Mock user (Map)
      uid = firebaseUser['uid'] ?? '';
      email = firebaseUser['email'] ?? '';
      displayName = firebaseUser['displayName'];
    } else {
      // Real Firebase User object
      uid = firebaseUser.uid;
      email = firebaseUser.email ?? '';
      displayName = firebaseUser.displayName;
    }
    
    return UserModel(
      id: uid,
      email: email,
      name: displayName ?? 'User',
      role: role,
      createdAt: DateTime.now(),
      lastLoginAt: DateTime.now(),
    );
  }

  // Create from Map (for JSON serialization)
  factory UserModel.fromMap(Map<String, dynamic> map) {
    return UserModel(
      id: map['id'] ?? '',
      email: map['email'] ?? '',
      name: map['name'] ?? '',
      role: map['role'] ?? '',
      phone: map['phone'],
      address: map['address'],
      profileUrl: map['profileUrl'],
      createdAt: map['createdAt'] != null 
          ? DateTime.parse(map['createdAt']) 
          : null,
      lastLoginAt: map['lastLoginAt'] != null 
          ? DateTime.parse(map['lastLoginAt']) 
          : null,
    );
  }

  // Convert to Map (for JSON serialization)
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'role': role,
      'phone': phone,
      'address': address,
      'profileUrl': profileUrl,
      'createdAt': createdAt?.toIso8601String(),
      'lastLoginAt': lastLoginAt?.toIso8601String(),
    };
  }

  // Create a copy with updated fields
  UserModel copyWith({
    String? id,
    String? email,
    String? name,
    String? role,
    String? phone,
    String? address,
    String? profileUrl,
    DateTime? createdAt,
    DateTime? lastLoginAt,
  }) {
    return UserModel(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      role: role ?? this.role,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      profileUrl: profileUrl ?? this.profileUrl,
      createdAt: createdAt ?? this.createdAt,
      lastLoginAt: lastLoginAt ?? this.lastLoginAt,
    );
  }

  // Check if user is admin
  bool get isAdmin => role == 'super_admin';

  // Check if user is school admin
  bool get isSchoolAdmin => role == 'school_admin';

  // Check if user is teacher
  bool get isTeacher => role == 'teacher' || role == 'super_admin' || role == 'school_admin';

  // Check if user is parent
  bool get isParent => role == 'parent';

  // Get display name for role
  String get roleDisplayName {
    switch (role) {
      case 'super_admin':
        return 'Administrator';
      case 'school_admin':
        return 'School Administrator';
      case 'teacher':
        return 'Teacher';
      case 'parent':
        return 'Parent';
      default:
        return 'User';
    }
  }

  @override
  String toString() {
    return 'UserModel(id: $id, email: $email, name: $name, role: $role)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is UserModel &&
        other.id == id &&
        other.email == email &&
        other.name == name &&
        other.role == role;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        email.hashCode ^
        name.hashCode ^
        role.hashCode;
  }
} 