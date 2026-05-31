import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware";
import {
    listPublishedArticles,
    getArticleById,
    getPersonalizedArticlesHandler,
    listArticlesBySpecialty,
} from "../controllers/article.controller";

const router = Router();

router.get("/articles", listPublishedArticles);
router.get("/articles/personalized", verifyToken, getPersonalizedArticlesHandler);
router.get("/articles/specialty/:specialtyId", listArticlesBySpecialty);
router.get("/articles/:id", getArticleById);

export default router;
