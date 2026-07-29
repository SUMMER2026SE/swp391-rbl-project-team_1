import api from "./api";
import { DoctorCertificate } from "@/types/doctor";

export const doctorCertificateService = {
  async getMyCertificates(): Promise<DoctorCertificate[]> {
    const response = await api.get("/doctor/certificates");
    return response.data.certificates;
  },

  async createCertificate(data: {
    title: string;
    type: string;
    issuer?: string;
    issuedYear?: string;
    expiryYear?: string;
    certificateNumber?: string;
    description?: string;
    file?: File;
  }): Promise<DoctorCertificate> {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("type", data.type);
    if (data.issuer) formData.append("issuer", data.issuer);
    if (data.issuedYear) formData.append("issuedYear", data.issuedYear);
    if (data.expiryYear) formData.append("expiryYear", data.expiryYear);
    if (data.certificateNumber) formData.append("certificateNumber", data.certificateNumber);
    if (data.description) formData.append("description", data.description);
    if (data.file) formData.append("file", data.file);

    const response = await api.post("/doctor/certificates", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.certificate;
  },

  async updateCertificate(
    id: string,
    data: {
      title?: string;
      type?: string;
      issuer?: string;
      issuedYear?: string;
      expiryYear?: string;
      certificateNumber?: string;
      description?: string;
      file?: File;
    }
  ): Promise<DoctorCertificate> {
    const formData = new FormData();
    if (data.title) formData.append("title", data.title);
    if (data.type) formData.append("type", data.type);
    if (data.issuer) formData.append("issuer", data.issuer);
    if (data.issuedYear) formData.append("issuedYear", data.issuedYear);
    if (data.expiryYear) formData.append("expiryYear", data.expiryYear);
    if (data.certificateNumber) formData.append("certificateNumber", data.certificateNumber);
    if (data.description) formData.append("description", data.description);
    if (data.file) formData.append("file", data.file);

    const response = await api.put(`/doctor/certificates/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.certificate;
  },

  async deleteCertificate(id: string): Promise<void> {
    await api.delete(`/doctor/certificates/${id}`);
  },
};
