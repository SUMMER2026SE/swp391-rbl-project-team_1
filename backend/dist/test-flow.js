"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const API_URL = "http://localhost:5000/api";
const TEST_EMAIL = "testuser@medbooking.com";
const TEST_PASSWORD = "testpassword123";
async function runTest() {
    console.log("\n🚀 STARTING INTEGRATION FLOW TEST FOR EMAIL OTP AUTHENTICATION...");
    try {
        // Clean up any existing test records before starting
        await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
        await prisma.oTP.deleteMany({ where: { email: TEST_EMAIL } });
        console.log("🧹 Cleaned up existing test data.");
        // Step 1: Send OTP
        console.log(`\nStep 1: Sending OTP to ${TEST_EMAIL}...`);
        const sendOtpResponse = await axios_1.default.post(`${API_URL}/auth/send-otp`, {
            email: TEST_EMAIL,
        });
        console.log("✅ Send OTP response:", sendOtpResponse.data);
        // Fetch OTP code from database since it was generated
        const otpRecord = await prisma.oTP.findFirst({
            where: { email: TEST_EMAIL },
            orderBy: { createdAt: "desc" },
        });
        if (!otpRecord) {
            throw new Error("❌ OTP was not created in the database!");
        }
        console.log(`🔑 Retrieved OTP code from PostgreSQL: ${otpRecord.code}`);
        // Step 2: Verify OTP
        console.log(`\nStep 2: Verifying OTP ${otpRecord.code} for ${TEST_EMAIL}...`);
        const verifyOtpResponse = await axios_1.default.post(`${API_URL}/auth/verify-otp`, {
            email: TEST_EMAIL,
            otp: otpRecord.code,
        });
        console.log("✅ Verify OTP response:", verifyOtpResponse.data);
        // Verify it was marked as verified in the database
        const updatedOtpRecord = await prisma.oTP.findUnique({
            where: { id: otpRecord.id },
        });
        console.log("📊 Database OTP Verified State:", updatedOtpRecord?.verified ? "VERIFIED (true)" : "UNVERIFIED (false)");
        // Step 3: Register Account
        console.log(`\nStep 3: Registering user ${TEST_EMAIL} with password...`);
        const registerResponse = await axios_1.default.post(`${API_URL}/auth/register`, {
            email: TEST_EMAIL,
            otp: otpRecord.code,
            password: TEST_PASSWORD,
        });
        console.log("✅ Register response:", registerResponse.data);
        // Step 4: Login Account
        console.log(`\nStep 4: Logging in user ${TEST_EMAIL}...`);
        const loginResponse = await axios_1.default.post(`${API_URL}/auth/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
        });
        console.log("✅ Login response:", loginResponse.data);
        console.log("🔑 JWT Token received:", loginResponse.data.token ? "YES (Valid Token)" : "NO");
        // Step 5: Verify User saved in Database
        console.log(`\nStep 5: Verifying User record in PostgreSQL...`);
        const dbUser = await prisma.user.findUnique({
            where: { email: TEST_EMAIL },
        });
        if (!dbUser) {
            throw new Error("❌ User was not found in PostgreSQL!");
        }
        console.log("👤 Saved User Details in Database:");
        console.log(`   - ID: ${dbUser.id}`);
        console.log(`   - Email: ${dbUser.email}`);
        console.log(`   - Role: ${dbUser.role}`);
        console.log(`   - Password Hashed: ${dbUser.password && dbUser.password.startsWith("$2b$") ? "YES (bcryptjs)" : "NO"}`);
        console.log(`   - Created At: ${dbUser.createdAt}`);
        // Clean up test data after successful verification
        await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
        await prisma.oTP.deleteMany({ where: { email: TEST_EMAIL } });
        console.log("\n🧹 Cleaned up test data after successful test.");
        console.log("\n✨ ALL TESTS COMPLETED SUCCESSFULLY! FLOW IS FULLY OPERATIONAL. ✨\n");
    }
    catch (error) {
        const errMessage = error instanceof Error ? error.message : String(error);
        console.error("\n❌ TEST FAILED:", errMessage);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
runTest();
