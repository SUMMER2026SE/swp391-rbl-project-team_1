import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const updates = [
  { name: "Gói khám Thận - Tiết niệu", price: 1850000 },
  { name: "Gói khám Phổi - Lồng ngực", price: 2100000 },
  { name: "Gói khám Ung thư Vú - Phụ khoa", price: 3500000 },
  { name: "Gói khám Gan - Mật - Tụy", price: 2400000 },
  { name: "Gói khám Tiền hôn nhân Nam/Nữ", price: 1650000 },
  { name: "Gói khám Chuyên sâu Nam/Nữ", price: 4200000 },
  { name: "Gói khám Tổng quát Nam/Nữ", price: 1200000 },
  { name: "Gói Tam cá nguyệt 1", price: 2800000 },
];

async function main() {
  console.log("Updating medical package prices...");
  for (const update of updates) {
    const pkgs = await prisma.medicalPackage.findMany({
      where: { name: { contains: update.name } }
    });
    if (pkgs.length > 0) {
      for (const p of pkgs) {
        await prisma.medicalPackage.update({
          where: { id: p.id },
          data: { price: update.price }
        });
        console.log(`Updated "${p.name}" to ${update.price}đ`);
      }
    } else {
      console.log(`Package containing "${update.name}" not found.`);
    }
  }

  // Find any other packages and set price between 1.2M and 5.5M if they are 0
  const otherPackages = await prisma.medicalPackage.findMany({
    where: { price: { lte: 0 } }
  });
  for (const p of otherPackages) {
    const randomPrice = Math.floor(Math.random() * (5500000 - 1200000) + 1200000);
    // Round to nearest 100k
    const rounded = Math.round(randomPrice / 100000) * 100000;
    await prisma.medicalPackage.update({
      where: { id: p.id },
      data: { price: rounded }
    });
    console.log(`Updated other package "${p.name}" to ${rounded}đ`);
  }
  
  console.log("Finished updating prices.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
