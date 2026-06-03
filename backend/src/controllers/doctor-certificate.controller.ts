import { Request, Response } from "express";
import { doctorCertificateService } from "../services/doctor-certificate.service";

export class DoctorCertificateController {
  async getCertificates(req: Request, res: Response): Promise<void> {
    try {
      // req.user from auth middleware
      const doctorId = req.user?.doctorId;
      if (!doctorId) {
        res.status(403).json({ message: "Không tìm thấy thông tin bác sĩ." });
        return;
      }

      const certificates = await doctorCertificateService.getCertificates(doctorId);
      res.json({ message: "Success", certificates });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Lỗi server.";
      res.status(500).json({ message: msg });
    }
  }

  async createCertificate(req: Request, res: Response): Promise<void> {
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

      const certificate = await doctorCertificateService.createCertificate(
        doctorId,
        {
          title,
          issuer,
          issuedYear: issuedYear ? parseInt(issuedYear) : undefined,
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
      const doctorId = req.user?.doctorId;
      if (!doctorId) {
        res.status(403).json({ message: "Không tìm thấy thông tin bác sĩ." });
        return;
      }

      const certificateId = req.params.id;
      const { title, issuer, issuedYear, description } = req.body;
      const file = req.file;

      const certificate = await doctorCertificateService.updateCertificate(
        certificateId,
        doctorId,
        {
          title,
          issuer,
          issuedYear: issuedYear ? parseInt(issuedYear) : undefined,
          description,
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
      const doctorId = req.user?.doctorId;
      if (!doctorId) {
        res.status(403).json({ message: "Không tìm thấy thông tin bác sĩ." });
        return;
      }

      const certificateId = req.params.id;
      await doctorCertificateService.deleteCertificate(certificateId, doctorId);

      res.json({ message: "Đã xóa chứng chỉ thành công." });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Lỗi khi xóa chứng chỉ.";
      res.status(400).json({ message: msg });
    }
  }
}

export const doctorCertificateController = new DoctorCertificateController();
