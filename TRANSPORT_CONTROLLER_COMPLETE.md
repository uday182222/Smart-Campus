# Transport Controller - Complete Implementation ✅

## Overview

Complete bus tracking system with real-time location updates, ETA calculations, and student boarding management.

## Implemented Endpoints

### 1. GET /api/transport/routes
**Description:** Get all routes for a school

**Query Params:**
- `schoolId` (optional) - Uses authenticated user's schoolId if not provided

**Response:**
```json
{
  "success": true,
  "data": {
    "routes": [
      {
        "id": "route-id",
        "name": "Route A",
        "routeNumber": "BUS-001",
        "schoolId": "school-id",
        "helper": {
          "name": "Helper Name",
          "phone": "+1234567890"
        },
        "stops": [...],
        "latestLocation": {
          "latitude": 28.6139,
          "longitude": 77.209,
          "timestamp": "2024-01-01T10:00:00Z"
        }
      }
    ],
    "total": 5
  }
}
```

### 2. GET /api/transport/route/:routeId
**Description:** Get single route details with all stops and current location

**Response:**
```json
{
  "success": true,
  "data": {
    "route": {...},
    "stops": [...],
    "currentLocation": {...},
    "nextStop": {
      "id": "stop-id",
      "name": "Stop Name",
      "distance": 2.5,
      "eta": 5
    }
  }
}
```

### 3. POST /api/transport/route
**Description:** Create new route (Admin only)

**Body:**
```json
{
  "name": "Route A",
  "routeNumber": "BUS-001",
  "schoolId": "school-id",
  "helperId": "helper-id",
  "startTime": "07:00",
  "endTime": "17:00",
  "stops": [
    {
      "name": "Stop 1",
      "address": "123 Main St",
      "latitude": 28.6139,
      "longitude": 77.209,
      "sequence": 1,
      "estimatedTime": "07:15"
    }
  ]
}
```

### 4. PUT /api/transport/route/:routeId
**Description:** Update route details (Admin only)

**Body:** (all fields optional)
```json
{
  "name": "Updated Route Name",
  "routeNumber": "BUS-002",
  "helperId": "new-helper-id",
  "stops": [...]
}
```

### 5. DELETE /api/transport/route/:routeId
**Description:** Delete route (soft delete - sets status to inactive)

**Note:** Cannot delete routes with recent tracking data (last 24 hours)

### 6. POST /api/transport/tracking
**Description:** Update bus location (Helper only)

**Body:**
```json
{
  "routeId": "route-id",
  "latitude": 28.6139,
  "longitude": 77.209,
  "speed": 45.5,
  "heading": 90,
  "accuracy": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tracking": {...},
    "nextStop": {
      "id": "stop-id",
      "name": "Next Stop",
      "distance": "2.5 km",
      "eta": "5 minutes",
      "etaMinutes": 5
    }
  }
}
```

### 7. GET /api/transport/tracking/:routeId/live
**Description:** Get live tracking data for a route (Parent view)

**Response:**
```json
{
  "success": true,
  "data": {
    "route": {...},
    "currentLocation": {
      "latitude": 28.6139,
      "longitude": 77.209,
      "timestamp": "2024-01-01T10:00:00Z",
      "speed": 45.5,
      "heading": 90
    },
    "nextStop": {...},
    "allStops": [...],
    "estimatedArrivals": [
      {
        "stop": {...},
        "eta": "5 minutes",
        "etaMinutes": 5
      }
    ],
    "recentPath": [...]
  }
}
```

### 8. POST /api/transport/stop/:stopId/mark
**Description:** Mark stop as reached (Helper only)

**Body:**
```json
{
  "arrivedAt": "2024-01-01T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tracking": {...},
    "stop": {...},
    "studentsToBoard": [...]
  }
}
```

**Note:** Automatically sends notifications to parents when bus arrives at stop

### 9. POST /api/transport/student/:studentId/board
**Description:** Mark student as boarded (Helper confirmation)

**Body:**
```json
{
  "stopId": "stop-id",
  "boardedAt": "2024-01-01T10:05:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tracking": {...},
    "student": {...},
    "stop": {...}
  }
}
```

**Note:** Automatically sends notification to parent when student boards

### 10. GET /api/transport/student/:studentId/route
**Description:** Get assigned route for a student (Parent view)

**Response:**
```json
{
  "success": true,
  "data": {
    "route": {...},
    "assignedStop": {...},
    "currentLocation": {...},
    "eta": {
      "minutes": 10,
      "formatted": "10 minutes",
      "distance": "5.2 km"
    }
  }
}
```

## Key Features

### ✅ Haversine Formula Implementation
- Calculates distance between coordinates in kilometers
- Used for finding nearest stops and calculating ETAs

### ✅ ETA Calculation
- Uses current speed if available
- Defaults to 30 km/h if speed not provided
- Adds 2 minutes buffer per remaining stop
- Formula: `ETA = (distance / speed) * 60 + (remainingStops * 2)`

### ✅ Real-time Tracking
- Tracks bus location with timestamp
- Stores speed, heading, and accuracy
- Maintains recent path (last 50 points, 30 minutes)

### ✅ Student Boarding Management
- Tracks which students are assigned to which stops
- Marks students as boarded
- Sends notifications to parents

### ✅ Stop Management
- Stops stored as JSON in Route model
- Each stop has: id, name, address, coordinates, sequence, estimatedTime
- Students assigned to stops within the JSON structure

### ✅ Authorization
- **Admin/Principal:** Can create, update, delete routes
- **Bus Helper:** Can update location, mark stops, mark students as boarded
- **Parent:** Can view routes, live tracking, student's assigned route
- **All:** Must belong to same school (except SUPER_ADMIN)

### ✅ Notifications
- Sends push notifications when:
  - Bus arrives at stop (to parents of students at that stop)
  - Student boards bus (to student's parents)

### ✅ Activity Logging
- Logs all transport-related actions:
  - Route created/updated/deleted
  - Location updated
  - Stop reached
  - Student boarded

## Business Logic

### Finding Next Stop
1. Filters out completed stops
2. Sorts remaining stops by sequence
3. Finds closest stop to current location
4. Calculates distance and ETA

### ETA Calculation
1. Calculates distance using Haversine formula
2. Uses current speed if available (from GPS)
3. Defaults to 30 km/h if no speed data
4. Adds 2 minutes buffer per remaining stop
5. Returns time in minutes

### Stop Completion
1. Helper marks stop as "reached"
2. System identifies students at that stop
3. Sends notifications to parents
4. Helper marks students as "boarded"
5. System updates stop status to "completed"

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
- `Coordinate` - latitude/longitude pair
- `Stop` - stop with coordinates and students
- `CreateRouteBody` - route creation payload
- `UpdateRouteBody` - route update payload
- `UpdateLocationBody` - location update payload
- `MarkStopBody` - stop marking payload
- `MarkBoardedBody` - student boarding payload

## Testing

To test the endpoints:

```bash
# Start server
cd server && npm run dev

# Test get routes
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/v1/transport/routes

# Test create route (Admin)
curl -X POST -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Route A","routeNumber":"BUS-001",...}' \
  http://localhost:5000/api/v1/transport/route

# Test update location (Helper)
curl -X POST -H "Authorization: Bearer HELPER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"routeId":"route-id","latitude":28.6139,"longitude":77.209}' \
  http://localhost:5000/api/v1/transport/tracking
```

## Status

✅ **Complete and Ready for Use**

All endpoints implemented with:
- Full CRUD operations for routes
- Real-time location tracking
- ETA calculations
- Student boarding management
- Parent notifications
- Comprehensive error handling
- Activity logging

