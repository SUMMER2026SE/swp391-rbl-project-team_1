"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doctorCertificateService = exports.DoctorCertificateService = void 0;
const client_1 = require("@prisma/client");
const supabase_1 = require("../config/supabase");
const prisma = new client_1.PrismaClient();
class DoctorCertificateService {
    /**
     * Get all certificates for a doctor
     */
    async getCertificates(doctorId) {
        const certificates = await prisma.doctorCertificate.findMany({
            where: { doctorId },
            orderBy: { createdAt: "desc" },
        });
        return certificates;
    }
    /**
     * Create a new certificate
     */
    async createCertificate(doctorId, data, file) {
        let imageUrl = null;
        let fileUrl = null;
        if (file) {
            const { url, isPdf } = await this.uploadToSupabase(file, doctorId);
            if (isPdf) {
                fileUrl = url;
            }
            else {
                imageUrl = url;
            }
        }
        const certificate = await prisma.doctorCertificate.create({
            data: {
                doctorId,
                title: data.title,
                issuer: data.issuer || null,
                issuedYear: data.issuedYear || null,
                description: data.description || null,
                imageUrl,
                fileUrl,
            },
        });
        return certificate;
    }
    /**
     * Update an existing certificate
     */
    async updateCertificate(certificateId, doctorId, data, file) {
        // Verify ownership
        const existing = await prisma.doctorCertificate.findUnique({
            where: { id: certificateId },
        });
        if (!existing || existing.doctorId !== doctorId) {
            throw new Error("Chứng chỉ không tồn tại hoặc bạn không có quyền sửa.");
        }
        let imageUrl = existing.imageUrl;
        let fileUrl = existing.fileUrl;
        if (file) {
            const { url, isPdf } = await this.uploadToSupabase(file, doctorId);
            if (isPdf) {
                fileUrl = url;
                imageUrl = null; // If changing file type, reset the other
            }
            else {
                imageUrl = url;
                fileUrl = null;
            }
        }
        const updated = await prisma.doctorCertificate.update({
            where: { id: certificateId },
            data: {
                title: data.title !== undefined ? data.title : existing.title,
                issuer: data.issuer !== undefined ? data.issuer : existing.issuer,
                issuedYear: data.issuedYear !== undefined ? data.issuedYear : existing.issuedYear,
                description: data.description !== undefined ? data.description : existing.description,
                imageUrl,
                fileUrl,
            },
        });
        return updated;
    }
    /**
     * Delete a certificate
     */
    async deleteCertificate(certificateId, doctorId) {
        const existing = await prisma.doctorCertificate.findUnique({
            where: { id: certificateId },
        });
        if (!existing || existing.doctorId !== doctorId) {
            throw new Error("Chứng chỉ không tồn tại hoặc bạn không có quyền xóa.");
        }
        await prisma.doctorCertificate.delete({
            where: { id: certificateId },
        });
        return true;
    }
    /**
     * Helper to upload to Supabase Storage
     */
    async uploadToSupabase(file, doctorId) {
        const isPdf = file.mimetype === "application/pdf";
        const extension = isPdf ? "pdf" : file.mimetype.split("/")[1] || "jpg";
        const fileName = `${doctorId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
        const { data, error } = await supabase_1.supabase.storage
            .from("doctor-certificates")
            .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
        });
        if (error) {
            console.error("Supabase Upload Error:", error);
            throw new Error("Lỗi khi tải file lên Supabase Storage.");
        }
        const { data: publicUrlData } = supabase_1.supabase.storage
            .from("doctor-certificates")
            .getPublicUrl(fileName);
        return {
            url: publicUrlData.publicUrl,
            isPdf,
        };
    }
}
exports.DoctorCertificateService = DoctorCertificateService;
exports.doctorCertificateService = new DoctorCertificateService();
