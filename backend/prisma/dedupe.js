const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const doctors = await prisma.doctor.findMany({
        include: { userAccount: true, doctorSchedules: true, certificates: true, appointments: true },
        orderBy: { createdAt: 'asc' } // keep the older ones
    });
    
    const seen = new Set();
    const toDelete = [];
    
    for (const doc of doctors) {
        if (seen.has(doc.name)) {
            toDelete.push(doc);
        } else {
            seen.add(doc.name);
        }
    }
    
    console.log(`Found ${toDelete.length} duplicates out of ${doctors.length} doctors.`);
    
    for (const doc of toDelete) {
        console.log(`Deleting duplicate: ${doc.name} (ID: ${doc.id})`);
        
        // Delete related records first
        if (doc.userAccount) {
            await prisma.user.delete({ where: { id: doc.userAccount.id } });
        }
        await prisma.doctorSchedule.deleteMany({ where: { doctorId: doc.id } });
        await prisma.doctorCertificate.deleteMany({ where: { doctorId: doc.id } });
        await prisma.appointment.deleteMany({ where: { doctorId: doc.id } });
        
        // Finally delete the doctor
        await prisma.doctor.delete({ where: { id: doc.id } });
    }
    
    console.log("Cleanup complete!");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
