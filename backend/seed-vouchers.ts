import { PrismaClient, VoucherType, VoucherApplyTo, VoucherCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding vouchers...');

  const now = new Date();
  const plus2Months = new Date(now);
  plus2Months.setMonth(now.getMonth() + 2);

  const plus3Months = new Date(now);
  plus3Months.setMonth(now.getMonth() + 3);

  // Vouchers definition
  const vouchers = [
    {
      code: 'WELCOME10',
      type: VoucherType.PERCENT,
      discountValue: 10,
      applyTo: VoucherApplyTo.ALL,
      category: VoucherCategory.FIRST_BOOKING,
      isFirstBooking: true,
      maxUses: null, // unlimited
      startDate: now,
      endDate: plus2Months,
      description: 'Giảm 10% cho lần đầu đặt lịch tại MedBooking',
      avatarIcon: '🎁',
      avatarColor: '#0d9488', // teal
    },
    {
      code: 'MEBAU20',
      type: VoucherType.PERCENT,
      discountValue: 10,
      applyTo: VoucherApplyTo.SPECIALTY,
      category: VoucherCategory.SPECIALTY,
      isFirstBooking: false,
      maxUses: 200,
      startDate: now,
      endDate: plus3Months,
      description: 'Dành riêng cho mẹ bầu — giảm 10% khi đặt khám sản khoa',
      avatarIcon: '🤰',
      avatarColor: '#f472b6', // pink
    },
    {
      code: 'FRIEND15',
      type: VoucherType.PERCENT,
      discountValue: 10,
      applyTo: VoucherApplyTo.ALL,
      category: VoucherCategory.REFERRAL,
      isFirstBooking: false,
      maxUses: 500,
      startDate: now,
      endDate: plus3Months,
      description: 'Bạn bè giới thiệu — cùng nhau chăm sóc sức khỏe',
      avatarIcon: '👥',
      avatarColor: '#3b82f6', // blue
    },
    {
      code: 'TETAM2026',
      type: VoucherType.PERCENT,
      discountValue: 8,
      applyTo: VoucherApplyTo.ALL,
      category: VoucherCategory.HOLIDAY,
      isFirstBooking: false,
      maxUses: 1000,
      startDate: new Date('2026-01-20T00:00:00Z'),
      endDate: new Date('2026-02-10T23:59:59Z'),
      description: 'Chúc mừng năm mới — sức khỏe là vàng',
      avatarIcon: '🌸',
      avatarColor: '#ef4444', // red
    },
    {
      code: 'GOIKHAM5',
      type: VoucherType.PERCENT,
      discountValue: 5,
      applyTo: VoucherApplyTo.PACKAGE,
      category: VoucherCategory.PACKAGE,
      isFirstBooking: false,
      maxUses: null,
      startDate: now,
      endDate: plus3Months,
      description: 'Tiết kiệm 5% khi đặt gói khám tổng quát',
      avatarIcon: '📦',
      avatarColor: '#22c55e', // green
    },
    {
      code: 'BACSI10',
      type: VoucherType.FIXED,
      discountValue: 20000,
      applyTo: VoucherApplyTo.DOCTOR,
      category: VoucherCategory.DOCTOR,
      isFirstBooking: false,
      maxUses: 300,
      startDate: now,
      endDate: plus3Months,
      description: 'Giảm 20,000đ phí đặt lịch khám bác sĩ',
      avatarIcon: '🩺',
      avatarColor: '#0d9488', // teal
    },
    {
      code: 'PHUNU8M',
      type: VoucherType.PERCENT,
      discountValue: 8,
      applyTo: VoucherApplyTo.SPECIALTY,
      category: VoucherCategory.HOLIDAY,
      isFirstBooking: false,
      maxUses: 500,
      startDate: new Date('2026-03-01T00:00:00Z'),
      endDate: new Date('2026-03-15T23:59:59Z'),
      description: 'Chúc mừng ngày Phụ nữ Việt Nam — sức khỏe là món quà quý nhất',
      avatarIcon: '🌹',
      avatarColor: '#ec4899', // pink
    },
    {
      code: 'NOIDOC15',
      type: VoucherType.PERCENT,
      discountValue: 10,
      applyTo: VoucherApplyTo.SPECIALTY,
      category: VoucherCategory.SPECIALTY,
      isFirstBooking: false,
      maxUses: 150,
      startDate: now,
      endDate: plus3Months,
      description: 'Ưu đãi đặc biệt cho khám nội khoa tổng quát',
      avatarIcon: '❤️',
      avatarColor: '#ef4444', // red
    }
  ];

  for (const v of vouchers) {
    const existing = await prisma.voucher.findUnique({ where: { code: v.code } });
    if (existing) {
      await prisma.voucher.update({
        where: { code: v.code },
        data: v
      });
      console.log(`Updated voucher ${v.code}`);
    } else {
      await prisma.voucher.create({
        data: v
      });
      console.log(`Created voucher ${v.code}`);
    }
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
