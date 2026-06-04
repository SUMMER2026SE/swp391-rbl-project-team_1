"use client";

import React, { useEffect, useState } from "react";
import { DoctorCertificate } from "@/types/doctor";
import { doctorCertificateService } from "@/services/doctor-certificate.service";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import { Plus, Trash2, Edit, FileText, Image as ImageIcon, UploadCloud, X } from "lucide-react";

export default function DoctorCertificatesPage() {
  const [certificates, setCertificates] = useState<DoctorCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [title, setTitle] = useState("");
  const [issuer, setIssuer] = useState("");
  const [issuedYear, setIssuedYear] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const data = await doctorCertificateService.getMyCertificates();
      setCertificates(data);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as any).response?.data?.message
        : "Lỗi tải danh sách chứng chỉ.";
      setError(msg || "Lỗi tải danh sách chứng chỉ.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cert?: DoctorCertificate) => {
    if (cert) {
      setEditingId(cert.id);
      setTitle(cert.title);
      setIssuer(cert.issuer || "");
      setIssuedYear(cert.issuedYear ? String(cert.issuedYear) : "");
      setDescription(cert.description || "");
      setPreview(cert.imageUrl || cert.fileUrl || null);
    } else {
      setEditingId(null);
      setTitle("");
      setIssuer("");
      setIssuedYear("");
      setDescription("");
      setPreview(null);
    }
    setFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (selectedFile.type.startsWith("image/")) {
        setPreview(URL.createObjectURL(selectedFile));
      } else {
        setPreview(null); // PDF won't show image preview in simple img tag easily without extra logic
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingId) {
        await doctorCertificateService.updateCertificate(editingId, {
          title,
          issuer,
          issuedYear,
          description,
          file: file || undefined,
        });
      } else {
        await doctorCertificateService.createCertificate({
          title,
          issuer,
          issuedYear,
          description,
          file: file || undefined,
        });
      }
      await fetchCertificates();
      handleCloseModal();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as any).response?.data?.message
        : "Lỗi lưu chứng chỉ.";
      alert(msg || "Lỗi lưu chứng chỉ.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await doctorCertificateService.deleteCertificate(deleteId);
      await fetchCertificates();
      setDeleteId(null);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as any).response?.data?.message
        : "Lỗi xóa chứng chỉ.";
      alert(msg || "Lỗi xóa chứng chỉ.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner className="mx-auto mt-20" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Chứng chỉ</h1>
          <p className="text-slate-500 text-sm mt-1">Cập nhật bằng cấp, chứng chỉ và giải thưởng của bạn.</p>
        </div>
        <Button onClick={() => handleOpenModal()} variant="teal" className="rounded-xl flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Thêm Chứng Chỉ
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}

      {certificates.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center flex flex-col items-center">
          <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Award className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Chưa có chứng chỉ nào</h3>
          <p className="text-slate-500 text-sm mt-2 mb-6 max-w-md">
            Thêm các bằng cấp y khoa và chứng chỉ hành nghề để tăng mức độ tin cậy đối với bệnh nhân.
          </p>
          <Button onClick={() => handleOpenModal()} variant="outline" className="rounded-xl">
            Thêm Chứng Chỉ Ngay
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <div key={cert.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[140px]">
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-bold text-slate-800 text-base leading-snug line-clamp-2" title={cert.title}>{cert.title}</h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleOpenModal(cert)} className="p-1.5 hover:bg-teal-50 text-slate-500 hover:text-teal-600 rounded-lg transition-colors" title="Chỉnh sửa">
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteId(cert.id)} className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors" title="Xóa">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs">
                  {cert.issuer && (
                    <p className="text-slate-600">
                      <span className="text-slate-400">Nơi cấp:</span> <span className="font-medium text-slate-700">{cert.issuer}</span>
                    </p>
                  )}
                  {cert.issuedYear && (
                    <p className="text-slate-600">
                      <span className="text-slate-400">Năm cấp:</span> <span className="font-medium text-slate-700">{cert.issuedYear}</span>
                    </p>
                  )}
                  {cert.description && (
                    <p className="text-slate-500 italic mt-2 border-l-2 border-slate-100 pl-2 text-[11px] line-clamp-2">
                      {cert.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingId ? "Cập nhật chứng chỉ" : "Thêm chứng chỉ mới"}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên chứng chỉ / Bằng cấp *</label>
                <input 
                  required 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  placeholder="Ví dụ: Bằng Bác sĩ Đa khoa"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nơi cấp</label>
                  <input 
                    type="text" 
                    value={issuer} 
                    onChange={(e) => setIssuer(e.target.value)} 
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    placeholder="Ví dụ: ĐH Y Dược TP.HCM"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Năm cấp</label>
                  <input 
                    type="number" 
                    value={issuedYear} 
                    onChange={(e) => setIssuedYear(e.target.value)} 
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    placeholder="Ví dụ: 2015"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả thêm (Không bắt buộc)</label>
                <textarea 
                  rows={3} 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none"
                  placeholder="Thông tin thêm về chứng chỉ này..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ảnh / File đính kèm</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-500"><span className="font-semibold text-teal-600">Nhấn để tải lên</span> hoặc kéo thả</p>
                    <p className="text-xs text-slate-400">PNG, JPG, PDF (MAX. 5MB)</p>
                  </div>
                  <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} />
                </label>
                {(file || preview) && (
                  <div className="mt-3 text-xs text-teal-700 font-medium bg-teal-50 p-2 rounded-lg break-all">
                    Đã chọn: {file ? file.name : "File hiện tại trên hệ thống"}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <Button type="button" onClick={handleCloseModal} variant="outline" className="rounded-xl">Hủy</Button>
                <Button type="submit" variant="teal" className="rounded-xl" isLoading={submitting}>
                  {editingId ? "Cập nhật" : "Thêm mới"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Xóa chứng chỉ?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Bạn có chắc chắn muốn xóa chứng chỉ này không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => setDeleteId(null)} variant="outline" className="rounded-xl w-full">Hủy</Button>
              <Button onClick={handleDelete} variant="danger" className="rounded-xl w-full" isLoading={deleting}>Xóa bỏ</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Icon Award component mock
function Award(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" />
      <circle cx="12" cy="8" r="6" />
    </svg>
  );
}
