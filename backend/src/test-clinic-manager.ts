import axios from "axios";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const API_URL = "http://localhost:5000/api";
const MANAGER_EMAIL = "manager.choray@medbooking.com";
const MANAGER_PASSWORD = "123456";

async function runClinicManagerTest() {
    console.log("\n🚀 STARTING CLINIC MANAGER ENDPOINTS INTEGRATION TEST...");

    try {
        // Step 1: Login as Clinic Manager
        console.log(`\nStep 1: Logging in as Clinic Manager (${MANAGER_EMAIL})...`);
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: MANAGER_EMAIL,
            password: MANAGER_PASSWORD,
        });

        const token = loginResponse.data.token;
        const user = loginResponse.data.user;

        console.log("✅ Login successful!");
        console.log(`👤 Manager ID: ${user.id}`);
        console.log(`🛡️ Role: ${user.role}`);
        console.log(`🏢 Linked Clinic ID: ${user.clinicId}`);
        console.log(`🔑 Token received: YES`);

        if (user.role !== "CLINIC_MANAGER") {
            throw new Error("❌ Authenticated user is not a CLINIC_MANAGER!");
        }

        const authHeaders = {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };

        // Step 2: Get Clinic Doctors
        console.log("\nStep 2: Fetching doctors for this clinic...");
        const getDoctorsRes = await axios.get(`${API_URL}/clinic-manager/doctors`, authHeaders);
        console.log("✅ Doctors retrieved successfully!");
        console.log(`📊 Total Doctors in Clinic: ${getDoctorsRes.data.count}`);
        for (const doc of getDoctorsRes.data.data) {
            console.log(`   - ${doc.name} (Specialty ID: ${doc.specialtyId}, Experience: ${doc.experience} years)`);
        }

        // Fetch a valid specialty ID
        const specialty = await prisma.specialty.findFirst();
        if (!specialty) {
            throw new Error("❌ No specialties found in database. Seed the database first!");
        }
        console.log(`\n🩺 Using Specialty for new Doctor: ${specialty.name} (ID: ${specialty.id})`);

        // Step 3: Create Clinic Doctor
        const testDoctorEmail = "test.doctor.clinic@medbooking.com";
        // Clean up before adding if exists
        const oldUser = await prisma.user.findUnique({ where: { email: testDoctorEmail } });
        if (oldUser && oldUser.doctorId) {
            await prisma.user.update({ where: { id: oldUser.id }, data: { doctorId: null } });
            await prisma.doctorSchedule.deleteMany({ where: { doctorId: oldUser.doctorId } });
            await prisma.doctor.delete({ where: { id: oldUser.doctorId } });
            await prisma.user.delete({ where: { id: oldUser.id } });
        } else if (oldUser) {
            await prisma.user.delete({ where: { id: oldUser.id } });
        }

        console.log(`\nStep 3: Creating a new doctor under clinic: ${testDoctorEmail}...`);
        const createDoctorRes = await axios.post(
            `${API_URL}/clinic-manager/doctors`,
            {
                name: "Dr. Test Clinic Doctor",
                email: testDoctorEmail,
                specialtyId: specialty.id,
                experience: 5,
                price: 180000,
                phone: "0909999999",
                description: "Vetted doctor by clinic manager test case",
            },
            authHeaders
        );

        const newDoctor = createDoctorRes.data.data;
        console.log("✅ Doctor created successfully!");
        console.log(`👤 Doctor Name: ${newDoctor.name}`);
        console.log(`👤 Doctor ID: ${newDoctor.id}`);
        console.log(`🏨 Hospital Field: ${newDoctor.hospital}`);
        console.log(`⭐ Status: ${newDoctor.status} (Pre-approved by manager)`);

        // Step 4: Update Clinic Doctor
        console.log(`\nStep 4: Updating doctor details (ID: ${newDoctor.id})...`);
        const updateDoctorRes = await axios.put(
            `${API_URL}/clinic-manager/doctors/${newDoctor.id}`,
            {
                experience: 6,
                price: 200000,
            },
            authHeaders
        );
        console.log("✅ Doctor updated successfully!");
        console.log(`📈 New Experience: ${updateDoctorRes.data.data.experience} years`);
        console.log(`💰 New Price: ${updateDoctorRes.data.data.price} VND`);

        // Step 5: Get Clinic Doctor Schedules
        console.log("\nStep 5: Fetching schedules for this clinic...");
        const getSchedulesRes = await axios.get(`${API_URL}/clinic-manager/schedules`, authHeaders);
        console.log("✅ Schedules retrieved successfully!");
        console.log(`📊 Total Clinic Doctor Schedules: ${getSchedulesRes.data.count}`);

        // Step 6: Create Doctor Schedule
        console.log(`\nStep 6: Creating schedule for new doctor (Day 2 / Tuesday)...`);
        const createScheduleRes = await axios.post(
            `${API_URL}/clinic-manager/schedules`,
            {
                doctorId: newDoctor.id,
                dayOfWeek: 2,
                startTime: "09:00",
                endTime: "12:00",
            },
            authHeaders
        );
        console.log("✅ Schedule created successfully!");
        console.log(`   - Day of week: ${createScheduleRes.data.data.dayOfWeek}`);
        console.log(`   - Time: ${createScheduleRes.data.data.startTime} - ${createScheduleRes.data.data.endTime}`);

        // Step 7: Delete Clinic Doctor (Cleanup)
        console.log(`\nStep 7: Removing doctor (ID: ${newDoctor.id}) from clinic...`);
        const deleteDoctorRes = await axios.delete(
            `${API_URL}/clinic-manager/doctors/${newDoctor.id}`,
            authHeaders
        );
        console.log("✅ Delete response:", deleteDoctorRes.data.message);

        // Verify the Doctor is gone and User role is reverted/handled
        const deletedDoc = await prisma.doctor.findUnique({ where: { id: newDoctor.id } });
        const linkedUser = await prisma.user.findUnique({ where: { email: testDoctorEmail } });

        console.log(`📊 Verification in database:`);
        console.log(`   - Doctor Record Exists: ${deletedDoc ? "YES (Error)" : "NO (Success)"}`);
        console.log(`   - User Account Exists: ${linkedUser ? "YES" : "NO"}`);
        console.log(`   - User Account doctorId: ${linkedUser?.doctorId ? linkedUser.doctorId : "null (Success)"}`);
        console.log(`   - User Account Role: ${linkedUser?.role ? linkedUser.role : "null"} (Success)`);

        // Final cleanup of the test user account
        if (linkedUser) {
            await prisma.user.delete({ where: { id: linkedUser.id } });
            console.log("🧹 Cleaned up the test user account.");
        }

        console.log("\n✨ ALL CLINIC MANAGER API TESTS PASSED SUCCESSFULLY! ✨\n");
    } catch (error: any) {
        console.error("\n❌ TEST FAILED:", error.response?.data || error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

runClinicManagerTest();
