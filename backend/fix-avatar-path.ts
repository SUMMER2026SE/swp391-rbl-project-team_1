import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fixing avatar paths in the database...');
    
    const doctors = await prisma.doctor.findMany();
    
    for (const doc of doctors) {
        if (doc.avatar && doc.avatar.startsWith('/uploads/doctors/')) {
            const newAvatar = doc.avatar.replace('/uploads/doctors/', '/AnhBS/');
            await prisma.doctor.update({
                where: { id: doc.id },
                data: { avatar: newAvatar }
            });
            console.log(`Updated ${doc.name}: ${newAvatar}`);
        }
    }
    console.log('✅ All avatar paths updated!');
}

main()
    .catch((e) => {
        console.error('Error updating paths:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
