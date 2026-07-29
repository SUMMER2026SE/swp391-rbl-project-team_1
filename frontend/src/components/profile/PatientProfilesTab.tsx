"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { bookingProfileService, BookingProfile } from "@/services/booking-profile.service";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import { Plus, Edit2, Trash2, UserCircle2, User as UserIcon, AlertCircle } from "lucide-react";

export default function PatientProfilesTab() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<BookingProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Mối quan hệ dựa theo bảng form
  const RELATIONSHIP_OPTIONS = ["Bố", "Mẹ", "Vợ", "Chồng", "Con", "Anh trai", "Chị gái", "Khác"];
  const GENDER_OPTIONS = [
    { value: "NAM", label: "Nam" },
    { value: "NU", label: "Nữ" },
    { value: "KHAC", label: "Khác" }
  ];

  const [formData, setFormData] = useState<Partial<BookingProfile>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // === VALIDATION ===
  const validateProfileForm = (data: Partial<BookingProfile>): Record<string, string> => {
    const errors: Record<string, string> = {};

    const nameVal = (data.fullName || "").trim();
    if (!nameVal) {
      errors.fullName = "Họ và tên không được để trống.";
    }

    const phoneVal = (data.phone || "").trim();
    if (!phoneVal) {
      errors.phone = "Số điện thoại không được để trống.";
    } else if (!/^0[0-9]{9}$/.test(phoneVal)) {
      errors.phone = "Số điện thoại phải có đúng 10 chữ số và bắt đầu bằng số 0.";
    }

    if (!data.dateOfBirth) {
      errors.dateOfBirth = "Vui lòng nhập năm sinh.";
    } else {
      const year = parseInt(data.dateOfBirth, 10);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1900 || year > currentYear) {
        errors.dateOfBirth = "Năm sinh không hợp lệ.";
      }
    }

    if (!data.gender) {
      errors.gender = "Vui lòng chọn giới tính.";
    }

    if (!data.relationship) {
      errors.relationship = "Vui lòng chọn mối quan hệ.";
    }

    return errors;
  };

  useEffect(() => { fetchProfiles(); }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const data = await bookingProfileService.getMyProfiles();
      setProfiles(data);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách hồ sơ.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (profile?: BookingProfile) => {
    if (profile) {
      setEditingId(profile.id);
      let yearOnly = "";
      if (profile.dateOfBirth) {
        // If it's a full date, extract year
        yearOnly = new Date(profile.dateOfBirth).getFullYear().toString();
        if (isNaN(parseInt(yearOnly))) yearOnly = profile.dateOfBirth;
      }
      setFormData({
        ...profile,
        dateOfBirth: yearOnly
      });
    } else { 
      setEditingId(null); 
      setFormData({}); 
    }
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false); setEditingId(null); setFormData({}); setFormErrors({});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateProfileForm(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    
    try {
      setSubmitting(true);
      
      // Chuyển năm sinh thành ISO string date (January 1st of that year)
      const yearOfBirth = formData.dateOfBirth || "";
      const dateOfBirthIso = `${yearOfBirth}-01-01T00:00:00.000Z`;

      const payload = {
        ...formData,
        dateOfBirth: dateOfBirthIso
      };

      if (editingId) await bookingProfileService.updateProfile(editingId, payload);
      else await bookingProfileService.createProfile(payload);
      
      handleCloseForm();
      fetchProfiles();
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi khi lưu hồ sơ.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa hồ sơ này?")) return;
    try { await bookingProfileService.deleteProfile(id); fetchProfiles(); }
    catch (err: any) { alert(err.message || "Không thể xóa hồ sơ này."); }
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  const fc = (field: string) =>
    `w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${
      formErrors[field]
        ? "border-red-300 focus:ring-red-500/20"
        : "border-slate-200 focus:ring-teal-500/20 focus:border-teal-500"
    }`;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-slate-100 gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-teal-600" />
            <span>Hồ sơ người khám (Dành cho người thân)</span>
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Lưu sẵn thông tin để đặt khám nhanh hơn
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${profiles.length >= 10 ? "bg-orange-100 text-orange-700" : "bg-teal-50 text-teal-700 border border-teal-100"}`}>
            {profiles.length}/10 hồ sơ
          </span>
          <Button
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 py-2 px-4 shadow-sm"
            disabled={profiles.length >= 10}
            title={profiles.length >= 10 ? "Đã đạt tối đa 10 hồ sơ" : ""}
          >
            <Plus className="w-4 h-4" /> Thêm hồ sơ
          </Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} className="mb-6" />}

      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCloseForm} />
          
          <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? "Cập nhật thông tin" : "Thêm hồ sơ người thân"}
              </h2>
              <button onClick={handleCloseForm} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                ✕
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 text-sm mb-5">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
                <p>Thông tin người đi khám cần trùng khớp với giấy tờ tùy thân (CCCD/CMND/BHYT) để thuận tiện cho việc làm thủ tục tại bệnh viện.</p>
              </div>

              <form id="profile-form" onSubmit={handleSave} className="space-y-4" noValidate>
                {/* Họ và tên */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Họ và tên (như trên CCCD) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName || ""}
                    placeholder="VD: NGUYEN VAN A"
                    onChange={e => { setFormData({...formData, fullName: e.target.value}); setFormErrors(p => ({...p, fullName: ""})); }}
                    className={fc("fullName")}
                  />
                  {formErrors.fullName && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{formErrors.fullName}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Số điện thoại */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone || ""}
                      placeholder="0987654321"
                      maxLength={10}
                      onChange={e => { const v = e.target.value.replace(/[^0-9]/g,""); setFormData({...formData, phone: v}); setFormErrors(p => ({...p, phone: ""})); }}
                      className={fc("phone")}
                    />
                    {formErrors.phone && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{formErrors.phone}</p>}
                  </div>

                  {/* Năm sinh */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Năm sinh <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.dateOfBirth || ""}
                      placeholder="VD: 1990"
                      maxLength={4}
                      onChange={e => { const v = e.target.value.replace(/[^0-9]/g,""); setFormData({...formData, dateOfBirth: v}); setFormErrors(p => ({...p, dateOfBirth: ""})); }}
                      className={fc("dateOfBirth")}
                    />
                    {formErrors.dateOfBirth && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{formErrors.dateOfBirth}</p>}
                  </div>
                </div>

                {/* Giới tính */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Giới tính <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    {GENDER_OPTIONS.map((g) => (
                      <label key={g.value} className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${
                        formData.gender === g.value
                          ? 'border-teal-600 bg-teal-50 text-teal-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      } ${formErrors.gender ? 'border-red-300' : ''}`}>
                        <input
                          type="radio"
                          name="gender"
                          value={g.value}
                          checked={formData.gender === g.value}
                          onChange={(e) => {
                            setFormData({...formData, gender: e.target.value});
                            setFormErrors(p => ({...p, gender: ""}));
                          }}
                          className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-slate-300"
                        />
                        <span className="text-sm font-medium">{g.label}</span>
                      </label>
                    ))}
                  </div>
                  {formErrors.gender && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{formErrors.gender}</p>}
                </div>

                {/* Mối quan hệ */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Mối quan hệ với bạn <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {RELATIONSHIP_OPTIONS.map((rel) => (
                      <button
                        key={rel}
                        type="button"
                        onClick={() => {
                          setFormData({...formData, relationship: rel});
                          setFormErrors(p => ({...p, relationship: ""}));
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                          formData.relationship === rel
                            ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-teal-400 hover:text-teal-600'
                        }`}
                      >
                        {rel}
                      </button>
                    ))}
                  </div>
                  {formErrors.relationship && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{formErrors.relationship}</p>}
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleCloseForm} className="px-6 rounded-xl border-slate-200">
                Hủy
              </Button>
              <Button form="profile-form" type="submit" isLoading={submitting} className="px-8 rounded-xl shadow-lg shadow-teal-600/20">
                Xác nhận
              </Button>
            </div>
          </div>
        </div>
      )}

      {profiles.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 border border-slate-100 border-dashed rounded-2xl">
          <UserCircle2 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-700">Chưa có hồ sơ người thân</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-5">Thêm thông tin người thân để đặt lịch khám cho bố mẹ, con cái hoặc vợ/chồng nhanh chóng hơn.</p>
          <Button onClick={() => handleOpenForm()} variant="outline" className="rounded-full shadow-sm text-sm">
            <Plus className="w-4 h-4 mr-1.5" /> Thêm hồ sơ đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profiles.map(p => (
            <div key={p.id} className="relative group bg-white border border-slate-200 rounded-2xl p-5 hover:border-teal-300 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-lg">
                    {p.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 leading-tight">{p.fullName}</h4>
                    <span className="text-xs text-slate-500 font-medium">
                      Mối quan hệ: <span className="text-teal-600 font-bold">{p.relationship}</span>
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenForm(p)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-y-2 mt-4 pt-4 border-t border-slate-100 text-sm">
                <div>
                  <span className="text-slate-500 text-xs block mb-0.5">Số điện thoại</span>
                  <span className="font-medium text-slate-700">{p.phone || "---"}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block mb-0.5">Năm sinh</span>
                  <span className="font-medium text-slate-700">
                    {p.dateOfBirth ? new Date(p.dateOfBirth).getFullYear() : "---"}
                  </span>
                </div>
                <div className="col-span-2 mt-1">
                  <span className="text-slate-500 text-xs block mb-0.5">Giới tính</span>
                  <span className="font-medium text-slate-700">
                    {p.gender === 'NAM' ? 'Nam' : p.gender === 'NU' ? 'Nữ' : p.gender === 'KHAC' ? 'Khác' : '---'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
