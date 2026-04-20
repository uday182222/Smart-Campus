# Smart Campus Authentication System

## Overview

The Smart Campus application features a comprehensive authentication system that supports multiple user roles with role-based access control. The system is designed to work with both mock authentication (for development/demo) and real Firebase authentication (for production).

## Features

### 🔐 Multi-Role Authentication
- **Super Administrator**: Full system access, can manage all schools
- **School Administrator**: School-specific access with comprehensive management tools
- **Teacher**: School-specific access with teaching tools
- **Parent**: School-specific access to view student information

### 🏫 School-Based Access
- Users must provide a valid School ID to access school-specific features
- School ID format: `SCH-YYYY-XXX` (e.g., `SCH-2025-A12`)
- Super administrators can access all schools

### 🛡️ Security Features
- Email format validation
- Password strength requirements (minimum 6 characters)
- School ID format validation
- Role-based access control
- Session management

## User Roles & Permissions

### Super Administrator
- **Login**: `admin@school.com` / `admin123`
- **Access**: All schools and system-wide features
- **Features**:
  - Manage all schools
  - User management
  - System statistics
  - Global announcements

### School Administrator
- **Login**: `schooladmin@school.com` / `schooladmin123`
- **Access**: School-specific features with comprehensive management
- **Features**:
  - Manage users within the school
  - Monitor attendance across classes
  - View and export exam reports
  - Manage announcements
  - Track fees and payments
  - Export school data
  - School-specific analytics

### Teacher
- **Login**: `teacher@school.com` / `teacher123`
- **Access**: School-specific features
- **Features**:
  - Mark attendance
  - Assign homework
  - Enter exam marks
  - Add student remarks
  - View timetable

### Parent
- **Login**: Any email / `parent123`
- **Access**: School-specific features
- **Features**:
  - View attendance
  - Check homework
  - View announcements
  - Access events

## Demo Schools

### Lotus Public School
- **School ID**: `SCH-2025-A12`
- **Address**: 123 Main Street, City
- **Phone**: +1-555-123-4567
- **Email**: info@lotuspublic.edu

### Sunrise Academy
- **School ID**: `SCH-2025-B45`
- **Address**: 456 Oak Avenue, Town
- **Phone**: +1-555-987-6543
- **Email**: info@sunriseacademy.edu

## Demo Credentials

### Super Administrator
- **Email**: `admin@school.com`
- **Password**: `admin123`

### School Administrator
- **Email**: `schooladmin@school.com`
- **Password**: `schooladmin123`

### Teacher
- **Email**: `teacher@school.com`
- **Password**: `teacher123`

### Parent
- **Email**: Any email format
- **Password**: `parent123`

## Authentication Flow

### 1. Login Process
```
User enters credentials → Validation → Role detection → School verification → Access granted
```

### 2. Validation Steps
1. **Input Validation**: Check for required fields
2. **Email Validation**: Verify email format
3. **Password Validation**: Ensure minimum length
4. **School ID Validation**: Verify format and existence
5. **Credential Verification**: Check against valid credentials
6. **Role Assignment**: Determine user role based on email

### 3. Session Management
- User session persists until logout
- Automatic session restoration on app restart
- Secure logout functionality

## API Reference

### AuthService Class

#### Static Methods

##### `signInWithSchoolId()`
Authenticate regular users with school ID.

```dart
Future<Map<String, dynamic>> signInWithSchoolId({
  required String email,
  required String password,
  required String schoolId,
})
```

**Returns:**
- `success`: Boolean indicating authentication result
- `userRole`: String role identifier
- `user`: UserModel object
- `school`: SchoolModel object
- `error`: Error message (if failed)

##### `signInAsSuperAdmin()`
Authenticate super administrators (no school ID required).

```dart
Future<Map<String, dynamic>> signInAsSuperAdmin({
  required String email,
  required String password,
})
```

##### `validateLoginInputs()`
Validate login form inputs.

```dart
Map<String, dynamic> validateLoginInputs({
  required String email,
  required String password,
  String? schoolId,
  bool isSuperAdmin = false,
})
```

**Returns:**
- `isValid`: Boolean indicating validation result
- `errors`: List of error messages

##### `isValidEmail()`
Validate email format.

```dart
static bool isValidEmail(String email)
```

##### `isValidPassword()`
Validate password strength.

```dart
static bool isValidPassword(String password)
```

##### `isValidSchoolId()`
Validate school ID format.

```dart
static bool isValidSchoolId(String schoolId)
```

##### `getUserRoleFromEmail()`
Determine user role from email address.

```dart
static String getUserRoleFromEmail(String email)
```

##### `signOut()`
Sign out current user.

```dart
static Future<void> signOut()
```

##### `checkAuthState()`
Check if user is currently authenticated.

```dart
static Future<Map<String, dynamic>> checkAuthState()
```

## Error Codes

| Code | Description |
|------|-------------|
| `missing-fields` | Required fields are empty |
| `invalid-email` | Email format is invalid |
| `invalid-password` | Password doesn't meet requirements |
| `invalid-school-id` | School ID format is invalid |
| `school-not-found` | School ID doesn't exist |
| `invalid-credentials` | Email/password combination is incorrect |
| `unknown-error` | Unexpected error occurred |

## Implementation Details

### Mock Authentication
For development and demo purposes, the system uses mock authentication with hardcoded credentials:

- **Super Admin**: `admin@school.com` / `admin123`
- **Teacher**: `teacher@school.com` / `teacher123`
- **Parent**: Any email / `parent123`

### Real Firebase Authentication
For production, the system supports real Firebase authentication:

```dart
Future<Map<String, dynamic>> signInWithRealFirebase({
  required String email,
  required String password,
  required String schoolId,
})
```

### User Model
```dart
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
}
```

### School Model
```dart
class SchoolModel {
  final String id;
  final String name;
  final String schoolId;
  final String address;
  final String phone;
  final String email;
  final String adminEmail;
  final String adminName;
  final String status;
  final DateTime createdAt;
}
```

## Testing

Run the authentication tests:

```bash
flutter test test/auth_test.dart
```

The test suite covers:
- Email validation
- Password validation
- School ID validation
- User role detection
- Role privilege checks
- Login input validation
- Demo credentials availability

## Security Considerations

### Development
- Mock authentication for testing
- Hardcoded credentials for demo
- No sensitive data exposure

### Production
- Real Firebase authentication
- Secure password handling
- Token-based session management
- Role-based access control
- Input sanitization

## Future Enhancements

1. **Two-Factor Authentication**: Add 2FA for enhanced security
2. **Password Reset**: Implement password reset functionality
3. **Account Lockout**: Add account lockout after failed attempts
4. **Audit Logging**: Track authentication events
5. **SSO Integration**: Support for single sign-on
6. **Biometric Authentication**: Add fingerprint/face recognition

## Troubleshooting

### Common Issues

1. **"Invalid School ID"**
   - Ensure school ID follows format: `SCH-YYYY-XXX`
   - Check that the school exists in the demo data

2. **"Invalid credentials"**
   - Verify email and password match demo credentials
   - Check for extra spaces in input fields

3. **"School not found"**
   - Use one of the demo school IDs: `SCH-2025-A12` or `SCH-2025-B45`

4. **Login not working**
   - Clear app data and restart
   - Check network connectivity (for Firebase auth)
   - Verify Firebase configuration

### Debug Information

Enable debug logging by checking the console output for:
- Authentication attempts
- Validation results
- Error messages
- Session state changes

## Support

For authentication-related issues:
1. Check the error codes and messages
2. Verify input format and credentials
3. Test with demo credentials
4. Review console logs for debugging information 