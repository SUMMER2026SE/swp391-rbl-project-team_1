import { PrismaClient, Role, AppointmentStatus, PaymentStatus } from "@prisma/client";

const prisma = new PrismaClient();

const DUMMY_COMMENTS = [
    "Bác sĩ rất tận tâm và chuyên nghiệp. Khám kỹ và dặn dò chu đáo.",
    "Bệnh viện sạch sẽ, bác sĩ thân thiện. Sẽ giới thiệu cho người nhà.",
    "Khám rất nhanh nhưng bác sĩ giải thích rõ ràng, dễ hiểu. Cảm ơn bác sĩ.",
    "Dịch vụ tốt, bác sĩ có chuyên môn cao. Rất hài lòng.",
    "Bác sĩ giỏi, tư vấn nhiệt tình. Khuyên mọi người nên đặt lịch khám bác sĩ này.",
    "Tuyệt vời! Bác sĩ khám rất êm, giải quyết đúng nguyên nhân bệnh.",
    "Cơ sở vật chất hiện đại, bác sĩ chuyên nghiệp. Đánh giá 5 sao!"
];

async function main() {
    console.log("🌱 Starting reviews seed...");

    // 1. Fetch some users or create dummy ones
    let users = await prisma.user.findMany({ where: { role: Role.USER } });
    if (users.length === 0) {
        console.log("No users found. Please create users first.");
        return;
    }

    // 2. Fetch doctors
    const doctors = await prisma.doctor.findMany({ take: 5 }); // Take first 5 doctors
    if (doctors.length === 0) {
        console.log("No doctors found.");
        return;
    }

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    let reviewCount = 0;

    for (const doctor of doctors) {
        // Create 3-5 reviews per doctor
        const numReviews = Math.floor(Math.random() * 3) + 3; 

        for (let i = 0; i < numReviews; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const comment = DUMMY_COMMENTS[Math.floor(Math.random() * DUMMY_COMMENTS.length)];
            const rating = Math.random() > 0.3 ? 5 : 4; // Mostly 5 stars, some 4 stars

            // 1. Create a completed appointment
            const appointment = await prisma.appointment.create({
                data: {
                    userId: user.id,
                    doctorId: doctor.id,
                    appointmentDate: twoDaysAgo,
                    status: AppointmentStatus.COMPLETED,
                    transactionCode: "REV" + Math.random().toString(36).substring(2, 8).toUpperCase(),
                    amount: 50000,
                    paymentAt: new Date()
                }
            });

            // 2. Create a medical record for the completed appointment
            await prisma.medicalRecord.create({
                data: {
                    appointmentId: appointment.id,
                    doctorId: doctor.id,
                    userId: user.id,
                    diagnosis: "Khám sức khỏe tổng quát",
                    notes: "Bệnh nhân ổn định, cần theo dõi thêm."
                }
            });

            // 3. Create the review
            await prisma.review.create({
                data: {
                    appointmentId: appointment.id,
                    doctorId: doctor.id,
                    userId: user.id,
                    rating: rating,
                    comment: comment,
                }
            });

            reviewCount++;
        }
    }

    console.log(`✅ Seeded ${reviewCount} reviews successfully!`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
