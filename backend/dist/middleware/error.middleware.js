"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const apiError_1 = require("../utils/apiError");
function errorHandler(err, _req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) {
    console.error('Error Intercepted:', err);
    if (err instanceof apiError_1.ApiError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message
        });
        return;
    }
    // Handle Prisma Database Errors
    if (err.name === 'PrismaClientKnownRequestError') {
        // P2002 represents Unique constraint violation
        if (err.message.includes('P2002')) {
            res.status(409).json({
                success: false,
                message: 'A record with this unique field value already exists.'
            });
            return;
        }
        // P2025 represents Record not found
        if (err.message.includes('P2025')) {
            res.status(404).json({
                success: false,
                message: 'The requested record could not be found.'
            });
            return;
        }
    }
    // Fallback to 500 Internal Server Error
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
    });
}
