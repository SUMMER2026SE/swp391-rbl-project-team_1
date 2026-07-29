const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const doctorId = "doctor_12"; // Dr. VănLong

  // Get a few normal users
  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    take: 5
  });

  if (users.length === 0) {
    console.log("No users found. Please create some users first.");
    return;
  }

  console.log(`Found ${users.length} users to use as patients.`);

  // Clear old data for this doctor just in case to start fresh
  await prisma.review.deleteMany({ where: { doctorId } });
  await prisma.medicalRecord.deleteMany({ where: { doctorId } });
  await prisma.appointment.deleteMany({ where: { doctorId } });

  // Generate 15 appointments over the last 6 months
  const now = new Date();
  const icd10Codes = ['H10', 'H00', 'H52', 'H25', 'H40'];
  const icd10Desc = {
    'H10': 'Viêm kết mạc',
    'H00': 'Chắp lẹo',
    'H52': 'Tật khúc xạ',
    'H25': 'Đục thủy tinh thể',
    'H40': 'Glôcôm'
  };

  const reviews = [
    { rating: 5, comment: "Bác sĩ rất nhiệt tình và chu đáo." },
    { rating: 4, comment: "Khám kỹ, thuốc uống mau khỏi." },
    { rating: 5, comment: "Bác sĩ giải thích rõ ràng, dễ hiểu." },
    { rating: 5, comment: "Rất hài lòng với dịch vụ." },
    { rating: 4, comment: "Phòng khám sạch sẽ, bác sĩ thân thiện." }
  ];

  for (let i = 0; i < 20; i++) {
    const user = users[i % users.length];
    
    // Random date within last 6 months
    const pastMonths = Math.floor(Math.random() * 6);
    const date = new Date(now.getFullYear(), now.getMonth() - pastMonths, Math.floor(Math.random() * 28) + 1, 9 + Math.floor(Math.random() * 8), 0, 0);
    
    const icd10 = icd10Codes[Math.floor(Math.random() * icd10Codes.length)];

    // Create Appointment
    const appointment = await prisma.appointment.create({
      data: {
        userId: user.id,
        doctorId: doctorId,
        appointmentDate: date,
        status: 'COMPLETED',
        amount: 200000,
        paymentProof: "mock_proof",
        paymentAt: date,
        patientProfileType: 'SELF',
        patientInfo: {},
        createdAt: new Date(date.getTime() - 86400000), // booked 1 day before
      }
    });

    // Create MedicalRecord
    await prisma.medicalRecord.create({
      data: {
        appointmentId: appointment.id,
        doctorId: doctorId,
        userId: user.id,
        status: 'COMPLETED',
        icd10Code: icd10,
        preliminaryDiagnosis: icd10Desc[icd10],
        finalDiagnosis: icd10Desc[icd10],
        createdAt: date,
        updatedAt: date
      }
    });

    // Create Review for ~40% of appointments
    if (Math.random() > 0.6) {
      const reviewData = reviews[Math.floor(Math.random() * reviews.length)];
      await prisma.review.create({
        data: {
          appointmentId: appointment.id,
          doctorId: doctorId,
          userId: user.id,
          rating: reviewData.rating,
          comment: reviewData.comment,
          createdAt: new Date(date.getTime() + 86400000 * 2) // reviewed 2 days later
        }
      });
    }
  }

  console.log("Mock data created successfully for Doctor VănLong.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
