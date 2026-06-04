import { Router } from "express";
import { getPublicArticles, getRealtimeArticles } from "../controllers/article.controller";

const router = Router();

// Publicly accessible article routes
router.get("/articles", getPublicArticles);
router.get("/articles/realtime", getRealtimeArticles);

export default router;
