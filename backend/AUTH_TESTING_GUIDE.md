# Authentication System - Complete Testing Guide

## 📋 Tổng Quan

Healthcare Booking System đã được trang bị hệ thống Authentication đầy đủ sử dụng:
- **JWT (JSON Web Tokens)** cho stateless authentication
- **bcrypt** để hash password an toàn (12 rounds salt)
- **Prisma ORM** để quản lý dữ liệu User
- **PostgreSQL** làm database
- **Express** Middleware để xác thực requests
- **TypeScript** strict mode cho type safety

## 🏗️ Kiến Trúc Hệ Thống

```
Client (Next.js)
    ↓
API Requests (HTTP/REST)
    ↓
Express Routes (/api/auth/*)
    ↓
Auth Controller (validate request)
    ↓
Auth Service (business logic)
    ↓
Prisma Client → PostgreSQL
    ↓
Response with JWT Token (localStorage)
```

## 📁 Cấu Trúc Files

```
backend/src/
├── routes/
│   └── auth.routes.ts           # Routes: /api/auth/register, /api/auth/login
├── controllers/
│   └── auth.controller.ts       # Handle requests, validate input
├── services/
│   └── auth.service.ts          # Business logic: hash, JWT, database
├── middleware/
│   ├── auth.middleware.ts       # verifyToken() - JWT validation
│   └── error.middleware.ts      # Global error handler
├── utils/
│   └── apiError.ts              # Custom error class
├── prisma/
│   ├── client.ts                # Prisma instance
│   └── schema.prisma            # User model
└── types/
    └── user.types.ts            # User types
```

## 🔑 API Endpoints

### 1. Register - POST `/api/auth/register`

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0123456789",
    "password": "password123"
  }'
```

**Request Body:**
```json
{
  "phone": "0123456789",        // Unique, required
  "password": "password123"     // Min 6 chars, required
}
```

**Success Response (201):**
```json
{
  "message": "Registration successful",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "phone": "0123456789",
    "role": "USER",
    "doctorId": null,
    "createdAt": "2026-05-20T10:30:00Z",
    "updatedAt": "2026-05-20T10:30:00Z"
  }
}
```

**Error Responses:**

- **400 - Missing fields:**
```json
{
  "message": "Phone and password are required"
}
```

- **400 - Short password:**
```json
{
  "message": "Password must be at least 6 characters"
}
```

- **409 - Phone already registered:**
```json
{
  "message": "Phone already registered"
}
```

---

### 2. Login - POST `/api/auth/login`

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0123456789",
    "password": "password123"
  }'
```

**Request Body:**
```json
{
  "phone": "0123456789",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "phone": "0123456789",
    "role": "USER",
    "doctorId": null,
    "createdAt": "2026-05-20T10:30:00Z",
    "updatedAt": "2026-05-20T10:30:00Z"
  }
}
```

**Error Response (401):**
```json
{
  "message": "Invalid credentials"
}
```

---

### 3. Get Profile - GET `/api/profile`

**Request (with Token):**
```bash
curl -X GET http://localhost:5000/api/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200):**
```json
{
  "message": "Profile fetched successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "phone": "0123456789",
    "role": "USER",
    "doctorId": null,
    "createdAt": "2026-05-20T10:30:00Z",
    "updatedAt": "2026-05-20T10:30:00Z"
  }
}
```

**Error Response (401):**
```json
{
  "message": "Authorization header is missing or malformed"
}
```

---

## 🧪 Testing với Thunder Client

### Setup

1. **Install Thunder Client** trong VS Code (optional, hoặc dùng Postman)
2. **Create new collection**: Healthcare Booking API

### Test Cases

#### Test 1: Register New User

```
Method: POST
URL: http://localhost:5000/api/auth/register
Headers:
  Content-Type: application/json

Body (JSON):
{
  "phone": "0987654321",
  "password": "password123"
}

Expected: 201 Created
Response:
{
  "message": "Registration successful",
  "user": { ... }
}
```

#### Test 2: Login with Registered User

```
Method: POST
URL: http://localhost:5000/api/auth/login
Headers:
  Content-Type: application/json

Body (JSON):
{
  "phone": "0987654321",
  "password": "password123"
}

Expected: 200 OK
Response contains JWT token
```

#### Test 3: Access Profile with Token

```
Method: GET
URL: http://localhost:5000/api/profile
Headers:
  Authorization: Bearer <token_from_login>

Expected: 200 OK
Response:
{
  "message": "Profile fetched successfully",
  "user": { ... }
}
```

#### Test 4: Try Login with Wrong Password

```
Method: POST
URL: http://localhost:5000/api/auth/login

Body:
{
  "phone": "0987654321",
  "password": "wrongpassword"
}

Expected: 401 Unauthorized
Response:
{
  "message": "Invalid credentials"
}
```

#### Test 5: Try Register Duplicate Phone

```
Method: POST
URL: http://localhost:5000/api/auth/register

Body:
{
  "phone": "0987654321",  // Same as Test 1
  "password": "newpassword"
}

Expected: 409 Conflict
Response:
{
  "message": "Phone already registered"
}
```

#### Test 6: Try Access Profile without Token

```
Method: GET
URL: http://localhost:5000/api/profile
Headers: (no Authorization header)

Expected: 401 Unauthorized
Response:
{
  "message": "Authorization header is missing or malformed"
}
```

---

## 🚀 Chạy Backend

### 1. Setup Database

```bash
cd backend

# Tạo/update database schema
npx prisma migrate reset --force

# Hoặc (nếu không reset)
npx prisma migrate dev
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Chạy Dev Server

```bash
npm run dev

# Output:
# [INFO] 10:30:00 ts-node-dev ver. 2.0.0 (using ts-node ver. 10.9.2, typescript ver. 6.0.3)
# Server running on port 5000
```

### 4. Xem Database (Prisma Studio)

```bash
npm run prisma:studio

# Sẽ mở browser tại http://localhost:5555
```

---

## 🔐 JWT Token Structure

**Payload:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "role": "USER",
  "iat": 1716194400,
  "exp": 1716799200
}
```

**Properties:**
- `userId`: User's unique ID (UUID)
- `role`: USER, DOCTOR, or ADMIN
- `iat`: Issued at (timestamp)
- `exp`: Expires at (7 days from issue)

**Token Format:**
```
Header.Payload.Signature
```

---

## 📊 Prisma Schema

```prisma
model User {
  id        String   @id @default(uuid())      // UUID primary key
  phone     String   @unique                  // Phone number (unique)
  password  String                            // Bcrypt hashed
  role      Role     @default(USER)           // USER, DOCTOR, ADMIN
  doctorId  String?  @unique                  // Link to Doctor (nullable)
  createdAt DateTime @default(now())          // Auto timestamp
  updatedAt DateTime @updatedAt               // Auto update
  
  // Relations
  appointments Appointment[]
  doctor       Doctor?       @relation(fields: [doctorId], references: [id])
}

enum Role {
  USER
  DOCTOR
  ADMIN
}
```

---

## 🔄 Authentication Flow

### Register Flow
```
1. User submits phone + password
2. API validates input
   - Phone required
   - Password length ≥ 6
3. Check if phone already exists
4. Hash password with bcrypt (12 rounds)
5. Create User in PostgreSQL
6. Return user object (no password)
```

### Login Flow
```
1. User submits phone + password
2. Find User by phone in database
3. Compare password with bcrypt
4. If match:
   - Create JWT token (expires in 7 days)
   - Return token + user object
5. If no match:
   - Return "Invalid credentials" (401)
```

### Protected Routes Flow
```
1. Client sends request with token in Authorization header
2. Middleware extracts token
3. Verify JWT signature with JWT_SECRET
4. Extract userId and role from token
5. Attach user data to request.user
6. Controller proceeds with authenticated user
```

---

## ⚙️ Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/healthcare_booking"

# JWT
JWT_SECRET="my_super_secret_key_123"

# Server (optional)
PORT=5000
CORS_ORIGIN="http://localhost:3000"
```

---

## 🛡️ Security Features

✅ **Password Hashing**
- bcrypt with 12 salt rounds
- Never stored in plaintext
- Passwords excluded from API responses

✅ **JWT Tokens**
- Signed with JWT_SECRET
- Expires after 7 days
- Stateless (no session storage)
- Includes userId and role

✅ **Input Validation**
- Phone and password required
- Password minimum 6 characters
- SQL injection prevention (Prisma parameterized queries)

✅ **Error Handling**
- User enumeration protection (same error for not found/wrong password)
- Proper HTTP status codes
- No sensitive info in error messages

✅ **TypeScript**
- Strict mode enabled
- No `any` types
- Full type safety

---

## 📝 Validation Rules

| Field | Rule | Error Code |
|-------|------|-----------|
| `phone` | Required, unique | 400 / 409 |
| `password` | Required, min 6 chars | 400 |
| Token | Valid JWT, not expired | 401 |

---

## 🐛 Troubleshooting

### "Database connection failed"
```bash
# Check if PostgreSQL is running
psql -U postgres -d healthcare_booking

# Or check DATABASE_URL in .env
```

### "JWT_SECRET environment variable is required"
```bash
# Ensure .env file has JWT_SECRET
cat .env | grep JWT_SECRET

# Or set it:
export JWT_SECRET="your_secret_key"
```

### "Phone already registered"
```bash
# Use a different phone number
# Or clear database:
npx prisma migrate reset
```

### "Invalid token"
```bash
# Token has expired (7 days)
# Token was tampered with
# Wrong JWT_SECRET
# Re-login to get new token
```

### "Token is empty" or "Authorization header is missing"
```bash
# Include full header:
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

# Not:
Authorization: eyJhbGciOiJIUzI1NiIs...
```

---

## 📚 Files Modified/Created

✅ `backend/src/routes/auth.routes.ts` - Register, Login routes
✅ `backend/src/controllers/auth.controller.ts` - Request handlers
✅ `backend/src/services/auth.service.ts` - Business logic
✅ `backend/src/middleware/auth.middleware.ts` - JWT verification
✅ `backend/src/middleware/error.middleware.ts` - Error handling
✅ `backend/src/utils/apiError.ts` - Custom error class
✅ `backend/src/prisma/client.ts` - Prisma instance
✅ `backend/prisma/schema.prisma` - User model
✅ `backend/.env` - Environment variables

---

## ✅ Build & Deploy

### Development
```bash
npm run dev    # Start with hot reload
```

### Production
```bash
npm run build  # Compile TypeScript
npm start      # Run compiled code
```

### Database
```bash
npx prisma migrate deploy    # Apply migrations
npx prisma db push           # Push schema (dev only)
npx prisma db seed           # Run seed
```

---

## 🎯 Next Steps

1. **Test Register** - Create new user
2. **Test Login** - Get JWT token
3. **Test Protected Route** - Use token to access /api/profile
4. **View in Prisma Studio** - See user in database
5. **Integrate with Frontend** - Pass token to Next.js app
6. **Deploy** - Push to production

---

**Updated**: May 20, 2026
**Version**: 1.0.0 - Production Ready
