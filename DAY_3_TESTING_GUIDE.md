# 🧪 Day 3: Testing Guide

## ✅ What's Been Completed

### 1. Marks Controller ✅
- **File:** `server/src/controllers/marks.controller.ts`
- **Status:** Created with 4 endpoints
- **TypeScript Errors:** Fixed (audit log type casting, statistics calculation)

### 2. API Client ✅
- **File:** `SmartCampusMobile/services/apiClient.ts`
- **Status:** Created with axios, interceptors, error handling
- **TypeScript Errors:** None

### 3. Services Updated ✅
- **AttendanceService:** All `fetch` calls replaced with `apiClient`
- **HomeworkService:** All `fetch` calls replaced with `apiClient`
- **MarksService:** New service using `apiClient`

---

## 🧪 Testing Checklist

### **Prerequisites:**
- [ ] Server running on `http://localhost:5000`
- [ ] Database connected
- [ ] Test data created (school, teacher, class, student, exam)

### **Test 1: Login**
```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@test.com","password":"test123"}' \
  | jq -r '.data.token')
```

### **Test 2: Create Exam (if needed)**
```bash
# First, create an exam to test marks entry
curl -X POST http://localhost:5000/api/v1/exams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "classId": "class_123",
    "name": "Mid-Term Exam",
    "subject": "Mathematics",
    "examType": "mid_term",
    "date": "2025-02-15",
    "maxMarks": 100,
    "passingMarks": 40
  }'
```

### **Test 3: Enter Marks (POST /api/marks)**
```bash
curl -X POST http://localhost:5000/api/v1/marks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "examId": "EXAM_ID_HERE",
    "studentId": "b0466a75-65e0-42f2-9727-a8cdc5075f9a",
    "marksObtained": 85,
    "remarks": "Excellent performance"
  }'
```

### **Test 4: Get Exam Marks (GET /api/marks/:examId)**
```bash
curl -X GET "http://localhost:5000/api/v1/marks/EXAM_ID_HERE" \
  -H "Authorization: Bearer $TOKEN"
```

### **Test 5: Get Student Marks (GET /api/marks/student/:studentId)**
```bash
curl -X GET "http://localhost:5000/api/v1/marks/student/b0466a75-65e0-42f2-9727-a8cdc5075f9a" \
  -H "Authorization: Bearer $TOKEN"
```

### **Test 6: Update Marks (PUT /api/marks/:id)**
```bash
curl -X PUT "http://localhost:5000/api/v1/marks/MARKS_ID_HERE" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "marksObtained": 90,
    "remarks": "Updated - even better!"
  }'
```

### **Test 7: Verify Audit Log**
```bash
# Check activity logs for marks entries
curl -X GET "http://localhost:5000/api/v1/activity-logs?action=MARKS_ENTERED" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Expected Results

### **POST /api/marks:**
```json
{
  "success": true,
  "message": "Marks entered successfully",
  "data": {
    "id": "...",
    "examId": "...",
    "studentId": "...",
    "marksObtained": 85,
    "remarks": "Excellent performance",
    "status": "PASS",
    "exam": {...},
    "teacher": {...}
  }
}
```

### **GET /api/marks/:examId:**
```json
{
  "success": true,
  "data": {
    "exam": {...},
    "marks": [...],
    "statistics": {
      "totalStudents": 2,
      "passed": 2,
      "failed": 0,
      "averageMarks": "85.00",
      "highestMarks": 90,
      "lowestMarks": 80
    }
  }
}
```

### **GET /api/marks/student/:studentId:**
```json
{
  "success": true,
  "data": {
    "student": {...},
    "marks": [...],
    "statistics": {
      "totalExams": 3,
      "passed": 3,
      "failed": 0,
      "averageMarks": "85.00",
      "averagePercentage": "85.00"
    }
  }
}
```

---

## 🔍 Verification Steps

1. **Check TypeScript Compilation:**
   ```bash
   cd server && npx tsc --noEmit
   ```

2. **Check Server Starts:**
   ```bash
   cd server && npm run dev
   # Should see: "Server running on port 5000"
   ```

3. **Check Routes Registered:**
   ```bash
   curl http://localhost:5000/api/v1/health
   # Should include "Marks" in modules list
   ```

4. **Test API Client (Mobile):**
   - Import `apiClient` in a test file
   - Verify token injection works
   - Verify error handling works

---

## ⚠️ Known Issues Fixed

1. ✅ **TypeScript Error:** Audit log type casting - Fixed with `as any`
2. ✅ **TypeScript Error:** Statistics calculation - Fixed unused `sum` variable
3. ✅ **Code Quality:** All services now use centralized `apiClient`

---

## 🎯 Next Steps

1. Start server: `cd server && npm run dev`
2. Create test exam
3. Test all 4 marks endpoints
4. Verify audit logs are created
5. Test mobile services with `apiClient`

**All code is ready - just needs runtime testing!** 🚀

