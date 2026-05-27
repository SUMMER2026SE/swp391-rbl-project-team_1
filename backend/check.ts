import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const doctor = await prisma.doctor.findFirst({ where: { userAccount: { email: 'phamvinhhuy@gmail.com' } } });
  if (!doctor) return;
  const pendingAppointments = await prisma.appointment.count({
      where: { doctorId: doctor.id, status: 'PENDING' }
  });
  const totalPatients = await prisma.appointment.groupBy({
      by: ['userId'],
      where: { doctorId: doctor.id }
  });
  console.log("Pending:", pendingAppointments);
  console.log("Patients length:", totalPatients.length);
}
main();
