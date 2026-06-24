const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const doctors = await prisma.doctor.findMany({ select: { id: true, name: true } });
    
    const invalidDocs = doctors.filter(d => {
        const nameLower = d.name.toLowerCase();
        return nameLower.includes('chuyên khoa') || 
               nameLower.includes('bệnh viện') || 
               nameLower.includes('tiến sĩ') || 
               nameLower.includes('bác sĩ') ||
               d.name.length > 50 ||
               nameLower.includes('-');
    });
    
    console.log(`Found ${invalidDocs.length} invalid doctors:`);
    for (const d of invalidDocs) {
        console.log(`- ${d.name} (ID: ${d.id})`);
    }

    if (invalidDocs.length > 0) {
        const idsToDelete = invalidDocs.map(d => d.id);
        
        // Delete related records first
        await prisma.doctorSchedule.deleteMany({ where: { doctorId: { in: idsToDelete } } });
        await prisma.doctorCertificate.deleteMany({ where: { doctorId: { in: idsToDelete } } });
        await prisma.review.deleteMany({ where: { doctorId: { in: idsToDelete } } });
        await prisma.appointment.deleteMany({ where: { doctorId: { in: idsToDelete } } });
        
        // Delete doctors
        await prisma.doctor.deleteMany({ where: { id: { in: idsToDelete } } });
        console.log(`Deleted ${invalidDocs.length} invalid doctors and their related records.`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
