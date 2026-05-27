"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, "../.env") });
async function testEmail() {
    console.log("Starting SMTP Diagnostic Test...");
    console.log("MAIL_USER:", process.env.MAIL_USER);
    console.log("MAIL_PASSWORD length:", process.env.MAIL_PASSWORD ? process.env.MAIL_PASSWORD.length : 0);
    const transporter = nodemailer_1.default.createTransport({
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
    }
    catch (error) {
        console.error("❌ Diagnostic Email Failed:", error);
    }
}
testEmail();
