import { Request, Response } from "express";
import { doctorCertificateService } from "../services/doctor-certificate.service";
import prisma from "../prisma/client";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { sendCertificateVerificationEmail } from "../utils/emailService";

async function getDoctorIdByUserId(userId: string): Promise<string | null> {
  const doctor = await prisma.doctor.findFirst({
    where: { userAccount: { id: userId } }
  });
  return doctor ? doctor.id : null;
}

export class DoctorCertificateController {
  async getCertificates(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;
      if (!userId) { res.status(401).json({ message: "Chưa xác thực." }); return; }

      const doctorId = await getDoctorIdByUserId(userId);
      if (!doctorId) { res.status(403).json({ message: "Không tìm thấy thông tin bác sĩ." }); return; }

      const certificates = await doctorCertificateService.getCertificates(doctorId);
      res.json({ message: "Success", certificates });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Lỗi server.";
      res.status(500).json({ message: msg });
    }
  }

  async createCertificate(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;
      if (!userId) { res.status(401).json({ message: "Chưa xác thực." }); return; }

      const doctorId = await getDoctorIdByUserId(userId);
      if (!doctorId) { res.status(403).json({ message: "Không tìm thấy thông tin bác sĩ." }); return; }

      const { title, issuer, issuedYear, expiryYear, description, type, certificateNumber } = req.body;
      const file = req.file;

      if (!title) { res.status(400).json({ message: "Tiêu đề chứng chỉ là bắt buộc." }); return; }

      const certificate = await doctorCertificateService.createCertificate(
        doctorId,
        {
          title,
          issuer,
          type: type || 'OTHER',
          certificateNumber: certificateNumber || undefined,
          issuedYear: issuedYear ? parseInt(issuedYear) : undefined,
          expiryYear: expiryYear ? parseInt(expiryYear) : undefined,
          description,
        },
        file
      );

      res.status(201).json({ message: "Đã thêm chứng chỉ thành công.", certificate });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Lỗi khi tạo chứng chỉ.";
      res.status(500).json({ message: msg });
    }
  }

  async updateCertificate(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;
      if (!userId) { res.status(401).json({ message: "Chưa xác thực." }); return; }

      const doctorId = await getDoctorIdByUserId(userId);
      if (!doctorId) { res.status(403).json({ message: "Không tìm thấy thông tin bác sĩ." }); return; }

      const certificateId = req.params.id as string;
      const { title, issuer, issuedYear, expiryYear, description, type, certificateNumber } = req.body;
      const file = req.file;

      const certificate = await doctorCertificateService.updateCertificate(
        certificateId,
        doctorId,
        {
          title,
          issuer,
          type: type || undefined,
          certificateNumber: certificateNumber || undefined,
          issuedYear: issuedYear ? parseInt(issuedYear) : undefined,
          expiryYear: expiryYear ? parseInt(expiryYear) : undefined,
          description,
          // Reset to PENDING when updated so admin reviews again
          verificationStatus: 'PENDING',
          rejectionReason: null,
          verifiedAt: null,
        },
        file
      );

      res.json({ message: "Đã cập nhật chứng chỉ thành công.", certificate });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Lỗi khi cập nhật chứng chỉ.";
      res.status(400).json({ message: msg });
    }
  }

  async deleteCertificate(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;
      if (!userId) { res.status(401).json({ message: "Chưa xác thực." }); return; }

      const doctorId = await getDoctorIdByUserId(userId);
      if (!doctorId) { res.status(403).json({ message: "Không tìm thấy thông tin bác sĩ." }); return; }

      const certificateId = req.params.id as string;
      await doctorCertificateService.deleteCertificate(certificateId, doctorId);

      res.json({ message: "Đã xóa chứng chỉ thành công." });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Lỗi khi xóa chứng chỉ.";
      res.status(400).json({ message: msg });
    }
  }

  // ─── ADMIN ENDPOINTS ────────────────────────────────────

  /**
   * GET /api/admin/certificates/pending
   * Admin: Get all PENDING certificates needing review
   */
  async getPendingCertificates(req: Request, res: Response): Promise<void> {
    try {
      const certificates = await prisma.doctorCertificate.findMany({
        where: { verificationStatus: 'PENDING' },
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              avatar: true,
              specialty: { select: { name: true } },
              userAccount: { select: { email: true } }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });
      res.json({ certificates });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Lỗi server.";
      res.status(500).json({ message: msg });
    }
  }

  /**
   * PUT /api/admin/certificates/:id/verify
   * Admin: Verify or reject a certificate
   * Body: { action: 'VERIFY' | 'REJECT', reason?: string }
   */
  async verifyCertificate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { action, reason } = req.body;

      if (!action || !['VERIFY', 'REJECT'].includes(action)) {
        res.status(400).json({ message: "action phải là VERIFY hoặc REJECT." });
        return;
      }

      if (action === 'REJECT' && !reason?.trim()) {
        res.status(400).json({ message: "Lý do từ chối là bắt buộc." });
        return;
      }

      const cert = await prisma.doctorCertificate.findUnique({
        where: { id: id as string },
        include: {
          doctor: {
            include: { userAccount: { select: { email: true, fullName: true } } }
          }
        }
      });

      if (!cert) { res.status(404).json({ message: "Không tìm thấy chứng chỉ." }); return; }

      const updated = await prisma.doctorCertificate.update({
        where: { id: id as string },
        data: {
          verificationStatus: action === 'VERIFY' ? 'VERIFIED' : 'REJECTED',
          rejectionReason: action === 'REJECT' ? reason : null,
          verifiedAt: action === 'VERIFY' ? new Date() : null,
        }
      });

      // Send email notification to doctor
      const doctorEmail = (cert as any).doctor.userAccount?.email;
      const doctorName = (cert as any).doctor.name || (cert as any).doctor.userAccount?.fullName || 'Bác sĩ';
      if (doctorEmail) {
        try {
          await sendCertificateVerificationEmail(
            doctorEmail,
            doctorName,
            cert.title,
            action === 'VERIFY' ? 'VERIFIED' : 'REJECTED',
            reason
          );
        } catch (emailErr) {
          console.error('Email notification failed:', emailErr);
          // Don't fail the request if email fails
        }
      }

      res.json({ message: action === 'VERIFY' ? "Đã xác minh chứng chỉ." : "Đã từ chối chứng chỉ.", certificate: updated });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Lỗi server.";
      res.status(500).json({ message: msg });
    }
  }
}

export const doctorCertificateController = new DoctorCertificateController();
