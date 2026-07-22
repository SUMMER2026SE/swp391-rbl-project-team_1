"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const diagnoses = [
    { prel: 'Viêm họng cấp', final: 'Viêm họng do liên cầu khuẩn', icd: 'J02.0' },
    { prel: 'Viêm kết mạc', final: 'Viêm kết mạc dị ứng', icd: 'H10.1' },
    { prel: 'Cận thị tiến triển', final: 'Cận thị độ cao', icd: 'H52.1' },
    { prel: 'Khô mắt', final: 'Hội chứng khô mắt', icd: 'H04.1' },
    { prel: 'Đục thủy tinh thể', final: 'Đục thủy tinh thể tuổi già', icd: 'H26.1' },
];
const treatmentPlans = [
    'Dùng thuốc kháng sinh theo đơn, nghỉ ngơi đầy đủ, uống nhiều nước.',
    'Dùng thuốc nhỏ mắt chống dị ứng, tránh tiếp xúc tác nhân gây dị ứng.',
    'Đeo kính cận đúng số, kiểm tra mắt định kỳ 6 tháng/lần.',
    'Nhỏ mắt nhân tạo 4 lần/ngày, hạn chế dùng điện thoại.',
    'Theo dõi tiến triển, phẫu thuật khi độ mờ ảnh hưởng đến sinh hoạt.',
];
const doctorNotes = [
    'Uống đủ nước, không hút thuốc, vệ sinh tay thường xuyên. Tái khám nếu triệu chứng không giảm sau 5 ngày.',
    'Tránh dụi mắt, không đeo kính áp tròng trong thời gian điều trị.',
    'Hạn chế nhìn màn hình quá 1 giờ liên tục, thực hiện bài tập mắt.',
    'Bật đèn đủ sáng khi làm việc, tăng độ ẩm môi trường.',
    'Duy trì chế độ ăn giàu vitamin A, E. Đeo kính mát khi ra ngoài.',
];
async function main() {
    const appts = await prisma.appointment.findMany({
        where: { status: 'COMPLETED' },
        include: { medicalRecord: true, doctor: true, user: true },
        take: 20
    });
    const withoutRecord = appts.filter((a) => !a.medicalRecord && a.doctorId);
    console.log(`Found ${withoutRecord.length} COMPLETED appointments without medical record`);
    let created = 0;
    for (const appt of withoutRecord) {
        const diagIdx = Math.floor(Math.random() * diagnoses.length);
        const diag = diagnoses[diagIdx];
        // Get a medicine to prescribe
        const medicines = await prisma.medicine.findMany({ take: 3 });
        const followUp = new Date(appt.appointmentDate);
        followUp.setDate(followUp.getDate() + 14);
        try {
            const record = await prisma.medicalRecord.create({
                data: {
                    appointmentId: appt.id,
                    doctorId: appt.doctorId,
                    userId: appt.userId,
                    height: 165 + Math.floor(Math.random() * 20),
                    weight: 55 + Math.floor(Math.random() * 25),
                    bloodPressure: `${110 + Math.floor(Math.random() * 20)}/${70 + Math.floor(Math.random() * 15)}`,
                    heartRate: 70 + Math.floor(Math.random() * 20),
                    temperature: 36.5 + Math.random() * 0.8,
                    spo2: 97 + Math.random() * 2,
                    symptoms: 'Bệnh nhân đến khám với các triệu chứng khởi phát 3-5 ngày trước. Không sốt cao.',
                    physicalExam: 'Toàn thân tỉnh táo, tiếp xúc tốt. Sinh hiệu ổn định.',
                    preliminaryDiagnosis: diag.prel,
                    finalDiagnosis: diag.final,
                    icd10Code: diag.icd,
                    treatmentPlan: treatmentPlans[diagIdx],
                    doctorNotes: doctorNotes[diagIdx],
                    followUpDate: followUp,
                    severity: 'MILD',
                    status: 'COMPLETED',
                }
            });
            // Add prescriptions if medicines exist
            if (medicines.length > 0) {
                const med = medicines[Math.floor(Math.random() * medicines.length)];
                await prisma.prescription.create({
                    data: {
                        medicalRecordId: record.id,
                        medicineId: med.id,
                        dosage: '1 viên/lần',
                        frequency: '2 lần/ngày (sáng - tối)',
                        durationDays: 7,
                        quantity: 14,
                        instructions: 'Uống sau ăn no',
                    }
                });
            }
            console.log(`✓ Created medical record for appointment ${appt.id} (${appt.user?.fullName} - ${appt.doctor?.name})`);
            created++;
        }
        catch (err) {
            console.error(`✗ Failed for ${appt.id}:`, err.message);
        }
    }
    console.log(`\nDone! Created ${created} medical records.`);
    await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
