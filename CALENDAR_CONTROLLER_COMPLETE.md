# Calendar Controller - Complete Implementation ✅

## Overview

Complete school event management system with reminders, RSVP tracking, and role-based access control.

## Implemented Endpoints

### 1. POST /api/calendar/event
**Description:** Create new event

**Body:**
```json
{
  "title": "Annual Sports Day",
  "description": "School sports day event",
  "eventType": "sports",
  "startDate": "2024-03-15T09:00:00Z",
  "endDate": "2024-03-15T17:00:00Z",
  "location": "School Ground",
  "targetAudience": ["all", "parents"],
  "reminderBefore": 60,
  "classIds": ["class-id-1"],
  "isAllDay": false,
  "attendanceRequired": true,
  "maxAttendees": 500
}
```

**Event Types:**
- `holiday` - School holidays
- `exam` - Examinations
- `sports` - Sports events
- `meeting` - Meetings
- `celebration` - Celebrations

**Target Audience:**
- `all` - All users
- `teachers` - All teachers
- `parents` - All parents
- `students` - All students
- `classes` - Specific classes (requires classIds)

**Features:**
- ✅ Automatic reminder scheduling
- ✅ Notification to target audience
- ✅ Support for all-day events
- ✅ RSVP/attendance tracking

**Response:**
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "eventId": "event-id",
    "event": {...}
  }
}
```

### 2. GET /api/calendar/events
**Description:** Get events for a school

**Query Params:**
- `schoolId` (required) - School ID
- `startDate` - Filter events from this date
- `endDate` - Filter events until this date
- `eventType` - Filter by type
- `targetAudience` - Filter by audience

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [...],
    "total": 25
  }
}
```

### 3. GET /api/calendar/event/:eventId
**Description:** Get single event details

**Features:**
- ✅ Returns full event details
- ✅ Includes attendee list
- ✅ Includes user's reminder settings
- ✅ Permission checking

**Response:**
```json
{
  "success": true,
  "data": {
    "event": {
      "id": "event-id",
      "title": "Event Title",
      "description": "...",
      "startDate": "2024-03-15T09:00:00Z",
      "endDate": "2024-03-15T17:00:00Z",
      "attendees": [...],
      "userReminder": {...},
      "attendeeCount": 42
    }
  }
}
```

### 4. PUT /api/calendar/event/:eventId
**Description:** Update event

**Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "startDate": "2024-03-16T09:00:00Z",
  "location": "New Location",
  "reminderBefore": 120
}
```

**Authorization:**
- ✅ Admins can update any event
- ✅ Event creator can update their event

**Features:**
- ✅ Sends update notification to attendees
- ✅ Updates reminders if reminderBefore changed

**Response:**
```json
{
  "success": true,
  "message": "Event updated successfully",
  "data": {
    "event": {...}
  }
}
```

### 5. DELETE /api/calendar/event/:eventId
**Description:** Delete event (soft delete - sets status to cancelled)

**Authorization:**
- ✅ Admins can delete any event
- ✅ Event creator can delete their event

**Features:**
- ✅ Soft delete (status: cancelled)
- ✅ Sends cancellation notification
- ✅ Preserves event data for history

**Response:**
```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

### 6. POST /api/calendar/event/:eventId/rsvp
**Description:** RSVP to an event

**Body:**
```json
{
  "attending": true,
  "notes": "Looking forward to it!"
}
```

**Features:**
- ✅ Creates or updates RSVP
- ✅ Updates event attendee count
- ✅ Checks if event is full
- ✅ Tracks response date

**Response:**
```json
{
  "success": true,
  "message": "RSVP recorded successfully",
  "data": {
    "rsvp": {
      "id": "rsvp-id",
      "status": "confirmed",
      "responseDate": "2024-01-01T10:00:00Z"
    }
  }
}
```

### 7. GET /api/calendar/upcoming
**Description:** Get upcoming events (next 7 days)

**Query Params:**
- `userId` (required) - User ID

**Features:**
- ✅ Returns events for next 7 days
- ✅ Filters based on user role and classes
- ✅ Includes user's RSVP status
- ✅ Sorted by start date

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [...],
    "total": 5,
    "dateRange": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-08T23:59:59Z"
    }
  }
}
```

## Key Features

### ✅ Event Types
- **holiday** - School holidays
- **exam** - Examinations
- **sports** - Sports events
- **meeting** - Meetings
- **celebration** - Celebrations

### ✅ Reminder System
- Schedule reminders X minutes before event
- Creates EventReminder records for each user
- Can be sent via push, in-app, email, WhatsApp
- Tracks sent status

### ✅ Target Audience
- **all** - All active users in school
- **teachers** - All teachers
- **parents** - All parents
- **students** - All students
- **classes** - Specific classes (requires classIds)

### ✅ RSVP/Attendance Tracking
- Track who's attending
- Check if event is full
- Update attendee count automatically
- Status: pending, confirmed, declined

### ✅ Role-Based Access
- **Super Admin:** Full access
- **Admin/Principal:** Can create, update, delete all events
- **Teachers:** Can view events for their classes
- **Parents:** Can view events for their children's classes
- **Students:** Can view events for their class

### ✅ Notifications
- Sent when event is created
- Sent when event is updated
- Sent when event is cancelled
- Sent to target audience only

## Business Logic

### Event Visibility
1. Check if user matches target audience
2. For class-specific events:
   - Teachers see events for their classes
   - Students see events for their class
   - Parents see events for their children's classes
3. Admins see all events

### Reminder Scheduling
1. If `reminderBefore` provided:
   - Create EventReminder records for each target user
   - Set timing (minutes before event)
   - Mark as not sent
   - Background job should process and send reminders

### RSVP Management
1. Check if event requires attendance
2. Check if event is full (if maxAttendees set)
3. Create or update EventAttendee record
4. Update event.currentAttendees count
5. Track response date

### Date Handling
- Supports ISO 8601 date format
- Handles timezone (uses server timezone)
- All-day events use 00:00 - 23:59
- Validates endDate >= startDate

## TypeScript Types

All interfaces defined:
- `CreateEventBody` - Event creation payload
- `UpdateEventBody` - Event update payload
- `RSVPBody` - RSVP payload

## Testing

```bash
# Create event
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sports Day",
    "eventType": "sports",
    "startDate": "2024-03-15T09:00:00Z",
    "targetAudience": ["all"],
    "reminderBefore": 60
  }' \
  http://localhost:5000/api/v1/calendar/event

# Get events
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/v1/calendar/events?schoolId=SCHOOL_ID&startDate=2024-01-01"

# RSVP to event
curl -X POST -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"attending": true}' \
  http://localhost:5000/api/v1/calendar/event/EVENT_ID/rsvp

# Get upcoming events
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/v1/calendar/upcoming?userId=USER_ID"
```

## Status

✅ **Complete and Ready for Use**

All endpoints implemented with:
- Full CRUD operations
- Reminder scheduling
- RSVP tracking
- Role-based access
- Notification system
- Comprehensive error handling
- Activity logging

## Notes

- Reminders are scheduled but need a background job to send them
- EventAttendee uses email to link to users (no direct userId field)
- Soft delete sets status to 'cancelled' (preserves data)
- Timezone handling uses server timezone (consider UTC for production)
- Recurring events support can be added later

