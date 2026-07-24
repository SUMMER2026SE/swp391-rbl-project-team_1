# BÁO CÁO LỖI & PHÂN TÍCH LOGIC - SWP391 Medical Booking System

> Phân tích dựa trên các file đã đọc: `auth.service.ts`, `appointment.service.ts`, `payment.service.ts`, `payment.controller.ts`, `appointment.controller.ts`, Prisma schema, và các routes.

---

## 📋 MỤC LỤC

1. [Lỗi Bảo Mật Nghiêm Trọng (Critical Security)](#1-lỗi-bảo-mật-nghiêm-trọng)
2. [Lỗi Logic Nghiệp Vụ (Business Logic)](#2-lỗi-logic-nghiệp-vụ)
3. [Lỗi Race Condition / Concurrency](#3-lỗi-race-condition--concurrency)
4. [Lỗi Thanh Toán (Payment Flow)](#4-lỗi-thanh-toán-payment-flow)
5. [Lỗi Thiếu Validation / Guard](#5-lỗi-thiếu-validation--guard)
6. [Lỗi Code / Kỹ Thuật](#6-lỗi-code--kỹ-thuật)
7. [Vấn Đề UX & Thiết Kế](#7-vấn-đề-ux--thiết-kế)
8. [Tóm Tắt Mức Độ Ưu Tiên](#8-tóm-tắt-mức-độ-ưu-tiên)

---

## 1. Lỗi Bảo Mật Nghiêm Trọng

### 🟢 BUG-001: Tài khoản bị khóa (isLocked) vẫn đăng nhập được [ĐÃ SỬA]
**File:** `backend/src/services/auth.service.ts`  
**Hàm:** `authenticateUser()`, `googleLogin()`

**Trạng thái:** ✅ Đã sửa - Đã thêm kiểm tra `isLocked` và ném ra lỗi `ApiError 403` nếu tài khoản bị khóa trong cả đăng nhập thông thường và Google login.

**Mô tả:** Hệ thống có trường `isLocked: Boolean` trong model `User` (Prisma schema), nhưng cả hai hàm đăng nhập đều **không kiểm tra** `user.isLocked` trước khi tạo JWT token.

**Hậu quả:** Admin khóa tài khoản một người dùng nhưng người dùng đó vẫn đăng nhập bình thường được.

```typescript
// auth.service.ts - authenticateUser() - THIẾU KIỂM TRA NÀY:
if (user.isLocked) {
    throw new ApiError("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.", 403);
}

// Cần thêm vào TRƯỚC bước tạo JWT token trong cả authenticateUser() VÀ googleLogin()
```

---

### 🟢 BUG-002: Mock Payment endpoint không có bảo vệ môi trường production [ĐÃ SỬA]
**File:** `backend/src/controllers/payment.controller.ts`  
**Route:** `POST /api/payment/mock-pay`

**Trạng thái:** ✅ Đã sửa - Đã thêm guard kiểm tra môi trường `NODE_ENV === "production"` và chặn mock payment ở môi trường này.

**Mô tả:** Endpoint `mockPayHandler` cho phép bỏ qua toàn bộ quy trình thanh toán. Nếu endpoint này được deploy lên production, bất kỳ user nào cũng có thể "thanh toán" miễn phí.

**Hậu quả:** Gian lận thanh toán. Không mất tiền mà vẫn có lịch hẹn CONFIRMED.

```typescript
// Cần thêm guard:
if (process.env.NODE_ENV === 'production') {
    throw new ApiError("Endpoint này chỉ dùng cho môi trường development", 403);
}
```

---

### 🟢 BUG-003: Hardcoded VNPay credentials trong source code [ĐÃ SỬA]
**File:** `backend/src/services/payment.service.ts`  
**Lines:** 63-66

**Trạng thái:** ✅ Đã sửa - Đã loại bỏ các giá trị fallback hardcode. Hệ thống sẽ ném ra lỗi cấu hình `ApiError 500` nếu các biến VNPay trong env không được cài đặt.

**Mô tả:** Secret key và TMN code của VNPay được hardcode trực tiếp vào code:
```typescript
const tmnCode = process.env.VNP_TMNCODE || "2QXUIBJZ";
const secretKey = process.env.VNP_HASHSECRET || "GETPNO2UY8Z239634TDUO2B86E88U11Y";
```

**Hậu quả:** Nếu không set env variable, ứng dụng vẫn chạy nhưng dùng credentials sandbox có thể bị lộ khi push lên GitHub. Credentials bị lộ trong repository.

**Fix:** Throw error nếu biến môi trường không được set, như đã làm với `JWT_SECRET`.

---

### 🟢 BUG-004: Thiếu kiểm tra quyền sở hữu trong createPayOSPaymentUrlHandler [ĐÃ SỬA]
**File:** `backend/src/controllers/payment.controller.ts`  
**Hàm:** `createPayOSPaymentUrlHandler()`

**Trạng thái:** ✅ Đã sửa - Đã thêm kiểm tra quyền sở hữu lịch hẹn (appointment ownership) trong `createPayOSPaymentUrlHandler`. Chỉ chủ nhân lịch hẹn hoặc Admin mới được tạo link thanh toán PayOS.

**Mô tả:** Hàm `createVNPayUrl` có kiểm tra `appointment.userId !== userId`, nhưng `createPayOSPaymentUrlHandler` **không kiểm tra** xem appointment có thuộc về user đang đăng nhập không.

```typescript
// VNPay handler có check này (đúng):
if (appointment.userId !== userId && req.user?.role !== "ADMIN") {
    throw new ApiError("Bạn không có quyền...", 403);
}

// PayOS handler KHÔNG có check này (lỗi):
const result = await createPayOSPaymentLink(appointmentId, ...); // Thiếu ownership check
```

**Hậu quả:** User A có thể tạo PayOS payment link cho appointment của User B.

---

## 2. Lỗi Logic Nghiệp Vụ

### 🟢 BUG-005: VNPay Return URL xử lý payment thành công không idempotent [ĐÃ SỬA]
**File:** `backend/src/controllers/payment.controller.ts` & `backend/src/services/payment.service.ts`

**Trạng thái:** ✅ Đã sửa - Đã áp dụng 3 lớp bảo vệ:
1. `processPaymentSuccess()` và `processPaymentFailed()` được bọc trong `prisma.$transaction` với `isolationLevel: "Serializable"` — đảm bảo chỉ một request được thực thi đồng thời.
2. Cả hai hàm kiểm tra trạng thái hiện tại (idempotency check) trước khi thực hiện bất kỳ UPDATE nào.
3. `vnpayReturnHandler` bọc lệnh gọi bên trong `try/catch` riêng — nếu `processPaymentSuccess` ném lỗi (lịch hẹn đã hết hạn, bị hủy...), người dùng được redirect về frontend kèm thông báo lỗi thay vì nhận trang lỗi 500 của backend.

**Mô tả gốc:** VNPay gửi kết quả qua 2 kênh song song — IPN (server-to-server) và Return URL (browser redirect). Khi cả 2 kênh đều tới cùng lúc, `processPaymentSuccess` bị gọi 2 lần. `vnpayReturnHandler` không có idempotency guard.

---

### 🟢 BUG-006: processPaymentSuccess không kiểm tra trạng thái hiện tại [ĐÃ SỬA]
**File:** `backend/src/services/payment.service.ts`  
**Hàm:** `processPaymentSuccess()`

**Trạng thái:** ✅ Đã sửa — Hàm giờ đọc trạng thái appointment/payment trong transaction Serializable và bỏ qua (return sớm) nếu đã `PAID+CONFIRMED`, ném lỗi 400 nếu appointment không ở trạng thái `PENDING_PAYMENT`.

---

### 🟢 BUG-007: processPaymentFailed không có idempotency check [ĐÃ SỬA]
**File:** `backend/src/services/payment.service.ts`  
**Hàm:** `processPaymentFailed()`

**Trạng thái:** ✅ Đã sửa — Hàm kiểm tra trạng thái trong transaction Serializable. Nếu payment đã `PAID` hoặc appointment đã `CONFIRMED`, hàm trả về sớm mà không revert. Nếu appointment đã `CANCELLED`/`EXPIRED`, hàm cũng không reset về `PENDING_PAYMENT`.

---

### 🟢 BUG-008: Hai cơ chế hủy lịch hẹn mâu thuẫn nhau về trạng thái [ĐÃ SỬA]
**File:** `backend/src/services/appointment.service.ts` & `backend/src/services/payment.service.ts`

**Trạng thái:** ✅ Đã sửa - Đã thống nhất trạng thái hủy tự động về `"EXPIRED"` cho cả hai cơ chế.

**Mô tả:** 
- `autoCancelExpiredAppointments()` (appointment.service.ts) → set status = `"EXPIRED"`
- `cancelExpiredPayOSPayments()` (payment.service.ts) → set status = `"EXPIRED"`

Cùng là "appointment hết hạn thanh toán" nhưng một nơi set EXPIRED, một nơi set CANCELLED.

**Hậu quả:** Không nhất quán trong dữ liệu. Frontend khó xử lý hiển thị đúng.

```typescript
// appointment.service.ts:
data: { status: "EXPIRED", cancellationReason: "Hủy tự động do quá hạn 5 phút..." }

// payment.service.ts:
data: { status: "EXPIRED", cancellationReason: "Quá hạn thanh toán PayOS" }
```

---

### 🟢 BUG-009: Mock Payment không kiểm tra trạng thái appointment [ĐÃ SỬA]
**File:** `backend/src/controllers/payment.controller.ts`  
**Hàm:** `mockPayHandler()`

**Trạng thái:** ✅ Đã sửa - Đã thêm kiểm tra `appointment.status !== "PENDING_PAYMENT"` trong `mockPayHandler`. Nếu lịch hẹn đã CANCELLED, EXPIRED, hoặc đã CONFIRMED, API sẽ trả về lỗi 400.

**Mô tả:** Sau khi tìm appointment, không kiểm tra `appointment.status`. Nếu appointment đang CANCELLED, EXPIRED, hoặc đã CONFIRMED, mock payment vẫn chạy thành công.

```typescript
// Thiếu kiểm tra:
if (appointment.status !== "PENDING_PAYMENT") {
    throw new ApiError("Lịch hẹn không ở trạng thái chờ thanh toán", 400);
}
```

---

### 🟢 BUG-010: createVNPayUrl không kiểm tra trạng thái appointment [ĐÃ SỬA]
**File:** `backend/src/services/payment.service.ts`  
**Hàm:** `createVNPayUrl()`

**Trạng thái:** ✅ Đã sửa - Đã thêm kiểm tra `appointment.status !== "PENDING_PAYMENT"` trong `createVNPayUrl`. Hàm này giờ nhất quán với `createPayOSPaymentLink`.

**Mô tả:** Tương tự BUG-009, hàm tạo VNPay URL không kiểm tra `appointment.status !== "PENDING_PAYMENT"`. Hàm `createPayOSPaymentLink` CÓ kiểm tra này, nhưng `createVNPayUrl` thì KHÔNG.

---

### 🟢 BUG-011: OTP verification window = thời gian sống của OTP (không reset sau verify) [ĐÃ SỬA]
**File:** `backend/src/services/auth.service.ts`  
**Hàm:** `registerUser()`, `resetPassword()`

**Trạng thái:** ✅ Đã sửa - Khi người dùng xác thực OTP thành công (`verifyOtp` và `verifyResetOtp`), `expiresAt` của OTP record sẽ được gia hạn thêm 10 phút để người dùng có đủ thời gian hoàn tất việc đăng ký hoặc đặt lại mật khẩu.

**Mô tả:** Sau khi OTP được verify (`verifyOtp`), trạng thái `verified: true` được đặt nhưng `expiresAt` không được reset/gia hạn. Khi user gọi `registerUser`, hệ thống check:
```typescript
expiresAt: { gt: new Date() } // OTP must not be expired
```
Nếu user verify OTP vào phút thứ 4, họ chỉ còn 1 phút để hoàn tất đặt mật khẩu. Nếu chậm 1 phút, OTP hết hạn dù đã verify thành công.

---

### 🟡 BUG-012: VNPay IPN amount validation dùng fallback sai
**File:** `backend/src/controllers/payment.controller.ts`  
**Hàm:** `vnpayIpnHandler()`

**Mô tả:**
```typescript
const expectedAmount = appointment.payment?.amount || 150000;
```
Nếu payment record chưa được tạo (timing issue), `expectedAmount` fallback thành 150,000. Nhưng trong `createVNPayUrl`, amount được lấy từ `appointment.doctor?.price || 150000`. Nếu bác sĩ có giá khác 150,000, comparison sẽ fail ngay cả với giao dịch hợp lệ.

---

## 3. Lỗi Race Condition / Concurrency

### 🟢 BUG-013: Race condition khi kiểm tra slot bác sĩ [ĐÃ SỬA]
**File:** `backend/src/services/appointment.service.ts`  
**Hàm:** `createAppointment()`

**Trạng thái:** ✅ Đã sửa - Đã bọc toàn bộ quá trình xác thực slot (đếm số lịch hẹn hiện tại) và tạo lịch hẹn vào một database transaction với isolation level `Serializable` của Prisma để chặn đứng race condition tại database layer.

**Mô tả:** Bước đếm slot và bước tạo appointment KHÔNG trong một database transaction:

```typescript
// Bước 1: Đếm - Nếu count = 19 → cho qua
const count = await prisma.appointment.count({ where: { doctorId, appointmentDate, status: {...} } });
if (count >= 20) throw new ApiError("Hết chỗ", 409);

// === Đây là khoảng thời gian nguy hiểm ===
// Nhiều request cùng lúc đều thấy count=19, đều tạo thành công

// Bước 2: Tạo appointment
const createdAppointment = await prisma.appointment.create({...});
```

**Hậu quả:** 2 user cùng gửi request khi còn 1 slot trống → cả 2 đều tạo được → bác sĩ có 21 lịch hẹn trong cùng khung giờ.

**Fix:** Dùng database-level unique constraint hoặc wrap trong `prisma.$transaction` với isolationLevel `Serializable`, hoặc sử dụng row-level locking.

---

### 🟠 BUG-014: Race condition khi tạo user từ OTP
**File:** `backend/src/services/auth.service.ts`  
**Hàm:** `registerUser()`

**Mô tả:** Kiểm tra email tồn tại và tạo user KHÔNG trong transaction:
```typescript
// Check email - không có lock
const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
if (existingUser) throw new ApiError("Email already registered", 409);

// Khoảng hở ở đây

await prisma.user.create({...}); // Có thể throw unique constraint error
```

**Hậu quả:** Trong trường hợp cực hiếm (tấn công cố ý), có thể tạo hai user cùng email nếu DB không có unique constraint. Nếu có unique constraint, lỗi P2002 sẽ không được handle đẹp.

**Fix:** Dùng `prisma.user.upsert` hoặc catch lỗi P2002 và trả về "Email already registered".

---

### 🟢 BUG-015: Vòng lặp tạo transactionCode/bookingCode không có giới hạn [ĐÃ SỬA]
**File:** `backend/src/services/appointment.service.ts`  
**Hàm:** `createAppointment()`

**Trạng thái:** ✅ Đã sửa - Đã thêm giới hạn số lần thử tối đa `MAX_CODE_RETRIES = 10` vào các vòng lặp sinh mã. Nếu vượt quá giới hạn mà không tạo được mã duy nhất, hệ thống sẽ ném lỗi và dừng lại, tránh gây treo server/đơ ứng dụng.

**Mô tả:** Vòng lặp `while` không có điều kiện thoát tối đa. Trong lý thuyết (khi DB cực kỳ đầy), vòng lặp này có thể chạy mãi mãi. Ngoài ra, mỗi iteration gọi thêm 1 DB query.

**Fix:** Thêm giới hạn retry (ví dụ tối đa 10 lần).

---

## 4. Lỗi Thanh Toán (Payment Flow)

### 🟠 BUG-016: PayOS OrderCode có thể bị trùng
**File:** `backend/src/services/payment.service.ts`  
**Hàm:** `createPayOSPaymentLink()`

**Mô tả:**
```typescript
const orderCode = Number(String(Date.now()).slice(-6) + String(Math.floor(Math.random() * 1000)));
```
Lấy 6 chữ số cuối của timestamp + 3 số ngẫu nhiên = 9 chữ số tối đa. Trong điều kiện high traffic, khả năng trùng cao hơn so với UUID.

**Hậu quả:** PayOS sẽ trả về lỗi duplicate orderCode, không tạo được payment link.

**Fix:** Dùng `appointment.id` hoặc kết hợp nhiều yếu tố entropy hơn.

---

### 🟡 BUG-017: Voucher validation chỉ được thực hiện sau khi thanh toán thành công
**File:** `backend/src/services/payment.service.ts`  
**Hàm:** `processPayOSWebhook()`

**Mô tả:** Khi webhook nhận được payment thành công, code mới kiểm tra voucher và tăng `usedCount`. Nhưng không kiểm tra lại xem voucher còn hiệu lực (chưa hết hạn, chưa vượt giới hạn sử dụng) vào thời điểm thanh toán thực sự.

**Hậu quả:** User có thể book nhiều lịch hẹn cùng lúc với 1 voucher (trước khi usedCount được tăng). Nếu max uses = 1, user vẫn dùng được nhiều lần.

---

### 🟡 BUG-018: amount trong appointment.service.ts default là 5,000 VND
**File:** `backend/src/services/appointment.service.ts`  
**Hàm:** `createAppointment()`

**Mô tả:**
```typescript
let amount = 5000; // Default rất thấp
if (doctorId) {
    const doc = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (doc?.price) amount = doc.price;
}
```

Trong khi đó `payment.service.ts` dùng fallback khác:
```typescript
const amount = appointment.doctor?.price || 150000; // 150,000 VND
```

**Hậu quả:** Nếu bác sĩ không có giá, appointment được tạo với `amount = 5,000` nhưng VNPay tính `150,000`. Mâu thuẫn dữ liệu.

---

## 5. Lỗi Thiếu Validation / Guard

### 🟠 BUG-019: uploadPaymentProof không kiểm tra quyền sở hữu
**File:** `backend/src/services/appointment.service.ts`  
**Hàm:** `uploadPaymentProof()`

**Mô tả:** Service `uploadPaymentProof` không nhận `userId` làm tham số và không kiểm tra xem người upload có phải chủ của appointment không. Toàn bộ guard này phụ thuộc 100% vào controller.

**Rủi ro:** Nếu controller quên check, user A có thể upload payment proof cho appointment của user B.

---

### 🟠 BUG-020: getDoctorAppointments không filter theo trạng thái
**File:** `backend/src/services/appointment.service.ts`  
**Hàm:** `getDoctorAppointments()`

**Mô tả:** Hàm trả về TẤT CẢ appointment của bác sĩ, bao gồm cả PENDING_PAYMENT, EXPIRED, CANCELLED. Điều này gây nhiễu cho bác sĩ khi xem danh sách lịch hẹn.

**Fix:** Mặc định filter các trạng thái có nghĩa: `["PENDING", "CONFIRMED"]`.

---

### 🟡 BUG-021: getAppointmentsByUser trả về cả PENDING_PAYMENT appointments
**File:** `backend/src/services/appointment.service.ts`

**Mô tả:** Tương tự BUG-020, user nhìn thấy các lịch hẹn ở trạng thái PENDING_PAYMENT đã hết hạn (trước khi cron job xóa). Giao diện có thể hiển thị lịch hẹn "đang chờ thanh toán" dù thực tế đã hết hạn.

---

### 🟡 BUG-022: getPaymentStatusHandler không validate orderCode hợp lệ
**File:** `backend/src/controllers/payment.controller.ts`

**Mô tả:**
```typescript
const orderCode = Number(req.params.orderCode);
if (!orderCode) { // NaN, 0 đều bị catch
    res.status(200).json({ status: "PENDING", appointmentId: null });
    return;
}
```

Nếu `orderCode` là string không phải số, `Number("abc") = NaN`, và `!NaN = true`, nên hàm trả về PENDING thay vì 400 Bad Request. Điều này che giấu lỗi từ phía client.

---

## 6. Lỗi Code / Kỹ Thuật

### 🟡 BUG-023: AuthTokenPayload có 2 trường userId và id gây nhầm lẫn
**File:** `backend/src/services/auth.service.ts`

```typescript
export interface AuthTokenPayload {
    userId: string;
    id?: string;    // Trường này không được dùng khi tạo token, tại sao có?
    role: Role;
    iat?: number;
    exp?: number;
}
```

Trường `id` optional gây nhầm lẫn. Khi decode token, một số middleware có thể check `payload.id` thay vì `payload.userId`.

---

### 🟢 BUG-024: saveFileLocally dùng hardcoded localhost URL [ĐÃ SỬA]
**File:** `backend/src/services/appointment.service.ts`

**Trạng thái:** ✅ Đã sửa - Đã thay thế localhost hardcode bằng biến môi trường `BACKEND_URL` (cấu hình trong `.env`, fallback về localhost).

```typescript
const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
return `${backendUrl}/public/payment-proofs/appointment-${appointmentId}/${baseName}`;
```

URL được lưu vào DB là `http://localhost:...`. Nếu server chạy trên domain khác, URL này không truy cập được từ client.

---

### 🟡 BUG-025: Hai lần fetch doctor data trong createAppointment
**File:** `backend/src/services/appointment.service.ts`

```typescript
// Lần 1: Kiểm tra doctor tồn tại
const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });

// ... code khác ...

// Lần 2: Lấy giá doctor để tính amount
const doc = await prisma.doctor.findUnique({ where: { id: doctorId } });
if (doc?.price) amount = doc.price;
```

Cùng một doctor bị query 2 lần trong cùng một function. Dùng lại kết quả từ lần 1 là đủ.

---

### 🟡 BUG-026: autoCancelExpiredAppointments không gửi notification
**File:** `backend/src/services/appointment.service.ts`

**Mô tả:** Khi cron job hủy appointments hết hạn, không có:
- Email thông báo tới user
- Socket notification tới user
- Notification trong DB

User không biết lịch hẹn của mình đã bị hủy cho đến khi vào xem lại.

So sánh: `cancelExpiredPayOSPayments` trong `payment.service.ts` CÓ gửi socket notification (đúng hướng), nhưng `autoCancelExpiredAppointments` thì KHÔNG.

---

## 7. Vấn Đề UX & Thiết Kế

### 🟡 BUG-027: Cùng loại lịch hẹn nhưng 2 cơ chế expire song song
**Mô tả:** Hệ thống có 2 cơ chế khác nhau để cancel lịch hẹn hết hạn:
1. `autoCancelExpiredAppointments()` - xét theo `appointment.createdAt` + 5 phút
2. `cancelExpiredPayOSPayments()` - xét theo `payment.expiredAt`

Với PayOS, cả 2 đều có thể chạy → appointment bị update 2 lần.

---

### 🟡 BUG-028: Email xác nhận được gửi khi upload payment proof (chưa được xác nhận)
**File:** `backend/src/services/appointment.service.ts`  
**Hàm:** `uploadPaymentProof()`

**Mô tả:** Sau khi user upload bằng chứng thanh toán (chuyển khoản thủ công), email xác nhận đặt lịch được gửi ngay với `status: "PENDING"`. Nhưng lúc này admin chưa xác nhận payment. Email có thể gây hiểu nhầm.

---

## 8. Tóm Tắt Mức Độ Ưu Tiên

| Mức Độ | Số Lỗi | Danh Sách |
|--------|--------|-----------|
| 🔴 Critical | 4 | BUG-001, BUG-002, BUG-003, BUG-013 |
| 🟠 High | 12 | BUG-004~012, BUG-014, BUG-016, BUG-019~020 |
| 🟡 Medium | 12 | BUG-015, BUG-017~018, BUG-021~028 |

---

## Đề Xuất Sửa Theo Thứ Tự Ưu Tiên

### Sửa ngay (Critical):
1. **BUG-001** - Thêm `if (user.isLocked) throw new ApiError(...)` vào `authenticateUser` và `googleLogin`
2. **BUG-002** - Thêm `NODE_ENV !== 'production'` guard vào mock payment endpoint
3. **BUG-003** - Throw error nếu VNPay env vars không được set
4. **BUG-013** - Wrap slot check + appointment create vào `prisma.$transaction` với serializable isolation

### Sửa sớm (High):
5. **BUG-004** - Thêm ownership check vào `createPayOSPaymentUrlHandler`
6. **BUG-005** - Thêm idempotency check vào `vnpayReturnHandler` 
7. **BUG-008** - Thống nhất trạng thái EXPIRED cho cả 2 cơ chế cancel
8. **BUG-009/010** - Thêm kiểm tra `appointment.status === "PENDING_PAYMENT"` vào mock pay và VNPay URL creation

### Kế hoạch (Medium):
9. **BUG-011** - Gia hạn OTP expiresAt sau khi verify thành công
10. **BUG-017** - Validate voucher lại tại thời điểm checkout (atomic check-and-use)
11. **BUG-018** - Thống nhất default amount (5,000 vs 150,000)
12. **BUG-024** - Dùng environment variable cho public URL của file upload
13. **BUG-026** - Thêm notification khi cron job hủy appointment

---

*Báo cáo tạo bởi phân tích code tĩnh - ngày 24/07/2026*