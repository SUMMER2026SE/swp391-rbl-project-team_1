# 🧪 Complete Testing & Validation Guide

Comprehensive guide to test all 16 API endpoints with step-by-step instructions.

---

## 📋 Prerequisites

### Tools Needed
- ✅ **Thunder Client** (VS Code Extension) - Recommended for visual testing
- ✅ **curl** (Command line) - For scripted testing
- ✅ **Postman** (Optional) - Alternative to Thunder Client
- ✅ **PostgreSQL** (Running on localhost:5432)
- ✅ **Backend Server** (Running on localhost:5000)

### Demo Accounts Ready
- Admin: `0900000000` / `admin123`
- User: `0901000001` / `pass123`
- Doctor: Created via seed data

---

## 🔐 Authentication Endpoints

### Test 1: Register New User

**Method**: `POST`
**URL**: `http://localhost:5000/api/auth/register`
**Headers**: `Content-Type: application/json`

**Request Body**:
```json
{
  "phone": "0987654321",
  "password": "testpass123"
}
```

**Expected Response** (201):
```json
{
  "message": "Registration successful",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "phone": "0987654321",
    "role": "USER",
    "doctorId": null,
    "createdAt": "2026-05-21T10:30:00Z",
    "updatedAt": "2026-05-21T10:30:00Z"
  }
}
```

**curl Command**:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0987654321",
    "password": "testpass123"
  }'
```

**Test Cases**:
- ✅ Valid phone and password → 201 success
- ❌ Missing phone → 400 error
- ❌ Missing password → 400 error
- ❌ Duplicate phone → 409 conflict
- ❌ Password too short → 400 error

---

### Test 2: Login User

**Method**: `POST`
**URL**: `http://localhost:5000/api/auth/login`
**Headers**: `Content-Type: application/json`

**Request Body**:
```json
{
  "phone": "0901000001",
  "password": "pass123"
}
```

**Expected Response** (200):
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ...",
  "user": {
    "id": "user_0",
    "phone": "0901000001",
    "role": "USER",
    "doctorId": null,
    "createdAt": "2026-05-20T10:00:00Z",
    "updatedAt": "2026-05-20T10:00:00Z"
  }
}
```

**curl Command**:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0901000001",
    "password": "pass123"
  }' | tee login_response.json
```

**Save Token** (for subsequent requests):
```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0901000001","password":"pass123"}' | jq -r '.token')

echo "Saved Token: $TOKEN"
```

**Test Cases**:
- ✅ Valid credentials → 200 with token
- ❌ Wrong password → 401 error
- ❌ Non-existent phone → 401 error
- ❌ Empty fields → 400 error

---

### Test 3: Get Profile (Protected)

**Method**: `GET`
**URL**: `http://localhost:5000/api/profile`
**Headers**: 
```
Authorization: Bearer <token>
```

**Expected Response** (200):
```json
{
  "message": "Profile fetched successfully",
  "user": {
    "id": "user_0",
    "phone": "0901000001",
    "role": "USER",
    "doctorId": null,
    "createdAt": "2026-05-20T10:00:00Z",
    "updatedAt": "2026-05-20T10:00:00Z"
  }
}
```

**curl Command**:
```bash
TOKEN="your_jwt_token_here"
curl -X GET http://localhost:5000/api/profile \
  -H "Authorization: Bearer $TOKEN"
```

**Test Cases**:
- ✅ Valid token → 200 success
- ❌ Missing token → 401 error
- ❌ Invalid token → 401 error
- ❌ Expired token → 401 error

---

## 👥 Doctor Endpoints

### Test 4: List All Doctors

**Method**: `GET`
**URL**: `http://localhost:5000/api/doctors`
**Headers**: None (public)

**Expected Response** (200):
```json
{
  "message": "Doctors fetched successfully",
  "count": 5,
  "doctors": [
    {
      "id": "doctor_0",
      "name": "Dr. Nguyễn Văn An",
      "specialty": "Cardiology",
      "experience": 15,
      "hospital": "Bệnh viện Chợ Rẫy",
      "avatar": "https://i.pravatar.cc/150?img=1",
      "createdAt": "2026-05-20T10:00:00Z"
    }
    // ... 4 more doctors
  ]
}
```

**curl Command**:
```bash
curl -X GET http://localhost:5000/api/doctors | jq
```

**Test Cases**:
- ✅ No parameters → 200 with all doctors (count: 5)
- ✅ Response includes all required fields
- ✅ Doctors ordered by name

---

### Test 5: Get Single Doctor

**Method**: `GET`
**URL**: `http://localhost:5000/api/doctors/doctor_0`
**Headers**: None (public)

**Expected Response** (200):
```json
{
  "message": "Doctor details fetched successfully",
  "doctor": {
    "id": "doctor_0",
    "name": "Dr. Nguyễn Văn An",
    "specialty": "Cardiology",
    "experience": 15,
    "hospital": "Bệnh viện Chợ Rẫy",
    "avatar": "https://i.pravatar.cc/150?img=1",
    "createdAt": "2026-05-20T10:00:00Z"
  }
}
```

**curl Command**:
```bash
curl -X GET http://localhost:5000/api/doctors/doctor_0 | jq
```

**Test Cases**:
- ✅ Valid doctor ID → 200 success
- ❌ Invalid doctor ID → 404 not found
- ❌ Missing ID parameter → 400 error

---

### Test 6: List Doctor Schedules

**Method**: `GET`
**URL**: `http://localhost:5000/api/doctors/doctor_0/schedules`
**Headers**: None (public)

**Expected Response** (200):
```json
{
  "message": "Schedules fetched",
  "schedules": [
    {
      "id": "schedule_0",
      "doctorId": "doctor_0",
      "dayOfWeek": 1,
      "startTime": "08:00",
      "endTime": "17:00",
      "isAvailable": true,
      "createdAt": "2026-05-20T10:00:00Z"
    }
    // ... more schedules
  ]
}
```

**curl Command**:
```bash
curl -X GET http://localhost:5000/api/doctors/doctor_0/schedules | jq
```

**Test Cases**:
- ✅ Valid doctor ID → 200 with schedules
- ❌ Invalid doctor ID → 404 error
- ✅ Response includes dayOfWeek (0-6), startTime, endTime

---

### Test 7: Create Doctor Schedule (Protected)

**Method**: `POST`
**URL**: `http://localhost:5000/api/doctors/doctor_0/schedules`
**Headers**: 
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "dayOfWeek": 3,
  "startTime": "09:00",
  "endTime": "18:00",
  "isAvailable": true
}
```

**Expected Response** (201):
```json
{
  "message": "Schedule created",
  "schedule": {
    "id": "new_schedule_id",
    "doctorId": "doctor_0",
    "dayOfWeek": 3,
    "startTime": "09:00",
    "endTime": "18:00",
    "isAvailable": true,
    "createdAt": "2026-05-21T10:30:00Z"
  }
}
```

**curl Command**:
```bash
TOKEN="your_jwt_token"
curl -X POST http://localhost:5000/api/doctors/doctor_0/schedules \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dayOfWeek": 3,
    "startTime": "09:00",
    "endTime": "18:00",
    "isAvailable": true
  }'
```

**Test Cases**:
- ✅ Valid schedule → 201 created
- ❌ Invalid doctor ID → 404 error
- ❌ Invalid time format → 400 error
- ❌ No authorization → 401 error

---

### Test 8: Get Doctor's Appointments (Doctor Only)

**Method**: `GET`
**URL**: `http://localhost:5000/api/doctor/appointments`
**Headers**: 
```
Authorization: Bearer <doctor_token>
```

**Note**: Only works if logged-in user has DOCTOR role and is linked to a doctor profile

**Expected Response** (200):
```json
{
  "message": "Doctor appointments retrieved successfully",
  "doctor": {
    "id": "doctor_0",
    "name": "Dr. Nguyễn Văn An",
    "specialty": "Cardiology"
  },
  "count": 3,
  "data": [
    {
      "id": "apt_0",
      "userId": "user_0",
      "doctorId": "doctor_0",
      "appointmentDate": "2026-05-22T10:00:00Z",
      "status": "PENDING",
      "notes": "Check-up",
      "createdAt": "2026-05-21T10:30:00Z",
      "user": {
        "id": "user_0",
        "phone": "0901000001",
        "role": "USER"
      },
      "doctor": {
        "id": "doctor_0",
        "name": "Dr. Nguyễn Văn An",
        "specialty": "Cardiology"
      }
    }
  ]
}
```

**Test Cases**:
- ✅ Doctor role + linked profile → 200 success
- ❌ USER role → 403 forbidden
- ❌ No doctor link → 403 forbidden

---

## 📅 Appointment Endpoints

### Test 9: Create Appointment (User Only)

**Method**: `POST`
**URL**: `http://localhost:5000/api/appointments`
**Headers**: 
```
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "doctorId": "doctor_0",
  "appointmentDate": "2026-05-25T10:00:00Z",
  "notes": "Regular checkup"
}
```

**Expected Response** (201):
```json
{
  "message": "Appointment created successfully",
  "appointment": {
    "id": "apt_new_001",
    "userId": "user_0",
    "doctorId": "doctor_0",
    "appointmentDate": "2026-05-25T10:00:00Z",
    "status": "PENDING",
    "notes": "Regular checkup",
    "createdAt": "2026-05-21T10:30:00Z"
  }
}
```

**curl Command**:
```bash
TOKEN="your_jwt_token"
curl -X POST http://localhost:5000/api/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "doctor_0",
    "appointmentDate": "2026-05-25T10:00:00Z",
    "notes": "Regular checkup"
  }'
```

**Test Cases**:
- ✅ Valid doctor, future date, doctor available → 201 created
- ❌ Past date → 400 error
- ❌ Doctor not found → 404 error
- ❌ Slot already booked → 409 conflict
- ❌ Time outside doctor's schedule → 400 error
- ❌ DOCTOR role → 403 forbidden

---

### Test 10: Get My Appointments (User Only)

**Method**: `GET`
**URL**: `http://localhost:5000/api/my-appointments`
**Headers**: 
```
Authorization: Bearer <user_token>
```

**Expected Response** (200):
```json
{
  "message": "Appointments fetched successfully",
  "count": 2,
  "appointments": [
    {
      "id": "apt_0",
      "userId": "user_0",
      "doctorId": "doctor_0",
      "appointmentDate": "2026-05-22T10:00:00Z",
      "status": "PENDING",
      "notes": "Check-up",
      "createdAt": "2026-05-21T10:30:00Z",
      "doctor": {
        "id": "doctor_0",
        "name": "Dr. Nguyễn Văn An",
        "specialty": "Cardiology",
        "experience": 15,
        "hospital": "Bệnh viện Chợ Rẫy",
        "avatar": "https://i.pravatar.cc/150?img=1",
        "createdAt": "2026-05-20T10:00:00Z"
      }
    }
  ]
}
```

**curl Command**:
```bash
TOKEN="your_jwt_token"
curl -X GET http://localhost:5000/api/my-appointments \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Test Cases**:
- ✅ Authenticated user → 200 with their appointments
- ❌ No authentication → 401 error
- ✅ Response includes doctor details
- ✅ Ordered by date (newest first)

---

## 🛡️ Admin Endpoints

### Test 11: Get All Users (Admin Only)

**Method**: `GET`
**URL**: `http://localhost:5000/api/admin/users`
**Headers**: 
```
Authorization: Bearer <admin_token>
```

**Expected Response** (200):
```json
{
  "message": "Users retrieved successfully",
  "count": 16,
  "data": [
    {
      "id": "user_admin_0",
      "phone": "0900000000",
      "role": "ADMIN",
      "doctorId": null,
      "createdAt": "2026-05-20T10:00:00Z"
    },
    // ... 15 more users
  ]
}
```

**curl Command**:
```bash
ADMIN_TOKEN="admin_jwt_token"
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

**Test Cases**:
- ✅ ADMIN role → 200 with all users
- ❌ USER role → 403 forbidden
- ❌ No authentication → 401 error
- ✅ Count shows total users

---

### Test 12: Get All Appointments (Admin Only)

**Method**: `GET`
**URL**: `http://localhost:5000/api/admin/appointments`
**Headers**: 
```
Authorization: Bearer <admin_token>
```

**Expected Response** (200):
```json
{
  "message": "Appointments retrieved successfully",
  "count": 15,
  "data": [
    {
      "id": "apt_0",
      "userId": "user_0",
      "doctorId": "doctor_0",
      "appointmentDate": "2026-05-22T10:00:00Z",
      "status": "PENDING",
      "notes": "Check-up",
      "createdAt": "2026-05-21T10:30:00Z",
      "user": {
        "id": "user_0",
        "phone": "0901000001",
        "role": "USER"
      },
      "doctor": {
        "id": "doctor_0",
        "name": "Dr. Nguyễn Văn An",
        "specialty": "Cardiology"
      }
    }
    // ... more appointments
  ]
}
```

**curl Command**:
```bash
ADMIN_TOKEN="admin_jwt_token"
curl -X GET http://localhost:5000/api/admin/appointments \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

**Test Cases**:
- ✅ ADMIN role → 200 with all appointments
- ❌ USER role → 403 forbidden
- ✅ Includes user and doctor details
- ✅ Ordered by date (newest first)

---

### Test 13: Update User Role (Admin Only)

**Method**: `PUT`
**URL**: `http://localhost:5000/api/admin/users/user_0`
**Headers**: 
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "role": "DOCTOR"
}
```

**Expected Response** (200):
```json
{
  "message": "User role updated successfully",
  "data": {
    "id": "user_0",
    "phone": "0901000001",
    "role": "DOCTOR",
    "doctorId": null,
    "createdAt": "2026-05-20T10:00:00Z",
    "updatedAt": "2026-05-21T11:00:00Z"
  }
}
```

**curl Command**:
```bash
ADMIN_TOKEN="admin_jwt_token"
curl -X PUT http://localhost:5000/api/admin/users/user_0 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "DOCTOR"}'
```

**Test Cases**:
- ✅ Valid user + valid role → 200 updated
- ❌ Invalid role → 400 error
- ❌ USER role → 403 forbidden
- ❌ Non-existent user → 404 error

---

### Test 14: Delete User (Admin Only)

**Method**: `DELETE`
**URL**: `http://localhost:5000/api/admin/users/user_0`
**Headers**: 
```
Authorization: Bearer <admin_token>
```

**Expected Response** (200):
```json
{
  "message": "User deleted successfully"
}
```

**curl Command**:
```bash
ADMIN_TOKEN="admin_jwt_token"
curl -X DELETE http://localhost:5000/api/admin/users/user_0 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Test Cases**:
- ✅ Valid user (non-admin) → 200 deleted
- ❌ ADMIN user → 403 forbidden
- ❌ Your own account → 400 error
- ❌ Non-existent user → 404 error
- ✅ User's appointments also deleted

---

### Test 15: Link Doctor to User (Admin Only)

**Method**: `POST`
**URL**: `http://localhost:5000/api/admin/users/user_doctor_0/link-doctor/doctor_0`
**Headers**: 
```
Authorization: Bearer <admin_token>
```

**Expected Response** (200):
```json
{
  "message": "User account successfully linked to Doctor \"Dr. Nguyễn Văn An\"",
  "data": {
    "userId": "user_doctor_0",
    "doctorId": "doctor_0"
  }
}
```

**curl Command**:
```bash
ADMIN_TOKEN="admin_jwt_token"
curl -X POST http://localhost:5000/api/admin/users/user_doctor_0/link-doctor/doctor_0 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Test Cases**:
- ✅ DOCTOR user + valid doctor → 200 linked
- ❌ USER role → 400 error
- ❌ Doctor already linked → 409 conflict
- ❌ Non-existent user → 404 error
- ❌ Non-existent doctor → 404 error

---

## 💬 Chat/AI Endpoint

### Test 16: Medical Chat

**Method**: `POST`
**URL**: `http://localhost:5000/api/chat`
**Headers**: `Content-Type: application/json`

**Request Body**:
```json
{
  "message": "Tôi bị sốt cao, ho liên tục và đau họng",
  "history": []
}
```

**Expected Response** (200):
```json
{
  "reply": "Dựa trên các triệu chứng bạn mô tả (sốt cao, ho liên tục, đau họng), các nguyên nhân có khả năng cao nhất là:\n\n1. **Cảm cúm (Influenza)**...\n\n⚠️ *Lưu ý: Đây chỉ là chẩn đoán sơ bộ của AI...*"
}
```

**curl Command**:
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tôi bị sốt cao, ho liên tục và đau họng",
    "history": []
  }' | jq '.reply'
```

**Test Cases**:
- ✅ Valid symptom message → 200 with AI response
- ✅ With conversation history → 200 with context-aware response
- ❌ Empty message → 400 error
- ✅ Vietnamese text → Proper Vietnamese response
- ✅ Response includes medical disclaimer

---

## 🔄 Full Integration Test Flow

Complete user journey testing:

```
1. Register new user
   ├─ POST /api/auth/register
   ├─ Save token
   └─ Verify response

2. Login user
   ├─ POST /api/auth/login
   ├─ Save new token
   └─ Verify token format

3. Get profile
   ├─ GET /api/profile (with token)
   └─ Verify user data

4. Browse doctors
   ├─ GET /api/doctors
   ├─ Pick doctor_0
   └─ Get schedules: GET /api/doctors/doctor_0/schedules

5. Book appointment
   ├─ POST /api/appointments
   ├─ Use doctor_0 and future date
   └─ Verify appointment created

6. View appointments
   ├─ GET /api/my-appointments (with token)
   └─ Verify appointment appears

7. Test AI chat
   ├─ POST /api/chat
   ├─ Send symptom description
   └─ Verify AI response

8. Admin operations
   ├─ Login as admin: 0900000000 / admin123
   ├─ GET /api/admin/users
   ├─ GET /api/admin/appointments
   └─ Test user management
```

---

## 📊 Testing Summary Table

| Endpoint | Method | Auth Required | Test Status |
|----------|--------|---------------|-------------|
| Register | POST | No | ✅ |
| Login | POST | No | ✅ |
| Profile | GET | Yes | ✅ |
| List Doctors | GET | No | ✅ |
| Get Doctor | GET | No | ✅ |
| Doctor Schedules | GET | No | ✅ |
| Create Schedule | POST | Yes | ✅ |
| Doctor Appointments | GET | Yes (DOCTOR) | ✅ |
| Create Appointment | POST | Yes (USER) | ✅ |
| My Appointments | GET | Yes (USER) | ✅ |
| Admin Users | GET | Yes (ADMIN) | ✅ |
| Admin Appointments | GET | Yes (ADMIN) | ✅ |
| Update User Role | PUT | Yes (ADMIN) | ✅ |
| Delete User | DELETE | Yes (ADMIN) | ✅ |
| Link Doctor | POST | Yes (ADMIN) | ✅ |
| Chat | POST | No | ✅ |

**Total: 16 Endpoints - All Tested ✅**

---

## 🎯 Quick Test Script

Save as `test_api.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:5000/api"

echo "🧪 Testing Healthcare Booking API"
echo "=================================="

# 1. Register
echo "\n1️⃣ Testing Registration..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"0999999999","password":"test123"}')
echo $REGISTER_RESPONSE | jq

# 2. Login
echo "\n2️⃣ Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0901000001","password":"pass123"}')
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
echo "Token obtained: ${TOKEN:0:20}..."

# 3. Get Doctors
echo "\n3️⃣ Testing List Doctors..."
curl -s -X GET $BASE_URL/doctors | jq '.count'

# 4. Get Profile
echo "\n4️⃣ Testing Get Profile..."
curl -s -X GET $BASE_URL/profile \
  -H "Authorization: Bearer $TOKEN" | jq '.user.phone'

# 5. Book Appointment
echo "\n5️⃣ Testing Book Appointment..."
FUTURE_DATE=$(date -u -d "+5 days" +"T%H:00:00Z")
curl -s -X POST $BASE_URL/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"doctorId\":\"doctor_0\",\"appointmentDate\":\"2026-05-25$FUTURE_DATE\",\"notes\":\"Test booking\"}" | jq '.message'

# 6. Chat
echo "\n6️⃣ Testing AI Chat..."
curl -s -X POST $BASE_URL/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"tôi bị sốt"}' | jq '.reply' | head -3

echo "\n✅ Tests Complete!"
```

Run:
```bash
chmod +x test_api.sh
./test_api.sh
```

---

## ✅ Validation Checklist

After running all tests, verify:

- [ ] All 16 endpoints return correct status codes
- [ ] Responses match documented format
- [ ] Authentication tokens work correctly
- [ ] Role-based access control enforced
- [ ] Validation rules prevent invalid data
- [ ] Error messages are helpful
- [ ] Database persists data correctly
- [ ] Concurrent requests handled properly
- [ ] Performance acceptable (<500ms per request)
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] No broken links in responses

---

## 🎉 All Tests Pass!

If all tests are passing, your Healthcare Booking System is ready for production! 🚀

