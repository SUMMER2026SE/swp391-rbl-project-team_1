"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArticles = getArticles;
exports.createArticleHandler = createArticleHandler;
exports.updateArticleHandler = updateArticleHandler;
exports.deleteArticleHandler = deleteArticleHandler;
const admin_articles_service_1 = require("../services/admin-articles.service");
const apiError_1 = require("../utils/apiError");
/**
 * GET /api/admin/articles
 * Returns all articles ordered by createdAt desc.
 */
async function getArticles(_req, res, next) {
    try {
        const articles = await (0, admin_articles_service_1.getAllArticles)();
        res.json({
            message: "Articles retrieved successfully",
            count: articles.length,
            data: articles,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * POST /api/admin/articles
 * Creates a new article.
 */
async function createArticleHandler(req, res, next) {
    try {
        const { title, content, thumbnail, published } = req.body;
        if (!title || !content) {
            throw new apiError_1.ApiError("Title and content are required", 400);
        }
        const article = await (0, admin_articles_service_1.createArticle)({ title, content, thumbnail, published });
        res.status(201).json({
            message: "Article created successfully",
            data: article,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * PUT /api/admin/articles/:id
 * Updates an existing article.
 */
async function updateArticleHandler(req, res, next) {
    try {
        const id = req.params.id;
        if (!id) {
            throw new apiError_1.ApiError("Article ID is required", 400);
        }
        const { title, content, thumbnail, published } = req.body;
        const article = await (0, admin_articles_service_1.updateArticle)(id, { title, content, thumbnail, published });
        res.json({
            message: "Article updated successfully",
            data: article,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * DELETE /api/admin/articles/:id
 * Deletes an article.
 */
async function deleteArticleHandler(req, res, next) {
    try {
        const id = req.params.id;
        if (!id) {
            throw new apiError_1.ApiError("Article ID is required", 400);
        }
        await (0, admin_articles_service_1.deleteArticle)(id);
        res.json({
            message: "Article deleted successfully",
        });
    }
    catch (error) {
        next(error);
    }
}
