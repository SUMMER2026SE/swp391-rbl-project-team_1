"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startReminderJob = startReminderJob;
const node_cron_1 = __importDefault(require("node-cron"));
const emailService_1 = require("../utils/emailService");
function startReminderJob() {
    console.log("[CronJob] Starting reminder job scheduler (Runs every day at 8:00 AM)");
    // Runs at 08:00 every day
    node_cron_1.default.schedule("0 8 * * *", () => {
        console.log("[CronJob] Executing scheduled daily check for appointment reminders...");
        (0, emailService_1.checkAndSendReminders)().catch((err) => {
            console.error("[CronJob] Failed to execute reminder check:", err);
        });
    });
}
