import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../core/constants/app_constants.dart';
import '../models/user_model.dart';
import '../models/school_model.dart';

class AuthService { 
  static final FirebaseAuth _auth = FirebaseAuth.instance;
  static UserModel? _currentUserModel; // Store current user model
  static SchoolModel? _currentSchool; // Store current school
  
  // Get current user
  static User? get currentUser => _auth.currentUser;
  
  // Get current user (method version for compatibility)
  static User? getCurrentUser() => _auth.currentUser;
  
  // Check if user is logged in
  static bool get isLoggedIn => currentUser != null;
  
  // Get current user model
  static UserModel? get currentUserModel => _currentUserModel;
  
  // Get current school
  static SchoolModel? get currentSchool => _currentSchool;
  
  // Sign in with email, password, and school ID
  static Future<Map<String, dynamic>> signInWithSchoolId({
    required String email,
    required String password,
    required String schoolId,
  }) async {
    try {
      debugPrint('Attempting to sign in with email: $email and school ID: $schoolId');
      
      // Validate inputs
      if (email.isEmpty || password.isEmpty || schoolId.isEmpty) {
        return {
          'success': false,
          'error': 'All fields are required',
          'code': 'missing-fields',
        };
      }
      
      // Validate email format
      if (!isValidEmail(email)) {
        return {
          'success': false,
          'error': 'Please enter a valid email address',
          'code': 'invalid-email',
        };
      }
      
      // Validate school ID format
      if (!isValidSchoolId(schoolId)) {
        return {
          'success': false,
          'error': 'Invalid School ID format. Please check your School ID.',
          'code': 'invalid-school-id',
        };
      }
      
      // Check if school exists
      final school = await _getSchoolBySchoolId(schoolId);
      if (school == null) {
        return {
          'success': false,
          'error': 'School not found. Please check your School ID.',
          'code': 'school-not-found',
        };
      }

      // Real Firebase Auth only
      final credential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      if (credential.user == null) {
        return {
          'success': false,
          'error': 'Authentication failed',
          'code': 'user-not-found',
        };
      }

      final userModel = await _getUserModelFromFirestore(credential.user!);
      _currentUserModel = userModel;
      _currentSchool = school;
      debugPrint('Authentication successful for role: ${userModel.role} in school: ${school.name}');
      return {
        'success': true,
        'userRole': userModel.role,
        'user': _currentUserModel,
        'school': school,
      };
    } on FirebaseAuthException catch (e) {
      debugPrint('Firebase Auth Error: ${e.code} - ${e.message}');
      return {
        'success': false,
        'error': e.message ?? 'Authentication failed',
        'code': e.code,
      };
    } catch (e) {
      debugPrint('Unexpected error during authentication: $e');
      return {
        'success': false,
        'error': 'An unexpected error occurred',
        'code': 'unknown-error',
      };
    }
  }
  
  // Super Admin login (no school ID required) — Firebase Auth only
  static Future<Map<String, dynamic>> signInAsSuperAdmin({
    required String email,
    required String password,
  }) async {
    try {
      debugPrint('Attempting super admin login with email: $email');

      if (email.isEmpty || password.isEmpty) {
        return {
          'success': false,
          'error': 'Email and password are required',
          'code': 'missing-fields',
        };
      }

      if (!isValidEmail(email)) {
        return {
          'success': false,
          'error': 'Please enter a valid email address',
          'code': 'invalid-email',
        };
      }

      final credential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      if (credential.user == null) {
        return {
          'success': false,
          'error': 'Authentication failed',
          'code': 'user-not-found',
        };
      }

      final userModel = await _getUserModelFromFirestore(credential.user!);
      if (userModel.role != AppConstants.roleSuperAdmin) {
        await _auth.signOut();
        return {
          'success': false,
          'error': 'Access denied. Super admin only.',
          'code': 'invalid-credentials',
        };
      }

      _currentUserModel = userModel;
      _currentSchool = null;
      debugPrint('Super admin authentication successful');
      return {
        'success': true,
        'userRole': AppConstants.roleSuperAdmin,
        'user': _currentUserModel,
        'school': null,
      };
    } on FirebaseAuthException catch (e) {
      debugPrint('Firebase Auth Error: ${e.code} - ${e.message}');
      return {
        'success': false,
        'error': e.message ?? 'Authentication failed',
        'code': e.code,
      };
    } catch (e) {
      debugPrint('Error during super admin authentication: $e');
      return {
        'success': false,
        'error': 'An unexpected error occurred',
        'code': 'unknown-error',
      };
    }
  }
  
  // Create a new school (Super Admin only)
  static Future<Map<String, dynamic>> createSchool({
    required String schoolName,
    required String address,
    required String phone,
    required String email,
    required String adminEmail,
    required String adminName,
  }) async {
    try {
      // Validate inputs
      if (schoolName.isEmpty || address.isEmpty || phone.isEmpty || 
          email.isEmpty || adminEmail.isEmpty || adminName.isEmpty) {
        return {
          'success': false,
          'error': 'All fields are required',
          'code': 'missing-fields',
        };
      }
      
      // Validate email format
      if (!isValidEmail(email) || !isValidEmail(adminEmail)) {
        return {
          'success': false,
          'error': 'Please enter valid email addresses',
          'code': 'invalid-email',
        };
      }
      
      // Generate unique school ID
      final schoolId = _generateSchoolId();
      
      // Create school model
      final school = SchoolModel(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        name: schoolName,
        schoolId: schoolId,
        address: address,
        phone: phone,
        email: email,
        adminEmail: adminEmail,
        adminName: adminName,
        status: SchoolStatus.active,
        createdAt: DateTime.now(),
      );
      
      debugPrint('School created successfully: $schoolName with ID: $schoolId');
      return {
        'success': true,
        'school': school,
        'message': 'School created successfully. School ID: $schoolId',
      };
    } catch (e) {
      debugPrint('Error creating school: $e');
      return {
        'success': false,
        'error': 'Failed to create school',
        'code': 'creation-failed',
      };
    }
  }
  
  // Get school by school ID
  static Future<SchoolModel?> _getSchoolBySchoolId(String schoolId) async {
    // Mock schools for demo
    final mockSchools = [
      SchoolModel(
        id: '1',
        name: 'Lotus Public School',
        schoolId: 'SCH-2025-A12',
        address: '123 Main Street, City',
        phone: '+1-555-123-4567',
        email: 'info@lotuspublic.edu',
        adminEmail: 'admin@lotuspublic.edu',
        adminName: 'Principal Smith',
        status: SchoolStatus.active,
        createdAt: DateTime(2025, 1, 1),
      ),
      SchoolModel(
        id: '2',
        name: 'Sunrise Academy',
        schoolId: 'SCH-2025-B45',
        address: '456 Oak Avenue, Town',
        phone: '+1-555-987-6543',
        email: 'info@sunriseacademy.edu',
        adminEmail: 'admin@sunriseacademy.edu',
        adminName: 'Principal Johnson',
        status: SchoolStatus.active,
        createdAt: DateTime(2025, 1, 15),
      ),
    ];
    
    try {
      return mockSchools.firstWhere((school) => school.schoolId == schoolId);
    } catch (e) {
      return null;
    }
  }
  
  // Validate school ID format
  static bool isValidSchoolId(String schoolId) {
    // Format: SCH-YYYY-XXX (e.g., SCH-2025-A12)
    final regex = RegExp(r'^SCH-\d{4}-[A-Z]\d{2}$');
    return regex.hasMatch(schoolId);
  }
  
  // Generate unique school ID
  static String _generateSchoolId() {
    final year = DateTime.now().year;
    final randomLetter = String.fromCharCode(65 + (DateTime.now().millisecond % 26)); // A-Z
    final randomNumber = (DateTime.now().millisecond % 100).toString().padLeft(2, '0');
    return 'SCH-$year-$randomLetter$randomNumber';
  }
  
  // Get all schools (for Super Admin)
  static Future<List<SchoolModel>> getAllSchools() async {
    return [
      SchoolModel(
        id: '1',
        name: 'Lotus Public School',
        schoolId: 'SCH-2025-A12',
        address: '123 Main Street, City',
        phone: '+1-555-123-4567',
        email: 'info@lotuspublic.edu',
        adminEmail: 'admin@lotuspublic.edu',
        adminName: 'Principal Smith',
        status: SchoolStatus.active,
        createdAt: DateTime(2025, 1, 1),
      ),
      SchoolModel(
        id: '2',
        name: 'Sunrise Academy',
        schoolId: 'SCH-2025-B45',
        address: '456 Oak Avenue, Town',
        phone: '+1-555-987-6543',
        email: 'info@sunriseacademy.edu',
        adminEmail: 'admin@sunriseacademy.edu',
        adminName: 'Principal Johnson',
        status: SchoolStatus.active,
        createdAt: DateTime(2025, 1, 15),
      ),
    ];
  }
  
  // Real Firebase authentication (for production)
  static Future<Map<String, dynamic>> signInWithRealFirebase({
    required String email,
    required String password,
    required String schoolId,
  }) async {
    try {
      debugPrint('Attempting real Firebase authentication with email: $email and school ID: $schoolId');
      
      final credential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      if (credential.user != null) {
        // Get user role from email (in production, this would come from Firestore)
        final userRole = getUserRoleFromEmail(email);
        
        // Validate school ID and get school info
        final school = await _getSchoolBySchoolId(schoolId);
        if (school == null) {
          return {
            'success': false,
            'error': 'School not found. Please check your School ID.',
            'code': 'school-not-found',
          };
        }
        
        // Create UserModel and store it
        _currentUserModel = UserModel.fromFirebaseUser(credential.user!, userRole);
        _currentSchool = school;
        
        debugPrint('Real Firebase authentication successful for role: $userRole');
        return {
          'success': true,
          'userRole': userRole,
          'user': _currentUserModel,
          'school': school,
        };
      } else {
        throw FirebaseAuthException(
          code: 'user-not-found',
          message: 'User not found',
        );
      }
    } on FirebaseAuthException catch (e) {
      debugPrint('Firebase Auth Error: ${e.code} - ${e.message}');
      return {
        'success': false,
        'error': e.message ?? 'Authentication failed',
        'code': e.code,
      };
    } catch (e) {
      debugPrint('Unexpected error during authentication: $e');
      return {
        'success': false,
        'error': 'An unexpected error occurred',
        'code': 'unknown-error',
      };
    }
  }
  
  /// Fetches user profile from Firestore users collection; falls back to Firebase user + email-based role.
  static Future<UserModel> _getUserModelFromFirestore(User user) async {
    try {
      final doc = await FirebaseFirestore.instance
          .collection(AppConfig.colUsers)
          .doc(user.uid)
          .get();
      if (doc.exists && doc.data() != null) {
        final data = Map<String, dynamic>.from(doc.data()!);
        data['id'] = doc.id;
        if (data['name'] != null && data['role'] != null) {
          return UserModel.fromMap(data);
        }
      }
    } catch (e) {
      debugPrint('Error fetching user from Firestore: $e');
    }
    final role = getUserRoleFromEmail(user.email ?? '');
    return UserModel.fromFirebaseUser(user, role);
  }

  // Get display name from email
  static String _getDisplayNameFromEmail(String email) {
    final parts = email.split('@');
    if (parts.isNotEmpty) {
      final name = parts[0];
      return name.split('.').map((part) => 
        part[0].toUpperCase() + part.substring(1)
      ).join(' ');
    }
    return 'User';
  }
  
  // Sign out
  static Future<void> signOut() async {
    try {
      // Clear stored user model and school (for both mock and real auth)
      _currentUserModel = null;
      _currentSchool = null;
      
      // Only call Firebase signOut if there's a real Firebase user
      if (_auth.currentUser != null) {
        await _auth.signOut();
        debugPrint('Firebase user signed out successfully');
      } else {
        debugPrint('Mock user signed out successfully');
      }
      
      debugPrint('User signed out successfully');
    } catch (e) {
      debugPrint('Error signing out: $e');
      // Even if Firebase signOut fails, clear the local state
      _currentUserModel = null;
      _currentSchool = null;
    }
  }
  
  // Check authentication state and auto-login
  static Future<Map<String, dynamic>> checkAuthState() async {
    try {
      final user = _auth.currentUser;
      if (user != null) {
        _currentUserModel = await _getUserModelFromFirestore(user);
        debugPrint('User already logged in: ${user.email}');
        return {
          'success': true,
          'userRole': _currentUserModel!.role,
          'user': _currentUserModel,
          'isLoggedIn': true,
        };
      } else {
        // No user logged in
        debugPrint('No user currently logged in');
        return {
          'success': false,
          'isLoggedIn': false,
        };
      }
    } catch (e) {
      debugPrint('Error checking auth state: $e');
      return {
        'success': false,
        'error': 'Error checking authentication state',
        'isLoggedIn': false,
      };
    }
  }
  
  // Listen to authentication state changes
  static Stream<User?> get authStateChanges => _auth.authStateChanges();
  
  // Get user role from email (for role-based access)
  static String getUserRoleFromEmail(String email) {
    email = email.toLowerCase();
    if (email.contains('admin@school.com')) {
      return AppConstants.roleSuperAdmin;
    } else if (email.contains('schooladmin@school.com')) {
      return AppConstants.roleSchoolAdmin;
    } else if (email.contains('teacher@school.com')) {
      return AppConstants.roleTeacher;
    } else {
      return AppConstants.roleParent;
    }
  }
  
  // Check if user has admin privileges
  static bool isAdmin(String userRole) {
    return userRole == AppConstants.roleSuperAdmin;
  }

  // Check if user has school admin privileges
  static bool isSchoolAdmin(String userRole) {
    return userRole == AppConstants.roleSchoolAdmin;
  }

  // Check if user has teacher privileges
  static bool isTeacher(String userRole) {
    return userRole == AppConstants.roleTeacher || userRole == AppConstants.roleSuperAdmin || userRole == AppConstants.roleSchoolAdmin;
  }
  
  // Check if user has parent privileges
  static bool isParent(String userRole) {
    return userRole == AppConstants.roleParent;
  }
  
  // Validate email format
  static bool isValidEmail(String email) {
    return RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email);
  }
  
  // Validate password strength
  static bool isValidPassword(String password) {
    return password.length >= 6;
  }
  
  // Get current user model (for future use)
  static UserModel? getCurrentUserModel() {
    return _currentUserModel;
  }
  
  // Update user profile
  static Future<bool> updateUserProfile({
    required String displayName,
    String? photoURL,
  }) async {
    try {
      final user = currentUser;
      if (user != null) {
        await user.updateDisplayName(displayName);
        if (photoURL != null) {
          await user.updatePhotoURL(photoURL);
        }
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Error updating user profile: $e');
      return false;
    }
  }
  
  // Send password reset email
  static Future<bool> sendPasswordResetEmail(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email);
      debugPrint('Password reset email sent to: $email');
      return true;
    } catch (e) {
      debugPrint('Error sending password reset email: $e');
      return false;
    }
  }
  
  // Create user with email and password (for future use)
  static Future<Map<String, dynamic>> createUserWithEmailAndPassword({
    required String email,
    required String password,
    required String displayName,
    required String role,
  }) async {
    try {
      final credential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      // Update display name
      await credential.user?.updateDisplayName(displayName);
      
      // Create UserModel
      final userModel = UserModel.fromFirebaseUser(credential.user!, role);
      
      return {
        'success': true,
        'user': userModel,
      };
    } on FirebaseAuthException catch (e) {
      return {
        'success': false,
        'error': e.message ?? 'Failed to create user',
        'code': e.code,
      };
    }
  }
  
  // Get demo credentials for testing
  static Map<String, String> getDemoCredentials() {
    return {
      'super_admin': 'admin@school.com / admin123',
      'school_admin': 'schooladmin@school.com / schooladmin123',
      'teacher': 'teacher@school.com / teacher123',
      'parent': 'any@email.com / parent123',
      'school_ids': 'SCH-2025-A12, SCH-2025-B45',
    };
  }
  
  // Validate all inputs for login
  static Map<String, dynamic> validateLoginInputs({
    required String email,
    required String password,
    String? schoolId,
    bool isSuperAdmin = false,
  }) {
    final errors = <String>[];
    
    if (email.isEmpty) {
      errors.add('Email is required');
    } else if (!isValidEmail(email)) {
      errors.add('Please enter a valid email address');
    }
    
    if (password.isEmpty) {
      errors.add('Password is required');
    } else if (!isValidPassword(password)) {
      errors.add('Password must be at least 6 characters');
    }
    
    if (!isSuperAdmin && schoolId != null) {
      if (schoolId.isEmpty) {
        errors.add('School ID is required');
      } else if (!isValidSchoolId(schoolId)) {
        errors.add('Please enter a valid School ID format (SCH-YYYY-XXX)');
      }
    }
    
    return {
      'isValid': errors.isEmpty,
      'errors': errors,
    };
  }
} 