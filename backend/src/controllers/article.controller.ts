import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import {
    getPublishedArticles,
    getPublishedArticleById,
    getPersonalizedArticles,
    getArticlesBySpecialty,
} from "../services/article.service";
import { ApiError } from "../utils/apiError";

export async function listPublishedArticles(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const articles = await getPublishedArticles();
        res.json({ message: "Articles retrieved", count: articles.length, data: articles });
    } catch (error) {
        next(error);
    }
}

export async function getArticleById(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = req.params.id as string;
        const article = await getPublishedArticleById(id);

        if (!article) {
            throw new ApiError("Article not found", 404);
        }

        res.json({ message: "Article retrieved", data: article });
    } catch (error) {
        next(error);
    }
}

export async function getPersonalizedArticlesHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.userId;
        if (!userId) throw new ApiError("Authentication required", 401);

        const result = await getPersonalizedArticles(userId);
        res.json({
            message: "Personalized articles retrieved",
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

export async function listArticlesBySpecialty(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const specialtyId = req.params.specialtyId as string;
        const articles = await getArticlesBySpecialty(specialtyId);
        res.json({ message: "Articles retrieved", count: articles.length, data: articles });
    } catch (error) {
        next(error);
    }
}
