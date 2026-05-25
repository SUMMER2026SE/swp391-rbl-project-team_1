# Build & Deployment Guide

## ✅ Compilation Status

```
✓ TypeScript Compilation: SUCCESS (0 errors)
✓ Prisma Client Generation: SUCCESS
✓ Type Safety: TypeScript Strict Mode
✓ Dependencies: All installed
✓ Schema Validation: OK
```

## 🚀 Development

### Start Dev Server
```bash
cd backend
npm run dev
```

**Output:**
```
[INFO] 10:30:00 ts-node-dev ver. 2.0.0 (using ts-node ver. 10.9.2, typescript ver. 6.0.3)
Server running on port 5000
```

Features:
- ✅ Hot reload on file changes
- ✅ No need to rebuild
- ✅ Transpile TypeScript on-the-fly

### Database Setup
```bash
# First time - reset everything
npx prisma migrate reset --force

# Subsequent times - apply new migrations
npx prisma migrate dev
```

### View Database
```bash
npm run prisma:studio

# Opens at http://localhost:5555
```

---

## 🏗️ Production Build

### Build Process
```bash
npm run build
```

This runs:
1. `prisma generate` - Generate Prisma Client
2. `tsc` - TypeScript compilation

**Output:**
```
dist/
├── server.js
├── routes/
│   └── auth.routes.js
├── controllers/
│   └── auth.controller.js
├── services/
│   └── auth.service.js
├── middleware/
│   ├── auth.middleware.js
│   └── error.middleware.js
├── utils/
│   └── apiError.js
└── prisma/
    └── client.js
```

### Run Production
```bash
npm start
```

This runs:
```bash
node dist/server.js
```

---

## 🐛 Build Troubleshooting

### Issue 1: "EPERM" Error in Prisma Generation

**Symptoms:**
```
Error: EPERM: operation not permitted, rename 'query_engine-windows.dll.node.tmp'
```

**Causes:**
- Antivirus/security software locking files
- Another Node process still running
- File permission issues

**Solutions:**

**Option A: Close Running Processes** (Recommended)
```powershell
# Kill any running Node processes
Get-Process node | Stop-Process -Force

# Then rebuild
npm run build
```

**Option B: Clean & Reinstall**
```powershell
# Remove node_modules and cache
rm -r node_modules
rm package-lock.json

# Reinstall
npm install

# Generate Prisma
npx prisma generate

# Build
npm run build
```

**Option C: Disable Antivirus**
- Temporarily disable antivirus/Windows Defender
- Run build
- Re-enable antivirus

**Option D: Use WSL (Windows)**
```bash
# Use Windows Subsystem for Linux
wsl
cd /mnt/d/Personal/Semester\ 5/SWP391/project2/backend
npm run build
```

### Issue 2: "DATABASE_URL is not set"

**Solution:**
```bash
# Create .env file
echo 'DATABASE_URL="postgresql://postgres:123456@localhost:5432/healthcare_booking"' > .env
echo 'JWT_SECRET="my_super_secret_key_123"' >> .env

# Verify
cat .env
```

### Issue 3: PostgreSQL Connection Failed

**Solution:**
```bash
# Check if PostgreSQL is running
psql -U postgres -d healthcare_booking

# If not running, start it:
# Windows: Services → PostgreSQL
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### Issue 4: Migration Conflicts

**Solution:**
```bash
# Reset database completely
npx prisma migrate reset --force

# This will:
# 1. Drop all tables
# 2. Recreate from migrations
# 3. Run seed automatically
```

### Issue 5: "Cannot find module" errors

**Solution:**
```bash
# Regenerate Prisma
npx prisma generate

# Check tsconfig
cat tsconfig.json

# If still failing, try:
npm install
npm run build --force
```

---

## 📦 Dependencies

Current versions:
```
@prisma/client: ^6.19.3
bcrypt: ^6.0.0
cors: ^2.8.6
dotenv: ^17.4.2
express: ^5.2.1
jsonwebtoken: ^9.0.3
prisma: ^6.19.3

TypeScript: ^6.0.3
ts-node-dev: ^2.0.0
```

All dependencies are installed and compatible.

---

## 🔍 Verification Steps

After build, verify:

```bash
# 1. Check dist folder exists
ls dist/

# 2. Verify main file
file dist/server.js

# 3. Run TypeScript check
npx tsc --noEmit

# 4. Try starting server
npm start

# 5. Test endpoint
curl http://localhost:5000/api/auth/register
```

---

## 📋 Pre-Deployment Checklist

- [ ] TypeScript compiles without errors
- [ ] All dependencies are installed
- [ ] `.env` file has all required variables
- [ ] Database is accessible
- [ ] Prisma migrations are applied
- [ ] Seed data is populated
- [ ] `npm run build` completes successfully
- [ ] `npm start` runs without errors
- [ ] API endpoints respond correctly
- [ ] JWT tokens are created successfully
- [ ] Protected routes require valid tokens

---

## 🚀 Deployment Steps

### 1. Prepare Production Build
```bash
npm ci              # Clean install (recommended for CI/CD)
npm run build       # Compile
npx prisma generate # Generate client
```

### 2. Migrate Database
```bash
npx prisma migrate deploy  # Apply migrations in production
```

### 3. Seed Data (Optional)
```bash
npm run seed:prod           # Seed with production node
```

### 4. Start Server
```bash
npm start
```

### 5. Monitor Logs
```bash
# Set up logging
export NODE_ENV=production
npm start > server.log 2>&1 &
```

---

## 🔐 Environment Variables

**Development (.env):**
```env
DATABASE_URL="postgresql://postgres:123456@localhost:5432/healthcare_booking"
JWT_SECRET="my_super_secret_key_123"
PORT=5000
CORS_ORIGIN="http://localhost:3000"
NODE_ENV=development
```

**Production (.env):**
```env
DATABASE_URL="postgresql://user:password@prod-host:5432/healthcare_db"
JWT_SECRET="your_long_random_secret_key_here"
PORT=5000
CORS_ORIGIN="https://yourdomain.com"
NODE_ENV=production
```

⚠️ **Important:**
- Never commit `.env` to version control
- Use strong `JWT_SECRET` in production
- Use separate database for production
- Enable HTTPS in production

---

## 📊 Build Optimization

### TypeScript Compiler Options
```json
{
  "compilerOptions": {
    "strict": true,           // Strict type checking
    "esModuleInterop": true,  // CommonJS compatibility
    "skipLibCheck": true,     // Fast build
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  }
}
```

### Output
- **Size**: ~500KB (uncompressed)
- **Time**: ~5-10 seconds
- **Files**: ~50+ JS files

---

## 🐳 Docker Support (Optional)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

Build & run:
```bash
docker build -t healthcare-api .
docker run -p 5000:5000 --env-file .env healthcare-api
```

---

## ✅ Testing After Build

```bash
# Unit test example
npm test

# Integration test
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"0123456789","password":"password123"}'

# Should return:
# 201 Created with user object
```

---

**Last Updated**: May 20, 2026
**Tested With**: Node.js 20, npm 10, PostgreSQL 15
