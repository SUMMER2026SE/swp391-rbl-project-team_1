const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const vouchers = await prisma.voucher.findMany({ take: 10 });
  console.log('Vouchers:', JSON.stringify(vouchers.map((v: any) => ({ id: v.id, code: v.code, type: v.type, discountValue: v.discountValue }))));

  const appts = await prisma.appointment.findMany({
    where: { status: 'COMPLETED' },
    include: { voucherUsage: true },
    take: 20
  });
  const available = appts.filter((a: any) => !a.voucherUsage);
  console.log('Available COMPLETED appts (no voucher yet):', available.length);
  console.log(JSON.stringify(available.map((a: any) => ({ id: a.id, amount: a.amount }))));

  await prisma.$disconnect();
}

main().catch(console.error);
