# BÁO CÁO CÁC LỖI ĐÃ PHÁT HIỆN VÀ KHẮC PHỤC

Báo cáo này liệt kê danh sách lỗi được tìm thấy trong hệ thống đặt lịch phòng khám (bao gồm Backend và Frontend) sau khi rà soát mã nguồn.

---

## 📋 TỔNG KẾT TRẠNG THÁI LỖI

| Mức độ | Số lỗi | Danh sách lỗi | Trạng thái |
|--------|--------|---------------|------------|
| ✅ Đã sửa | **25** | BUG-001, BUG-002, BUG-004, BUG-005, BUG-009, BUG-012, BUG-014, BUG-016, BUG-017, BUG-018, BUG-019, BUG-020, BUG-021, BUG-022, BUG-023, BUG-026, BUG-027, BUG-028, BUG-029, BUG-NEW-01, BUG-NEW-02, BUG-NEW-03, BUG-NEW-04, BUG-NEW-05, BUG-FRONTEND-01 | Đã giải quyết triệt để |
| 🟠 Medium (Chưa sửa) | **0** | Không còn lỗi nào | Đã giải quyết triệt để |
| 🟡 Low/Quality (Chưa sửa) | **0** | Không còn lỗi nào | Đã giải quyết triệt để |

**Tổng: 25 lỗi tìm thấy — 25 đã sửa — 0 còn tồn tại**

---

## ❌ LỖI CÒN TỒN TẠI (Chưa sửa)

*Hiện tại không còn lỗi nào chưa sửa.*

---

## 📝 CHI TIẾT CÁC SỬA CHỮA ĐÃ THỰC HIỆN

### BUG-021 (getAppointmentsByUser lọc lịch PENDING_PAYMENT cho Doctor/Admin)
- **Mô tả:** Hàm `getAllAppointments` trong `admin.service.ts` và `getDoctorAppointments` trong `doctor-dashboard.controller.ts` lọc bỏ các cuộc hẹn ở trạng thái `PENDING_PAYMENT` để tránh hiển thị trên giao diện của bác sĩ hoặc admin khi người dùng chưa thanh toán xong.
```typescript
// Trong admin.service.ts:
where: {
    status: {
        not: "PENDING_PAYMENT",
    },
}

// Trong doctor-dashboard.controller.ts:
where: { 
    doctorId: doctor.id,
    ...(status ? { status: status as AppointmentStatus } : { status: { not: "PENDING_PAYMENT" as any } })
}
```

### BUG-026 (autoCancelExpiredAppointments gửi email thông báo cho bệnh nhân)
- **Mô tả:** Khi cron job hoặc các tác vụ tự động huỷ lịch quá hạn chạy, hệ thống sẽ thực hiện lấy thông tin bệnh nhân và gửi email thông báo huỷ lịch quá hạn thanh toán.
```typescript
// Lấy danh sách lịch hẹn quá hạn trước khi cập nhật
const expiredAppointments = await prisma.appointment.findMany({
    where: {
        status: "PENDING_PAYMENT",
        createdAt: { lt: expirationLimit }
    },
    include: {
        user: { select: { email: true, fullName: true } },
        doctor: { select: { name: true } }
    }
});

// Cập nhật trạng thái
const result = await prisma.appointment.updateMany({
    where: {
        status: "PENDING_PAYMENT",
        createdAt: { lt: expirationLimit }
    },
    data: { status: "EXPIRED" }
});

// Gửi email thông báo cho từng bệnh nhân
for (const appt of expiredAppointments) {
    if (appt.user?.email) {
        sendBookingStatusUpdateEmail(appt.user.email, {
            patientName: appt.user.fullName || appt.user.email,
            doctorName: appt.doctor?.name || "Bác sĩ",
            specialtyName: "Khám bệnh",
            clinicName: "Phòng khám",
            appointmentDate: appt.appointmentDate,
            status: "EXPIRED",
            cancellationReason: "Hết hạn thanh toán (Quá 15 phút từ lúc đặt lịch)",
            notes: appt.notes
        }).catch(err => console.error("Lỗi gửi mail tự động huỷ lịch:", err));
    }
}
```

### BUG-027 (Đồng bộ hóa cơ chế xử lý hết hạn để tránh xung đột)
- **Mô tả:** Đảm bảo cả hai cơ chế hủy lịch (cron scheduler trong `server.ts` và webhook / check status PayOS trong `payment.service.ts`) đều sử dụng điều kiện `status: "PENDING_PAYMENT"` làm điều kiện kiểm tra trước khi chuyển trạng thái sang `EXPIRED`/`CANCELLED`. Điều này giúp xử lý idempotent, tránh race condition và không kích hoạt lặp lại gửi email cho cùng một cuộc hẹn.

### BUG-NEW-02 (getDoctorAppointmentsController là Dead Code)
- **Mô tả:** Đã được xóa hoàn toàn và thay thế bằng API chuẩn hóa `GET /api/doctor/appointments` trong `doctor-dashboard.controller.ts`.


### BUG-012 (VNPay IPN amount validation)
- **Mô tả:** VNPay IPN amount validation sử dụng amount từ record payment tin cậy trong database thay vì fallback 150000.
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

### BUG-014 (Race condition tạo user từ OTP + Google Login)
- **Mô tả:** Đăng ký OTP và Google login tự động phục hồi và bắt lỗi Prisma P2002 để tránh lỗi 500.
```typescript
// Trong registerUser: Bắt lỗi P2002 và trả về lỗi 409 thân thiện
let user: RegisterResult;
try {
    user = await prisma.user.create({ data: { email, ... } });
} catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ApiError("Email already registered", 409);
    }
    throw err;
}

// Trong googleLogin: race condition → fetch lại user đã tồn tại thay vì lỗi 500
try {
    user = await prisma.user.create({ data: { email, ... } });
} catch (createErr) {
    if (createErr instanceof Prisma.PrismaClientKnownRequestError && createErr.code === "P2002") {
        const raceUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!raceUser) throw new ApiError("Failed to create or retrieve user account", 500);
        user = raceUser; // Graceful fallback: dùng user đã được tạo bởi request kia
    } else {
        throw createErr;
    }
}
```

### BUG-017 (Re-validate voucher khi tạo link checkout)
- **Mô tả:** Trong hàm `createPayOSPaymentLink` của `payment.service.ts`, voucher được tự động kiểm tra lại với `validateVoucher` từ `voucher.service.ts` trước khi sinh link thanh toán PayOS. Điều này ngăn chặn việc áp dụng voucher đã hết hạn hoặc hết lượt dùng.
```typescript
let finalDiscountAmount = discountAmount || 0;
if (voucherCode) {
    const validation = await validateVoucher({
        code: voucherCode,
        userId: appointment.userId,
        depositAmount: baseAmount,
        specialtyId: appointment.doctor?.specialtyId || undefined,
        packageId: appointment.packageId || undefined,
    });

    if (!validation.valid) {
        throw new ApiError(validation.message || "Voucher không hợp lệ hoặc đã hết hạn", 400);
    }
    finalDiscountAmount = validation.discountAmount || 0;
}
```

### BUG-016 (OrderCode race condition trong PayOS)
```typescript
// Trước: Date.now() có thể trùng trong cùng 1ms
const orderCode = Date.now();

// Sau: Thêm component ngẫu nhiên để đảm bảo uniqueness
const orderCode = (Date.now() % 1_000_000_000) * 1000 + Math.floor(Math.random() * 1000);
```

### BUG-018 (Amount fallback không nhất quán)
- `appointment.service.ts`: Bỏ fallback `?? 5000`, thêm kiểm tra bắt buộc amount từ doctor.price.
- `payment.service.ts`: Đồng nhất fallback, ưu tiên `appointment.amount` trước.

### BUG-020 (getDoctorAppointments không filter status)
```typescript
// Trước: Trả về mọi trạng thái
where: { doctorId }

// Sau: Chỉ hiển thị lịch CONFIRMED / DONE / CLINIC_DONE / MEDICAL_RECORD_DONE
where: {
    doctorId,
    status: {
        in: ["CONFIRMED", "DONE", "CLINIC_DONE", "MEDICAL_RECORD_DONE"],
    },
}
```

### BUG-NEW-03 (Prisma connection pool)
```typescript
// Trước:
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Sau:
import prisma from "../prisma/client"; // Dùng shared singleton
```

### BUG-NEW-04 (Non-atomic delete+create)
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

### BUG-NEW-05 (Non-null assertion doctorId!)
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

### BUG-FRONTEND-01 (Nút hủy lịch hẹn)
```typescript
// Trước:
const canCancel = diffHours > 0;  // Sai: hiển thị nút với mọi lịch tương lai

// Sau:
const canCancel = diffHours > 24; // Đúng: chỉ hiển thị khi còn hơn 24h