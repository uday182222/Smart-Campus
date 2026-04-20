# Smart Campus - Firestore Security System

This document explains the Role-Based Access Control (RBAC) system implemented for the Smart Campus School Management + Transport app.

## 🔐 Security Overview

The security system uses **Firebase Authentication custom claims** combined with **Firestore security rules** to enforce role-based access control. This ensures that:

- Users can only access data they're authorized to see
- Role information is stored securely in Firebase Auth (not in Firestore documents)
- All access control is enforced server-side by Firestore
- No client-side security bypasses are possible

## 👥 User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| `admin` | Super Administrator | Full access to all data across all schools |
| `principal` | School Principal | Full access to their school's data only |
| `teacher` | Teacher | Read/write access to students, homework, attendance within their school |
| `parent` | Parent | Read-only access to their child's data and school announcements |
| `helper` | Transport Helper | Read-only access to assigned routes, can update stop status |

## 🏗️ Architecture

### 1. Authentication Flow
```
User Login → Firebase Auth → Custom Claims Set → Firestore Rules Check → Data Access
```

### 2. Custom Claims Structure
```javascript
{
  "role": "teacher",           // User's role
  "schoolId": "SCH-2025-A12",  // School ID (not required for admin)
  "isSuperAdmin": true         // Additional claims (optional)
}
```

### 3. Firestore Collections
- `schools/{schoolId}` - School information
- `students/{studentId}` - Student profiles and data
- `teachers/{teacherId}` - Teacher profiles and assignments
- `parents/{parentId}` - Parent profiles
- `routes/{routeId}` - Transport routes
- `announcements/{announcementId}` - School announcements
- `homework/{homeworkId}` - Homework assignments
- `attendance/{attendanceId}` - Attendance records
- `transportStops/{stopId}` - Transport stop tracking

## 🛡️ Security Rules

### Key Security Principles

1. **No Role Storage in Documents**: Roles are only stored in Firebase Auth custom claims
2. **School Isolation**: Users can only access data from their assigned school
3. **Hierarchical Access**: Higher roles can access lower role data within their scope
4. **Field-Level Security**: Some roles can only update specific fields
5. **Relationship Validation**: Access is validated based on user relationships (e.g., parent-child)

### Access Matrix

| Collection | Admin | Principal | Teacher | Parent | Helper |
|------------|-------|-----------|---------|--------|--------|
| `schools` | R/W All | R/W Own | - | - | - |
| `students` | R/W All | R/W Own School | R/W Assigned | R Own Child | - |
| `teachers` | R/W All | R/W Own School | R Own Profile | - | - |
| `parents` | R/W All | R/W Own School | - | R Own Profile | - |
| `routes` | R/W All | R/W Own School | - | - | R Assigned, W Status |
| `announcements` | R/W All | R/W Own School | R/W Own School | R Own School | - |
| `homework` | R/W All | R/W Own School | R/W Own School | R Own Child | - |
| `attendance` | R/W All | R/W Own School | R/W Own School | R Own Child | - |
| `transportStops` | R/W All | R/W Own School | - | - | R/W Assigned |

## 🚀 Setup Instructions

### 1. Deploy Firestore Rules

```bash
# Deploy the security rules to your Firebase project
firebase deploy --only firestore:rules
```

### 2. Set Up Custom Claims

1. **Install Dependencies**:
   ```bash
   npm install firebase-admin
   ```

2. **Get Service Account Key**:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate new private key
   - Save as `service-account-key.json`

3. **Set Custom Claims**:
   ```bash
   node setCustomUserClaims.js
   ```

### 3. Example: Setting User Roles

```javascript
const { setCustomUserClaims } = require('./setCustomUserClaims');

// Set admin role
await setCustomUserClaims('user-uid', 'admin');

// Set teacher role with school
await setCustomUserClaims('user-uid', 'teacher', 'SCH-2025-A12');

// Set parent role with school
await setCustomUserClaims('user-uid', 'parent', 'SCH-2025-A12');
```

## 📱 Client-Side Usage

### 1. Check User Role

```dart
final user = FirebaseAuth.instance.currentUser;
final idTokenResult = await user?.getIdTokenResult();
final role = idTokenResult?.claims?['role'] as String?;
final schoolId = idTokenResult?.claims?['schoolId'] as String?;
```

### 2. Query Data (Automatically Filtered)

```dart
// Teacher querying students - only returns assigned students
final students = await FirebaseFirestore.instance
    .collection('students')
    .where('teacherId', isEqualTo: user.uid)
    .get();

// Parent querying child data - only returns their child
final childData = await FirebaseFirestore.instance
    .collection('students')
    .doc(childId)
    .get();
```

### 3. Real-time Listeners

```dart
// Helper listening to transport updates - only assigned routes
final transportUpdates = FirebaseFirestore.instance
    .collection('transportStops')
    .where('helperId', isEqualTo: user.uid)
    .snapshots();
```

## 🔒 Security Features

### 1. Role Validation
- All operations validate user role from custom claims
- No role information stored in Firestore documents
- Server-side enforcement prevents client-side bypasses

### 2. School Isolation
- Users can only access data from their assigned school
- Cross-school access is blocked by security rules
- School ID validation in all operations

### 3. Relationship Validation
- Parents can only access their own children's data
- Teachers can only access their assigned students
- Helpers can only access their assigned routes

### 4. Field-Level Security
- Helpers can only update specific transport fields
- Teachers cannot modify principal/admin data
- Parents have read-only access to most data

### 5. Audit Trail
- All operations include timestamps
- User ID is recorded for all writes
- Security rule violations are logged

## 🧪 Testing

### 1. Test Different Roles

```dart
// Test teacher access
final teacherStudents = await getTeacherStudents();
assert(teacherStudents.every((s) => s.data()['teacherId'] == currentUser.uid));

// Test parent access
final childData = await getChildData('child-uid');
assert(childData != null); // Should only work if parent of child

// Test helper access
await markStopReached('route-uid', 'stop-uid');
// Should only work if helper is assigned to route
```

### 2. Test Security Violations

```dart
// This should fail - parent trying to access other child's data
try {
  await getChildData('other-child-uid');
  assert(false, 'Should have been denied');
} catch (e) {
  assert(e.toString().contains('Access denied'));
}
```

## 🚨 Security Considerations

### 1. Custom Claims Management
- Custom claims are cached for 1 hour by default
- Users need to refresh tokens to get updated claims
- Use `user.getIdToken(true)` to force refresh

### 2. Rule Complexity
- Complex rules can impact performance
- Test rules thoroughly before deployment
- Monitor Firestore usage and costs

### 3. Error Handling
- Security rule violations return generic errors
- Don't expose sensitive information in error messages
- Log security violations for monitoring

### 4. Data Validation
- Validate all input data on the client
- Use Firestore rules as a safety net, not primary validation
- Implement proper error handling and user feedback

## 📊 Monitoring

### 1. Security Rule Violations
- Monitor Firestore logs for rule violations
- Set up alerts for suspicious access patterns
- Regular security audits

### 2. Performance Monitoring
- Monitor Firestore read/write operations
- Track rule evaluation time
- Optimize rules for better performance

### 3. User Activity
- Track user login patterns
- Monitor data access patterns
- Detect unusual activity

## 🔧 Troubleshooting

### Common Issues

1. **"Missing or insufficient permissions"**
   - Check if user has correct role in custom claims
   - Verify school ID matches
   - Ensure user is authenticated

2. **"Permission denied"**
   - Check Firestore security rules
   - Verify user relationships (parent-child, teacher-student)
   - Check if user is assigned to the resource

3. **"Custom claims not updating"**
   - Force token refresh: `user.getIdToken(true)`
   - Wait for claims to propagate (up to 1 hour)
   - Check if claims were set correctly

### Debug Mode

Enable debug logging in Firestore rules:

```javascript
// Add to firestore.rules for debugging
function debugLog(message) {
  return debug(message);
}
```

## 📚 Additional Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Custom Claims Documentation](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Firestore Security Rules Best Practices](https://firebase.google.com/docs/firestore/security/rules-structure)
- [Flutter Firestore Security Guide](https://firebase.flutter.dev/docs/firestore/usage/)

## 🤝 Contributing

When adding new collections or modifying security rules:

1. Update the access matrix in this document
2. Add appropriate security rules
3. Test with all user roles
4. Update client-side examples
5. Document any new security considerations

---

**Remember**: Security is an ongoing process. Regularly review and update your security rules as your application evolves.
