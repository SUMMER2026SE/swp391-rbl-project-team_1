import { sendOtpToEmail } from "./src/services/auth.service";

async function test() {
    try {
        console.log("Testing sendOtpToEmail...");
        await sendOtpToEmail("test@example.com");
        console.log("Success sendOtpToEmail");
    } catch (e) {
        console.error("Error sendOtpToEmail:", e);
    }
}

test();
