# Hướng Dẫn Chia Sẻ Cấu Hình Dự Án Cho Thành Viên Trong Nhóm (Team Sharing Guide)

Để tất cả các thành viên trong nhóm dùng chung một database trên Supabase và chung cấu hình đăng nhập Google khi chạy code ở máy cá nhân (localhost), các bạn hãy làm theo các bước dưới đây:

---

## 1. Chia sẻ cấu hình Database & Google Login (File `.env` ở Backend)

Tất cả thành viên trong nhóm cần tạo file `.env` trong thư mục `backend` ở máy của mình và sao chép nội dung cấu hình dưới đây:

```env
# Port chạy server local
PORT=5000

# Trạng thái môi trường
NODE_ENV=development

# Database chung trên Supabase (Dùng chung)
DATABASE_URL="postgresql://postgres.oakjyzjsgthatcbnwwul:chucaohuy1082005%40@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?schema=public"

# Khóa JWT để tạo token đăng nhập
JWT_SECRET="48b7f7943d0434cd6d71b3e7bc2a6da7bdf0eb7ab2bfaea519f7fb967406a4b1"

# CORS cho phép Frontend gọi API
CORS_ORIGIN="http://localhost:3000"

# Google Credentials (Dùng chung)
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# URL Frontend điều hướng sau khi Google callback
CLIENT_URL="http://localhost:3000"

# Google Gemini API Key (Nếu cần)
GEMINI_API_KEY=""
```

*Lưu ý:* File `.env` chứa thông tin bảo mật nên thường được ghi vào `.gitignore` (không đẩy lên GitHub). Các bạn có thể gửi trực tiếp nội dung trên qua chat/zalo cho các thành viên trong nhóm.

---

## 2. Chia sẻ cấu hình Frontend (File `.env.local` ở Frontend)

Tất cả thành viên trong nhóm cần tạo file `.env.local` trong thư mục `frontend` trên máy của mình:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 3. Cấu hình trên Google Cloud Console (Nếu chạy localhost khác port)

Đăng nhập Google yêu cầu kiểm tra chính xác địa chỉ redirect (Callback URL). Hiện tại, Google Client ID đang được cấu hình callback về:
* **Redirect URI:** `http://localhost:5000/api/auth/google/callback`

Do đó, tất cả thành viên trong nhóm khi chạy dự án ở local bắt buộc phải chạy backend trên port **5000** (`http://localhost:5000`) và frontend trên port **3000** (`http://localhost:3000`) để Google cho phép đăng nhập thành công.

---

## 4. Cách đồng bộ dữ liệu / Thay đổi Schema

Khi có một thành viên thay đổi Database Schema (sửa đổi file `prisma/schema.prisma`):
1. Không tự ý chạy `prisma db push` bừa bãi tránh xung đột cấu trúc.
2. Khi có sự thay đổi được thống nhất, một người sẽ chạy lệnh để đồng bộ lên Supabase:
   ```bash
   npx prisma db push
   ```
3. Các thành viên còn lại chỉ cần kéo code mới nhất từ GitHub về máy và chạy lệnh sau để cập nhật Prisma Client cục bộ trên máy của họ:
   ```bash
   npx prisma generate
   ```
