# TỔNG HỢP USE CASES - HỆ THỐNG ĐẶT LỊCH KHÁM BỆNH SWP391
> **Dự án**: SUMMER2026SE – Team 1  
> **Phân loại theo role**: USER (Bệnh nhân) | ADMIN (Quản trị viên) | DOCTOR (Bác sĩ) | PUBLIC (Công khai)

---

## 👤 USE CASES – USER (Bệnh Nhân)

### 🔐 Xác Thực & Tài Khoản
| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-U01 | Gửi OTP xác thực email | Gửi mã OTP 6 số đến email để xác minh trước khi đăng ký | POST `/api/auth/send-otp` |
| UC-U02 | Xác minh mã OTP | Nhập mã OTP nhận qua email để xác thực tài khoản | POST `/api/auth/verify-otp` |
| UC-U03 | Đăng ký tài khoản | Tạo tài khoản mới bằng email/password sau khi xác minh OTP | POST `/api/auth/register` |
| UC-U04 | Đăng nhập | Đăng nhập bằng email/password, nhận JWT token | POST `/api/auth/login` |
| UC-U05 | Đăng nhập Google | Đăng nhập bằng tài khoản Google (OAuth) | POST `/api/auth/google` |
| UC-U06 | Xem hồ sơ cá nhân | Xem thông tin tài khoản hiện tại | GET `/api/auth/me` |
| UC-U07 | Quên mật khẩu | Yêu cầu gửi OTP reset mật khẩu về email | POST `/api/auth/forgot-password` |
| UC-U08 | Xác minh OTP reset mật khẩu | Nhập OTP nhận qua email để xác nhận reset | POST `/api/auth/verify-reset-otp` |
| UC-U09 | Đặt lại mật khẩu mới | Cập nhật mật khẩu mới sau khi xác minh OTP | POST `/api/auth/reset-password` |
| UC-U10 | Cập nhật hồ sơ cá nhân | Chỉnh sửa thông tin: họ tên, ngày sinh, giới tính, địa chỉ, nhóm máu, dị ứng, tiền sử bệnh | PUT `/api/user/profile` |
| UC-U11 | Đổi mật khẩu | Thay đổi mật khẩu hiện tại | PUT `/api/user/change-password` |
| UC-U12 | Cập nhật ảnh đại diện | Upload avatar mới | PUT `/api/user/avatar` |

### 👥 Quản Lý Hồ Sơ Người Thân (Booking Profile)
| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-U13 | Xem danh sách hồ sơ người thân | Xem các hồ sơ người được khám đã lưu | GET `/api/booking-profiles` |
| UC-U14 | Tạo hồ sơ người thân | Thêm hồ sơ mới (họ tên, ngày sinh, giới tính, SĐT, CCCD, địa chỉ, tiền sử bệnh, dị ứng) | POST `/api/booking-profiles` |
| UC-U15 | Cập nhật hồ sơ người thân | Chỉnh sửa thông tin hồ sơ người thân | PUT `/api/booking-profiles/:id` |
| UC-U16 | Xóa hồ sơ người thân | Xóa hồ sơ không dùng nữa | DELETE `/api/booking-profiles/:id` |

### 🔍 Tìm Kiếm & Khám Phá
| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-U17 | Xem danh sách bác sĩ | Lọc bác sĩ theo chuyên khoa, bệnh viện; xem bác sĩ nổi bật | GET `/api/doctors` |
| UC-U18 | Xem chi tiết bác sĩ | Xem hồ sơ bác sĩ: tên, chuyên khoa, bệnh viện, đánh giá, chứng chỉ | GET `/api/doctors/:id` |
| UC-U19 | Xem danh sách chuyên khoa | Xem tất cả chuyên khoa hiện có | GET `/api/doctors/specialties` |
| UC-U20 | Xem danh sách gói khám | Xem các gói khám sức khỏe: tên, giá, dịch vụ, % cọc | GET `/api/packages` |
| UC-U21 | Xem chi tiết gói khám | Xem đầy đủ thông tin gói: dịch vụ bao gồm, thời gian ước tính, hướng dẫn chuẩn bị, điều khoản hoàn cọc | GET `/api/packages/:id` |
| UC-U22 | Xem lịch trống theo gói | Xem các khung giờ đã đặt của gói khám | GET `/api/packages/:id/booked-slots` |
| UC-U23 | Xem danh sách phòng khám | Xem danh sách bệnh viện/phòng khám | GET `/api/clinics` |
| UC-U24 | Xem lịch khám của bác sĩ | Xem các khung giờ còn trống của bác sĩ | GET `/api/schedules` |
| UC-U25 | Đọc bài viết y tế | Xem bài viết/tin tức sức khỏe | GET `/api/articles` |

### 📅 Đặt Lịch Hẹn
| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-U26 | Đặt lịch hẹn theo bác sĩ | Chọn bác sĩ + ngày giờ + thông tin người khám (SELF/OTHER) – phải cách hiện tại ≥ 2 giờ; giới hạn 20 lịch/slot | POST `/api/appointments` |
| UC-U27 | Đặt lịch hẹn theo gói khám | Chọn gói khám + ngày giờ + thông tin người khám | POST `/api/appointments` |
| UC-U28 | Áp dụng voucher khi đặt | Nhập mã voucher để giảm giá trước khi đặt lịch | POST `/api/vouchers/validate` |
| UC-U29 | Xem danh sách lịch hẹn của mình | Xem tất cả lịch hẹn đã đặt kèm trạng thái, hồ sơ bệnh án, đánh giá | GET `/api/my-appointments` |
| UC-U30 | Xem chi tiết lịch hẹn | Xem đầy đủ thông tin lịch hẹn; hiển thị thông tin ngân hàng nếu đang ở trạng thái `PENDING_PAYMENT` | GET `/api/appointments/:id` |
| UC-U31 | Hủy lịch hẹn | Hủy lịch hẹn kèm lý do; ≥24h trước → hoàn tiền cọc; <24h → mất cọc | POST `/api/appointments/:id/cancel` |

### 💳 Thanh Toán
| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-U32 | Upload biên lai chuyển khoản | Upload ảnh biên lai ngân hàng (BIDV) để xác nhận đã cọc tiền | POST `/api/appointments/:id/pay-proof` |
| UC-U33 | Thanh toán qua VNPay | Tạo link thanh toán VNPay và redirect bệnh nhân | POST `/api/payment/create-url` |
| UC-U34 | Thanh toán qua PayOS | Tạo link thanh toán PayOS (QR code) | POST `/api/payment/payos/create` |
| UC-U35 | Xem trạng thái thanh toán | Kiểm tra trạng thái thanh toán theo OrderCode | GET `/api/payment/status/:orderCode` |
| UC-U36 | Xác nhận thanh toán thành công | Hệ thống auto xử lý sau khi VNPay/PayOS callback | GET `/api/payment/return`, POST `/api/payment/payos/webhook` |
| UC-U37 | Lưu & dùng voucher | Lưu voucher vào tài khoản, xem danh sách voucher đã lưu | POST/GET `/api/vouchers/save`, `/api/vouchers/my` |

### 🏥 Hồ Sơ Bệnh Án & Đơn Thuốc
| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-U38 | Xem tất cả hồ sơ bệnh án | Xem lịch sử khám bệnh (chẩn đoán, đơn thuốc) theo từng lịch hẹn | GET `/api/medical-records/my` |
| UC-U39 | Xem hồ sơ theo lịch hẹn | Xem hồ sơ bệnh án cụ thể của một lần khám | GET `/api/medical-records/appointment/:id` |
| UC-U40 | Xem / In đơn thuốc | Xem đơn thuốc đã kê, in hoặc chia sẻ QR xác minh | GET `/api/appointments/:id` |

### ⭐ Đánh Giá Bác Sĩ
| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-U41 | Gửi đánh giá bác sĩ | Đánh giá (rating + comment) sau khi khám xong | POST `/api/reviews` |
| UC-U42 | Xem đánh giá của mình | Xem lại tất cả đánh giá đã gửi | GET `/api/reviews/my` |

### 💬 Nhắn Tin & Video Call
| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-U43 | Nhắn tin với bác sĩ | Bắt đầu hoặc tiếp tục cuộc hội thoại với bác sĩ | GET/POST `/api/messages` |
| UC-U44 | Tham gia video call | Tham gia phòng khám video với bác sĩ theo appointmentId | WebSocket + `/video-call/:appointmentId` |
| UC-U45 | Chat AI tư vấn | Chat với AI Assistant (Gemini) để hỏi về triệu chứng, gợi ý chuyên khoa, chi phí | POST `/api/chat` |

### 🔔 Thông Báo
| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-U46 | Xem danh sách thông báo | Xem tất cả thông báo in-app | GET `/api/notifications` |
| UC-U47 | Đánh dấu đã đọc | Đánh dấu 1 hoặc tất cả thông báo là đã đọc | PATCH `/api/notifications/:id/read` |
| UC-U48 | Xóa thông báo | Xóa thông báo không cần thiết | DELETE `/api/notifications/:id` |
| UC-U49 | Nhận email thông báo | Nhận email: xác nhận booking, nhắc lịch, thông báo hủy | Tự động |

### 🛠️ Hỗ Trợ
| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-U50 | Gửi khiếu nại | Gửi khiếu nại về chất lượng dịch vụ hoặc sự cố | POST `/api/complaints` |
| UC-U51 | Xem khiếu nại của mình | Theo dõi trạng thái khiếu nại đã gửi | GET `/api/complaints/my` |

---

## 👨‍⚕️ USE CASES – DOCTOR (Bác Sĩ)

### 🔐 Xác Thực
| ID | Use Case | Mô Tả |
|----|----------|--------|
| UC-D01 | Đăng nhập | Đăng nhập với tài khoản DOCTOR role |
| UC-D02 | Xem hồ sơ bác sĩ cá nhân | Xem thông tin: tên, chuyên khoa, bệnh viện, bằng cấp |

### 📊 Dashboard Bác Sĩ
| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-D03 | Xem thống kê tổng quan | Số lịch hẹn hôm nay/tuần/tháng; số ca đã khám/đang chờ/đã hủy; doanh thu; đánh giá TB | GET `/api/doctor/dashboard/stats` |
| UC-D04 | Xem biểu đồ thống kê | Biểu đồ lịch hẹn theo giờ (peak hours), theo ngày/tháng | GET `/api/doctor/dashboard/charts` |
| UC-D05 | Xem thống kê chi tiết | Báo cáo doanh thu, tỷ lệ hoàn thành, số bệnh nhân theo thời gian | GET `/api/doctor/statistics` |

### 📋 Quản Lý Lịch Hẹn
| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-D06 | Xem danh sách lịch hẹn | Xem tất cả lịch hẹn được phân công, sắp xếp theo ngày | GET `/api/doctor/dashboard/appointments` |
| UC-D07 | Xem chi tiết lịch hẹn | Xem đầy đủ thông tin lịch hẹn và thông tin bệnh nhân | GET `/api/appointments/:id` |
| UC-D08 | Cập nhật trạng thái lịch hẹn | Chuyển trạng thái: CONFIRMED → IN_PROGRESS → COMPLETED | PATCH `/api/doctor/dashboard/appointments/:id/status` |
| UC-D09 | Cập nhật bulk lịch hẹn | Cập nhật trạng thái nhiều lịch hẹn cùng lúc | PATCH `/api/doctor/dashboard/appointments/bulk` |

### 👤 Quản Lý Bệnh Nhân
| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-D10 | Xem danh sách bệnh nhân | Xem tất cả bệnh nhân đã/đang có lịch hẹn với mình | GET `/api/doctor/dashboard/patients` |
| UC-D11 | Xem hồ sơ đầy đủ bệnh nhân | Xem: thông tin cá nhân, hồ sơ y tế (nhóm máu, dị ứng, bệnh mãn tính), lịch sử khám, thông tin tài khoản | GET `/api/doctor/dashboard/patients/:id` |
| UC-D12 | Xem hồ sơ bệnh án của bệnh nhân | Xem toàn bộ hồ sơ khám + đơn thuốc từ nhiều lần khám | GET `/api/doctor/dashboard/patients/:id/records` |

### 📝 Khám Bệnh & Hồ Sơ Bệnh Án
| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-D13 | Tạo hồ sơ bệnh án | Nhập: chẩn đoán sơ bộ, chẩn đoán cuối, ghi chú bác sĩ | POST `/api/doctor/dashboard/medical-records` |
| UC-D14 | Kê đơn thuốc | Kê đơn cho bệnh nhân: tên thuốc, liều dùng, tần suất, số ngày, hướng dẫn | POST `/api/doctor/dashboard/prescriptions` |
| UC-D15 | Xem hồ sơ bệnh án theo lịch hẹn | Xem kết quả khám theo appointmentId | GET `/api/medical-records/appointment/:id` |

### 🗓️ Quản Lý Lịch Làm Việc
| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-D16 | Xem lịch làm việc | Xem toàn bộ ca trực theo tuần/tháng | GET `/api/doctor/dashboard/schedules` |
| UC-D17 | Tạo lịch làm việc | Thêm ca trực mới (ngày, giờ bắt đầu/kết thúc) | POST `/api/doctor/dashboard/schedules` |
| UC-D18 | Cập nhật lịch làm việc | Chỉnh sửa thông tin ca trực | PUT `/api/doctor/dashboard/schedules/:id` |
| UC-D19 | Xóa lịch làm việc | Xóa ca trực không còn phù hợp | DELETE `/api/doctor/dashboard/schedules/:id` |

### 👤 Hồ Sơ & Chứng Chỉ
| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-D20 | Cập nhật hồ sơ bác sĩ | Cập nhật thông tin: mô tả, kinh nghiệm, chuyên khoa, bệnh viện | PUT `/api/doctor/dashboard/profile` |
| UC-D21 | Upload ảnh đại diện bác sĩ | Cập nhật ảnh profile bác sĩ | PUT `/api/doctors/:id/avatar` |
| UC-D22 | Quản lý chứng chỉ hành nghề | Upload và quản lý chứng chỉ y khoa | `/api/doctor/certificates` |
| UC-D23 | Xem chuyên khoa & phòng khám khả dụng | Xem danh sách chuyên khoa và bệnh viện có thể gán | GET `/api/doctor/dashboard/available-specialties-clinics` |

### 💬 Giao Tiếp
| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-D24 | Nhắn tin với bệnh nhân | Chat trực tiếp với bệnh nhân qua WebSocket | GET/POST `/api/messages` |
| UC-D25 | Thực hiện video call | Khám bệnh từ xa qua video call theo appointmentId | `/doctor/video-call/:appointmentId` |
| UC-D26 | Xem đánh giá từ bệnh nhân | Xem các đánh giá bệnh nhân đã gửi cho mình | GET `/api/doctor/dashboard/reviews` |

---

## 🛠️ USE CASES – ADMIN (Quản Trị Viên)

### 👥 Quản Lý Người Dùng
| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-A01 | Xem danh sách người dùng | Xem tất cả user trong hệ thống (không có password) | GET `/api/admin/users` |
| UC-A02 | Cập nhật vai trò người dùng | Thay đổi role: USER / DOCTOR / ADMIN | PUT `/api/admin/users/:id` |
| UC-A03 | Xóa người dùng | Xóa user và toàn bộ lịch hẹn liên quan (không thể xóa admin) | DELETE `/api/admin/users/:id` |
| UC-A04 | Khóa / Mở khóa tài khoản | Vô hiệu hóa hoặc kích hoạt lại tài khoản | PATCH `/api/admin/users/:id/lock` |
| UC-A05 | Liên kết bác sĩ với user | Gán Doctor record cho User có role DOCTOR | POST `/api/admin/users/:userId/link-doctor/:doctorId` |

### 👨‍⚕️ Quản Lý Bác Sĩ
| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-A06 | Xem danh sách bác sĩ | Xem tất cả bác sĩ trong hệ thống | GET `/api/admin/doctors` |
| UC-A07 | Xem bác sĩ chờ duyệt | Xem bác sĩ đăng ký nhưng chưa được duyệt | GET `/api/admin/doctors/pending` |
| UC-A08 | Duyệt hồ sơ bác sĩ | Chấp nhận hồ sơ bác sĩ | POST `/api/admin/doctors/:id/approve` |
| UC-A09 | Từ chối hồ sơ bác sĩ | Từ chối với lý do cụ thể | POST `/api/admin/doctors/:id/reject` |
| UC-A10 | Khóa tài khoản bác sĩ | Tạm khóa bác sĩ vi phạm | PATCH `/api/admin/doctors/:id/lock` |
| UC-A11 | Kiểm duyệt nội dung bác sĩ | Moderation thông tin bác sĩ | PATCH `/api/admin/doctors/:id/moderate` |

### 🏥 Quản Lý Chuyên Khoa
| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-A12 | Xem danh sách chuyên khoa | Xem tất cả chuyên khoa kèm số bác sĩ | GET `/api/admin/specialties` |
| UC-A13 | Tạo chuyên khoa mới | Thêm chuyên khoa (tên, mô tả, slug) | POST `/api/admin/specialties` |
| UC-A14 | Cập nhật chuyên khoa | Chỉnh sửa thông tin chuyên khoa | PUT `/api/admin/specialties/:id` |
| UC-A15 | Xóa chuyên khoa | Xóa chuyên khoa (nếu không còn bác sĩ) | DELETE `/api/admin/specialties/:id` |

### 🏨 Quản Lý Phòng Khám / Bệnh Viện
| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-A16 | Xem danh sách phòng khám | Xem tất cả bệnh viện/phòng khám | GET `/api/admin/clinics` |
| UC-A17 | Tạo phòng khám | Thêm bệnh viện mới vào hệ thống | POST `/api/admin/clinics` |
| UC-A18 | Cập nhật phòng khám | Chỉnh sửa thông tin bệnh viện | PUT `/api/admin/clinics/:id` |
| UC-A19 | Xóa phòng khám | Xóa bệnh viện khỏi hệ thống | DELETE `/api/admin/clinics/:id` |

### 📅 Quản Lý Lịch Hẹn (Toàn Hệ Thống)
| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-A20 | Xem tất cả lịch hẹn | Xem toàn bộ lịch hẹn trong hệ thống | GET `/api/admin/appointments` |
| UC-A21 | Cập nhật trạng thái lịch hẹn | Admin thay đổi trạng thái bất kỳ lịch hẹn | PUT `/api/admin/appointments/:id/status` |
| UC-A22 | Xem lịch hẹn chờ duyệt thanh toán | Xem tất cả lịch có biên lai đã upload chờ xác nhận | GET `/api/admin/appointments/pending-approval` |
| UC-A23 | Xem tất cả giao dịch thanh toán | Xem lịch sử thanh toán: PENDING/PAID/REFUNDED/FAILED | GET `/api/admin/payments` |

### 🎟️ Quản Lý Voucher
| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-A24 | Xem danh sách voucher | Xem tất cả voucher trong hệ thống | GET `/api/admin/vouchers` |
| UC-A25 | Tạo voucher | Tạo voucher mới: mã, loại giảm giá, điều kiện áp dụng | POST `/api/admin/vouchers` |
| UC-A26 | Cập nhật voucher | Chỉnh sửa thông tin voucher | PUT `/api/admin/vouchers/:id` |
| UC-A27 | Xóa voucher | Xóa voucher | DELETE `/api/admin/vouchers/:id` |
| UC-A28 | Xem lượt sử dụng voucher | Thống kê ai đã dùng voucher nào | GET `/api/admin/vouchers/:id/usages` |
| UC-A29 | Xem biểu đồ voucher | Thống kê hiệu quả voucher theo thời gian | GET `/api/admin/vouchers/chart` |

### 📰 Quản Lý Bài Viết
| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-A30 | Xem danh sách bài viết | Xem tất cả bài viết y tế | GET `/api/admin/articles` |
| UC-A31 | Tạo bài viết | Đăng bài viết sức khỏe/tin tức | POST `/api/admin/articles` |
| UC-A32 | Cập nhật bài viết | Chỉnh sửa nội dung bài viết | PUT `/api/admin/articles/:id` |
| UC-A33 | Xóa bài viết | Xóa bài viết | DELETE `/api/admin/articles/:id` |

### 📊 Thống Kê & Báo Cáo
| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-A34 | Xem dashboard thống kê | Tổng lịch hẹn, doanh thu, bệnh nhân mới, top bác sĩ; lọc theo ngày/tuần/tháng/quý/năm | GET `/api/admin/statistics` |
| UC-A35 | Export báo cáo CSV | Xuất file CSV dữ liệu thống kê toàn hệ thống | GET `/api/admin/statistics/export` |

### 🗂️ Quản Lý Khiếu Nại
| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-A36 | Xem danh sách khiếu nại | Xem tất cả khiếu nại từ người dùng | GET `/api/admin/complaints` |
| UC-A37 | Giải quyết khiếu nại | Phản hồi và đóng khiếu nại với kết quả xử lý | PATCH `/api/admin/complaints/:id/resolve` |

### 🔔 Thông Báo Admin
| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-A38 | Xem thông báo admin | Xem thông báo trong panel admin | GET `/api/admin/notifications` |
| UC-A39 | Đánh dấu đã đọc | Đánh dấu thông báo admin là đã đọc | PATCH `/api/admin/notifications/:id/read` |

### 📋 Nhật Ký Hành Động (Audit Log)
| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-A40 | Xem audit log | Xem lịch sử tất cả hành động của admin (ai làm gì, lúc nào) | GET `/api/admin/audit-logs` |

---

## 🌐 USE CASES – PUBLIC (Không Cần Đăng Nhập)

| ID | Use Case | Mô Tả | API |
|----|----------|--------|-----|
| UC-PUB01 | Xác minh đơn thuốc qua QR | Tra cứu và xác minh tính hợp lệ của đơn thuốc bằng appointmentId (dùng để quét QR) | GET `/api/appointments/:id/prescription/public` |
| UC-PUB02 | Xem danh sách bác sĩ | Xem và tìm kiếm bác sĩ mà không cần đăng nhập | GET `/api/doctors` |
| UC-PUB03 | Xem danh sách gói khám | Xem gói khám công khai | GET `/api/packages` |
| UC-PUB04 | Xem voucher công khai | Xem các voucher đang có hiệu lực | GET `/api/vouchers/public` |
| UC-PUB05 | Xem bài viết y tế | Đọc bài viết sức khỏe công khai | GET `/api/articles` |
| UC-PUB06 | Xem danh sách phòng khám | Xem thông tin bệnh viện công khai | GET `/api/clinics` |

---

## 📊 TỔNG HỢP

```
┌─────────────────────────────────────────────────────────┐
│                PHÂN LOẠI THEO ROLE                      │
├─────────────┬───────────────────────────────────────────┤
│ ROLE        │ SỐ USE CASES                              │
├─────────────┼───────────────────────────────────────────┤
│ USER        │ 51 UC (UC-U01 → UC-U51)                  │
│ DOCTOR      │ 26 UC (UC-D01 → UC-D26)                  │
│ ADMIN       │ 40 UC (UC-A01 → UC-A40)                  │
│ PUBLIC      │  6 UC (UC-PUB01 → UC-PUB06)              │
├─────────────┼───────────────────────────────────────────┤
│ TỔNG        │ 123 Use Cases                             │
└─────────────┴───────────────────────────────────────────┘
```

---

## 🔄 LUỒNG CHÍNH – QUY TRÌNH ĐẶT LỊCH & KHÁM BỆNH

```
[PUBLIC] Xem bác sĩ / gói khám
    ↓
[USER] Đăng ký / Đăng nhập
    ↓
[USER] Đặt lịch hẹn (chọn bác sĩ/gói + ngày giờ + thông tin người khám)
    → Hệ thống tạo slot với status: PENDING_PAYMENT
    ↓
[USER] Thanh toán (chuyển khoản BIDV / VNPay / PayOS QR)
    → Upload biên lai HOẶC hệ thống nhận webhook tự động
    → Status: PENDING (chờ admin duyệt) hoặc tự động CONFIRMED
    ↓
[ADMIN] Xác nhận biên lai → Status: CONFIRMED
    → Email xác nhận gửi đến USER + DOCTOR
    ↓
[DOCTOR] Thực hiện khám (offline hoặc video call)
    → Tạo Medical Record (chẩn đoán, ghi chú)
    → Kê đơn thuốc
    → Cập nhật Status: COMPLETED
    ↓
[USER] Xem hồ sơ bệnh án + Đơn thuốc
    → Quét QR để xác minh đơn thuốc (PUBLIC)
    ↓
[USER] Đánh giá bác sĩ (tùy chọn)
```

---

## 📋 TRẠNG THÁI HỆ THỐNG

### Appointment Status:
| Status | Mô Tả |
|--------|--------|
| `PENDING_PAYMENT` | Chờ bệnh nhân chuyển khoản / thanh toán |
| `PENDING` | Đã upload biên lai, chờ admin xác nhận |
| `CONFIRMED` | Admin đã xác nhận hoặc webhook thành công |
| `COMPLETED` | Bác sĩ đã hoàn thành khám |
| `CANCELLED` | Đã hủy (bởi bệnh nhân hoặc admin) |
| `EXPIRED` | Tự động hủy sau 5 phút không thanh toán |

### Payment Status:
| Status | Mô Tả |
|--------|--------|
| `PENDING` | Đang chờ xác nhận |
| `PAID` | Đã thanh toán thành công |
| `REFUNDED` | Đã hoàn tiền (hủy trước 24h) |
| `FAILED` | Thanh toán thất bại |

---

## 🔔 CÁC LOẠI EMAIL THÔNG BÁO

| Email | Trigger | Người nhận |
|-------|---------|-----------|
| OTP xác thực đăng ký | User gửi OTP | User |
| OTP reset mật khẩu | User quên mật khẩu | User |
| Xác nhận đặt lịch | Upload biên lai thành công | User |
| Cập nhật trạng thái booking | Admin duyệt/từ chối | User |
| Nhắc lịch khám | Cronjob chạy lúc 8:00 SA | User + Doctor |
| Thông báo bác sĩ có lịch mới | Booking được xác nhận | Doctor |
| Xác nhận hủy lịch | User hủy lịch | User |
| Gửi đơn thuốc | Bác sĩ hoàn thành khám | User |
| Xác minh chứng chỉ bác sĩ | Admin xử lý chứng chỉ | Doctor |

---

## 💳 QUY TẮC NGHIỆP VỤ QUAN TRỌNG

| Quy tắc | Mô Tả |
|---------|--------|
| **Giới hạn đặt lịch** | Phải đặt trước ≥ 2 giờ so với giờ hiện tại |
| **Giới hạn slot** | Tối đa 20 lịch hẹn/slot (cùng bác sĩ, cùng giờ) |
| **Hoàn tiền** | Hủy trước ≥ 24h → hoàn cọc; <24h → mất cọc |
| **Tự hủy** | `PENDING_PAYMENT` quá 5 phút không thanh toán → `EXPIRED` |
| **Phân quyền khám** | Bác sĩ chỉ xem hồ sơ bệnh nhân có lịch hẹn với mình |
| **Không tự đặt** | Bác sĩ không thể đặt lịch khám với chính mình |
| **Xóa admin** | Admin không thể xóa tài khoản của chính mình |
| **Ngân hàng thanh toán** | BIDV – STK: 5624715454 – CTK: NGUYEN DAC DUNG |

---

*Tài liệu tổng hợp từ source code dự án SWP391 – SUMMER2026SE Team 1*  
*Nguồn: `appointment.controller.ts`, `admin.controller.ts`, `doctor-dashboard.controller.ts`, `Tinhnang.docx`, danh sách controller/route files*