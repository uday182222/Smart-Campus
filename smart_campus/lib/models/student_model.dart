class Student {
  final String id;
  final String name;
  final String className;
  final String rollNo;
  final String? profileUrl;
  final String email;
  final String phone;
  final String address;
  final String parentName;
  final String parentPhone;
  final DateTime dateOfBirth;
  final String gender;
  final String bloodGroup;
  final String admissionDate;

  Student({
    required this.id,
    required this.name,
    required this.className,
    required this.rollNo,
    this.profileUrl,
    required this.email,
    required this.phone,
    required this.address,
    required this.parentName,
    required this.parentPhone,
    required this.dateOfBirth,
    required this.gender,
    required this.bloodGroup,
    required this.admissionDate,
  });

  // Create a copy of student with updated fields
  Student copyWith({
    String? id,
    String? name,
    String? className,
    String? rollNo,
    String? profileUrl,
    String? email,
    String? phone,
    String? address,
    String? parentName,
    String? parentPhone,
    DateTime? dateOfBirth,
    String? gender,
    String? bloodGroup,
    String? admissionDate,
  }) {
    return Student(
      id: id ?? this.id,
      name: name ?? this.name,
      className: className ?? this.className,
      rollNo: rollNo ?? this.rollNo,
      profileUrl: profileUrl ?? this.profileUrl,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      parentName: parentName ?? this.parentName,
      parentPhone: parentPhone ?? this.parentPhone,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      gender: gender ?? this.gender,
      bloodGroup: bloodGroup ?? this.bloodGroup,
      admissionDate: admissionDate ?? this.admissionDate,
    );
  }

  // Convert to Map for JSON serialization
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'className': className,
      'rollNo': rollNo,
      'profileUrl': profileUrl,
      'email': email,
      'phone': phone,
      'address': address,
      'parentName': parentName,
      'parentPhone': parentPhone,
      'dateOfBirth': dateOfBirth.toIso8601String(),
      'gender': gender,
      'bloodGroup': bloodGroup,
      'admissionDate': admissionDate,
    };
  }

  // Create from Map for JSON deserialization
  factory Student.fromMap(Map<String, dynamic> map) {
    return Student(
      id: map['id'],
      name: map['name'],
      className: map['className'],
      rollNo: map['rollNo'],
      profileUrl: map['profileUrl'],
      email: map['email'],
      phone: map['phone'],
      address: map['address'],
      parentName: map['parentName'],
      parentPhone: map['parentPhone'],
      dateOfBirth: DateTime.parse(map['dateOfBirth']),
      gender: map['gender'],
      bloodGroup: map['bloodGroup'],
      admissionDate: map['admissionDate'],
    );
  }
}

// Mock data for students
List<Student> mockStudents = [
  Student(
    id: '1',
    name: 'Alice Johnson',
    className: 'Class 10A',
    rollNo: '101',
    email: 'alice.johnson@school.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street, City, State 12345',
    parentName: 'John Johnson',
    parentPhone: '+1 (555) 123-4568',
    dateOfBirth: DateTime(2008, 3, 15),
    gender: 'Female',
    bloodGroup: 'O+',
    admissionDate: '2020-09-01',
  ),
  Student(
    id: '2',
    name: 'Bob Smith',
    className: 'Class 9B',
    rollNo: '205',
    email: 'bob.smith@school.com',
    phone: '+1 (555) 234-5678',
    address: '456 Oak Avenue, City, State 12345',
    parentName: 'Mary Smith',
    parentPhone: '+1 (555) 234-5679',
    dateOfBirth: DateTime(2009, 7, 22),
    gender: 'Male',
    bloodGroup: 'A+',
    admissionDate: '2021-09-01',
  ),
  Student(
    id: '3',
    name: 'Carol Davis',
    className: 'Class 11C',
    rollNo: '311',
    email: 'carol.davis@school.com',
    phone: '+1 (555) 345-6789',
    address: '789 Pine Road, City, State 12345',
    parentName: 'Robert Davis',
    parentPhone: '+1 (555) 345-6790',
    dateOfBirth: DateTime(2007, 11, 8),
    gender: 'Female',
    bloodGroup: 'B+',
    admissionDate: '2019-09-01',
  ),
  Student(
    id: '4',
    name: 'David Wilson',
    className: 'Class 8A',
    rollNo: '408',
    email: 'david.wilson@school.com',
    phone: '+1 (555) 456-7890',
    address: '321 Elm Street, City, State 12345',
    parentName: 'Sarah Wilson',
    parentPhone: '+1 (555) 456-7891',
    dateOfBirth: DateTime(2010, 4, 12),
    gender: 'Male',
    bloodGroup: 'AB+',
    admissionDate: '2022-09-01',
  ),
  Student(
    id: '5',
    name: 'Emma Brown',
    className: 'Class 12D',
    rollNo: '412',
    email: 'emma.brown@school.com',
    phone: '+1 (555) 567-8901',
    address: '654 Maple Drive, City, State 12345',
    parentName: 'Michael Brown',
    parentPhone: '+1 (555) 567-8902',
    dateOfBirth: DateTime(2006, 9, 30),
    gender: 'Female',
    bloodGroup: 'O-',
    admissionDate: '2018-09-01',
  ),
]; 