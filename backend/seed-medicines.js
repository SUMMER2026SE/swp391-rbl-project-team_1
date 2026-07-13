const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const medicines = [
  {
    name: 'Paracetamol 500mg',
    activeIngredient: 'Paracetamol',
    form: 'Viên nén',
    unit: 'Viên',
    defaultInstructions: 'Uống sau ăn no',
    category: 'Giảm đau, hạ sốt'
  },
  {
    name: 'Amoxicillin 500mg',
    activeIngredient: 'Amoxicillin',
    form: 'Viên nang',
    unit: 'Viên',
    defaultInstructions: 'Uống sau ăn',
    category: 'Kháng sinh'
  },
  {
    name: 'Oresol',
    activeIngredient: 'Điện giải',
    form: 'Gói',
    unit: 'Gói',
    defaultInstructions: 'Pha với 200ml nước, uống thay nước',
    category: 'Bù nước'
  },
  {
    name: 'Vitamin C 500mg',
    activeIngredient: 'Ascorbic acid',
    form: 'Viên sủi',
    unit: 'Viên',
    defaultInstructions: 'Hòa tan vào 200ml nước, uống ban ngày',
    category: 'Vitamin & Khoáng chất'
  },
  {
    name: 'Loratadine 10mg',
    activeIngredient: 'Loratadine',
    form: 'Viên nén',
    unit: 'Viên',
    defaultInstructions: 'Uống buổi tối trước khi ngủ',
    category: 'Kháng dị ứng'
  }
];

async function main() {
  console.log('Seeding medicines...');
  for (const med of medicines) {
    await prisma.medicine.create({ data: med });
  }
  console.log('Medicines seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
