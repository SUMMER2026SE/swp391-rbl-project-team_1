# BÁO CÁO KIỂM TOÁN PHÂN QUYỀN - SWP391 Medical Booking System

> **Ngày kiểm tra:** 2026-07-26  
> **Phương pháp:** Đọc source code thực tế (routes + controllers + middleware)  
> **Kết luận:** Phát hiện **9 lỗi phân quyền** từ mức CRITICAL đến MEDIUM

---

## 🗂️ CƠ CHẾ PHÂN QUYỀN HIỆN TẠI

### Backend Middleware Stack:
| Middleware | Chức năng |
|-----------|-----------|
| `verifyToken` | Xác minh JWT token, inject `req.user` |
| `verifyAdmin` | Kiểm tra `req.user.role === "ADMIN"` |
| `verifyDoctor` | Kiểm tra `req.user.role === "DOCTOR"` |
| `authorizeRoles(...)` | Kiểm tra role linh hoạt với danh sách role cho phép |
| `router.use(...)` | Apply middleware cho toàn bộ router |

---

## 🔴 LỖI CRITICAL — Phải sửa ngay

---

### ❌ LỖI C-01: Medical Records hoàn toàn không có xác thực

**Các route bị ảnh hưởng:**
```
GET  /api/medical-records/appointment/:appointmentId   → getRecordByAppointment  (không middleware)
POST /api/medical-records/appointment/:appointmentId   → saveRecord              (không middleware)
PUT  /api/medical-records/appointment/:appointmentId   → saveRecord              (không middleware)
```

**Hiện trạng code (`medical-record.routes.ts`):**
```typescript
// Comment ghi: "auth handled at server.ts level for doctor routes"
// NHƯNG server.ts chỉ mount: app.use("/api/medical-records", medicalRecordRoutes);
// KHÔNG có verifyToken hay verifyDoctor nào cả!
router.get('/appointment/:appointmentId', getRecordByAppointment);  // ← KHÔNG có middleware!
router.post('/appointment/:appointmentId', saveRecord);              // ← KHÔNG có middleware!
router.put('/appointment/:appointmentId', saveRecord);               // ← KHÔNG có middleware!
```

**Hậu quả:** 
- Bất kỳ ai (kể cả chưa đăng nhập) có thể ĐỌC hồ sơ bệnh án bao gồm chẩn đoán, đơn thuốc
- Bất kỳ ai có thể GHI/SỬA hồ sơ bệnh án mà không cần xác thực
- Đây là vi phạm nghiêm trọng về quyền riêng tư y tế

**✅ Cách sửa (`medical-record.routes.ts`):**
```typescript
import { verifyToken } from '../middleware/auth.middleware';
import { verifyDoctor } from '../middleware/authorization.middleware';

const router = Router();

// Doctor routes — YÊU CẦU DOCTOR role
router.get('/appointment/:appointmentId', verifyToken, verifyDoctor, getRecordByAppointment);
router.post('/appointment/:appointmentId', verifyToken, verifyDoctor, saveRecord);
router.put('/appointment/:appointmentId', verifyToken, verifyDoctor, saveRecord);

// Patient-facing routes — YÊU CẦU đăng nhập
router.get('/my', verifyToken, getMyMedicalRecords);
router.get('/patient/appointment/:appointmentId', verifyToken, getMyRecordByAppointment);
```

**Đồng thời, sửa `saveRecord` controller** để kiểm tra doctor chỉ được ghi record của appointment với mình:
```typescript
// Trong saveRecord, thêm sau khi lấy appointment:
const doctorUser = await prisma.user.findUnique({
  where: { id: (req as any).user?.userId },
  include: { doctor: true }
});
if (!doctorUser?.doctor || appointment.doctorId !== doctorUser.doctor.id) {
  res.status(403).json({ success: false, message: 'Không có quyền tạo hồ sơ cho lịch hẹn này' });
  return;
}
```

---

### ❌ LỖI C-02: Voucher Admin Routes thiếu `verifyAdmin`

**Các route bị ảnh hưởng:**
```
GET    /api/vouchers/admin             → adminListVouchers      (chỉ verifyToken, THIẾU verifyAdmin)
GET    /api/vouchers/admin/chart-data  → adminGetVoucherChartData (chỉ verifyToken)
POST   /api/vouchers/admin             → adminCreateVoucher     (chỉ verifyToken)
PUT    /api/vouchers/admin/:id         → adminUpdateVoucher     (chỉ verifyToken)
DELETE /api/vouchers/admin/:id         → adminDeleteVoucher     (chỉ verifyToken)
GET    /api/vouchers/admin/:id/usages  → adminGetVoucherUsages  (chỉ verifyToken)
```

**Hiện trạng (`voucher.routes.ts`):**
```typescript
// Chỉ có verifyToken, KHÔNG có verifyAdmin!
router.get('/admin', verifyToken, adminListVouchers);
router.post('/admin', verifyToken, adminCreateVoucher);
router.put('/admin/:id', verifyToken, adminUpdateVoucher);
router.delete('/admin/:id', verifyToken, adminDeleteVoucher);
```

**Hậu quả:** Bất kỳ user đã đăng nhập (kể cả bệnh nhân - role USER) đều có thể tạo, sửa, xóa voucher của toàn hệ thống.

**✅ Cách sửa (`voucher.routes.ts`):**
```typescript
import { verifyToken } from '../middleware/auth.middleware';
import { verifyAdmin } from '../middleware/authorization.middleware';

// Admin routes — YÊU CẦU verifyToken + verifyAdmin
router.get('/admin', verifyToken, verifyAdmin, adminListVouchers);
router.get('/admin/chart-data', verifyToken, verifyAdmin, adminGetVoucherChartData);
router.post('/admin', verifyToken, verifyAdmin, adminCreateVoucher);
router.put('/admin/:id', verifyToken, verifyAdmin, adminUpdateVoucher);
router.delete('/admin/:id', verifyToken, verifyAdmin, adminDeleteVoucher);
router.get('/admin/:id/usages', verifyToken, verifyAdmin, adminGetVoucherUsages);
```

---

### ❌ LỖI C-03: Tạo lịch trực bác sĩ không kiểm tra role DOCTOR

**Route bị ảnh hưởng:**
```
POST /api/doctors/:id/schedules  → createSchedule  (chỉ verifyToken)
```

**Hiện trạng (`doctor.routes.ts`):**
```typescript
// THIẾU kiểm tra: người đang đăng nhập có phải bác sĩ đó không?
router.post("/doctors/:id/schedules", verifyToken, createSchedule);
```

**Hậu quả:** Bất kỳ người dùng đã đăng nhập (user bệnh nhân, bác sĩ khác, admin) đều có thể tạo lịch trực cho bất kỳ bác sĩ nào bằng cách POST vào `/api/doctors/:id/schedules`.

**✅ Cách sửa (`doctor.routes.ts`):**
```typescript
import { verifyToken } from '../middleware/auth.middleware';
import { verifyAdmin, verifyDoctor } from '../middleware/authorization.middleware';

// Chỉ cho phép ADMIN hoặc bác sĩ chính chủ tạo lịch
router.post("/doctors/:id/schedules", verifyToken, verifyDoctor, createSchedule);
// Hoặc nếu muốn admin cũng tạo được:
router.post("/doctors/:id/schedules", verifyToken, authorizeRoles(Role.DOCTOR, Role.ADMIN), createSchedule);
```

**Đồng thời, trong controller `createSchedule`**, thêm kiểm tra sở hữu:
```typescript
// Trong createSchedule controller:
const doctorUser = await prisma.user.findUnique({
  where: { id: req.user?.userId },
  include: { doctor: true }
});
const doctorId = req.params.id; // Doctor ID from URL
if (doctorUser?.doctor?.id !== doctorId && req.user?.role !== "ADMIN") {
  throw new ApiError("Bạn không thể tạo lịch trực cho bác sĩ khác", 403);
}
```

---

## 🟠 LỖI HIGH — Nên sửa sớm

---

### ❌ LỖI H-01: `sendMessage` không kiểm tra quyền sở hữu cuộc trò chuyện

**Route:** `POST /api/messages/:conversationId`

**Hiện trạng (`message.controller.ts`):**
```typescript
export async function sendMessage(req: any, res: Response, next: NextFunction): Promise<void> {
    const userId = req.user?.id;
    const conversationId = req.params.conversationId;
    // ...fetch conversation...
    
    // ❌ THIẾU: không kiểm tra xem user/doctor có thuộc cuộc trò chuyện này không!
    // So sánh với getMessages() - có kiểm tra đầy đủ
    
    const message = await prisma.message.create({...});
}
```

Trong khi đó, `getMessages()` (cùng file) đã kiểm tra đúng:
```typescript
if (role === "USER" && conversation.userId !== userId) throw ApiError("Forbidden", 403);
if (role === "DOCTOR") { /* check doctorId */ }
```

**Hậu quả:** Người dùng A (đã đăng nhập) có thể gửi tin nhắn vào cuộc trò chuyện của người dùng B nếu biết `conversationId`.

**✅ Cách sửa - thêm vào `sendMessage`:**
```typescript
export async function sendMessage(req: any, res: Response, next: NextFunction): Promise<void> {
    const userId = req.user?.id || req.user?.userId;
    const role = req.user?.role;
    const conversationId = req.params.conversationId;
    // ...fetch conversation...

    // ✅ THÊM: kiểm tra quyền sở hữu
    if (role === "USER" && conversation.userId !== userId) {
        throw new ApiError("Forbidden", 403);
    }
    if (role === "DOCTOR") {
        const doctorUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { doctor: true }
        });
        if (conversation.doctorId !== doctorUser?.doctor?.id) {
            throw new ApiError("Forbidden", 403);
        }
    }
    // ...rest of the function
}
```

---

### ❌ LỖI H-02: Bác sĩ xem thông tin y tế bệnh nhân chưa từng có lịch hẹn

**Route:** `GET /api/doctor/patients/:userId`

**Hiện trạng (`doctor-dashboard.controller.ts`):**
```typescript
export const getPatientDetail = async (req: AuthenticatedRequest, res: Response) => {
    const doctor = await getDoctor(req.user!.userId);
    const userId = req.params.userId;

    // ❌ Lấy thông tin nhạy cảm (bloodType, allergies, chronicDiseases...) MÀ KHÔNG kiểm tra
    //    xem bệnh nhân này đã từng có lịch hẹn với bác sĩ này chưa!
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { ..., bloodType: true, allergies: true, chronicDiseases: true, personalHistory: true }
    });

    // Chỉ lọc pastAppointments theo doctorId, nhưng user data đã bị lộ rồi
    const pastAppointments = await prisma.appointment.findMany({
        where: { userId, doctorId: doctor.id, status: 'COMPLETED' }
    });
    
    res.json({ user, pastAppointments }); // ❌ trả về user dù pastAppointments rỗng!
};
```

**Hậu quả:** Bác sĩ A có thể xem thông tin sức khỏe nhạy cảm của bất kỳ bệnh nhân nào mà chưa từng khám cho họ, vi phạm quy tắc nghiệp vụ: *"Bác sĩ chỉ xem hồ sơ bệnh nhân có lịch hẹn với mình"*.

**✅ Cách sửa (`doctor-dashboard.controller.ts`):**
```typescript
export const getPatientDetail = async (req: AuthenticatedRequest, res: Response) => {
    const doctor = await getDoctor(req.user!.userId);
    if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

    const userId = req.params.userId as string;

    // ✅ THÊM: Kiểm tra tồn tại lịch hẹn trước khi trả về thông tin
    const hasAppointment = await prisma.appointment.findFirst({
        where: { userId, doctorId: doctor.id }
    });

    if (!hasAppointment) {
        return res.status(403).json({
            message: "Bác sĩ chỉ có quyền xem thông tin bệnh nhân có lịch hẹn với mình."
        });
    }

    const user = await prisma.user.findUnique({...});
    // ...rest of logic
};
```

---

## 🟡 LỖI MEDIUM — Nên xem xét và sửa

---

### ⚠️ LỖI M-01: Chat AI không yêu cầu xác thực

**Route:** `POST /api/chat`  
**File:** `chat.routes.ts`

Theo USE_CASES_SYNTHESIS.md (UC-U45), Chat AI được xếp vào nhóm USE CASES của USER (cần đăng nhập). Nhưng route hiện tại hoàn toàn public.

**✅ Cách sửa (`chat.routes.ts`):**
```typescript
import { verifyToken } from '../middleware/auth.middleware';
router.post('/chat', verifyToken, chat);
```

---

### ⚠️ LỖI M-02: Kiểm tra trạng thái thanh toán là public

**Route:** `GET /api/payment/status/:orderCode`

Endpoint này không yêu cầu đăng nhập và không kiểm tra xem người gọi có quyền xem giao dịch đó không.

**✅ Cách sửa (`payment.routes.ts`):**
```typescript
// Thêm verifyToken — người dùng phải đăng nhập để polling trạng thái
router.get('/status/:orderCode', verifyToken, getPaymentStatusHandler);
```

**Đồng thời, trong controller**, kiểm tra ownership:
```typescript
export async function getPaymentStatusHandler(req: AuthenticatedRequest, ...) {
    const userId = req.user?.userId;
    const orderCode = Number(req.params.orderCode);
    const result = await getPaymentStatusByOrderCode(orderCode);
    
    // ✅ Thêm kiểm tra: user chỉ xem được trạng thái thanh toán của mình
    if (result.userId && result.userId !== userId && req.user?.role !== "ADMIN") {
        throw new ApiError("Không có quyền xem thông tin này", 403);
    }
    res.json(result);
}
```

---

### ⚠️ LỖI M-03: Tài khoản bị khóa vẫn có thể đăng nhập (cần xác minh)

**Theo BUG_REPORT.md (BUG-001):** Model `User` có trường `isLocked: Boolean` nhưng hàm `authenticateUser()` và `googleLogin()` trong `auth.service.ts` chưa kiểm tra giá trị này trước khi tạo JWT.

**Cần xác minh** phiên bản hiện tại có fix này chưa. Nếu chưa, thêm vào `auth.service.ts`:
```typescript
// Trong authenticateUser(), sau khi tìm user:
if (user.isLocked) {
    throw new ApiError("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.", 403);
}
// Tương tự trong googleLogin()
```

---

## ✅ PHẦN ĐÃ ĐÚNG — Phân quyền chính xác

| Luồng | Kết quả |
|-------|---------|
| Tất cả Admin routes (`/api/admin/*`) | ✅ `verifyToken` + `verifyAdmin` trên mọi endpoint |
| Doctor Dashboard routes (`/api/doctor/*`) | ✅ `verifyToken` + `verifyDoctor` qua `router.use()` |
| Booking Profile CRUD | ✅ `verifyToken` qua `router.use()` + kiểm tra ownership trong controller |
| Đặt lịch hẹn | ✅ `verifyToken` + `authorizeRoles(USER, DOCTOR)` + kiểm tra "bác sĩ không tự đặt" |
| Hủy lịch hẹn | ✅ `verifyToken` + kiểm tra `appointment.userId !== userId` |
| Upload biên lai | ✅ `verifyToken` + `authorizeRoles(USER)` + kiểm tra ownership |
| Thanh toán VNPay/PayOS (tạo link) | ✅ `verifyToken` + kiểm tra ownership trong controller |
| Xem lịch hẹn | ✅ Kiểm tra đầy đủ: owner hoặc doctor của appointment hoặc admin |
| Gửi đánh giá | ✅ Kiểm tra: appointment.userId === userId, status === COMPLETED |
| Messaging (get) | ✅ Kiểm tra ownership đầy đủ theo role |
| Video Call (log/history) | ✅ `verifyToken` qua `router.use()` + kiểm tra userId trong controller |
| Notifications | ✅ `verifyToken` qua `router.use()` |
| Doctor Dashboard - Cập nhật lịch hẹn | ✅ Kiểm tra `appointment.doctorId === doctor.id` |
| Doctor Dashboard - Cập nhật lịch trực | ✅ Kiểm tra `schedule.doctorId === doctor.id` |
| Doctor Dashboard - Xem hồ sơ bệnh án | ✅ Kiểm tra bệnh nhân có lịch hẹn với bác sĩ |
| Public routes (xem bác sĩ, phòng khám, bài viết) | ✅ Đúng design — public không cần đăng nhập |
| Xem đơn thuốc công khai (QR) | ✅ Design đúng — cần public để xác minh QR |
| Webhook VNPay/PayOS | ✅ Đúng design — cần public để gateway callback |

---

## 📋 TÓM TẮT ƯU TIÊN SỬA

| Mức độ | Lỗi | Ảnh hưởng | Hành động |
|--------|-----|-----------|-----------|
| 🔴 CRITICAL | C-01: Medical Records không auth | Lộ toàn bộ hồ sơ y tế, ai cũng đọc/ghi được | **Sửa ngay — thêm `verifyToken + verifyDoctor`** |
| 🔴 CRITICAL | C-02: Voucher Admin thiếu `verifyAdmin` | USER thường tạo/xóa/sửa voucher tùy ý | **Sửa ngay — thêm `verifyAdmin`** |
| 🔴 CRITICAL | C-03: Doctor schedule tạo không giới hạn role | User tạo lịch trực cho bác sĩ khác | **Sửa ngay — thêm `verifyDoctor` + ownership check** |
| 🟠 HIGH | H-01: `sendMessage` thiếu ownership check | User gửi tin vào chat của người khác | **Sửa trong sprint tới** |
| 🟠 HIGH | H-02: Doctor xem info bệnh nhân bất kỳ | Vi phạm quyền riêng tư y tế | **Sửa trong sprint tới** |
| 🟡 MEDIUM | M-01: Chat AI public | Không theo đúng USE CASES | Thêm `verifyToken` |
| 🟡 MEDIUM | M-02: Payment status public | Ai cũng xem giao dịch | Thêm `verifyToken` + ownership |
| 🟡 MEDIUM | M-03: `isLocked` check cần xác minh | Tài khoản bị khóa vẫn login được | Xác minh và thêm check |

---

## 🔧 CHECKLIST SỬA THEO FILE

### `backend/src/routes/medical-record.routes.ts`
```typescript
// TRƯỚC (SAI):
router.get('/appointment/:appointmentId', getRecordByAppointment);
router.post('/appointment/:appointmentId', saveRecord);
router.put('/appointment/:appointmentId', saveRecord);

// SAU (ĐÚNG):
router.get('/appointment/:appointmentId', verifyToken, verifyDoctor, getRecordByAppointment);
router.post('/appointment/:appointmentId', verifyToken, verifyDoctor, saveRecord);
router.put('/appointment/:appointmentId', verifyToken, verifyDoctor, saveRecord);
```

### `backend/src/routes/voucher.routes.ts`
```typescript
// TRƯỚC (SAI):
router.get('/admin', verifyToken, adminListVouchers);
router.post('/admin', verifyToken, adminCreateVoucher);
router.put('/admin/:id', verifyToken, adminUpdateVoucher);
router.delete('/admin/:id', verifyToken, adminDeleteVoucher);
router.get('/admin/:id/usages', verifyToken, adminGetVoucherUsages);
router.get('/admin/chart-data', verifyToken, adminGetVoucherChartData);

// SAU (ĐÚNG):
router.get('/admin', verifyToken, verifyAdmin, adminListVouchers);
router.post('/admin', verifyToken, verifyAdmin, adminCreateVoucher);
router.put('/admin/:id', verifyToken, verifyAdmin, adminUpdateVoucher);
router.delete('/admin/:id', verifyToken, verifyAdmin, adminDeleteVoucher);
router.get('/admin/:id/usages', verifyToken, verifyAdmin, adminGetVoucherUsages);
router.get('/admin/chart-data', verifyToken, verifyAdmin, adminGetVoucherChartData);
```

### `backend/src/routes/doctor.routes.ts`
```typescript
// TRƯỚC (SAI):
router.post("/doctors/:id/schedules", verifyToken, createSchedule);

// SAU (ĐÚNG):
router.post("/doctors/:id/schedules", verifyToken, verifyDoctor, createSchedule);
// + Thêm ownership check trong controller createSchedule
```

### `backend/src/controllers/message.controller.ts` → `sendMessage()`
```typescript
// THÊM sau khi lấy conversation:
if (role === "USER" && conversation.userId !== userId) {
    throw new ApiError("Forbidden", 403);
}
if (role === "DOCTOR") {
    const doctorUser = await prisma.user.findUnique({ where: { id: userId }, include: { doctor: true } });
    if (conversation.doctorId !== doctorUser?.doctor?.id) {
        throw new ApiError("Forbidden", 403);
    }
}
```

### `backend/src/controllers/doctor-dashboard.controller.ts` → `getPatientDetail()`
```typescript
// THÊM trước khi query user:
const hasAppointment = await prisma.appointment.findFirst({
    where: { userId, doctorId: doctor.id }
});
if (!hasAppointment) {
    return res.status(403).json({ message: "Bác sĩ chỉ có quyền xem thông tin bệnh nhân có lịch hẹn với mình." });
}
```

### `backend/src/routes/chat.routes.ts`
```typescript
// THÊM verifyToken:
router.post('/chat', verifyToken, chat);
```

---

*Báo cáo tổng hợp từ kiểm tra toàn bộ source code: routes/*.routes.ts, controllers/*.controller.ts, middleware/*.ts, services/*.ts và server.ts*