"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doctorCertificateController = exports.DoctorCertificateController = void 0;
const doctor_certificate_service_1 = require("../services/doctor-certificate.service");
class DoctorCertificateController {
    async getCertificates(req, res) {
        try {
            // req.user from auth middleware
            const doctorId = req.user?.doctorId;
            if (!doctorId) {
                res.status(403).json({ message: "Không tìm thấy thông tin bác sĩ." });
                return;
            }
            const certificates = await doctor_certificate_service_1.doctorCertificateService.getCertificates(doctorId);
            res.json({ message: "Success", certificates });
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : "Lỗi server.";
            res.status(500).json({ message: msg });
        }
    }
    async createCertificate(req, res) {
        try {
            const doctorId = req.user?.doctorId;
            if (!doctorId) {
                res.status(403).json({ message: "Không tìm thấy thông tin bác sĩ." });
                return;
            }
            const { title, issuer, issuedYear, description } = req.body;
            const file = req.file;
            if (!title) {
                res.status(400).json({ message: "Tiêu đề chứng chỉ là bắt buộc." });
                return;
            }
            const certificate = await doctor_certificate_service_1.doctorCertificateService.createCertificate(doctorId, {
                title,
                issuer,
                issuedYear: issuedYear ? parseInt(issuedYear) : undefined,
                description,
            }, file);
            res.status(201).json({ message: "Đã thêm chứng chỉ thành công.", certificate });
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : "Lỗi khi tạo chứng chỉ.";
            res.status(500).json({ message: msg });
        }
    }
    async updateCertificate(req, res) {
        try {
            const doctorId = req.user?.doctorId;
            if (!doctorId) {
                res.status(403).json({ message: "Không tìm thấy thông tin bác sĩ." });
                return;
            }
            const certificateId = req.params.id;
            const { title, issuer, issuedYear, description } = req.body;
            const file = req.file;
            const certificate = await doctor_certificate_service_1.doctorCertificateService.updateCertificate(certificateId, doctorId, {
                title,
                issuer,
                issuedYear: issuedYear ? parseInt(issuedYear) : undefined,
                description,
            }, file);
            res.json({ message: "Đã cập nhật chứng chỉ thành công.", certificate });
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : "Lỗi khi cập nhật chứng chỉ.";
            res.status(400).json({ message: msg });
        }
    }
    async deleteCertificate(req, res) {
        try {
            const doctorId = req.user?.doctorId;
            if (!doctorId) {
                res.status(403).json({ message: "Không tìm thấy thông tin bác sĩ." });
                return;
            }
            const certificateId = req.params.id;
            await doctor_certificate_service_1.doctorCertificateService.deleteCertificate(certificateId, doctorId);
            res.json({ message: "Đã xóa chứng chỉ thành công." });
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : "Lỗi khi xóa chứng chỉ.";
            res.status(400).json({ message: msg });
        }
    }
}
exports.DoctorCertificateController = DoctorCertificateController;
exports.doctorCertificateController = new DoctorCertificateController();
