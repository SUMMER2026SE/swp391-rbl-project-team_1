import { PrismaClient } from "@prisma/client";
import { supabase } from "../config/supabase";

const prisma = new PrismaClient();

export class DoctorCertificateService {
  /**
   * Get all certificates for a doctor
   */
  async getCertificates(doctorId: string) {
    const certificates = await prisma.doctorCertificate.findMany({
      where: { doctorId },
      orderBy: { createdAt: "desc" },
    });
    return certificates;
  }

  /**
   * Create a new certificate
   */
  async createCertificate(
    doctorId: string,
    data: {
      title: string;
      issuer?: string;
      issuedYear?: number;
      expiryYear?: number;
      description?: string;
      type?: string;
      certificateNumber?: string;
    },
    file?: Express.Multer.File
  ) {
    let imageUrl: string | null = null;
    let fileUrl: string | null = null;

    if (file) {
      const { url, isPdf } = await this.uploadToSupabase(file, doctorId);
      if (isPdf) { fileUrl = url; } else { imageUrl = url; }
    }

    const certificate = await prisma.doctorCertificate.create({
      data: {
        doctorId,
        title: data.title,
        type: (data.type as any) || 'OTHER',
        issuer: data.issuer || null,
        issuedYear: data.issuedYear || null,
        expiryYear: data.expiryYear || null,
        certificateNumber: data.certificateNumber || null,
        description: data.description || null,
        imageUrl,
        fileUrl,
        verificationStatus: 'PENDING',
      },
    });

    return certificate;
  }

  /**
   * Update an existing certificate
   */
  async updateCertificate(
    certificateId: string,
    doctorId: string,
    data: {
      title?: string;
      issuer?: string;
      issuedYear?: number;
      expiryYear?: number;
      description?: string;
      type?: string;
      certificateNumber?: string;
      verificationStatus?: string;
      rejectionReason?: string | null;
      verifiedAt?: Date | null;
    },
    file?: Express.Multer.File
  ) {
    const existing = await prisma.doctorCertificate.findUnique({ where: { id: certificateId } });
    if (!existing || existing.doctorId !== doctorId) {
      throw new Error("Chứng chỉ không tồn tại hoặc bạn không có quyền sửa.");
    }

    let imageUrl = existing.imageUrl;
    let fileUrl = existing.fileUrl;

    if (file) {
      const { url, isPdf } = await this.uploadToSupabase(file, doctorId);
      if (isPdf) { fileUrl = url; imageUrl = null; } else { imageUrl = url; fileUrl = null; }
    }

    const updated = await prisma.doctorCertificate.update({
      where: { id: certificateId },
      data: {
        title: data.title !== undefined ? data.title : existing.title,
        type: data.type !== undefined ? (data.type as any) : existing.type,
        issuer: data.issuer !== undefined ? data.issuer : existing.issuer,
        issuedYear: data.issuedYear !== undefined ? data.issuedYear : existing.issuedYear,
        expiryYear: data.expiryYear !== undefined ? data.expiryYear : existing.expiryYear,
        certificateNumber: data.certificateNumber !== undefined ? data.certificateNumber : existing.certificateNumber,
        description: data.description !== undefined ? data.description : existing.description,
        verificationStatus: data.verificationStatus !== undefined ? (data.verificationStatus as any) : existing.verificationStatus,
        rejectionReason: data.rejectionReason !== undefined ? data.rejectionReason : existing.rejectionReason,
        verifiedAt: data.verifiedAt !== undefined ? data.verifiedAt : existing.verifiedAt,
        imageUrl,
        fileUrl,
      },
    });

    return updated;
  }

  /**
   * Delete a certificate
   */
  async deleteCertificate(certificateId: string, doctorId: string) {
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
  private async uploadToSupabase(file: Express.Multer.File, doctorId: string) {
    const isPdf = file.mimetype === "application/pdf";
    const extension = isPdf ? "pdf" : file.mimetype.split("/")[1] || "jpg";
    const fileName = `${doctorId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

    const { data, error } = await supabase.storage
      .from("doctor-certificates")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error("Supabase Upload Error:", error);
      throw new Error("Lỗi khi tải file lên Supabase Storage.");
    }

    const { data: publicUrlData } = supabase.storage
      .from("doctor-certificates")
      .getPublicUrl(fileName);

    return {
      url: publicUrlData.publicUrl,
      isPdf,
    };
  }
}

export const doctorCertificateService = new DoctorCertificateService();
