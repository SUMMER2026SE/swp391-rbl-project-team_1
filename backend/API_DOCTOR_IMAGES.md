# API Endpoints - Doctor Avatar Management

## Overview

Có 2 cách chính để cập nhật hình ảnh bác sĩ:

1. **Cách nhanh**: Upload hình vào folder `public/doctors/` rồi chạy script
2. **Cách linh hoạt**: Dùng API endpoints với token ADMIN

---

## 📋 Prerequisites

- **Admin Token**: Bạn cần có token JWT của user có role `ADMIN`
- **Doctor ID Format**: Phải là `doctor_1`, `doctor_2`, ... , `doctor_68`

### Lấy Admin Token

```bash
# Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0900000000",
    "password": "admin@123"
  }'

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "phone": "0900000000",
    "role": "ADMIN"
  }
}
```

---

## 📝 API Endpoints

### 1. Update Single Doctor Avatar

**Endpoint:**
```
POST /api/admin/doctors/:id/avatar
```

**Headers:**
```
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json
```

**Parameters:**
- `id` (path): Doctor ID, e.g., `doctor_1`

**Request Body:**
```json
{
  "avatarUrl": "/public/doctors/doctor_1.jpg"
}
```

Hoặc dùng URL remote:
```json
{
  "avatarUrl": "https://example.com/doctor.jpg"
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/admin/doctors/doctor_1/avatar \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "avatarUrl": "/public/doctors/doctor_1.jpg"
  }'
```

**Response (Success 200):**
```json
{
  "message": "Doctor avatar updated successfully",
  "doctor": {
    "id": "doctor_1",
    "name": "TS BS. Lê Đức Nhân",
    "specialty": "Quản lý y tế",
    "experience": 25,
    "hospital": "Bệnh Viện Đa Khoa Đà Nẵng",
    "avatar": "/public/doctors/doctor_1.jpg",
    "createdAt": "2026-05-21T10:30:00.000Z"
  }
}
```

**Response (Error 404):**
```json
{
  "message": "Doctor not found",
  "code": 404
}
```

**Response (Error 400):**
```json
{
  "message": "Either avatarUrl or avatarPath is required",
  "code": 400
}
```

---

### 2. Batch Update Doctor Avatars from Folder

**Endpoint:**
```
POST /api/admin/doctors/batch-update-avatars
```

**Headers:**
```
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{}
```
(Không cần body, sẽ quét folder `public/doctors/`)

**Example:**
```bash
curl -X POST http://localhost:5000/api/admin/doctors/batch-update-avatars \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response (Success 200):**
```json
{
  "message": "Batch update completed. Updated 68 doctors.",
  "totalProcessed": 68,
  "updatedCount": 68,
  "results": [
    {
      "doctorId": "doctor_1",
      "avatarPath": "/public/doctors/doctor_1.jpg",
      "status": "SUCCESS"
    },
    {
      "doctorId": "doctor_2",
      "avatarPath": "/public/doctors/doctor_2.png",
      "status": "SUCCESS"
    },
    {
      "doctorId": "doctor_69",
      "avatarPath": "/public/doctors/doctor_69.jpg",
      "status": "SKIPPED - Doctor not found"
    },
    {
      "doctorId": "invalid_file.jpg",
      "avatarPath": "/public/doctors/invalid_file.jpg",
      "status": "SKIPPED - Invalid filename format"
    }
  ]
}
```

---

## 🛠️ Use Cases

### Use Case 1: Update One Doctor
```bash
ADMIN_TOKEN="your_token_here"

curl -X POST http://localhost:5000/api/admin/doctors/doctor_1/avatar \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "avatarUrl": "/public/doctors/doctor_1.jpg"
  }'
```

### Use Case 2: Update Multiple Doctors One by One
```bash
ADMIN_TOKEN="your_token_here"

# Cập nhật từng bác sĩ
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/admin/doctors/doctor_$i/avatar \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"avatarUrl\": \"/public/doctors/doctor_$i.jpg\"}"
  echo "Updated doctor_$i"
done
```

### Use Case 3: Batch Update All at Once
```bash
ADMIN_TOKEN="your_token_here"

# 1. Đặt hình ảnh vào public/doctors/ (doctor_1.jpg, doctor_2.jpg, ...)
# 2. Gọi batch update endpoint
curl -X POST http://localhost:5000/api/admin/doctors/batch-update-avatars \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 🔐 Security Notes

1. **Authentication Required**: Các endpoint này yêu cầu token ADMIN hợp lệ
2. **Authorization**: Chỉ user có role `ADMIN` mới có thể gọi
3. **Input Validation**: Doctor ID phải tồn tại trong database

---

## ⚠️ Error Handling

| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| "User not authenticated" | 401 | Token không được cung cấp | Thêm header `Authorization: Bearer <token>` |
| "Unauthorized - insufficient permissions" | 403 | User không có role ADMIN | Sử dụng admin account |
| "Doctor not found" | 404 | Doctor ID không tồn tại | Kiểm tra doctor ID đúng format |
| "Doctor ID is required" | 400 | Không cung cấp ID trong URL | Thêm ID vào URL: `/doctors/:id/avatar` |
| "Either avatarUrl or avatarPath is required" | 400 | Body không có avatarUrl | Thêm `{"avatarUrl": "..."}` vào body |

---

## 📊 Monitoring & Debugging

### Check tất cả doctors hiện tại
```bash
curl http://localhost:5000/api/doctors
```

### Check một doctor cụ thể
```bash
curl http://localhost:5000/api/doctors/doctor_1
```

### Check files trong folder
```bash
# Windows
dir backend\public\doctors

# Linux/Mac
ls -la backend/public/doctors/
```

### Check database với Prisma Studio
```bash
cd backend
npx prisma studio
```

---

## 💾 Database Verification

Sau khi cập nhật, kiểm tra database:

```bash
# Vào Prisma Studio
npx prisma studio

# Hoặc dùng raw SQL
SELECT id, name, avatar FROM "Doctor" LIMIT 10;
```

Expected output:
```
doctor_1 | TS BS. Lê Đức Nhân        | /public/doctors/doctor_1.jpg
doctor_2 | ThS.BS Phạm Trần Xuân Anh | /public/doctors/doctor_2.png
doctor_3 | BS.CK2 Trần Thị Khánh Ngọc | /public/doctors/doctor_3.jpg
```

---

## 🎯 Recommended Workflow

1. **Chuẩn bị hình ảnh**
   - Lưu vào `backend/public/doctors/`
   - Đặt tên: `doctor_1.jpg`, `doctor_2.jpg`, ...

2. **Xóa hình ảnh cũ (tuỳ chọn)**
   ```bash
   npx ts-node clear-old-avatars.ts
   ```

3. **Cập nhật từ folder**
   ```bash
   curl -X POST http://localhost:5000/api/admin/doctors/batch-update-avatars \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   ```

4. **Kiểm tra kết quả**
   ```bash
   curl http://localhost:5000/api/doctors/doctor_1
   ```

---

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra token ADMIN hợp lệ
2. Kiểm tra doctor ID đúng format: `doctor_X`
3. Kiểm tra hình ảnh trong `public/doctors/`
4. Kiểm tra server logs
