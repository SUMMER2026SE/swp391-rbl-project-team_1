# EduPath - Nền tảng Học tập & Lộ trình Cá nhân hóa

EduPath là một hệ thống web full-stack giúp sinh viên quản lý lộ trình học tập, hoàn thành các bài tập (quiz), thu thập huy hiệu (badge), và theo dõi tiến độ qua sơ đồ nhiệt (heatmap). Hệ thống đồng thời cho phép Mentor và Admin tạo các lộ trình mẫu (Roadmap Templates) và quản lý người dùng.

## 1. Kiến trúc Tổng quan & Stack Công nghệ
- **Frontend:** React (Next.js 14, App Router, TypeScript), Tailwind CSS, Lucide React (Icons), React Hot Toast (Notifications), Zustand (State management - nếu có).
- **Backend:** Node.js (Express), TypeScript, Prisma ORM.
- **Database:** PostgreSQL (Lưu trữ Supabase / Local).
- **Security:** JWT Token (HttpOnly Cookie), bcrypt, zod validation.
- **AI Integration:** Google Gemini AI (Tạo Quiz và Roadmap tự động).
- **Kiến trúc Dịch vụ (Service-based):** Backend được tách thành các service chuyên biệt giúp dễ bảo trì (vd: `badge.service.ts` đánh giá huy hiệu, `activity.service.ts` quản lý lịch sử hoạt động, `bkt.service.ts` thuật toán Knowledge Tracing).

## 2. Hướng dẫn Cài đặt & Chạy Local

### Yêu cầu hệ thống
- Node.js (v18+ khuyến nghị)
- PostgreSQL (hoặc kết nối Supabase)

### Các bước cài đặt
1. **Clone repository và cài đặt thư viện:**
   ```bash
   cd frontend
   npm install
   cd ../backend
   npm install
   ```

2. **Cấu hình biến môi trường (`.env`):**
   Trong thư mục `backend`, tạo file `.env` (hoặc copy từ `.env.example`):
   ```env
   PORT=5000
   DATABASE_URL="postgresql://user:password@localhost:5432/edupath?schema=public"
   JWT_SECRET="your_jwt_secret_key"
   JWT_EXPIRES_IN="7d"
   GEMINI_API_KEY="your_gemini_api_key"
   ```
   *Lưu ý: Không bao giờ commit file `.env` lên Git.*

3. **Khởi tạo Database & Dữ liệu mẫu (Seed):**
   ```bash
   cd backend
   npx prisma migrate dev --name init
   # Hoặc nếu DB đã có sẵn cấu trúc, dùng: npx prisma db push
   
   npx prisma db seed
   ```

4. **Khởi chạy ứng dụng:**
   - Terminal 1 (Backend):
     ```bash
     cd backend
     npm run dev
     ```
   - Terminal 2 (Frontend):
     ```bash
     cd frontend
     npm run dev
     ```
   - Truy cập `http://localhost:3000` để xem Frontend.

## 3. Danh sách Tính năng theo Role

### 👩‍🎓 Student (Học sinh)
- **Đăng ký/Đăng nhập:** Đăng nhập an toàn qua HttpOnly Cookie. Hỗ trợ Quên mật khẩu qua OTP.
- **Cộng đồng (Community):** Xem các Roadmap Mẫu do Mentor/Admin tạo.
- **Lộ trình cá nhân:** Clone Roadmap mẫu về làm của riêng. Hoàn thành Task sẽ ghi nhận lịch sử vào Heatmap.
- **Làm Quiz:** Giải các bài Quiz để tăng độ thành thạo (Mastery) theo thuật toán BKT.
- **Huy hiệu & Thành tích:** Đạt các huy hiệu tự động khi đủ điều kiện (vd: Lần đầu làm Quiz, Hoàn thành 10 Pomodoro, Streak 3 ngày...).
- **Pomodoro Timer:** Hỗ trợ canh thời gian học tập tập trung.

### 👨‍🏫 Mentor (Người hướng dẫn)
- **Quản lý Roadmap Templates (CRUD):** Tạo, Xem, Sửa, Xóa các lộ trình mẫu. Chỉ được Sửa/Xóa mẫu do chính mình tạo.
- **Ngân hàng câu hỏi (Quiz Bank):** Tạo các câu hỏi trắc nghiệm. Dùng AI sinh câu hỏi tự động.
- **Cảnh báo (Red Flags):** Xem và gửi cảnh báo thủ công/tự động nếu Student có tiến độ yếu.
- **Quản lý Học sinh:** Xem danh sách học sinh và tiến độ của từng em.

### 🛡️ Admin (Quản trị viên)
- Có toàn bộ quyền của Mentor.
- Có quyền Ghi đè (Override): Có thể Sửa/Xóa Roadmap Template của bất kỳ Mentor nào.
- Quản lý người dùng, kỹ năng (Skills) trên hệ thống.

## 4. Hạn chế & Hướng phát triển
Dù hệ thống đã hoàn thiện các tính năng cốt lõi, vẫn còn một số điểm có thể cải thiện trong tương lai:
1. **Giao diện xác nhận Xóa (Delete UI):** Hiện tại hành động xóa (ví dụ xóa Template) đang sử dụng `window.confirm` mặc định của trình duyệt để tối ưu thời gian phát triển. Có thể nâng cấp thành các Modal Custom (vd: Headless UI) để trải nghiệm liền mạch hơn.
2. **Dọn dẹp OTP rác:** Cơ chế sinh OTP đang lưu trong DB, nhưng chưa có cron-job định kỳ xóa các OTP đã hết hạn/đã sử dụng. Lâu dài có thể gây đầy bảng OTP.
3. **Múi giờ (Timezone) trong ActivityLog:** Cơ chế nhóm dữ liệu theo ngày (để vẽ Heatmap và tính Streak) hiện đang hardcode convert timezone theo offset `+7` (`Asia/Ho_Chi_Minh`). Nó chạy hoàn hảo cho người dùng ở Việt Nam, nhưng chưa tự động hỗ trợ đa múi giờ nếu hệ thống mở rộng ra khu vực khác.
4. **Giới hạn số lượng truy vấn AI:** Hiện tại chức năng Generate Quiz và Roadmap đang gọi thẳng Gemini API mà chưa có cơ chế queue/rate-limiting ở tầng ứng dụng, có thể gặp lỗi nếu nhiều user cùng gọi 1 lúc vượt quá hạn mức của API key miễn phí.
