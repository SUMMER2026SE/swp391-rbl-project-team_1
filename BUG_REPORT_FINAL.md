# BÁO CÁO LỖI TỔNG HỢP - DỰ ÁN SWP391

> Cập nhật sau khi đọc toàn bộ source code dự án  
> Ngày kiểm tra: 28/07/2026  
> Người kiểm tra: Automated Code Review  
> **Backend TypeScript build: ✅ Không có lỗi biên dịch (tsc --noEmit pass)**

---

## ✅ LỖI ĐÃ ĐƯỢC SỬA (Xác nhận)

| ID | Mô tả | File | Trạng thái |
|----|-------|------|-----------|
| BUG-001 | `authenticateUser` kiểm tra `isLocked` sau khi so sánh password | `auth.service.ts` | ✅ Đã sửa |
| BUG-002 | `createAppointment` bỏ qua validate doctor với gói khám | `appointment.service.ts` | ✅ Đã sửa |
| BUG-004 | `cancelAppointmentHandler` kiểm tra sai điều kiện 24h | `appointment.controller.ts` | ✅ Đã sửa |
| BUG-005 | Hàm `cancelAppointment` service dùng sai syntax kiểm tra null | `appointment.service.ts` | ✅ Đã sửa |
| BUG-009 | Admin không kiểm tra trùng lịch khi tạo schedule | `schedule.controller.ts` | ✅ Đã sửa |
| BUG-016 | `orderCode` PayOS có thể bị trùng lặp (race condition) | `payment.service.ts` | ✅ Đã sửa |
| BUG-018 | Mặc định `amount` không nhất quán (5000 vs 150000) | `appointment.service.ts` | ✅ Đã sửa |
| BUG-019 | `uploadPaymentProof` không kiểm tra quyền sở hữu trong service | `appointment.service.ts` | ✅ Đã sửa (controller kiểm tra) |
| BUG-020 | `getDoctorAppointments` không filter status | `appointment.service.ts` | ✅ Đã sửa |
| BUG-022 | `orderCode` có thể là `NaN` | `payment.service.ts` | ✅ Đã sửa |
| BUG-023 | `AuthTokenPayload` có cả `userId` và `id` không nhất quán | `auth.service.ts` | ✅ Đã sửa |
| BUG-028 | Email xác nhận gửi khi upload biên lai thay vì khi admin duyệt | `appointment.service.ts` | ✅ Đã sửa |
| BUG-029 | `ProtectedRoute` chặn role `USER` truy cập `/my-appointments` | `ProtectedRoute.tsx` | ✅ Đã sửa |
| BUG-NEW-01 | Lỗi TypeScript trong `schedule.controller.ts` | `schedule.controller.ts` | ✅ Đã sửa |
| BUG-NEW-03 | `doctor.controller.ts` tạo Prisma Client mới (connection pool issue) | `doctor.controller.ts` | ✅ Đã sửa |
| BUG-NEW-04 | Non-atomic Delete+Create trong `saveRecord` (data loss risk) | `medical-record.controller.ts` | ✅ Đã sửa |
| BUG-NEW-05 | Toán tử `!` không an toàn với `appointment.doctorId` | `medical-record.controller.ts` | ✅ Đã sửa |
| BUG-012 | VNPay IPN — kiểm tra amount dùng fallback không tin cậy (security risk) | `payment.controller.ts` | ✅ Đã sửa |
| BUG-FRONTEND-01 | Nút "Hủy Lịch" hiển thị sai điều kiện (UX bug) | `my-appointments/page.tsx` | ✅ Đã sửa |

---

## ❌ LỖI CÒN TỒN TẠI (Chưa sửa)

---

### 🔴 MỨC ĐỘ NGHIÊM TRỌNG CAO

---

#### BUG-014: Race Condition Tạo User Từ OTP
**File:** `backend/src/services/auth.service.ts`  
**Mô tả:** Luồng đăng ký OTP: `verifyOtp` kiểm tra xem user tồn tại → không có → tạo user mới. Nếu 2 request OTP từ cùng email đến cùng lúc, cả 2 đều pass kiểm tra "user chưa tồn tại" và cùng cố gắng tạo 2 user trùng email.  
**Hậu quả:** Lỗi 500 không kiểm soát thay vì trả về thông báo lỗi thân thiện.  
**Fix:** Wrap trong `try/catch` để handle `Prisma P2002` (unique violation) và trả về lỗi 409 phù hợp.

---

---

### 🟠 MỨC ĐỘ NGHIÊM TRỌNG TRUNG BÌNH

---

#### BUG-017: Voucher Không Được Validate Lại Lúc Checkout
**File:** `backend/src/services/payment.service.ts`  
**Mô tả:** Voucher được validate khi user chọn (phía frontend), nhưng không được validate lại khi tạo payment order. Người dùng có thể dùng voucher đã hết hạn hoặc đã dùng hết lượt nếu thực hiện thao tác nhanh.

**Fix:** Re-validate voucher trong `createPayOSPaymentLink` service trước khi tạo order:
```typescript
const voucher = await prisma.voucher.findUnique({ where: { code: voucherCode } });
if (!voucher || voucher.usedCount >= voucher.maxUsage || new Date() > voucher.expiryDate) {
  throw new ApiError("Voucher không hợp lệ hoặc đã hết hạn", 400);
}
```

---

#### BUG-021: `getAppointmentsByUser` Trả Về Lịch `PENDING_PAYMENT` Cho Doctor/Admin
**File:** `backend/src/services/appointment.service.ts` — Lines 313–363  
**Mô tả:** Hàm lấy danh sách lịch hẹn theo userId không filter trạng thái, nên bác sĩ hoặc admin có thể thấy cả các lịch đang chờ thanh toán (chưa hoàn thành booking flow).  
**Fix:** Filter `status: { not: 'PENDING_PAYMENT' }` khi caller là doctor/admin.

---

#### BUG-026: `autoCancelExpiredAppointments` Không Gửi Thông Báo Cho Bệnh Nhân
**File:** `backend/src/services/appointment.service.ts` — `autoCancelExpiredAppointments()`  
**Mô tả:** Khi cron job tự động huỷ các lịch hẹn quá hạn thanh toán, không có email hoặc socket notification được gửi đến bệnh nhân. Bệnh nhân chỉ biết lịch bị huỷ khi tự vào app kiểm tra.

```typescript
// Sau khi updateMany(), không có gửi notification
await prisma.appointment.updateMany({ where: { ... }, data: { status: "EXPIRED" } });
// ← Thiếu: gửi email/socket cho từng bệnh nhân bị ảnh hưởng
```

**Fix:** Sau khi `updateMany` → lấy danh sách bệnh nhân bị ảnh hưởng → gửi email thông báo huỷ lịch.

---

#### BUG-027: Hai Cơ Chế Xử Lý Hết Hạn Song Song Có Thể Xung Đột
**Files:** `backend/src/server.ts` + `backend/src/services/payment.service.ts`  
**Mô tả:** Có 2 cơ chế độc lập xử lý lịch hẹn quá hạn:
1. `setInterval` trong `server.ts` chạy `autoCancelExpiredAppointments()` mỗi 1 phút
2. `cancelExpiredPayOSPayments()` trong payment service (PayOS cron)

Hai cơ chế này không phối hợp với nhau, có thể cùng xử lý 1 lịch hẹn đồng thời, dẫn đến duplicate update hoặc race condition.  
**Fix:** Dùng idempotent update với `where: { status: 'PENDING_PAYMENT' }` để tránh double-update (đã có một phần, nhưng cần kiểm tra kỹ hơn).

---

### 🟡 MỨC ĐỘ THẤP / CODE QUALITY

---

#### BUG-NEW-02: `getDoctorAppointmentsController` Là Dead Code
**Files:**
- `backend/src/controllers/doctor.controller.ts` — export `getDoctorAppointmentsController`
- `backend/src/routes/doctor.routes.ts` — import nhưng KHÔNG đăng ký route

**Mô tả:** Controller được viết và import nhưng không có route nào sử dụng. Chức năng tương đương đã được implement đúng trong `doctor-dashboard.controller.ts` và đăng ký tại `GET /api/doctor/appointments`. Code chết gây nhầm lẫn khi bảo trì.  
**Fix:** Xoá import `getDoctorAppointmentsController` khỏi `doctor.routes.ts`, hoặc xóa hàm khỏi `doctor.controller.ts`.

---

## 📋 TỔNG KẾT

| Mức độ | Số lỗi | Danh sách lỗi |
|--------|--------|---------------|
| ✅ Đã sửa | **19** | BUG-001, 002, 004, 005, 009, 012, 016, 018, 019, 020, 022, 023, 028, 029, NEW-01, NEW-03, NEW-04, NEW-05, FRONTEND-01 |
| 🔴 Critical (Chưa sửa) | **1** | BUG-014 |
| 🟠 Medium (Chưa sửa) | **4** | BUG-017, BUG-021, BUG-026, BUG-027 |
| 🟡 Low/Quality (Chưa sửa) | **1** | BUG-NEW-02 |

**Tổng: 25 lỗi tìm thấy — 19 đã sửa — 6 còn tồn tại**

---

## 🔧 ƯU TIÊN SỬA (Lỗi còn lại)

1. **[NGAY]** BUG-014 — Race condition tạo user từ OTP gây lỗi 500
2. **[SỚM]** BUG-017 — Re-validate voucher khi checkout
4. **[BÌNH THƯỜNG]** BUG-021 — Filter lịch PENDING_PAYMENT cho doctor/admin
5. **[BÌNH THƯỜNG]** BUG-026 — Gửi notification khi tự động hủy lịch
6. **[BÌNH THƯỜNG]** BUG-027 — Phối hợp 2 cơ chế xử lý hết hạn
7. **[KHI CÓ THỜI GIAN]** BUG-NEW-02 — Dọn dẹp dead code

---

## 📝 CHI TIẾT CÁC SỬA CHỮA ĐÃ THỰC HIỆN

### BUG-016 (orderCode race condition)
```typescript
// Trước: Date.now() có thể trùng trong cùng 1ms
const orderCode = Date.now();

// Sau: Thêm component ngẫu nhiên để đảm bảo uniqueness
const orderCode = (Date.now() % 1_000_000_000) * 1000 + Math.floor(Math.random() * 1000);
```

### BUG-018 (amount fallback không nhất quán)
- `appointment.service.ts`: Bỏ fallback `?? 5000`, thêm kiểm tra bắt buộc amount từ doctor.price
- `payment.service.ts`: Đồng nhất fallback, ưu tiên `appointment.amount` trước

### BUG-020 (getDoctorAppointments không filter status)
```typescript
// Trước: Trả về mọi trạng thái
where: { doctorId }

// Sau: Chỉ trả về lịch hẹn có ý nghĩa với bác sĩ
where: {
  doctorId,
  status: { in: ["PENDING", "CONFIRMED", "COMPLETED", "PENDING_PAYMENT"] }
}
```

### BUG-028 (email xác nhận gửi sai thời điểm)
- Xóa email gửi trong `uploadPaymentProof()` (gửi sai khi chưa được duyệt)
- Email xác nhận chỉ gửi qua VNPay webhook, PayOS webhook và mock payment khi đã CONFIRMED

### BUG-NEW-03 (Prisma connection pool)
```typescript
// Trước:
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Sau:
import prisma from "../prisma/client"; // Dùng shared singleton
```

### BUG-NEW-04 (non-atomic delete+create)
```typescript
// Sau khi sửa: Toàn bộ thao tác trong 1 transaction
await prisma.$transaction(async (tx) => {
  await tx.labOrder.deleteMany({ where: { medicalRecordId: record.id } });
  if (labOrders.length > 0) {
    await tx.labOrder.createMany({ data: [...] });
  }
  await tx.prescription.deleteMany({ where: { medicalRecordId: record.id } });
  if (prescriptions.length > 0) {
    await tx.prescription.createMany({ data: [...] });
  }
});
```

### BUG-NEW-05 (non-null assertion doctorId!)
```typescript
// Trước:
doctorId: appointment.doctorId!

// Sau:
if (!appointment.doctorId) {
  return res.status(400).json({ error: "Lịch hẹn không có bác sĩ, không thể tạo hồ sơ bệnh án" });
}
// ...
doctorId: appointment.doctorId // Đã kiểm tra null ở trên
```

### BUG-012 (VNPay IPN amount validation)
```typescript
// Trước: Dùng fallback 150000 khi payment record không tồn tại
const expectedAmount = appointment.payment?.amount || 150000;
if (amount !== expectedAmount) { ... }

// Sau: Require payment record phải tồn tại, không dùng fallback
if (!appointment.payment) {
    res.status(200).json({ RspCode: "04", Message: "Invalid amount" });
    return;
}
const expectedAmount = appointment.payment.amount; // amount là Int, không nullable
if (amount !== expectedAmount) { ... }

// Đồng thời đơn giản hóa check step 3 (payment đã được confirm tồn tại):
if (appointment.payment.status !== PaymentStatus.PENDING) {
    res.status(200).json({ RspCode: "02", Message: "Order already confirmed" });
    return;
}
```

### BUG-FRONTEND-01 (nút hủy lịch)
```typescript
// Trước:
const canCancel = diffHours > 0;  // Sai: hiển thị nút với mọi lịch tương lai

// Sau:
const canCancel = diffHours > 24; // Đúng: chỉ hiển thị khi còn hơn 24h