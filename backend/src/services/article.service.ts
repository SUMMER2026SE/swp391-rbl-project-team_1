import { Article, Prisma } from "@prisma/client";
import prisma from "../prisma/client";

type ArticleWithSpecialty = Prisma.ArticleGetPayload<{
    include: { specialty: { select: { id: true; name: true; slug: true; icon: true } } };
}>;

export async function getPublishedArticles(): Promise<ArticleWithSpecialty[]> {
    return prisma.article.findMany({
        where: { published: true },
        include: { specialty: { select: { id: true, name: true, slug: true, icon: true } } },
        orderBy: { createdAt: "desc" },
    });
}

export async function getPublishedArticleById(id: string): Promise<ArticleWithSpecialty | null> {
    return prisma.article.findFirst({
        where: { id, published: true },
        include: { specialty: { select: { id: true, name: true, slug: true, icon: true } } },
    });
}

/**
 * Personalized articles: specialtyIds from user's past appointments, then general (no specialty).
 */
export async function getPersonalizedArticles(userId: string): Promise<{
    personalized: ArticleWithSpecialty[];
    general: ArticleWithSpecialty[];
}> {
    const appointments = await prisma.appointment.findMany({
        where: { userId },
        select: { doctor: { select: { specialtyId: true } } },
        distinct: ["doctorId"],
    });

    const specialtyIds = [
        ...new Set(appointments.map((a) => a.doctor.specialtyId).filter(Boolean)),
    ] as string[];

    const baseInclude = {
        specialty: { select: { id: true, name: true, slug: true, icon: true } },
    } as const;

    let personalized: ArticleWithSpecialty[] = [];

    if (specialtyIds.length > 0) {
        personalized = await prisma.article.findMany({
            where: { published: true, specialtyId: { in: specialtyIds } },
            include: baseInclude,
            orderBy: { createdAt: "desc" },
            take: 20,
        });
    }

    const general = await prisma.article.findMany({
        where: { published: true, specialtyId: null },
        include: baseInclude,
        orderBy: { createdAt: "desc" },
        take: 10,
    });

    return { personalized, general };
}

export async function getArticlesBySpecialty(specialtyId: string): Promise<ArticleWithSpecialty[]> {
    return prisma.article.findMany({
        where: { published: true, specialtyId },
        include: { specialty: { select: { id: true, name: true, slug: true, icon: true } } },
        orderBy: { createdAt: "desc" },
    });
}
