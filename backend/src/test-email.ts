import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function testEmail() {
    console.log("Starting SMTP Diagnostic Test...");
    console.log("MAIL_USER:", process.env.MAIL_USER);
    console.log("MAIL_PASSWORD length:", process.env.MAIL_PASSWORD ? process.env.MAIL_PASSWORD.length : 0);

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASSWORD,
        },
        debug: true, // Enable debug output
        logger: true // Log information to console
    });

    const mailOptions = {
        from: process.env.MAIL_USER,
        to: process.env.MAIL_USER, // Send to self for testing
        subject: "SMTP Test - MedBooking Diagnostics",
        text: "This is a diagnostic test email to verify Nodemailer and Gmail App Password settings."
    };

    try {
        console.log("Sending diagnostic email...");
        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Diagnostic Email Sent Successfully!");
        console.log("Message ID:", info.messageId);
        console.log("Response:", info.response);
    } catch (error) {
        console.error("❌ Diagnostic Email Failed:", error);
    }
}

testEmail();
