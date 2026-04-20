import 'package:flutter_test/flutter_test.dart';
import 'package:smart_campus/services/auth_service.dart';
import 'package:smart_campus/core/constants/app_constants.dart';

void main() {
  group('AuthService Tests', () {
    test('Email validation should work correctly', () {
      // Valid emails
      expect(AuthService.isValidEmail('test@example.com'), true);
      expect(AuthService.isValidEmail('user.name@domain.co.uk'), true);
      expect(AuthService.isValidEmail('admin@school.com'), true);
      
      // Invalid emails
      expect(AuthService.isValidEmail(''), false);
      expect(AuthService.isValidEmail('invalid-email'), false);
      expect(AuthService.isValidEmail('test@'), false);
      expect(AuthService.isValidEmail('@domain.com'), false);
    });

    test('Password validation should work correctly', () {
      // Valid passwords
      expect(AuthService.isValidPassword('password123'), true);
      expect(AuthService.isValidPassword('123456'), true);
      expect(AuthService.isValidPassword('admin123'), true);
      
      // Invalid passwords
      expect(AuthService.isValidPassword(''), false);
      expect(AuthService.isValidPassword('12345'), false); // too short
    });

    test('School ID validation should work correctly', () {
      // Valid school IDs
      expect(AuthService.isValidSchoolId('SCH-2025-A12'), true);
      expect(AuthService.isValidSchoolId('SCH-2025-B45'), true);
      expect(AuthService.isValidSchoolId('SCH-2024-Z99'), true);
      
      // Invalid school IDs
      expect(AuthService.isValidSchoolId(''), false);
      expect(AuthService.isValidSchoolId('SCH-2025-A1'), false); // wrong format
      expect(AuthService.isValidSchoolId('SCH-2025-12'), false); // missing letter
      expect(AuthService.isValidSchoolId('SCH-25-A12'), false); // wrong year format
    });

    test('User role detection should work correctly', () {
      expect(AuthService.getUserRoleFromEmail('admin@school.com'), AppConstants.roleSuperAdmin);
      expect(AuthService.getUserRoleFromEmail('teacher@school.com'), AppConstants.roleTeacher);
      expect(AuthService.getUserRoleFromEmail('parent@example.com'), AppConstants.roleParent);
      expect(AuthService.getUserRoleFromEmail('user@gmail.com'), AppConstants.roleParent);
    });

    test('Role privilege checks should work correctly', () {
      expect(AuthService.isAdmin(AppConstants.roleSuperAdmin), true);
      expect(AuthService.isAdmin(AppConstants.roleTeacher), false);
      expect(AuthService.isAdmin(AppConstants.roleParent), false);
      
      expect(AuthService.isTeacher(AppConstants.roleSuperAdmin), true);
      expect(AuthService.isTeacher(AppConstants.roleTeacher), true);
      expect(AuthService.isTeacher(AppConstants.roleParent), false);
      
      expect(AuthService.isParent(AppConstants.roleParent), true);
      expect(AuthService.isParent(AppConstants.roleTeacher), false);
      expect(AuthService.isParent(AppConstants.roleSuperAdmin), false);
    });

    test('Login input validation should work correctly', () {
      // Valid inputs
      final validResult = AuthService.validateLoginInputs(
        email: 'test@example.com',
        password: 'password123',
        schoolId: 'SCH-2025-A12',
        isSuperAdmin: false,
      );
      expect(validResult['isValid'], true);
      expect(validResult['errors'], isEmpty);
      
      // Invalid inputs
      final invalidResult = AuthService.validateLoginInputs(
        email: 'invalid-email',
        password: '123',
        schoolId: 'invalid-school-id',
        isSuperAdmin: false,
      );
      expect(invalidResult['isValid'], false);
      expect(invalidResult['errors'], isNotEmpty);
      
      // Super admin validation (no school ID required)
      final superAdminResult = AuthService.validateLoginInputs(
        email: 'admin@school.com',
        password: 'admin123',
        isSuperAdmin: true,
      );
      expect(superAdminResult['isValid'], true);
      expect(superAdminResult['errors'], isEmpty);
    });

    test('Demo credentials should be available', () {
      final credentials = AuthService.getDemoCredentials();
      expect(credentials, isNotEmpty);
      expect(credentials['super_admin'], isNotNull);
      expect(credentials['teacher'], isNotNull);
      expect(credentials['parent'], isNotNull);
      expect(credentials['school_ids'], isNotNull);
    });
  });
} 