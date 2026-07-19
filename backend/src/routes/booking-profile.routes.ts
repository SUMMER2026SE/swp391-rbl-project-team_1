import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware";
import {
    getMyBookingProfiles,
    createBookingProfile,
    updateBookingProfile,
    deleteBookingProfile
} from "../controllers/booking-profile.controller";

const router = Router();

// Apply auth middleware to all routes
router.use(verifyToken);

router.get("/", getMyBookingProfiles);
router.post("/", createBookingProfile);
router.put("/:id", updateBookingProfile);
router.delete("/:id", deleteBookingProfile);

export default router;
