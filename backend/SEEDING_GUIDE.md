# Healthcare Booking System - Database Seeding Guide

## 📋 Tổng Quan

File `seed.ts` cung cấp một hệ thống seed dữ liệu hoàn chỉnh và production-ready cho Healthcare Booking System. Nó tạo dữ liệu mẫu để demo, testing, và phát triển.

## 🎯 Dữ Liệu Được Tạo

Khi chạy seed, hệ thống sẽ tạo:

- **1 Admin Account**
  - Phone: `0900000000`
  - Password: `admin@123`
  - Role: `ADMIN`

- **5 Doctor Accounts** với hồ sơ đầy đủ
  - Phone: `0901000001` - `0901000005`
  - Password: `admin@123` (giống admin)
  - Role: `DOCTOR`
  - Mỗi doctor có:
    - Tên, chuyên khoa, bệnh viện
    - Số năm kinh nghiệm
    - Avatar URL
    - Mô tả chi tiết

- **10 Patient Accounts**
  - Phone: `0902000001` - `0910000010`
  - Password: `user@123`
  - Role: `USER`

- **Doctor Schedules**
  - Mỗi doctor có 5 lịch (Thứ 2 - Thứ 6)
  - Giờ làm việc: 8:00 AM - 5:00 PM

- **Appointments**
  - 3 lịch hẹn cho mỗi doctor
  - Các trạng thái khác nhau:
    - `PENDING` (Chờ xác nhận)
    - `CONFIRMED` (Đã xác nhận)
    - `COMPLETED` (Hoàn thành)
    - `CANCELLED` (Đã hủy)

## 🚀 Cách Sử Dụng

### 1. Cài đặt Dependencies

```bash
cd backend
npm install
```

### 2. Thiết lập Database

```bash
# Tạo file .env nếu chưa có
# DATABASE_URL="postgresql://user:password@localhost:5432/healthcare_db"

# Tạo database schema
npx prisma migrate deploy

# Hoặc nếu đang phát triển:
npx prisma migrate dev --name init
```

### 3. Chạy Seed

**Cách 1: Phát triển (với ts-node-dev)**
```bash
npm run seed
```

**Cách 2: Production (với ts-node)**
```bash
npm run seed:prod
```

**Cách 3: Tự động seed khi migrate**
```bash
npx prisma migrate dev
```

### 4. Xem Dữ Liệu

```bash
# Mở Prisma Studio (GUI)
npm run prisma:studio

# Hoặc:
npx prisma studio
```

Sẽ mở browser tại `http://localhost:5555` với giao diện để xem/quản lý dữ liệu.

## 🔄 Reset Database

Nếu muốn xóa toàn bộ dữ liệu và seed lại:

```bash
# Cách 1: Reset migration (cân thận - xóa toàn bộ dữ liệu)
npx prisma migrate reset

# Sẽ hỏi xác nhận, rồi:
# 1. Xóa database
# 2. Tạo lại schema từ migrations
# 3. Chạy seed tự động

# Cách 2: Seed lại mà không reset migrations
npm run seed
```

## 📝 Kế Hoạch Seed

Seed file thực hiện các bước sau:

1. **Clear Existing Data** - Xóa toàn bộ dữ liệu cũ
2. **Seed Admin** - Tạo 1 tài khoản admin
3. **Seed Doctors** - Tạo 5 doctors + User accounts
4. **Seed Patients** - Tạo 10 patient accounts
5. **Seed Schedules** - Tạo lịch làm việc cho mỗi doctor
6. **Seed Appointments** - Tạo appointments với trạng thái đa dạng

Mỗi bước sẽ log chi tiết, giúp dễ debug nếu có lỗi.

## 🔐 Bảo Mật

- Tất cả passwords đều được hash với **bcrypt** (salt rounds = 12)
- Passwords trong seed chỉ cho mục đích demo/test
- **Trong production**, phải:
  - Đổi tất cả passwords
  - Bật 2FA
  - Sử dụng environment variables cho mật khẩu
  - Xóa hoặc vô hiệu hóa tài khoản test

## 📊 Xem Dữ Liệu

### Prisma Studio (Recommended)
```bash
npm run prisma:studio
```
- GUI đẹp, dễ sử dụng
- Có thể thêm/sửa/xóa dữ liệu
- Hỗ trợ filter, sort, search

### Dùng SQL trực tiếp
```bash
# Kết nối PostgreSQL
psql -U user -d healthcare_db -h localhost

# Queries
SELECT * FROM "User";
SELECT * FROM "Doctor";
SELECT * FROM "Appointment" WHERE "status" = 'PENDING';
```

### Từ Backend API
```bash
# Đăng nhập
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "0900000000", "password": "admin@123"}'

# Xem danh sách doctors
curl http://localhost:3000/api/doctors
```

## 🧪 Testing

Sau khi seed, có thể test:

```bash
# 1. Test login với admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "0900000000", "password": "admin@123"}'

# 2. Test doctor login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "0901000001", "password": "admin@123"}'

# 3. Test patient login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "0902000001", "password": "user@123"}'
```

## ⚙️ Cấu Hình Seed

Để tùy chỉnh seed, chỉnh sửa `SEED_CONFIG` trong `seed.ts`:

```typescript
const SEED_CONFIG: SeedConfig = {
  adminPhone: "0900000000",
  adminPassword: "admin@123",
  doctorCount: 5,      // Số lượng doctors
  patientCount: 10,    // Số lượng patients
  appointmentsPerDoctor: 3, // Appointments cho mỗi doctor
};
```

## 🐛 Troubleshooting

### Lỗi: "DATABASE_URL is not set"
```bash
# Tạo file .env
echo 'DATABASE_URL="postgresql://user:password@localhost:5432/healthcare_db"' > .env
```

### Lỗi: "Cannot find module 'bcrypt'"
```bash
npm install bcrypt
npm install --save-dev @types/bcrypt
```

### Lỗi: "Prisma Client is not initialized"
```bash
# Regenerate Prisma Client
npx prisma generate
```

### Lỗi: "migration.sql: syntax error"
```bash
# Reset database
npx prisma migrate reset
```

### Seed chạy rất chậm
- Kiểm tra database connection
- Kiểm tra network latency
- Có thể comment out "Clear Existing Data" nếu không cần

## 📚 Cấu Trúc Dữ Liệu

```
User (1 Admin + 5 Doctors + 10 Patients)
  ├── phone (unique)
  ├── password (bcrypt hashed)
  ├── role (ADMIN, DOCTOR, USER)
  └── doctorId (nếu role = DOCTOR)
      └── Doctor
          ├── name
          ├── specialty
          ├── experience
          ├── hospital
          ├── avatar
          ├── DoctorSchedule[]
          │   ├── dayOfWeek (0-6)
          │   ├── startTime (HH:MM)
          │   └── endTime (HH:MM)
          └── Appointment[]
              ├── userId
              ├── appointmentDate
              └── status (PENDING, CONFIRMED, COMPLETED, CANCELLED)
```

## 🎯 Best Practices

1. **Chạy seed ngay sau setup** - Để có dữ liệu để test ngay
2. **Không thay đổi seed data** - Ngoại trừ khi cần thêm doctor hoặc patient
3. **Reset database trước mỗi sprint** - Để có dữ liệu sạch
4. **Backup seed file** - Vì nó quản lý state của dữ liệu
5. **Version control seed** - Commit seed.ts cùng migrations

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra logs từ seed
2. Xem Prisma Studio
3. Kiểm tra file .env
4. Chạy `npx prisma migrate reset` để reset database

---

**Last Updated**: May 20, 2026
**Version**: 1.0.0
