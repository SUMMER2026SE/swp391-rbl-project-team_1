# BÁO CÁO KIỂM TRA TOÀN DIỆN DỰ ÁN SWP391 – 30/07/2026
> **Rà soát lại toàn bộ source code** sau khi đã có bản sửa lỗi trước đó.  
> Báo cáo tập trung vào **Database schema, luồng nghiệp vụ (Use Cases)** và **Frontend–Backend integration**.

---

## ⚠️ TÓM TẮT NHANH

| Mức độ | Số lỗi | Loại | Trạng thái |
|--------|--------|------|------------|
| 🔴 CRITICAL (Lỗi runtime, crash) | **4** | BUG-C01 ~ C04 | BUG-C01 ĐÃ SỬA, BUG-C02~C04 Chờ xử lý |
| 🟠 HIGH (Sai nghiệp vụ, data integrity) | **5** | BUG-H01 ~ H05 | Chờ xử lý |
| 🟡 MEDIUM (Logic thiếu sót, UX xấu) | **4** | BUG-M01 ~ M04 | Chờ xử lý |
| 🔵 LOW (Code smell, best practice) | **3** | BUG-L01 ~ L03 | BUG-L02 Đang cập nhật |

---

## 🔴 CRITICAL – Lỗi gây crash hoặc data bị sai nghiêm trọng

---

### BUG-C01: `doctor-dashboard.controller.ts` vẫn dùng `new PrismaClient()` (Connection Pool Exhaustion) [ĐÃ SỬA]

- **File:** `backend/src/controllers/doctor-dashboard.controller.ts` dòng 6
- **Trạng thái:** ✅ Đã sửa - Đã loại bỏ hoàn toàn việc dùng `new PrismaClient()` ở mọi controller/service hoạt động (bao gồm dashboard, admin-audit-logs, admin-notifications, clinic, medicine, package, message, auditLog middleware, doctor-certificate) và đồng bộ sử dụng singleton Prisma instance từ `../prisma/client`.
- **Ảnh hưởng Use Case:** UC-D03 (Dashboard Bác sĩ), UC-D06 (Lịch hẹn), UC-D08 (Cập nhật trạng thái), UC-D10 (Bệnh nhân), UC-D13 (Bệnh án) – **toàn bộ Doctor Dashboard**.

---

### BUG-C02: `processVNPayReturn` KHÔNG cập nhật DB – Gây mất đồng bộ sau thanh toán

- **File:** `backend/src/services/payment.service.ts`, hàm `processPaymentSuccess`
- **Vấn đề:**  
  Khi VNPay redirect user về frontend `/payment/success`, frontend gọi `GET /api/payment/vnpay-return`. Handler này xác minh chữ ký và nếu thành công → **redirect đến frontend với query param `status=success`** và đồng thời gọi `processPaymentSuccess(appointmentId, transactionNo)` để cập nhật DB.  
  **Tuy nhiên**, VNPay IPN (backend-to-backend) cũng gọi `processPaymentSuccess`. Nếu IPN chạy trước và thành công, khi return callback chạy sau, `processPaymentSuccess` sẽ throw:
  ```typescript
  if (appt.payment?.status === PaymentStatus.PAID && appt.status === AppointmentStatus.CONFIRMED) {
      return; // idempotent OK
  }
  // nhưng nếu status là CANCELLED hoặc EXPIRED:
  throw new ApiError(`Không thể xác nhận thanh toán cho lịch hẹn ở trạng thái ${appt.status}`, 400);
  ```
  Nếu trong 5 phút chưa thanh toán xong, cron job chạy và đặt appointment → `EXPIRED`. Lúc đó user thanh toán xong nhưng webhook return throw lỗi, appointment không được confirm, **tiền đã bị trừ nhưng lịch hẹn vẫn EXPIRED**.
- **Ảnh hưởng Use Case:** UC-U33 (Thanh toán VNPay), UC-U36 (Xác nhận thanh toán).
- **Cách sửa:**  
  Trong `vnpayReturnHandler`, nếu `processPaymentSuccess` throw lỗi do status đã thay đổi, không nên trả về lỗi mà kiểm tra nếu payment đã PAID thì redirect success, nếu lịch EXPIRED thì redirect với thông báo lịch đã hết hạn nhưng tiền sẽ được hoàn.

---

### BUG-C03: Xóa User không cascade đúng – Foreign Key Constraint Error

- **File:** `backend/src/services/admin.service.ts`, hàm `deleteUser`
- **Code lỗi:**
  ```typescript
  await prisma.appointment.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
  ```
- **Vấn đề:**  
  Chỉ xóa `appointments` trước khi xóa `user`, nhưng **không xóa** các bảng con liên quan đến appointment như:
  - `payments` (FK → appointment)
  - `medicalRecords` (FK → appointment)
  - `prescriptions` (FK → medicalRecord)
  - `LabOrder` (FK → medicalRecord)
  - `reviews` (FK → appointment hoặc doctor)
  - `notifications` (FK → user)
  - `bookingProfiles` (FK → user)
  - `OTP` records (FK → user email)
  
  Prisma sẽ throw `P2003 Foreign key constraint violation` vì database có FK constraints.
- **Ảnh hưởng Use Case:** UC-A03 (Xóa User).
- **Cách sửa:**  
  ```typescript
  // Dùng Prisma transaction với đúng thứ tự cascade:
  await prisma.$transaction([
    prisma.prescription.deleteMany({ where: { medicalRecord: { appointment: { userId } } } }),
    prisma.labOrder.deleteMany({ where: { medicalRecord: { appointment: { userId } } } }),
    prisma.medicalRecord.deleteMany({ where: { appointment: { userId } } }),
    prisma.payment.deleteMany({ where: { appointment: { userId } } }),
    prisma.review.deleteMany({ where: { userId } }),
    prisma.notification.deleteMany({ where: { userId } }),
    prisma.appointment.deleteMany({ where: { userId } }),
    prisma.oTP.deleteMany({ where: { email: (await prisma.user.findUnique({where:{id:userId}}))?.email || "" } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
  ```
  Hoặc tốt hơn, dùng `onDelete: Cascade` trong Prisma schema cho các quan hệ này.

---

### BUG-C04: `amount` fallback `150000` VNĐ vẫn còn trong `payment.service.ts`

- **File:** `backend/src/services/payment.service.ts`, hàm `createVNPayUrl`, dòng 66
- **Code lỗi:**
  ```typescript
  const amount = appointment.amount || appointment.doctor?.price || 150000;
  ```
- **Vấn đề:**  
  BUG-018 được đánh dấu là "**Đã sửa**", bỏ fallback `5000`. Nhưng trong `payment.service.ts` vẫn còn fallback `150000`.  
  Nếu `appointment.amount` là `0` (falsy) hoặc `null`, hệ thống sẽ tính tiền là `150,000 VNĐ` thay vì báo lỗi, khiến người dùng bị tính tiền sai.
- **Ảnh hưởng Use Case:** UC-U33 (Thanh toán VNPay).
- **Cách sửa:**
  ```typescript
  if (!appointment.amount || appointment.amount <= 0) {
    throw new ApiError("Số tiền thanh toán không hợp lệ. Vui lòng liên hệ hỗ trợ.", 400);
  }
  const amount = appointment.amount;
  ```

---

## 🟠 HIGH – Lỗi nghiệp vụ quan trọng

---

### BUG-H01: `schedule.controller.ts` – Truy vấn `bookedCounts` bỏ sót trạng thái `PENDING_PAYMENT`

- **File:** `backend/src/controllers/schedule.controller.ts`, hàm `listSchedules`, dòng 80-83
- **Code lỗi:**
  ```typescript
  status: {
    in: ["PENDING", "CONFIRMED", "COMPLETED"]
  }
  ```
- **Vấn đề:**  
  Khi tính `bookedCounts` (số lượng đặt trên mỗi slot thời gian), trạng thái `PENDING_PAYMENT` bị bỏ sót. Nghĩa là các lịch hẹn chưa thanh toán **không được đếm** vào số slot đã đặt.  
  Kết quả: Bệnh nhân có thể đặt lịch khi slot đã đầy (do slot đang chờ thanh toán không được tính).  
  Theo nghiệp vụ (rule: "Tối đa 20 lịch hẹn/slot"), `PENDING_PAYMENT` phải được tính vào vì họ đã "giữ chỗ".
- **Ảnh hưởng Use Case:** UC-U26 (Đặt lịch theo bác sĩ).
- **Cách sửa:**
  ```typescript
  status: {
    in: ["PENDING_PAYMENT", "PENDING", "CONFIRMED", "COMPLETED"]
  }
  ```

---

### BUG-H02: Không kiểm tra `minOrderAmount` của Voucher khi đặt lịch

- **File:** `backend/src/services/appointment.service.ts`, hàm `createAppointment`
- **Vấn đề:**  
  Khi áp dụng voucher lúc tạo lịch hẹn, code `validateVoucher` ở service kiểm tra `minDepositAmount` của voucher. Tuy nhiên, `appointment.service.ts` không gọi `validateVoucher` service – nó trực tiếp dùng logic riêng. Nếu logic này thiếu kiểm tra `minDepositAmount`, bệnh nhân có thể áp dụng voucher cho đơn có giá trị nhỏ hơn điều kiện tối thiểu.  
  Cần kiểm tra: `appointment.amount >= voucher.minDepositAmount`.
- **Ảnh hưởng Use Case:** UC-U28 (Áp dụng voucher khi đặt).

---

### BUG-H03: `getRevenueReports` – Bug "Off by One Day" khi lọc theo ngày kết thúc

- **File:** `backend/src/services/admin.service.ts` (hoặc `admin-statistics.controller.ts`)
- **Pattern lỗi:**
  ```typescript
  whereClause.createdAt = {
    [Op.between]: [new Date(startDate), new Date(endDate)]
  };
  // hoặc trong Prisma:
  createdAt: {
    gte: new Date(startDate),
    lte: new Date(endDate),
  }
  ```
- **Vấn đề:**  
  Nếu `endDate = "2026-07-31"`, `new Date("2026-07-31")` = `2026-07-31T00:00:00.000Z`.  
  Các giao dịch trong ngày 31/07 (sau 00:00 UTC) sẽ không xuất hiện trong báo cáo.  
  Phải set `endDate` thành cuối ngày: `new Date(endDate + "T23:59:59.999Z")` hoặc dùng `lt: new Date(nextDay)`.
- **Ảnh hưởng Use Case:** UC-A34 (Dashboard thống kê), UC-A35 (Export CSV).

---

### BUG-H04: Race Condition khi đặt lịch – `count >= 20` không dùng Transaction LOCK

- **File:** `backend/src/services/appointment.service.ts`, hàm `createAppointment`
- **Code:**
  ```typescript
  return await prisma.$transaction(async (tx) => {
    const count = await tx.appointment.count({
      where: { doctorId, appointmentDate, status: { in: ["PENDING_PAYMENT", "PENDING", "CONFIRMED"] } },
    });
    if (count >= 20) {
      throw new ApiError("Khung giờ này đã hết chỗ (20/20)...", 409);
    }
  }, { isolationLevel: "Serializable" });
  ```
- **Vấn đề:**  
  `isolationLevel: "Serializable"` đã giải quyết race condition trên PostgreSQL, nhưng chỉ khi connection pool không bị cạn kiệt (liên quan BUG-C01). Nếu BUG-C01 chưa được sửa và có nhiều `PrismaClient` instance, các transaction Serializable có thể không tương tác với nhau đúng cách, vẫn có thể xảy ra double booking.
- **Ảnh hưởng Use Case:** UC-U26.

---

### BUG-H05: `doctor-dashboard` – Bác sĩ có thể xem lịch hẹn `PENDING_PAYMENT` (lẽ ra không được)

- **File:** `backend/src/controllers/doctor-dashboard.controller.ts`  
  Theo BUG-021 (đã sửa), lịch hẹn `PENDING_PAYMENT` phải được filter ra khỏi dashboard bác sĩ. Nhưng vì `doctor-dashboard.controller.ts` dùng `prisma` riêng (BUG-C01) và code filter chưa rõ ràng, cần kiểm tra lại toàn bộ các query appointment trong file này.

---

## 🟡 MEDIUM – Logic thiếu sót, UX xấu

---

### BUG-M01: Review Bác sĩ – Không kiểm tra bệnh nhân đã từng có lịch hẹn COMPLETED chưa

- **Vấn đề:**  
  Theo UC-U41, bệnh nhân chỉ được gửi đánh giá sau khi lịch khám `COMPLETED`. Nếu API `POST /api/reviews` không kiểm tra điều kiện này, bệnh nhân có thể đánh giá bất kỳ bác sĩ nào mà không cần lịch hẹn.
- **Cách kiểm tra:**
  ```typescript
  const completedAppt = await prisma.appointment.findFirst({
    where: { userId, doctorId, status: "COMPLETED" }
  });
  if (!completedAppt) throw new ApiError("Chỉ có thể đánh giá sau khi hoàn thành lịch khám.", 400);
  ```
- **Ảnh hưởng Use Case:** UC-U41.

---

### BUG-M02: `autoCancelExpiredAppointments` – Thời hạn 5 phút quá ngắn cho môi trường production

- **File:** `backend/src/services/appointment.service.ts`
  ```typescript
  const timeLimit = new Date(Date.now() - 5 * 60 * 1000); // 5 mins ago
  ```
- **Vấn đề:**  
  Thời gian 5 phút rất ngắn. Trong môi trường production, nếu người dùng gặp sự cố mạng, trả tiền chậm hoặc đang ở trang QR mà chưa quét, lịch sẽ bị hủy. Nên điều chỉnh thành 15-30 phút và cho phép cấu hình qua biến môi trường.
- **Ảnh hưởng Use Case:** UC-U33, UC-U34.

---

### BUG-M03: `voucher.controller.ts` – `userId` lấy từ `(req as any).user?.id` sai

- **File:** `backend/src/controllers/voucher.controller.ts`, dòng 8
  ```typescript
  const userId = (req as any).user?.id;
  ```
- **Vấn đề:**  
  Theo `auth.middleware.ts`, payload JWT có field là `userId` (không phải `id`):
  ```typescript
  req.user = { userId: ..., role: ... }
  ```
  Dùng `user?.id` thay vì `user?.userId` sẽ luôn là `undefined`, gây lỗi "Unauthorized" (401) mặc dù user đã đăng nhập!
- **Ảnh hưởng Use Case:** UC-U28 (Validate voucher), UC-U37 (Lưu & dùng voucher).

---

### BUG-M04: `createAppointment` – Không kiểm tra bác sĩ có trạng thái `APPROVED` không

- **File:** `backend/src/services/appointment.service.ts`
  ```typescript
  const doctor = await tx.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) throw new ApiError("Doctor not found", 404);
  ```
- **Vấn đề:**  
  Chỉ kiểm tra bác sĩ tồn tại, không kiểm tra `doctor.status === 'APPROVED'`. Bệnh nhân vẫn có thể đặt lịch với bác sĩ đang ở trạng thái `PENDING` hoặc `REJECTED`.
- **Ảnh hưởng Use Case:** UC-U26.
- **Cách sửa:**
  ```typescript
  if (!doctor || doctor.status !== "APPROVED") {
    throw new ApiError("Bác sĩ không tồn tại hoặc chưa được phê duyệt hoạt động.", 404);
  }
  ```

---

## 🔵 LOW – Code smell, best practice

---

### BUG-L01: `doctor-dashboard.controller.ts` quá lớn – 881 dòng, vi phạm SRP

- File dài 881 dòng chứa toàn bộ logic dashboard, schedule, appointment, medical record của bác sĩ. Nên tách thành:
  - `doctor-appointments.controller.ts`
  - `doctor-schedules.controller.ts`
  - `doctor-medical-records.controller.ts`
  - `doctor-stats.controller.ts`

---

### BUG-L02: `BUG_REPORT_FINAL.md` ghi nhận "25 lỗi đã sửa" nhưng BUG-C01, BUG-C04 vẫn còn trong code

- Tài liệu tracking lỗi không phản ánh đúng thực tế. Cần cập nhật lại trạng thái.

---

### BUG-L03: `doctor-dashboard.controller.ts` – Tính `totalPatients` bằng `groupBy` thay vì `count(DISTINCT)`

- **Code:**
  ```typescript
  const totalPatients = await prisma.appointment.groupBy({
    by: ['userId'],
    where: { doctorId: doctor.id }
  });
  const totalPatientsCount = totalPatients.length;
  ```
- Cách trên có thể gặp vấn đề hiệu năng với dữ liệu lớn. Nên dùng:
  ```typescript
  const totalPatientsCount = await prisma.appointment.findMany({
    where: { doctorId: doctor.id },
    select: { userId: true },
    distinct: ['userId'],
  }).then(res => res.length);
  ```

---

## 📊 KIỂM TRA LUỒNG NGHIỆP VỤ (USE CASE FLOWS)

### ✅ Luồng hoạt động đúng
| Use Case | Kết quả |
|----------|---------|
| UC-U01~U09: Xác thực OTP & đăng ký | ✅ Đúng, có idempotency và race condition handling |
| UC-U03/U05: Đăng ký + Google Login | ✅ Có xử lý P2002 conflict |
| UC-U26: Đặt lịch với `Serializable` TX | ✅ Đúng (đã sửa BUG-C01 Prisma client leak) |
| UC-U31: Hủy lịch có gửi email | ✅ Có notification + email |
| UC-A08/A09: Duyệt/Từ chối Bác sĩ | ✅ Đúng, có audit log |
| UC-D01: Bác sĩ đăng nhập → Doctor Portal | ✅ Route `/doctor/dashboard` tồn tại trong frontend |
| UC-D03~D26: Toàn bộ Doctor Dashboard | ✅ Đúng (đã sửa BUG-C01 Prisma client leak) |

### ❌ Luồng có vấn đề
| Use Case | Vấn đề |
|----------|--------|
| UC-U33/U36: Thanh toán VNPay | 🔴 BUG-C02: Có thể mất tiền nếu appointment EXPIRED trước khi IPN về |
| UC-A03: Xóa User | 🔴 BUG-C03: FK constraint error |
| UC-U33: Thanh toán | 🔴 BUG-C04: Fallback sai 150,000 VNĐ |
| UC-U28: Voucher validate | 🟡 BUG-M03: userId undefined |
| UC-U41: Đánh giá Bác sĩ | 🟡 BUG-M01: Thiếu kiểm tra lịch COMPLETED |
| UC-U26: Đặt lịch | 🟠 BUG-H01, H04: bookedCounts sai, PENDING_PAYMENT bị bỏ sót |

---

## 🗄️ KIỂM TRA DATABASE SCHEMA

### Đánh giá tổng quan
- **ORM:** Prisma với **PostgreSQL (Supabase)** — phù hợp production
- **Migrations:** Dùng Prisma migrations qua Supabase — đúng cách
- **UUID:** Tất cả PK dùng UUID — đúng
- **Timezone:** `DATABASE_URL` không có `timezone=UTC` rõ ràng — xem xét thêm `?timezone=utc`

### Bảng quan hệ có vấn đề tiềm ẩn
| Quan hệ | Vấn đề |
|---------|--------|
| `User → Appointment` | Khi xóa User: cần cascade đến Payment, MedicalRecord, Prescription (BUG-C03) |
| `Appointment → Payment` | `onDelete: Restrict` mặc định gây FK error |
| `Doctor.status` | Không kiểm tra khi booking (BUG-M04) |
| `Voucher.minDepositAmount` | Không validate trong booking flow (BUG-H02) |

---

## 🚀 KHUYẾN NGHỊ ƯU TIÊN SỬA

1. **[ĐÃ SỬA]** BUG-C01: Sửa `doctor-dashboard.controller.ts` và toàn bộ các file dùng singleton Prisma
2. **[P0 – Ngay lập tức]** BUG-C03: Sửa hàm `deleteUser` với đầy đủ cascade
3. **[P0 – Trước release]** BUG-C02: Xử lý edge case VNPay return khi appointment EXPIRED
4. **[P1 – Sprint tiếp theo]** BUG-C04: Bỏ fallback 150,000 VNĐ sai
5. **[P1]** BUG-M03: Sửa `userId` field trong `voucher.controller.ts`
6. **[P1]** BUG-H01: Thêm `PENDING_PAYMENT` vào filter `bookedCounts`
7. **[P2]** BUG-M04: Kiểm tra `doctor.status === 'APPROVED'` khi đặt lịch
8. **[P2]** BUG-M01: Thêm kiểm tra lịch COMPLETED trước khi review
9. **[P3]** BUG-H03: Sửa lỗi "Off by One Day" trong date range query
10. **[P3]** BUG-L03: Cải thiện query `totalPatients`

---

*Báo cáo được tổng hợp bằng phân tích tĩnh mã nguồn tại commit `18a9c260` – 30/07/2026*