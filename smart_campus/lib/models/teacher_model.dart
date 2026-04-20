class Teacher {
  final String id;
  final String fullName;
  final String email;
  final String phoneNumber;
  final String gender;
  final List<String> subjects;
  final List<String> assignedClasses;
  final String? photoUrl;
  final String address;
  final String qualification;
  final DateTime dateOfBirth;
  final DateTime joiningDate;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  Teacher({
    required this.id,
    required this.fullName,
    required this.email,
    required this.phoneNumber,
    required this.gender,
    required this.subjects,
    required this.assignedClasses,
    this.photoUrl,
    required this.address,
    required this.qualification,
    required this.dateOfBirth,
    required this.joiningDate,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  // Create from JSON
  factory Teacher.fromJson(Map<String, dynamic> json) {
    return Teacher(
      id: json['id'] ?? '',
      fullName: json['fullName'] ?? '',
      email: json['email'] ?? '',
      phoneNumber: json['phoneNumber'] ?? '',
      gender: json['gender'] ?? '',
      subjects: List<String>.from(json['subjects'] ?? []),
      assignedClasses: List<String>.from(json['assignedClasses'] ?? []),
      photoUrl: json['photoUrl'],
      address: json['address'] ?? '',
      qualification: json['qualification'] ?? '',
      dateOfBirth: DateTime.parse(json['dateOfBirth']),
      joiningDate: DateTime.parse(json['joiningDate']),
      isActive: json['isActive'] ?? true,
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  // Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'email': email,
      'phoneNumber': phoneNumber,
      'gender': gender,
      'subjects': subjects,
      'assignedClasses': assignedClasses,
      'photoUrl': photoUrl,
      'address': address,
      'qualification': qualification,
      'dateOfBirth': dateOfBirth.toIso8601String(),
      'joiningDate': joiningDate.toIso8601String(),
      'isActive': isActive,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  // Create a copy with updated fields
  Teacher copyWith({
    String? id,
    String? fullName,
    String? email,
    String? phoneNumber,
    String? gender,
    List<String>? subjects,
    List<String>? assignedClasses,
    String? photoUrl,
    String? address,
    String? qualification,
    DateTime? dateOfBirth,
    DateTime? joiningDate,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Teacher(
      id: id ?? this.id,
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      gender: gender ?? this.gender,
      subjects: subjects ?? this.subjects,
      assignedClasses: assignedClasses ?? this.assignedClasses,
      photoUrl: photoUrl ?? this.photoUrl,
      address: address ?? this.address,
      qualification: qualification ?? this.qualification,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      joiningDate: joiningDate ?? this.joiningDate,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  // Get display name (First Name)
  String get firstName {
    final names = fullName.split(' ');
    return names.isNotEmpty ? names.first : fullName;
  }

  // Get age
  int get age {
    final now = DateTime.now();
    int age = now.year - dateOfBirth.year;
    if (now.month < dateOfBirth.month || 
        (now.month == dateOfBirth.month && now.day < dateOfBirth.day)) {
      age--;
    }
    return age;
  }

  // Get experience in years
  int get experience {
    final now = DateTime.now();
    int experience = now.year - joiningDate.year;
    if (now.month < joiningDate.month || 
        (now.month == joiningDate.month && now.day < joiningDate.day)) {
      experience--;
    }
    return experience;
  }

  // Get subjects as comma-separated string
  String get subjectsDisplay => subjects.join(', ');

  // Get assigned classes as comma-separated string
  String get assignedClassesDisplay => assignedClasses.join(', ');
} 