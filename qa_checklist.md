# ✅ EduPath — Checklist Test Thủ Công Toàn Bộ Tính Năng

> **Hệ Thống Điều Phối và Cá Nhân Hóa Lộ Trình Học Tập Thích Ứng**
> Manual QA Checklist — dùng trước khi demo / nộp đồ án

---

**Người test:** ____________________  
**Ngày test:** ____________________  
**Môi trường:** ☐ Local &nbsp; ☐ Staging &nbsp; ☐ Production demo  

---

## Mục lục

| # | Tính năng |
|---|-----------|
| 0 | [Hướng dẫn sử dụng checklist](#0-hướng-dẫn-sử-dụng-checklist) |
| 1 | [Khảo sát ban đầu (Onboarding)](#1-khảo-sát-ban-đầu-onboarding) |
| 2 | [Trang Tổng quan](#2-trang-tổng-quan) |
| 3 | [Bảng học tập (Kanban)](#3-bảng-học-tập-kanban) |
| 4 | [Lộ trình cá nhân](#4-lộ-trình-cá-nhân) |
| 5 | [Quản lý kỹ năng](#5-quản-lý-kỹ-năng) |
| 6 | [Focus Pomodoro](#6-focus-pomodoro) |
| 7 | [Thư viện chung](#7-thư-viện-chung) |
| 8 | [Cộng đồng](#8-cộng-đồng) |
| 9 | [Thành tích](#9-thành-tích) |
| 10 | [Bảng xếp hạng](#10-bảng-xếp-hạng) |
| 11 | [Trang Profile](#11-trang-profile) |
| 12 | [Ví của tôi (Demo)](#12-ví-của-tôi-demo) |
| 13 | [Trợ lý Chat AI](#13-trợ-lý-chat-ai) |
| 14 | [Kiểm tra chung toàn hệ thống](#14-kiểm-tra-chung-toàn-hệ-thống) |

---

## 0. Hướng dẫn sử dụng checklist

Mỗi mục dưới đây tương ứng với 1 trang/tính năng trong sidebar EduPath.

> [!IMPORTANT]
> **Test theo đúng thứ tự (1 → 14)** vì một số tính năng phụ thuộc dữ liệu được tạo ra ở bước trước. Ví dụ: phải hoàn tất khảo sát ở Mục 1 trước khi test Mục 2 Tổng quan.

> [!TIP]
> Nên test với **ÍT NHẤT 2 tài khoản** khác nhau:
> - **Tài khoản MỚI** (chưa làm khảo sát)
> - **Tài khoản ĐÃ CÓ dữ liệu** (đã học một thời gian)
>
> Nhiều lỗi chỉ lộ ra ở tài khoản cũ có nhiều dữ liệu.

**Cách đánh giá:**
- Tick vào ô **☐ Đạt** nếu thực hiện đúng bước và kết quả khớp với "Kết quả mong đợi".
- Nếu **KHÔNG đạt**, để trống ô Đạt và ghi rõ vào cột **Ghi chú lỗi** (mô tả ngắn hiện tượng, càng cụ thể càng tốt).

---

## 1. Khảo sát ban đầu (Onboarding)

> Test với 1 tài khoản **HOÀN TOÀN MỚI**, chưa từng làm khảo sát.

### 1.1 — Bước 1 — Chọn kỹ năng

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Đăng ký/đăng nhập tài khoản mới, vào màn hình khảo sát Bước 1/3 | Hiển thị các nhóm kỹ năng: Web Development, Data Science, Mobile Development (và Tiếng Anh/Tiếng Nhật nếu đã triển khai) | ☐ | |
| Chọn 2–3 kỹ năng khác nhóm (ví dụ HTML5 Basics + Python Programming) | Các ô đã chọn hiển thị trạng thái được chọn rõ ràng (đổi màu/tích) | ☐ | |
| Không chọn kỹ năng nào, bấm **Tiếp tục** | Hệ thống chặn lại, báo lỗi yêu cầu chọn ít nhất 1 kỹ năng | ☐ | |
| Chọn xong, bấm **Tiếp tục** | Chuyển sang Bước 2/3, progress bar cập nhật đúng | ☐ | |

### 1.2 — Bước 2 — Mục tiêu học tập

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Nhập mô tả mục tiêu vào ô MÔ TẢ MỤC TIÊU | Text hiển thị đúng khi gõ, không bị giới hạn ký tự bất thường | ☐ | |
| Để trống ô mục tiêu, bấm **Tiếp tục** | Cảnh báo bắt buộc nhập, không cho qua bước 3 | ☐ | |
| Chọn thời gian dự kiến hoàn thành (vd: 3 Tháng) | Dropdown hiển thị đúng các lựa chọn, chọn được | ☐ | |
| Kéo thanh trượt Thời gian tự học mỗi ngày | Số giờ hiển thị cập nhật theo thanh trượt, tổng số giờ dự kiến tính đúng (giờ/ngày × số ngày) | ☐ | |
| Bấm **Quay lại** | Trở về Bước 1, dữ liệu đã chọn ở Bước 1 KHÔNG bị mất | ☐ | |

### 1.3 — Bước 3 — Chọn Mentor (tùy chọn)

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Bấm chọn 1 Mentor trong danh sách | Mentor được chọn có dấu hiệu xác nhận rõ ràng | ☐ | |
| Bấm **"Bỏ qua bước này và hoàn tất khảo sát"** | Vẫn cho phép hoàn tất khảo sát mà không cần chọn Mentor | ☐ | |
| Bấm **"Bắt đầu học tập!"** | Chuyển hướng vào trang Tổng quan, KHÔNG bị treo/loading vô hạn | ☐ | |

---

## 2. Trang Tổng quan

> Test ngay sau khi vừa hoàn tất khảo sát ở Mục 1.

### 2.1 — Khối Mục tiêu của bạn

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Quan sát khối "MỤC TIÊU CỦA BẠN" ngay khi vào trang | Hiển thị ĐẦY ĐỦ nội dung mục tiêu đã nhập ở khảo sát (không có dấu phẩy trống, không thiếu chữ đầu câu) | ☐ | |
| Kiểm tra số giờ/ngày và số tháng hiển thị | Khớp đúng với lựa chọn ở Bước 2 khảo sát | ☐ | |

### 2.2 — Radar chart Hồ sơ năng lực học tập

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Quan sát các trục trên radar chart | Hiển thị ĐÚNG các kỹ năng đã chọn ở khảo sát (KHÔNG hiển thị kỹ năng cố định không liên quan) | ☐ | |
| Đếm số trục hiển thị | Khớp đúng số lượng kỹ năng đã chọn (2–3 kỹ năng → 2–3 trục) | ☐ | |

### 2.3 — Khối Nguy cơ bỏ cuộc / chệch lộ trình

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Quan sát % hiển thị ở khối này với tài khoản mới | Hiển thị % hợp lý (thường thấp với tài khoản chưa học gì), không bị NaN/Undefined/lỗi hiển thị | ☐ | |
| Kiểm tra label trạng thái (An toàn/Cần chú ý/Nguy cơ cao) | Label khớp đúng với khoảng % đang hiển thị | ☐ | |

### 2.4 — Khối Việc quan trọng cần làm

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Quan sát danh sách task hiển thị | Có ÍT NHẤT 1 task được AI sinh ra, KHÔNG trống ("0 Tasks") | ☐ | |
| Kiểm tra task hiển thị có đúng kỹ năng đã chọn không | Task gắn đúng tag kỹ năng nằm trong danh sách đã chọn ở khảo sát | ☐ | |
| Bấm **"Vào bảng Kanban"** | Chuyển đúng tới trang Bảng học tập | ☐ | |

---

## 3. Bảng học tập (Kanban)

### 3.1 — Hiển thị Kanban

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Vào trang Bảng học tập | Hiển thị 3 cột: Cần Làm / Đang Làm / Đã Xong, đúng số lượng task ở mỗi cột | ☐ | |
| Dùng ô Tìm kiếm task với từ khóa có thật trong tiêu đề task | Lọc đúng kết quả, ẩn các task không khớp | ☐ | |
| Lọc theo dropdown **Kỹ năng** | Chỉ hiển thị task thuộc đúng kỹ năng đã chọn lọc | ☐ | |
| Lọc theo dropdown **Độ khó** | Chỉ hiển thị task đúng mức độ khó đã chọn | ☐ | |
| Đổi **Sắp xếp** sang các lựa chọn khác | Thứ tự task thay đổi đúng theo tiêu chí sắp xếp | ☐ | |

### 3.2 — Tạo Task mới (thủ công)

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Bấm **"+ Tạo Task"**, để trống Tiêu đề, bấm Tạo Task | Báo lỗi bắt buộc nhập tiêu đề, không tạo task rỗng | ☐ | |
| Điền đầy đủ Tiêu đề + Kỹ năng + Mức độ khó + Hạn chót + Thời gian | Tạo task thành công, xuất hiện NGAY trong cột Cần Làm không cần tải lại trang | ☐ | |
| Để trống Thời gian ước tính (phút), bấm Tạo Task | Tự gán giá trị mặc định hợp lý (ví dụ 25 phút), không lỗi | ☐ | |
| Chọn Hạn chót là ngày trong **QUÁ KHỨ**, bấm Tạo Task | Báo lỗi/cảnh báo hạn chót không hợp lệ, không cho tạo | ☐ | |

### 3.3 — Tương tác với Task

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Kéo 1 task từ cột Cần Làm sang Đang Làm (drag & drop) | Task chuyển cột đúng, badge số ở mỗi cột cập nhật theo | ☐ | |
| Bấm **"Làm bài Test"** trên 1 task có quiz | Mở đúng bài quiz liên quan tới kỹ năng của task đó | ☐ | |
| Hoàn thành 1 task, chuyển sang cột Đã Xong | Khối "HOÀN THÀNH" ở trang Tổng quan tăng số Tasks tương ứng | ☐ | |

---

## 4. Lộ trình cá nhân

### 4.1 — Hiển thị lộ trình

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Vào trang Lộ trình cá nhân | Hiển thị đầy đủ các giai đoạn (KHÔNG báo lỗi AI, KHÔNG "0/0 TASKS") | ☐ | |
| Kiểm tra % Tiến độ hoàn thành ở đầu trang | Khớp đúng tỉ lệ task đã hoàn thành / tổng số task trong lộ trình | ☐ | |
| Bấm **"Xem Lịch"** | Mở đúng giao diện lịch, hiển thị task theo ngày/tuần hợp lý | ☐ | |
| Bấm **"Xuất PDF"** | Tải xuống đúng file PDF chứa ĐẦY ĐỦ các giai đoạn + task + % tiến độ | ☐ | |

### 4.2 — Thêm bước thủ công

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Bấm **"+ Thêm bước"**, để trống Tiêu đề, bấm Thêm Bước | Báo lỗi bắt buộc, không tạo bước rỗng | ☐ | |
| Điền đầy đủ thông tin, chọn vị trí chèn **Cuối lộ trình** | Bước mới xuất hiện ở CUỐI timeline, không xáo trộn các bước cũ | ☐ | |
| Tạo 1 bước mới, chọn chèn **SAU 1 bước cụ thể** đã có | Bước mới chèn ĐÚNG vị trí, các bước phía sau bị đẩy lùi thứ tự đúng | ☐ | |

### 4.3 — Tạo lại lộ trình bằng AI

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Bấm **"Tạo Lại Lộ Trình"** | AI sinh lại lộ trình mới thành công, KHÔNG báo lỗi 401/lỗi kết nối | ☐ | |
| Kiểm tra sau khi Tạo Lại: bước đã thêm thủ công (Mục 4.2) | Bước tự thêm thủ công VẪN GIỮ NGUYÊN vị trí, không bị AI xóa | ☐ | |
| Tắt mạng (hoặc giả lập lỗi API), bấm Tạo Lại Lộ Trình | Hiện thông báo lỗi thân thiện, KHÔNG crash trắng trang | ☐ | |

---

## 5. Quản lý kỹ năng

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Vào trang Quản lý kỹ năng | Hiển thị đúng danh sách kỹ năng đang theo đuổi kèm % mastery | ☐ | |
| Bấm **"+ Thêm kỹ năng mới"**, chọn thêm 1 kỹ năng chưa có | Kỹ năng mới xuất hiện trong danh sách, % mastery khởi tạo hợp lý (0% hoặc theo tự đánh giá) | ☐ | |
| Bấm **"Xóa khỏi danh sách theo đuổi"** với 1 kỹ năng | Hiện dialog xác nhận cảnh báo rõ ràng trước khi xóa | ☐ | |
| Xác nhận xóa 1 kỹ năng | Kỹ năng biến mất khỏi danh sách NHƯNG dữ liệu mastery vẫn được giữ lại (kiểm tra bằng cách thêm lại kỹ năng đó) | ☐ | |
| Sau khi thêm/xóa kỹ năng, bấm **"Cập nhật lộ trình theo thay đổi"** | Lộ trình cá nhân (Mục 4) điều chỉnh phản ánh đúng thay đổi kỹ năng | ☐ | |

---

## 6. Focus Pomodoro

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Vào trang Focus Pomodoro, bấm bắt đầu chế độ Work (25 phút) | Đồng hồ đếm ngược chạy đúng, hiển thị đúng 25:00 ban đầu | ☐ | |
| Bấm **Tạm dừng** giữa lúc đang chạy | Đồng hồ dừng lại đúng tại thời điểm bấm, không tự chạy tiếp | ☐ | |
| Đợi hết giờ Work (hoặc bấm Bỏ qua/Hoàn thành sớm) | Tự chuyển sang chế độ Short Break (5 phút), có thông báo/âm thanh báo hết giờ | ☐ | |
| Hoàn thành 1 phiên Pomodoro gắn với 1 task cụ thể | Khối "GIỜ TẬP TRUNG" ở trang Thành tích tăng đúng số phút/giờ tương ứng | ☐ | |

---

## 7. Thư viện chung

### 7.1 — Lộ trình mẫu

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Vào tab **Lộ trình mẫu**, xem danh sách | Hiển thị đầy đủ các lộ trình mẫu, mỗi card có Độ khó/Thời gian/Kỹ năng rõ ràng | ☐ | |
| Bấm **"Xem chi tiết"** 1 lộ trình | Mở modal hiển thị đầy đủ các giai đoạn, mỗi giai đoạn có nhiều task con | ☐ | |
| Bấm **"Thêm vào Bảng học tập"** | Toàn bộ task của lộ trình mẫu được thêm vào Kanban, kiểm tra lại Bảng học tập để xác nhận | ☐ | |

### 7.2 — Tài liệu

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Vào tab **Tài liệu**, xem danh sách | Hiển thị tài liệu dạng card với badge FREE/PREMIUM rõ ràng | ☐ | |
| Bấm **"Lưu vào Tủ tài liệu"** với 1 tài liệu FREE | Lưu thành công, xuất hiện trong Tủ tài liệu của tôi | ☐ | |
| Thử tải xuống 1 tài liệu PREMIUM **CHƯA mua** | Nút Tải xuống bị disable, có tooltip yêu cầu mua trước | ☐ | |

### 7.3 — Tủ tài liệu của tôi

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Vào **Tủ tài liệu của tôi** | Hiển thị đúng các tài liệu đã lưu ở Mục 7.2 | ☐ | |
| Bấm **Tải xuống** 1 tài liệu FREE đã lưu | File được tải xuống máy hoặc mở link đúng (tùy loại file) | ☐ | |
| Bấm **"Xuất danh sách"** | Xuất ra 1 file PDF tổng hợp danh sách tài liệu đã lưu | ☐ | |
| Bấm **"Bỏ lưu"** 1 tài liệu | Tài liệu biến mất khỏi Tủ, nhưng vẫn còn tồn tại ở tab Tài liệu chính | ☐ | |

---

## 8. Cộng đồng

### 8.1 — Đăng bài

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Bấm **"Tạo bài đăng"**, để trống Tiêu đề/Nội dung, bấm Đăng bài | Báo lỗi bắt buộc, không cho đăng bài rỗng | ☐ | |
| Điền đầy đủ (Tiêu đề, Loại bài, Nội dung, Kỹ năng), bấm Đăng bài | Hiện toast "đang chờ kiểm duyệt", bài KHÔNG xuất hiện ngay trong danh sách công khai | ☐ | |
| Vào mục **"Bài đăng của tôi"** | Thấy đúng bài vừa đăng với trạng thái "Đang chờ duyệt" | ☐ | |

### 8.2 — Kiểm duyệt (test với tài khoản Admin/Mentor)

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Đăng nhập Admin/Mentor, vào trang kiểm duyệt | Thấy đúng bài đăng PENDING vừa tạo ở Mục 8.1 | ☐ | |
| Bấm **Duyệt bài** | Bài chuyển PUBLISHED, tài khoản Student thấy bài đã xuất hiện công khai | ☐ | |
| Tạo 1 bài khác, bấm **Từ chối** kèm lý do | Bài chuyển REJECTED, tài khoản Student thấy được lý do từ chối trong "Bài đăng của tôi" | ☐ | |

### 8.3 — Tương tác bài đăng

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Vào 1 bài PUBLISHED, bấm **Upvote** | Số upvote tăng 1; bấm lại để bỏ upvote thì giảm về số cũ | ☐ | |
| Viết 1 bình luận, bấm Gửi | Bình luận hiện NGAY không cần kiểm duyệt | ☐ | |
| Bấm **Report** 1 bình luận | reportCount tăng, kiểm tra ở trang Admin có hiện trong "Bình luận bị báo cáo" | ☐ | |

---

## 9. Thành tích

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Vào trang Thành tích với tài khoản mới (chưa học gì) | Tất cả huy hiệu hiển thị trạng thái CHƯA ĐẠT (khóa), số liệu 0 Tasks/0 Ngày/0%/0h Focus | ☐ | |
| Hoàn thành đủ điều kiện 1 huy hiệu (ví dụ làm 1 bài quiz đầu tiên) | Huy hiệu tự động chuyển trạng thái ĐÃ ĐẠT, có hiệu ứng/thông báo khi đạt được | ☐ | |
| Kiểm tra **Nhật ký hoạt động tự học** (lưới ô vuông) | Các ngày có hoạt động học tập hiển thị đậm màu hơn ngày không hoạt động | ☐ | |
| Bấm **"Xuất Báo Cáo"** | Xuất đúng file báo cáo tổng hợp thành tích học tập | ☐ | |

---

## 10. Bảng xếp hạng

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Vào Bảng xếp hạng, xem mặc định tab **"Tuần"** | Hiển thị đúng Top 3 + danh sách tiếp theo, sắp xếp giảm dần theo Tốc độ học tập | ☐ | |
| Chuyển sang tab **"Tháng"** | Dữ liệu thay đổi phản ánh đúng khoảng thời gian 1 tháng (khác với dữ liệu tuần) | ☐ | |
| Chuyển sang tab **"Học kỳ"** | Dữ liệu thay đổi phản ánh đúng khoảng thời gian học kỳ | ☐ | |
| Kiểm tra vị trí của chính tài khoản đang test trong danh sách | Hiển thị đúng thứ hạng, tên, email của tài khoản đang đăng nhập | ☐ | |

---

## 11. Trang Profile

### 11.1 — Thông tin cá nhân

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Vào trang Profile, sửa **Họ và tên**, bấm Lưu thay đổi | Tên được cập nhật thành công, hiển thị đúng ở mọi nơi khác trong web (sidebar, lời chào đầu trang) | ☐ | |
| Thử sửa ô **Địa chỉ Email** | Ô bị khóa/không cho sửa (đúng như label "KHÔNG THỂ THAY ĐỔI") | ☐ | |
| Sửa **Mục tiêu học tập dài hạn**, bấm Lưu thay đổi | Lưu thành công, không bị lỗi định dạng dữ liệu | ☐ | |

### 11.2 — Đổi mật khẩu

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Bấm **"Đổi Mật Khẩu"**, nhập **sai** Mật khẩu hiện tại | Báo lỗi rõ ràng "Mật khẩu hiện tại không đúng", không cho đổi | ☐ | |
| Nhập Mật khẩu mới và Xác nhận **KHÔNG khớp** nhau | Báo lỗi ngay trên form, không cho submit | ☐ | |
| Nhập đúng Mật khẩu hiện tại + Mật khẩu mới hợp lệ + Xác nhận khớp | Đổi mật khẩu thành công, hiện toast xác nhận | ☐ | |
| Đăng xuất, đăng nhập lại bằng **MẬT KHẨU MỚI** | Đăng nhập thành công (xác nhận đổi thật, không phải chỉ UI giả) | ☐ | |

### 11.3 — Cài đặt thông báo

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Bấm **"Cài đặt Thông báo"**, tắt toggle **"Cảnh báo rủi ro học tập"** | Lưu thay đổi ngay (auto-save), hiện toast xác nhận | ☐ | |
| Tải lại trang (refresh) | Trạng thái toggle vẫn giữ đúng như đã tắt (không bị reset về mặc định) | ☐ | |

### 11.4 — Kỹ năng & Hoạt động

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Kiểm tra khối **Kỹ năng đang theo đuổi** | Khớp đúng với dữ liệu ở Mục 5 (Quản lý kỹ năng) | ☐ | |
| Kiểm tra khối **Hoạt động gần đây** | Hiển thị đúng các hành động gần nhất theo thời gian giảm dần | ☐ | |

---

## 12. Ví của tôi (Demo)

> [!NOTE]
> Đây là **MOCK WALLET** cho demo đồ án, không phải thanh toán thật.

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Vào trang Ví của tôi, kiểm tra số dư ban đầu | Hiển thị đúng số dư hiện tại (0 hoặc số đã nạp trước đó) | ☐ | |
| Bấm **Nạp tiền**, chọn mệnh giá 100.000 VNĐ | Hiển thị mã QR demo, không bị lỗi tạo QR | ☐ | |
| Bấm **"Tôi đã thanh toán (Demo)"** | Số dư cộng thêm đúng 100.000, ghi lại lịch sử giao dịch loại DEPOSIT | ☐ | |
| Vào Thư viện chung, mua 1 tài liệu/lộ trình PREMIUM **có giá thấp hơn** số dư | Trừ đúng số tiền, tạo bản ghi PURCHASE, tài liệu/lộ trình chuyển trạng thái đã mua | ☐ | |
| Thử mua 1 món PREMIUM có giá **CAO HƠN** số dư hiện tại | Báo lỗi "Số dư không đủ", gợi ý nạp thêm, không cho trừ âm số dư | ☐ | |

---

## 13. Trợ lý Chat AI

### 13.1 — UI & lịch sử chat

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Bấm nút nổi góc dưới phải ở **BẤT KỲ trang nào** trong `/student/*` | Mở popup chat đúng vị trí, không bị che/lỗi layout | ☐ | |
| Gửi 1 vài tin nhắn, đóng popup, đăng xuất, đăng nhập lại, mở lại chat | Lịch sử chat trước đó VẪN CÒN, không bị mất | ☐ | |
| Bấm **"+ Cuộc trò chuyện mới"** | Tạo cuộc hội thoại mới, không xóa lịch sử cuộc hội thoại cũ | ☐ | |

### 13.2 — Hỏi đáp kiến thức

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Hỏi 1 câu kiến thức liên quan kỹ năng đang học (ví dụ: "thì hiện tại đơn dùng khi nào?") | AI trả lời đúng trọng tâm, bằng tiếng Việt, không bị lỗi/treo | ☐ | |
| Hỏi 1 câu hỏi mơ hồ/không liên quan kỹ năng nào | AI vẫn trả lời hợp lý hoặc hỏi lại làm rõ, không bị crash | ☐ | |

### 13.3 — Function Calling — điều khiển app

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Gõ: *"Tạo cho tôi task học CSS trong 2 tiếng"* | AI thực sự tạo 1 task mới trong Kanban, trả lời xác nhận kèm tên task; kiểm tra lại Bảng học tập thấy task xuất hiện | ☐ | |
| Gõ: *"Tôi đang học tới đâu rồi?"* hoặc *"tiến độ của tôi thế nào"* | AI trả lời đúng % mastery thực tế từ dữ liệu BKT, không bịa số liệu | ☐ | |
| Gõ: *"Bắt đầu Pomodoro cho tôi"* | Phiên Pomodoro 25 phút được kích hoạt thực sự, kiểm tra ở trang Focus Pomodoro | ☐ | |
| Gõ 1 câu yêu cầu XÓA dữ liệu (ví dụ: *"xóa hết task của tôi"*) | AI **PHẢI** hỏi xác nhận lại hoặc từ chối lịch sự, KHÔNG tự xóa ngay | ☐ | |
| Gõ tên 1 kỹ năng **KHÔNG có** trong danh sách đang theo đuổi để tạo task | AI hỏi lại xác nhận thay vì tự gán nhầm vào 1 kỹ năng khác | ☐ | |

---

## 14. Kiểm tra chung toàn hệ thống

| Bước thực hiện | Kết quả mong đợi | Đạt | Ghi chú lỗi |
|---|---|---|---|
| Đăng nhập 2 tài khoản khác nhau ở 2 trình duyệt/máy cùng lúc | Dữ liệu của 2 tài khoản KHÔNG bị lẫn vào nhau | ☐ | |
| Kiểm tra khối **Realtime** ở header | Hiển thị đúng trạng thái kết nối, không báo lỗi liên tục | ☐ | |
| Kiểm tra icon **Thông báo (chuông)** ở header | Badge số hiển thị đúng số thông báo chưa đọc, bấm vào xem được nội dung | ☐ | |
| **Resize** trình duyệt nhỏ lại (test responsive cơ bản) | Layout không bị vỡ nghiêm trọng (sidebar, các card co giãn hợp lý) | ☐ | |
| Đăng xuất, thử truy cập trực tiếp URL `/student/...` khi chưa đăng nhập | Bị redirect về trang đăng nhập, không cho xem nội dung khi chưa xác thực | ☐ | |
| Đăng nhập tài khoản Student, thử truy cập trực tiếp URL trang Admin | Bị chặn/redirect, không cho Student xem trang Admin | ☐ | |

---

> [!CAUTION]
> **Sau khi test xong**, tổng hợp toàn bộ các ô "Ghi chú lỗi" có nội dung thành 1 danh sách lỗi cần sửa.
> Ưu tiên sửa lỗi ở các mục đầu **(Khảo sát → Tổng quan → Kanban)** trước vì các trang sau phụ thuộc dữ liệu từ đó.

---

*EduPath QA Checklist — phiên bản nội bộ, không phát hành công khai.*
