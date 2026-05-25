import { NextFunction, Request, Response } from "express";

import { ApiError, isApiError } from "../utils/apiError";

export function errorHandler(
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    if (isApiError(error)) {
        res.status(error.statusCode).json({
            message: error.message,
            details: error.details,
        });
        return;
    }

    if (error instanceof Error) {
        res.status(500).json({ message: error.message });
        return;
    }

    res.status(500).json({ message: "Unexpected error" });
}
