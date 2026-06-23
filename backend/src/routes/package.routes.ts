import express from "express";
import { getPackages } from "../controllers/package.controller";

const router = express.Router();

router.get("/packages", getPackages);

export default router;
