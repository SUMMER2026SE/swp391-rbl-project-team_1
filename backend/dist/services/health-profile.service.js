"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealthProfile = getHealthProfile;
exports.upsertHealthProfile = upsertHealthProfile;
const client_1 = __importDefault(require("../prisma/client"));
const apiError_1 = require("../utils/apiError");
async function getHealthProfile(userId) {
    return client_1.default.healthProfile.findUnique({ where: { userId } });
}
async function upsertHealthProfile(userId, input) {
    const user = await client_1.default.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new apiError_1.ApiError("User not found", 404);
    }
    return client_1.default.healthProfile.upsert({
        where: { userId },
        create: { userId, ...input },
        update: { ...input },
    });
}
