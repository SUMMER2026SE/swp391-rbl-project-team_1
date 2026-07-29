import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding sample vouchers...");

  const now = new Date();
  const twoMonthsLater = new Date();
  twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);

  const vouchers = [
    {
      code: "WELCOME20",
      type: "PERCENT" as const,
      discountValue: 20,
      applyTo: "ALL" as const,
      minDepositAmount: 0,
      maxUses: 500,
      isFirstBooking: true,
      isActive: true,
      startDate: now,
      endDate: twoMonthsLater,
    },
    {
      code: "SAVE50K",
      type: "FIXED" as const,
      discountValue: 50000,
      applyTo: "PACKAGE" as const,
      minDepositAmount: 100000,
      maxUses: 200,
      isFirstBooking: false,
      isActive: true,
      startDate: now,
      endDate: twoMonthsLater,
    },
    {
      code: "HOLYEAR30",
      type: "PERCENT" as const,
      discountValue: 30,
      applyTo: "PACKAGE" as const,
      minDepositAmount: 0,
      maxUses: 100,
      isFirstBooking: false,
      isActive: true,
      startDate: now,
      endDate: twoMonthsLater,
    },
    {
      code: "DOCTOR15",
      type: "PERCENT" as const,
      discountValue: 15,
      applyTo: "ALL" as const,
      minDepositAmount: 0,
      maxUses: 300,
      isFirstBooking: false,
      isActive: true,
      startDate: now,
      endDate: twoMonthsLater,
    },
    {
      code: "SUMMER10",
      type: "PERCENT" as const,
      discountValue: 10,
      applyTo: "ALL" as const,
      minDepositAmount: 0,
      maxUses: 1000,
      isFirstBooking: false,
      isActive: true,
      startDate: now,
      endDate: twoMonthsLater,
    },
    {
      code: "VIP100K",
      type: "FIXED" as const,
      discountValue: 100000,
      applyTo: "PACKAGE" as const,
      minDepositAmount: 300000,
      maxUses: 50,
      isFirstBooking: false,
      isActive: true,
      startDate: now,
      endDate: twoMonthsLater,
    },
  ];

  for (const v of vouchers) {
    const exists = await prisma.voucher.findUnique({ where: { code: v.code } });
    if (exists) {
      console.log(`Voucher ${v.code} already exists, skipping.`);
      continue;
    }
    await prisma.voucher.create({ data: v });
    console.log(`Created voucher: ${v.code}`);
  }

  console.log("Done seeding vouchers!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
