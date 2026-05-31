import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearDatabase() {
    console.log("🗑️ STARTING COMPLETE DATABASE CLEANUP...");

    try {
        // Delete in reverse order of foreign key dependencies to avoid constraints issues
        console.log("⌛ Clearing tables...");

        await prisma.prescription.deleteMany({});
        console.log("   ✅ Cleared Prescriptions");

        await prisma.medicalRecord.deleteMany({});
        console.log("   ✅ Cleared Medical Records");

        await prisma.review.deleteMany({});
        console.log("   ✅ Cleared Reviews");

        await prisma.appointment.deleteMany({});
        console.log("   ✅ Cleared Appointments");

        await prisma.doctorSchedule.deleteMany({});
        console.log("   ✅ Cleared Doctor Schedules");

        await prisma.medicalConsentToken.deleteMany({});
        console.log("   ✅ Cleared Medical Consent Tokens");

        await prisma.healthProfile.deleteMany({});
        console.log("   ✅ Cleared Health Profiles");

        await prisma.notification.deleteMany({});
        console.log("   ✅ Cleared Notifications");

        await prisma.complaint.deleteMany({});
        console.log("   ✅ Cleared Complaints");

        await prisma.article.deleteMany({});
        console.log("   ✅ Cleared Articles");

        // Set doctorId to null in User table to avoid breaking Doctor deletion
        await prisma.user.updateMany({
            data: { doctorId: null }
        });
        
        await prisma.doctor.deleteMany({});
        console.log("   ✅ Cleared Doctors");

        await prisma.user.deleteMany({});
        console.log("   ✅ Cleared Users");

        await prisma.clinic.deleteMany({});
        console.log("   ✅ Cleared Clinics");

        await prisma.specialty.deleteMany({});
        console.log("   ✅ Cleared Specialties");

        await prisma.oTP.deleteMany({});
        console.log("   ✅ Cleared OTPs");

        console.log("\n✨ DATABASE IS NOW COMPLETELY EMPTY AND CLEAN! ✨");
    } catch (error) {
        console.error("❌ Cleanup failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

clearDatabase();
