const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const res = await prisma.doctor.updateMany({
        where: { name: { in: ['Lê Quang Huy', 'Lê Thị Hồng'] } },
        data: { specialtyId: 'spec_than_kinh' }
    });
    console.log('Updated DB', res);
}
main().catch(console.error).finally(() => prisma.$disconnect());
