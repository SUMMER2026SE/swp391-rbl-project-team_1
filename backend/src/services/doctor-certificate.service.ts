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
      description?: string;
    },
    file?: Express.Multer.File
  ) {
    let imageUrl: string | null = null;
    let fileUrl: string | null = null;

    if (file) {
      const { url, isPdf } = await this.uploadToSupabase(file, doctorId);
      if (isPdf) {
        fileUrl = url;
      } else {
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
  async updateCertificate(
    certificateId: string,
    doctorId: string,
    data: {
      title?: string;
      issuer?: string;
      issuedYear?: number;
      description?: string;
    },
    file?: Express.Multer.File
  ) {
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
      } else {
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
