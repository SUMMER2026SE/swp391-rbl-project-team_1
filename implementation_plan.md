# PayOS Payment Flow - Kế hoạch triển khai theo Phase

## Tổng quan
Chia thành 5 phase nhỏ, độc lập. Mỗi phase có thể verify riêng trước khi chuyển sang phase tiếp theo.

---

## PHASE 1 — Database + Socket.io (Backend nền tảng)
> Thời gian ước tính: **5-10 phút**
> Không ảnh hưởng frontend, an toàn để chạy trước.

### Việc cần làm:
1. **`schema.prisma`** — Thêm `orderCode BigInt?` và `expiredAt DateTime?` vào model `Payment` (enum đã có đủ: PAYOS, EXPIRED)
2. **`socket.ts`** — Export `io` global + thêm 3 event join room: `join_user_room`, `join_doctor_room`, `join_admin_room`
3. **`server.ts`** — Lưu `io` global sau `initSocket()`

### Verify:
```bash
npx prisma migrate dev --name add_payos_fields
npx tsc --noEmit
```

---

## PHASE 2 — Payment Service (Backend logic)
> Thời gian ước tính: **15-20 phút**
> Đây là phần nặng nhất, nhưng tách riêng để dễ test.

### Việc cần làm:
Viết/sửa `payment.service.ts` với 4 hàm mới:

1. **`createPayOSPaymentLink(appointmentId)`**
   - Tạo PayOS link
   - Lưu `orderCode` + `expiredAt = now() + 5 phút` vào DB
   - Trả về `{ qrCode, orderCode, expiredAt, accountNumber, accountName, bin, amount, description }`

2. **`getPaymentStatusByOrderCode(orderCode)`**
   - Query DB lấy payment status theo orderCode
   - Trả về `{ status, appointmentId }`

3. **`processPayOSWebhook(body)`**
   - Idempotent: dùng `prisma.$transaction` với `WHERE status = 'PENDING'`
   - Sau khi PAID: emit socket `payment_confirmed` → `user_${userId}`, `new_appointment` → `doctor_${doctorId}`, `payment_updated` → `admin`

4. **`cancelExpiredPayOSPayments()`**
   - Tìm payment `PENDING` + `expiredAt < now()`
   - Cập nhật `EXPIRED` + appointment `CANCELLED`
   - Emit socket `payment_expired` → `user_${userId}`

### Verify:
```bash
npx tsc --noEmit
```

---

## PHASE 3 — Payment Controller + Routes (Backend API)
> Thời gian ước tính: **10 phút**

### Việc cần làm:
1. **`payment.controller.ts`**
   - Viết lại `createPayOSPaymentUrlHandler`: gọi service mới, trả đủ fields
   - Thêm `getPaymentStatusHandler`: `GET /api/payments/status/:orderCode`
   - `payosWebhookHandler`: gọi `processPayOSWebhook()`, luôn trả 200

2. **`payment.routes.ts`**
   - `GET /payments/status/:orderCode` → `getPaymentStatusHandler` (public, không auth)
   - Giữ `POST /payment/payos-webhook` không có `verifyToken`

3. **`server.ts`** — Đổi `setInterval 5 phút` → `setInterval 1 phút` gọi `cancelExpiredPayOSPayments()`

4. **Admin route** — `GET /api/admin/payments`: trả tất cả payment join đầy đủ, sorted mới nhất

### Verify:
```bash
# Test tạo payment link
curl -X POST http://localhost:5000/api/payment/payos -H "Authorization: Bearer <token>" -d '{"appointmentId":"..."}'

# Test polling
curl http://localhost:5000/api/payments/status/<orderCode>

npx tsc --noEmit
```

---

## PHASE 4 — Frontend Service + Payment Page
> Thời gian ước tính: **20-25 phút**

### Việc cần làm:
1. **`appointment.service.ts`**
   - Sửa `createPayOSPaymentUrl()`: nhận về đủ fields mới
   - Thêm `getPaymentStatus(orderCode)`: gọi `GET /payments/status/:orderCode`

2. **`/payment/[id]/page.tsx`** — Viết lại toàn bộ:
   - **Countdown**: tính từ `expiredAt` server (không phải local)
   - **Polling**: `GET /payments/status/:orderCode` mỗi 3 giây
   - **Socket.io**: lắng nghe `payment_confirmed` trên `user_${userId}`
   - **Socket.io**: lắng nghe `payment_expired` → hiện modal hết hạn
   - **Success screen**: hiển thị bookingCode + thông tin lịch hẹn
   - **Expired screen**: nút "Đặt lịch lại" navigate về trang bác sĩ
   - Logic: polling và socket, cái nào đến trước clear cái kia

### Verify:
```bash
npx tsc --noEmit  # trong frontend
# Mở trình duyệt → đặt lịch → vào trang thanh toán
# Kiểm tra: QR code hiện, đồng hồ đếm ngược đúng 5 phút
```

---

## PHASE 5 — Frontend Dashboard (Doctor + Admin)
> Thời gian ước tính: **15-20 phút**

### Việc cần làm:
1. **Doctor Dashboard** — Trang lịch hẹn bác sĩ:
   - Connect socket vào room `doctor_${doctorId}` khi mount
   - Lắng nghe `new_appointment` → hiện toast notification
   - Refresh danh sách lịch hẹn real-time

2. **Admin Payments Page** — `/admin/payments`:
   - Query từ `GET /api/admin/payments` thay vì chỉ pending
   - Badge màu: PAID (xanh), PENDING (vàng), EXPIRED (đỏ), FAILED (xám)
   - Connect socket `admin` room, lắng nghe `payment_updated` → auto-refresh

### Verify:
```bash
# Mở doctor dashboard + user payment page
# Thanh toán → thấy toast trên doctor dashboard
# Mở admin → thấy giao dịch với badge màu
```

---

## Thứ tự thực hiện

```
Phase 1 (DB + Socket) → Phase 2 (Service) → Phase 3 (Controller/Routes) → Phase 4 (Frontend Payment) → Phase 5 (Dashboard)
```

> [!TIP]
> Nên verify sau mỗi phase bằng `npx tsc --noEmit` trước khi chuyển sang phase tiếp theo để tránh lỗi tích lũy.

> [!IMPORTANT]
> Cần chạy `npx prisma migrate dev` sau Phase 1 để DB có fields mới trước khi chạy Phase 2+.
