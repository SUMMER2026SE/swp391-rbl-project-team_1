"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPublishedArticles = listPublishedArticles;
exports.getArticleById = getArticleById;
exports.getPersonalizedArticlesHandler = getPersonalizedArticlesHandler;
exports.listArticlesBySpecialty = listArticlesBySpecialty;
const article_service_1 = require("../services/article.service");
const apiError_1 = require("../utils/apiError");
async function listPublishedArticles(_req, res, next) {
    try {
        const articles = await (0, article_service_1.getPublishedArticles)();
        res.json({ message: "Articles retrieved", count: articles.length, data: articles });
    }
    catch (error) {
        next(error);
    }
}
async function getArticleById(req, res, next) {
    try {
        const id = req.params.id;
        const article = await (0, article_service_1.getPublishedArticleById)(id);
        if (!article) {
            throw new apiError_1.ApiError("Article not found", 404);
        }
        res.json({ message: "Article retrieved", data: article });
    }
    catch (error) {
        next(error);
    }
}
async function getPersonalizedArticlesHandler(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId)
            throw new apiError_1.ApiError("Authentication required", 401);
        const result = await (0, article_service_1.getPersonalizedArticles)(userId);
        res.json({
            message: "Personalized articles retrieved",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
}
async function listArticlesBySpecialty(req, res, next) {
    try {
        const specialtyId = req.params.specialtyId;
        const articles = await (0, article_service_1.getArticlesBySpecialty)(specialtyId);
        res.json({ message: "Articles retrieved", count: articles.length, data: articles });
    }
    catch (error) {
        next(error);
    }
}
