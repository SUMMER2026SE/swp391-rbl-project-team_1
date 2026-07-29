import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Bệnh viện Hoàn Mỹ Đà Nẵng...');
    
    // Check if it already exists
    const existing = await prisma.clinic.findFirst({
        where: { name: 'Bệnh viện Hoàn Mỹ Đà Nẵng' }
    });

    if (existing) {
        console.log('Bệnh viện đã tồn tại trong database.');
        return;
    }

    const clinic = await prisma.clinic.create({
        data: {
            name: 'Bệnh viện Hoàn Mỹ Đà Nẵng',
            address: '291 Nguyễn Văn Linh, Quận Thanh Khê, TP. Đà Nẵng',
            image: '/uploads/hoan_my_da_nang.png',
        }
    });

    console.log('✅ Đã thêm thành công bệnh viện:', clinic.name);
}

main()
    .catch((e) => {
        console.error('Lỗi khi seed dữ liệu:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
