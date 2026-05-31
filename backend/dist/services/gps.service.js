"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDistance = calculateDistance;
exports.findNearbyClinics = findNearbyClinics;
exports.findNearbyDoctors = findNearbyDoctors;
const client_1 = __importDefault(require("../prisma/client"));
/**
 * Tính khoảng cách giữa 2 tọa độ GPS bằng công thức Haversine (đơn vị: km)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Bán kính Trái Đất (km)
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
/**
 * Tìm các phòng khám lân cận sắp xếp từ gần đến xa
 */
async function findNearbyClinics(lat, lng, radiusKm = 10) {
    const clinics = await client_1.default.clinic.findMany({
        include: {
            _count: { select: { doctors: true } },
        },
    });
    const results = clinics
        .map((clinic) => {
        if (clinic.latitude === null || clinic.longitude === null) {
            return { ...clinic, distance: null };
        }
        const distance = calculateDistance(lat, lng, clinic.latitude, clinic.longitude);
        return { ...clinic, distance };
    })
        .filter((clinic) => clinic.distance !== null && clinic.distance <= radiusKm)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    return results;
}
/**
 * Tìm các bác sĩ lân cận sắp xếp từ gần đến xa dựa trên tọa độ phòng khám hoặc tọa độ riêng của bác sĩ
 */
async function findNearbyDoctors(lat, lng, radiusKm = 10) {
    const doctors = await client_1.default.doctor.findMany({
        include: {
            specialty: true,
            clinic: true,
        },
    });
    const results = doctors
        .map((doctor) => {
        // Ưu tiên dùng tọa độ riêng của bác sĩ, nếu không có thì dùng tọa độ phòng khám nơi bác sĩ làm việc
        const doctorLat = doctor.latitude ?? doctor.clinic?.latitude;
        const doctorLng = doctor.longitude ?? doctor.clinic?.longitude;
        if (doctorLat === undefined || doctorLat === null || doctorLng === undefined || doctorLng === null) {
            return { ...doctor, distance: null };
        }
        const distance = calculateDistance(lat, lng, doctorLat, doctorLng);
        return { ...doctor, distance };
    })
        .filter((doctor) => doctor.distance !== null && doctor.distance <= radiusKm)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    return results;
}
