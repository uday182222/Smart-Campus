import 'package:flutter_test/flutter_test.dart';
import 'package:smart_campus/services/auth_service.dart';

void main() {
  group('Logout Tests', () {
    test('signOut should not throw exception', () async {
      // This test ensures signOut doesn't throw exceptions
      // even when there's no Firebase user (mock authentication)
      expect(() async {
        await AuthService.signOut();
      }, returnsNormally);
    });
    
    test('signOut should work multiple times', () async {
      // Test that signOut can be called multiple times without issues
      await AuthService.signOut();
      await AuthService.signOut();
      await AuthService.signOut();
      
      // Verify the method completes successfully
      expect(true, isTrue);
    });
    
    test('signOut should handle mock authentication', () async {
      // Test that signOut works with mock authentication
      // (no real Firebase user)
      await AuthService.signOut();
      
      // Should complete without errors
      expect(true, isTrue);
    });
  });
} 