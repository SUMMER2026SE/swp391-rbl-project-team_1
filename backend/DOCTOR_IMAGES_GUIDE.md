# 📸 Hướng Dẫn Cập Nhật Hình Ảnh Bác Sĩ

## Giải Pháp 1: Upload Hình Ảnh Local (Đơn Giản Nhất) ⭐

### Bước 1: Chuẩn Bị Hình Ảnh
1. Đặt tất cả hình ảnh bác sĩ vào thư mục: `backend/public/doctors/`
2. **Đặt tên hình ảnh theo quy tắc**: `doctor_1.jpg`, `doctor_2.jpg`, ..., `doctor_68.jpg`
3. Hỗ trợ định dạng: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`

**Ví dụ cấu trúc:**
```
backend/public/doctors/
├── doctor_1.jpg        (Bác sĩ doctor_1)
├── doctor_2.png        (Bác sĩ doctor_2)
├── doctor_3.jpg        (Bác sĩ doctor_3)
└── ...
```

### Bước 2: Chạy Script Cập Nhật

Chạy lệnh sau từ thư mục `backend`:

```bash
npx ts-node update-doctor-images.ts
```

**Output ví dụ:**
```
🖼️  Scanning for doctor images...

📷 Found 3 image files:
   - doctor_1.jpg
   - doctor_2.jpg
   - doctor_3.png

✅ Updated doctor_1: /public/doctors/doctor_1.jpg
✅ Updated doctor_2: /public/doctors/doctor_2.jpg
✅ Updated doctor_3: /public/doctors/doctor_3.png

✨ Updated 3 doctor images!
```

---

## Giải Pháp 2: Upload Hình Ảnh Qua CSV File

Nếu bạn có danh sách doctor ID và đường dẫn hình ảnh trong file CSV:

**File: `doctor_images.csv`**
```csv
doctorId,imagePath
doctor_1,/public/doctors/doctor_1.jpg
doctor_2,/public/doctors/doctor_2.jpg
doctor_3,/public/doctors/doctor_3.png
doctor_4,https://example.com/doctor4.jpg
```

Chạy script:
```bash
npx ts-node batch-update-doctor-images.ts doctor_images.csv
```

---

## Giải Pháp 3: Upload Hình Qua API Endpoint (Live System)

### 3.1 Cập Nhật Một Hình Ảnh

**Endpoint:** `POST /api/admin/doctors/:id/avatar`

**Yêu cầu:** Token ADMIN

```bash
curl -X POST http://localhost:5000/api/admin/doctors/doctor_1/avatar \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"avatarUrl": "/public/doctors/doctor_1.jpg"}'
```

**Response:**
```json
{
  "message": "Doctor avatar updated successfully",
  "doctor": {
    "id": "doctor_1",
    "name": "TS BS. Lê Đức Nhân",
    "avatar": "/public/doctors/doctor_1.jpg"
  }
}
```

### 3.2 Cập Nhật Hàng Loạt Từ Folder

**Endpoint:** `POST /api/admin/doctors/batch-update-avatars`

**Yêu cầu:** Token ADMIN

```bash
curl -X POST http://localhost:5000/api/admin/doctors/batch-update-avatars \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Điều này sẽ:**
- Quét thư mục `public/doctors/` tìm hình ảnh
- Tìm các file theo pattern: `doctor_1.jpg`, `doctor_2.png`, ...
- Cập nhật database tự động

**Response:**
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
    ...
  ]
}
```

---

## Giải Pháp 4: Tạo Hình Ảnh Placeholder

Nếu bạn chưa có hình ảnh thực, tạo placeholder tự động:

```bash
npx ts-node generate-placeholder-images.ts
```

Điều này sẽ:
- Tạo 68 hình SVG placeholder
- Mỗi hình có tên viết tắt bác sĩ
- Lưu vào `public/doctors/`
- Cập nhật database tự động

---

## Lưu Ý Quan Trọng ⚠️

1. **Định dạng hình ảnh**: Hỗ trợ JPG, PNG, WebP, GIF, SVG
2. **Kích thước tệp**: Nên dưới 5MB mỗi file
3. **Tên file**: Phải khớp với pattern `doctor_X` (X là số)
4. **Đường dẫn Local**: Sử dụng `/public/doctors/` cho file local
5. **URL Remote**: Có thể dùng URL đầy đủ như `https://example.com/image.jpg`

---

## Xóa Toàn Bộ Hình Cũ (Gravatar URLs)

Nếu bạn muốn xóa toàn bộ URL hình ảnh cũ trước khi cập nhật:

```bash
npx ts-node clear-old-avatars.ts
```

---

## Kiểm Tra Kết Quả

### 1. Kiểm Tra qua Database
```bash
npx prisma studio
```
Mở `Doctor` table, kiểm tra cột `avatar`

### 2. Kiểm Tra qua API
```bash
curl http://localhost:5000/api/doctors/doctor_1
```

Xem trường `avatar` trong response

### 3. Kiểm Tra File
```bash
# Windows
dir backend\public\doctors

# Linux/Mac
ls -la backend/public/doctors/
```

---

## Workflow Gợi Ý

**Bước 1:** Xóa hình ảnh cũ
```bash
npx ts-node clear-old-avatars.ts
```

**Bước 2:** Chuẩn bị hình ảnh mới trong `public/doctors/`

**Bước 3:** Chạy script cập nhật
```bash
npx ts-node update-doctor-images.ts
```

**Bước 4:** Kiểm tra kết quả
```bash
npx prisma studio
```

---

## Troubleshooting

### Q: Hình ảnh không hiển thị
A: 
- Kiểm tra đường dẫn trong database
- Kiểm tra file tồn tại trong `public/doctors/`
- Kiểm tra server đang serve static files từ `public/`

### Q: File CSV không được nhận
A:
- Kiểm tra format: phải có header `doctorId,imagePath`
- Đảm bảo doctorId tồn tại trong database
- Ví dụ: `doctor_images_sample.csv`

### Q: API endpoint không hoạt động
A:
- Kiểm tra token ADMIN hợp lệ
- Kiểm tra doctor ID đúng format: `doctor_X`
- Kiểm tra thư mục `public/doctors/` tồn tại

---

## Files Liên Quan

- `update-doctor-images.ts` - Script quét và cập nhật hình từ folder
- `batch-update-doctor-images.ts` - Script cập nhật từ file CSV
- `clear-old-avatars.ts` - Script xóa hình ảnh cũ
- `generate-placeholder-images.ts` - Script tạo placeholder
- `doctor_images_sample.csv` - Sample file CSV
- `DOCTOR_IMAGES_GUIDE.md` - File này
