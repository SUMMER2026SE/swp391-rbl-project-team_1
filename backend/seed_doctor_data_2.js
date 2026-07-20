const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const doctorId = "doctor_12"; // Dr. VănLong

  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    take: 5
  });

  if (users.length === 0) return;

  const now = new Date();

  // Create Certificates
  await prisma.doctorCertificate.deleteMany({ where: { doctorId } });
  await prisma.doctorCertificate.create({
    data: {
      doctorId,
      title: "Chứng chỉ Hành nghề Khám chữa bệnh Chuyên khoa Mắt",
      issuer: "Bộ Y tế",
      issuedYear: 2015,
      description: "Chứng chỉ hành nghề chính thức.",
      certificateNumber: "BYT-12345",
      verificationStatus: "VERIFIED",
      verifiedAt: now
    }
  });

  await prisma.doctorCertificate.create({
    data: {
      doctorId,
      title: "Bằng Chuyên khoa cấp II Nhãn khoa",
      issuer: "Đại học Y Dược TP.HCM",
      issuedYear: 2020,
      description: "Bằng chuyên khoa cấp cao.",
      certificateNumber: "CKII-2020-001",
      verificationStatus: "VERIFIED",
      verifiedAt: now
    }
  });

  // Create Future Appointments
  for (let i = 1; i <= 3; i++) {
    const user = users[i % users.length];
    const futureDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, 9 + i, 0, 0);
    
    await prisma.appointment.create({
      data: {
        userId: user.id,
        doctorId: doctorId,
        appointmentDate: futureDate,
        status: 'CONFIRMED',
        amount: 350000,
        patientProfileType: 'SELF',
        patientInfo: {},
        createdAt: now,
      }
    });
  }

  // Create some COMPLETED appointments in the CURRENT month to make sure "Doanh thu tháng này" is updated
  for (let i = 1; i <= 5; i++) {
    const user = users[i % users.length];
    const pastDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 10, 0, 0);
    
    await prisma.appointment.create({
      data: {
        userId: user.id,
        doctorId: doctorId,
        appointmentDate: pastDate,
        status: 'COMPLETED',
        amount: 250000,
        paymentProof: "mock_proof_2",
        paymentAt: pastDate,
        patientProfileType: 'SELF',
        patientInfo: {},
        createdAt: new Date(pastDate.getTime() - 86400000),
      }
    });
  }

  console.log("Mock data (Certificates & Appointments) created successfully.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
