"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyHealthProfile = getMyHealthProfile;
exports.updateMyHealthProfile = updateMyHealthProfile;
const health_profile_service_1 = require("../services/health-profile.service");
const apiError_1 = require("../utils/apiError");
async function getMyHealthProfile(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId)
            throw new apiError_1.ApiError("Authentication required", 401);
        const profile = await (0, health_profile_service_1.getHealthProfile)(userId);
        res.json({ message: "Health profile retrieved", data: profile });
    }
    catch (error) {
        next(error);
    }
}
async function updateMyHealthProfile(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId)
            throw new apiError_1.ApiError("Authentication required", 401);
        const { chronicConditions, allergies, medications, familyHistory, bloodType, notes } = req.body;
        const profile = await (0, health_profile_service_1.upsertHealthProfile)(userId, {
            chronicConditions,
            allergies,
            medications,
            familyHistory,
            bloodType,
            notes,
        });
        res.json({ message: "Health profile updated", data: profile });
    }
    catch (error) {
        next(error);
    }
}
