"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("Starting to seed admin statistics data...");
    // Get some doctors and users to assign appointments
    const doctors = await prisma.doctor.findMany({ take: 5 });
    const users = await prisma.user.findMany({ where: { role: client_1.Role.USER }, take: 10 });
    if (doctors.length === 0 || users.length === 0) {
        console.error("Not enough doctors or users to create seed data.");
        return;
    }
    const amounts = [50000, 100000, 150000, 200000, 250000, 300000];
    const discounts = [0, 0, 0, 0, 10000, 20000, 30000, 50000]; // More 0s to make discounts less frequent
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    const timeDiff = now.getTime() - oneYearAgo.getTime();
    const newAppointments = [];
    // Create 300 appointments over the last year
    for (let i = 0; i < 300; i++) {
        // Random date within the last year
        const randomTime = oneYearAgo.getTime() + Math.random() * timeDiff;
        const appointmentDate = new Date(randomTime);
        // Ensure it's not in the future for COMPLETED/CANCELLED
        if (appointmentDate > now)
            continue;
        const doctor = doctors[Math.floor(Math.random() * doctors.length)];
        const user = users[Math.floor(Math.random() * users.length)];
        // 70% Completed, 30% Cancelled
        const isCompleted = Math.random() > 0.3;
        const status = isCompleted ? 'COMPLETED' : 'CANCELLED';
        const originalAmount = amounts[Math.floor(Math.random() * amounts.length)];
        const discountAmount = isCompleted ? discounts[Math.floor(Math.random() * discounts.length)] : 0;
        const amount = Math.max(originalAmount - discountAmount, 1000);
        // Reason for cancellation
        const cancellationReasons = [
            'Tôi có việc bận đột xuất',
            'Tôi đã khám chỗ khác',
            'Sức khỏe đã ổn định',
            'Quên lịch khám'
        ];
        const cancellationReason = !isCompleted ? cancellationReasons[Math.floor(Math.random() * cancellationReasons.length)] : null;
        newAppointments.push({
            userId: user.id,
            doctorId: doctor.id,
            appointmentDate,
            status,
            amount,
            discountAmount,
            cancellationReason,
            notes: 'Seed data for statistics',
            patientProfileType: 'SELF',
        });
    }
    if (newAppointments.length > 0) {
        const created = await prisma.appointment.createMany({
            data: newAppointments,
        });
        console.log(`Successfully created ${created.count} seed appointments for statistics.`);
    }
    // Now seed some complaints
    const recentAppointments = await prisma.appointment.findMany({
        where: { status: { in: ['COMPLETED', 'CANCELLED'] } },
        take: 20
    });
    const newComplaints = [];
    // System complaints (no appointment)
    for (let i = 0; i < 5; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        newComplaints.push({
            userId: user.id,
            type: client_1.ComplaintType.SYSTEM,
            subject: 'Lỗi phần mềm ứng dụng',
            message: 'Ứng dụng chạy chậm và đôi khi không tải được danh sách bác sĩ khi đổi sang tab mới.',
            status: i % 2 === 0 ? client_1.ComplaintStatus.PENDING : client_1.ComplaintStatus.RESOLVED,
            adminResponse: i % 2 === 0 ? null : 'Cảm ơn bạn đã phản hồi, đội ngũ IT đã ghi nhận và tối ưu tốc độ.',
            createdAt: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        });
    }
    // Service complaints (with appointment)
    for (const appt of recentAppointments) {
        // 30% chance to have a complaint
        if (Math.random() > 0.3)
            continue;
        newComplaints.push({
            userId: appt.userId,
            appointmentId: appt.id,
            type: client_1.ComplaintType.SERVICE,
            subject: 'Thái độ dịch vụ chưa tốt',
            message: `Bác sĩ đến trễ hẹn và phòng khám hơi ồn ào. Mong hệ thống chấn chỉnh lại thời gian khám. Mã đặt khám: ${appt.id}`,
            status: Math.random() > 0.5 ? client_1.ComplaintStatus.PENDING : client_1.ComplaintStatus.RESOLVED,
            adminResponse: Math.random() > 0.5 ? null : 'Chúng tôi thành thật xin lỗi vì sự bất tiện này. Chúng tôi đã làm việc lại với bác sĩ.',
            createdAt: new Date(appt.appointmentDate.getTime() + 24 * 60 * 60 * 1000) // 1 day after appt
        });
    }
    if (newComplaints.length > 0) {
        const createdComplaints = await prisma.complaint.createMany({
            data: newComplaints,
        });
        console.log(`Successfully created ${createdComplaints.count} seed complaints.`);
    }
    console.log("Seed completed.");
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
