import { NextFunction, Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";
import {
    getAllArticles,
    createArticle,
    updateArticle,
    deleteArticle,
} from "../services/admin-articles.service";
import { ApiError } from "../utils/apiError";

/**
 * GET /api/admin/articles
 * Returns all articles ordered by createdAt desc.
 */
export async function getArticles(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const articles = await getAllArticles();
        res.json({
            message: "Articles retrieved successfully",
            count: articles.length,
            data: articles,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/admin/articles
 * Creates a new article.
 */
export async function createArticleHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { title, content, thumbnail, published } = req.body as {
            title?: string;
            content?: string;
            thumbnail?: string;
            published?: boolean;
        };

        if (!title || !content) {
            throw new ApiError("Title and content are required", 400);
        }

        const article = await createArticle({ title, content, thumbnail, published });
        res.status(201).json({
            message: "Article created successfully",
            data: article,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/admin/articles/:id
 * Updates an existing article.
 */
export async function updateArticleHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = req.params.id as string;

        if (!id) {
            throw new ApiError("Article ID is required", 400);
        }

        const { title, content, thumbnail, published } = req.body as {
            title?: string;
            content?: string;
            thumbnail?: string;
            published?: boolean;
        };

        const article = await updateArticle(id, { title, content, thumbnail, published });
        res.json({
            message: "Article updated successfully",
            data: article,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/admin/articles/:id
 * Deletes an article.
 */
export async function deleteArticleHandler(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = req.params.id as string;

        if (!id) {
            throw new ApiError("Article ID is required", 400);
        }

        await deleteArticle(id);
        res.json({
            message: "Article deleted successfully",
        });
    } catch (error) {
        next(error);
    }
}
