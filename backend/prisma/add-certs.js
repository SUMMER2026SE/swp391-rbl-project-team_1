const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const doctors = await prisma.doctor.findMany({
        include: { certificates: true }
    });
    
    let addedCount = 0;
    
    for (const doc of doctors) {
        if (doc.certificates.length === 0) {
            await prisma.doctorCertificate.createMany({
                data: [
                    {
                        doctorId: doc.id,
                        title: "Bằng Bác sĩ Đa khoa",
                        issuer: "Đại học Y Dược",
                        issuedYear: 2010,
                        description: "Tốt nghiệp bác sĩ y khoa loại giỏi."
                    },
                    {
                        doctorId: doc.id,
                        title: "Chứng chỉ hành nghề khám bệnh, chữa bệnh",
                        issuer: "Sở Y tế",
                        issuedYear: 2012,
                        description: "Được cấp phép hành nghề y khoa."
                    }
                ]
            });
            addedCount++;
        }
    }
    
    console.log(`Added dummy certificates to ${addedCount} doctors.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
