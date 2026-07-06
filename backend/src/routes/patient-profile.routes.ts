import { Router } from "express";
import {
    getMyPatientProfiles,
    createPatientProfile,
    updatePatientProfile,
    deletePatientProfile
} from "../controllers/patient-profile.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

router.use(verifyToken);

router.get("/", getMyPatientProfiles);
router.post("/", createPatientProfile);
router.put("/:id", updatePatientProfile);
router.delete("/:id", deletePatientProfile);

export default router;
