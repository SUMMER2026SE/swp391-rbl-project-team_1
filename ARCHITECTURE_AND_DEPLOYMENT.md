# 🏗️ System Architecture & Deployment Checklist

---

## 📊 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Healthcare Booking System                            │
├──────────────────────────┬──────────────────────────────────────────────────┤
│                          │                                                  │
│        FRONTEND          │              BACKEND                            │
│     (Next.js 15+)        │         (Express + TypeScript)                  │
│                          │                                                  │
│  ┌──────────────────┐    │     ┌──────────────────────────────────────┐   │
│  │  React Pages     │    │     │     API Routes (16 endpoints)        │   │
│  ├──────────────────┤    │     ├──────────────────────────────────────┤   │
│  │ • Login/Register │    │     │ ✅ POST   /auth/register             │   │
│  │ • Doctors List   │    │     │ ✅ POST   /auth/login                │   │
│  │ • Appointments   │    │     │ ✅ GET    /profile                   │   │
│  │ • Admin Panel    │    │     │ ✅ GET    /doctors                   │   │
│  │ • AI Chat        │    │     │ ✅ GET    /doctors/:id               │   │
│  └────────┬─────────┘    │     │ ✅ GET    /doctors/:id/schedules     │   │
│           │              │     │ ✅ POST   /doctors/:id/schedules     │   │
│  ┌────────▼─────────┐    │     │ ✅ GET    /doctor/appointments      │   │
│  │ AuthContext      │    │     │ ✅ POST   /appointments              │   │
│  │ (Token Mgmt)     │    │     │ ✅ GET    /my-appointments           │   │
│  └────────┬─────────┘    │     │ ✅ GET    /admin/users               │   │
│           │              │     │ ✅ GET    /admin/appointments        │   │
│  ┌────────▼─────────┐    │     │ ✅ PUT    /admin/users/:id           │   │
│  │ API Service      │◄───┼────►│ ✅ DELETE /admin/users/:id           │   │
│  │ (REST calls)     │    │     │ ✅ POST   /admin/link-doctor        │   │
│  └──────────────────┘    │     │ ✅ POST   /chat                      │   │
│                          │     └────────┬──────────────────────────────┘   │
│  Browser Storage:        │              │                                  │
│  • JWT Token             │     ┌────────▼──────────────────────────────┐  │
│  • User Role             │     │    Middleware Stack                   │  │
│  • User ID               │     ├───────────────────────────────────────┤  │
│                          │     │ 1. Auth Middleware (JWT verification) │  │
│                          │     │ 2. Authorization (Role checking)      │  │
│                          │     │ 3. Booking Validation (Slot check)    │  │
│                          │     │ 4. Error Handler (Global errors)      │  │
│                          │     └────────┬──────────────────────────────┘  │
│                          │              │                                  │
│                          │     ┌────────▼──────────────────────────────┐  │
│                          │     │    Service Layer                      │  │
│                          │     ├───────────────────────────────────────┤  │
│                          │     │ • AuthService (JWT + bcrypt)          │  │
│                          │     │ • DoctorService (doctor queries)      │  │
│                          │     │ • AppointmentService (booking logic)  │  │
│                          │     │ • AdminService (user management)      │  │
│                          │     │ • ScheduleService (doctor hours)      │  │
│                          │     │ • GeminiService (AI medical advisor)  │  │
│                          │     │ • UserService (profile management)    │  │
│                          │     └────────┬──────────────────────────────┘  │
│                          │              │                                  │
│                          │     ┌────────▼──────────────────────────────┐  │
│                          │     │    Prisma ORM                         │  │
│                          │     ├───────────────────────────────────────┤  │
│                          │     │ • User (auth, roles)                  │  │
│                          │     │ • Doctor (profiles, specialties)      │  │
│                          │     │ • DoctorSchedule (hours, availability)│  │
│                          │     │ • Appointment (bookings, status)      │  │
│                          │     └────────┬──────────────────────────────┘  │
│                          │              │                                  │
│                          │     ┌────────▼──────────────────────────────┐  │
│                          │     │    PostgreSQL Database                │  │
│                          │     ├───────────────────────────────────────┤  │
│                          │     │ healthcare_booking (30+ seeded rows)  │  │
│                          │     │ • 1 admin user                        │  │
│                          │     │ • 5 doctors with profiles             │  │
│                          │     │ • 10 patient users                    │  │
│                          │     │ • 25 doctor schedules                 │  │
│                          │     │ • 15 appointments                     │  │
│                          │     └───────────────────────────────────────┘  │
│                          │                                                  │
└──────────────────────────┴──────────────────────────────────────────────────┘

                              External Services
                              ─────────────────
                              • Gemini API (AI medical advice)
                              • PostgreSQL (Database)
```

---

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION FLOW                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  User Interface          Backend API           Database               │
│  ──────────────          ───────────           ────────               │
│        │                     │                     │                  │
│        ├─────Register────────►                     │                  │
│        │  (phone, pass)       │                     │                  │
│        │                      ├─Validate───────────►│                  │
│        │                      │ (unique phone)      │                  │
│        │                      │◄──────OK────────────┤                  │
│        │                      │                     │                  │
│        │                      ├─bcrypt.hash(pass)──┐│                  │
│        │                      │  12 rounds         ││                  │
│        │                      │◄────────────────────┘│                  │
│        │                      │                     │                  │
│        │                      ├─Create User────────►│                  │
│        │                      │  (hashed password)  │                  │
│        │◄────201────────────┬─┤                     │                  │
│        │  (user data)       │ │                     │                  │
│        │                    │ ├──────Save──────────►│                  │
│        │                    │ │                     │                  │
│        ├─────Login─────────────►                    │                  │
│        │  (phone, pass)     │                       │                  │
│        │                    │ ├─Find User─────────►│                  │
│        │                    │ │                    │                  │
│        │                    │ │◄──────User────────┤ (with hash)       │
│        │                    │ │                    │                  │
│        │                    │ ├─bcrypt.compare────┐│                  │
│        │                    │ │ (pass vs hash)    ││                  │
│        │                    │ │◄────────────────┐ ││                  │
│        │                    │ │  ✓ Match        │ ││                  │
│        │                    │ │                ││  ││                  │
│        │                    │ ├─JWT.sign()────┐││  ││                  │
│        │                    │ │ • userId     │││  ││                  │
│        │                    │ │ • role       │││  ││                  │
│        │                    │ │ • exp: 7d    │││  ││                  │
│        │                    │ │◄────────────────┘││  ││                  │
│        │◄────200────────────┤─┤────token────────┘│  ││                  │
│        │  (token + user)    │                    │  ││                  │
│        │                    │                    │  ││                  │
│        └─Store Token in localStorage             │  ││                  │
│          (localStorage.setItem('token', ...))    │  ││                  │
│                                                  │  ││                  │
│  Protected Request:                             │  ││                  │
│  ────────────────────                           │  ││                  │
│        │                    │                    │  ││                  │
│        ├─GET /profile──────►│ ┌─Bearer Token────┐  ││                  │
│        │  + token           │ │ JWT.verify()   └──┘││                  │
│        │  (in header)       │ │ ✓ signature OK   ││                  │
│        │                    │ │ ✓ not expired   ││                  │
│        │                    │ │ ✓ userId valid  ││                  │
│        │                    │ │                  ││                  │
│        │                    │ ├─Attach userId───┘│                  │
│        │                    │ │ to req.user       │                  │
│        │                    │ │                  │                  │
│        │                    │ ├─Fetch profile───►│                  │
│        │◄────200────────────┤─┤  from userId    │                  │
│        │  (profile data)    │ │                 │                  │
│                             │ │                 │                  │
└─────────────────────────────┴─┴─────────────────┴──────────────────┘
```

---

## 🔄 Appointment Booking Flow

```
┌──────────────────────────────────────────────────────────────┐
│              APPOINTMENT BOOKING VALIDATION                   │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Frontend             API Middleware           Database        │
│  ────────             ──────────────           ────────        │
│        │                     │                     │           │
│ Input (User Form)            │                     │           │
│ ├─ doctorId                  │                     │           │
│ ├─ appointmentDate (future)  │                     │           │
│ └─ notes (optional)          │                     │           │
│        │                     │                     │           │
│        ├─POST /appointments─►│                     │           │
│        │  + JWT token        │                     │           │
│        │                     ├─1. Auth Check──────►│           │
│        │                     │    (JWT valid?)    │           │
│        │                     │◄──────✓────────────┤           │
│        │                     │                    │           │
│        │                     ├─2. Role Check      │           │
│        │                     │    (USER role?)    │           │
│        │                     │                    │           │
│        │                     ├─3. Doctor Check───►│           │
│        │                     │    (exists?)       │           │
│        │                     │◄──────✓────────────┤           │
│        │                     │                    │           │
│        │                     ├─4. Schedule Check─►│           │
│        │                     │    Doctor has      │           │
│        │                     │    availability on │           │
│        │                     │    that day?       │           │
│        │                     │◄──────✓────────────┤           │
│        │                     │                    │           │
│        │                     ├─5. Time Range Check│           │
│        │                     │    Is time within  │           │
│        │                     │    schedule hours? │           │
│        │                     │◄──────✓────────────┤           │
│        │                     │                    │           │
│        │                     ├─6. Conflict Check─►│           │
│        │                     │    Any existing    │           │
│        │                     │    appointment at  │           │
│        │                     │    same time?      │           │
│        │                     │◄──────No───────────┤           │
│        │                     │                    │           │
│        │                     ├─7. Create────────►│           │
│        │                     │    Appointment    │           │
│        │◄────201────────────┤  status: PENDING   │           │
│        │ (appointment       │                    │           │
│        │  data)             │                    │           │
│        │                    │                    │           │
└────────┴────────────────────┴────────────────────┴────────────┘

Error Scenarios:
───────────────
❌ Past date       → 400 Bad Request
❌ Doctor not      → 404 Not Found
   found
❌ No schedule     → 400 Bad Request
   on that day
❌ Time outside    → 400 Bad Request
   doctor hours
❌ Slot already    → 409 Conflict
   booked
❌ Invalid role    → 403 Forbidden
```

---

## 📋 Pre-Deployment Checklist

### Backend
- [ ] Environment variables set (.env file exists)
  - [ ] DATABASE_URL correct
  - [ ] JWT_SECRET set
  - [ ] GEMINI_API_KEY set (if using AI)
- [ ] Database migrations run
  - [ ] `npx prisma db push` completed
  - [ ] Tables created in PostgreSQL
- [ ] Seed data loaded
  - [ ] `npx ts-node prisma/seed.ts` ran successfully
  - [ ] 30+ demo records created
- [ ] TypeScript compiles
  - [ ] `npx tsc --noEmit` → 0 errors
- [ ] Server starts
  - [ ] `npm run dev` → runs on port 5000
  - [ ] No console errors on startup
- [ ] All endpoints tested
  - [ ] GET /api/doctors → 200 with data
  - [ ] POST /api/auth/register → 201 success
  - [ ] POST /api/auth/login → 200 with token
  - [ ] Protected routes require token

### Frontend
- [ ] Environment variables set (.env.local)
  - [ ] NEXT_PUBLIC_API_URL correct
  - [ ] Points to backend URL
- [ ] Dependencies installed
  - [ ] `npm install` completed
  - [ ] No peer dependency warnings
- [ ] Next.js builds
  - [ ] `npm run build` → no errors
- [ ] Dev server starts
  - [ ] `npm run dev` → runs on port 3000
  - [ ] Hot reload working
- [ ] AuthContext working
  - [ ] Login/Register pages functional
  - [ ] Token stored in localStorage
  - [ ] Protected routes redirect properly
- [ ] API integration working
  - [ ] API service calls correct endpoints
  - [ ] Responses handled properly
  - [ ] Error messages displayed

### Documentation
- [ ] README.md created and complete
- [ ] API reference documented
- [ ] Quick start guide available
- [ ] Frontend integration guide complete
- [ ] Testing guide provided
- [ ] Demo credentials documented

### Testing
- [ ] Manual API testing (curl/Postman)
  - [ ] All 16 endpoints tested
  - [ ] Success cases working
  - [ ] Error cases handled
- [ ] Integration testing
  - [ ] Full user flow tested
  - [ ] Register → Login → Browse → Book
- [ ] Authorization testing
  - [ ] USER endpoints accessible to USER
  - [ ] ADMIN endpoints blocked for USER
  - [ ] Protected routes require token
- [ ] Data validation
  - [ ] Invalid inputs rejected
  - [ ] Proper error messages shown
  - [ ] No XSS vulnerabilities

### Security
- [ ] CORS enabled for frontend URL
- [ ] JWT secret is strong (30+ chars)
- [ ] Password hashing using bcrypt (12 rounds)
- [ ] No passwords logged or exposed
- [ ] No SQL injection vulnerabilities
- [ ] Error messages safe (no stack traces)
- [ ] Database backups configured (if applicable)

### Performance
- [ ] Database indexes on foreign keys
- [ ] API responses < 500ms
- [ ] Frontend builds optimized
- [ ] No console errors or warnings
- [ ] Images optimized (if applicable)

---

## 🚀 Deployment Steps

### Option 1: Deploy Backend to Heroku

```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set DATABASE_URL="postgresql://..."
heroku config:set JWT_SECRET="your_secret_key"
heroku config:set GEMINI_API_KEY="your_key"

# Deploy
git push heroku main

# Run migrations
heroku run npx prisma db push

# Run seed
heroku run npx ts-node prisma/seed.ts

# Check logs
heroku logs --tail
```

### Option 2: Deploy Backend to Railway.app

```bash
# Install Railway CLI
# https://docs.railway.app/cli/install

# Login
railway login

# Link project
railway link

# Deploy
railway up

# Set environment variables in dashboard
# Then run migrations
railway run npx prisma db push
```

### Option 3: Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# NEXT_PUBLIC_API_URL=https://your-api-domain.com/api

# Redeploy after setting env vars
vercel --prod
```

---

## 🔍 Post-Deployment Verification

After deploying, verify:

```bash
# Check backend health
curl https://your-api-domain.com/api/doctors

# Check frontend loads
curl https://your-frontend-domain.com

# Check database connected
# (Try login with demo account from frontend)

# Check logs for errors
# (In Heroku/Railway/Vercel dashboard)

# Test protected endpoints
# (Make sure JWT tokens work)

# Verify CORS working
# (Frontend can call backend)
```

---

## 📊 System Statistics

| Item | Count |
|------|-------|
| **API Endpoints** | 16 |
| **Database Tables** | 4 |
| **Database Migrations** | 4 |
| **Service Modules** | 7 |
| **Middleware Functions** | 4 |
| **Controller Functions** | 15 |
| **Pre-seeded Records** | 30+ |
| **Documentation Files** | 5 |
| **Code Examples** | 50+ |
| **Test Scenarios** | 40+ |

---

## 🎯 Key Endpoints to Test After Deployment

```bash
# 1. Public endpoint (no auth required)
curl https://your-api.com/api/doctors

# 2. Create new user
curl -X POST https://your-api.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"0987654321","password":"test123"}'

# 3. Login
TOKEN=$(curl -s -X POST https://your-api.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0901000001","password":"pass123"}' | jq -r '.token')

# 4. Protected endpoint
curl https://your-api.com/api/profile \
  -H "Authorization: Bearer $TOKEN"

# 5. Admin endpoint
curl https://your-api.com/api/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 🔧 Troubleshooting Deployment Issues

### Backend won't start
```bash
# Check logs
heroku logs --tail              # Heroku
railway logs                    # Railway

# Verify environment variables
heroku config                   # Heroku
railway env                     # Railway

# Check database connection
# Try connecting to remote database URL
psql $DATABASE_URL
```

### Frontend can't reach backend
```bash
# Check NEXT_PUBLIC_API_URL is correct
# (Should be production backend URL, not localhost)

# Check CORS enabled on backend
# (Should allow frontend domain)

# Check backend is actually running
curl https://your-api.com/api/doctors
```

### Database connection failed
```bash
# Verify DATABASE_URL format
# Should be: postgresql://user:pass@host:5432/dbname

# Check PostgreSQL version (15+)

# Run migrations again
npx prisma db push

# Check Prisma client generated
npx prisma generate
```

---

## ✅ Success Criteria

Your deployment is successful when:

- ✅ Backend API responding on production URL
- ✅ Frontend loads and displays correctly
- ✅ Login/Register working end-to-end
- ✅ Can view doctors list
- ✅ Can book appointments
- ✅ Admin features working
- ✅ AI chat responding
- ✅ Database persisting data
- ✅ No console errors
- ✅ Performance acceptable

---

## 🎉 You're Ready!

Your Healthcare Booking System is production-ready and deployed! 🚀

For continued support, refer to:
- [README.md](README.md)
- [COMPLETE_API_REFERENCE.md](backend/COMPLETE_API_REFERENCE.md)
- [FRONTEND_INTEGRATION_GUIDE.md](FRONTEND_INTEGRATION_GUIDE.md)

