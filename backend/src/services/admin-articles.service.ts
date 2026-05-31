import prisma from "../prisma/client";
import { Article } from "@prisma/client";
import { ApiError } from "../utils/apiError";

interface CreateArticleInput {
    title: string;
    content: string;
    thumbnail?: string;
    published?: boolean;
    specialtyId?: string | null;
}

interface UpdateArticleInput {
    title?: string;
    content?: string;
    thumbnail?: string;
    published?: boolean;
    specialtyId?: string | null;
}

/**
 * Returns all articles ordered by createdAt desc.
 */
export async function getAllArticles() {
    return prisma.article.findMany({
        include: { specialty: { select: { id: true, name: true, slug: true } } },
        orderBy: { createdAt: "desc" },
    });
}

/**
 * Creates a new article.
 */
export async function createArticle(input: CreateArticleInput): Promise<Article> {
    if (input.specialtyId) {
        const specialty = await prisma.specialty.findUnique({ where: { id: input.specialtyId } });
        if (!specialty) {
            throw new ApiError("Specialty not found", 404);
        }
    }

    return prisma.article.create({
        data: {
            title: input.title,
            content: input.content,
            thumbnail: input.thumbnail,
            published: input.published ?? false,
            specialtyId: input.specialtyId ?? null,
        },
    });
}

/**
 * Updates an existing article.
 */
export async function updateArticle(
    id: string,
    input: UpdateArticleInput
): Promise<Article> {
    const article = await prisma.article.findUnique({ where: { id } });

    if (!article) {
        throw new ApiError("Article not found", 404);
    }

    if (input.specialtyId) {
        const specialty = await prisma.specialty.findUnique({ where: { id: input.specialtyId } });
        if (!specialty) {
            throw new ApiError("Specialty not found", 404);
        }
    }

    return prisma.article.update({
        where: { id },
        data: {
            ...(input.title !== undefined && { title: input.title }),
            ...(input.content !== undefined && { content: input.content }),
            ...(input.thumbnail !== undefined && { thumbnail: input.thumbnail }),
            ...(input.published !== undefined && { published: input.published }),
            ...(input.specialtyId !== undefined && { specialtyId: input.specialtyId }),
        },
    });
}

/**
 * Deletes an article.
 */
export async function deleteArticle(id: string): Promise<void> {
    const article = await prisma.article.findUnique({ where: { id } });

    if (!article) {
        throw new ApiError("Article not found", 404);
    }

    await prisma.article.delete({ where: { id } });
}
