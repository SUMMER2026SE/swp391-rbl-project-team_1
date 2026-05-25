# 🚀 Quick Start Guide

## Backend Setup

### 1. **Start PostgreSQL Database**

Make sure PostgreSQL is running on port 5432 with:
```
Database: healthcare_booking
User: postgres
Password: 123456
```

### 2. **Seed Database**

```bash
cd backend
npx prisma db push
npx ts-node prisma/seed.ts
```

**Created Demo Data**:
- 1 Admin User: `phone: "0900000000"`, `password: "admin123"`
- 5 Doctors with schedules and specialties
- 10 Patient Users: `phone: "090100000X"`, `password: "pass123"` (X = 1-10)
- 15 Appointments across doctors and patients

### 3. **Start Development Server**

```bash
cd backend
npm run dev
```

Output:
```
Server running on port 5000
```

### 4. **Verify System**

```bash
# Check all endpoints are working
curl http://localhost:5000/api/doctors
curl http://localhost:5000/api/chat -X POST -H "Content-Type: application/json" \
  -d '{"message":"tôi bị sốt"}'
```

---

## Test Accounts

### Admin Account
```
Phone: 0900000000
Password: admin123
Role: ADMIN
```

### Doctor Account (Example 1)
```
Phone: (generated - ask admin to create)
Password: (generated)
Role: DOCTOR
```

### Patient Accounts
```
Phone: 0901000001 - 0901000010
Password: pass123
Role: USER
```

---

## Quick API Tests

### 1. Register New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0987654321",
    "password": "mypassword"
  }'
```

### 2. Login
```bash
RESPONSE=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0901000001",
    "password": "pass123"
  }')

TOKEN=$(echo $RESPONSE | jq -r '.token')
echo "Token: $TOKEN"
```

### 3. Browse Doctors
```bash
curl http://localhost:5000/api/doctors | jq
```

### 4. Book Appointment
```bash
TOKEN="your_token_here"
curl -X POST http://localhost:5000/api/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "doctor_0",
    "appointmentDate": "2026-05-25T10:00:00Z",
    "notes": "Check-up"
  }'
```

### 5. View My Appointments
```bash
TOKEN="your_token_here"
curl -X GET http://localhost:5000/api/appointments/my \
  -H "Authorization: Bearer $TOKEN"
```

---

## Environment Variables

**File**: `backend/.env`

```env
DATABASE_URL="postgresql://postgres:123456@localhost:5432/healthcare_booking"
JWT_SECRET="my_super_secret_key_123"
GEMINI_API_KEY="your_gemini_api_key_here"
```

---

## Common Issues

### 1. "Cannot connect to database"
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Run: `psql postgresql://postgres:123456@localhost:5432/healthcare_booking`

### 2. "Prisma EPERM error"
- This is a Windows file lock issue (not critical)
- TypeScript still compiles correctly
- Dev server still runs fine

### 3. "Invalid token"
- Token expires after 7 days
- Re-login to get new token
- Make sure to use `Bearer ` prefix in Authorization header

### 4. "Slot already booked"
- The appointment date/time already has a booking
- Doctor must have availability on that day/time
- Try a different time

---

