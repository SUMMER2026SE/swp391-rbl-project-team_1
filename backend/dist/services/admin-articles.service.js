"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllArticles = getAllArticles;
exports.createArticle = createArticle;
exports.updateArticle = updateArticle;
exports.deleteArticle = deleteArticle;
const client_1 = __importDefault(require("../prisma/client"));
const apiError_1 = require("../utils/apiError");
/**
 * Returns all articles ordered by createdAt desc.
 */
async function getAllArticles() {
    return client_1.default.article.findMany({
        orderBy: { createdAt: "desc" },
    });
}
/**
 * Creates a new article.
 */
async function createArticle(input) {
    return client_1.default.article.create({
        data: {
            title: input.title,
            content: input.content,
            thumbnail: input.thumbnail,
            published: input.published ?? false,
        },
    });
}
/**
 * Updates an existing article.
 */
async function updateArticle(id, input) {
    const article = await client_1.default.article.findUnique({ where: { id } });
    if (!article) {
        throw new apiError_1.ApiError("Article not found", 404);
    }
    return client_1.default.article.update({
        where: { id },
        data: {
            ...(input.title !== undefined && { title: input.title }),
            ...(input.content !== undefined && { content: input.content }),
            ...(input.thumbnail !== undefined && { thumbnail: input.thumbnail }),
            ...(input.published !== undefined && { published: input.published }),
        },
    });
}
/**
 * Deletes an article.
 */
async function deleteArticle(id) {
    const article = await client_1.default.article.findUnique({ where: { id } });
    if (!article) {
        throw new apiError_1.ApiError("Article not found", 404);
    }
    await client_1.default.article.delete({ where: { id } });
}
