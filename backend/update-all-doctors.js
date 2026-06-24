const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

function removeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'DOCTOR' },
    include: { doctor: true }
  });

  const hashedPassword = await bcrypt.hash('123456', 12);
  let updatedCount = 0;

  for (const user of users) {
    if (user.doctor) {
      const rawName = removeAccents(user.doctor.name).toLowerCase().replace(/\s+/g, '');
      let email = `${rawName}@gmail.com`;

      // Check if email already taken by someone else
      let existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== user.id) {
          email = `${rawName}${user.doctor.id}@gmail.com`;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          email: email,
          password: hashedPassword
        }
      });
      updatedCount++;
      console.log(`Updated doctor ${user.doctor.name} -> ${email}`);
    }
  }

  console.log(`Successfully updated ${updatedCount} doctor accounts.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
