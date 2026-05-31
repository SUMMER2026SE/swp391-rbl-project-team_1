import { Router } from "express";
import { Role } from "@prisma/client";
import { verifyToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/authorization.middleware";
import {
    submitComplaint,
    listMyComplaints,
    getMyComplaint,
} from "../controllers/complaint.controller";

const router = Router();

router.post("/complaints", verifyToken, authorizeRoles(Role.USER), submitComplaint);
router.get("/complaints", verifyToken, authorizeRoles(Role.USER), listMyComplaints);
router.get("/complaints/:id", verifyToken, authorizeRoles(Role.USER), getMyComplaint);

export default router;
