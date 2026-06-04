import { Request, Response, NextFunction } from "express";
import axios from "axios";
import prisma from "../prisma/client";

/**
 * GET /api/articles
 * Public: Returns all published system articles from the database ordered by createdAt desc.
 */
export async function getPublicArticles(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const articles = await prisma.article.findMany({
            where: { published: true },
            orderBy: { createdAt: "desc" },
        });

        res.json({
            message: "Public articles retrieved successfully",
            count: articles.length,
            data: articles,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/articles/realtime
 * Public: Scrapes and parses the real-time health news RSS feed from VnExpress.
 */
export async function getRealtimeArticles(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const response = await axios.get("https://vnexpress.net/rss/suc-khoe.rss", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });
        const xml = response.data;

        // Simple RSS parser using Regex
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        const items = [];

        while ((match = itemRegex.exec(xml)) !== null) {
            const itemContent = match[1];

            // Extract Title
            const titleMatch = itemContent.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || itemContent.match(/<title>([\s\S]*?)<\/title>/);
            const title = titleMatch ? titleMatch[1].trim() : "";

            // Extract Link
            const linkMatch = itemContent.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/) || itemContent.match(/<link>([\s\S]*?)<\/link>/);
            const link = linkMatch ? linkMatch[1].trim() : "";

            // Extract pubDate
            const pubDateMatch = itemContent.match(/<pubDate><!\[CDATA\[([\s\S]*?)\]\]><\/pubDate>/) || itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
            const pubDate = pubDateMatch ? pubDateMatch[1].trim() : "";

            // Extract Description
            const descMatch = itemContent.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || itemContent.match(/<description>([\s\S]*?)<\/description>/);
            const descriptionHtml = descMatch ? descMatch[1].trim() : "";

            // Extract thumbnail and text summary from description
            let thumbnail = "";
            let summary = "";

            const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
            const imgMatch = descriptionHtml.match(imgRegex);
            if (imgMatch) {
                thumbnail = imgMatch[1];
            }

            // Remove HTML tags to get pure text summary
            summary = descriptionHtml.replace(/<[^>]*>/g, "").trim();

            items.push({
                title,
                link,
                pubDate,
                thumbnail,
                summary
            });
        }

        res.json({
            message: "Real-time health articles fetched successfully",
            count: items.length,
            data: items,
        });
    } catch (error) {
        next(error);
    }
}
