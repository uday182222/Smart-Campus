# 🧪 Postman Test Guide - Attendance API

**Date:** January 2025  
**API Base URL:** `http://localhost:5000/api/v1`  
**Authentication:** Bearer Token (JWT)

---

## ✅ Controller Verification

**Status:** ✅ **COMPLETE**

The attendance controller exists at `server/src/controllers/attendance.controller.ts` with all 5 required endpoints:

1. ✅ `GET /api/attendance/:classId/:date` - **Line 36**
2. ✅ `POST /api/attendance` - **Line 173** (supports single & bulk)
3. ✅ `PUT /api/attendance/:id` - **Line 443**
4. ✅ `GET /api/attendance/history/:studentId` - **Line 555**
5. ✅ `GET /api/attendance/analytics/:classId` - **Line 656**

**Features:**
- ✅ Prisma ORM integration
- ✅ TypeScript types
- ✅ Error handling
- ✅ Role-based access control
- ✅ School-based multi-tenancy
- ✅ Input validation
- ✅ Logging

---

## 🔑 Prerequisites

### 1. Get Authentication Token

First, you need to login and get a JWT token:

```http
POST http://localhost:5000/api/v1/auth/login
Content-Type: application/json

{
  "email": "teacher@example.com",
  "password": "password123",
  "schoolId": "school_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

**Save the token** - you'll need it for all requests.

---

## 📋 Test Cases

### **Test 1: Mark Bulk Attendance (POST)**

**Endpoint:** `POST /api/attendance`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Request Body:**
```json
{
  "classId": "class_123",
  "date": "2025-01-30",
  "attendance": [
    {
      "studentId": "student_1",
      "status": "present"
    },
    {
      "studentId": "student_2",
      "status": "absent",
      "remarks": "Sick leave"
    },
    {
      "studentId": "student_3",
      "status": "late",
      "remarks": "Late by 10 minutes"
    }
  ]
}
```

**Expected Response (200/201):**
```json
{
  "success": true,
  "message": "Attendance marked for 3 students",
  "data": {
    "classId": "class_123",
    "date": "2025-01-30",
    "results": [
      {
        "studentId": "student_1",
        "studentName": "John Doe",
        "status": "created",
        "attendance": {
          "id": "att_123",
          "studentId": "student_1",
          "status": "present",
          ...
        }
      },
      ...
    ]
  }
}
```

**Test Single Attendance (Alternative):**
```json
{
  "classId": "class_123",
  "studentId": "student_1",
  "date": "2025-01-30",
  "status": "present",
  "remarks": "On time"
}
```

---

### **Test 2: Get Class Attendance (GET)**

**Endpoint:** `GET /api/attendance/:classId/:date`

**Example:**
```
GET http://localhost:5000/api/v1/attendance/class_123/2025-01-30
```

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "classId": "class_123",
    "className": "Grade 5A",
    "date": "2025-01-30",
    "attendance": [
      {
        "id": "att_123",
        "studentId": "student_1",
        "studentName": "John Doe",
        "studentEmail": "john@example.com",
        "studentPhoto": null,
        "classId": "class_123",
        "className": "Grade 5A",
        "date": "2025-01-30",
        "status": "present",
        "remarks": "On time",
        "markedBy": "teacher_123",
        "markedAt": "2025-01-30T09:00:00.000Z"
      },
      ...
    ],
    "summary": {
      "total": 30,
      "present": 25,
      "absent": 3,
      "late": 2,
      "halfDay": 0,
      "notMarked": 0
    }
  }
}
```

---

### **Test 3: Get Student History (GET)**

**Endpoint:** `GET /api/attendance/history/:studentId`

**Query Parameters:**
- `startDate` (optional): `YYYY-MM-DD`
- `endDate` (optional): `YYYY-MM-DD`
- `limit` (optional): Number (default: 100)

**Example:**
```
GET http://localhost:5000/api/v1/attendance/history/student_1?startDate=2025-01-01&endDate=2025-01-30
```

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "studentId": "student_1",
    "studentName": "John Doe",
    "history": [
      {
        "id": "att_123",
        "classId": "class_123",
        "className": "Grade 5A",
        "date": "2025-01-30",
        "status": "present",
        "remarks": "On time",
        "markedBy": "teacher_123",
        "markedAt": "2025-01-30T09:00:00.000Z"
      },
      ...
    ],
    "statistics": {
      "total": 20,
      "present": 18,
      "absent": 1,
      "late": 1,
      "halfDay": 0,
      "attendancePercentage": 95.0
    }
  }
}
```

---

### **Test 4: Edit Attendance (PUT)**

**Endpoint:** `PUT /api/attendance/:id`

**Example:**
```
PUT http://localhost:5000/api/v1/attendance/att_123
```

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "late",
  "remarks": "Late by 15 minutes (updated)"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Attendance updated successfully",
  "data": {
    "id": "att_123",
    "studentId": "student_1",
    "studentName": "John Doe",
    "classId": "class_123",
    "className": "Grade 5A",
    "date": "2025-01-30",
    "status": "late",
    "remarks": "Late by 15 minutes (updated)",
    "markedBy": "teacher_123",
    "markedAt": "2025-01-30T10:00:00.000Z"
  }
}
```

**Note:** Can only edit within 7 days of marking.

---

### **Test 5: Get Class Analytics (GET)**

**Endpoint:** `GET /api/attendance/analytics/:classId`

**Query Parameters:**
- `startDate` (optional): `YYYY-MM-DD` (default: 30 days ago)
- `endDate` (optional): `YYYY-MM-DD` (default: today)

**Example:**
```
GET http://localhost:5000/api/v1/attendance/analytics/class_123?startDate=2025-01-01&endDate=2025-01-30
```

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "classId": "class_123",
    "className": "Grade 5A",
    "period": {
      "startDate": "2025-01-01",
      "endDate": "2025-01-30"
    },
    "classStatistics": {
      "totalStudents": 30,
      "totalRecords": 600,
      "present": 540,
      "absent": 45,
      "late": 15,
      "halfDay": 0,
      "attendancePercentage": 92.5
    },
    "studentStatistics": [
      {
        "studentId": "student_1",
        "studentName": "John Doe",
        "total": 20,
        "present": 19,
        "absent": 0,
        "late": 1,
        "halfDay": 0,
        "attendancePercentage": 95.0
      },
      ...
    ],
    "dailyTrend": [
      {
        "date": "2025-01-01",
        "present": 28,
        "absent": 2,
        "late": 0,
        "halfDay": 0,
        "total": 30,
        "attendancePercentage": 93.33
      },
      ...
    ],
    "lowAttendanceStudents": [
      {
        "studentId": "student_5",
        "studentName": "Jane Smith",
        "attendancePercentage": 70.0,
        "totalAbsent": 6
      }
    ]
  }
}
```

---

## 🚨 Error Responses

### **401 Unauthorized**
```json
{
  "success": false,
  "error": {
    "message": "Access token required"
  }
}
```

### **403 Forbidden**
```json
{
  "success": false,
  "error": {
    "message": "Teacher access required"
  }
}
```

### **404 Not Found**
```json
{
  "success": false,
  "error": {
    "message": "Class not found"
  }
}
```

### **400 Validation Error**
```json
{
  "success": false,
  "error": {
    "message": "Invalid date format. Use YYYY-MM-DD"
  }
}
```

---

## 📝 Postman Collection Setup

### **Step 1: Create Environment**

1. Open Postman
2. Click "Environments" → "Create Environment"
3. Add variables:
   - `base_url`: `http://localhost:5000/api/v1`
   - `token`: (leave empty, will be set after login)

### **Step 2: Create Collection**

1. Create new collection: "Smart Campus - Attendance API"
2. Add all 5 requests above
3. Set collection variable: `base_url` = `{{base_url}}`
4. Add Authorization header to all requests:
   ```
   Authorization: Bearer {{token}}
   ```

### **Step 3: Pre-request Script (Optional)**

Add to collection pre-request script to auto-refresh token:
```javascript
// Auto-refresh token if expired
// (Implement based on your token refresh logic)
```

---

## ✅ Testing Checklist

- [ ] **Test 1:** Mark bulk attendance (POST)
- [ ] **Test 2:** Get class attendance (GET)
- [ ] **Test 3:** Get student history (GET)
- [ ] **Test 4:** Edit attendance (PUT)
- [ ] **Test 5:** Get class analytics (GET)
- [ ] **Test Error Cases:**
  - [ ] Invalid token (401)
  - [ ] Missing required fields (400)
  - [ ] Invalid date format (400)
  - [ ] Class not found (404)
  - [ ] Edit after 7 days (403)

---

## 🔧 Troubleshooting

### **Issue: "Access token required"**
- **Solution:** Make sure you're including the `Authorization: Bearer <token>` header
- **Check:** Token is valid and not expired

### **Issue: "Class not found"**
- **Solution:** Verify the classId exists in your database
- **Check:** Class belongs to the same school as the logged-in user

### **Issue: "Teacher access required"**
- **Solution:** Login with a teacher account
- **Check:** User role is "TEACHER" in the database

### **Issue: "Invalid date format"**
- **Solution:** Use `YYYY-MM-DD` format (e.g., `2025-01-30`)
- **Check:** No time component in date string

---

## 📊 Expected Database State

After running tests, verify in database:

```sql
-- Check attendance records
SELECT * FROM attendance WHERE date = '2025-01-30';

-- Check student statistics
SELECT 
  student_id,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
  SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent
FROM attendance
WHERE student_id = 'student_1'
GROUP BY student_id;
```

---

## 🎉 Success Criteria

All tests pass when:
- ✅ All 5 endpoints return 200/201 status
- ✅ Data is saved correctly in database
- ✅ Response format matches expected structure
- ✅ Error cases return appropriate status codes
- ✅ Statistics are calculated correctly

**Ready to proceed to mobile app integration!** 🚀


