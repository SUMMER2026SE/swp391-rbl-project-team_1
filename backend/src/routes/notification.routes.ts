import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware";
import {
    listMyNotifications,
    markNotificationAsRead,
    markAllAsRead,
    runAppointmentReminders,
} from "../controllers/notification.controller";

const router = Router();

router.get("/notifications", verifyToken, listMyNotifications);
router.patch("/notifications/read-all", verifyToken, markAllAsRead);
router.patch("/notifications/:id/read", verifyToken, markNotificationAsRead);
router.post("/internal/appointment-reminders", runAppointmentReminders);

export default router;
