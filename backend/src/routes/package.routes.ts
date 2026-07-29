import express from "express";
import { getPackages, getPackageById, getPackageBookedSlots } from "../controllers/package.controller";

const router = express.Router();

router.get("/packages", getPackages);
router.get("/packages/:id", getPackageById);
router.get("/packages/:id/booked-slots", getPackageBookedSlots);

export default router;
