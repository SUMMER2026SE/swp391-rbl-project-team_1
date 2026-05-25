# Quick Start - Authentication System

## ⚡ 5-Minute Setup

### 1. Start Backend Server
```bash
cd backend
npm run dev
```

Output:
```
[INFO] 10:30:00 ts-node-dev ver. 2.0.0
Server running on port 5000
```

### 2. Register New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0123456789",
    "password": "password123"
  }'
```

Copy the `token` from response.

### 3. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0123456789",
    "password": "password123"
  }'
```

### 4. Access Protected Route
```bash
curl -X GET http://localhost:5000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📊 Database

**View users in Prisma Studio:**
```bash
npm run prisma:studio
```

Browser opens at http://localhost:5555

## 🔑 Key Features

✅ Register with phone + password  
✅ Login returns JWT token (7-day expiry)  
✅ Protected /api/profile endpoint  
✅ Bcrypt password hashing (12 rounds)  
✅ PostgreSQL database  
✅ TypeScript strict mode  
✅ Global error handling  

## 📝 Schema

```
User {
  id: UUID
  phone: String (unique)
  password: String (hashed)
  role: USER | DOCTOR | ADMIN
  createdAt: DateTime
  updatedAt: DateTime
}
```

## 🧪 Thunder Client Collection

```
POST /api/auth/register
POST /api/auth/login
GET /api/profile (with Bearer token)
```

## 🚀 Production

```bash
npm run build
npm start
```

---

See [AUTH_TESTING_GUIDE.md](AUTH_TESTING_GUIDE.md) for complete testing guide.
