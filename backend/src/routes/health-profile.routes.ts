import { Router } from "express";
import { Role } from "@prisma/client";
import { verifyToken } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/authorization.middleware";
import { getMyHealthProfile, updateMyHealthProfile } from "../controllers/health-profile.controller";

const router = Router();

router.get("/health-profile", verifyToken, authorizeRoles(Role.USER), getMyHealthProfile);
router.put("/health-profile", verifyToken, authorizeRoles(Role.USER), updateMyHealthProfile);

export default router;
