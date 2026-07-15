"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import { doctorCertificateService } from "@/services/doctor-certificate.service";
import { DoctorCertificate } from "@/types/doctor";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import toast from "react-hot-toast";
import { Plus, Trash2, Edit, FileText, UploadCloud, X, Award, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

interface Specialty { id: string; name: string; }
interface Clinic { id: string; name: string; }

interface DoctorProfileData {
  name: string;
  experience: number;
  avatar: string;
  specialtyId: string;
  clinicId: string;
  price: number;
  phone: string;
  description: string;
}

const CERTIFICATE_TYPES = [
  { value: 'MEDICAL_DEGREE', label: 'Bằng y khoa' },
  { value: 'PRACTICE_LICENSE', label: 'Chứng chỉ hành nghề' },
  { value: 'SPECIALTY', label: 'Chứng chỉ chuyên khoa' },
  { value: 'CLINIC_LICENSE', label: 'Giấy phép khám chữa bệnh' },
  { value: 'ACHIEVEMENT', label: 'Thành tích / Giải thưởng' },
  { value: 'OTHER', label: 'Khác' },
];

export default function DoctorProfilePage() {
  const { user } = useAuth();
  
  // === PROFILE STATE ===
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  
  const [formData, setFormData] = useState<DoctorProfileData>({
    name: "", experience: 0, avatar: "", specialtyId: "", clinicId: "", price: 0, phone: "", description: ""
  });

  // === CERTIFICATE STATE ===
  const [certificates, setCertificates] = useState<DoctorCertificate[]>([]);
  const [loadingCertificates, setLoadingCertificates] = useState(true);
  const [certError, setCertError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [type, setType] = useState('MEDICAL_DEGREE');
  const [title, setTitle] = useState("");
  const [issuer, setIssuer] = useState("");
  const [issuedYear, setIssuedYear] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [certificateNumber, setCertificateNumber] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submittingCert, setSubmittingCert] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletingCert, setDeletingCert] = useState(false);

  // === DATA FETCHING ===
  useEffect(() => {
    // Fetch Profile Independent of Certificates
    const fetchProfile = async () => {
      try {
        const [metaRes, profileRes] = await Promise.all([
          api.get("/doctor/metadata/options"),
          api.get("/doctor/profile")
        ]);
        
        setSpecialties(metaRes.data.specialties);
        setClinics(metaRes.data.clinics);
        
        const p = profileRes.data;
        setFormData({
          name: p.name || "",
          experience: p.experience || 0,
          avatar: p.avatar || "",
          specialtyId: p.specialtyId || "",
          clinicId: p.clinicId || "",
          price: p.price || 0,
          phone: p.phone || "",
          description: p.description || ""
        });
      } catch (err: any) {
        setProfileError("Không thể tải dữ liệu hồ sơ.");
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoadingCertificates(true);
      const data = await doctorCertificateService.getMyCertificates();
      setCertificates(data);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as any).response?.data?.message
        : "Lỗi tải danh sách chứng chỉ.";
      setCertError(msg || "Lỗi tải danh sách chứng chỉ.");
    } finally {
      setLoadingCertificates(false);
    }
  };

  // === PROFILE HANDLERS ===
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put("/doctor/profile", formData);
      toast.success("Cập nhật hồ sơ thành công!");
    } catch (err) {
      toast.error("Lỗi khi cập nhật hồ sơ");
    } finally {
      setSavingProfile(false);
    }
  };

  // === CERTIFICATE HANDLERS ===
  const handleOpenModal = (cert?: DoctorCertificate) => {
    if (cert) {
      setEditingId(cert.id);
      setType(cert.type || 'OTHER');
      setTitle(cert.title);
      setIssuer(cert.issuer || "");
      setIssuedYear(cert.issuedYear ? String(cert.issuedYear) : "");
      setExpiryYear(cert.expiryYear ? String(cert.expiryYear) : "");
      setCertificateNumber(cert.certificateNumber || "");
      setDescription(cert.description || "");
      setPreview(cert.imageUrl || cert.fileUrl || null);
    } else {
      setEditingId(null);
      setType('MEDICAL_DEGREE');
      setTitle("");
      setIssuer("");
      setIssuedYear("");
      setExpiryYear("");
      setCertificateNumber("");
      setDescription("");
      setPreview(null);
    }
    setFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (selectedFile.type.startsWith("image/")) {
        setPreview(URL.createObjectURL(selectedFile));
      } else {
        setPreview(null); // PDF won't show image preview
      }
    }
  };

  const handleCertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingCert(true);
      if (editingId) {
        await doctorCertificateService.updateCertificate(editingId, {
          title, type, issuer, certificateNumber, issuedYear, expiryYear, description, file: file || undefined,
        });
      } else {
        await doctorCertificateService.createCertificate({
          title, type, issuer, certificateNumber, issuedYear, expiryYear, description, file: file || undefined,
        });
      }
      toast.success(editingId ? "Đã cập nhật chứng chỉ" : "Đã thêm chứng chỉ mới");
      await fetchCertificates();
      handleCloseModal();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as any).response?.data?.message
        : "Lỗi lưu chứng chỉ.";
      toast.error(msg || "Lỗi lưu chứng chỉ.");
    } finally {
      setSubmittingCert(false);
    }
  };

  const handleDeleteCert = async () => {
    if (!deleteId) return;
    try {
      setDeletingCert(true);
      await doctorCertificateService.deleteCertificate(deleteId);
      toast.success("Đã xóa chứng chỉ");
      await fetchCertificates();
      setDeleteId(null);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as any).response?.data?.message
        : "Lỗi xóa chứng chỉ.";
      toast.error(msg || "Lỗi xóa chứng chỉ.");
    } finally {
      setDeletingCert(false);
    }
  };

  const renderStatusBadge = (status: string, reason?: string) => {
    switch (status) {
      case 'VERIFIED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5" /> Đã xác minh</span>;
      case 'REJECTED':
        return (
          <div className="flex flex-col items-end group relative cursor-help">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200"><AlertTriangle className="w-3.5 h-3.5" /> Từ chối</span>
            <div className="absolute hidden group-hover:block w-48 p-2 mt-8 bg-slate-800 text-white text-xs rounded-lg shadow-xl z-10 right-0">{reason || 'Bị từ chối, vui lòng cập nhật lại'}</div>
          </div>
        );
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200"><Clock className="w-3.5 h-3.5" /> Chờ duyệt</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* SECTION 1: HỒ SƠ CÁ NHÂN */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Hồ sơ cá nhân</h2>
          <p className="text-slate-500">Cập nhật thông tin công khai của bạn để bệnh nhân có thể tìm thấy.</p>
        </div>

        {loadingProfile ? (
          <div className="flex justify-center p-12 bg-white rounded-2xl shadow-sm border border-slate-100">
            <LoadingSpinner className="w-8 h-8 text-teal-600" />
          </div>
        ) : profileError ? (
          <Alert type="error" message={profileError} />
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                <div className="w-24 h-24 rounded-full bg-teal-100 overflow-hidden ring-4 ring-teal-50">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-teal-600 text-3xl font-bold">
                      {formData.name.charAt(0) || "D"}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    label="URL Ảnh đại diện"
                    id="avatar"
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleProfileChange}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Họ và Tên (kèm học hàm/học vị)"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleProfileChange}
                  required
                />
                <Input
                  label="Số điện thoại"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleProfileChange}
                  placeholder="0912345678"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-slate-700">Chuyên khoa</label>
                  <select
                    name="specialtyId"
                    value={formData.specialtyId}
                    onChange={handleProfileChange}
                    required
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
                  >
                    <option value="">-- Chọn chuyên khoa --</option>
                    {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-slate-700">Phòng khám / Bệnh viện</label>
                  <select
                    name="clinicId"
                    value={formData.clinicId}
                    onChange={handleProfileChange}
                    required
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
                  >
                    <option value="">-- Chọn phòng khám --</option>
                    {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Số năm kinh nghiệm"
                  id="experience"
                  name="experience"
                  type="number"
                  value={formData.experience}
                  onChange={handleProfileChange}
                  required
                />
                <Input
                  label="Giá khám (VNĐ)"
                  id="price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleProfileChange}
                  placeholder="Ví dụ: 300000"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700">Giới thiệu chi tiết</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleProfileChange}
                  rows={4}
                  placeholder="Quá trình công tác, kinh nghiệm chuyên môn..."
                  className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button type="submit" variant="teal" isLoading={savingProfile} className="px-8 py-3 rounded-xl font-bold">
                  Lưu thay đổi hồ sơ
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="w-full h-px bg-slate-200"></div>

      {/* SECTION 2: CHỨNG CHỈ BẰNG CẤP */}
      <div id="certificates" className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Chứng chỉ & Bằng cấp</h2>
            <p className="text-slate-500 mt-1">Cập nhật bằng cấp và chứng chỉ. Admin sẽ phê duyệt trước khi hiển thị công khai.</p>
          </div>
          <Button onClick={() => handleOpenModal()} variant="teal" className="rounded-xl flex items-center gap-2 shadow-md">
            <Plus className="h-4 w-4" />
            Thêm Chứng Chỉ
          </Button>
        </div>

        {loadingCertificates ? (
          <div className="flex justify-center p-12 bg-white rounded-2xl shadow-sm border border-slate-100">
             <LoadingSpinner className="w-8 h-8 text-teal-600" />
          </div>
        ) : certError ? (
          <Alert type="error" message={certError} />
        ) : certificates.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center flex flex-col items-center">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Award className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Chưa có chứng chỉ nào</h3>
            <p className="text-slate-500 text-sm mt-2 mb-6 max-w-md">
              Thêm chứng chỉ để tăng độ tin cậy với bệnh nhân và nhận huy hiệu "Bác sĩ đã xác minh".
            </p>
            <Button onClick={() => handleOpenModal()} variant="outline" className="rounded-xl">
              Thêm Chứng Chỉ Ngay
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <div key={cert.id} className={`bg-white border ${cert.verificationStatus === 'REJECTED' ? 'border-rose-300' : 'border-slate-200'} rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative`}>
                {cert.verificationStatus === 'REJECTED' && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 rounded-t-2xl"></div>
                )}
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] uppercase font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                          {CERTIFICATE_TYPES.find(t => t.value === cert.type)?.label || 'Khác'}
                        </span>
                        {renderStatusBadge(cert.verificationStatus, cert.rejectionReason)}
                      </div>
                      <h3 className="font-bold text-slate-800 text-base leading-snug line-clamp-2 mt-2" title={cert.title}>{cert.title}</h3>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {cert.certificateNumber && (
                      <p className="text-slate-600"><span className="text-slate-400">Số hiệu:</span> <span className="font-semibold text-slate-800">{cert.certificateNumber}</span></p>
                    )}
                    {cert.issuer && (
                      <p className="text-slate-600"><span className="text-slate-400">Nơi cấp:</span> <span className="font-medium text-slate-700">{cert.issuer}</span></p>
                    )}
                    {cert.issuedYear && (
                      <p className="text-slate-600">
                        <span className="text-slate-400">Năm cấp:</span> <span className="font-medium text-slate-700">{cert.issuedYear} {cert.expiryYear && `- ${cert.expiryYear}`}</span>
                      </p>
                    )}
                  </div>

                  {cert.verificationStatus === 'REJECTED' && cert.rejectionReason && (
                     <div className="bg-rose-50 p-2 rounded-lg text-xs text-rose-700 border border-rose-100">
                       <span className="font-bold">Lý do từ chối:</span> {cert.rejectionReason}
                     </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                  <Button onClick={() => handleOpenModal(cert)} variant="outline" className="flex-1 text-xs py-1.5 h-8">
                    {cert.verificationStatus === 'REJECTED' ? 'Cập nhật lại' : 'Chỉnh sửa'}
                  </Button>
                  <button onClick={() => setDeleteId(cert.id)} className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 rounded-lg transition-colors" title="Xóa">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl flex flex-col my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingId ? "Cập nhật chứng chỉ" : "Thêm chứng chỉ mới"}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCertSubmit} className="p-5 space-y-4">
              <Alert type="info" message="Chứng chỉ sẽ được lưu ở trạng thái Chờ duyệt. Admin sẽ kiểm tra số hiệu và hình ảnh trước khi xác minh." className="py-2 text-xs" />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Loại chứng chỉ *</label>
                  <select 
                    value={type} 
                    onChange={(e) => setType(e.target.value)} 
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white"
                  >
                    {CERTIFICATE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số hiệu chứng chỉ (nếu có)</label>
                  <input 
                    type="text" 
                    value={certificateNumber} 
                    onChange={(e) => setCertificateNumber(e.target.value)} 
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    placeholder="VD: 00123/HCM-CCHN"
                  />
                </div>
              </div>

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
              
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nơi cấp</label>
                  <input 
                    type="text" 
                    value={issuer} 
                    onChange={(e) => setIssuer(e.target.value)} 
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    placeholder="VD: ĐH Y Dược"
                  />
                </div>
                <div className="col-span-3 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Năm cấp</label>
                  <input 
                    type="number" 
                    value={issuedYear} 
                    onChange={(e) => setIssuedYear(e.target.value)} 
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    placeholder="VD: 2015"
                  />
                </div>
                <div className="col-span-3 sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Năm hết hạn</label>
                  <input 
                    type="number" 
                    value={expiryYear} 
                    onChange={(e) => setExpiryYear(e.target.value)} 
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    placeholder="VD: 2025"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả thêm (Không bắt buộc)</label>
                <textarea 
                  rows={2} 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-none"
                  placeholder="Thông tin thêm về chứng chỉ này..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ảnh chụp / File scan cứng *</label>
                {!preview ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-500"><span className="font-semibold text-teal-600">Nhấn để tải lên</span> ảnh chứng chỉ</p>
                      <p className="text-xs text-slate-400">Yêu cầu chụp rõ nét, không bị lóa</p>
                    </div>
                    <input type="file" required={!editingId && !preview} className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} />
                  </label>
                ) : (
                  <div className="relative rounded-xl border border-slate-200 overflow-hidden group h-40 bg-slate-100 flex items-center justify-center">
                    {preview.includes('pdf') || (!preview.startsWith('blob') && !preview.match(/\.(jpeg|jpg|gif|png)/i) && preview.includes('pdf')) ? (
                      <div className="text-center"><FileText className="w-12 h-12 text-rose-500 mx-auto mb-2"/> <p className="text-sm font-semibold">Tài liệu PDF</p></div>
                    ) : (
                      <img src={preview} alt="Preview" className="h-full object-contain" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <label className="bg-white text-slate-800 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer hover:bg-slate-50 shadow-lg">
                         Thay đổi ảnh
                         <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} />
                       </label>
                    </div>
                  </div>
                )}
                {file && (
                  <div className="mt-2 flex items-center justify-between text-xs text-teal-700 font-medium bg-teal-50 p-2 rounded-lg">
                    <span className="truncate">Đã chọn: {file.name}</span>
                    <button type="button" onClick={() => { setFile(null); setPreview(editingId ? certificates.find(c => c.id === editingId)?.imageUrl || null : null); }} className="text-teal-600 hover:text-teal-800"><X className="w-4 h-4"/></button>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <Button type="button" onClick={handleCloseModal} variant="outline" className="rounded-xl">Hủy</Button>
                <Button type="submit" variant="teal" className="rounded-xl" isLoading={submittingCert}>
                  {editingId ? "Cập nhật & Gửi duyệt" : "Thêm & Gửi duyệt"}
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
              <Button onClick={handleDeleteCert} variant="danger" className="rounded-xl w-full" isLoading={deletingCert}>Xóa bỏ</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
