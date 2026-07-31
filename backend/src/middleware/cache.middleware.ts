import { Request, Response, NextFunction } from "express";

const cache = new Map<string, { data: any; expiry: number }>();

export const cacheMiddleware = (ttlSeconds: number) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Only cache GET requests
        if (req.method !== "GET") {
            return next();
        }

        const key = req.originalUrl;
        const cachedResponse = cache.get(key);

        if (cachedResponse && cachedResponse.expiry > Date.now()) {
            return res.json(cachedResponse.data);
        }

        // Override res.json to cache the response before sending
        const originalJson = res.json;
        res.json = (body: any) => {
            cache.set(key, {
                data: body,
                expiry: Date.now() + ttlSeconds * 1000,
            });
            return originalJson.call(res, body);
        };

        next();
    };
};

export const clearCache = (prefix?: string) => {
    if (prefix) {
        for (const key of cache.keys()) {
            if (key.startsWith(prefix)) {
                cache.delete(key);
            }
        }
    } else {
        cache.clear();
    }
};
