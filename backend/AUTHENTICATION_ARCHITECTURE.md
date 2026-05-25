# Authentication Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                       │
│            http://localhost:3000                                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ AuthContext / useAuth Hook                              │   │
│  │  - Manage login/register state                          │   │
│  │  - Store JWT in localStorage                            │   │
│  │  - Auto-attach token to API requests                    │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │                                       │
└─────────────────────────┼───────────────────────────────────────┘
                          │ HTTP/REST Requests
                          │ (with Bearer token in header)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              Backend (Express + Node.js)                        │
│            http://localhost:5000                                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ API Routes (/api/auth/*)                                │   │
│  │  POST /api/auth/register                                │   │
│  │  POST /api/auth/login                                   │   │
│  │  GET /api/profile                                       │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │                                       │
│  ┌──────────────────────┴──────────────────────────────────┐   │
│  │ Middleware Stack                                        │   │
│  │  1. express.json()                                      │   │
│  │  2. CORS                                                │   │
│  │  3. Global error handler                                │   │
│  │  4. verifyToken (for protected routes)                  │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │                                       │
│  ┌──────────────────────┴──────────────────────────────────┐   │
│  │ Controllers (auth.controller.ts)                        │   │
│  │  register(req, res)                                     │   │
│  │  login(req, res)                                        │   │
│  │  getProfile(req, res)                                   │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │                                       │
│  ┌──────────────────────┴──────────────────────────────────┐   │
│  │ Services (auth.service.ts)                              │   │
│  │  registerUser()       - Hash pwd, create in DB          │   │
│  │  authenticateUser()   - Verify pwd, return JWT          │   │
│  │  findUserById()       - Get user by ID                  │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │                                       │
│  ┌──────────────────────┴──────────────────────────────────┐   │
│  │ Utilities                                               │   │
│  │  • bcrypt.hash() - Password hashing (12 rounds)         │   │
│  │  • jwt.sign() - Create JWT token                        │   │
│  │  • jwt.verify() - Validate JWT token                    │   │
│  │  • Prisma Client - Database operations                  │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │                                       │
└─────────────────────────┼───────────────────────────────────────┘
                          │ SQL Queries
                          │ (via Prisma ORM)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              PostgreSQL Database                                │
│           (localhost:5432/healthcare_booking)                   │
│                                                                 │
│  Table: User                                                    │
│  ┌──────────┬──────────┬──────────┬────────┬────────────────┐  │
│  │ id       │ phone    │ password │ role   │ createdAt      │  │
│  │ (UUID)   │ (unique) │ (hashed) │ (enum) │ (timestamp)    │  │
│  ├──────────┼──────────┼──────────┼────────┼────────────────┤  │
│  │ 550e... │ 0123456789 │ $2a$12$... │ USER │ 2026-05-20...  │  │
│  │ 660f... │ 0987654321 │ $2a$12$... │ DOCTOR│ 2026-05-20...  │  │
│  └──────────┴──────────┴──────────┴────────┴────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Request-Response Flow

### Register Flow
```
User Input:
  phone: "0123456789"
  password: "password123"
        │
        ▼
POST /api/auth/register
        │
        ▼
Controller validates input
        │
        ├─ Check phone & password exist
        ├─ Check password length >= 6
        └─ Next: Service
        │
        ▼
Service: registerUser()
        │
        ├─ Find existing user by phone
        ├─ Hash password with bcrypt
        ├─ Create user in PostgreSQL
        └─ Return user object
        │
        ▼
Response 201 Created:
{
  "message": "Registration successful",
  "user": {
    "id": "550e...",
    "phone": "0123456789",
    "role": "USER",
    "createdAt": "2026-05-20..."
  }
}
```

### Login Flow
```
User Input:
  phone: "0123456789"
  password: "password123"
        │
        ▼
POST /api/auth/login
        │
        ▼
Controller validates input
        │
        ├─ Check phone & password exist
        └─ Next: Service
        │
        ▼
Service: authenticateUser()
        │
        ├─ Find user by phone
        ├─ If not found → 401 Invalid credentials
        │
        ├─ Compare password with bcrypt.compare()
        ├─ If not match → 401 Invalid credentials
        │
        ├─ Create JWT token
        │   payload: { userId, role }
        │   expiresIn: "7d"
        │
        └─ Return token + user object
        │
        ▼
Response 200 OK:
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e...",
    "phone": "0123456789",
    "role": "USER"
  }
}

Client stores token in localStorage:
  localStorage.setItem("token", token)
```

### Protected Route Flow
```
GET /api/profile
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
        │
        ▼
Middleware: verifyToken()
        │
        ├─ Extract token from header
        ├─ If missing → 401 Unauthorized
        │
        ├─ Verify JWT signature with JWT_SECRET
        ├─ If invalid → 401 Invalid token
        ├─ If expired → 401 Token expired
        │
        ├─ Extract userId & role from payload
        ├─ Attach to req.user
        └─ Call next()
        │
        ▼
Controller: getProfile()
        │
        ├─ Use req.user.userId
        ├─ Find user in database
        └─ Return user object
        │
        ▼
Response 200 OK:
{
  "message": "Profile fetched successfully",
  "user": {
    "id": "550e...",
    "phone": "0123456789",
    "role": "USER",
    "createdAt": "2026-05-20..."
  }
}
```

## JWT Token Anatomy

```
JWT Token Format:
┌─────────────────┬─────────────────┬──────────────────┐
│     Header      │      Payload    │    Signature     │
├─────────────────┼─────────────────┼──────────────────┤
│ eyJhbGciOiJI... │ eyJpZCI6IjEi... │ SflKxw5jJoM9... │
└─────────────────┴─────────────────┴──────────────────┘

Header (decoded):
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload (decoded):
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "role": "USER",
  "iat": 1716194400,      // Issued At
  "exp": 1716799200       // Expires (7 days later)
}

Signature:
HMAC256(header.payload, JWT_SECRET)
```

## Error Handling Chain

```
Error occurs in Controller/Service
        │
        ▼
Throw ApiError(message, statusCode)
        │
        ▼
Express catch (error) handler
        │
        ├─ next(error)
        │
        ▼
Global Error Middleware: errorHandler()
        │
        ├─ Is ApiError?
        │  └─ Return: { message, details } with statusCode
        │
        ├─ Is Error?
        │  └─ Return: { message } with 500
        │
        └─ Unexpected?
           └─ Return: { message: "Unexpected error" } with 500
        │
        ▼
Response sent to client with proper HTTP status code
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Input Validation                                   │
│  - Check required fields                                    │
│  - Validate data types                                      │
│  - Check string lengths                                     │
│  - Sanitize input                                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│ Layer 2: Password Hashing                                   │
│  - bcrypt with 12 salt rounds                               │
│  - One-way hash function                                    │
│  - Never compare plaintext                                  │
│  - Always use bcrypt.compare()                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│ Layer 3: JWT Signature                                      │
│  - Sign with JWT_SECRET                                     │
│  - Verify signature before trusting payload                 │
│  - Token expiry (7 days)                                    │
│  - Stateless (no session storage)                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│ Layer 4: Database Security                                  │
│  - Prisma parameterized queries (SQL injection prevention)  │
│  - Unique constraint on phone (no duplicates)               │
│  - UUID for user IDs (unguessable)                          │
│  - PostgreSQL encryption (at rest)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│ Layer 5: Error Handling                                     │
│  - User enumeration protection                              │
│  - No sensitive info in error messages                      │
│  - Consistent error responses                               │
│  - Proper HTTP status codes                                 │
└─────────────────────────────────────────────────────────────┘
```

## Files & Responsibilities

```
routes/auth.routes.ts
  ├─ POST /api/auth/register → controller.register()
  └─ POST /api/auth/login    → controller.login()

controllers/auth.controller.ts
  ├─ register(req, res)    - Validate, call service
  ├─ login(req, res)       - Validate, call service
  └─ getProfile(req, res)  - Return authenticated user

services/auth.service.ts
  ├─ registerUser()        - Hash pwd, save to DB
  ├─ authenticateUser()    - Verify pwd, create JWT
  └─ findUserById()        - Query user by ID

middleware/auth.middleware.ts
  └─ verifyToken()         - Validate JWT, attach to req.user

middleware/error.middleware.ts
  └─ errorHandler()        - Catch all errors

utils/apiError.ts
  └─ ApiError class        - Custom error with statusCode

prisma/client.ts
  └─ PrismaClient instance - Database connection

prisma/schema.prisma
  └─ User model            - Database schema
```

---

**Created**: May 20, 2026
