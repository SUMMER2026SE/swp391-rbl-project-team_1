import { PrismaClient, ComplaintStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ where: { role: "USER" }});
  if (!user) {
    console.log("Không tìm thấy user nào trong database");
    return;
  }
  
  const appt = await prisma.appointment.findFirst({ where: { userId: user.id }});

  const complaints = [
    {
      message: "Bác sĩ tư vấn quá nhanh, tôi chưa kịp hiểu rõ phác đồ điều trị và cách dùng thuốc.",
      status: ComplaintStatus.PENDING,
      userId: user.id,
      appointmentId: appt?.id || null,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      message: "Hệ thống thanh toán bị lỗi, tôi đã chuyển khoản thành công nhưng lịch hẹn vẫn ở trạng thái chờ thanh toán. Mong admin kiểm tra lại giúp.",
      status: ComplaintStatus.PENDING,
      userId: user.id,
      appointmentId: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    },
    {
      message: "Tôi chờ quá lâu ở bệnh viện, lịch hẹn lúc 9h00 mà tận 10h30 mới được gọi vào khám. Đề nghị cải thiện quy trình tiếp đón.",
      status: ComplaintStatus.RESOLVED,
      userId: user.id,
      appointmentId: appt?.id || null,
      adminResponse: "Dạ MedBooking vô cùng xin lỗi bạn vì sự bất tiện này. Chúng tôi đã làm việc trực tiếp với phòng khám để điều chỉnh lại lượng bệnh nhân mỗi khung giờ. Rất mong bạn thông cảm ạ.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    },
    {
      message: "Giao diện chọn bác sĩ rất khó dùng, tôi không thể lọc theo khung giờ mình mong muốn.",
      status: ComplaintStatus.RESOLVED,
      userId: user.id,
      appointmentId: null,
      adminResponse: "Cảm ơn bạn đã đóng góp ý kiến. Đội ngũ kỹ thuật đã ghi nhận và sẽ bổ sung bộ lọc thời gian trong bản cập nhật tuần tới.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
    },
    {
      message: "Gói khám tổng quát ghi là bao gồm siêu âm ổ bụng nhưng lúc tôi đi khám lại bị thu thêm phụ phí siêu âm?",
      status: ComplaintStatus.PENDING,
      userId: user.id,
      appointmentId: null,
      createdAt: new Date(),
    }
  ];

  for (const c of complaints) {
    await prisma.complaint.create({ data: c });
  }

  console.log("Đã tạo 5 phản hồi/khiếu nại mẫu thành công.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
