import cron from "node-cron";
import { checkAndSendReminders } from "../utils/emailService";

export function startReminderJob() {
    console.log("[CronJob] Starting reminder job scheduler (Runs every day at 8:00 AM)");
    
    // Runs at 08:00 every day
    cron.schedule("0 8 * * *", () => {
        console.log("[CronJob] Executing scheduled daily check for appointment reminders...");
        checkAndSendReminders().catch((err) => {
            console.error("[CronJob] Failed to execute reminder check:", err);
        });
    });
}
