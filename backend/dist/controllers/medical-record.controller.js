"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMyMedicalRecords = listMyMedicalRecords;
exports.getMyMedicalRecord = getMyMedicalRecord;
exports.listMyPrescriptions = listMyPrescriptions;
const medical_record_service_1 = require("../services/medical-record.service");
const apiError_1 = require("../utils/apiError");
async function listMyMedicalRecords(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId)
            throw new apiError_1.ApiError("Authentication required", 401);
        const records = await (0, medical_record_service_1.getUserMedicalRecords)(userId);
        res.json({ message: "Medical records retrieved", count: records.length, data: records });
    }
    catch (error) {
        next(error);
    }
}
async function getMyMedicalRecord(req, res, next) {
    try {
        const userId = req.user?.userId;
        const id = req.params.id;
        if (!userId)
            throw new apiError_1.ApiError("Authentication required", 401);
        const record = await (0, medical_record_service_1.getUserMedicalRecordById)(userId, id);
        res.json({ message: "Medical record retrieved", data: record });
    }
    catch (error) {
        next(error);
    }
}
async function listMyPrescriptions(req, res, next) {
    try {
        const userId = req.user?.userId;
        const medicalRecordId = req.params.medicalRecordId;
        if (!userId)
            throw new apiError_1.ApiError("Authentication required", 401);
        const prescriptions = await (0, medical_record_service_1.getPrescriptionsByRecordId)(userId, medicalRecordId);
        res.json({ message: "Prescriptions retrieved", count: prescriptions.length, data: prescriptions });
    }
    catch (error) {
        next(error);
    }
}
