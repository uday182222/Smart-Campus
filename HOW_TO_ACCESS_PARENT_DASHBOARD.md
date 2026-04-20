# 📱 How to Access Parent Dashboard

## 🎯 Where to See the Dashboard

### **Option 1: Mobile App (React Native/Expo)**

#### **Navigation Path:**
```
Login Screen 
  → Login as Parent (role: 'parent')
  → ParentTabNavigator
  → Dashboard Tab (First tab, Home icon)
  → ProductionParentDashboard Screen
```

#### **Steps:**
1. **Start the mobile app:**
   ```bash
   cd SmartCampusMobile
   @at whaynpm start
   # Or: npx expo start
   ```

2. **Login as Parent:**
   - Email: `parent@test.com`
   - Password: `parent123`
   - Role: `PARENT`

3. **Access Dashboard:**
   - After login, you'll automatically see the **Parent Dashboard**
   - It's the **first tab** in the bottom navigation (🏠 Home icon)
   - Tab name: **"Dashboard"**

#### **Parent Tab Navigation:**
The Parent Dashboard is part of a 5-tab navigation:
1. 🏠 **Dashboard** → `ProductionParentDashboard` ← **This is your dashboard!**
2. 👥 **Children** → Student dashboard
3. 🚌 **Transport** → Bus tracking
4. 💰 **Fees** → Fee management
5. 📷 **Gallery** → School gallery

---

### **Option 2: API Testing (Direct API Calls)**

#### **Test via curl/Postman:**

1. **Login as Parent:**
   ```bash
   curl -X POST http://localhost:5000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "parent@test.com",
       "password": "parent123"
     }'
   ```
   **Save the token from response**

2. **Get Children:**
   ```bash
   curl -X GET http://localhost:5000/api/v1/parent/children \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Get Dashboard:**
   ```bash
   curl -X GET http://localhost:5000/api/v1/parent/dashboard/STUDENT_ID \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

---

### **Option 3: Test Script**

Run the automated test script:
```bash
./test-parent-end-to-end.sh
```

---

## 📁 File Locations

### **Dashboard Screen:**
- **File:** `SmartCampusMobile/screens/ProductionParentDashboard.tsx`
- **Location in App:** First tab of Parent navigation

### **API Service:**
- **File:** `SmartCampusMobile/services/ParentService.ts`
- **Used by:** `ProductionParentDashboard.tsx`

### **Navigation:**
- **File:** `SmartCampusMobile/navigation/AppNavigator.tsx`
- **Line 191-197:** Dashboard tab definition
- **Line 328-330:** Parent role routing

---

## 🧪 Quick Test Steps

### **1. Start Server:**
```bash
cd server
npm run dev
```

### **2. Create Test Data:**
```bash
cd server
npx ts-node scripts/create-parent-test-data.ts
```

### **3. Start Mobile App:**
```bash
cd SmartCampusMobile
npm start
```

### **4. Login:**
- Open app on simulator/device
- Email: `parent@test.com`
- Password: `parent123`
- Click Login

### **5. View Dashboard:**
- After login, you'll see the **Parent Dashboard** automatically
- It's the first tab (🏠 Home icon) at the bottom

---

## 📊 Dashboard Features You'll See

1. **Header:**
   - Parent name
   - Notification bell

2. **Statistics Cards:**
   - Children count
   - Attendance percentage
   - Pending homework
   - Average marks

3. **Child Selector:**
   - If you have multiple children, you can switch between them
   - Shows selected child info

4. **Children Progress:**
   - List of all children
   - Attendance, homework, and marks for each

5. **Recent Notifications:**
   - Latest school notifications
   - Activity feed

6. **Quick Actions:**
   - View Fees
   - Track Bus
   - Homework
   - Messages
   - Calendar
   - Reports

---

## 🔍 Troubleshooting

### **Dashboard not showing?**
1. Check if you're logged in as `PARENT` role
2. Verify server is running on `http://localhost:5000`
3. Check if parent is linked to a student in database
4. Check console for errors

### **No children showing?**
1. Run: `cd server && npx ts-node scripts/create-parent-test-data.ts`
2. Verify parent-student link exists in database
3. Check API response: `GET /api/parent/children`

### **Data not loading?**
1. Check server logs for errors
2. Verify API endpoints are accessible
3. Check network connection
4. Verify auth token is valid

---

## 📱 Mobile App Access

**The dashboard is accessible at:**
- **Screen:** `ProductionParentDashboard.tsx`
- **Route:** `ParentMain → Dashboard` (first tab)
- **Navigation:** Bottom tab bar, first icon (🏠 Home)

**To see it:**
1. Open the mobile app
2. Login with parent credentials
3. Dashboard appears automatically as the first screen

---

## 🌐 API Access

**Base URL:** `http://localhost:5000/api/v1`

**Endpoints:**
- `GET /parent/children` - Get children list
- `GET /parent/dashboard/:studentId` - Get dashboard data

**Authentication:** Requires Bearer token with PARENT role

---

## ✅ Quick Verification

Run this to verify everything is set up:
```bash
# 1. Check server
curl http://localhost:5000/health

# 2. Login and get token
TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"parent@test.com","password":"parent123"}' \
  | jq -r '.data.token')

# 3. Test children endpoint
curl -X GET http://localhost:5000/api/v1/parent/children \
  -H "Authorization: Bearer $TOKEN"
```

If all three work, the dashboard is ready! 🎉

