import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const packages = await prisma.medicalPackage.findMany();
  
  if (packages.length === 0) {
    console.log('No packages found to update.');
    return;
  }

  console.log(`Found ${packages.length} packages. Updating...`);

  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i];
    
    // Make every other package recommended
    const isRecommended = i % 2 === 0;
    
    // Deposit calculation
    const depositPercentage = 20; // 20% deposit
    const depositAmount = (pkg.price * depositPercentage) / 100;

    await prisma.medicalPackage.update({
      where: { id: pkg.id },
      data: {
        depositPercentage,
        depositAmount, // We explicitly set this for testing
        isRecommended,
        suitableFor: 'Phù hợp cho mọi độ tuổi, đặc biệt là người trưởng thành cần kiểm tra sức khỏe định kỳ hàng năm.',
        preparationGuide: '1. Nhịn ăn ít nhất 8 tiếng trước khi lấy máu xét nghiệm.\n2. Uống nhiều nước và nhịn tiểu trước khi siêu âm ổ bụng.\n3. Mang theo kết quả khám bệnh hoặc đơn thuốc cũ (nếu có).',
        cancellationPolicy: '1. Hủy lịch trước 24h: Hoàn 100% tiền cọc.\n2. Hủy lịch trong vòng 24h: Hoàn 50% tiền cọc.\n3. Không đến khám không báo trước: Không hoàn cọc.',
        includedServices: [
          'Khám nội tổng quát',
          'Xét nghiệm máu (Đường huyết, mỡ máu, chức năng gan/thận)',
          'Xét nghiệm nước tiểu',
          'Siêu âm ổ bụng tổng quát',
          'Chụp X-Quang tim phổi thẳng',
          'Điện tâm đồ (ECG)'
        ],
      },
    });
  }

  console.log('Successfully updated all packages with new fields!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
