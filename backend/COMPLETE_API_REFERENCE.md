# 🏥 Healthcare Booking System - Complete API Reference

**Status**: ✅ **ALL SYSTEMS OPERATIONAL** (TypeScript: 0 errors)

---

## 📚 Table of Contents

1. [Authentication APIs](#authentication-apis)
2. [Doctor APIs](#doctor-apis)  
3. [Appointment APIs](#appointment-apis)
4. [Admin APIs](#admin-apis)
5. [Chat/AI APIs](#chatai-apis)
6. [Testing with Thunder Client](#testing-with-thunder-client)
7. [Integration Flow](#integration-flow)

---

## 🔐 Authentication APIs

### 1. Register User

**Endpoint**: `POST /api/auth/register`

**Access**: Public (no token required)

**Request Body**:
```json
{
  "phone": "0123456789",
  "password": "password123"
}
```

**Validation**:
- Phone: Required, unique
- Password: Required, minimum 6 characters

**Response (201 Created)**:
```json
{
  "message": "Registration successful",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "phone": "0123456789",
    "role": "USER",
    "doctorId": null,
    "createdAt": "2026-05-21T10:30:00Z",
    "updatedAt": "2026-05-21T10:30:00Z"
  }
}
```

**Error Responses**:
- `400` - Missing phone or password
- `400` - Password too short
- `409` - Phone already registered

**curl Example**:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"0123456789","password":"password123"}'
```

---

### 2. Login User

**Endpoint**: `POST /api/auth/login`

**Access**: Public (no token required)

**Request Body**:
```json
{
  "phone": "0123456789",
  "password": "password123"
}
```

**Response (200 OK)**:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "phone": "0123456789",
    "role": "USER",
    "doctorId": null,
    "createdAt": "2026-05-21T10:30:00Z",
    "updatedAt": "2026-05-21T10:30:00Z"
  }
}
```

**Error Response (401)**:
```json
{
  "message": "Invalid credentials"
}
```

**curl Example**:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0123456789","password":"password123"}'
```

---

### 3. Get Profile

**Endpoint**: `GET /api/profile`

**Access**: Protected (requires valid JWT token)

**Headers**:
```
Authorization: Bearer <token>
```

**Response (200 OK)**:
```json
{
  "message": "Profile fetched successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "phone": "0123456789",
    "role": "USER",
    "doctorId": null,
    "createdAt": "2026-05-21T10:30:00Z",
    "updatedAt": "2026-05-21T10:30:00Z"
  }
}
```

**curl Example**:
```bash
TOKEN="your_jwt_token_here"
curl -X GET http://localhost:5000/api/profile \
  -H "Authorization: Bearer $TOKEN"
```

---

## 👨‍⚕️ Doctor APIs

### 1. List All Doctors

**Endpoint**: `GET /api/doctors`

**Access**: Public (no token required)

**Query Parameters**: None

**Response (200 OK)**:
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
    },
    {
      "id": "doctor_1",
      "name": "Dr. Trần Thị Bảo",
      "specialty": "Pediatrics",
      "experience": 12,
      "hospital": "Bệnh viện Nhi đồng 1",
      "avatar": "https://i.pravatar.cc/150?img=2",
      "createdAt": "2026-05-20T10:00:00Z"
    }
  ]
}
```

**curl Example**:
```bash
curl -X GET http://localhost:5000/api/doctors
```

---

### 2. Get Doctor Details

**Endpoint**: `GET /api/doctors/:id`

**Access**: Public (no token required)

**URL Parameters**:
- `id` - Doctor UUID

**Response (200 OK)**:
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

**curl Example**:
```bash
curl -X GET http://localhost:5000/api/doctors/doctor_0
```

---

### 3. List Doctor Schedules

**Endpoint**: `GET /api/doctors/:id/schedules`

**Access**: Public (no token required)

**URL Parameters**:
- `id` - Doctor UUID

**Response (200 OK)**:
```json
{
  "message": "Schedules fetched",
  "schedules": [
    {
      "id": "schedule_doctor_0_1",
      "doctorId": "doctor_0",
      "dayOfWeek": 1,
      "startTime": "08:00",
      "endTime": "17:00",
      "isAvailable": true,
      "createdAt": "2026-05-20T10:00:00Z"
    },
    {
      "id": "schedule_doctor_0_2",
      "doctorId": "doctor_0",
      "dayOfWeek": 2,
      "startTime": "08:00",
      "endTime": "17:00",
      "isAvailable": true,
      "createdAt": "2026-05-20T10:00:00Z"
    }
  ]
}
```

**curl Example**:
```bash
curl -X GET http://localhost:5000/api/doctors/doctor_0/schedules
```

---

### 4. Create Doctor Schedule

**Endpoint**: `POST /api/doctors/:id/schedules`

**Access**: Protected (requires TOKEN, any authenticated user)

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**URL Parameters**:
- `id` - Doctor UUID

**Request Body**:
```json
{
  "dayOfWeek": 1,
  "startTime": "08:00",
  "endTime": "17:00",
  "isAvailable": true
}
```

**Validation**:
- `dayOfWeek`: 0-6 (Sunday-Saturday)
- `startTime`, `endTime`: Format HH:MM
- `isAvailable`: Optional boolean (default true)

**Response (201 Created)**:
```json
{
  "message": "Schedule created",
  "schedule": {
    "id": "schedule_doctor_0_1",
    "doctorId": "doctor_0",
    "dayOfWeek": 1,
    "startTime": "08:00",
    "endTime": "17:00",
    "isAvailable": true,
    "createdAt": "2026-05-21T10:30:00Z"
  }
}
```

---

### 5. Get Doctor's Appointments

**Endpoint**: `GET /api/doctor/appointments`

**Access**: Protected (requires DOCTOR role)

**Headers**:
```
Authorization: Bearer <doctor_token>
```

**Response (200 OK)**:
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

---

## 📅 Appointment APIs

### 1. Create Appointment

**Endpoint**: `POST /api/appointments`

**Access**: Protected (requires USER role)

**Headers**:
```
Authorization: Bearer <token>
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

**Validation**:
- `doctorId`: Required, must exist
- `appointmentDate`: Required, must be ISO format, must be in future
- `notes`: Optional

**Booking Validation** (via middleware):
- Doctor must have available schedule on that day/time
- Slot must not be already booked
- Time must be within doctor's schedule hours

**Response (201 Created)**:
```json
{
  "message": "Appointment created successfully",
  "appointment": {
    "id": "apt_new_001",
    "userId": "user_123",
    "doctorId": "doctor_0",
    "appointmentDate": "2026-05-25T10:00:00Z",
    "status": "PENDING",
    "notes": "Regular checkup",
    "createdAt": "2026-05-21T10:30:00Z"
  }
}
```

**Error Responses**:
- `400` - Missing fields or invalid format
- `400` - Date in past
- `404` - Doctor not found
- `409` - Slot already booked

**curl Example**:
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

---

### 2. Get My Appointments

**Endpoint**: `GET /api/my-appointments`

**Access**: Protected (requires USER role)

**Headers**:
```
Authorization: Bearer <token>
```

**Response (200 OK)**:
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

**curl Example**:
```bash
TOKEN="your_jwt_token"
curl -X GET http://localhost:5000/api/my-appointments \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🛡️ Admin APIs

All admin endpoints require **ADMIN role** and valid JWT token.

### 1. Get All Users

**Endpoint**: `GET /api/admin/users`

**Access**: Protected (ADMIN only)

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response (200 OK)**:
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
    {
      "id": "user_0",
      "phone": "0901000001",
      "role": "USER",
      "doctorId": null,
      "createdAt": "2026-05-20T10:00:00Z"
    }
  ]
}
```

---

### 2. Get All Appointments

**Endpoint**: `GET /api/admin/appointments`

**Access**: Protected (ADMIN only)

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response (200 OK)**:
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
  ]
}
```

---

### 3. Update User Role

**Endpoint**: `PUT /api/admin/users/:id`

**Access**: Protected (ADMIN only)

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**URL Parameters**:
- `id` - User UUID

**Request Body**:
```json
{
  "role": "DOCTOR"
}
```

**Valid Roles**: USER, DOCTOR, ADMIN

**Response (200 OK)**:
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

---

### 4. Delete User

**Endpoint**: `DELETE /api/admin/users/:id`

**Access**: Protected (ADMIN only)

**Headers**:
```
Authorization: Bearer <admin_token>
```

**URL Parameters**:
- `id` - User UUID

**Restrictions**:
- Cannot delete ADMIN users
- Cannot delete your own account
- Deletes all user's appointments automatically

**Response (200 OK)**:
```json
{
  "message": "User deleted successfully"
}
```

**Error Responses**:
- `400` - Cannot delete your own account
- `403` - Cannot delete admin users
- `404` - User not found

---

### 5. Link Doctor to User

**Endpoint**: `POST /api/admin/users/:userId/link-doctor/:doctorId`

**Access**: Protected (ADMIN only)

**Headers**:
```
Authorization: Bearer <admin_token>
```

**URL Parameters**:
- `userId` - User UUID (must have DOCTOR role)
- `doctorId` - Doctor UUID (must not be linked to another user)

**Response (200 OK)**:
```json
{
  "message": "User account successfully linked to Doctor \"Dr. Nguyễn Văn An\"",
  "data": {
    "userId": "user_doctor_0",
    "doctorId": "doctor_0"
  }
}
```

**Error Responses**:
- `400` - User must have DOCTOR role
- `404` - User not found
- `404` - Doctor not found
- `409` - Doctor already linked to another user

---

## 💬 Chat/AI APIs

### 1. Medical Consultation Chat

**Endpoint**: `POST /api/chat`

**Access**: Public (no token required)

**Request Body**:
```json
{
  "message": "Tôi bị sốt cao, ho liên tục và đau họng. Điều này có phải cúm không?",
  "history": [
    {
      "role": "user",
      "text": "Xin chào, tôi muốn hỏi về sức khỏe"
    },
    {
      "role": "model",
      "text": "Xin chào! Tôi là MedBooking AI, sẵn sàng giúp bạn..."
    }
  ]
}
```

**Parameters**:
- `message`: Required, symptom description in Vietnamese
- `history`: Optional, previous messages (up to 5)

**Response (200 OK)**:
```json
{
  "reply": "Dựa trên các triệu chứng bạn mô tả (sốt cao, ho liên tục, đau họng), các nguyên nhân có khả năng cao nhất là:\n\n1. **Cảm cúm (Influenza)** - Có thể kèm sốt cao, cơn ho, đau họng\n2. **Viêm họng cấp tính (Acute Pharyngitis)** - Gây ra đau họng, sốt\n3. **Viêm phế quản tính cấp (Acute Bronchitis)** - Triệu chứng ho liên tục\n\n**Khuyến cáo chăm sóc tại nhà:**\n- Nghỉ ngơi đầy đủ, uống nước ấm thường xuyên\n- Dùng nước muối để súc họng giảm đau\n- Không tự dùng kháng sinh mà chưa hỏi bác sĩ\n\n**Chuyên khoa khuyến nghị:** Khoa Tai Mũi Họng, Khoa Hô Hấp\n\n⚠️ *Lưu ý: Đây chỉ là chẩn đoán sơ bộ của AI. Vui lòng đặt lịch khám trực tiếp với bác sĩ chuyên khoa để được kiểm tra chính xác nhất.*"
}
```

---

## 🧪 Testing with Thunder Client

### Setup Thunder Client Collection

1. **Install Thunder Client** (VS Code Extension)
2. **Create New Collection**: `Healthcare Booking API`
3. **Create Requests**:

#### Request 1: Register
```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "phone": "0123456789",
  "password": "password123"
}
```

#### Request 2: Login
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "phone": "0123456789",
  "password": "password123"
}
```

_Copy token from response and save as `token` environment variable_

#### Request 3: Get Profile
```
GET http://localhost:5000/api/profile
Authorization: Bearer {{token}}
```

#### Request 4: List Doctors
```
GET http://localhost:5000/api/doctors
```

#### Request 5: Get Doctor Details
```
GET http://localhost:5000/api/doctors/doctor_0
```

#### Request 6: Book Appointment
```
POST http://localhost:5000/api/appointments
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "doctorId": "doctor_0",
  "appointmentDate": "2026-05-25T10:00:00Z",
  "notes": "Checkup"
}
```

#### Request 7: My Appointments
```
GET http://localhost:5000/api/my-appointments
Authorization: Bearer {{token}}
```

#### Request 8: Medical Chat
```
POST http://localhost:5000/api/chat
Content-Type: application/json

{
  "message": "Tôi bị sốt cao, ho và đau họng"
}
```

#### Request 9: Admin Get Users
```
GET http://localhost:5000/api/admin/users
Authorization: Bearer {{admin_token}}
```

---

## 🔄 Integration Flow

### Patient User Flow
```
1. Register (POST /api/auth/register)
   ↓
2. Login (POST /api/auth/login) → Get token
   ↓
3. Browse Doctors (GET /api/doctors)
   ↓
4. View Doctor Details (GET /api/doctors/:id)
   ↓
5. View Doctor Schedules (GET /api/doctors/:id/schedules)
   ↓
6. Book Appointment (POST /api/appointments)
   ↓
7. View My Appointments (GET /api/my-appointments)
   ↓
8. Chat with AI (POST /api/chat)
```

### Doctor Flow
```
1. Created with DOCTOR role (via seed or admin)
   ↓
2. Admin links Doctor to User (POST /api/admin/users/:userId/link-doctor/:doctorId)
   ↓
3. Doctor login with User account
   ↓
4. View their appointments (GET /api/doctor/appointments)
   ↓
5. Can manage schedules (POST /api/doctors/:id/schedules)
```

### Admin Flow
```
1. Login with ADMIN account
   ↓
2. View all users (GET /api/admin/users)
   ↓
3. Update user roles (PUT /api/admin/users/:id)
   ↓
4. View all appointments (GET /api/admin/appointments)
   ↓
5. Link doctors to users (POST /api/admin/users/:userId/link-doctor/:doctorId)
   ↓
6. Delete users (DELETE /api/admin/users/:id)
```

---

## 📊 Data Models

### User
```
{
  id: UUID
  phone: string (unique)
  password: string (bcrypt hashed)
  role: USER | DOCTOR | ADMIN
  doctorId: UUID | null (if role = DOCTOR)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Doctor
```
{
  id: UUID
  name: string
  specialty: string
  experience: number
  hospital: string
  avatar: string (URL)
  createdAt: DateTime
}
```

### DoctorSchedule
```
{
  id: UUID
  doctorId: UUID
  dayOfWeek: 0-6 (Sun-Sat)
  startTime: string (HH:MM)
  endTime: string (HH:MM)
  isAvailable: boolean
  createdAt: DateTime
}
```

### Appointment
```
{
  id: UUID
  userId: UUID
  doctorId: UUID
  appointmentDate: DateTime
  status: PENDING | CONFIRMED | COMPLETED | CANCELLED
  notes: string | null
  createdAt: DateTime
}
```

---

## 🔐 Security

- ✅ **JWT Tokens**: 7-day expiry
- ✅ **Bcrypt Passwords**: 12-round hashing
- ✅ **Role-based Access**: ADMIN, DOCTOR, USER
- ✅ **SQL Injection Prevention**: Prisma parameterized queries
- ✅ **Error Messages**: Safe, no sensitive data leaked

---

## 🚀 Ready for Use

All APIs are **production-ready** and fully documented. Start building your frontend! 🎉

