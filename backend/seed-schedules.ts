import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const doctors = await prisma.doctor.findMany();
  
  if (doctors.length === 0) {
    console.log("No doctors found. Please seed doctors first.");
    return;
  }

  console.log(`Found ${doctors.length} doctors. Resetting and adding schedules...`);

  // Remove existing schedules to start fresh
  const deleted = await prisma.doctorSchedule.deleteMany();
  console.log(`Removed ${deleted.count} existing schedule slots.`);

  const scheduleData = [];

  for (const doctor of doctors) {
    // For each day of the week (1 = Monday to 5 = Friday)
    for (let day = 1; day <= 5; day++) {
      // Morning Slot: 08:00 to 12:00
      scheduleData.push({
        doctorId: doctor.id,
        dayOfWeek: day,
        startTime: "08:00",
        endTime: "12:00",
        isAvailable: true
      });

      // Afternoon Slot: 13:00 to 17:00
      scheduleData.push({
        doctorId: doctor.id,
        dayOfWeek: day,
        startTime: "13:00",
        endTime: "17:00",
        isAvailable: true
      });
    }
  }

  const result = await prisma.doctorSchedule.createMany({
    data: scheduleData,
    skipDuplicates: true, // optional
  });

  console.log(`Successfully added ${result.count} schedule slots (Morning & Afternoon, Mon-Fri).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
