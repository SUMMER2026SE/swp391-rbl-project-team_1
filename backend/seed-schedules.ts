import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const doctors = await prisma.doctor.findMany();
  
  if (doctors.length === 0) {
    console.log("No doctors found. Please seed doctors first.");
    return;
  }

  console.log(`Found ${doctors.length} doctors. Adding schedules...`);

  let addedCount = 0;

  // Remove existing schedules for Saturday (6) and Sunday (0)
  const deleted = await prisma.doctorSchedule.deleteMany({
    where: {
      dayOfWeek: {
        in: [0, 6]
      }
    }
  });
  console.log(`Removed ${deleted.count} weekend schedule slots.`);

  for (const doctor of doctors) {
    // For each day of the week (1 = Monday to 5 = Friday)
    for (let day = 1; day <= 5; day++) {
      // Check if schedule already exists
      const existing = await prisma.doctorSchedule.findFirst({
        where: {
          doctorId: doctor.id,
          dayOfWeek: day,
          startTime: "08:00",
          endTime: "17:00"
        }
      });

      if (!existing) {
        await prisma.doctorSchedule.create({
          data: {
            doctorId: doctor.id,
            dayOfWeek: day,
            startTime: "08:00",
            endTime: "17:00",
            isAvailable: true
          }
        });
        addedCount++;
      }
    }
  }

  console.log(`Successfully added ${addedCount} schedule slots.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
