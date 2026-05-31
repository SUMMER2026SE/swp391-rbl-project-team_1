"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gps_service_1 = require("../services/gps.service");
const apiError_1 = require("../utils/apiError");
const router = (0, express_1.Router)();
/**
 * GET /api/clinics/nearby
 * Tìm kiếm phòng khám lân cận dựa trên lat, lng truyền vào từ query
 */
router.get("/clinics/nearby", async (req, res, next) => {
    try {
        const latStr = req.query.lat;
        const lngStr = req.query.lng;
        const radiusStr = req.query.radius;
        if (!latStr || !lngStr) {
            throw new apiError_1.ApiError("Vĩ độ (lat) và Kinh độ (lng) là bắt buộc", 400);
        }
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);
        const radius = radiusStr ? parseFloat(radiusStr) : 10; // Mặc định 10km
        if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
            throw new apiError_1.ApiError("Tham số tọa độ hoặc bán kính không hợp lệ", 400);
        }
        const clinics = await (0, gps_service_1.findNearbyClinics)(lat, lng, radius);
        res.json({
            message: "Tìm thấy danh sách phòng khám lân cận",
            data: clinics,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/doctors/nearby
 * Tìm kiếm bác sĩ lân cận dựa trên lat, lng truyền vào từ query
 */
router.get("/doctors/nearby", async (req, res, next) => {
    try {
        const latStr = req.query.lat;
        const lngStr = req.query.lng;
        const radiusStr = req.query.radius;
        if (!latStr || !lngStr) {
            throw new apiError_1.ApiError("Vĩ độ (lat) và Kinh độ (lng) là bắt buộc", 400);
        }
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);
        const radius = radiusStr ? parseFloat(radiusStr) : 10; // Mặc định 10km
        if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
            throw new apiError_1.ApiError("Tham số tọa độ hoặc bán kính không hợp lệ", 400);
        }
        const doctors = await (0, gps_service_1.findNearbyDoctors)(lat, lng, radius);
        res.json({
            message: "Tìm thấy danh sách bác sĩ lân cận",
            data: doctors,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
