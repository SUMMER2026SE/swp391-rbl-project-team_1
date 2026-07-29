import { Router } from "express";
import { getMyProfiles, createProfile, updateProfile, deleteProfile } from "../controllers/booking-profile.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

router.use(verifyToken);

router.get("/", getMyProfiles);
router.post("/", createProfile);
router.put("/:id", updateProfile);
router.delete("/:id", deleteProfile);

export default router;
