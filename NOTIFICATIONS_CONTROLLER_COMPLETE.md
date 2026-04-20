# Notifications Controller - Complete Implementation ✅

## Overview

Complete push notification management system with scheduling, preferences, delivery tracking, and rate limiting.

## Implemented Endpoints

### 1. POST /api/notifications/send
**Description:** Send push notification to users

**Body:**
```json
{
  "title": "Notification Title",
  "message": "Notification message",
  "type": "emergency|announcement|homework|attendance|transport|fees",
  "recipients": ["user-id-1", "user-id-2"],  // Optional: specific user IDs
  "recipientType": "all|teachers|parents|students|staff",  // Optional: role-based
  "priority": "low|normal|high|urgent",
  "scheduledFor": "2024-01-01T10:00:00Z",  // Optional: ISO date for scheduling
  "data": {  // Optional: additional payload
    "customField": "value"
  }
}
```

**Features:**
- ✅ Supports both specific recipients and role-based targeting
- ✅ Scheduling future notifications
- ✅ Respects user preferences (quiet hours, notification types)
- ✅ Rate limiting (100 notifications per minute per sender)
- ✅ Emergency notifications always sent (bypass preferences)

**Response:**
```json
{
  "success": true,
  "message": "Notification sent successfully",
  "data": {
    "notificationId": "notification-id",
    "recipientCount": 50,
    "scheduled": false,
    "scheduledFor": null
  }
}
```

### 2. GET /api/notifications/:userId
**Description:** Get all notifications for a user

**Query Params:**
- `status` - Filter by status: `all|unread|read|pending|sent`
- `type` - Filter by type: `emergency|announcement|homework|attendance|transport|fees`
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [...],
    "total": 150,
    "unreadCount": 25,
    "pagination": {
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

### 3. PUT /api/notifications/:notificationId/read
**Description:** Mark notification as read

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "notification": {
      "id": "notification-id",
      "readAt": "2024-01-01T10:00:00Z"
    }
  }
}
```

### 4. PUT /api/notifications/read-all
**Description:** Mark all notifications as read for a user

**Body:**
```json
{
  "userId": "user-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": {
    "updatedCount": 25
  }
}
```

### 5. DELETE /api/notifications/:notificationId
**Description:** Delete notification

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

### 6. POST /api/notifications/preferences
**Description:** Update notification preferences for a user

**Body:**
```json
{
  "userId": "user-id",
  "preferences": {
    "emergency": true,
    "announcements": true,
    "homework": false,
    "attendance": true,
    "transport": true,
    "fees": false,
    "quietHoursStart": "22:00",
    "quietHoursEnd": "07:00"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Preferences updated successfully",
  "data": {
    "preferences": {...}
  }
}
```

### 7. GET /api/notifications/preferences/:userId
**Description:** Get notification preferences for a user

**Response:**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "emergency": true,
      "announcements": true,
      "homework": true,
      "attendance": true,
      "transport": true,
      "fees": true,
      "quietHoursStart": null,
      "quietHoursEnd": null
    }
  }
}
```

### 8. POST /api/notifications/test
**Description:** Send test notification (for debugging)

**Body:**
```json
{
  "userId": "user-id",
  "message": "Test notification message"
}
```

**Access:** Only available in development mode or for admins

**Response:**
```json
{
  "success": true,
  "message": "Test notification sent successfully",
  "data": {
    "notificationId": "notification-id",
    "recipient": {
      "id": "user-id",
      "name": "User Name"
    }
  }
}
```

## Key Features

### ✅ Notification Types
- **emergency** - Always sent, bypasses preferences
- **announcement** - School announcements
- **homework** - Homework assignments
- **attendance** - Attendance updates
- **transport** - Bus tracking updates
- **fees** - Fee payment reminders

### ✅ Delivery Status Tracking
- **pending** - Created but not sent
- **scheduled** - Scheduled for future delivery
- **sent** - Sent to push notification service
- **delivered** - Delivered to device (if tracking available)
- **read** - User has read the notification

### ✅ Scheduling
- Schedule notifications for future delivery
- Notifications stored with `scheduledFor` timestamp
- Status set to `scheduled` until delivery time
- Can be processed by a background job/cron

### ✅ User Preferences
- Enable/disable specific notification types
- Quiet hours (no notifications during specified time)
- Stored in User.preferences JSON field
- Default preferences provided if none exist

### ✅ Rate Limiting
- Maximum 100 notifications per minute per sender
- Prevents spam and abuse
- Returns error if limit exceeded

### ✅ Quiet Hours
- Users can set quiet hours (e.g., 22:00 - 07:00)
- Non-emergency notifications are suppressed during quiet hours
- Emergency notifications always sent regardless

### ✅ Role-Based Targeting
- **all** - All active users in school
- **teachers** - All teachers
- **parents** - All parents
- **students** - All students
- **staff** - Admin, Principal, Office Staff

## Business Logic

### Preference Checking
1. Emergency notifications always sent (bypass all preferences)
2. Check if notification type is enabled in user preferences
3. Check if current time is within quiet hours
4. Only send if type enabled AND not in quiet hours

### Scheduling
1. If `scheduledFor` is provided and in the future:
   - Status set to `scheduled`
   - Notification stored but not sent immediately
   - Background job should process scheduled notifications
2. If immediate or `scheduledFor` is in the past:
   - Status set to `pending`
   - Notification sent immediately (respecting preferences)

### Rate Limiting
- Tracks notifications per sender per minute
- Uses in-memory Map (consider Redis for production)
- Returns 400 error if limit exceeded

## Authorization

- **All Users:** Can view their own notifications, update their preferences
- **Admin/Principal:** Can send notifications, view all notifications in school
- **Super Admin:** Full access across all schools

## Error Handling

All endpoints include:
- ✅ Input validation
- ✅ Authorization checks
- ✅ School-level isolation
- ✅ Proper error messages
- ✅ Activity logging
- ✅ Comprehensive error responses

## TypeScript Types

All interfaces defined:
- `SendNotificationBody` - Notification sending payload
- `UpdatePreferencesBody` - Preferences update payload
- `SendTestNotificationBody` - Test notification payload
- `MarkAllReadBody` - Mark all read payload

## Testing

```bash
# Send notification to all teachers
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Meeting Reminder",
    "message": "Staff meeting at 3 PM",
    "type": "announcement",
    "recipientType": "teachers",
    "priority": "normal"
  }' \
  http://localhost:5000/api/v1/notifications/send

# Get user notifications
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/v1/notifications/USER_ID?status=unread&limit=20"

# Update preferences
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id",
    "preferences": {
      "homework": false,
      "quietHoursStart": "22:00",
      "quietHoursEnd": "07:00"
    }
  }' \
  http://localhost:5000/api/v1/notifications/preferences
```

## Status

✅ **Complete and Ready for Use**

All endpoints implemented with:
- Full notification management
- Scheduling support
- User preferences
- Rate limiting
- Quiet hours
- Delivery status tracking
- Comprehensive error handling
- Activity logging

## Notes

- Preferences stored in `User.preferences.notifications` JSON field
- Rate limiting uses in-memory storage (consider Redis for production)
- Scheduled notifications need a background job to process them
- Emergency notifications always bypass preferences and quiet hours

