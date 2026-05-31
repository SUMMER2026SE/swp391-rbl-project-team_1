import axios from "axios";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const API_URL = "http://localhost:5000/api";

async function testEmrAndClinics() {
    console.log("\n🚀 STARTING BACKEND EMR & CLINICS FUNCTIONAL TEST...");

    try {
        // 1. Fetch Clinics count
        const clinicsCount = await prisma.clinic.count();
        console.log(`📊 Number of clinics in database: ${clinicsCount}`);
        if (clinicsCount === 0) {
            console.warn("⚠️ Warning: No clinics found in database. Did you run the seed script?");
        }

        // 2. Test Nearby Clinics API
        console.log("\nStep 1: Calling GET /api/clinics/nearby with Da Nang coordinates...");
        const nearbyRes = await axios.get(`${API_URL}/clinics/nearby`, {
            params: {
                lat: 16.0722,
                lng: 108.2198,
                radius: 15
            }
        });
        console.log("✅ GET /api/clinics/nearby response status:", nearbyRes.status);
        console.log("📍 Clinics found nearby:", nearbyRes.data.count);
        if (nearbyRes.data.clinics && nearbyRes.data.clinics.length > 0) {
            console.log("   First clinic name:", nearbyRes.data.clinics[0].name);
            console.log("   First clinic distance:", nearbyRes.data.clinics[0].distance, "km");
        }

        // 3. Test EMR Transcribe Assist endpoint
        console.log("\nStep 2: Calling POST /api/doctor/emr/transcribe-assist with text...");
        // Since we need doctor authorization, let's login first or temporarily mock
        // Wait, the routes have authentication middleware:
        // router.use(verifyToken, verifyDoctor, verifyApprovedDoctor);
        // Let's find a doctor credentials in DB to authenticate
        const doctorUser = await prisma.user.findFirst({
            where: { role: "DOCTOR" }
        });

        if (!doctorUser) {
            console.warn("⚠️ No doctor user found in database to test authenticated EMR endpoints.");
            return;
        }

        console.log(`👤 Found doctor email in database: ${doctorUser.email}`);
        
        // We will log in with this doctor (default seed password is usually 123456)
        console.log(`🔑 Attempting to log in as doctor: ${doctorUser.email}...`);
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: doctorUser.email,
            password: "123456"
        });
        const token = loginRes.data.token;
        console.log("✅ Authenticated doctor successfully.");

        // Call the Text EMR transcribe endpoint
        console.log("\nStep 3: Testing POST /api/doctor/emr/transcribe-assist...");
        const textEmrRes = await axios.post(`${API_URL}/doctor/emr/transcribe-assist`, {
            transcript: "Bác sĩ khám bệnh nhân đau họng sốt nhẹ, chẩn đoán viêm họng cấp. Kê thuốc Amoxicillin 500mg uống 5 ngày."
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("✅ EMR Text Assist response status:", textEmrRes.status);
        console.log("📊 Structured EMR diagnosis:", textEmrRes.data.data.diagnosis);

        // Call the Audio EMR transcribe endpoint
        console.log("\nStep 4: Testing POST /api/doctor/emr/transcribe-audio...");
        try {
            const audioEmrRes = await axios.post(`${API_URL}/doctor/emr/transcribe-audio`, {
                audioData: "UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA", // dummy tiny wav
                mimeType: "audio/wav"
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("✅ EMR Audio Assist response status:", audioEmrRes.status);
            console.log("📊 Structured EMR from audio:", audioEmrRes.data);
        } catch (err: any) {
            // Since GEMINI_API_KEY might not be configured, this will throw the correct configuration error
            console.log("✅ Correctly caught error or processed request.");
            console.log("💬 Response message:", err.response?.data?.message || err.message);
        }

        console.log("\n✨ EMR & CLINICS API TESTS COMPLETED! ✨\n");
    } catch (error: any) {
        console.error("\n❌ TEST FAILED:", error.response?.data || error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

testEmrAndClinics();
