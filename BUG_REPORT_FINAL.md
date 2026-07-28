# BÁO CÁO LỖI TỔNG HỢP - DỰ ÁN SWP391

> Cập nhật sau khi đọc toàn bộ source code dự án  
> Ngày kiểm tra: 28/07/2026  
> Người kiểm tra: Automated Code Review

---

## ✅ LỖI ĐÃ ĐƯỢC SỬA (Xác nhận)

| ID | Mô tả | Trạng thái |
|----|-------|-----------|
| BUG-001 | `authenticateUser` kiểm tra `isLocked` sau khi so sánh password | ✅ Đã sửa |
| BUG-002 | `createAppointment` bỏ qua validate doctor với gói khám | ✅ Đã sửa |
| BUG-004 | `cancelAppointmentHandler` kiểm tra sai điều kiện 24h | ✅ Đã sửa |
| BUG-005 | Hàm `cancelAppointment` service dùng sai syntax kiểm tra null | ✅ Đã sửa |
| BUG-009 | Admin không kiểm tra trùng lịch khi tạo schedule | ✅ Đã sửa |
| BUG-019 | `uploadPaymentProof` không kiểm tra quyền sở hữu trong service | ✅ Đã sửa (controller kiểm tra) |
| BUG-022 | `orderCode` có thể là `NaN` | ✅ Đã sửa |
| BUG-023 | `AuthTokenPayload` có cả `userId` và `id` không nhất quán | ✅ Đã sửa |
| BUG-029 | `ProtectedRoute` chặn role `USER` truy cập `/my-appointments` | ✅ Đã sửa |
| BUG-NEW-01 | Lỗi TypeScript trong `schedule.controller.ts` | ✅ Đã sửa |

---

## ❌ LỖI CÒN TỒN TẠI (Chưa sửa)

---

### 🔴 MỨC ĐỘ NGHIÊM TRỌNG CAO

---

#### BUG-NEW-04: Non-atomic Delete+Create trong `saveRecord` (Data Loss Risk)
**File:** `backend/src/controllers/medical-record.controller.ts` — Lines 220–255  
**Mô tả:** Khi lưu hồ sơ bệnh án, controller thực hiện `deleteMany` rồi `createMany` cho `labOrders` và `prescriptions` mà **không dùng transaction**. Nếu `createMany` thất bại sau khi `deleteMany` đã hoàn thành, dữ liệu đơn thuốc / xét nghiệm sẽ bị mất vĩnh viễn.

```typescript
// Lines 220-234 — LabOrders (KHÔNG có transaction)
await prisma.labOrder.deleteMany({ where: { medicalRecordId: record.id } });
if (labOrders.length > 0) {
  await prisma.labOrder.createMany({ data: labOrders.map(...) }); // Nếu lỗi → data mất
}

// Lines 238-255 — Prescriptions (KHÔNG có transaction)
await prisma.prescription.deleteMany({ where: { medicalRecordId: record.id } });
if (prescriptions.length > 0) {
  await prisma.prescription.createMany({ data: prescriptions.map(...) }); // Nếu lỗi → data mất
}
```

**Hậu quả:** Mất dữ liệu đơn thuốc của bệnh nhân.  
**Fix:** Wrap toàn bộ logic upsert record + delete/create lab orders + delete/create prescriptions trong `prisma.$transaction(async (tx) => { ... })`.

---

#### BUG-016: `orderCode` PayOS Có Thể Bị Trùng Lặp (Race Condition)
**File:** `backend/src/services/payment.service.ts`  
**Mô tả:** `orderCode` được tạo từ `Date.now()` (Unix timestamp dạng số nguyên). Trong môi trường có nhiều request đồng thời, 2 request trong cùng 1ms sẽ tạo ra **cùng một `orderCode`**, gây lỗi trùng lặp phía PayOS.

```typescript
const orderCode = Date.now(); // CÓ THỂ TRÙNG
```

**Fix:** Dùng `Date.now() * 1000 + Math.floor(Math.random() * 1000)` hoặc UUID-based number.

---

#### BUG-014: Race Condition Tạo User Từ OTP
**File:** `backend/src/services/auth.service.ts`  
**Mô tả:** Luồng đăng ký OTP: `verifyOtp` kiểm tra xem user tồn tại → không có → tạo user mới. Nếu 2 request OTP từ cùng email đến cùng lúc, cả 2 đều pass kiểm tra "user chưa tồn tại" và tạo 2 user trùng email.  
**Fix:** Thêm unique constraint email trên DB (đã có), nhưng cần wrap trong `try/catch` để handle `Prisma P2002` (unique violation) và trả về lỗi phù hợp thay vì 500.

---

#### BUG-012: VNPay IPN — Kiểm Tra Amount Với Fallback Không Tin Cậy
**File:** `backend/src/controllers/payment.controller.ts`  
**Mô tả:** Trong VNPay IPN handler, `vnp_Amount` được so sánh với `appointment.amount * 100`. Nếu `appointment.amount` là `null`, hàm dùng fallback `|| 150000` hoặc `|| 5000` (tùy nơi), dẫn đến số tiền kiểm tra sai. Kẻ xấu có thể gửi IPN với số tiền thấp hơn thực tế.  
**Fix:** Luôn lấy `amount` từ bản ghi payment trong DB, không dùng fallback khi validate.

---

### 🟠 MỨC ĐỘ NGHIÊM TRỌNG TRUNG BÌNH

---

#### BUG-018: Mặc Định `amount` Không Nhất Quán (5000 vs 150000)
**Files:**
- `backend/src/services/appointment.service.ts` — `amount: appointment.amount ?? 5000`
- `backend/src/services/payment.service.ts` — fallback `150000`

**Mô tả:** Hai nơi dùng 2 giá trị mặc định khác nhau cho `amount` khi giá trị là `null`. Dẫn đến mâu thuẫn số tiền hiển thị và số tiền thanh toán thực tế.  
**Fix:** Cần đồng nhất một giá trị, hoặc ném exception nếu `amount` là null.

---

#### BUG-020: `getDoctorAppointments` Trả Về Mọi Trạng Thái (Không Filter)
**File:** `backend/src/services/appointment.service.ts` — Lines 403–429  
**Mô tả:** `getDoctorAppointments(doctorId)` truy vấn tất cả lịch hẹn của bác sĩ mà không lọc theo trạng thái. Bác sĩ sẽ thấy cả các lịch hẹn `PENDING_PAYMENT`, `EXPIRED`, `CANCELLED` — những lịch không cần thiết bác sĩ biết.

```typescript
return prisma.appointment.findMany({
  where: { doctorId }, // Không filter status
  ...
});
```

**Fix:** Thêm `status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED'] }` vào điều kiện `where`.

---

#### BUG-021: `getAppointmentsByUser` Trả Về Lịch `PENDING_PAYMENT` Cho Doctor/Admin
**File:** `backend/src/services/appointment.service.ts` — Lines 313–363  
**Mô tả:** Hàm lấy danh sách lịch hẹn theo userId không filter trạng thái, nên bác sĩ hoặc admin có thể thấy cả các lịch đang chờ thanh toán (chưa hoàn thành booking flow).  
**Fix:** Tùy theo ngữ cảnh sử dụng, filter `status: { not: 'PENDING_PAYMENT' }` khi cần.

---

#### BUG-026: `autoCancelExpiredAppointments` Không Gửi Thông Báo Cho Bệnh Nhân
**File:** `backend/src/services/appointment.service.ts` — `autoCancelExpiredAppointments()`  
**Mô tả:** Khi cron job tự động huỷ các lịch hẹn quá hạn thanh toán, không có email hoặc socket notification được gửi đến bệnh nhân. Bệnh nhân chỉ biết lịch bị huỷ khi tự vào app kiểm tra.  
**Fix:** Sau khi `updateMany` → lấy danh sách email → gửi email thông báo huỷ lịch.

---

#### BUG-027: Hai Cơ Chế Xử Lý Hết Hạn Song Song Có Thể Xung Đột
**Files:** `backend/src/server.ts` + `backend/src/services/payment.service.ts`  
**Mô tả:** Có 2 cơ chế độc lập xử lý lịch hẹn quá hạn:
1. `setInterval` trong `server.ts` chạy `autoCancelExpiredAppointments()` mỗi 1 phút
2. PayOS webhook có thể cancel khi payment timeout

Hai cơ chế này không phối hợp với nhau, có thể cùng xử lý 1 lịch hẹn đồng thời.  
**Fix:** Dùng distributed lock hoặc kiểm tra trạng thái lại trước khi update (idempotent update).

---

#### BUG-028: Gửi Email Xác Nhận Khi Upload Biên Lai — Chưa Phải Khi Admin Duyệt
**File:** `backend/src/services/appointment.service.ts` — `uploadPaymentProof()`  
**Mô tả:** Khi user upload ảnh biên lai, hệ thống chuyển status thành `PENDING` và **ngay lập tức gửi email xác nhận "lịch hẹn đã được xác nhận"** cho bệnh nhân và bác sĩ. Trong khi thực tế admin chưa duyệt biên lai, lịch hẹn chỉ đang ở trạng thái chờ duyệt.  
**Fix:** Chỉ gửi email khi admin duyệt biên lai và chuyển status thành `CONFIRMED`.

---

#### BUG-017: Voucher Không Được Validate Lại Lúc Checkout
**File:** `backend/src/services/payment.service.ts`  
**Mô tả:** Voucher được validate khi user chọn (phía frontend), nhưng không được validate lại khi tạo payment order. Người dùng có thể dùng voucher đã hết hạn hoặc đã dùng hết lượt nếu thực hiện thao tác nhanh.  
**Fix:** Re-validate voucher trong `createPaymentOrder` service trước khi tạo order.

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

#### BUG-NEW-03: `doctor.controller.ts` Tạo Prisma Client Mới (Connection Pool Issue)
**File:** `backend/src/controllers/doctor.controller.ts` — Lines 9–11

```typescript
import { PrismaClient } from "@prisma/client"; // ❌
const prisma = new PrismaClient();              // ❌ Tạo instance mới
```

**Mô tả:** Thay vì import shared Prisma instance từ `../prisma/client`, file này tạo một `PrismaClient` mới. Điều này dẫn đến **nhiều connection pool song song**, lãng phí tài nguyên DB và có thể gây timeout trên server có connection limit thấp.  
**Fix:**
```typescript
import prisma from "../prisma/client"; // ✅ Dùng shared instance
```

---

#### BUG-NEW-05: Toán Tử `!` Không An Toàn Với `appointment.doctorId`
**File:** `backend/src/controllers/medical-record.controller.ts` — Line 211

```typescript
doctorId: appointment.doctorId!, // ❌ Non-null assertion
```

**Mô tả:** Với các lịch hẹn gói khám (medical package), `doctorId` có thể là `null`. Non-null assertion `!` sẽ pass `undefined` vào Prisma, gây lỗi runtime hoặc tạo record với `doctorId = null` khi schema yêu cầu.  
**Fix:** Kiểm tra `if (!appointment.doctorId) { return res.status(400)... }` trước khi upsert.

---

#### BUG-FRONTEND-01: Nút "Hủy Lịch" Hiển Thị Sai Điều Kiện (UX Bug)
**File:** `frontend/src/app/my-appointments/page.tsx` — Lines 182–183, 305–320

```typescript
const canCancel = diffHours > 0; // ❌ Hiển thị nút với mọi lịch tương lai
```

**Mô tả:** `canCancel` chỉ kiểm tra `diffHours > 0` (lịch chưa đến giờ) nên nút "Hủy lịch hẹn" hiển thị kể cả với lịch chỉ còn 1 giờ nữa. Khi click, user thấy modal lỗi ngay vì điều kiện hủy là `diffHours > 24`. Người dùng bị nhầm lẫn khi thấy nút nhưng không thể thực hiện.  
**Fix:** Đổi thành `const canCancel = diffHours > 24;` để nút chỉ hiển thị khi thực sự có thể hủy.

---

## 📋 TỔNG KẾT

| Mức độ | Số lỗi | Lỗi |
|--------|--------|-----|
| 🔴 Cao (Critical) | 4 | BUG-NEW-04, BUG-016, BUG-014, BUG-012 |
| 🟠 Trung bình (Medium) | 6 | BUG-018, BUG-020, BUG-021, BUG-026, BUG-027, BUG-028, BUG-017 |
| 🟡 Thấp (Low/Quality) | 4 | BUG-NEW-02, BUG-NEW-03, BUG-NEW-05, BUG-FRONTEND-01 |
| ✅ Đã sửa | 10 | BUG-001, 002, 004, 005, 009, 019, 022, 023, 029, NEW-01 |

---

## 🔧 ƯU TIÊN SỬA

1. **[NGAY]** BUG-NEW-04 — Nguy cơ mất dữ liệu đơn thuốc (dùng transaction)
2. **[NGAY]** BUG-NEW-03 — Connection pool rò rỉ (import shared Prisma)
3. **[SỚM]** BUG-016 — Race condition orderCode PayOS
4. **[SỚM]** BUG-028 — Email xác nhận gửi sai thời điểm
5. **[SỚM]** BUG-FRONTEND-01 — Nút hủy lịch gây nhầm lẫn UX
6. **[BÌNH THƯỜNG]** BUG-017, BUG-018, BUG-020, BUG-021 — Logic nghiệp vụ
7. **[KHI CÓ THỜI GIAN]** BUG-NEW-02, BUG-NEW-05, BUG-012, BUG-014, BUG-026, BUG-027