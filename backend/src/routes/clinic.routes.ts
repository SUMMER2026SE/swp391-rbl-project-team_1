import { Router } from "express";
import {
    getAllPublicClinicsHandler,
    getNearbyClinicsHandler,
    getClinicByIdHandler
} from "../controllers/clinic.controller";

const router = Router();

router.get("/clinics", getAllPublicClinicsHandler);
router.get("/clinics/nearby", getNearbyClinicsHandler);
router.get("/clinics/:id", getClinicByIdHandler);

export default router;
