# Hướng dẫn kiểm thử Tính năng Cuộc gọi Video WebRTC (MedBooking)

Tài liệu này hướng dẫn cách chạy và kiểm thử tính năng cuộc gọi video thực tế giữa **Bác sĩ** và **Bệnh nhân** sử dụng WebRTC và Socket.io trên máy tính cá nhân (`localhost`).

---

## 🚀 Các bước chuẩn bị trước khi chạy

### 1. Cập nhật Client-Side database:
Vì chúng ta vừa bổ sung thêm hai trường `videoCallStatus` và `videoCallRoomId` vào cơ sở dữ liệu để lưu trữ thông tin phòng gọi, vui lòng đồng bộ cơ sở dữ liệu bằng cách chạy lệnh sau trong thư mục `backend`:
```bash
npx prisma db push
```
*(Nếu bạn đã tắt máy chủ backend trước đó, vui lòng chạy lệnh `npx prisma generate` để cập nhật lại Prisma Client typings).*

### 2. Khởi động lại hệ thống:
Vui lòng khởi động lại cả **Backend** và **Frontend** để các gói thư viện mới (`socket.io`, `socket.io-client`, `simple-peer`) và cấu hình server HTTP mới được nhận diện.

- **Backend**:
  ```bash
  npm run dev
  ```
- **Frontend**:
  ```bash
  npm run dev
  ```

---

## 🧪 Quy trình kiểm thử (2 Tab Trình duyệt)

Để mô phỏng cuộc gọi thực tế, hãy mở hai cửa sổ trình duyệt khác nhau (hoặc sử dụng 1 tab bình thường và 1 tab ẩn danh - Incognito) để đăng nhập vào hai tài khoản khác nhau.

### Bước 1: Đăng nhập tài khoản Bệnh nhân (Tab 1 - Khách/Bệnh nhân)
1. Truy cập vào giao diện Web MedBooking: `http://localhost:3000`.
2. Đăng nhập bằng tài khoản **Bệnh nhân** của bạn.
3. Sau khi đăng nhập thành công, giữ tab này hoạt động. Trình duyệt của Bệnh nhân sẽ tự động thiết lập một kết nối Socket.io ngầm đến Server để chờ cuộc gọi.

### Bước 2: Đăng nhập tài khoản Bác sĩ (Tab 2 - Ẩn danh/Bác sĩ)
1. Mở một tab ẩn danh mới và truy cập `http://localhost:3000`.
2. Đăng nhập bằng tài khoản **Bác sĩ** (ví dụ: tài khoản bác sĩ Đà Nẵng đã seed).
3. Truy cập vào mục **"Quản lý lịch hẹn"** (Appointments page).
4. Tìm đến lịch hẹn có trạng thái **"Đã xác nhận"** (CONFIRMED) của tài khoản bệnh nhân ở Bước 1.

### Bước 3: Tiến hành thực hiện cuộc gọi
1. Tại **Tab Bác sĩ**, click vào nút **"Gọi khám"** màu xanh ngọc (icon Video) bên cạnh lịch hẹn.
2. Trình duyệt của Bác sĩ sẽ lập tức chuyển hướng đến trang `/doctor/video-call?appointmentId=ID_LICH_HEN`.
3. Màn hình của Bác sĩ sẽ hiển thị Camera của Bác sĩ (ở góc dưới) và hiển thị trạng thái **"Đang đổ chuông..."** ở màn hình chính.
4. Đồng thời, tại **Tab Bệnh nhân**, một hộp thoại Modal cực kỳ nổi bật sẽ hiện lên kèm âm thanh nhạc chuông báo hiệu:
   > **"Cuộc gọi đến từ bác sĩ [Tên Bác sĩ]"**
5. Bệnh nhân có hai lựa chọn:
   - **Từ chối (Reject)**: Hộp thoại sẽ biến mất, phía Bác sĩ nhận được thông báo "Bệnh nhân đã từ chối cuộc gọi" và tự động tắt máy.
   - **Chấp nhận (Accept)**: Nhấp vào **"Chấp nhận"**, tab bệnh nhân sẽ tự động chuyển hướng sang trang `/patient/video-call?appointmentId=...&roomId=...`.

### Bước 4: Kiểm tra luồng WebRTC
1. Sau khi bệnh nhân nhấn **"Chấp nhận"**, hai trình duyệt sẽ bắt đầu trao đổi tín hiệu WebRTC (Offer, Answer, ICE Candidates) thông qua Socket.io.
2. Khi kết nối thành công:
   - Màn hình chính của Bác sĩ hiển thị trực tiếp camera của Bệnh nhân.
   - Màn hình chính của Bệnh nhân hiển thị trực tiếp camera của Bác sĩ.
   - Đồng hồ đếm thời gian tư vấn (Call Duration) ở góc trên bắt đầu chạy.
3. Thử nghiệm các nút chức năng:
   - **Tắt tiếng (Mute mic)** hoặc **Tắt camera (Toggle camera)** ở mỗi bên.
   - **Ghi âm hội thoại y tế** ở phía Bác sĩ (Panel bên phải vẫn giữ nguyên và hoạt động song song để bác sĩ ghi nhận EMR bằng AI).
4. Bấm nút **"Gác máy"** (đỏ) ở bất kỳ bên nào để kết thúc cuộc gọi. Cả hai tab sẽ tự động ngắt luồng stream, cập nhật trạng thái trong database thành `ENDED`, và chuyển hướng người dùng về trang quản lý tương ứng.
