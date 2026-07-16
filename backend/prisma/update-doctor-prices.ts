import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // Lấy tất cả bác sỹ
    const doctors = await prisma.doctor.findMany({
        orderBy: { createdAt: "asc" },
    });

    console.log(`Tìm thấy ${doctors.length} bác sỹ. Đang cập nhật giá...`);

    let count5000 = 0;
    let count10000 = 0;

    for (let i = 0; i < doctors.length; i++) {
        // Nửa đầu giá 5000, nửa sau giá 10000
        const price = i < Math.ceil(doctors.length / 2) ? 5000 : 10000;

        await prisma.doctor.update({
            where: { id: doctors[i].id },
            data: { price },
        });

        if (price === 5000) count5000++;
        else count10000++;

        console.log(`  ✅ ${doctors[i].name}: ${price} VND`);
    }

    console.log(`\nHoàn tất! ${count5000} bác sỹ giá 5.000đ, ${count10000} bác sỹ giá 10.000đ.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());