import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const packages = [
  {
    name: 'Gói khám Thận - Tiết niệu',
    description: 'Nhằm phát hiện sớm và chẩn đoán các bệnh lý liên quan đến hệ tiết niệu, để có kế hoạch điều trị kịp thời, hiệu quả và ngăn ngừa biến chứng nguy hiểm.',
    price: 1500000,
    hospital: 'Bệnh viện Hoàn Mỹ Đà Nẵng'
  },
  {
    name: 'Gói khám Phổi - Lồng ngực',
    description: 'Tầm soát, chẩn đoán và theo dõi các bệnh lý về phổi và các cấu trúc khác trong lồng ngực.',
    price: 1800000,
    hospital: 'Bệnh viện Hoàn Mỹ Đà Nẵng'
  },
  {
    name: 'Gói khám Ung thư Vú - Phụ khoa',
    description: 'Giúp phát hiện sớm các dấu hiệu ung thư (vú, cổ tử cung, buồng trứng, tử cung) từ đó tăng khả năng điều trị thành công và hiệu quả.',
    price: 2500000,
    hospital: 'Bệnh viện Hoàn Mỹ Đà Nẵng'
  },
  {
    name: 'Gói khám Gan - Mật - Tụy',
    description: 'Chẩn đoán và phát hiện sớm các bệnh lý liên quan đến gan, mật, và tụy.',
    price: 2000000,
    hospital: 'Bệnh viện Hoàn Mỹ Đà Nẵng'
  },
  {
    name: 'Gói khám Tầm soát Tổng quát Tiêu chuẩn',
    description: 'Đánh giá chức năng cơ bản của các cơ quan trong cơ thể, tầm soát các bệnh lý phổ biến.',
    price: 1200000,
    hospital: 'Bệnh viện Hoàn Mỹ Đà Nẵng'
  },
  {
    name: 'Gói khám Tầm soát Tổng quát Chuyên sâu',
    description: 'Tầm soát toàn diện và chuyên sâu các cơ quan, chức năng cơ thể, phát hiện sớm các bệnh lý nguy hiểm và ung thư.',
    price: 3500000,
    hospital: 'Bệnh viện Hoàn Mỹ Đà Nẵng'
  }
];

async function main() {
  console.log('Seeding Medical Packages...');
  for (const pkg of packages) {
    const created = await prisma.medicalPackage.create({
      data: pkg
    });
    console.log(`Created package: ${created.name}`);
  }
  console.log('✅ Seeding Packages Completed!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
