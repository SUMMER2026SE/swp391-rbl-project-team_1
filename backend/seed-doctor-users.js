const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

function removeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

async function main() {
  const doctors = await prisma.doctor.findMany();
  let createdCount = 0;

  const hashedPassword = await bcrypt.hash('123456', 12);

  for (const doc of doctors) {
    const rawName = removeAccents(doc.name).toLowerCase().replace(/\s+/g, '');
    let email = `${rawName}@gmail.com`;

    // Ensure unique email
    let existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && existingUser.doctorId !== doc.id) {
       email = `${rawName}${doc.id}@gmail.com`;
       existingUser = await prisma.user.findUnique({ where: { email } });
    }

    if (!existingUser) {
      await prisma.user.create({
        data: {
          email: email,
          password: hashedPassword,
          fullName: doc.name,
          avatar: doc.avatar,
          role: 'DOCTOR',
          doctorId: doc.id
        }
      });
      createdCount++;
      console.log(`Created user for Doctor: ${doc.name} with email: ${email}`);
    } else {
        // If user exists but doctorId is not set, set it
        if (!existingUser.doctorId) {
             await prisma.user.update({
                 where: { id: existingUser.id },
                 data: { doctorId: doc.id, role: 'DOCTOR' }
             });
             console.log(`Updated existing user ${email} to be a doctor.`);
        }
    }
  }

  console.log(`Finished. Created ${createdCount} doctor user accounts.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
