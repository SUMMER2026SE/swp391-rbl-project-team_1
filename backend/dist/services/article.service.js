"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublishedArticles = getPublishedArticles;
exports.getPublishedArticleById = getPublishedArticleById;
exports.getPersonalizedArticles = getPersonalizedArticles;
exports.getArticlesBySpecialty = getArticlesBySpecialty;
const client_1 = __importDefault(require("../prisma/client"));
async function getPublishedArticles() {
    return client_1.default.article.findMany({
        where: { published: true },
        include: { specialty: { select: { id: true, name: true, slug: true, icon: true } } },
        orderBy: { createdAt: "desc" },
    });
}
async function getPublishedArticleById(id) {
    return client_1.default.article.findFirst({
        where: { id, published: true },
        include: { specialty: { select: { id: true, name: true, slug: true, icon: true } } },
    });
}
/**
 * Personalized articles: specialtyIds from user's past appointments, then general (no specialty).
 */
async function getPersonalizedArticles(userId) {
    const appointments = await client_1.default.appointment.findMany({
        where: { userId },
        select: { doctor: { select: { specialtyId: true } } },
        distinct: ["doctorId"],
    });
    const specialtyIds = [
        ...new Set(appointments.map((a) => a.doctor.specialtyId).filter(Boolean)),
    ];
    const baseInclude = {
        specialty: { select: { id: true, name: true, slug: true, icon: true } },
    };
    let personalized = [];
    if (specialtyIds.length > 0) {
        personalized = await client_1.default.article.findMany({
            where: { published: true, specialtyId: { in: specialtyIds } },
            include: baseInclude,
            orderBy: { createdAt: "desc" },
            take: 20,
        });
    }
    const general = await client_1.default.article.findMany({
        where: { published: true, specialtyId: null },
        include: baseInclude,
        orderBy: { createdAt: "desc" },
        take: 10,
    });
    return { personalized, general };
}
async function getArticlesBySpecialty(specialtyId) {
    return client_1.default.article.findMany({
        where: { published: true, specialtyId },
        include: { specialty: { select: { id: true, name: true, slug: true, icon: true } } },
        orderBy: { createdAt: "desc" },
    });
}
