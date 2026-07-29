import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    await prisma.review.deleteMany();
    await prisma.prescription.deleteMany();
    await prisma.medicalRecord.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.complaint.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.doctorSchedule.deleteMany();
    await prisma.doctorCertificate.deleteMany();
    await prisma.user.deleteMany();
    await prisma.doctor.deleteMany();
    await prisma.clinic.deleteMany();
    await prisma.specialty.deleteMany();
    await prisma.oTP.deleteMany();
    await prisma.medicalPackage.deleteMany();
    await prisma.article.deleteMany();
    console.log('Cleared DB');
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
