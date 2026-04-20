# Smart Campus - API Documentation

## Base URL

```
Development: http://localhost:5000/api/v1
Production: https://api.smartcampus.com/api/v1
```

## Authentication

All API endpoints (except `/auth/login` and `/auth/register`) require authentication.

### Headers

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Get Auth Token

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@school.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@school.com",
      "name": "John Doe",
      "role": "TEACHER",
      "schoolId": "school-id"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## API Endpoints

### 1. Authentication

#### POST /auth/login
Login user and get JWT token.

#### POST /auth/register
Register new user (limited use).

#### POST /auth/logout
Logout user (invalidate token).

#### GET /auth/profile
Get current user profile.

---

### 2. Users

#### POST /admin/user
Create new user.

**Request:**
```json
{
  "email": "teacher@school.com",
  "name": "John Doe",
  "role": "TEACHER",
  "schoolId": "school-id",
  "phone": "+1234567890",
  "classIds": ["class-id-1"]
}
```

#### GET /admin/users
Get all users in school.

**Query Params:**
- `schoolId` (required)
- `role` - Filter by role
- `status` - Filter by status
- `search` - Search by name/email
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset

#### PUT /admin/user/:userId
Update user details.

#### DELETE /admin/user/:userId
Deactivate user (soft delete).

#### POST /admin/users/bulk-import
Bulk import users from CSV.

---

### 3. Attendance

#### POST /attendance/bulk
Mark attendance for multiple students.

**Request:**
```json
{
  "classId": "class-id",
  "date": "2024-12-02",
  "records": [
    {
      "studentId": "student-1",
      "status": "present"
    },
    {
      "studentId": "student-2",
      "status": "absent"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "data": {
    "recorded": 28,
    "present": 26,
    "absent": 2,
    "late": 0,
    "halfDay": 0
  }
}
```

#### GET /attendance/class/:classId
Get attendance for a class.

**Query Params:**
- `date` - Specific date (YYYY-MM-DD)
- `startDate` - Date range start
- `endDate` - Date range end

#### GET /attendance/student/:studentId
Get attendance for a student.

#### PUT /attendance/:attendanceId
Update attendance record.

---

### 4. Homework

#### POST /homework
Create homework assignment.

**Request:**
```json
{
  "classId": "class-id",
  "subject": "Mathematics",
  "title": "Algebra Practice",
  "description": "Complete exercises 1-10",
  "dueDate": "2024-12-10",
  "attachments": []
}
```

#### GET /homework/class/:classId
Get homework for a class.

#### GET /homework/student/:studentId
Get homework for a student.

#### PUT /homework/:homeworkId
Update homework.

#### DELETE /homework/:homeworkId
Delete homework.

---

### 5. Marks

#### POST /marks
Enter marks for a student.

**Request:**
```json
{
  "studentId": "student-id",
  "examId": "exam-id",
  "subject": "Mathematics",
  "marksObtained": 85,
  "totalMarks": 100,
  "remarks": "Excellent performance"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Marks entered successfully",
  "data": {
    "marksId": "marks-id",
    "percentage": 85,
    "grade": "A"
  }
}
```

#### POST /marks/bulk
Bulk enter marks for multiple students.

#### GET /marks/exam/:examId
Get marks for an exam.

#### GET /marks/student/:studentId
Get marks for a student.

#### PUT /marks/:marksId
Update marks.

---

### 6. Parent

#### GET /parent/children
Get list of children for logged-in parent.

**Response:**
```json
{
  "success": true,
  "data": {
    "children": [
      {
        "id": "student-id",
        "name": "Alice Johnson",
        "class": "Grade 5A",
        "rollNumber": "001",
        "photo": "https://..."
      }
    ],
    "total": 1
  }
}
```

#### GET /parent/dashboard/:studentId
Get complete dashboard for a child.

**Response:**
```json
{
  "success": true,
  "data": {
    "student": {...},
    "attendance": {
      "thisMonth": {...},
      "today": {...}
    },
    "homework": {
      "pending": 3,
      "recentAssignments": [...]
    },
    "marks": {
      "recentExams": [...],
      "averagePercentage": 81.5
    },
    "notifications": [...]
  }
}
```

---

### 7. Transport

#### GET /transport/routes
Get all routes for a school.

**Query Params:**
- `schoolId` (required)

#### GET /transport/route/:routeId
Get single route details.

#### POST /transport/tracking
Update bus location (Helper only).

**Request:**
```json
{
  "routeId": "route-id",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "speed": 30,
  "heading": 45
}
```

#### GET /transport/tracking/:routeId/live
Get live tracking data.

**Response:**
```json
{
  "success": true,
  "data": {
    "latestLocation": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "speed": 30,
      "heading": 45,
      "timestamp": "2024-12-02T07:25:00Z"
    },
    "currentStop": {
      "id": "stop-id",
      "name": "Main Gate",
      "status": "approaching"
    },
    "recentPath": [...]
  }
}
```

#### POST /transport/stop/:stopId/mark
Mark stop as reached.

#### GET /transport/student/:studentId/route
Get assigned route for a student.

---

### 8. Gallery

#### POST /gallery
Upload media to gallery.

**Request (multipart/form-data):**
```
file: <File>
title: "Sports Day 2024"
description: "Annual sports day"
visibility: "public"
albumId: "album-id" (optional)
```

#### GET /gallery/:schoolId
Get gallery items for a school.

#### GET /gallery/item/:itemId
Get single gallery item.

#### DELETE /gallery/item/:itemId
Delete gallery item.

#### POST /gallery/album
Create new album.

#### GET /gallery/albums/:schoolId
Get all albums.

---

### 9. Calendar

#### POST /calendar/event
Create new event.

**Request:**
```json
{
  "title": "Sports Day",
  "description": "Annual sports event",
  "eventType": "sports",
  "startDate": "2024-12-10T09:00:00Z",
  "endDate": "2024-12-10T17:00:00Z",
  "location": "School Ground",
  "targetAudience": ["all"],
  "reminderBefore": 60
}
```

#### GET /calendar/events
Get events for a school.

**Query Params:**
- `schoolId` (required)
- `startDate` - Filter from date
- `endDate` - Filter to date
- `eventType` - Filter by type

#### GET /calendar/event/:eventId
Get single event details.

#### PUT /calendar/event/:eventId
Update event.

#### DELETE /calendar/event/:eventId
Delete event.

#### POST /calendar/event/:eventId/rsvp
RSVP to an event.

#### GET /calendar/upcoming
Get upcoming events (next 7 days).

---

### 10. Notifications

#### GET /notifications/:userId
Get notifications for a user.

**Query Params:**
- `status` - Filter: all, unread, read
- `type` - Filter by category
- `limit` - Results per page
- `offset` - Pagination

#### PUT /notifications/:notificationId/read
Mark notification as read.

#### PUT /notifications/read-all
Mark all notifications as read for a user.

#### POST /notifications/preferences
Update notification preferences.

#### GET /notifications/preferences/:userId
Get notification preferences.

---

### 11. Analytics

#### GET /analytics/attendance/:schoolId
Get attendance analytics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalStudents": 500,
    "averageAttendanceRate": 92.5,
    "presentToday": 463,
    "absentToday": 37,
    "trends": [...]
  }
}
```

#### GET /analytics/academic/:schoolId
Get academic performance analytics.

#### GET /analytics/financial/:schoolId
Get financial analytics.

#### GET /admin/analytics/dashboard
Get complete dashboard analytics.

---

### 12. Appointments

#### POST /appointments
Book appointment.

**Request:**
```json
{
  "teacherId": "teacher-id",
  "studentId": "student-id",
  "requestedDate": "2024-12-10",
  "requestedTime": "14:00",
  "duration": 30,
  "reason": "Discuss academic progress"
}
```

#### PUT /appointments/:id/approve
Approve appointment (Teacher/Admin).

#### GET /appointments/:userId
Get appointments for a user.

---

### 13. Announcements

#### POST /admin/announcement
Send school-wide announcement.

**Request:**
```json
{
  "title": "Holiday Notice",
  "message": "School closed on Friday",
  "targetAudience": ["all"],
  "priority": "important",
  "scheduledFor": "2024-12-05T09:00:00Z" // optional
}
```

#### GET /announcements/:schoolId
Get announcements for a school.

---

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error description"
}
```

---

## HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| **200** | OK | Request successful |
| **201** | Created | Resource created successfully |
| **400** | Bad Request | Invalid request data |
| **401** | Unauthorized | Invalid or missing token |
| **403** | Forbidden | No permission for this action |
| **404** | Not Found | Resource doesn't exist |
| **409** | Conflict | Duplicate resource (e.g., email exists) |
| **422** | Validation Error | Data validation failed |
| **500** | Server Error | Internal server error |

---

## Pagination

For endpoints returning lists, use pagination:

**Request:**
```
GET /admin/users?schoolId=school-id&limit=50&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "total": 150,
    "pagination": {
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

---

## Rate Limiting

- **Standard**: 100 requests per minute
- **Authenticated**: 1000 requests per minute
- **Admin**: 5000 requests per minute

**Rate Limit Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1638360000
```

---

## Webhooks

### Available Webhooks

Subscribe to events:

- `attendance.marked` - Attendance marked
- `homework.created` - Homework assigned
- `marks.entered` - Marks entered
- `user.created` - New user created
- `payment.completed` - Fee payment successful
- `transport.update` - Bus location updated

### Configure Webhook

```http
POST /webhooks/subscribe
Content-Type: application/json
Authorization: Bearer <ADMIN_TOKEN>

{
  "url": "https://your-server.com/webhook",
  "events": ["attendance.marked", "marks.entered"],
  "secret": "your-webhook-secret"
}
```

---

## Error Handling

### Example Error Responses

**Validation Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

**Authorization Error:**
```json
{
  "success": false,
  "message": "Only administrators can create users"
}
```

**Not Found:**
```json
{
  "success": false,
  "message": "Student not found"
}
```

---

## SDK & Libraries

### JavaScript/TypeScript

```typescript
import apiClient from './services/apiClient';

// Login
const response = await apiClient.post('/auth/login', {
  email: 'user@school.com',
  password: 'password123',
});

// Set token
await apiClient.setToken(response.data.token);

// Make authenticated request
const dashboard = await apiClient.get('/parent/dashboard/student-id');
```

### Mobile (React Native)

Already included in `SmartCampusMobile/services/apiClient.ts`

### Web (React)

Already included in `smart-campus-react/src/services/apiClient.ts`

---

## Testing APIs

### Using cURL

**Login:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@school.com","password":"password123"}'
```

**Get with Auth:**
```bash
curl http://localhost:5000/api/v1/parent/children \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Post with Auth:**
```bash
curl -X POST http://localhost:5000/api/v1/homework \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"classId":"class-1","subject":"Math","title":"Test"}'
```

### Using Postman

1. Import collection (contact support for Postman collection)
2. Set environment variables:
   - `base_url`: http://localhost:5000/api/v1
   - `token`: Your JWT token
3. Use {{base_url}} and {{token}} in requests

---

## WebSocket Events

### Real-Time Updates

**Connect to WebSocket:**
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'YOUR_JWT_TOKEN',
  },
});

// Listen for events
socket.on('transport:location-update', (data) => {
  console.log('Bus location updated:', data);
});

socket.on('notification:new', (notification) => {
  console.log('New notification:', notification);
});
```

**Available Events:**
- `transport:location-update`
- `notification:new`
- `attendance:marked`
- `homework:created`
- `marks:entered`

---

## API Versioning

Current version: **v1**

**Accessing specific versions:**
```
/api/v1/endpoint  (current)
/api/v2/endpoint  (future)
```

**Version deprecation:**
- 6 months notice before deprecation
- Deprecated endpoints still work but return warning header
- Migrate to new version before sunset date

---

## Best Practices

### 1. Always Handle Errors

```typescript
try {
  const response = await apiClient.get('/endpoint');
  if (response.success) {
    // Handle success
  }
} catch (error) {
  // Handle error
  console.error('API Error:', error.message);
}
```

### 2. Use Pagination for Large Datasets

```typescript
// Don't: Get all users
const users = await apiClient.get('/admin/users?schoolId=school-1');

// Do: Use pagination
const users = await apiClient.get('/admin/users?schoolId=school-1&limit=50&offset=0');
```

### 3. Cache Frequently Accessed Data

```typescript
// Cache user profile
const profile = await apiClient.get('/auth/profile');
await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
```

### 4. Implement Retry Logic

```typescript
async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiClient.get(url);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### 5. Use TypeScript Types

```typescript
interface Student {
  id: string;
  name: string;
  class: string;
  rollNumber: string;
}

const response = await apiClient.get<{ data: { students: Student[] } }>(
  '/students/class/class-1'
);
```

---

## API Limits & Quotas

### Request Limits

| Plan | Requests/min | Concurrent Requests | Storage |
|------|--------------|---------------------|---------|
| **Free** | 100 | 5 | 1 GB |
| **Basic** | 1,000 | 20 | 10 GB |
| **Premium** | 10,000 | 100 | 100 GB |
| **Enterprise** | Unlimited | Unlimited | Unlimited |

### File Upload Limits

- **Images**: Max 20MB per file
- **Videos**: Max 100MB per file
- **Documents**: Max 10MB per file
- **CSV Import**: Max 10,000 rows

---

## Changelog

### Version 1.0.0 (December 2024)

**New Endpoints:**
- ✅ Complete admin controller
- ✅ Calendar events management
- ✅ Notifications system
- ✅ Gallery with S3 integration
- ✅ Transport tracking
- ✅ Analytics endpoints

**Improvements:**
- Better error messages
- Faster response times
- Enhanced security

**Breaking Changes:**
- None (initial release)

---

## Support

**API Questions:**
- 📧 developers@smartcampus.com
- 📚 Developer docs: docs.smartcampus.com/api
- 💬 Developer forum: forum.smartcampus.com

**Report API Issues:**
- GitHub: github.com/smartcampus/api/issues
- Email: api-support@smartcampus.com

---

*API Documentation • Version 1.0.0 • Last Updated: December 2024*

