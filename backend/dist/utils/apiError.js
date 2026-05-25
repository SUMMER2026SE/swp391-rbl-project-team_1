"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isApiError = exports.ApiError = void 0;
class ApiError extends Error {
    constructor(message, statusCode = 500, details) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}
exports.ApiError = ApiError;
const isApiError = (error) => {
    return error instanceof ApiError;
};
exports.isApiError = isApiError;
