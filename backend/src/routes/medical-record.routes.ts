import { Router } from "express";
import { Role } from "@prisma/client";
import { verifyToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/authorization.middleware";
import {
    listMyMedicalRecords,
    getMyMedicalRecord,
    listMyPrescriptions,
} from "../controllers/medical-record.controller";

const router = Router();

router.get("/medical-records", verifyToken, authorizeRoles(Role.USER), listMyMedicalRecords);
router.get("/medical-records/:id", verifyToken, authorizeRoles(Role.USER), getMyMedicalRecord);
router.get(
    "/medical-records/:medicalRecordId/prescriptions",
    verifyToken,
    authorizeRoles(Role.USER),
    listMyPrescriptions
);

export default router;
